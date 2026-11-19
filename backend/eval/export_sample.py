"""
Export a reproducible random sample of tagged jobs to a CSV you can hand-check.

  python eval/export_sample.py                 # 50 jobs, seed 42 -> eval/sample.csv
  python eval/export_sample.py --n 50 --seed 7

Sampling is stratified by source portal (proportional), de-duplicated (duplicate_of IS NULL),
and seeded, so anyone can regenerate the same sample from the same data.
"""
from __future__ import annotations

import argparse
import csv
import os
import random
import sys
from collections import defaultdict

from dotenv import load_dotenv

load_dotenv()

REVIEW_COLUMNS = ["role_ok", "city_ok", "mode_ok", "type_ok", "notes"]


def fetch_all():
    from supabase import create_client

    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (backend/.env)")
    sb = create_client(url, key)
    rows, start = [], 0
    while True:
        chunk = (
            sb.table("jobs").select("*").is_("duplicate_of", "null").order("id").range(start, start + 999).execute().data
        )
        rows += chunk
        if len(chunk) < 1000:
            return rows
        start += 1000


def stratified_sample(rows: list[dict], n: int, seed: int) -> list[dict]:
    rng = random.Random(seed)
    groups: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        groups[r.get("source_portal") or "unknown"].append(r)
    total = len(rows)
    # largest-remainder allocation so quotas sum to exactly n
    quotas = {k: len(v) * n / total for k, v in groups.items()}
    alloc = {k: int(q) for k, q in quotas.items()}
    for k in sorted(quotas, key=lambda k: quotas[k] - alloc[k], reverse=True)[: n - sum(alloc.values())]:
        alloc[k] += 1
    picked: list[dict] = []
    for k in sorted(groups):
        g = sorted(groups[k], key=lambda r: r["id"])  # stable order before seeded shuffle
        rng.shuffle(g)
        picked += g[: alloc[k]]
    rng.shuffle(picked)
    return picked


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--n", type=int, default=50)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "sample.csv"))
    args = ap.parse_args()

    rows = fetch_all()
    if len(rows) < args.n:
        sys.exit(f"Only {len(rows)} unique jobs in the table; need at least {args.n}.")
    sample = stratified_sample(rows, args.n, args.seed)

    cols = ["n", "source_portal", "source_url", "original_title", "company_name", "description_snippet",
            "ai_role", "ai_city", "ai_work_mode", "ai_job_type", "ai_skills"] + REVIEW_COLUMNS
    with open(args.out, "w", newline="", encoding="utf-8-sig") as f:  # BOM so Excel opens it correctly
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for i, r in enumerate(sample, 1):
            w.writerow({
                "n": i,
                "source_portal": r.get("source_portal"),
                "source_url": r["source_url"],
                "original_title": r["original_title"],
                "company_name": r["company_name"],
                "description_snippet": " ".join((r.get("raw_description") or "").split())[:500],
                "ai_role": r.get("ai_role"),
                "ai_city": r.get("ai_city"),
                "ai_work_mode": r.get("ai_work_mode"),
                "ai_job_type": r.get("ai_job_type"),
                "ai_skills": ", ".join(r.get("ai_skills") or []),
            })
    by_portal = defaultdict(int)
    for r in sample:
        by_portal[r.get("source_portal") or "unknown"] += 1
    print(f"Wrote {len(sample)} rows to {args.out}  (from {len(rows)} unique jobs; seed={args.seed})")
    print("By portal:", dict(by_portal))
    print("Next: open the CSV, open each source_url, and fill role_ok / city_ok / mode_ok / type_ok with y or n.")


if __name__ == "__main__":
    main()
