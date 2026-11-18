# Athena: Account Origination Simulator

A tool for testing an onboarding flow with synthetic customers before it goes to real people. It shows where people are likely to leave, who leaves, why, and what a change might be worth.

**All numbers in this repository are mock data.** They are made up for demonstration and are not Standard Bank figures.

## Try it

Open `index.html` in a browser. It is one self-contained page and needs no install or server. Two small libraries for the PDF export load from cdnjs when you press "Save as PDF".

If GitHub Pages is switched on for this repository, the same page is available at the Pages link.

## What it does

| Tab | What you get |
|---|---|
| Summary | One screen: how many people the account loses, the two biggest leaks, the effect of a Soft Banking Profile, the next 3 months, and a confidence score. Exports to PDF. |
| Drop-off and ideas | Where people leave, screen by screen. Tap a screen to see what happened, who left, what they did and what they said. Switch ideas on to see their effect. |
| Customers | The 20 synthetic personas, their pain points and how they behave. |
| Flow confidence | A 0 to 100 readiness score for user testing, from funnel evidence and a design review grounded in UX laws and CX principles. |
| Business impact | Traditional onboarding against the Soft Banking Profile: accounts, money and a 3-month projection. |
| Test a design | Upload screens of a new flow, order them, say what each one is, and run it against today's flow or on its own. |

Some features only work inside Claude: "Ask them again with Claude" is hidden elsewhere.

## How it works, and what is assumed

See [docs/methodology.md](docs/methodology.md). In short: the method is standard (a seeded simulation calibrated to funnel data, tested on a month it has not seen), but the personas, their behaviour, the reasons for leaving, the size of each idea's effect and the rand values are working assumptions for research to validate.

## Editing

The page is built from the files in `src/`:

| File | What it holds |
|---|---|
| `journey.js` | Simulation engine, personas, behaviour traits, mock data |
| `journey_ui.js`, `journey.html` | Drop-off and ideas tab |
| `personas.js` | Customers tab, persona profiles and portraits |
| `voice.js`, `voc.js` | Synthetic feedback and the "Why they left" panel |
| `flow.js` | Flow confidence |
| `summary.js` | Summary and PDF export |
| `design.js` | Test a design |
| `model.js`, `ui.js`, `commercial.html` | Business impact |
| `theme.css` | Styles |

After editing, rebuild the page with `python3 build.py` (it rewrites `index.html` in place).

## Docs

- [Methodology and FAQ](docs/methodology.md)
- [Persona behaviour guide](docs/persona-behaviour-guide.md)
