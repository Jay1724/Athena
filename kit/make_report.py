import json, random, sys
# Usage: python make_report.py <run name without .json>   (the run must have been made with --briefs)
run = sys.argv[1]
d = json.load(open(run + '.json')); s = d['summary']; R = d['results']
L = [json.loads(x) for x in open(run + '_llm_briefs.jsonl')]
S = {'N':'negative','U':'mixed','P':'positive'}
out = ["# Sample run: account opening, concept B\n",
"200 personas, sampled by population weight from the v7.1 pack, using bank mode. The design review behind this run found severe proof-of-address demands, camera problems at ID scan and selfie, repeated questions, and a heavy download. It also credited guided ID capture, upfront fees and a virtual card.\n",
"This is a demonstration of the feedback engine on a made-up review, not a verdict on a real design.\n", "## Headline\n"]
cs = s['comment_sentiment']; tot = sum(cs.values())
out += [f"- **{s['completion_rate']:.0%} finished.** Average rating {s['avg_rating']} out of 5.",
        f"- **{s['said_fine_but_struggled_or_quit']} people said it was fine, or rated it 4 or 5, even though they struggled or quit.** That's the say-vs-do gap.",
        f"- **Step comments:** {cs.get('N',0)/tot:.0%} negative, {cs.get('U',0)/tot:.0%} mixed or flat, {cs.get('P',0)/tot:.0%} positive. {s['unique_comment_share']:.0%} were word-for-word unique, and none contradicted what the persona actually did.\n",
        "## Where people dropped\n", "| Step | Reached | Quit here | Struggled here |", "|---|---|---|---|"]
for f in s['funnel']: out.append(f"| {f['step']} | {f['reached']} | {f['dropped_here']} | {f['struggled_here']} |")
out += ["\n## What people complained about most\n", ", ".join(f"{t.replace('_',' ')} ({n})" for t, n in s['top_problems_mentioned'][:8]) + "\n",
        "## What they praised\n", ", ".join(f"{t.replace('_',' ')} ({n})" for t, n in s['top_praise_mentioned']) + "\n",
        "## By archetype (largest groups)\n", "| Archetype | People | Finished | Avg rating |", "|---|---|---|---|"]
for a, v in list(s['by_archetype'].items())[:8]: out.append(f"| {a} | {v['n']} | {v['completed']:.0%} | {v['avg_rating']} |")
out.append("\n## Ten personas, in their own words\n")
random.seed(8)
pick = [r for r in R if r['step_comments']]
chosen = random.sample([r for r in pick if r['dropped_at']], 5) + random.sample([r for r in pick if not r['dropped_at']], 5)
for r in chosen:
    status = f"quit at {r['dropped_at']}" if r['dropped_at'] else "finished"
    flag = ", played it down" if r['played_down'] or any(c['played_down'] for c in r['step_comments']) else ""
    out += [f"### {r['name']}, {r['age']} · {r['archetype']} · {r['digital_comfort']} digital · {r['income_bracket']}", f"*{status}, rated {r['rating']}/5{flag}*\n"]
    for c in r['step_comments']: out.append(f"- **{c['step']}** ({S[c['sentiment']]}): {c['text']}")
    out += [f"- **Overall:** {r['overall']}", f"- **What would you change?** {r['what_would_you_change']}\n"]
out += ["## What an LLM brief looks like\n", "With `--briefs`, every comment also gets a prompt like the one below. Send it to your model to get a fresh answer in the persona's voice, tied to what happened in the simulation.\n"]
ex = next(l for l in L if "Tell it properly" in l["prompt"] and l["sentiment"] == "N")
out += ["```\n" + ex["prompt"] + "\n```\n", f"The bank-mode answer for that same moment was: *\"{ex['bank_version']}\"*\n"]
open(run + '.md', 'w').write("\n".join(out))
