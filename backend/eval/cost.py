"""
Cost per 1,000 posts, from the token counts the pipeline logged to the `pipeline_runs` table.

  python eval/cost.py --in-price 0.30 --out-price 2.50          # USD per 1M tokens, from Google's pricing page
  python eval/cost.py --in-price 0.30 --out-price 2.50 --since 2026-11-19 --usd-inr 88

Prices are arguments because they change: copy them from the official Gemini API pricing page for the
model you used (paid tier). The free tier costs $0, so this reports the paid-tier equivalent.
Thinking tokens are billed as output tokens by Gemini and are included in the output cost.

No Supabase rows yet? Use manual mode:
  python eval/cost.py --in-price 0.30 --out-price 2.50 --jobs 100 --in-tokens 40000 --out-tokens 12000
"""
from __future__ import annotations

import argparse
import os
import sys

from dotenv import load_dotenv

load_dotenv()


def load_totals(since: str | None) -> dict:
    from supabase import create_client

    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (backend/.env)")
    q = create_client(url, key).table("pipeline_runs").select("*")
    if since:
        q = q.gte("run_at", since)
    rows = q.execute().data
    if not rows:
        sys.exit("No pipeline_runs rows found (did you run the migration and a real, non-dry run?).")
    tot = {k: sum((r.get(k) or 0) for r in rows) for k in
           ("tagged", "duplicates", "requests", "failed_requests", "input_tokens", "output_tokens", "thinking_tokens")}
    tot["runs"] = len(rows)
    return tot


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--in-price", type=float, required=True, help="USD per 1M input tokens")
    ap.add_argument("--out-price", type=float, required=True, help="USD per 1M output tokens (thinking included)")
    ap.add_argument("--since", help="only runs on/after this date, e.g. 2026-11-19")
    ap.add_argument("--usd-inr", type=float, help="optional exchange rate to also print INR")
    ap.add_argument("--jobs", type=int); ap.add_argument("--in-tokens", type=int); ap.add_argument("--out-tokens", type=int)
    args = ap.parse_args()

    if args.jobs:
        t = {"tagged": args.jobs, "input_tokens": args.in_tokens or 0, "output_tokens": args.out_tokens or 0,
             "thinking_tokens": 0, "requests": 0, "failed_requests": 0, "duplicates": 0, "runs": 1}
    else:
        t = load_totals(args.since)

    posts = t["tagged"]
    if not posts:
        sys.exit("0 tagged posts in the selected runs, nothing to divide by.")
    out_tokens = t["output_tokens"] + t["thinking_tokens"]
    cost = t["input_tokens"] / 1e6 * args.in_price + out_tokens / 1e6 * args.out_price
    per_1000 = cost / posts * 1000

    print(f"Runs: {t['runs']}   Posts tagged: {posts}   (cross-portal duplicates flagged: {t['duplicates']})")
    print(f"Requests: {t['requests']} ({t['failed_requests']} failed)  ->  {t['requests'] / posts * 1000:.0f} requests per 1,000 posts")
    print(f"Tokens: input {t['input_tokens']:,}  output {t['output_tokens']:,}  thinking {t['thinking_tokens']:,}")
    print(f"Per post: {t['input_tokens'] / posts:.0f} input + {out_tokens / posts:.0f} output tokens")
    print(f"Total cost at these prices: ${cost:.4f}")
    print(f"==> COST PER 1,000 POSTS: ${per_1000:.4f}" + (f"  (~Rs {per_1000 * args.usd_inr:.2f})" if args.usd_inr else ""))
    print("Note: failed requests may still have counted against quota but usually return no billed tokens.")
    print("Other costs: Supabase, Vercel and GitHub Actions are $0 on free tiers at this scale.")


if __name__ == "__main__":
    main()
