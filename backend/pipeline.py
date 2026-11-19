"""
FIRSTSTEP pipeline: scrape -> dedupe -> AI-tag (Gemini) -> upsert (Supabase) -> purge.

Run:  python pipeline.py            (reads backend/.env or real env vars)
      python pipeline.py --dry-run  (scrape + tag, print, no DB writes)

Required env:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Callable, Iterable
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

try:  # optional locally; GitHub Actions passes real env vars
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover
    pass

log = logging.getLogger("firststep")

# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
}
RATE_LIMIT_SECONDS = 2          # polite delay between every HTTP request
REQUEST_TIMEOUT = 20
# Models are tried in order; if one is overloaded (503) or out of quota (429) we fall back to the next.
# Override with GEMINI_MODELS="model-a,model-b" in .env.
GEMINI_MODELS = [m.strip() for m in os.environ.get("GEMINI_MODELS", "gemini-3.8-flash,gemini-2.5-flash").split(",") if m.strip()]
BATCH_SIZE = 10                 # jobs per Gemini request (free tier limits requests/day, not tokens)
GEMINI_DELAY_SECONDS = 6        # pause between batches
MAX_NEW_JOBS_PER_RUN = 300      # hard cap on jobs tagged per run (300 jobs = ~30 batched requests)
SERVER_RETRY_WAITS = (10, 30, 60)  # backoff for 500/503 before moving to the next model
BATCH_DESCRIPTION_CHARS = 700   # per-job description sent to the LLM (keeps requests small)
RETENTION_DAYS = 14
DESCRIPTION_CHAR_LIMIT = 4000   # what we store / send to the LLM

VALID_MODES = {"Remote", "Hybrid", "On-site"}
VALID_TYPES = {"Internship", "Full-Time"}


@dataclass
class RawJob:
    source_url: str
    title: str
    company: str
    description: str
    portal: str
    hint_type: str | None = None   # "Internship" / "Full-Time" if the page tells us
    hint_location: str | None = None
    posted_at: datetime | None = None  # real posting date from the portal, if known (UTC)
    extra: dict = field(default_factory=dict)


# --------------------------------------------------------------------------- #
# HTTP helper
# --------------------------------------------------------------------------- #
_session = requests.Session()
_session.headers.update(HEADERS)


def fetch(url: str, *, params: dict | None = None, as_json: bool = False):
    """GET with rate limiting. Returns text/JSON, or None on any failure."""
    time.sleep(RATE_LIMIT_SECONDS)
    try:
        resp = _session.get(url, params=params, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp.json() if as_json else resp.text
    except (requests.RequestException, ValueError) as exc:
        log.warning("fetch failed %s: %s", url, exc)
        return None


def clean(text: str | None) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


# --------------------------------------------------------------------------- #
# Posting-date parsing
# --------------------------------------------------------------------------- #
_AGE_RE = re.compile(
    r"\b(just now|yesterday|few (?:minutes?|hours?) ago|an? (?:minute|hour|day|week|month) ago|"
    r"(\d+)\s*(minute|hour|day|week|month)s?\s+ago)\b",
    re.I,
)
_UNIT_DAYS = {"minute": 1 / 1440, "hour": 1 / 24, "day": 1, "week": 7, "month": 30}


def parse_relative_age(text: str, now: datetime | None = None) -> datetime | None:
    """'3 days ago', '2 weeks ago', 'Just now', 'Yesterday' -> approximate UTC datetime. None if not found."""
    now = now or datetime.now(timezone.utc)
    m = _AGE_RE.search(text or "")
    if not m:
        return None
    phrase = m.group(1).lower()
    if phrase == "just now":
        return now
    if phrase == "yesterday":
        return now - timedelta(days=1)
    if phrase.startswith("few"):
        return now - timedelta(hours=3 if "hour" in phrase else 0.2)
    if m.group(2):
        n, unit = int(m.group(2)), m.group(3).lower()
    else:  # "a/an <unit> ago"
        n, unit = 1, re.search(r"(minute|hour|day|week|month)", phrase).group(1)
    return now - timedelta(days=n * _UNIT_DAYS[unit])


def parse_date(value) -> datetime | None:
    """ISO-ish string or unix seconds -> aware UTC datetime. None if unparseable."""
    if not value:
        return None
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, tz=timezone.utc)
        dt = datetime.fromisoformat(str(value).strip().replace("Z", "+00:00").replace(" ", "T", 1))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except (ValueError, OSError, OverflowError):
        return None


# --------------------------------------------------------------------------- #
# Source 1: Internshala (HTML)
# NOTE: selectors reflect Internshala's markup at time of writing. If the site
# changes, update SELECTORS only; everything else is source-agnostic.
# --------------------------------------------------------------------------- #
INTERNSHALA_BASE = "https://internshala.com"
INTERNSHALA_PAGES = [
    # (listing url, job type hint)
    (f"{INTERNSHALA_BASE}/internships/computer-science-internship", "Internship"),
    (f"{INTERNSHALA_BASE}/internships/web-development-internship", "Internship"),
    (f"{INTERNSHALA_BASE}/internships/data-science-internship", "Internship"),
    (f"{INTERNSHALA_BASE}/fresher-jobs/computer-science-jobs", "Full-Time"),
    (f"{INTERNSHALA_BASE}/fresher-jobs/software-development-jobs", "Full-Time"),
]
SELECTORS = {
    "card": "div.individual_internship, div.internship_meta",
    "title": ".job-internship-name, .profile, h3.job-internship-name a, a.job-title-href",
    "company": ".company-name, .company_name a, p.company-name",
    "location": ".locations span, .location_link, #location_names span",
    "link": "a.job-title-href, a[href*='/internship/detail/'], a[href*='/job/detail/']",
    "detail_description": ".internship_details, .text-container, .about_company_text_container",
}


def scrape_internshala() -> Iterable[RawJob]:
    seen: set[str] = set()
    for listing_url, hint in INTERNSHALA_PAGES:
        html = fetch(listing_url)
        if not html:
            continue
        soup = BeautifulSoup(html, "html.parser")
        for card in soup.select(SELECTORS["card"]):
            link_el = card.select_one(SELECTORS["link"])
            href = link_el.get("href") if link_el else card.get("data-href")
            if not href:
                continue
            url = urljoin(INTERNSHALA_BASE, href).split("?")[0]
            if url in seen:
                continue
            seen.add(url)

            title_el = card.select_one(SELECTORS["title"])
            company_el = card.select_one(SELECTORS["company"])
            if not title_el or not company_el:
                continue
            location = ", ".join(
                clean(el.get_text()) for el in card.select(SELECTORS["location"])
            )
            snippet = clean(card.get_text(" "))
            description = snippet
            # Detail page gives the AI far better context than the card snippet.
            detail_html = fetch(url)
            if detail_html:
                detail = BeautifulSoup(detail_html, "html.parser")
                body = " ".join(
                    clean(el.get_text(" ")) for el in detail.select(SELECTORS["detail_description"])
                )
                if body:
                    description = body
            yield RawJob(
                source_url=url,
                title=clean(title_el.get_text()),
                company=clean(company_el.get_text()),
                description=description[:DESCRIPTION_CHAR_LIMIT],
                portal="Internshala",
                hint_type=hint,
                hint_location=location or None,
                posted_at=parse_relative_age(snippet),
            )


# --------------------------------------------------------------------------- #
# Source 2: Unstop (public JSON search endpoint used by its own site)
# Unofficial / undocumented: may change or be rate-limited. Fails soft.
# --------------------------------------------------------------------------- #
UNSTOP_API = "https://unstop.com/api/public/opportunity/search-result"


def scrape_unstop() -> Iterable[RawJob]:
    for opp, hint in (("internships", "Internship"), ("jobs", "Full-Time")):
        data = fetch(
            UNSTOP_API,
            params={"opportunity": opp, "per_page": 30, "oppstatus": "open", "page": 1},
            as_json=True,
        )
        items = ((data or {}).get("data") or {}).get("data") or []
        for item in items:
            slug = item.get("public_url") or item.get("seo_url")
            title = clean(item.get("title"))
            org = clean((item.get("organisation") or {}).get("name"))
            if not (slug and title and org):
                continue
            url = slug if slug.startswith("http") else f"https://unstop.com/{slug.lstrip('/')}"
            locs = item.get("jobDetail", {}).get("locations") or []
            skills = ", ".join(
                s.get("skill", "") if isinstance(s, dict) else str(s)
                for s in (item.get("required_skills") or [])
            )
            details = BeautifulSoup(item.get("details") or "", "html.parser").get_text(" ")
            description = clean(f"{details} Skills: {skills}")
            yield RawJob(
                source_url=url,
                title=title,
                company=org,
                description=description[:DESCRIPTION_CHAR_LIMIT],
                portal="Unstop",
                hint_type=hint,
                hint_location=", ".join(map(str, locs)) or None,
                posted_at=next(
                    (d for k in ("created_at", "start_date", "updated_at") if (d := parse_date(item.get(k)))),
                    None,
                ),
            )


# --------------------------------------------------------------------------- #
# Source 3: Remotive (documented public API, remote roles; India-friendly filter)
# --------------------------------------------------------------------------- #
REMOTIVE_API = "https://remotive.com/api/remote-jobs"
ENTRY_LEVEL = re.compile(r"\b(intern|internship|trainee|fresher|graduate|junior|entry[- ]level|associate)\b", re.I)


def scrape_remotive() -> Iterable[RawJob]:
    data = fetch(REMOTIVE_API, params={"category": "software-dev", "limit": 100}, as_json=True)
    for item in (data or {}).get("jobs", []):
        title = clean(item.get("title"))
        if not ENTRY_LEVEL.search(title):
            continue
        region = clean(item.get("candidate_required_location"))
        if region and not re.search(r"worldwide|anywhere|india|apac|asia", region, re.I):
            continue
        description = clean(BeautifulSoup(item.get("description") or "", "html.parser").get_text(" "))
        yield RawJob(
            source_url=item.get("url", ""),
            title=title,
            company=clean(item.get("company_name")),
            description=description[:DESCRIPTION_CHAR_LIMIT],
            portal="Remotive",
            hint_type="Internship" if re.search(r"intern", title, re.I) else None,
            hint_location="Remote",
            posted_at=parse_date(item.get("publication_date")),
        )


SOURCES: dict[str, Callable[[], Iterable[RawJob]]] = {
    "Internshala": scrape_internshala,
    "Unstop": scrape_unstop,
    "Remotive": scrape_remotive,
}


def scrape_all(only: list[str] | None = None) -> list[RawJob]:
    jobs: dict[str, RawJob] = {}
    for name, fn in SOURCES.items():
        if only and name.lower() not in only:
            continue
        count = 0
        try:
            for job in fn():
                if job.source_url and job.title and job.company:
                    jobs.setdefault(job.source_url, job)
                    count += 1
        except Exception:  # one broken source must never kill the run
            log.exception("source %s crashed; continuing", name)
        log.info("scraped %d jobs from %s", count, name)
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    fresh = [j for j in jobs.values() if j.posted_at is None or j.posted_at >= cutoff]
    log.info("dropped %d listings posted more than %d days ago", len(jobs) - len(fresh), RETENTION_DAYS)
    return fresh


# --------------------------------------------------------------------------- #
# Supabase
# --------------------------------------------------------------------------- #
def get_supabase():
    from supabase import create_client

    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(url, key)


def existing_urls(sb, urls: list[str]) -> set[str]:
    """Which of `urls` are already stored? Queried in chunks (URL-length safe)."""
    found: set[str] = set()
    for i in range(0, len(urls), 50):
        chunk = urls[i : i + 50]
        rows = sb.table("jobs").select("source_url").in_("source_url", chunk).execute().data
        found.update(r["source_url"] for r in rows)
    return found


def purge_old(sb) -> int:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
    res = sb.table("jobs").delete().lt("listed_at", cutoff).execute()
    return len(res.data or [])


# --------------------------------------------------------------------------- #
# Token / request accounting (feeds the cost-per-1,000-posts number)
# --------------------------------------------------------------------------- #
@dataclass
class Usage:
    requests: int = 0            # every HTTP attempt, including failed ones (they can count against quota)
    failed_requests: int = 0
    input_tokens: int = 0
    output_tokens: int = 0       # candidates only
    thinking_tokens: int = 0     # billed as output by Gemini; tracked separately
    by_model: dict = field(default_factory=dict)


USAGE = Usage()


def record_usage(model: str, resp) -> None:
    meta = getattr(resp, "usage_metadata", None)
    tin = int(getattr(meta, "prompt_token_count", 0) or 0)
    tout = int(getattr(meta, "candidates_token_count", 0) or 0)
    tthink = int(getattr(meta, "thoughts_token_count", 0) or 0)
    USAGE.input_tokens += tin
    USAGE.output_tokens += tout
    USAGE.thinking_tokens += tthink
    m = USAGE.by_model.setdefault(model, {"requests": 0, "input_tokens": 0, "output_tokens": 0, "thinking_tokens": 0})
    m["requests"] += 1
    m["input_tokens"] += tin
    m["output_tokens"] += tout
    m["thinking_tokens"] += tthink


# --------------------------------------------------------------------------- #
# Cross-portal de-duplication
# The URL check (existing_urls) catches the same listing twice. This catches the SAME JOB under
# different URLs/portals: key = normalised company | normalised role | normalised city.
# Duplicates are STORED but flagged (duplicate_of -> canonical id) and hidden by the frontend, so the
# URL check still skips them next run and we never pay to re-tag them.
# --------------------------------------------------------------------------- #
_LEGAL_SUFFIX = re.compile(
    r"\b(pvt|private|ltd|limited|llp|llc|inc|corp|corporation|co|technologies|technology|solutions)\b"
)


def _norm(text: str | None) -> str:
    t = re.sub(r"[^a-z0-9 ]+", " ", (text or "").lower())
    return re.sub(r"\s+", " ", t).strip()


def norm_company(name: str | None) -> str:
    t = re.sub(r"\s+", " ", _LEGAL_SUFFIX.sub(" ", _norm(name))).strip()
    return t or _norm(name)


def make_dedupe_key(company: str | None, role: str | None, city: str | None) -> str:
    return f"{norm_company(company)}|{_norm(role)}|{_norm(city)}"


def existing_dedupe_keys(sb, keys: list[str]) -> dict[str, str]:
    """{dedupe_key: canonical job id} for keys already stored as canonical (not duplicates)."""
    found: dict[str, str] = {}
    for i in range(0, len(keys), 50):
        chunk = keys[i : i + 50]
        rows = (
            sb.table("jobs").select("id,dedupe_key").in_("dedupe_key", chunk).is_("duplicate_of", "null").execute().data
        )
        found.update({r["dedupe_key"]: r["id"] for r in rows})
    return found


def assign_dedupe(sb, rows: list[dict], seen: dict[str, str]) -> int:
    """Give every row an id + dedupe_key + duplicate_of. `seen` carries canonical keys across batches.
    Returns how many rows in this batch were duplicates."""
    for row in rows:
        row["id"] = str(uuid.uuid4())
        row["dedupe_key"] = make_dedupe_key(row["company_name"], row["ai_role"], row["ai_city"])
    if sb is not None:
        unknown = sorted({r["dedupe_key"] for r in rows} - seen.keys())
        if unknown:
            seen.update(existing_dedupe_keys(sb, unknown))
    dups = 0
    for row in rows:
        canonical = seen.get(row["dedupe_key"])
        if canonical:
            row["duplicate_of"] = canonical
            dups += 1
        else:
            row["duplicate_of"] = None
            seen[row["dedupe_key"]] = row["id"]
    return dups


def backfill_dedupe(sb) -> None:
    """One-off: compute dedupe_key / duplicate_of for rows saved before this feature existed."""
    rows: list[dict] = []
    start = 0
    while True:
        chunk = (
            sb.table("jobs")
            .select("id,company_name,ai_role,ai_city,original_title,dedupe_key,duplicate_of")
            .order("scraped_at")
            .order("id")
            .range(start, start + 999)
            .execute()
            .data
        )
        rows += chunk
        if len(chunk) < 1000:
            break
        start += 1000
    canonical: dict[str, str] = {}
    dups = updated = 0
    for r in rows:  # oldest first => oldest row is the canonical one
        key = make_dedupe_key(r["company_name"], r["ai_role"] or r["original_title"], r["ai_city"])
        owner = canonical.setdefault(key, r["id"])
        dup_of = None if owner == r["id"] else owner
        if r.get("dedupe_key") != key or r.get("duplicate_of") != dup_of:
            sb.table("jobs").update({"dedupe_key": key, "duplicate_of": dup_of}).eq("id", r["id"]).execute()
            updated += 1
        dups += dup_of is not None
    log.info("backfill: %d rows checked, %d updated, %d duplicates found, %d unique jobs", len(rows), updated, dups, len(rows) - dups)


def save_run_log(sb, stats: dict) -> None:
    """Best-effort: a logging failure must never fail the pipeline."""
    try:
        sb.table("pipeline_runs").insert(stats).execute()
    except Exception as exc:
        log.warning("could not write pipeline_runs row (run the migration?): %s", exc)


# --------------------------------------------------------------------------- #
# Gemini tagging (batched, multi-model, quota-aware)
# --------------------------------------------------------------------------- #
PROMPT = """You are tagging entry-level tech job listings in India for a job board.
Below are {n} listings, each with an "id". Return ONLY a JSON array with exactly one object per listing, in any order:
[{{"id": <the listing id>, "role": ..., "city": ..., "work_mode": ..., "job_type": ..., "skills": [...]}}]
Field rules:
- "role": normalised role title, 2-5 words, Title Case (e.g. "Software Engineer Intern", "Data Analyst").
- "city": the primary Indian city. Use "Remote" if work-from-home/anywhere. Use standard names (Bengaluru not Bangalore, Gurugram not Gurgaon).
- "work_mode": one of "Remote", "Hybrid", "On-site".
- "job_type": one of "Internship", "Full-Time".
- "skills": array of at most 3 short skill names, most important first.

Listings:
{listings}
"""


class QuotaExhausted(Exception):
    """Every configured model is rate-limited / out of quota: stop the run cleanly."""


def make_gemini():
    from google import genai

    if not os.environ.get("GEMINI_API_KEY"):
        sys.exit("GEMINI_API_KEY must be set")
    return genai.Client(http_options={"api_version": "v1beta"})


def _listing_block(i: int, job: RawJob) -> str:
    return (
        f"--- id: {i}\n"
        f"title: {job.title}\n"
        f"company: {job.company}\n"
        f"portal hint (may be wrong): type={job.hint_type or 'unknown'}; location={job.hint_location or 'unknown'}\n"
        f"description: {job.description[:BATCH_DESCRIPTION_CHARS] or '(none)'}"
    )


def _error_code(exc: Exception) -> int | None:
    code = getattr(exc, "code", None)
    return code if isinstance(code, int) else None


def _call_model(client, model: str, prompt: str) -> str:
    """One model, with retries for transient server errors. Raises on 429/4xx so the caller can fall back."""
    from google.genai import types

    config = types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1)
    for attempt in range(len(SERVER_RETRY_WAITS) + 1):
        USAGE.requests += 1
        try:
            resp = client.models.generate_content(model=model, contents=prompt, config=config)
            record_usage(model, resp)
            return resp.text
        except Exception as exc:
            USAGE.failed_requests += 1
            code = _error_code(exc)
            if code in (500, 502, 503, 504) and attempt < len(SERVER_RETRY_WAITS):
                wait = SERVER_RETRY_WAITS[attempt]
                log.warning("%s overloaded (HTTP %s); retry %d in %ds", model, code, attempt + 1, wait)
                time.sleep(wait)
                continue
            raise


def tag_batch(client, jobs: list[RawJob]) -> dict[int, dict]:
    """Tag up to BATCH_SIZE jobs in ONE request. Returns {index_in_batch: tags}; missing indexes are skipped."""
    prompt = PROMPT.format(n=len(jobs), listings="\n".join(_listing_block(i, j) for i, j in enumerate(jobs)))
    all_quota = True
    for model in GEMINI_MODELS:
        try:
            text = _call_model(client, model, prompt)
            data = json.loads(text)
            if isinstance(data, dict):  # model wrapped the array
                data = next((v for v in data.values() if isinstance(v, list)), [data])
            out: dict[int, dict] = {}
            for item in data:
                idx = item.get("id") if isinstance(item, dict) else None
                try:
                    idx = int(idx)
                except (TypeError, ValueError):
                    continue
                if 0 <= idx < len(jobs) and idx not in out:
                    out[idx] = normalise_tags(item, jobs[idx])
            log.info("%s tagged %d/%d jobs in 1 request", model, len(out), len(jobs))
            return out
        except json.JSONDecodeError as exc:
            all_quota = False
            log.warning("%s returned invalid JSON (%s); trying next model", model, exc)
        except Exception as exc:
            code = _error_code(exc)
            if code == 429:
                log.warning("%s quota/rate limit hit (HTTP 429); trying next model", model)
            else:
                all_quota = False
                log.warning("%s failed (HTTP %s): %s; trying next model", model, code, str(exc)[:200])
    if all_quota:
        raise QuotaExhausted
    return {}


CITY_ALIASES = {
    "bangalore": "Bengaluru",
    "gurgaon": "Gurugram",
    "bombay": "Mumbai",
    "madras": "Chennai",
    "calcutta": "Kolkata",
    "new delhi": "Delhi",
    "delhi ncr": "Delhi",
    "work from home": "Remote",
}


def normalise_tags(raw: dict, job: RawJob) -> dict:
    """Validate/repair model output so a bad response can never violate the schema."""
    if isinstance(raw, list) and raw:
        raw = raw[0]
    mode = str(raw.get("work_mode", "")).strip()
    mode = {"on-site": "On-site", "onsite": "On-site", "in-office": "On-site"}.get(mode.lower(), mode)
    if mode not in VALID_MODES:
        mode = "Remote" if (job.hint_location or "").lower().startswith("remote") else "On-site"
    jtype = str(raw.get("job_type", "")).strip()
    if jtype not in VALID_TYPES:
        jtype = job.hint_type if job.hint_type in VALID_TYPES else "Full-Time"
    skills = [clean(str(s)) for s in (raw.get("skills") or []) if clean(str(s))][:3]
    city = clean(raw.get("city"))
    city = CITY_ALIASES.get(city.lower(), city)
    return {
        "role": clean(raw.get("role")) or job.title,
        "city": city or ("Remote" if mode == "Remote" else "India"),
        "work_mode": mode,
        "job_type": jtype,
        "skills": skills,
    }


def to_row(job: RawJob, tags: dict) -> dict:
    return {
        "source_url": job.source_url,
        "original_title": job.title,
        "company_name": job.company,
        "raw_description": job.description,
        "ai_role": tags["role"],
        "ai_city": tags["city"],
        "ai_work_mode": tags["work_mode"],
        "ai_job_type": tags["job_type"],
        "ai_skills": tags["skills"],
        "source_portal": job.portal,
        "posted_at": job.posted_at.isoformat() if job.posted_at else None,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #
def run(dry_run: bool, only: list[str] | None) -> int:
    sb = None if dry_run else get_supabase()

    scraped = scrape_all(only)
    log.info("total unique scraped: %d", len(scraped))

    # Dedupe BEFORE spending LLM requests.
    if sb is not None and scraped:
        known = existing_urls(sb, [j.source_url for j in scraped])
        fresh = [j for j in scraped if j.source_url not in known]
        log.info("%d already stored, %d new", len(known), len(fresh))
    else:
        fresh = scraped
    fresh = fresh[:MAX_NEW_JOBS_PER_RUN]

    saved_total = 0
    dup_total = 0
    seen_keys: dict[str, str] = {}
    n_new = len(fresh)
    dry_rows: list[dict] = []
    if fresh:
        client = make_gemini()
        batches = [fresh[i : i + BATCH_SIZE] for i in range(0, len(fresh), BATCH_SIZE)]
        log.info("tagging %d jobs in %d request(s) of up to %d", len(fresh), len(batches), BATCH_SIZE)
        for n, batch in enumerate(batches, 1):
            try:
                tagged = tag_batch(client, batch)
            except QuotaExhausted:
                log.warning(
                    "All Gemini models are out of quota. Stopping cleanly; %d jobs already saved. "
                    "Untagged jobs are retried on the next run.",
                    saved_total,
                )
                break
            rows = [to_row(batch[i], tags) for i, tags in tagged.items()]
            dup_total += assign_dedupe(sb, rows, seen_keys)
            # Save after EVERY batch so a later failure never loses finished work.
            if rows:
                if dry_run:
                    dry_rows.extend(rows)
                else:
                    sb.table("jobs").upsert(rows, on_conflict="source_url").execute()
                saved_total += len(rows)
            log.info("[batch %d/%d] saved %d (total %d, duplicates so far %d)", n, len(batches), len(rows), saved_total, dup_total)
            if n < len(batches):
                time.sleep(GEMINI_DELAY_SECONDS)

    log.info(
        "usage: %d requests (%d failed) | tokens in=%d out=%d thinking=%d | tagged=%d duplicates=%d",
        USAGE.requests, USAGE.failed_requests, USAGE.input_tokens, USAGE.output_tokens, USAGE.thinking_tokens,
        saved_total, dup_total,
    )

    if dry_run:
        print(json.dumps(dry_rows, indent=2, ensure_ascii=False))
        return 0

    log.info("upserted %d jobs this run (%d flagged as cross-portal duplicates)", saved_total, dup_total)
    save_run_log(sb, {
        "scraped": len(scraped), "new_jobs": n_new, "tagged": saved_total, "duplicates": dup_total,
        "requests": USAGE.requests, "failed_requests": USAGE.failed_requests,
        "input_tokens": USAGE.input_tokens, "output_tokens": USAGE.output_tokens,
        "thinking_tokens": USAGE.thinking_tokens, "by_model": USAGE.by_model,
    })
    log.info("purged %d jobs older than %d days", purge_old(sb), RETENTION_DAYS)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="don't write to Supabase")
    parser.add_argument("--only", help="comma-separated sources, e.g. internshala,unstop")
    parser.add_argument("--backfill-dedupe", action="store_true", help="flag cross-portal duplicates among existing rows, then exit")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    if args.backfill_dedupe:
        backfill_dedupe(get_supabase())
        return 0
    only = [s.strip().lower() for s in args.only.split(",")] if args.only else None
    return run(args.dry_run, only)


if __name__ == "__main__":
    sys.exit(main())
