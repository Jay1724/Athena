# Mock company export (all numbers made up)

Made by `tools/make_mock_export.py` to test Athena Offline the way a real export would arrive: weekly numbers, semicolons, different column names, split by channel (App and Web).

| File | What it is |
|---|---|
| `weekly_funnel_export.csv` | 104 weeks (Nov 2024 to Oct 2026) of people in and out of each step, for 4 accounts |
| `dropoff_reasons_export.csv` | Monthly drop-off reasons per step |
| `weekly_funnel_export_messy.csv` | The same funnel with 4 planted problems for the data checks to catch |

Stories planted in the data, to see whether Athena finds them:

- **MyMo, Personal details** got a redesign in August 2026: the pass rate rises from about 69% to 78%.
- **Achieva, Proof of address or income** got a stricter rule in June 2026: the pass rate falls, and "No proof of address" grows.
- **Identity verification** dips every December (holiday load), and starters peak in January and dip in December.
- **MyMo** ran a campaign in March 2026: 35% more starters for three weeks, who choose an account a little less often.
- Payday weeks (the 22nd to the 2nd) bring about 8% more starters.

Planted problems in the messy file: one week missing (Prestige, 13 July 2026), one row with more people out than in, one step with more people in than came through the step before, and one duplicate row.
