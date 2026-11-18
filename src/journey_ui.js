// ===== Journey UI (guided) =====
const $=id=>document.getElementById(id);
const f=n=>Math.round(n).toLocaleString("en-US");
const pc=(a,b)=>b?(100*a/b).toFixed(1)+"%":"0%";
const cur=()=>PRODUCTS[SEL];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tblJ=(h,rows)=>`<div class="scroll"><table><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
const TAGLBL={none:"Other",select:"Choosing a product",elig:"Eligibility check",details:"Personal details",idcap:"ID capture",verify:"Identity check",fica:"Proof of address or income",decision:"Credit or risk decision",sign:"Terms and signing",activate:"First transaction"};
const IDEAS=[
 {k:"soft",n:"Soft Banking Profile (progressive onboarding)",d:"Customers create a light profile first. Identity and proof checks come later, with the profile already saved and easy to resume.",tags:["details","idcap","verify","fica","decision","sign"]},
 {k:"reuse",n:"Reuse a verified identity (One ID)",d:"Existing customers skip ID capture, identity check and proof of address.",tags:["idcap","verify","fica"]},
 {k:"instant",n:"Instant ID check",d:"ID capture and the identity check fail less often and take less time.",tags:["idcap","verify"]},
 {k:"fields",n:"Shorter form with prefill",d:"Fewer fields to type, with details filled in from what the bank already knows.",tags:["details"]},
 {k:"fica",n:"Automatic proof of address and income",d:"Most people no longer upload documents.",tags:["fica"]},
 {k:"decision",n:"Instant decision",d:"People get an answer straight away instead of waiting.",tags:["decision"]},
 {k:"resume",n:"Save and come back later",d:"People who pause can pick up where they left off.",tags:null},
 {k:"nudge",n:"First-transaction nudges",d:"Prompts that help new customers make their first payment or deposit.",tags:["activate"]},
 {k:"guide",n:"Clearer wording and help on every screen",d:"Plain language, one-line reasons for each ask, and help next to the field.",tags:null,all:true},
 {k:"trust",n:"Reassurance at the anxious moments",d:"Say why a check or confirmation is needed, what happens next and what to do if it fails.",tags:["idcap","verify","decision","sign"]},
 {k:"speed",n:"Faster screens",d:"Screens load and respond quickly, with progress shown on any wait.",tags:null,all:true},
 {k:"redirect",n:"Redirect ineligible people to a better-suited account",d:"People who fail the eligibility check are offered another account instead of being turned away.",tags:["elig"]}];
const IGEN={reuse:["Skip what the bank already knows","Known customers skip capture, checks and uploads the bank already holds."],instant:["Faster, more reliable checks","Capture and security checks fail less often and take less time."],fields:["Shorter form with prefill","Fewer fields to type, with details filled in from what the bank already knows."],fica:["No document uploads","Most people no longer need to upload a document."],decision:["Instant answer","People get an answer straight away instead of waiting."]};
const iTxt=i=>cur().standalone&&IGEN[i.k]?{n:IGEN[i.k][0],d:IGEN[i.k][1]}:i;
const STR={light:.35,medium:.65,strong:.9};
let IDEA={on:{},str:{}},CUSTOM={k:0,red:0,skip:"none",set:-1};

function setL(){IDEAS.forEach(i=>{L[i.k]=IDEA.on[i.k]?STR[IDEA.str[i.k]||"medium"]:0})}
function changed(){const p=cur();return Object.values(L).some(v=>v>0)||p.steps.some(s=>s.delta||s.dtime||s.skip!=="none")}

function buildStatic(){
 const T=[["arr","Simulated customers per day",200,5000,100],["days","Days to simulate",7,60,1]];
 $("traffic").innerHTML=T.map(([k,t,a,b,s])=>`<div><label>${t}<span id="tv_${k}">${P[k]}</span></label><input type="range" min="${a}" max="${b}" step="${s}" value="${P[k]}" id="ti_${k}"></div>`).join("")+`<div class="note">More simulated customers gives smoother results. It does not change the percentages.</div><div class="btns"><button id="reroll">Re-roll the random seed</button></div>`;
 T.forEach(([k])=>{$("ti_"+k).oninput=e=>{P[k]=+e.target.value;$("tv_"+k).textContent=P[k];run()}});
 $("reroll").onclick=()=>{P.seed=Math.floor(Math.random()*9999);run()};
 $("vb").onclick=()=>{snapView="b";$("vb").className="on";$("vs").className="";drawSnap()};
 $("vs").onclick=()=>{snapView="s";$("vs").className="on";$("vb").className="";drawSnap()};
 $("tslider").oninput=()=>{drawSnap();drawDaily()};
 $("hmRate").onclick=()=>{hmMode="rate";$("hmRate").className="on";$("hmLost").className="";drawHeat()};
 $("hmLost").onclick=()=>{hmMode="lost";$("hmLost").className="on";$("hmRate").className="";drawHeat()};
 $("hmBase").onclick=()=>{hmView="b";$("hmBase").className="on";$("hmScen").className="";drawHeat()};
 $("hmScen").onclick=()=>{hmView="s";$("hmScen").className="on";$("hmBase").className="";drawHeat()};
 $("hmBase").className="";
 $("jSel").onchange=e=>{SEL=+e.target.value;selStep=0;resetChanges();drawAll()};
 $("jParse").onclick=doParse;
 $("jTpl").onclick=()=>{$("jCsv").value=TEMPLATE};
 $("jCopyTpl").onclick=()=>{try{navigator.clipboard.writeText(TEMPLATE)}catch(x){}$("jCsv").value=TEMPLATE};
 $("jDemo").onclick=()=>{PRODUCTS=[...mockProducts(),...PRODUCTS.filter(p=>p.src==="data"&&!p.mock)];SEL=0;PREV=null;$("jPrev").innerHTML="";resetChanges();drawAll()};
 $("jFile").onchange=e=>{const fl=e.target.files[0];if(!fl)return;const r=new FileReader();r.onload=()=>{$("jCsv").value=String(r.result);doParse()};r.readAsText(fl)};
 $("mAdd").onclick=()=>{MAN.push({n:"",r:"",f:""});drawMan()};
 $("mUse").onclick=useManual;
 $("iAll").onclick=()=>{IDEAS.filter(i=>affected(i)).forEach(i=>{IDEA.on[i.k]=true;IDEA.str[i.k]=IDEA.str[i.k]||"medium"});setL();drawIdeas();run()};
 $("iClear").onclick=resetChanges;
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{const el=$(b.dataset.go);if(el&&el.scrollIntoView)el.scrollIntoView({behavior:"smooth",block:"start"})});
}
function resetChanges(){IDEA={on:{},str:{}};CUSTOM={k:0,red:0,skip:"none",set:-1};PRODUCTS.forEach(p=>p.steps.forEach(s=>{s.delta=0;s.dtime=0;s.skip="none"}));setL();drawIdeas();drawCustom();if(BASE){drawStepEd();run()}}
const TEMPLATE=`product,month,persona,step,entered,completed
Current account,2026-07,New to bank,Choose account,4000,3600
Current account,2026-07,New to bank,Personal details,3600,3050
Current account,2026-07,New to bank,ID capture,3050,2560
Current account,2026-07,New to bank,Identity verification,2560,2050
Current account,2026-07,New to bank,FICA documents,2050,1380
Current account,2026-07,New to bank,Risk decision,1380,1270
Current account,2026-07,New to bank,T&Cs and e-sign,1270,1160
Current account,2026-07,New to bank,First transaction,1160,780
Current account,2026-07,Existing customer,Choose account,3000,2760
Current account,2026-07,Existing customer,Personal details,2760,2570
Current account,2026-07,Existing customer,ID capture,2570,2380
Current account,2026-07,Existing customer,Identity verification,2380,2160
Current account,2026-07,Existing customer,FICA documents,2160,1830
Current account,2026-07,Existing customer,Risk decision,1830,1710
Current account,2026-07,Existing customer,T&Cs and e-sign,1710,1570
Current account,2026-07,Existing customer,First transaction,1570,1190`;

// ---------- manual entry ----------
let MAN=[{n:"Choose account",r:"",f:""},{n:"Personal details",r:"",f:""},{n:"ID check",r:"",f:""},{n:"Open account",r:"",f:""}];
function drawMan(){
 $("jMan").innerHTML=`<div class="scroll"><table><tr><th>Step (in order)</th><th>People who reached it</th><th>People who finished it</th><th></th></tr>`+MAN.map((m,i)=>`<tr><td><input type="text" data-man="n" data-i="${i}" value="${esc(m.n)}" placeholder="Step name" style="width:150px;padding:5px;border:1px solid var(--line);border-radius:6px;font:inherit"></td><td><input type="number" data-man="r" data-i="${i}" value="${m.r}" min="0" placeholder="e.g. 5000" style="width:100px;padding:5px;border:1px solid var(--line);border-radius:6px;font:inherit"></td><td><input type="number" data-man="f" data-i="${i}" value="${m.f}" min="0" placeholder="e.g. 4300" style="width:100px;padding:5px;border:1px solid var(--line);border-radius:6px;font:inherit"></td><td>${MAN.length>2?`<button data-mdel="${i}" style="padding:2px 8px">✕</button>`:""}</td></tr>`).join("")+`</table></div>`;
}
function useManual(){
 const rows=MAN.filter(m=>m.n.trim()||m.r!==""||m.f!=="");const err=[];
 if(rows.length<2)err.push("Add at least two steps.");
 rows.forEach((m,i)=>{const r=+m.r,fi=+m.f;if(!m.n.trim())err.push(`Row ${i+1}: add a step name.`);else if(m.r===""||m.f===""||!isFinite(r)||!isFinite(fi)||r<0||fi<0)err.push(`${m.n}: enter both numbers.`);else if(fi>r)err.push(`${m.n}: more people finished than reached it.`)});
 if(err.length){$("jPrev").innerHTML=`<div class="banner down">${err.slice(0,4).map(esc).join("<br>")}</div>`;return}
 const name=$("mName").value.trim()||"My product",pr={order:rows.map(m=>m.n.trim()),no:{},months:[],personas:[],rows:rows.map(m=>({step:m.n.trim(),mo:"",pe:"",e:+m.r,c:+m.f,med:null}))};
 PREV={data:{[name]:pr},tags:{[name]:{}},posts:{[name]:{}},hold:false};
 pr.order.forEach((s,i)=>{const g=guessTag(s);PREV.tags[name][s]=g;PREV.posts[name][s]=g==="activate"&&i===pr.order.length-1});
 renderPrev([]);
}

// ---------- run ----------
function run(){
 const prod=cur();BASE=simJ(prod,Object.assign(ZERO(),{base:1}),P);SCEN=simJ(prod,L,P);
 const ts=$("tslider");ts.max=SCEN.H-1;if(+ts.value>SCEN.H-1)ts.value=SCEN.H-1;
 if(selStep>=prod.steps.length)selStep=0;
 $("hmCmp").style.display=changed()?"":"none";
 drawSoftCmp();drawSummary();drawForecast("fc");drawForecast("fc3");drawFinds();drawHeat();drawFunnel();drawReasons();drawResults();drawKpis();drawValid();drawDaily();drawSnap();if(FLOW_READY)drawFlow();if(XTRA_READY){drawSum();drawCust()}saMode();
}
function drawAll(){cmpAll();drawProduct();drawIdeas();drawCustom();drawMan();drawStepEd();drawPersEd();run()}
function drawProduct(){
 const opt=(p,i)=>`<option value="${i}" ${i===SEL?"selected":""}>${esc(p.name)}</option>`;
 $("jSel").innerHTML=PRODUCTS.map((p,i)=>opt(p,i)).join("");
 const p=cur();if($("jName"))$("jName").textContent=p.name;
 if(p.design){$("jBadge").innerHTML=`<span class="chip ass">DESIGN UNDER TEST</span><div class="hint">Predicted from ${esc(p.base)}. Not measured.</div>`;$("jFacts").innerHTML=`<details class="legend"><summary>How this prediction is made</summary><ul class="notesul">${p.facts.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></details>`}
 else if(p.src==="template"){$("jBadge").innerHTML=`<span class="chip ass">STARTING POINT</span><div class="hint">${esc(p.tier)}. Illustrative numbers. Load your own to replace them.</div>`;
  $("jFacts").innerHTML=`<details class="legend"><summary>What is publicly known about this account</summary><ul style="font-size:13px;margin:6px 0 0 18px;padding:0">${p.facts.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><div class="note">From standardbank.co.za. Requirements and prices change, so check the current pages.</div></details>`}
 else{const n=p.obs.cal[0]?p.obs.cal[0].e:0;
  $("jBadge").innerHTML=`<div class="big">${f(n)}</div><div class="hint" style="margin:0 0 8px">people who started${p.months.length?`, over ${p.months.length} month${p.months.length>1?"s":""}`:""}</div><span class="chip sim">${p.mock?"MOCK DATA":p.example?"FUNNEL DATA":"YOUR DATA"}</span>${p.hold?`<div class="hint">Latest month (${esc(p.hold)}) kept aside to test the model.</div>`:""}${p.edited?`<div class="hint">You have edited some numbers since loading.</div>`:""}`;
  let h="";
  if(p.notes&&p.notes.length)h+=`<details class="legend"><summary>Notes on this data</summary><ul class="notesul">${p.notes.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></details>`;
  if(p.actuals){const a=p.actuals,mm=MO_LBL;const to=a.opened.reduce((x,y)=>x+y,0),ta=a.active.reduce((x,y)=>x+y,0);
   h+=`<details class="legend"><summary>Accounts opened and active, month by month (${esc(a.label)})</summary>`+tblJ(["Month","Opened","Active","Activation ratio"],a.opened.map((o,i)=>[mm[i],f(o),f(a.active[i]),(a.active[i]/o*100).toFixed(0)+"%"]).concat([["<b>Total</b>",f(to),f(ta),(ta/to*100).toFixed(0)+"%"]]))+`<div class="btns"><button id="bizUse">Use these numbers in Business impact</button></div><div class="note">Sets the Traditional (today's onboarding) activation rate to what the simulator shows for this account today, and the active customer rate to the activation ratio above.</div></details>`}
  $("jFacts").innerHTML=h}
}

const MO_LBL=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"];

// ---------- simple charts ----------
function hb(label,val,max,color,txt,sub){const w=max>0?Math.max(val/max*100,val>0?1.5:0):0,cls=/red/.test(color)?"hot":/9aa3b5|7b8497/.test(color)?"mute":"";
 return `<div style="margin:9px 0"><div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span>${label}</span><span style="color:var(--mut);white-space:nowrap">${sub||""}</span></div><div class="hbt"><i class="${cls}" style="width:${w}%"></i><b style="color:${w>22?"#fff":"var(--ink)"};${w>22?"":"left:calc("+w+"% + 10px)"}">${txt}</b></div></div>`}
const AVC=["#ff9f0a","#0071e3","#34c759","#af52de","#ff453a","#30b0c7","#a2845e","#ff375f"];
function av(name){const w=String(name).replace(/^The\s+/i,"").replace(/[^A-Za-z0-9 ]/g," ").trim().split(/\s+/),ini=((w[0]||"?")[0]+(w[1]?w[1][0]:"")).toUpperCase();let hsh=0;for(const c of String(name))hsh=(hsh*31+c.charCodeAt(0))>>>0;return `<span class="av" style="background:${AVC[hsh%AVC.length]}">${esc(ini)}</span>`}
var LKSEL=null,LKP="",VOC_READY=false;
function drawSummary(){
 const p=cur(),n=BASE.cust.length,K=p.steps.length,ch=changed();
 const rows=p.steps.map((s,k)=>({s,k,lost:BASE.fail[k]/n*100,att:BASE.att[k],rate:BASE.att[k]>0?BASE.fail[k]/BASE.att[k]:0,el:s.tag==="elig"})).filter(x=>x.att>0);
 {const okk=k=>k!=null&&k<p.steps.length&&BASE.att[k]>0&&BASE.fail[k]>0;if(LKP!==p.name||!okk(LKSEL)){LKP=p.name;const c=rows.filter(x=>!x.el&&!x.s.post).sort((a,b)=>b.lost-a.lost)[0];LKSEL=c?c.k:null}}
 const fix=rows.filter(x=>!x.el).slice().sort((a,b)=>b.lost-a.lost),top=new Set(fix.slice(0,2).map(x=>x.k)),mx=Math.max(...rows.map(x=>x.lost),1);
 const prs=p.personas.map((pe,j)=>({n:pe.name,r:BASE.perp[j].n>0?BASE.perp[j].opened/BASE.perp[j].n*100:0,sh:BASE.perp[j].n/n*100})).filter(x=>x.sh>=1.5).sort((a,b)=>a.r-b.r);
 const open=BASE.openN/n*100,lo=prs[0];
 const lostTot=100-open;
 $("sumK").innerHTML=[[open.toFixed(0)+" in 100","open an account (the end of the bars below)"],[fix[0]?fix[0].lost.toFixed(0)+" in 100":"-","lost at "+(fix[0]?esc(fix[0].s.name):"-")+" (the longest red bar below)"],[lo&&prs.length>1?lo.r.toFixed(0)+" in 100":"-",lo&&prs.length>1?esc(lo.n)+", the lowest (see Who gets through)":"lowest persona"]].map(([v,l])=>`<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join("");
 const main=rows.filter(x=>!x.s.post),after=rows.filter(x=>x.s.post);
 $("chLeak").innerHTML=`<div style="font-size:13px;margin:4px 0"><b>100 people start</b></div>`
  +main.map(x=>`<div class="lk${x.k===LKSEL?" on":""}" data-lk="${x.k}" role="button" tabindex="0" aria-label="Why people leave ${esc(x.s.name)}">`+hb(esc(x.s.name),x.lost,mx,x.el?"#9aa3b5":top.has(x.k)?"var(--red)":"var(--blue)",x.lost.toFixed(0)+" of the 100 are lost here",x.el?"not eligible, design can't fix":(x.rate*100).toFixed(0)+" in 100 who reach it leave")+`</div>`).join("")
  +`<div style="font-size:13px;margin:8px 0;padding:8px 10px;background:#eef0f5;border-radius:8px"><b>${lostTot.toFixed(0)} of the 100 are lost along the way, so ${open.toFixed(0)} open an account.</b></div>`
  +(after.length?`<div style="font-size:13px;margin:10px 0 2px"><b>After they open</b></div>`+after.map(x=>`<div class="lk${x.k===LKSEL?" on":""}" data-lk="${x.k}" role="button" tabindex="0">`+hb(esc(x.s.name),x.rate*100,100,"#8e8e93",(x.rate*100).toFixed(0)+" in 100 never do",`that is about ${x.lost.toFixed(0)} of the original 100`)+`</div>`).join(""):"")
  +`<div class="note"><b>Tap a step to hear why people left it.</b> <span style="color:var(--amber);font-weight:600">Orange</span> marks the two biggest leaks you can design for. Bars compare steps by how many of the original 100 each one loses, so they add up to ${lostTot.toFixed(0)}. The right-hand figure shows the same step as a share of only the people who reach it, which is why it is bigger.</div>`;
 let show=prs;if(prs.length>9)show=[...prs.slice(0,6),...prs.slice(-3)];
 $("chPers").innerHTML=prs.length>1?show.map(x=>hb(av(x.n)+esc(x.n),x.r,Math.max(...prs.map(y=>y.r),1),"var(--blue)",x.r.toFixed(0),x.sh.toFixed(0)+"% of starters")).join("")+(prs.length>9?`<div class="note">Showing the 6 lowest and 3 highest of ${prs.length}. All of them are in the heat map under Detailed views.</div>`:"")+(p.personaSrc==="data"?"":`<div class="note">Differences between personas are assumptions until you add persona data.</div>`):`<div class="note">Everyone is treated as one group. Add personas under Advanced to see who struggles.</div>`;
 if(VOC_READY)drawVoc();
}
// ---------- forecast ----------
function fcSeries(p){
 const t=p.obs&&p.obs.trend&&p.obs.trend.length>=2?p.obs.trend:null;
 if(!t&&p.design){const b=PRODUCTS.find(x=>x.name===p.base&&!x.design);if(b&&b.obs&&b.obs.trend){const F=fcSeries(b),r=BASE.openN/BASE.cust.length;return{hist:[],mo:[],st:F.st,r:[r,r,r],sig:F.sig,assumed:true}}}
 if(!t){const st=(P.arr||0)*30,r=BASE.openN/BASE.cust.length;return{hist:[],mo:[],st:[st,st,st],r:[r,r,r],sig:.08,assumed:true}}
 const S=t.map(x=>x.e),Y=t.map(x=>x.c),R=t.map(x=>x.e>0?x.c/x.e:0);
 let lvl=S[0];for(let i=1;i<S.length;i++)lvl=.5*S[i]+.5*lvl;
 const d=[];for(let i=1;i<S.length;i++)d.push(S[i]-S[i-1]);const sl=d.slice(-4).reduce((a,b)=>a+b,0)/Math.max(1,d.slice(-4).length);
 const st=[1,2,3].map(h=>Math.max(0,lvl+sl*(.85*(1-Math.pow(.85,h))/.15)*.6));
 const rr=R.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3,R.length);
 const rel=[];for(let i=1;i<Y.length;i++)if(Y[i-1]>0)rel.push((Y[i]-Y[i-1])/Y[i-1]);
 const m=rel.reduce((a,b)=>a+b,0)/Math.max(1,rel.length),sig=Math.max(.06,Math.sqrt(rel.reduce((a,b)=>a+(b-m)*(b-m),0)/Math.max(1,rel.length)));
 return{hist:Y,mo:t.map(x=>x.month),st,r:[rr,rr,rr],sig,assumed:false};
}
const MNAMES=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fcLabels(mo){const m=(mo[mo.length-1]||"").match(/^(\d{4})-(\d{2})/);if(!m)return["Month 1","Month 2","Month 3"];let y=+m[1],k=+m[2]-1;return[1,2,3].map(()=>{k++;if(k>11){k=0;y++}return MNAMES[k]})}
function histLabels(mo){return mo.map(x=>{const m=x.match(/^(\d{4})-(\d{2})/);return m?MNAMES[+m[2]-1]:x})}
function drawForecast(id){
 const el=$(id);if(!el)return;const p=cur(),ch=changed();
 if(id==="fc3"&&!ch){el.innerHTML=`<div class="note">Switch on an idea above to see this.</div>`;return}
 const F=fcSeries(p),ob=BASE.openN/BASE.cust.length,os=SCEN.openN/SCEN.cust.length,ratio=ob>0?os/ob:1;
 const base=F.st.map((s,i)=>s*F.r[i]),scen=base.map(v=>v*ratio);
 const band=base.map((v,i)=>v*F.sig*1.28*Math.sqrt(i+1));
 const H=F.hist.slice(-8),HL=histLabels(F.mo).slice(-8),FL=fcLabels(F.mo);
 const all=[...H,...base.map((v,i)=>v+band[i]),...(ch?scen:[])],mx=Math.max(...all,1)*1.12;
 const W=640,Ht=230,m={l:44,r:46,t:12,b:26},nx=H.length+3,x=i=>m.l+(W-m.l-m.r)*(nx>1?i/(nx-1):0),y=v=>m.t+(Ht-m.t-m.b)*(1-v/mx);
 const nk=v=>v>=1000?(v/1000).toFixed(v>=10000?0:1)+"k":Math.round(v);
 let g="";for(let i=0;i<=3;i++){const v=mx/1.12*i/3;g+=`<line x1="${m.l}" x2="${W-m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e5e8ef"/><text x="${m.l-6}" y="${y(v)+4}" font-size="10" text-anchor="end" fill="#5b6478">${nk(v)}</text>`}
 const lab=[...HL,...FL];lab.forEach((l,i)=>{g+=`<text x="${x(i)}" y="${Ht-8}" font-size="10" text-anchor="middle" fill="${i>=H.length?"#0071e3":"#5b6478"}">${esc(l)}</text>`});
 const hn=H.length,pts=(arr,off)=>arr.map((v,i)=>`${x(off+i)},${y(v)}`);
 if(hn){g+=`<polyline points="${pts(H,0).join(" ")}" fill="none" stroke="#1d1d1f" stroke-width="2.5"/>`;H.forEach((v,i)=>g+=`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#1d1d1f"/>`)}
 const st0=hn?hn-1:0,pre=hn?[H[hn-1]]:[],ba=[...pre,...base],up=[...pre,...base.map((v,i)=>v+band[i])],lw=[...pre,...base.map((v,i)=>Math.max(0,v-band[i]))];
 const P2=a=>a.map((v,i)=>`${x(st0+i)},${y(v)}`);
 g+=`<polygon points="${[...P2(up),...P2(lw).reverse()].join(" ")}" fill="#9aa3b5" opacity=".25"/>`;
 g+=`<polyline points="${P2(ba).join(" ")}" fill="none" stroke="#8e8e93" stroke-width="2.5" stroke-dasharray="5 4"/>`;
 if(ch){g+=`<polyline points="${P2([...pre,...scen]).join(" ")}" fill="none" stroke="#0071e3" stroke-width="3"/>`;scen.forEach((v,i)=>g+=`<circle cx="${x(hn+i)}" cy="${y(v)}" r="3.5" fill="#0071e3"/>`)}
 const rv=v=>v<1000?Math.round(v):Math.round(v/10)*10;
 const dn=base.map((v,i)=>Math.max(0,v-band[i])),upv=base.map((v,i)=>v+band[i]);
 base.forEach((v,i)=>{const cx=x(hn+i);g+=`<text x="${cx}" y="${y(upv[i])-6}" font-size="10" text-anchor="middle" fill="#1f9d55">${f(rv(upv[i]))}</text><text x="${cx}" y="${y(dn[i])+14}" font-size="10" text-anchor="middle" fill="#d70015">${f(rv(dn[i]))}</text><text x="${cx}" y="${y(v)-8}" font-size="11" font-weight="700" text-anchor="middle" fill="#1d1d1f">${f(rv(v))}</text>`});
 const tb=base.reduce((a,b)=>a+b,0),ts=scen.reduce((a,b)=>a+b,0),sd=dn.reduce((a,b)=>a+b,0),su=upv.reduce((a,b)=>a+b,0);
 const act=p.actuals?(()=>{const a=p.actuals,k=Math.min(3,a.opened.length),o=a.opened.slice(-k).reduce((x,y)=>x+y,0),ac=a.active.slice(-k).reduce((x,y)=>x+y,0);return o>0?ac/o:null})():null;
 const row=(l,arr,t,c)=>[`<span style="color:${c};font-weight:600">${l}</span>`,...arr.map(v=>f(rv(v))),`<b>${f(rv(t))}</b>`];
 const rows=[row("Upside",upv,su,"#1f9d55"),row("Base",base,tb,"#1d1d1f"),row("Downside",dn,sd,"#d70015")];
 if(ch){rows.push(row("With changes, upside",upv.map(v=>v*ratio),su*ratio,"#1f9d55"),row("With changes, base",scen,ts,"#0071e3"),row("With changes, downside",dn.map(v=>v*ratio),sd*ratio,"#d70015"))}
 el.innerHTML=`<div class="leg"><span><b style="background:#1d1d1f"></b>What happened</span><span><b style="background:#8e8e93"></b>Next 3 months, base</span><span><b style="background:#9aa3b5;opacity:.5"></b>Downside to upside</span>${ch?`<span><b style="background:#0071e3"></b>With my changes</span>`:""}</div>
 <svg viewBox="0 0 ${W} ${Ht}" style="width:100%;height:auto;display:block">${g}</svg>
 <div class="note" style="margin:4px 0 8px">Accounts opened per month. Green is the upside, red the downside, black the base.</div>`
 +tblJ(["Accounts opened",...FL,"3 months"],rows)
 +`<div class="ins" style="margin-top:8px"><div>Over the next 3 months at today's flow: <b>${f(rv(tb))}</b> accounts opened in the base case, between <b>${f(rv(sd))}</b> and <b>${f(rv(su))}</b>.${act!=null?` At the recent ${(act*100).toFixed(0)}% activation ratio, about <b>${f(rv(tb*act))}</b> become active.`:""}</div>${ch?`<div>With your changes the base case is <b>${f(rv(ts))}</b>, which is <b>${ts>=tb?"+":"−"}${f(rv(Math.abs(ts-tb)))}</b> ${ts>=tb?"more":"fewer"} accounts${act!=null?` and about ${f(rv(Math.abs(ts-tb)*act))} ${ts>=tb?"more":"fewer"} active customers`:""}.</div>`:""}</div>
 <div class="note">${F.assumed?`There is no history for this product, so this assumes about ${f(F.st[0])} people start each month, with no growth.`:`Built from ${F.hist.length} months of history: starts follow the recent trend and conversion stays near the last 3 months.`} The range is the likely spread, not a promise. It leaves out launches, campaigns and seasonality.</div>`;
}

// ---------- findings ----------
const per100=(x,n)=>n>0?100*x/n:0;
function drawFinds(){
 const p=cur(),n=BASE.cust.length,K=p.steps.length,post=p.steps.findIndex(s=>s.post),items=[];
 const open=per100(BASE.openN,n),done=per100(BASE.doneN,n);
 items.push(`Out of every 100 people who start, <b>${open.toFixed(0)}</b> open an account${post>=0?` and <b>${done.toFixed(0)}</b> go on to make a first transaction`:""}.`);
 const ek=p.steps.findIndex(s=>s.tag==="elig"),inelN=ek>=0?BASE.inel[ek]:0;
 const leaks=p.steps.map((s,k)=>({s,k,lost:BASE.fail[k],att:BASE.att[k]})).filter(x=>x.att>0&&x.lost>0&&!x.s.post&&x.s.tag!=="elig").sort((a,b)=>b.lost-a.lost);
 if(leaks[0]){const a=leaks[0];items.push(`<b>Biggest leak: ${esc(a.s.name)}.</b> ${per100(a.lost,a.att).toFixed(0)} of every 100 people who reach it leave. That costs you ${per100(a.lost,n).toFixed(0)} of every 100 who start.`);
  if(leaks[1]){const b=leaks[1];items.push(`Next is <b>${esc(b.s.name)}</b>, where ${per100(b.lost,b.att).toFixed(0)} in 100 leave.`)}}
 if(inelN>0){const ip=p.personas.map((pe,j)=>({pe:pe.name,r:BASE.perp[j].n>0?BASE.perp[j].inel/BASE.perp[j].n:0,n:BASE.perp[j].n})).filter(x=>x.n>=n*.02).sort((a,b)=>b.r-a.r)[0];
  items.push(`<b>${per100(inelN,n).toFixed(0)}</b> in 100 who start <b>aren't eligible</b>. Design can't change that, but the product can point them to an account they do qualify for.${p.personas.length>1&&ip&&ip.r>.05?` Most affected: <b>${esc(ip.pe)}</b> (${(ip.r*100).toFixed(0)} in 100).`:""}`)}
 if(p.personas.length>1){
  let best=null;p.personas.forEach((pe,j)=>p.steps.forEach((s,k)=>{const a=BASE.perp[j].att[k];if(!s.post&&s.tag!=="elig"&&a>=n*.02&&BASE.att[k]>0){const r=BASE.perp[j].fail[k]/a,o=BASE.fail[k]/BASE.att[k];if(!best||r>best.r)best={pe:pe.name,s:s.name,r,o}}}));
  if(best)items.push(`<b>${esc(best.pe)}</b> customers struggle most at <b>${esc(best.s)}</b>: ${(best.r*100).toFixed(0)} in 100 leave, compared with ${(best.o*100).toFixed(0)} in 100 overall.`);
  const rates=p.personas.map((pe,j)=>({pe:pe.name,r:BASE.perp[j].n>0?BASE.perp[j].opened/BASE.perp[j].n:0,n:BASE.perp[j].n})).filter(x=>x.n>=n*.02).sort((a,b)=>a.r-b.r);
  if(rates.length>1&&rates[rates.length-1].r-rates[0].r>.02)items.push(`Only <b>${(rates[0].r*100).toFixed(0)}</b> in 100 <b>${esc(rates[0].pe)}</b> customers open an account, against <b>${(rates[rates.length-1].r*100).toFixed(0)}</b> in 100 <b>${esc(rates[rates.length-1].pe)}</b> customers.`)}
 if(post>=0&&BASE.att[post]>0)items.push(`Of the people who do open an account, <b>${per100(BASE.fail[post],BASE.att[post]).toFixed(0)}</b> in 100 never make a first transaction.`);
 let note="";
 if(p.personaSrc==="assumed")note=`<div class="banner warn">The differences between personas here are <b>assumptions</b>, not measured. Load data that includes a persona column to confirm them.</div>`;
 else if(p.personaSrc==="none")note=`<div class="banner warn">Everyone is treated as one group. To see who drops off, add personas under Advanced, or load data with a persona column.</div>`;
items.splice(5);
 $("finds").innerHTML=`<div class="ins">${items.map(t=>`<div>${t}</div>`).join("")}</div>`+note;
}
function drawHeat(){
 const p=cur(),R=hmView==="s"?SCEN:BASE;let mx=0;const cell=[];
 p.personas.forEach((_,j)=>{cell[j]=p.steps.map((_,k)=>{const a=R.perp[j].att[k],fl=R.perp[j].fail[k];const v=hmMode==="rate"?(a>0?fl/a:null):fl;if(v!=null&&v>mx)mx=v;return{v}})});
 let h=`<div class="scroll"><table><tr><th>Persona</th>${p.steps.map(s=>`<th style="font-size:11px;min-width:64px">${esc(s.name)}</th>`).join("")}<th>Opens an account</th></tr>`;
 p.personas.forEach((pe,j)=>{
  h+=`<tr><td>${esc(pe.name)}<div class="lbl">${pc(R.perp[j].n,R.cust.length)} of people</div></td>`;
  cell[j].forEach(c=>{if(c.v==null){h+=`<td style="color:#aaa">skipped</td>`;return}
   const al=mx>0?Math.min(.85,c.v/mx*.85):0;h+=`<td style="background:rgba(214,69,61,${al.toFixed(2)});color:${al>.5?"#fff":"var(--ink)"}">${hmMode==="rate"?(c.v*100).toFixed(0)+"%":f(c.v)}</td>`});
  h+=`<td><b>${pc(R.perp[j].opened,R.perp[j].n)}</b></td></tr>`});
 $("heat").innerHTML=h+`</table></div><div class="note">Darker red means more people leave. ${hmMode==="rate"?"Each number is the share of people who reach that step and then leave.":"Each number is how many people left at that step."}</div>`;
}
function drawFunnel(){
 const p=cur(),b=BASE,s=SCEN,n=s.cust.length,nb=b.cust.length,ch=changed();
 $("fLeg").innerHTML=ch?`<span><b style="background:var(--grey)"></b>Today</span><span><b style="background:var(--blue)"></b>With my changes</span><span>Tap a step to see why people leave it</span>`:`<span>Share of everyone who started. Tap a step to see why people leave it.</span>`;
 const rows=[{l:"Started",b:nb,s:n}];
 p.steps.forEach((st,k)=>rows.push({l:st.name,k,b:b.entered[k],s:s.entered[k],db:b.att[k]>0?b.fail[k]/b.att[k]:null,ds:s.att[k]>0?s.fail[k]/s.att[k]:null,skip:s.skip[k],rec:s.rec[k]}));
 rows.push({l:"Finished everything",b:b.doneN,s:s.doneN});
 $("funnel").innerHTML=rows.map(r=>{const eb=r.b/nb*100,es=r.s/n*100;
  return `<div class="row ${r.k===selStep&&r.k!=null?"sel":""}" ${r.k!=null?`data-k="${r.k}"`:""}><div class="nm">${esc(r.l)}</div><div>
  <div class="bar"><div style="width:${eb}%;background:${ch?"var(--grey)":"var(--blue)"}"></div><em style="color:${!ch&&eb>30?"#fff":"var(--ink)"}">${eb.toFixed(0)}%</em></div>
  ${ch?`<div class="bar"><div style="width:${es}%;background:var(--blue)"></div><em style="color:${es>30?"#fff":"var(--ink)"}">${es.toFixed(0)}%</em></div>`:""}
  <div class="lbl">${r.k!=null?`${r.db==null?"n/a":(r.db*100).toFixed(0)+" in 100 leave here"+(ch?" today, "+(r.ds==null?"n/a":(r.ds*100).toFixed(0))+" with changes":"")}`:""}${r.skip?` · ${f(r.skip)} skip this step`:""}${r.rec?` · ${f(r.rec)} came back after a pause`:""}</div></div></div>`}).join("");
 $("funnel").onclick=e=>{const r=e.target.closest(".row");if(!r||r.dataset.k==null)return;selStep=+r.dataset.k;drawFunnel();drawReasons()};
}
function drawReasons(){
 const p=cur(),k=selStep,st=p.steps[k];$("rtitle").textContent="Why do they leave “"+st.name+"”?";
 if(!st.reasons){$("reasons").innerHTML=`<div class="note">Your numbers show where people leave, not why. Add findings from exit surveys, session recordings or support tickets to explain this step.</div>`;return}
 const keys=new Set([...Object.keys(BASE.why[k]),...Object.keys(SCEN.why[k])]),nb=BASE.cust.length,n=SCEN.cust.length,ch=changed();
 $("reasons").innerHTML=tblJ(["Reason",ch?"Today":"People",...(ch?["With changes"]:[])],[...keys].sort((a,b)=>(BASE.why[k][b]||0)-(BASE.why[k][a]||0)).map(r=>[esc(r),f((BASE.why[k][r]||0)/nb*n),...(ch?[f(SCEN.why[k][r]||0)]:[])]))+`<div class="note">These reasons are guesses, not measured.</div>`;
}

// ---------- ideas ----------
function affected(i){const p=cur();if(p.standalone&&["soft","nudge","redirect"].includes(i.k))return null;if(!i.tags)return i.all?"Every screen":"Every step where people pause";const names=p.steps.filter(s=>i.tags.includes(s.tag)).map(s=>s.name);return names.length?names.join(", "):null}
// what each fix is worth on its own, at a medium effect: one extra run per fix, cached per flow
var IVAL={k:"",v:null,busy:false};
function ideaVals(){const p=cur(),key=p.name+"|"+BASE.cust.length+"|"+BASE.openN;if(IVAL.k===key)return IVAL.v;
 if(!IVAL.busy){IVAL.busy=true;setTimeout(()=>{try{const v={};IDEAS.filter(i=>affected(i)).forEach(i=>{const S=simJ(p,Object.assign(ZERO(),{[i.k]:STR.medium,base:1}),P);v[i.k]=(S.openN-BASE.openN)/S.cust.length*1000});IVAL={k:key,v,busy:false}}catch(e){IVAL.busy=false}drawIdeas()},40)}return null}
function drawIdeas(){
 // only ideas that can act on this flow are shown; an idea left on from another flow is switched off
 let off=false;IDEAS.forEach(i=>{if(!affected(i)&&IDEA.on[i.k]){IDEA.on[i.k]=false;off=true}});if(off)setL();
 const V=BASE?ideaVals():null,list=IDEAS.filter(i=>affected(i)).slice();if(V)list.sort((a,b)=>(V[b.k]||0)-(V[a.k]||0));
 const top=V?list[0]&&list[0].k:null;
 $("ideas").innerHTML=list.map(i=>{const on=!!IDEA.on[i.k],aff=affected(i),t=iTxt(i),v=V?V[i.k]:null;
  const val=v==null?`<span class="iv wait">Working it out…</span>`:`<span class="iv${v>0.05?"":" flat"}">${v>0.05?"+"+(v>=10?v.toFixed(0):v.toFixed(1)):"About 0"}<small>accounts opened per 1,000 who start</small></span>`;
  return `<div class="ix${on?" on":""}"><label class="ix-l"><input type="checkbox" data-idea="${i.k}" ${on?"checked":""}><div class="ix-b"><div class="ix-t"><b>${esc(t.n)}</b>${i.k===top&&v>0.05?'<span class="chip ix-top">BIGGEST GAIN</span>':""}</div><div class="ix-d">${esc(t.d)}</div><div class="ix-a">Affects: ${esc(aff)}</div></div>${val}</label>
  ${on?`<div class="ix-s">How well does it work? <select data-istr="${i.k}">${[["light","Slightly"],["medium","Fairly well"],["strong","Very well"]].map(([v,l])=>`<option value="${v}" ${(IDEA.str[i.k]||"medium")===v?"selected":""}>${l}</option>`).join("")}</select></div>`:""}</div>`}).join("");
 drawIBar();if(typeof goalSwap==="function")goalSwap($("tabJ"));
}
// a result bar that stays on screen while fixes are ticked
function drawIBar(){const el=$("iBar");if(!el||!BASE||!SCEN)return;const n=BASE.cust.length,a=per100(BASE.openN,n),b=per100(SCEN.openN,SCEN.cust.length),g=(SCEN.openN/SCEN.cust.length-BASE.openN/n)*1000;
 const on=IDEAS.filter(i=>IDEA.on[i.k]&&affected(i)).length,ch=changed();
 el.className="ibar"+(ch?" on":"");
 el.innerHTML=ch?`<div><b>${on?on+(on===1?" fix":" fixes"):"Your change"}: ${b.toFixed(1)}%</b> of people who start open an account, up from ${a.toFixed(1)}% <span class="${g>=0?"up":"dn"}">(${g>=0?"+":"−"}${f(Math.abs(g))} per 1,000)</span></div><button class="linkbtn" id="iSee">Full results ↓</button>`
  :`<div><b>Today: ${a.toFixed(1)}%</b> of people who start open an account. Tick a fix to see the difference.</div>`;
 if(typeof goalSwap==="function")goalSwap(el)}
// the step's quit rate today, from the baseline run
function stepQuit(k){if(!BASE)return null;let n=0,q=0;BASE.cust.forEach(c=>{if(c.path&&c.path.some(x=>x.k===k)){n++;if(c.status==="drop"&&c.dropK===k)q++}});return n?q/n:null}
var CVAL={k:"",v:null};
function customVal(){const p=cur(),s=p.steps[CUSTOM.k];if(!s||!BASE||(!CUSTOM.red&&CUSTOM.skip==="none"))return null;const key=p.name+"|"+CUSTOM.k+"|"+CUSTOM.red+"|"+CUSTOM.skip+"|"+BASE.openN;if(CVAL.k===key)return CVAL.v;
 const S=simJ(p,ZERO(),P);CVAL={k:key,v:(S.openN-BASE.openN)/S.cust.length*1000};return CVAL.v}
const cvHtml=v=>v==null?"":`<div class="iv${v>0.05?"":" flat"}">${v>0.05?"+"+(v>=10?v.toFixed(0):v.toFixed(1)):"About 0"}<small>accounts opened per 1,000 who start</small></div>`;
function cuHint(){const q=stepQuit(CUSTOM.k);if(q==null)return"";const now=Math.round(q*100),aft=Math.round(q*(1-CUSTOM.red/100)*100);return CUSTOM.red?`From ${now} in 100 who reach this step quitting today to ${aft} in 100.`:`Today ${now} in 100 who reach this step quit here.`}
function updCustom(){const a=$("cuVal"),b=$("cuQ");if(a)a.innerHTML=cvHtml(customVal());if(b)b.textContent=cuHint();if(typeof goalSwap==="function")goalSwap($("custom"))}
function drawCustom(){
 const p=cur(),v=customVal();
 $("custom").innerHTML=`<div class="cu-h"><div><b>Or test your own fix on one step</b><div class="hint" style="margin:2px 0 0">For a fix that isn't in the list. Choose a step and say how much better your fix makes it.</div></div>
 <div id="cuVal">${cvHtml(v)}</div></div>
 <div class="fld"><span>Step</span><select id="cuK">${p.steps.map((s,k)=>`<option value="${k}" ${k===CUSTOM.k?"selected":""}>${esc(s.name)}</option>`).join("")}</select></div>
 <label>Cut the people who quit here by <span id="cuV">${CUSTOM.red}%</span></label><input type="range" id="cuR" min="0" max="80" step="5" value="${CUSTOM.red}">
 <div class="hint" id="cuQ" style="margin:2px 0 8px">${cuHint()}</div>
 <div class="fld"><span>Remove this step for</span><select id="cuS">${[["none","Nobody"],["existing","Existing customers"],["all","Everyone"]].map(([v,l])=>`<option value="${v}" ${CUSTOM.skip===v?"selected":""}>${l}</option>`).join("")}</select></div>`;
}
function applyCustom(){
 const p=cur();if(CUSTOM.set>=0&&p.steps[CUSTOM.set]){p.steps[CUSTOM.set].delta=0;p.steps[CUSTOM.set].skip="none"}
 const s=p.steps[CUSTOM.k];s.delta=-CUSTOM.red;s.skip=CUSTOM.skip;CUSTOM.set=CUSTOM.k;drawStepEd();run();updCustom();
}
function drawResults(){
 drawIBar();
 if(!changed()){$("results").innerHTML=`<div class="note" style="margin-top:10px">Switch on an idea above to see how many more people would finish and who benefits.</div>`;return}
 const p=cur(),n=SCEN.cust.length,gain=(SCEN.openN-BASE.openN)/n*1000,pts=(SCEN.openN-BASE.openN)/n*100;
 const rows=p.personas.map((pe,j)=>{const a=BASE.perp[j].n>0?BASE.perp[j].opened/BASE.perp[j].n:0,b=SCEN.perp[j].n>0?SCEN.perp[j].opened/SCEN.perp[j].n:0;return{pe:pe.name,a,b,d:b-a}}).sort((x,y)=>y.d-x.d);
 const top=rows[0],good=gain>=0;
 $("results").innerHTML=`<div class="win ${good?"":"bad"}"><b>${gain>=0?"+":"−"}${f(Math.abs(gain))}</b> accounts opened for every 1,000 people who start<span>${per100(BASE.openN,n).toFixed(1)}% today → ${per100(SCEN.openN,n).toFixed(1)}% with your changes (${pts>=0?"+":"−"}${Math.abs(pts).toFixed(1)} points)</span></div>
 ${SCEN.redir>0?`<div class="note" style="margin:6px 0"><b>${f(SCEN.redir/n*1000)}</b> of every 1,000 who start are ineligible and get pointed to another account. They aren't counted as openings of this account.</div>`:""}
 ${p.personas.length>1&&top?`<div class="note" style="margin:6px 0">Biggest winner: <b>${esc(top.pe)}</b> (${top.d>=0?"+":"−"}${Math.abs(top.d*100).toFixed(1)} points).${p.personaSrc==="data"?"":" Persona differences are assumed."}</div>`:""}`
 +`<details style="margin:6px 0"><summary style="cursor:pointer;font-size:13px;color:var(--blue)">Results by persona</summary>`+tblJ(["Persona","Opens an account today","With changes","Change"],rows.map(r=>[esc(r.pe),(r.a*100).toFixed(1)+"%",(r.b*100).toFixed(1)+"%",`<span class="${r.d>=0?"up":"dn"}" style="font-weight:600">${r.d>=0?"+":"−"}${Math.abs(r.d*100).toFixed(1)} pts</span>`]))+`</details>`
 +`<div class="btns"><button id="goBiz">See what this is worth (business impact)</button></div>`;
}
function medianTime(R){const v=R.cust.filter(c=>c.open>=0).map(c=>c.open-c.start).sort((a,b)=>a-b);return v.length?v[Math.floor(v.length/2)]*1440:0}
function delta(a,b,fmt,goodUp=true){const d=b-a;if(Math.abs(d)<1e-9)return"";const up=d>0;return `<i class="${up===goodUp?"up":"dn"}">${up?"▲":"▼"} ${fmt(Math.abs(d))} vs today</i>`}
function profN(R){const p=cur(),kyc=p.steps.findIndex(s=>["idcap","verify","fica","decision"].includes(s.tag));if(kyc<0)return null;return R.cust.filter(c=>c.dropK<0||c.dropK>=kyc).length}
let SOFTSTR="medium";
// Business impact takes its rates and volumes from the selected flow, once per flow and strength
let BIZKEY="",SOFTC={k:""};
// A design tested on its own is not an account-opening flow: swap the wording and hide the account-only parts
const GSW=[[/open an account/g,"finish the flow"],[/Accounts opened per 100/g,"People who finish, per 100"],[/Accounts opened/g,"People who finish"],[/accounts opened/g,"people who finish"],[/Opens an account/g,"Finishes the flow"],[/before the account opens/g,"in the flow"],[/extra accounts/g,"extra completions"],[/in 100 open\b/g,"in 100 finish"],[/^(\d+) open$/,"$1 finish"],[/Account opened/g,"Finished"]];
function goalSwap(root){if(!root||!document.createTreeWalker)return;const on=!!cur().standalone,w=document.createTreeWalker(root,4);let nd;while(nd=w.nextNode()){if(nd.__o==null){if(!on)continue;nd.__o=nd.nodeValue}let t=nd.__o;if(on)GSW.forEach(r=>{t=t.replace(r[0],r[1])});if(nd.nodeValue!==t)nd.nodeValue=t}}
function saMode(){const sa=!!cur().standalone;goalSwap($("tabJ"));["softCmp","fc","fc3"].forEach(id=>{const e=$(id),b=e&&(e.closest(".bt")||e);if(b)b.style.display=sa?"none":""});
 const tb=$("tbC");if(tb){tb.style.display=sa?"none":"";if(sa&&tb.className==="on")$("tbS").click()}}
function softRuns(p){const k=p.name+"|"+BASE.cust.length+"|"+BASE.openN;if(SOFTC.k!==k){const run=s=>simJ(p,Object.assign(ZERO(),{soft:s}),P);SOFTC={k,light:run(STR.light),medium:run(STR.medium),strong:run(STR.strong)}}return SOFTC}
function bizSync(force){
 if(!window.__C||!BASE||cur().standalone)return;const p=cur(),key=p.name+"|"+p.src;if(key===BIZKEY&&!force)return;BIZKEY=key;
 const n=BASE.cust.length,ob=BASE.openN/n,F=fcSeries(p),SR=softRuns(p),rate=s=>{const S=s===STR.light?SR.light:s===STR.medium?SR.medium:SR.strong;return S.openN/S.cust.length};
 const sg=Math.min(.5,1.28*(F.sig||.08)),a=p.actuals,ar=a?+(a.active.reduce((x,y)=>x+y,0)/a.opened.reduce((x,y)=>x+y,0)*100).toFixed(1):null;
 const g=F.st[0]>0&&F.st[2]>0?(Math.sqrt(F.st[2]/F.st[0])-1)*100:0,pc2=x=>+(x*100).toFixed(2);
 window.__C.sync({name:p.name,illus:p.src==="template"||!!p.mock,trad:[pc2(ob*(1-sg)),pc2(ob),pc2(Math.min(1,ob*(1+sg)))],soft:[pc2(rate(STR.light)),pc2(rate(STR.medium)),pc2(rate(STR.strong))],ar,visitors:Math.max(100,Math.round(F.st[0]/10)*10),growth:+g.toFixed(1)});
}
function drawSoftCmp(){
 const el=$("softCmp");if(!el)return;const p=cur(),T=BASE,n=T.cust.length,S=simJ(p,Object.assign(ZERO(),{soft:STR[SOFTSTR]}),P),ns=S.cust.length;
 const post=p.steps.findIndex(x=>x.post),pr=profN(T),ps=profN(S);
 const rows=[["Start",100,100]];if(pr!=null)rows.push(["Profile created",pr/n*100,ps/ns*100]);rows.push(["Account opened",T.openN/n*100,S.openN/ns*100]);if(post>=0)rows.push(["First transaction",T.doneN/n*100,S.doneN/ns*100]);
 const pair=(l,a,b)=>`<div style="margin:9px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${l}</span><span><b>${a.toFixed(0)}</b> → <b style="color:var(--blue)">${b.toFixed(0)}</b>${l==="Start"?"":` <span class="${b>=a?"up":"dn"}" style="font-weight:700">${b>=a?"+":"−"}${Math.abs(b-a).toFixed(0)}</span>`}</span></div>
  <div class="bar" style="height:9px;margin-top:3px"><div style="width:${a}%;background:var(--grey)"></div></div><div class="bar" style="height:9px;margin-top:3px"><div style="width:${b}%;background:var(--blue)"></div></div></div>`;
 const ob=T.openN/n,os=S.openN/ns,F=fcSeries(p),b3=F.st.map((x,i)=>x*F.r[i]).reduce((x,y)=>x+y,0),s3=b3*(ob>0?os/ob:1);
 const gain=(os-ob)*1000,wins=p.personas.map((pe,j)=>({n:pe.name,d:(S.perp[j].n>0?S.perp[j].opened/S.perp[j].n:0)-(T.perp[j].n>0?T.perp[j].opened/T.perp[j].n:0),sh:T.perp[j].n/n})).filter(x=>x.sh>=.02).sort((a,b)=>b.d-a.d);
 el.innerHTML=`<div class="fld"><span>How well does it work?</span><select id="softStr">${[["light","Slightly"],["medium","Fairly well"],["strong","Very well"]].map(([v,l])=>`<option value="${v}" ${SOFTSTR===v?"selected":""}>${l}</option>`).join("")}</select></div>
 <div class="leg"><span><b style="background:var(--grey)"></b>Traditional</span><span><b style="background:var(--blue)"></b>Soft Banking Profile</span></div>
 ${rows.map(r=>pair(...r)).join("")}
 <div class="ins"><div>For every 1,000 people who start, the Soft Banking Profile opens about <b>${f(Math.abs(gain))}</b> ${gain>=0?"more":"fewer"} accounts (${(ob*100).toFixed(0)} → ${(os*100).toFixed(0)} in 100).</div>
 <div>Over the next 3 months that is roughly <b>${f(Math.round(b3/10)*10)}</b> accounts opened with Traditional against <b>${f(Math.round(s3/10)*10)}</b> with the Soft Banking Profile (base case).</div>
 ${wins.length>1?`<div>Biggest winners: <b>${esc(wins[0].n)}</b> (+${(wins[0].d*100).toFixed(0)} in 100)${wins[1]?` and <b>${esc(wins[1].n)}</b> (+${(wins[1].d*100).toFixed(0)})`:""}.</div>`:""}</div>
 <div class="note">The Soft Banking Profile effect on each step is an assumption: lighter details up front, and checks later with the profile already saved. Replace it with pilot results when you have them.</div>
 <div class="btns"><button id="bizBoth">Use both in Business impact</button></div>`;
 el._v={ob,os};bizSync();
}
function drawKpis(){
 const b=BASE,s=SCEN,n=s.cust.length,nb=b.cust.length,ob=b.openN/nb,os=s.openN/n,cb=b.doneN/nb,cs=s.doneN/n,mb=medianTime(b),ms=medianTime(s),ch=changed();
 $("kpis").innerHTML=[
  [f(n),"People who started",""],
  ...(profN(s)!=null?[[f(profN(s)),"Profiles created",delta(profN(b)/nb*n,profN(s),f)]]:[]),
  [f(s.openN),"Accounts opened",delta(ob*n,s.openN,f)],
  [(os*100).toFixed(1)+"%","Start to account open",delta(ob*100,os*100,x=>x.toFixed(1)+" pts")],
  [(cs*100).toFixed(1)+"%","Start to fully finished",delta(cb*100,cs*100,x=>x.toFixed(1)+" pts")],
  [ms<60?ms.toFixed(0)+" min":(ms/60).toFixed(1)+" h","Typical time to open",delta(mb,ms,x=>x.toFixed(0)+" min",false)],
  ...(s.redir>0||b.redir>0?[[f(s.redir),"Ineligible, redirected to another account",delta(b.redir/nb*n,s.redir,f)]]:[]),
  [f(n-s.openN-s.redir),"Lost before opening",delta((nb-b.openN-b.redir)/nb*n,n-s.openN-s.redir,f,false)]
 ].map(([v,l,d])=>`<div class="kpi"><b>${v}</b><span>${l}${ch?"":" (today)"}</span><br>${d}</div>`).join("");
}

// ---------- validation ----------
function validStats(p){
 if(!p.obs)return null;const hold=p.obs.hold,set=hold||p.obs.cal,K=p.steps.length,sd=p.obs.sd;let ok=0,err=0,ne=0;const rows=[];
 for(let k=0;k<K;k++){const o=set[k],drop=o.e>0?1-o.c/o.e:null;if(drop==null){rows.push({k,none:true});continue}
  // tolerance: the larger of 2 points, sampling noise, and twice the step's normal month-to-month movement
  const [wl,wh]=wilson(o.e-o.c,o.e),tol=Math.max(.02,(wh-wl)/2,hold&&sd&&sd[k]!=null?2*sd[k]:0),lo=Math.max(0,drop-tol),hi=Math.min(1,drop+tol);
  const sim=BASE.att[k]>0?BASE.fail[k]/BASE.att[k]:null,inside=sim!=null&&sim>=lo&&sim<=hi;if(inside)ok++;if(sim!=null){err+=Math.abs(sim-drop);ne++}rows.push({k,e:o.e,drop,lo,hi,sim,inside,tol})}
 const o0=set[0],oL=set[K-1],oc=o0.e>0?oL.c/o0.e:null,[clo,chi]=oc==null?[0,1]:wilson(oL.c,o0.e);
 return{hold,ok,K,rows,oc,clo,chi,sc:BASE.doneN/BASE.cust.length,mae:ne?err/ne:0};
}
function drawValid(){
 const p=cur(),V=validStats(p),chip=$("jTrust");
 if(!V){chip.className="chip ass";chip.textContent="Starting point: not validated";
  $("valid").innerHTML=`<div class="note">This starting point has no real history behind it. Load previous months for a real product and this section will show how well the model predicts what actually happened.</div>`;return}
 const close=V.ok>=V.K-1,good=close&&V.mae<=.04,mid=V.ok>=Math.ceil(V.K*.6),mae=(V.mae*100).toFixed(1),off=V.K-V.ok;
 if(V.hold){chip.className="chip "+(good?"sim":"ass");chip.style.color="";chip.textContent=good?`Tested on an unseen month: within ${mae} pts on average`:(close?"Tested: matches, but this flow swings a lot month to month":mid?`Tested: ${off} ${off>1?"steps":"step"} moved more than usual`:"Check: the latest month looks different")}
 else{chip.className="chip ass";chip.style.color="";chip.textContent="Matches your data (not independently tested)"}
 let h=`<div class="banner ${V.hold?(good?"up":"warn"):"warn"}">${V.hold?`<b>${good?"Good news.":"Worth a look."}</b> The model learned from the earlier months and then predicted ${esc(p.hold)}, which it had not seen. ${V.ok} of ${V.K} steps landed within normal month-to-month movement, and the average miss was ${mae} points.${good?"":close?" The ranges are wide because this flow's numbers move a lot from month to month, so treat its forecast as rough.":" Where a step is outside the range, the latest month behaved differently from the months before it. That can be a real change in the flow or in who is arriving, so check those steps before relying on the forecast."}`:`<b>Matches your numbers, but not independently tested.</b> The model learned from this same data, so agreement is expected. To test it properly, load at least 3 months with a month column (like 2026-08) and keep “hold out the latest month” ticked.`}</div>`;
 h+=tblJ(["Step","People who reached it","Real drop-off (normal range)","Model says","Result"],V.rows.map(r=>r.none?[esc(p.steps[r.k].name),"no data","","",""]:[esc(p.steps[r.k].name),f(r.e),`${(r.drop*100).toFixed(1)}% <span class="lbl">(${(r.lo*100).toFixed(1)}–${(r.hi*100).toFixed(1)})</span>`,r.sim==null?"n/a":(r.sim*100).toFixed(1)+"%",r.inside?`<span class="up">Matches</span>`:`<span class="dn">${r.sim>r.drop?"Real month was lower":"Real month was higher"} by ${(Math.abs(r.sim-r.drop)*100).toFixed(1)} pts</span>`]));
 h+=`<div class="note">Normal range is the real figure plus or minus the larger of 2 points and twice that step's usual month-to-month movement.</div>`;
 h+=`<div class="note" style="margin-top:6px">Start to finish: real <b>${V.oc==null?"n/a":(V.oc*100).toFixed(1)+"%"}</b> (range ${(V.clo*100).toFixed(1)}–${(V.chi*100).toFixed(1)}), model <b>${(V.sc*100).toFixed(1)}%</b>. Compared against today's flow, with no changes applied.</div>`;
 if(p.obs.trend&&p.obs.trend.length>1){const t=p.obs.trend;h+=`<h3>Month by month</h3>`+tblJ(["Month","Started","Finished","Conversion"],t.map(x=>[esc(x.month),f(x.e),f(x.c),pc(x.c,x.e)]));
  const rs=t.map(x=>x.e>0?x.c/x.e:0),last=rs[rs.length-1],avg=rs.slice(0,-1).reduce((a,b)=>a+b,0)/(rs.length-1);
  if(Math.abs(last-avg)>.02)h+=`<div class="banner warn">The latest month is ${(Math.abs(last-avg)*100).toFixed(1)} points ${last<avg?"below":"above"} the earlier average. Conversion is drifting, so older months may not predict the next launch well.</div>`}
 $("valid").innerHTML=h;
}
function lineJ(arr,x,y,H){let d="";for(let i=0;i<H;i++)d+=(i?"L":"M")+x(i)+","+y(arr[i]);return d}
function drawDaily(){
 const H=SCEN.H,W=640,Ht=220,m={l:36,r:8,t:10,b:22},mx=Math.max(...SCEN.starts,...SCEN.opened,...BASE.opened,1)*1.1;
 const x=i=>m.l+(W-m.l-m.r)*(i+.5)/H,y=v=>Ht-m.b-(Ht-m.t-m.b)*v/mx,bw=(W-m.l-m.r)/H*.7;
 let s=`<svg viewBox="0 0 ${W} ${Ht}">`;
 for(let i=0;i<=4;i++){const v=mx*i/4;s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e3e6ee"/><text x="${m.l-4}" y="${y(v)+4}" font-size="10" text-anchor="end" fill="#5b6478">${f(v)}</text>`}
 for(let i=0;i<H;i++){s+=`<rect x="${x(i)-bw/2}" y="${y(SCEN.starts[i])}" width="${bw}" height="${Ht-m.b-y(SCEN.starts[i])}" fill="#dde1ea"/>`;if(i%5===0)s+=`<text x="${x(i)}" y="${Ht-6}" font-size="10" text-anchor="middle" fill="#5b6478">${i}</text>`}
 s+=`<path d="${lineJ(BASE.opened,x,y,H)}" fill="none" stroke="#b9bfcc" stroke-width="2" stroke-dasharray="4 3"/><path d="${lineJ(SCEN.opened,x,y,H)}" fill="none" stroke="#0071e3" stroke-width="2.5"/>`;
 const t=+$("tslider").value;s+=`<line x1="${x(t-.5)}" x2="${x(t-.5)}" y1="${m.t}" y2="${Ht-m.b}" stroke="#d6453d" stroke-dasharray="3 3"/>`;
 $("daily").innerHTML=s+`<text x="${W-m.r}" y="${Ht-6}" font-size="10" text-anchor="end" fill="#5b6478">day</text></svg>`;
}
function drawSnap(){
 const p=cur(),R=snapView==="s"?SCEN:BASE,t=+$("tslider").value;$("tv").textContent=t.toFixed(1);
 const S=snapshot(R,t);let mx=1;for(let k=0;k<R.K;k++)mx=Math.max(mx,S.inflight[k],S.dropped[k]);
 $("snapsum").innerHTML=`By day ${t.toFixed(1)}: <b>${f(S.arrived)}</b> started · <b>${f(S.opened)}</b> accounts opened · <b>${f(S.fl)}</b> still going · <b>${f(S.dr)}</b> dropped · <b>${f(S.done)}</b> finished`;
 $("snap").innerHTML=p.steps.map((st,k)=>`<div class="row" style="cursor:default"><div class="nm">${esc(st.name)}</div><div>
  <div class="bar"><div style="width:${100*S.inflight[k]/mx}%;background:var(--blue2)"></div><em>${f(S.inflight[k])}</em></div>
  <div class="bar"><div style="width:${100*S.dropped[k]/mx}%;background:var(--red)"></div><em>${f(S.dropped[k])}</em></div></div></div>`).join("");
}

// ---------- advanced editors ----------
const num=(a,v,min,max,step,w)=>`<input type="number" data-jf="${a}" data-min="${min}" data-max="${max}" step="${step}" value="${v}" style="width:${w||64}px;padding:3px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:12px">`;
const nearSens=v=>v<.25?0:(v<.75?.5:1);
function drawStepEd(){
 const p=cur();
 let h=`<h3>Edit the steps</h3><div class="note">Today's numbers come from your data. The last three columns are the manual way to test a change.</div><div class="scroll"><table><tr><th>Step</th><th>Kind of step</th><th>People who leave (%)</th><th>Typical minutes</th><th>Come back later (%)</th><th>Hurt by weak phone or network</th><th>Change in leaving (%)</th><th>Change in time (%)</th><th>Remove for</th></tr>`;
 p.steps.forEach((s,k)=>{h+=`<tr><td><input type="text" data-jf="step:name" data-k="${k}" value="${esc(s.name)}" style="width:150px;padding:3px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:12px"></td>
  <td><select data-jf="step:tag" data-k="${k}" style="font:inherit;font-size:12px">${TAGS.map(t=>`<option value="${t}" ${t===s.tag?"selected":""}>${TAGLBL[t]}</option>`).join("")}</select></td>
  <td>${num("step:net:"+k,+(s.net*100).toFixed(2),0,100,.1)}</td><td>${s.post?"within "+s.window+" days":num("step:med:"+k,+s.med.toFixed(2),0,600,.5)}</td>
  <td>${s.post?"—":num("step:resume:"+k,+(s.resume*100).toFixed(1),0,90,1)}</td>
  <td><select data-jf="step:sens" data-k="${k}" style="font:inherit;font-size:12px">${[[0,"Not at all"],[.5,"Somewhat"],[1,"A lot"]].map(([v,l])=>`<option value="${v}" ${nearSens(s.sens)===v?"selected":""}>${l}</option>`).join("")}</select></td>
  <td>${num("step:delta:"+k,s.delta,-100,500,5,56)}</td><td>${num("step:dtime:"+k,s.dtime,-95,500,5,56)}</td>
  <td><select data-jf="step:skip" data-k="${k}" style="font:inherit;font-size:12px">${[["none","Nobody"],["existing","Existing customers"],["all","Everyone"]].map(([v,l])=>`<option value="${v}" ${v===s.skip?"selected":""}>${l}</option>`).join("")}</select></td></tr>`});
 $("stepEd").innerHTML=h+`</table></div><div class="note">“People who leave” is the share who give up at the step, after anyone who comes back later is counted. “Hurt by weak phone or network” controls how much a persona's digital friction affects that step.</div>`;
}
function drawPersEd(){
 const p=cur();
 let h=`<h3>Edit the personas</h3><div class="note">How many people are like this, whether they already bank with you (needed for reusing an identity), how hard they find digital journeys, and how fast they move. Totals for each step still match the table above.</div><div class="scroll"><table><tr><th>Persona</th><th>Share of people (%)</th><th>Banks with you?</th><th>Digital friction</th><th>Speed vs average</th><th>Qualify for this account (%)</th><th></th></tr>`;
 p.personas.forEach((pe,j)=>{h+=`<tr><td><input type="text" data-jf="pers:name" data-j="${j}" value="${esc(pe.name)}" style="width:170px;padding:3px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:12px"></td>
  <td>${num("pers:share:"+j,pe.share,0,100,1)}</td><td><select data-jf="pers:seg" data-j="${j}" style="font:inherit;font-size:12px"><option value="new" ${pe.seg==="new"?"selected":""}>No, new to bank</option><option value="existing" ${pe.seg==="existing"?"selected":""}>Yes, existing</option></select></td>
  <td>${num("pers:techE:"+j,pe.techE,-.5,2,.05)}</td><td>${num("pers:dwell:"+j,pe.dwell,.2,5,.1)}</td><td>${num("pers:elig:"+j,Math.round((pe.elig==null?1:pe.elig)*100),0,100,1)}</td><td>${p.personas.length>1?`<button data-pdel="${j}" style="padding:2px 8px">✕</button>`:""}</td></tr>`});
 h+=`</table></div><div class="note">Digital friction: 0 is average, below 0 is more comfortable, above 0 struggles more. Speed: 1.0 is average, 1.5 takes half as long again. Qualify: the share of this persona who meet the account's criteria, checked at sign-up. Those who don't are stopped there.</div><div class="btns"><button id="pAdd">Add a persona</button><button id="pArch">Use the 20 archetypes</button><button id="pIll">Use the example personas</button><button id="pOne">Treat everyone alike</button></div>`;
 h+=`<h3>Which steps hit each persona harder</h3><div class="note">1.00 means the persona leaves like the average person. 1.30 means 30% more likely to leave.</div><div class="scroll"><table><tr><th>Persona</th>${p.steps.map(s=>`<th style="font-size:11px">${esc(s.name)}</th>`).join("")}</tr>`;
 p.personas.forEach((pe,j)=>{h+=`<tr><td>${esc(pe.name)}</td>${p.steps.map((s,k)=>`<td>${num("pm:"+j+":"+k,+p.pm[j][k].toFixed(2),0,10,.05,54)}</td>`).join("")}</tr>`});
 $("persEd").innerHTML=h+`</table></div>`;
}

// ---------- import preview ----------
function doParse(){
 const r=parseData($("jCsv").value);
 if(r.err){$("jPrev").innerHTML=`<div class="banner down">${esc(r.err)}</div>`;PREV=null;return}
 PREV={data:r.prods,tags:{},posts:{},hold:true};
 Object.entries(r.prods).forEach(([n,pr])=>{PREV.tags[n]={};PREV.posts[n]={};pr.order.forEach((s,i)=>{const g=guessTag(s);PREV.tags[n][s]=g;PREV.posts[n][s]=g==="activate"&&i===pr.order.length-1})});
 renderPrev(r.warn);
}
function renderPrev(warn){
 if(!PREV)return;let h=`<h3>Check what we understood</h3>`;
 if(warn&&warn.length)h+=`<div class="banner warn"><b>${warn.length} row${warn.length>1?"s":""} skipped.</b> ${warn.slice(0,4).map(esc).join(" ")}</div>`;
 const maxM=Math.max(...Object.values(PREV.data).map(p=>p.months.length));
 h+=maxM>=3?`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="pHold" ${PREV.hold?"checked":""}> Keep the latest month aside to test the model (recommended)</label>`:`<div class="note" style="margin:8px 0">Tip: include a month column with 3 or more months so we can test the model on a month it has not seen.</div>`;
 Object.entries(PREV.data).forEach(([n,pr])=>{
  const a=aggregate(pr,null);
  h+=`<h3>${esc(n)}</h3><div class="note">${pr.rows.length} rows · ${pr.months.length?pr.months.length+" months ("+esc(pr.months[0])+" to "+esc(pr.months[pr.months.length-1])+")":"no month column"} · ${pr.personas.length>=2?pr.personas.length+" personas found: "+pr.personas.map(esc).join(", "):"no persona split"}</div>`;
  h+=tblJ(["#","Step","What kind of step is this?","After the account opens?","Reached","Finished","Left","Check"],a.steps.map((s,k)=>{
   const drop=s.e>0?1-s.c/s.e:0,[lo,hi]=wilson(s.e-s.c,s.e),prev=k>0?a.steps[k-1]:null;
   const flag=prev&&s.e>prev.c*1.05?`<span class="dn">More reached this than finished the step before (${f(prev.c)}). Fine if the journey branches.</span>`:"Looks fine";
   return[k+1,esc(s.name),`<select data-ptag="${esc(n)}|${esc(s.name)}" style="font:inherit;font-size:12px">${TAGS.map(t=>`<option value="${t}" ${t===PREV.tags[n][s.name]?"selected":""}>${TAGLBL[t]}</option>`).join("")}</select>`,
    `<label style="font-size:12px"><input type="checkbox" data-ppost="${esc(n)}|${esc(s.name)}" ${PREV.posts[n][s.name]?"checked":""} ${k===a.steps.length-1?"":"disabled"}> Yes</label>`,
    f(s.e),f(s.c),`${(drop*100).toFixed(1)}% <span class="lbl">(${(lo*100).toFixed(1)}–${(hi*100).toFixed(1)})</span>`,flag]}));
 });
 h+=`<div class="note">“Kind of step” lets ideas like “Instant ID check” know which steps they affect. We guessed from the names, so correct any that are wrong.</div><div class="btns"><button id="pApply" class="on">Use this data</button></div>`;
 $("jPrev").innerHTML=h;
}
function applyPrev(){
 if(!PREV)return;const hold=$("pHold")?$("pHold").checked:false;let first=-1;
 Object.entries(PREV.data).forEach(([n,pr])=>{const p=buildProduct(n,pr,PREV.tags[n],PREV.posts[n],hold),i=PRODUCTS.findIndex(x=>x.id===p.id);if(i>=0)PRODUCTS[i]=p;else PRODUCTS.push(p);if(first<0)first=i>=0?i:PRODUCTS.length-1});
 SEL=first;selStep=0;$("jImp").open=false;PREV=null;$("jPrev").innerHTML="";resetChanges();drawAll();const el=$("s2");if(el&&el.scrollIntoView)el.scrollIntoView({behavior:"smooth",block:"start"});
}

// ---------- events ----------
document.addEventListener("input",e=>{
 const el=e.target;
 if(el.dataset&&el.dataset.man){const m=MAN[+el.dataset.i];m[el.dataset.man]=el.value;return}
 if(el.id==="cuR"){CUSTOM.red=+el.value;$("cuV").textContent=el.value+"%";applyCustom();return}
 const a=el.dataset&&el.dataset.jf;if(!a)return;const p=cur();
 if(el.type==="text"){const k=+el.dataset.k,j=+el.dataset.j;if(a==="step:name")p.steps[k].name=el.value;else if(a==="pers:name")p.personas[j].name=el.value;p.edited=p.src==="data"||p.edited;drawProduct();run();return}
 if(el.tagName==="SELECT")return;
 const v=el.value.trim(),val=+v;if(v===""||!isFinite(val)||val<+el.dataset.min||val>+el.dataset.max){el.classList.add("bad");return}el.classList.remove("bad");
 const [kind,field,i1]=a.split(":");
 if(kind==="step"){const s=p.steps[+i1];if(field==="net")s.net=val/100;else if(field==="resume")s.resume=val/100;else s[field]=val}
 else if(kind==="pers")p.personas[+i1][field]=field==="elig"?val/100:val;
 else if(kind==="pm")p.pm[+field][+i1]=val;
 if(p.src==="data"&&["net","resume","share","techE","dwell","elig"].includes(field)||kind==="pm")p.edited=true;
 calibrate(p);drawProduct();run();
});
document.addEventListener("click",e=>{if(e.target&&e.target.id==="iSee"){const r=$("results");if(r)r.scrollIntoView({behavior:"smooth",block:"center"})}});
document.addEventListener("change",e=>{
 const el=e.target,p=cur(),d=el.dataset||{};
 if(d.idea){IDEA.on[d.idea]=el.checked;if(el.checked&&!IDEA.str[d.idea])IDEA.str[d.idea]="medium";setL();drawIdeas();run()}
 else if(el.id==="softStr"){SOFTSTR=el.value;drawSoftCmp()}
 else if(d.istr){IDEA.str[d.istr]=el.value;setL();run()}
 else if(el.id==="cuK"){const prev=CUSTOM.set;if(prev>=0&&p.steps[prev]){p.steps[prev].delta=0;p.steps[prev].skip="none"}CUSTOM.k=+el.value;CUSTOM.set=-1;applyCustom()}
 else if(el.id==="cuS"){CUSTOM.skip=el.value;applyCustom()}
 else if(d.jf==="step:tag"){const s=p.steps[+d.k];s.tag=el.value;s.sens=TAGSENS[el.value]||0;calibrate(p);drawStepEd();drawIdeas();run()}
 else if(d.jf==="step:sens"){p.steps[+d.k].sens=+el.value;calibrate(p);run()}
 else if(d.jf==="step:skip"){p.steps[+d.k].skip=el.value;drawCustom();run()}
 else if(d.jf==="pers:seg"){p.personas[+d.j].seg=el.value;run()}
 else if(d.ptag!=null){const[n,s]=d.ptag.split("|");PREV.tags[n][s]=el.value;if(el.value==="activate"){const last=PREV.data[n].order[PREV.data[n].order.length-1];if(s===last){PREV.posts[n][s]=true;renderPrev()}}}
 else if(d.ppost!=null){const[n,s]=d.ppost.split("|");PREV.posts[n][s]=el.checked}
 else if(el.id==="pHold")PREV.hold=el.checked;
});
document.addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b)return;const p=cur();
 if(b.id==="pApply")applyPrev();
 else if(b.id==="bizUse"){const a=p.actuals,to=a.opened.reduce((x,y)=>x+y,0),ta=a.active.reduce((x,y)=>x+y,0),act=+(BASE.openN/BASE.cust.length*100).toFixed(2),ar=+(ta/to*100).toFixed(1);window.__C.apply(act,ar);$("tbC").click();window.scrollTo&&window.scrollTo(0,0)}
 else if(b.id==="bizBoth"){const v=$("softCmp")._v,a=p.actuals,ar=a?+(a.active.reduce((x,y)=>x+y,0)/a.opened.reduce((x,y)=>x+y,0)*100).toFixed(1):null;window.__C.applyBoth(+(v.ob*100).toFixed(2),+(v.os*100).toFixed(2),ar);$("tbC").click();window.scrollTo&&window.scrollTo(0,0)}
 else if(b.id==="goBiz"){$("tbC").click();window.scrollTo&&window.scrollTo(0,0)}
 else if(b.dataset.mdel!=null){MAN.splice(+b.dataset.mdel,1);drawMan()}
 else if(b.dataset.pdel!=null){const j=+b.dataset.pdel;p.personas.splice(j,1);p.pm.splice(j,1);calibrate(p);drawPersEd();run()}
 else if(b.id==="pAdd"){p.personas.push({name:"New persona",share:10,seg:"new",techE:0,dwell:1,elig:1});p.pm.push(p.steps.map(()=>1));if(p.personaSrc==="none")p.personaSrc="assumed";calibrate(p);drawProduct();drawPersEd();run()}
 else if(b.id==="pArch"){const r=archetypePersonas(p,null,p.src==="data");p.personas=r.personas;p.pm=r.pm;p.personaSrc="assumed";calibrate(p);drawProduct();drawPersEd();run()}
 else if(b.id==="pIll"){const r=illustrativePersonas(p.steps);p.personas=r.personas;p.pm=r.pm;p.personaSrc="assumed";calibrate(p);drawProduct();drawPersEd();run()}
 else if(b.id==="pOne"){p.pm=p.personas.map(()=>p.steps.map(()=>1));if(p.personaSrc==="data")p.personaSrc="assumed";calibrate(p);drawProduct();drawPersEd();run()}
});
PRODUCTS=mockProducts();SEL=0;
buildStatic();setL();drawAll();

function cmpAll(){
 const rows=PRODUCTS.map(p=>{const R=simJ(p,ZERO(),{arr:400,days:30,seed:P.seed}),n=R.cust.length;
  let lk=-1,lm=0;p.steps.forEach((s,k)=>{if(!s.post&&s.tag!=="elig"&&R.fail[k]>lm){lm=R.fail[k];lk=k}});
  const rates=p.personas.map((pe,j)=>({pe:pe.name,r:R.perp[j].n>0?R.perp[j].opened/R.perp[j].n:0,n:R.perp[j].n})).filter(x=>x.n>=n*.02).sort((a,b)=>a.r-b.r);
  const ek=p.steps.findIndex(s=>s.tag==="elig");return{inel:ek>=0?R.inel[ek]/n:0,name:p.name,src:p.src,open:R.openN/n,done:R.doneN/n,leak:lk>=0?p.steps[lk].name:"-",leakR:lk>=0?R.fail[lk]/R.att[lk]:0,worst:p.personas.length>1&&rates[0]?rates[0].pe+" ("+(rates[0].r*100).toFixed(0)+"%)":"-"}});
 $("cmp").innerHTML=tblJ(["Account","Open an account (per 100 starts)","Fully finish (per 100)","Not eligible (per 100)","Biggest leak","Persona least likely to open"],rows.map(r=>[`<b>${esc(r.name)}</b>${r.src==="template"?' <span class="chip ass">illustrative</span>':""}`,(r.open*100).toFixed(0),(r.done*100).toFixed(0),(r.inel*100).toFixed(0),`${esc(r.leak)} (${(r.leakR*100).toFixed(0)} in 100 leave)`,esc(r.worst)]))+`<div class="note">Today's flow for each account, no changes applied. Starting-point accounts use illustrative numbers.</div>`;
}

