"""Render every bank template for many fitting personas -> a large browsable bank, plus the template bank as JSON."""
import csv, json, random, sys, collections
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import feedback_engine as fe

PACK = sys.argv[1]
personas = list(csv.DictReader(open(PACK, newline="", encoding="utf-8")))
bank = fe.load_bank()
eng = fe.Engine(bank=bank, seed=99)
rnd = random.Random(99)
T = [(p, fe.traits(p)) for p in personas]

json.dump([{k: v for k, v in b.items()} for b in bank], open("feedback_bank_templates.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)

rows, seen = [], set()
PER = 14
for b in bank:
    if b["topic"] in ("addon_lead", "addon_tail"): continue
    fit = [(p, t) for p, t in rnd.sample(T, 2500) if eng._fits(b, t)]
    for p, t in fit[:PER * 3]:
        if sum(1 for r in rows if r["base_id"] == b["id"]) >= PER: break
        sent = b["sentiment"]
        text = eng.render(b, p, t, sent, allow_addon=b["topic"] not in ("masked", "suggestion"))
        if text in seen: continue
        seen.add(text)
        rows.append({"text": text, "topic": b["topic"], "sentiment": {"P": "positive", "U": "neutral/mixed", "N": "negative"}.get(sent, sent),
                     "depth": {"s": "short", "m": "medium", "r": "rich"}[b["depth"]], "words": len(text.split()),
                     "design_tags": ", ".join(b["tags"]), "fits": ", ".join(b["fits"]) or "anyone",
                     "says_they_quit": "yes" if b["implies_quit"] else "", "says_it_worked": "yes" if b["implies_ok"] else "",
                     "base_id": b["id"], "example_persona": p["id"], "persona_age": p["age"], "persona_archetype": p["archetype"],
                     "persona_language": p["home_language"]})
with open("feedback_bank_expanded.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
flags = sum(1 for r in rows if fe.quality_issues(r["text"]))
print("templates", len(bank), "| expanded rows", len(rows), "| flags", flags)
print(collections.Counter(r["sentiment"] for r in rows))
print(collections.Counter(r["depth"] for r in rows))
