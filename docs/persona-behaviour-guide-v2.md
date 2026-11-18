# Persona behaviour guide v2: richer, still human

v1 kept feedback short so it wouldn't sound fake. The cost was that most answers were too thin to act on ("Too long." "Selfie failed."). v2 keeps the honesty rules but lets people say more, the way they do in a real interview, when it's in their character.

## 1. What makes feedback useful and still human

A useful comment usually has some of these. A short one might have one; a rich one has three or four.

| Ingredient | Example |
|---|---|
| What they did | "I took the photo by the window, then with the light on…" |
| What they expected | "I thought it would take my money straight away." |
| What actually happened | "It said 'image unclear' eight times." |
| Their situation | "I was in the taxi", "my data was almost finished", "the baby wanted to be in the picture" |
| What it cost them | twenty minutes, R30 taxi fare, a trip to the police station, asking their son |
| How it felt, in plain words | "I felt stupid", "I got scared", "I was happy" |
| A comparison | "Capitec just asks once." |
| A workaround | "I put my aunt's address in town." |

What still keeps it human:
- Spoken, plain words. No design vocabulary (the banned list is unchanged).
- One main point per comment. Rich answers tell a small story; they don't list issues like a report.
- People are allowed to be unsure, unfair, off-topic or contradictory.
- Suggestions are rare, and when they come they're in everyday terms: "Tell me at the start which papers I need", not "surface document requirements upfront".
- Not every step gets a comment. People talk about what hurt, what surprised them, and what they got stuck on.

## 2. Depth: new persona columns

`feedback_depth` (new) is each persona's natural answer length. It's drawn from their `feedback_style` and pulled shorter for Basic readers.

| Depth | Words | Share of pack | Who tends to have it |
|---|---|---|---|
| s (short) | 8–15 | 37% | Quiet, blunt |
| m (medium) | 20–45 | 42% | Most people |
| r (rich) | 50–110 | 21% | Chatty, complainers, suspicious people |

`max_feedback_words` has been widened to match. In v4 the average was about 14 words; it's now about 35. A persona leans to their own depth but isn't locked to it: someone medium will tell a longer story about the step that really hurt them.

## 3. Saying vs doing (unchanged, still important)

The engine records what each persona *did* (finished, struggled, quit) separately from what they *say*.
- Personas with `politeness_bias` High play things down about half the time: "It was fine, I'll finish later" after quitting at proof of address. These come flagged `played_down`.
- A comment never contradicts the outcome: nobody who quit says "it worked", and nobody who finished says "I'm still not done".
- The run summary counts people who said it was fine but struggled or quit. That gap is a finding in itself.

## 4. How the design review feeds in

Your platform's review describes each step with a `topic` and the problems and strengths it found. Use the tag names below; severity runs from 1 (minor) to 3 (severe).

**Steps (topics).** Use these as `topic`.
- Account opening: registration, personal_details, id_capture, selfie, otp, proof_of_address, employment_income, product_choice, fees, consent_terms, account_ready
- Payments: beneficiary, eft_payment, bills_airtime, cash_send, payment_confirmation
- Stokvels: stokvel_setup, stokvel_contributions, stokvel_payout, stokvel_records
- Anywhere: navigation, language_words, speed_data, errors_recovery, security_trust, help_support, look_feel

**Problem tags**, grouped by area:
- Effort: too_many_steps, retype, too_much_info, cluttered
- Speed: slow, data_heavy, wait_unclear
- Words: unclear_words, jargon, language, hidden_info
- Fees and limits: fees_unclear, upsell, limits
- Documents: doc_burden, date_rule, address_format, employment_mismatch, old_id
- Device: camera_fail, lighting, device_limit
- Verification: otp_fail, otp_confusing, network
- Errors: crash, lost_progress, error_unclear, blame, no_back
- Navigation: navigation
- Trust: trust_doubt, scam_fear, forced_consent, too_much_security
- Help: no_human
- Readability: small_text, low_contrast, keyboard, accessibility
- Account ready: card_collection, confirmation_missing
- Notifications: notification_spam
- Stokvels: reconciliation, approval_burden, edit_records, payment_timing, cross_bank, cash_gap
- Payments: electricity_fail, pop_format, interruptions

**Strength tags:** quick, simple, clear, guided, autofill, saved_progress, good_errors, feels_safe, fee_upfront, doc_alternative, relevant, confirmation_clear, virtual_card, repeat_payment, saved_meter, data_free, helpful_help, nice_look, large_text, search, reminder, examples

Each persona feels some problems more than others. Data-heavy screens hit prepaid users harder. Small text hits people over 60. Document demands hit people without proof of address and foreign nationals. Jargon hits Basic readers. That decides who struggles, who quits, and what they talk about.

## 5. Two ways to generate feedback

1. **Bank mode** (default, no LLM needed). Picks from 557 written lines, fills in personal details (their other bank, a family member, an amount that fits their income, where they were), sometimes adds a line about their situation, and adds a light home-language interjection now and then. It's fast and consistent, but large runs will show some repeated lines.
2. **LLM mode** (`--briefs`). For every comment the engine also writes a ready-to-send prompt containing:
   - the persona's life
   - what happened at that step
   - the design problems found there
   - their depth and honesty level
   - three matching bank lines as tone examples

   Send each prompt to your model and use the reply. Every answer is then new, and still tied to the simulation.

Run the same checks on LLM output as on bank output: banned words, word count against `max_feedback_words`, near-duplicates across a batch, and contradictions with the step outcome.

## 6. Sentiment targets for a run

There's no fixed mix any more. Sentiment follows the design: a review with severe document and camera problems should come out mostly negative. Sanity checks:
- Steps with only strengths should be mostly positive, but not 100%.
- People who quit should be mostly negative, except those who play it down.
- About 30–50% of answers to "what would you change?" should be "I don't know" or "nothing".

## 7. Limits to keep in mind

This is a simulation, not research. It's useful for spotting likely problem steps, comparing two designs, and checking that a design hasn't forgotten a group (grant recipients, foreign nationals, feature-phone users). It can't tell you how real people will react to something nobody has written a line about. New kinds of screens need new bank lines, and the strongest source for those is real interview notes.
