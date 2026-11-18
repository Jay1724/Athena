"""Regenerate src/pack.js (from data/persona_pack_v7_1_10000.csv) and src/kitbank.js (from kit/), then run build.py.
Usage: python tools/build_data.py"""
import csv, json, os, sys, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# kit bank
spec = importlib.util.spec_from_file_location("fe", os.path.join(ROOT, "kit", "feedback_engine.py")); fe = importlib.util.module_from_spec(spec); spec.loader.exec_module(fe)
rows = [[b["topic"], b["sentiment"], b["depth"], ",".join(b["fits"]), ",".join(b["tags"]), b["text"], int(b["implies_quit"]), int(b["implies_ok"])] for b in fe.load_bank()]
open(os.path.join(ROOT, "src", "kitbank.js"), "w", encoding="utf-8").write("// persona feedback kit v2: the feedback bank (topic, sentiment, depth, fits, tags, text, implies quit, implies ok)\nconst KBANK=" + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";\n")
# persona pack: selected columns only, no ID numbers, passports, emails, phone numbers or dates of birth
r = list(csv.DictReader(open(os.path.join(ROOT, "data", "persona_pack_v7_1_10000.csv"), encoding="utf-8")))
CAT = ["full_name","gender","home_language","citizenship","country_of_origin","province","area_type","prefers_home_language_in_app","relationship_status","employment_type","informal_work","grants_received","income_bracket_zar_pm","archetype","digital_comfort","phone_type","device_os","device_tier","data_situation","network_reliability","primary_bank","other_banks","uses_banking_app","existing_bank_customer","trust_in_banks","scam_anxiety","patience","help_seeking","channel_preference","accessibility_need","english_comfort","reading_level","mood_baseline","motivation","feedback_style","feedback_depth","politeness_bias","proof_of_address","id_document","stokvel_member","stokvel_role","experienced_fraud","when_stuck","main_quit_trigger","home_ownership","prior_failed_onboarding","financial_vulnerability"]
NUM = ["population_weight","represents_adults","age","household_size","minor_children","personal_income_zar_pm","max_feedback_words","return_later_pct"]
FIX = {"van": "van Wyk", "du": "du Plessis", "de": "de Villiers", "der": "van der Merwe", "le": "le Roux", "von": "von Wielligh"}  # the pack cuts some surnames to their first word
for x in r:
    w = x["full_name"].split(" ")
    if len(w) >= 2 and w[-1].lower() in FIX: x["full_name"] = " ".join(w[:-1]) + " " + FIX[w[-1].lower()]
dic = {c: sorted(set(x[c] for x in r)) for c in CAT}; idx = {c: {v: i for i, v in enumerate(dic[c])} for c in CAT}
data = [[idx[c][x[c]] for c in CAT] + [float(x[n]) if n == "population_weight" else int(float(x[n] or 0)) for n in NUM] for x in r]
js = "// persona pack v7.1: 10,000 South African personas (selected columns, dictionary-coded). No ID numbers, passports, emails or phone numbers.\nvar PACK_COLS=" + json.dumps(CAT + NUM) + ",PACK_DIC=" + json.dumps([dic[c] for c in CAT], ensure_ascii=False, separators=(",", ":")) + ",PACK_ROWS=" + json.dumps(data, separators=(",", ":")) + ";\n"
tail = open(os.path.join(ROOT, "src", "pack.js"), encoding="utf-8").read().split("\nvar PACK=", 1)[1]
open(os.path.join(ROOT, "src", "pack.js"), "w", encoding="utf-8").write(js + "var PACK=" + tail)
os.system(f'"{sys.executable}" "{os.path.join(ROOT, "build.py")}"')
