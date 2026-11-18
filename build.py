import re,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
h=open('index.html').read();P=lambda n:open('src/'+n).read()
# journey markup
ja=h.index('<div class="wrap" id="tabJ">')+len('<div class="wrap" id="tabJ">')
jc=h.index('<div class="wrap" id="tabC"')
jinner=h[ja:jc]
jend=jinner.rstrip().rfind('</div>')
h=h[:ja]+"\n"+P('journey.html').rstrip("\n")+"\n"+jinner[jend:]+h[jc:]
# commercial markup: tabC wrap content
ca=h.index('<div class="wrap" id="tabC"');cb=h.index('>',ca)+1
# find end of tabC: the first '</div>\n<script>' after ca
ce=h.index('<script>',ca)
inner=h[cb:ce]
tail_idx=inner.rstrip().rfind('</div>')
h=h[:cb]+"\n"+P('commercial.html').rstrip("\n")+"\n"+inner[tail_idx:]+h[ce:]
# theme
h=re.sub(r'/\*THEME\*/.*?/\*END THEME\*/\s*','',h,flags=re.S)
if os.path.exists('src/theme.css'):
    h=h.replace('</style>','/*THEME*/\n'+P('theme.css')+'\n/*END THEME*/\n</style>',1)
bl=list(re.finditer(r'<script>\n(.*?)</script>',h,re.S))
new=[P('journey.js')+"\n"+P('journey_ui.js')+"\n"+P('flow.js')+"\n"+P('personas.js')+"\n"+P('summary.js')+"\n"+P('design.js')+"\n"+P('voice.js')+"\n"+P('voc.js'),P('model.js'),P('ui.js')]
for b,n in reversed(list(zip(bl,new))):
    h=h[:b.start(1)]+n.rstrip("\n")+"\n"+h[b.end(1):]
open('index.html','w').write(h)
print(len(h))
