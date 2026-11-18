# Persona feedback kit

Turns a design review into feedback from the synthetic personas: who finishes, where they struggle or quit, and what they say about it in their own words.

## What's inside

| File | What it is |
|---|---|
| `bank_onboarding.txt`, `bank_payments_stokvel.txt`, `bank_general.txt`, `bank_more.txt` | The feedback bank: 589 tagged lines. Edit or add lines here. |
| `feedback_bank_templates.json` | The same bank as JSON, for loading into the platform |
| `feedback_engine.py` | Runs personas through a review and writes their feedback |
| `sample_review_*.json` | Three example reviews: account opening, stokvel, paying a new person |
| `persona_behaviour_guide_v2.md` | The rules: depth, saying vs doing, tags, LLM mode |
| `build_expanded.py`, `make_report.py` | Rebuild the expanded bank; turn a run into a readable report |

## Run it

```
python feedback_engine.py persona_pack_v7_1_10000.csv sample_review_account_opening.json --n 200 --weighted --briefs --out my_run
python make_report.py my_run
```

- `--weighted` samples personas by `population_weight`, so the crowd looks like South Africa. Leave it off to sample evenly.
- `--briefs` also writes `my_run_llm_briefs.jsonl`: one ready-to-send prompt per comment, for fresh LLM-written answers.
- `"audience"` in a review limits who takes part, e.g. `{"stokvel_member": "Yes"}` or `{"existing_bank_customer": "Yes"}`.

## Describing a review

Each step needs:
- a `name`
- a `topic` from the guide's list
- `issues`: problem tag mapped to a severity from 1 to 3
- `strengths`: a list of tags

The engine uses these to decide:
- who struggles or quits at each step (people feel some problems more than others)
- which steps people mention
- whether each comment is negative, mixed or positive
- which bank lines fit each person's life

## Adding lines

One line per comment: `sentiment|depth|fits|tags|text`
- **Sentiment:** P (positive), U (neutral or mixed), N (negative).
- **Depth:** s (short), m (medium), r (rich).
- **Fits:** `*` for anyone, or traits that must all hold. The traits are: low, high, old, young, grant, informal, foreign, feature, prof, lowinc, parent, member, treasurer, rural, prepaid, scam_fear, female, male, salaried, working.
- **Slots** filled from the persona: `{other_bank}`, `{family}`, `{amount}`, `{data_amount}`, `{place}`, `{minutes}`.

Real interview notes are the best source of new lines. Rewrite them in your own words and strip names before adding them.
