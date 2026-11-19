"""Build athena-offline.html: one file that runs with no internet.

It starts from simulator.html (run build.py first; this script does it for you), then:
- adds the Your data and Forecast tabs and the offline engines (data checks, forecast, validation, review),
- saves the Summary as PDF through the browser's own print dialog instead of online libraries,
- removes every link to the internet, and fails the build if one is left.
Usage: python3 build_offline.py
"""
import os, re, subprocess, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
subprocess.run([sys.executable, "build.py"], check=True, stdout=subprocess.DEVNULL)
h = open("simulator.html", encoding="utf-8").read()
P = lambda n: open("src/" + n, encoding="utf-8").read()

def rep(old, new, count=1):
    global h
    if old not in h:
        sys.exit(f"build_offline: couldn't find {old[:70]!r}")
    h = h.replace(old, new, count)

# header and title
h = re.sub(r"<title>.*?</title>", "<title>Athena Offline</title>", h, count=1, flags=re.S)
rep("<h1>Account Origination Simulator</h1>", "<h1>Athena Offline</h1>")
rep('<div class="sub">Test an onboarding journey before it goes to market.</div>',
    '<div class="sub">Test designs and forecast with your own data. Works without internet, and your data stays on this laptop.</div>')
h = re.sub(r'<div style="margin-top:6px;font-size:14px"><a id="aboutLnk".*?</script>', "", h, count=1, flags=re.S)
rep('<span class="chip ass" style="margin:0">MOCK DATA</span>', '<span class="chip ass" id="dataChip" style="margin:0">MOCK DATA</span>')
# tabs
rep('<div class="tabs"><button id="tbS" class="on">Summary</button>', '<div class="tabs"><button id="tbY">Your data</button><button id="tbA">Accounts</button><button id="tbS" class="on">Summary</button>')
rep('<button id="tbF">Feedback</button>', '<button id="tbF">Feedback</button><button id="tbP">Forecast</button>')
rep('<div class="wrap" id="tabS">', '<div class="wrap" id="tabY" style="display:none"><div id="dyRoot"></div></div>\n<div class="wrap" id="tabA" style="display:none"><div id="acRoot"></div></div>\n<div class="wrap" id="tabP" style="display:none"><div id="fpRoot"></div></div>\n<div class="wrap" id="tabS">')
rep('const TABS=[["summary","S"],', 'const TABS=[["data","Y"],["accounts","A"],["forecast","P"],["summary","S"],')
rep("function tab(t){", "window.tab=tab;function tab(t){")
rep('if(t==="design"&&window.drawDesign)window.drawDesign();', 'if(t==="design"&&window.drawDesign)window.drawDesign();if(t==="data"&&window.drawData)window.drawData();if(t==="accounts"&&window.drawAcc)window.drawAcc();if(t==="forecast"&&window.drawFc)window.drawFc();')
# offline engines, appended to the main script block (after voc.js, which ends the block)
blocks = list(re.finditer(r"<script>\n(.*?)</script>", h, re.S))
main = max(blocks, key=lambda b: len(b.group(1)))
extra = "\n".join(P(n) for n in ["offline_data.js", "offline_forecast.js", "offline_review.js", "offline_accounts.js", "offline_ui.js", "offline_init.js"])
h = h[:main.end(1)] + extra + "\n" + h[main.end(1):]
# styles
h = h.replace("</style>", P("offline.css") + "\n</style>", 1)
# PDF through the browser's print dialog
h = re.sub(r"async function savePdf\(btn\)\{", "async function savePdf(btn){window.print();return;", h, count=1)
h = re.sub(r'await loadJs\("https?://[^"]+"\);', "", h)
h = re.sub(r'<script src="https?://[^"]*"></script>', "", h)
# no internet links may remain (the SVG namespace is not a request)
left = [u for u in re.findall(r'https?://[^\s"\'<>)]+', h) if not u.startswith("http://www.w3.org/")]
if left:
    sys.exit("build_offline: online links left: " + ", ".join(sorted(set(left))[:8]))
open("athena-offline.html", "w", encoding="utf-8").write(h)
print("athena-offline.html", len(h))
