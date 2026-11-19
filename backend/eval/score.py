"""
Score the hand-checked sample.

  python eval/score.py                    # reads eval/sample.csv, writes eval/results.md

Mark each field y/n (also accepts 1/0, yes/no, true/false). Blank = not reviewed (excluded from the score).
"""
from __future__ import annotations

import argparse
import csv
import math
import os
from collections import defaultdict

FIELDS = {"role_ok": "Role", "city_ok": "City", "mode_ok": "Work mode", "type_ok": "Job type"}
YES, NO = {"y", "yes", "1", "true", "t"}, {"n", "no", "0", "false", "f"}


def parse(v: str | None):
    v = (v or "").strip().lower()
    return True if v in YES else False if v in NO else None


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """95% Wilson score interval: honest uncertainty for a small sample."""
    if n == 0:
        return 0.0, 0.0
    p, d = k / n, 1 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, centre - half), min(1.0, centre + half)


def pct(x: float) -> str:
    return f"{100 * x:.0f}%"


def main() -> None:
    here = os.path.dirname(__file__)
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", default=os.path.join(here, "sample.csv"))
    ap.add_argument("--out", default=os.path.join(here, "results.md"))
    args = ap.parse_args()

    with open(args.csv, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    lines = [f"# Tagging accuracy (hand-checked sample)\n", f"Rows in file: **{len(rows)}**\n"]
    lines += ["| Field | Correct | Reviewed | Accuracy | 95% interval |", "|---|---|---|---|---|"]
    summary = {}
    for col, label in FIELDS.items():
        marks = [parse(r.get(col)) for r in rows]
        reviewed = [m for m in marks if m is not None]
        k, n = sum(reviewed), len(reviewed)
        lo, hi = wilson(k, n)
        summary[col] = (k, n)
        acc = pct(k / n) if n else "n/a"
        lines.append(f"| {label} | {k} | {n} | **{acc}** | {pct(lo)} – {pct(hi)} |")
        if n < len(rows):
            print(f"warning: {label}: {len(rows) - n} row(s) not reviewed")

    # Per portal (role + city), to show where the tagger struggles
    lines += ["", "## By source portal (role / city)", "", "| Portal | Rows | Role correct | City correct |", "|---|---|---|---|"]
    portals = defaultdict(list)
    for r in rows:
        portals[r.get("source_portal") or "unknown"].append(r)
    for portal, rs in sorted(portals.items()):
        def frac(col):
            m = [parse(r.get(col)) for r in rs if parse(r.get(col)) is not None]
            return f"{sum(m)}/{len(m)}" if m else "n/a"
        lines.append(f"| {portal} | {len(rs)} | {frac('role_ok')} | {frac('city_ok')} |")

    # Error log
    wrong = [r for r in rows if any(parse(r.get(c)) is False for c in FIELDS)]
    lines += ["", f"## Errors ({len(wrong)} rows with at least one wrong field)", ""]
    for r in wrong:
        bad = [FIELDS[c] for c in FIELDS if parse(r.get(c)) is False]
        lines.append(f"- #{r['n']} **{r['company_name']}** — {r['original_title']} → tagged role *{r['ai_role']}*, city *{r['ai_city']}*. Wrong: {', '.join(bad)}. {r.get('notes') or ''}".rstrip())
    lines += ["", "_Interval = Wilson 95% confidence interval; with ~50 samples expect roughly ±10 points._"]

    text = "\n".join(lines) + "\n"
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(text)
    print(text)
    print(f"(saved to {args.out})")


if __name__ == "__main__":
    main()
