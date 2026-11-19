# Athena: Account Origination Simulator

Built by Junior Sebilimetsa, Senior Product Designer, Standard Bank. New here? Start with [About Athena](docs/about-athena.md).

A tool for testing an onboarding flow with synthetic customers before it goes to real people. It shows where people are likely to leave, who leaves, why, and what a change might be worth.

**All funnel numbers in this repository are mock data.** They are made up for demonstration and are not Standard Bank figures. The persona pack is synthetic: every person, name, ID number, email and phone number in it is made up.

## Try it

Open `index.html` for the introduction, or go straight to `simulator.html`. The simulator is one self-contained page and needs no install or server. Two small libraries for the PDF export load from cdnjs when you press "Save as PDF".

On GitHub Pages, the site opens on the About Athena page, with a button through to the simulator.

## What it does

| Tab | What you get |
|---|---|
| Summary | One screen: how many people the account loses, the two biggest leaks, the effect of a Soft Banking Profile, the next 3 months, and a confidence score. Exports to PDF. |
| Drop-off and ideas | Where people leave, screen by screen. Tap a screen to see what happened, who left, what they did and what they said. Switch ideas on to see their effect. |
| Customers | The 20 persona archetypes, their pain points, how they behave, and who's in each group according to the v7.1 persona pack. |
| Feedback | One section, step by step, from the full base of 10,000 synthetic customers: who quit and struggled, what to fix (with a fix for each problem), what works, who struggles most, and three quotes. Includes a 0 to 100 readiness score and a Claude review of the screens against design laws. |
| Business impact | Traditional onboarding against the Soft Banking Profile: accounts, money and a 3-month projection. |
| Test a design | Upload screens of a new flow, order them, say what each one is, and run it against today's flow or on its own. |

Some features only work inside Claude: "Ask them again with Claude" and the screen review are hidden or switched off elsewhere.

## How it works, and what is assumed

See [docs/methodology.md](docs/methodology.md). In short: the method is standard (a seeded simulation calibrated to funnel data, tested on a month it has not seen), but the personas, their behaviour, the reasons for leaving, the size of each idea's effect and the rand values are working assumptions for research to validate.

## Editing

The page is built from the files in `src/`:

| File | What it holds |
|---|---|
| `journey.js` | Simulation engine, personas, behaviour traits, mock data |
| `journey_ui.js`, `journey.html` | Drop-off and ideas tab |
| `personas.js` | Customers tab, persona profiles and portraits |
| `voice.js`, `voc.js` | The "Why they left" panel |
| `panel.js` | Customer feedback on the 10,000 base, using the persona feedback kit's engine |
| `kitbank.js` | The kit's 589-line feedback bank (generated) |
| `pack.js` | The v7.1 persona pack, selected columns (generated) |
| `packview.js` | "Who's in this group" on the Customers tab |
| `fields.js` | Which fields customers get stuck on |
| `flow.js` | Feedback tab and Flow confidence score |
| `summary.js` | Summary and PDF export |
| `design.js` | Test a design |
| `model.js`, `ui.js`, `commercial.html` | Business impact |
| `theme.css` | Styles |

After editing, rebuild the page with `python3 build.py` (it rewrites `simulator.html` in place). `index.html` is the About Athena landing page and is edited by hand.

If you change the persona pack (`data/persona_pack_v7_1_10000.csv`) or the feedback bank (`kit/bank_*.txt`), run `python3 tools/build_data.py`. It regenerates `src/pack.js` and `src/kitbank.js`, then rebuilds the page. Only the columns the page uses are loaded: no ID numbers, passports, emails, phone numbers or dates of birth.

## Persona pack and feedback kit

- `data/persona_pack_v7_1_10000.csv`: 10,000 synthetic South Africans across 20 archetypes, weighted to the adult population.
- `kit/`: the persona feedback kit v2. The feedback bank, the Python feedback engine, sample reviews and the report script. See `kit/README.md`.

In the page, who quits and where comes from the calibrated simulation. Each simulated customer is a pack person from the same archetype, picked by population weight, and their feedback follows the kit's engine.

## Athena Offline

`athena-offline.html` is a single file that runs in a browser with no internet. Nothing is uploaded: files are read and saved in that browser only (IndexedDB), and a project file can be exported to move between laptops.

- **Your data:** load funnel counts (daily, weekly or monthly) and drop-off reasons as CSV. Athena checks them (completed above entered, chain errors, gaps, duplicates, spikes, history length) and guesses each step's type for you to correct. Templates and sample data are in the tab and in `samples/`.
- **Forecast:** the next 3 months of starters and accounts opened per step, with a likely range. It learns the yearly pattern, the weekly rhythm and payday, then proves itself by replaying the past 12 months (error, range coverage, and a comparison with a "same as last month" guess), which sets a High, Medium or Low trust level.
- **Offline screen review:** describe each screen in a short form. Fixed rules check it against the design laws and the feedback kit's problem tags, then the 10,000 personas run through it. For a future flow, screens better than a typical one lose fewer people in the prediction (at most half), worse ones lose more (at most double).

Build it with `python3 build_offline.py` (runs `build.py`, then adds the offline modules and fails if any online link remains).

## Docs

- [About Athena](docs/about-athena.md): what it is, why the name, and what it does for design teams and the business
- [Methodology and FAQ](docs/methodology.md)
- [Persona behaviour guide v2](docs/persona-behaviour-guide-v2.md) (current)
- [Persona behaviour guide v1](docs/persona-behaviour-guide.md)
- [Persona feedback kit](kit/README.md)
