"""Synthetic persona feedback engine.

Takes a design review (journey steps + the issues and strengths the review found) and a sample of
personas, walks each persona through, and returns step comments, an overall comment, an answer to
"what would you change?" and a 1-5 rating, all chosen from the tagged feedback bank and adapted to
the persona's life.

Usage:
  python feedback_engine.py persona_pack.csv review.json --n 300 --seed 7 --out results
"""
import csv, json, math, os, random, re, sys, argparse, collections

HERE = os.path.dirname(os.path.abspath(__file__))
BANK_FILES = ["bank_onboarding.txt", "bank_payments_stokvel.txt", "bank_general.txt", "bank_more.txt"]
BANNED = ["seamless", "intuitive", "friction", "onboarding", "journey", "flow", " ux", " ui ", "navigate", "streamline",
          "user-friendly", "user friendly", "interface", "functionality", "frustrating", "experience was"]
DEPTHS = ["s", "m", "r"]
WORD_CAP = {"s": 15, "m": 45, "r": 110}

# ---------------------------------------------------------------- bank
def load_bank(paths=None):
    paths = paths or [os.path.join(HERE, f) for f in BANK_FILES]
    bank, topic = [], None
    for path in paths:
        for line in open(path, encoding="utf-8"):
            line = line.rstrip("\n")
            if line.startswith("## "): topic = line[3:].strip(); continue
            if not line.strip() or line.startswith("#"): continue
            s, d, fits, tags, text = line.split("|", 4)
            bank.append({"id": f"{topic}-{sum(1 for b in bank if b['topic'] == topic) + 1:03d}", "topic": topic,
                         "sentiment": s, "depth": d, "fits": [] if fits == "*" else fits.split(","),
                         "tags": [] if tags in ("-", "") else tags.split(","), "text": text.strip()})
    for b in bank:
        low = b["text"].lower()
        b["implies_quit"] = bool(QUIT_RE.search(low))
        b["implies_ok"] = bool(OK_RE.search(low)) and not b["implies_quit"] and (b["sentiment"] != "N" or bool(STRONG_OK_RE.search(low)))
    return bank

STRONG_OK_RE = re.compile(r"((?<!n't )(?<!never )\bworked\b|went through|account is open|it finished|said done|then it worked)")
QUIT_RE = re.compile(r"(i stopped|stopped there|gave up|give up|i'll go to the branch|still not done|so what do people|can't open the account|that's where i stopped|i stopped there|closed it|won't take it|i'm stuck|now i'm stuck|now i must wait|i went to the branch|had to go to the branch|i want to do this in a branch|wasn't for me|i'll finish later|finish it later|do it on the weekend|i'll get there|ask my son to help me finish|i've stopped)")
OK_RE = re.compile(r"(uploaded|fine\.$|\. fine\.|okay\.$|(?<!n't )(?<!never )\bworked\b|it's okay|normal app|normal\.|^okay|^fine|it's fine|was okay|ticked, next|answered\.|joined\.|paying works|got the confirmation|looks fine|it went through|took it|it worked|worked first time|went through|it was fine|was fine|it took it|done\b|finished in|it's done|easy\.|managed|lucky|account is open|account open|opened in|i was in\b|smooth|it's fine|took me a minute|quick|fast\b|no complaints|i liked|nice|then it worked|it did its thing)")

# ---------------------------------------------------------------- persona traits
def traits(p):
    t = set()
    dig = p.get("digital_comfort", "Medium"); age = int(p["age"]); inc = int(p.get("personal_income_zar_pm") or 0)
    t.add("low" if dig in ("Low", "Medium") else "high")
    if age >= 60: t.add("old")
    if age < 35: t.add("young")
    if p.get("grants_received"): t.add("grant")
    if p.get("employment_type") == "Informal" or p.get("informal_work"): t.add("informal")
    if p.get("citizenship") == "Foreign national": t.add("foreign")
    if p.get("phone_type", "Smartphone") != "Smartphone": t.add("feature")
    if inc >= 12000: t.add("prof")
    if inc < 2500: t.add("lowinc")
    if int(p.get("minor_children") or 0) > 0: t.add("parent")
    if p.get("stokvel_member") == "Yes": t.add("member")
    if p.get("stokvel_role") in ("Treasurer", "Chairperson", "Secretary"): t.add("treasurer")
    if p.get("area_type") == "Rural": t.add("rural")
    t.add("female" if p.get("gender") == "F" else "male")
    et = p.get("employment_type", "")
    if et in ("Salaried", "Contract", "Salaried + side hustle"): t.add("salaried")
    if et in ("Salaried", "Contract", "Salaried + side hustle", "Self-employed", "Informal"): t.add("working")
    if str(p.get("data_situation", "")).startswith("Prepaid"): t.add("prepaid")
    if p.get("scam_anxiety") == "High" or p.get("experienced_fraud") == "Yes": t.add("scam_fear")
    return t

def sensitive_tags(p, t):
    """Design problems this persona is likely to feel more than most."""
    s = set()
    if "prepaid" in t: s |= {"data_heavy", "data_free", "slow"}
    if "old" in t or p.get("accessibility_need") == "Vision": s |= {"small_text", "low_contrast", "large_text", "accessibility"}
    if p.get("device_tier") in ("Entry", "Basic") or "feature" in t: s |= {"camera_fail", "device_limit", "crash"}
    if p.get("proof_of_address") != "Yes" or "foreign" in t or "No valid" in p.get("id_document", ""): s |= {"doc_burden", "doc_alternative", "hidden_info"}
    if p.get("reading_level") == "Basic" or p.get("prefers_home_language_in_app") == "Yes": s |= {"jargon", "unclear_words", "language", "clear"}
    if "scam_fear" in t or p.get("trust_in_banks") == "Low": s |= {"scam_fear", "trust_doubt", "feels_safe", "forced_consent"}
    if p.get("patience") == "Low": s |= {"too_many_steps", "slow", "wait_unclear", "retype", "lost_progress"}
    if p.get("network_reliability") in ("Patchy", "Poor"): s |= {"otp_fail", "network", "lost_progress", "saved_progress"}
    if "lowinc" in t: s |= {"fees_unclear", "fee_upfront", "upsell"}
    if p.get("help_seeking") != "Self-service": s |= {"no_human", "helpful_help", "guided"}
    if "informal" in t: s |= {"employment_mismatch", "relevant", "cash_gap"}
    if "treasurer" in t: s |= {"reconciliation", "approval_burden", "edit_records"}
    return s

def depth_mix(p):
    if p.get("feedback_depth") in DEPTHS: base = {d: 1 if d == p["feedback_depth"] else .25 for d in DEPTHS}
    else:
        base = {"Short and blunt": {"s": 45, "m": 45, "r": 10}, "Quiet, says little": {"s": 60, "m": 35, "r": 5},
                "Chatty, wanders": {"s": 5, "m": 35, "r": 60}, "Complainer": {"s": 15, "m": 45, "r": 40},
                "Easy-going": {"s": 30, "m": 50, "r": 20}, "Suspicious": {"s": 20, "m": 50, "r": 30}}.get(p.get("feedback_style"), {"s": 30, "m": 45, "r": 25})
    if p.get("reading_level") == "Basic": base = {"s": base["s"] * 1.4, "m": base["m"], "r": base["r"] * .6}
    return base

# ---------------------------------------------------------------- slots & flavour
def family_word(p, rnd):
    opts = []
    if int(p["age"]) >= 50: opts += ["my son", "my daughter", "my grandson", "my granddaughter"]
    if int(p["age"]) < 35: opts += ["my sister", "my brother", "my cousin", "my friend"]
    if p.get("relationship_status") in ("Married", "Living with partner"): opts += ["my husband" if p["gender"] == "F" else "my wife"]
    opts += ["my neighbour", "my sister", "my niece"]
    return rnd.choice(opts)

def fill(text, p, rnd):
    inc = int(p.get("personal_income_zar_pm") or 0)
    other = [b for b in (p.get("other_banks") or "").split("; ") if b and "Postbank" not in b]
    other_bank = other[0] if other else rnd.choice(["Capitec", "FNB", "Absa", "TymeBank", "my old bank"])
    if other_bank == p.get("primary_bank"): other_bank = "my old bank"
    amount = rnd.choice([150, 200, 300, 350] if inc < 2500 else [500, 800, 1200] if inc < 12000 else [2000, 3500, 5000])
    slots = {"other_bank": other_bank, "family": family_word(p, rnd), "data_amount": rnd.choice(["R12", "R15", "R29", "R49", "1GB"]),
             "place": rnd.choice(["taxi", "queue at Shoprite", "kitchen", "bus", "clinic queue", "car while waiting"] + (["shop between customers"] if p.get("informal_work") else [])),
             "amount": f"{amount:,}", "minutes": rnd.choice(["twenty minutes", "half an hour", "almost an hour", "forty minutes"]),
             "bank": "the bank"}
    out = re.sub(r"\{(\w+)\}", lambda m: slots.get(m.group(1), m.group(0)), text)
    out = out.replace("R{amount}", f"R{slots['amount']}")
    return out

FLAVOUR = {
    "N": {"nguni": ["Eish,", "Haibo,", "Yho,"], "sotho": ["Eish,", "Aowa,", "Yho,"], "afr": ["Ag,", "Ag nee,", "Jislaaik,"], "en": ["Ag,", "Honestly,", "Eish,"], "other": ["Eish,"]},
    "U": {"nguni": ["Ja,", "Hmm,"], "sotho": ["Ja,", "Hmm,"], "afr": ["Ja nee,", "Ja,"], "en": ["Ja,", "Well,"], "other": ["Hmm,"]},
    "P": {"nguni": ["Sharp,", "Ja,"], "sotho": ["Sharp,", "Ja,"], "afr": ["Lekker,", "Ja,"], "en": ["Ja,", "Okay,"], "other": ["Okay,"]},
}
def lang_group(p):
    l = p.get("home_language", "")
    if l in ("isiZulu", "isiXhosa", "siSwati", "isiNdebele"): return "nguni"
    if l in ("Sesotho", "Setswana", "Sepedi", "Tshivenda", "Xitsonga"): return "sotho"
    if l == "Afrikaans": return "afr"
    if l == "English": return "en"
    return "other"

def lower_first(s):
    return s[0].lower() + s[1:] if s and not s.startswith("I ") and not s.startswith("I'") and not re.match(r"^[A-Z]{2}", s) and not s.split(" ")[0] in ("Capitec", "FNB", "Absa", "TymeBank", "OTP", "SASSA") else s

# ---------------------------------------------------------------- selection
class Engine:
    def __init__(self, bank=None, seed=0):
        self.bank = bank or load_bank()
        self.rnd = random.Random(seed)
        self.uses = collections.Counter()
        self.by_topic = collections.defaultdict(list)
        for b in self.bank: self.by_topic[b["topic"]].append(b)

    def _fits(self, b, t):
        return all(f in t for f in b["fits"])

    def pick(self, topic, sentiment, depth_w, t, want_tags, sens, fallback_topics=("errors_recovery", "overall"), outcome=None):
        for tp in (topic,) + tuple(fallback_topics):
            cands = [b for b in self.by_topic.get(tp, []) if b["sentiment"] == sentiment and self._fits(b, t)
                     and not (outcome == "quit" and b["implies_ok"]) and not (outcome == "ok" and b["implies_quit"])
                     and not any(w in b["text"].lower() for w in getattr(self, "_exclude", ()))]
            if not cands: continue
            ws = []
            for b in cands:
                tags = set(b["tags"])
                w = 1.0 + 3.0 * len(tags & want_tags) + 1.5 * len(tags & sens) + (2.5 if b["fits"] else 0)
                if want_tags and tags and not (tags & want_tags) and tp == topic: w *= .35     # speaks to a problem the design doesn't have
                w *= depth_w.get(b["depth"], .2)
                w /= (1 + 2.0 * self.uses[b["id"]])
                ws.append(w)
            b = self.rnd.choices(cands, ws)[0]
            self.uses[b["id"]] += 1
            return b
        return None

    ONB = {"registration", "personal_details", "id_capture", "selfie", "otp", "proof_of_address", "employment_income",
           "product_choice", "fees", "consent_terms", "account_ready", "overall"}
    def addon(self, kind, sentiment, t, topic=None):
        c = [b for b in self.by_topic[kind] if b["sentiment"] in (sentiment, "*") and self._fits(b, t)
             and not ("onb" in b["tags"] and topic not in self.ONB)]
        if not c: return None
        ws = [(2.5 if b["fits"] else 1) / (1 + self.uses[b["id"]]) for b in c]
        b = self.rnd.choices(c, ws)[0]; self.uses[b["id"]] += 1
        return b

    def render(self, b, p, t, sentiment, allow_addon=True, allow_flavour=True):
        rnd = self.rnd
        text = fill(b["text"], p, rnd)
        lead = tail = None
        if allow_addon and b["topic"] not in ("masked", "suggestion"):
            pr = .45 if b["depth"] == "r" else .15 if b["depth"] == "m" else 0
            if rnd.random() < pr:
                if rnd.random() < .5: lead = self.addon("addon_lead", sentiment, t, b["topic"])
                else: tail = self.addon("addon_tail", sentiment, t, b["topic"])
        if lead: text = fill(lead["text"], p, rnd) + " " + text
        if tail: text = text + " " + fill(tail["text"], p, rnd)
        text = text[0].upper() + text[1:]
        if allow_flavour and not lead and sentiment in FLAVOUR and rnd.random() < (.14 if sentiment != "P" else .07) and not text.startswith(("Eish", "Haibo", "Yho", "Ag", "Ja", "Sharp", "Lekker")):
            text = rnd.choice(FLAVOUR[sentiment][lang_group(p)]) + " " + lower_first(text)
        return text

    # ------------------------------------------------------------ simulation of one persona
    def run_persona(self, p, review):
        self._review = review
        rnd = self.rnd
        t = traits(p); sens = sensitive_tags(p, t); depth_w = depth_mix(p)
        polite = p.get("politeness_bias", "Medium"); style = p.get("feedback_style", "")
        patience = {"Low": 1.45, "Medium": 1.0, "High": .7}.get(p.get("patience"), 1.0)
        motiv = {"Low": 1.35, "Medium": 1.0, "High": .7}.get(p.get("motivation"), 1.0)
        steps_out, dropped_at, total_friction = [], None, 0.0
        for i, st in enumerate(review["steps"]):
            issues = {k: v for k, v in (st.get("issues") or {}).items()} if isinstance(st.get("issues"), dict) else {k: 2 for k in st.get("issues", [])}
            strengths = set(st.get("strengths", []))
            if st.get("applies_to") and not any(a in t for a in st["applies_to"]): continue
            fr = sum(sev * (2.2 if tag in sens else 1.0) for tag, sev in issues.items())
            fr -= .6 * len(strengths & sens)
            fr = max(fr, 0)
            total_friction += fr
            p_drop = 1 - math.exp(-.028 * fr * patience * motiv) + .005
            struggled = rnd.random() < 1 - math.exp(-.075 * fr)
            dropped = rnd.random() < p_drop
            if dropped and rnd.random() < p.get("_return_later", 0): dropped, struggled = False, True   # came back later
            steps_out.append({"step": st["name"], "topic": st["topic"], "issues": set(issues), "strengths": strengths,
                              "felt": set(issues) & sens, "struggled": struggled or dropped, "dropped": dropped})
            if dropped: dropped_at = st["name"]; break
        completed = dropped_at is None

        # which steps they talk about
        n_max = {"Quiet, says little": 1, "Short and blunt": 2, "Easy-going": 2, "Suspicious": 2, "Complainer": 3, "Chatty, wanders": 4}.get(style, 2)
        def talk_p(s):
            return .9 if s["dropped"] else .65 if s["struggled"] else .5 if s["felt"] else .3 if s["strengths"] else .1
        chosen = [s for s in steps_out if rnd.random() < talk_p(s)]
        chosen = sorted(chosen, key=lambda s: -talk_p(s))[:n_max]
        chosen.sort(key=lambda s: [x["step"] for x in steps_out].index(s["step"]))

        comments = []
        for s in chosen:
            if s["dropped"]: w = {"N": 85, "U": 15, "P": 0}
            elif s["struggled"]: w = {"N": 65, "U": 30, "P": 5}
            elif s["issues"] and s["strengths"]: w = {"N": 25, "U": 40, "P": 35}
            elif s["issues"]: w = {"N": 35 + 15 * bool(s["felt"]), "U": 40, "P": 15}
            elif s["strengths"]: w = {"N": 6, "U": 30, "P": 64}
            else: w = {"N": 15, "U": 50, "P": 35}
            if style == "Complainer": w["N"] *= 1.5; w["P"] *= .5
            if style == "Easy-going": w["P"] *= 1.4; w["N"] *= .7
            sent = rnd.choices(list(w), list(w.values()))[0]
            masked = False
            if sent == "N" and polite == "High" and rnd.random() < .45: sent, masked = "U", True
            want = s["issues"] if sent != "P" else s["strengths"]
            b = self.pick(s["topic"], sent, depth_w, t, want, sens, outcome=("ok" if not s["dropped"] else None if masked else "quit"))
            if not b: continue
            comments.append({"step": s["step"], "sentiment": sent, "played_down": masked, "text": self.render(b, p, t, sent),
                             "bank_id": b["id"], "tags": b["tags"]})
            if getattr(self, "make_briefs", False):
                rs = next(x for x in self._review["steps"] if x["name"] == s["step"])
                comments[-1]["llm_prompt"] = llm_brief(self, p, comments[-1], s, rs)

        # overall
        n_struggle = sum(s["struggled"] for s in steps_out)
        if not completed: ow = {"N": 72, "U": 28, "P": 0}
        elif n_struggle >= 2: ow = {"N": 45, "U": 45, "P": 10}
        elif n_struggle == 1: ow = {"N": 20, "U": 50, "P": 30}
        else: ow = {"N": 6, "U": 34, "P": 60}
        osent = rnd.choices(list(ow), list(ow.values()))[0]
        played_down = False
        if osent == "N" and polite == "High" and rnd.random() < .55:
            b = self.pick("masked", rnd.choice(["U", "U", "P"]), depth_w, t, set(), set(), fallback_topics=(), outcome=None if not completed else "ok") or self.pick("masked", "U", {"s": 1, "m": 1, "r": 1}, t, set(), set(), fallback_topics=()); played_down = True
            osent_shown = b["sentiment"]
        else:
            reached = {x["topic"] for x in steps_out}
            self._exclude = set()
            if not reached & {"id_capture", "selfie"}: self._exclude |= {"picture", "camera"}
            if "proof_of_address" not in reached: self._exclude |= {"papers"}
            b = self.pick("overall", osent, depth_w, t, set(), sens, fallback_topics=(), outcome="ok" if completed else "quit") or self.pick("overall", osent, depth_w, t, set(), sens, fallback_topics=())
            self._exclude = set(); osent_shown = osent
        overall = self.render(b, p, t, osent_shown, allow_addon=not played_down)

        # what would you change
        worst = collections.Counter()
        for s in steps_out:
            for tag in s["issues"]: worst[tag] += 2 if tag in s["felt"] else 1
            if s["dropped"]:
                for tag in s["issues"]: worst[tag] += 3
        if rnd.random() < (.5 if style in ("Quiet, says little", "Easy-going") else .3) or not worst:
            sb = self.pick("suggestion", "U", {"s": 1, "m": .3, "r": 0}, t, {"none"}, set(), fallback_topics=())
        else:
            top = [k for k, _ in worst.most_common(3)]
            cands = [x for x in self.by_topic["suggestion"] if set(x["tags"]) & set(top) and self._fits(x, t)]
            sb = self.rnd.choice(cands) if cands else self.pick("suggestion", "U", {"s": 1, "m": .5, "r": 0}, t, {"none"}, set(), fallback_topics=())
        suggestion = fill(sb["text"], p, rnd)

        # rating
        base = {"N": 2.0, "U": 3.1, "P": 4.2}[osent] + (.4 if completed else -.3) - .25 * n_struggle
        base += {"High": .7, "Medium": 0, "Low": -.4}.get(polite, 0)
        rating = int(min(5, max(1, round(base + rnd.gauss(0, .55)))))

        return {"persona_id": p["id"], "name": p["full_name"], "age": int(p["age"]), "archetype": p.get("archetype"),
                "digital_comfort": p.get("digital_comfort"), "income_bracket": p.get("income_bracket_zar_pm"),
                "completed": completed, "dropped_at": dropped_at, "steps_struggled": [s["step"] for s in steps_out if s["struggled"]],
                "true_feeling": osent, "played_down": played_down, "rating": rating,
                "step_comments": comments, "overall": overall, "what_would_you_change": suggestion}


# ---------------------------------------------------------------- LLM briefs
PROMPT = """You are {name}, {age}, living in a {area} area in {province}. Home language: {lang}; your English is {eng}. Reading level: {reading}.
Life: {work}. About R{income} a month{grants}. {household}. Phone: {phone}, data: {data}. Bank: {bank}.
How you talk: {style}. {politeness}

You just tried this step in a banking app: "{step}".
What happened to you there: {what_happened}
What the design review found on this step: {issues}

Say what you'd say to a researcher who asks "How was that part?"
- {depth_rule}
- Talk like you speak, plain everyday words. A bit of your home language is fine if it's natural for you; don't overdo it.
- Be specific: what you did, what you expected, what actually happened, how it made you feel, and what it cost you (time, data, money, a trip, someone's help). Mention your own life where it matters.
- You may be unsure, a bit unfair, off-topic, or contradict yourself. Don't be balanced or polite for the sake of it.
- Don't suggest a fix unless it just comes out naturally. Never sound like a designer.
- Never use these words: seamless, intuitive, friction, onboarding, journey, flow, UX, UI, navigate, streamline, user-friendly, interface, functionality, frustrating.
- Feeling to come through: {sentiment}.{masked}

Examples of how people talk about moments like this (for tone only, do not copy them or reuse their details):
{examples}

Reply with only what you'd say."""

def llm_brief(eng, p, comment, step_state, review_step):
    t = traits(p); sens = sensitive_tags(p, t)
    sent = comment["sentiment"]
    exs = [b for b in eng.by_topic.get(review_step["topic"], []) if b["sentiment"] == sent and eng._fits(b, t) and b["id"] != comment["bank_id"]]
    eng.rnd.shuffle(exs)
    exs = sorted(exs, key=lambda b: -len(set(b["tags"]) & (step_state["issues"] | sens)))[:3]
    ex_txt = "\n".join(f'- "{fill(b["text"], p, eng.rnd)}"' for b in exs) or '- "' + comment["text"] + '"'
    if step_state["dropped"]: wh = "You gave up here and didn't finish."
    elif step_state["struggled"]: wh = "You struggled here but got through."
    else: wh = "It went okay for you."
    felt = step_state["issues"] & sens
    if felt: wh += " The parts that hit you hardest: " + ", ".join(sorted(felt)).replace("_", " ") + "."
    d = p.get("feedback_depth", "m")
    depth_rule = {"s": "Keep it short, under 15 words.", "m": "Two to four sentences, 20 to 45 words.",
                  "r": "Tell it properly, like a small story, 50 to 110 words."}[d]
    grants = ("; you get " + p["grants_received"].replace(";", ",")) if p.get("grants_received") else ""
    hh = f"You live with {int(p['household_size']) - 1} other people" if int(p.get("household_size") or 1) > 1 else "You live alone"
    if int(p.get("minor_children") or 0): hh += f", including {p['minor_children']} child(ren) under 18"
    pol = {"High": "You tend to say things were fine even when they weren't.", "Low": "You say it straight, even if it's harsh.",
           "Medium": "You're fairly honest."}[p.get("politeness_bias", "Medium")]
    return PROMPT.format(name=p["full_name"], age=p["age"], area=p["area_type"].lower(), province=p["province"], lang=p["home_language"],
                         eng=p.get("english_comfort", "Comfortable").lower(), reading=p.get("reading_level", "Everyday").lower(),
                         work=p["employment_type"] + (f" ({p['informal_work'].lower()})" if p.get("informal_work") else ""),
                         income=f"{int(p['personal_income_zar_pm']):,}", grants=grants, household=hh,
                         phone=p.get("phone_type", "Smartphone").lower() + (f", {p['device_tier'].lower()} {p['device_os']}" if p.get("phone_type") == "Smartphone" else ""),
                         data=p.get("data_situation", "").lower(), bank=p.get("primary_bank", "None"),
                         style=p.get("feedback_style", "").lower(), politeness=pol, step=review_step["name"], what_happened=wh,
                         issues=", ".join(f"{k.replace('_', ' ')} (severity {v})" for k, v in (review_step.get("issues") or {}).items()) or "nothing major",
                         depth_rule=depth_rule, sentiment={"N": "negative", "U": "mixed or flat", "P": "positive"}[sent],
                         masked=" You actually had a worse time than you'll admit, so play it down." if comment.get("played_down") else "",
                         examples=ex_txt)

# ---------------------------------------------------------------- checks & summary
def quality_issues(text, depth=None):
    probs = []
    low = " " + text.lower() + " "
    for w in BANNED:
        if w in low: probs.append(f"banned word: {w.strip()}")
    if "{" in text: probs.append("unfilled slot")
    return probs

def summarise(results, review):
    n = len(results)
    steps = [s["name"] for s in review["steps"]]
    reached = collections.Counter(); drops = collections.Counter(); struggles = collections.Counter()
    for r in results:
        for s in steps:
            if r["dropped_at"] == s: drops[s] += 1; reached[s] += 1; break
            reached[s] += 1
        for s in r["steps_struggled"]: struggles[s] += 1
    funnel = []
    for s in steps:
        funnel.append({"step": s, "reached": reached[s], "dropped_here": drops[s], "struggled_here": struggles[s]})
    tag_mentions = collections.Counter(t for r in results for c in r["step_comments"] if c["sentiment"] != "P" for t in c["tags"])
    praise = collections.Counter(t for r in results for c in r["step_comments"] if c["sentiment"] == "P" for t in c["tags"])
    sent = collections.Counter(c["sentiment"] for r in results for c in r["step_comments"])
    texts = [c["text"] for r in results for c in r["step_comments"]] + [r["overall"] for r in results]
    by_arch = collections.defaultdict(list)
    for r in results: by_arch[r["archetype"]].append(r)
    seg = {a: {"n": len(v), "completed": round(sum(x["completed"] for x in v) / len(v), 2), "avg_rating": round(sum(x["rating"] for x in v) / len(v), 2)}
           for a, v in sorted(by_arch.items(), key=lambda kv: -len(kv[1]))}
    return {"personas": n, "completion_rate": round(sum(r["completed"] for r in results) / n, 3),
            "avg_rating": round(sum(r["rating"] for r in results) / n, 2),
            "said_fine_but_struggled_or_quit": sum(1 for r in results if r["played_down"] or (r["rating"] >= 4 and (r["dropped_at"] or r["steps_struggled"]))),
            "funnel": funnel, "comment_sentiment": dict(sent), "top_problems_mentioned": tag_mentions.most_common(10),
            "top_praise_mentioned": praise.most_common(6), "unique_comment_share": round(len(set(texts)) / max(len(texts), 1), 3),
            "quality_flags": sum(bool(quality_issues(x)) for x in texts), "by_archetype": seg}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pack"); ap.add_argument("review"); ap.add_argument("--n", type=int, default=300)
    ap.add_argument("--seed", type=int, default=7); ap.add_argument("--out", default="feedback_run")
    ap.add_argument("--weighted", action="store_true", help="sample personas by population_weight")
    ap.add_argument("--briefs", action="store_true", help="also write an LLM prompt per step comment")
    a = ap.parse_args()
    personas = list(csv.DictReader(open(a.pack, newline="", encoding="utf-8")))
    review = json.load(open(a.review, encoding="utf-8"))
    rnd = random.Random(a.seed)
    if review.get("audience"):
        aud = review["audience"]
        personas = [p for p in personas if all(str(p.get(k)) in (v if isinstance(v, list) else [v]) for k, v in aud.items())]
    weights = [float(p.get("population_weight", 1)) for p in personas] if a.weighted else None
    sample = rnd.choices(personas, weights, k=a.n) if weights else rnd.sample(personas, min(a.n, len(personas)))
    eng = Engine(seed=a.seed)
    eng.make_briefs = a.briefs
    results = []
    for p in sample:
        p = dict(p); p["_return_later"] = int(p.get("return_later_pct") or 30) / 100 * .5
        results.append(eng.run_persona(p, review))
    summary = summarise(results, review)
    if a.briefs:
        with open(a.out + "_llm_briefs.jsonl", "w", encoding="utf-8") as f:
            for r in results:
                for c in r["step_comments"]:
                    f.write(json.dumps({"persona_id": r["persona_id"], "step": c["step"], "sentiment": c["sentiment"],
                                        "bank_version": c["text"], "prompt": c.pop("llm_prompt")}, ensure_ascii=False) + "\n")
    json.dump({"review": review.get("name"), "summary": summary, "results": results}, open(a.out + ".json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(json.dumps(summary, indent=1, ensure_ascii=False)[:3000])

if __name__ == "__main__":
    main()
