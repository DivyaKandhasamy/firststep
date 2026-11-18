# Firststep — fresher & internship job aggregator (India)

Scrape → dedupe → AI-tag (Gemini) → Supabase → Next.js UI. No user login; bookmarks and applications live in `localStorage`.

```
supabase/schema.sql          table + RLS (public read-only)
backend/pipeline.py          scrapers (Internshala, Unstop, Remotive) + Gemini tagging + upsert + 14-day purge
.github/workflows/daily_scrape.yml   runs daily 06:00 IST
frontend/                    Next.js 15 (App Router) + Tailwind v4 + Lucide + motion
```

## 1. Run the UI right now (no accounts needed)
```bash
cd frontend && npm install && npm run dev      # http://localhost:3000
```
Without Supabase keys the app shows 13 demo jobs and a "Demo data" badge.

## 2. Connect Supabase
1. Create a project at supabase.com → SQL Editor → run `supabase/schema.sql`.
2. `cp frontend/.env.example frontend/.env.local` and fill in the project URL + **anon** key (Settings → API).
3. Restart `npm run dev`. The UI switches to live data automatically (falls back to demo if the table is empty or unreachable).

## 3. Run the pipeline
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
python pipeline.py --dry-run --only internshala   # scrape + tag, print JSON, no DB writes
python pipeline.py                                 # full run
```

## 4. Automate
Push to GitHub → Settings → Secrets and variables → Actions → add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`. Trigger once from the Actions tab (workflow_dispatch) to test.

## Notes
- **Scrapers need a first live test.** Internshala's CSS selectors (top of `pipeline.py`, `SELECTORS`) and Unstop's unofficial JSON endpoint were written without live access and may need tweaks. Each source fails soft, so one breaking never stops the others. Check each portal's terms/robots.txt before scraping at scale.
- The service-role key bypasses RLS: only ever use it in the pipeline/Actions, never in the frontend.
- Dedup happens before any Gemini call; a job Gemini fails to tag is skipped and retried next run.
- Add a source: write `scrape_xyz() -> Iterable[RawJob]` and register it in `SOURCES`.
