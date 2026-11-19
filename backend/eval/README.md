# Tagging evaluation

**Accuracy (hand-check 50 posts)**
1. `python eval/export_sample.py` writes `eval/sample.csv` (50 random, de-duplicated posts, seeded, stratified by portal).
2. Open the CSV (Excel works). For each row open `source_url` and mark `role_ok`, `city_ok`, `mode_ok`, `type_ok` as `y` or `n`. Add a note for errors.
3. `python eval/score.py` writes `eval/results.md` with accuracy per field and a 95% interval.

**Rubric (write down your own before you start, and keep it consistent)**
- *Role* is correct if the normalised title would be accepted by a recruiter as the same role as the posting (seniority and internship/trainee kept).
- *City* is correct if it matches the primary work location on the **source page** (not just the snippet). Multi-city postings: correct if the tagged city is one of the listed cities. "Remote" is correct only if the posting is work-from-home.
- *Work mode* and *job type* are judged against the posting the same way.

**Cost per 1,000 posts**
`python eval/cost.py --in-price <USD per 1M input> --out-price <USD per 1M output>` using the token counts the pipeline stores in `pipeline_runs` (take prices from Google's official pricing page for your model).
