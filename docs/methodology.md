# Methodology and FAQ

The simulator is a hypothesis generator calibrated to funnel data. It tells the team where to look and what to test with real customers. It does not replace research, and nothing in it is evidence of what customers think.

## How were the personas created?

- The 20 banking archetypes (The Provider, The Hustler, The Grant Receiver and so on) were defined by the design team.
- Each archetype has one named persona with a profile, habits, pain points, ranges (age, income, phone, data, preferred channel, ID and documents) and behaviour traits. These were written from general knowledge of South African banking customers, not from interviews, surveys or bank data.
- Behaviour follows the [persona behaviour guide](persona-behaviour-guide.md). The trait values per persona are assumptions.
- In a run, every simulated customer is drawn from one persona and varies within its ranges with seeded randomness. Persona averages drive outcomes.
- How large each persona is, as a share of people who start, is assumed. No source gives real persona sizes yet.

## Are the personas built for banking?

Yes, for account opening. They carry banking traits: ID type, proof of address, payslip or informal income, existing or new customer, and how each reacts to banking screen types (ID capture, identity verification, proof of address, terms, credit decisions). Eligibility per account follows Standard Bank's public criteria.

They are not yet tuned for other flows such as payments or servicing. A second persona pack is planned for those.

## Where does the feedback come from?

No real testing happens in the tool. Each synthetic customer walks the screens of a flow. Their chance of leaving a screen combines:

1. the screen's base drop-off, calibrated so the whole flow matches the funnel numbers;
2. the persona's multiplier for that type of screen, doubled on their main quit trigger;
3. events rolled on each screen from the persona's traits and mood: mis-taps, going back, interruptions, re-reading, picking the wrong option, skipping the terms.

Each customer who leaves gets a reason from a list of typical reasons for that screen type, weighted by persona. About 12% leave for no clear reason.

What they say is generated separately from what they did, following the behaviour guide: short, plain words, often silent, and sometimes "it was fine" after leaving. Answers are checked for length, banned words, more than one point and repeats, and failing answers are never shown. Inside Claude, the shown answers can be rewritten by Claude using the guide's prompt and the same checks.

Use it for direction: which screen, which people, what kind of problem.

## How are the business numbers worked out?

- **Funnel:** mock monthly counts for four public Standard Bank accounts (MyMo, MyMo Plus, Achieva, Prestige Banking). Real funnel data was removed to protect company data and can be loaded in a browser session without being saved.
- **Volumes and forecast:** monthly starts and trend come from the funnel. The 3-month forecast extends the recent trend, with a range from normal month-to-month movement.
- **Rand values:** contribution, payment and deposit values per customer are placeholders and are labelled as such. They need finance to confirm.
- **Idea effects:** how much each idea helps, including the Soft Banking Profile, is assumed and shown as a range from slight to strong.

## Is it backed by research?

**Established methods**

- Monte Carlo simulation, calibrated to observed funnel data.
- Confidence intervals, and a test of the model against a month it has not seen.
- Flow confidence checks grounded in recognised UX laws (Hick's, Fitts's, Miller's, Jakob's, Tesler's, Postel's, Doherty threshold, goal-gradient, Zeigarnik, Von Restorff, peak-end rule) and CX principles (moments of truth, service recovery).

**Not backed by research**

The persona profiles and sizes, behaviour traits, reasons for leaving, effect sizes of ideas, flow confidence weights and rand values. None come from Standard Bank research or data. They are structured assumptions.

**What would back it**

- Research review of the persona pack.
- Real funnel and analytics data loaded into the tool.
- Usability tests whose results are compared with the tool's predictions over time, with the assumptions tuned to match.

## One line for leaders

It is calibrated to funnel data and built on recognised UX and CX principles. Its personas and effects are working assumptions that research will validate, so it tells us where to look and what to test, not what customers think.
