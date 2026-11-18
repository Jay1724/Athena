
// ===== Why they left: synthetic feedback from the customers who dropped at a step =====
// Quotes are written from the reason each simulated customer was given, the persona's profile and what they did on the screen. Nothing here is real feedback.
const mins=d=>{const m=d*1440;return m<1?"under a minute":m<90?Math.round(m)+" min":(m/60).toFixed(1)+" hours"};
const medOf=a=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y);return s[Math.floor(s.length/2)]};
let VOCV=[];
function vocQuality(p,R){const o=voiceRun(p,R),S=o.sent,said=Math.max(1,o.said),T={neg:35,mix:30,neu:20,pos:15},L={neg:"Negative",mix:"Mixed or unsure",neu:"Neutral",pos:"Positive"};
 const row=(l,v,t,ok)=>`<div class="frow"><span class="fpl ${ok?"g":"a"}">${ok?"OK":"Check"}</span><div class="fbody"><div class="ft">${l}: <b>${v}</b></div><div class="ff">${t}</div></div></div>`;
 const sil=o.drops?o.silentDrops/o.drops:0,sug=o.sugg/said,fine=o.drops?o.fine/o.drops:0;
 return`<details class="legend vq"><summary>Is this run believable? Checks from the behaviour guide</summary>
 <div class="vqmix">${Object.keys(T).map(k=>`<div><div class="vocr-t"><span>${L[k]}</span><b>${(S[k]/said*100).toFixed(0)}%</b></div><div class="vocr-b"><i style="width:${(S[k]/said*100).toFixed(0)}%;background:${k==="neg"?"var(--red)":k==="pos"?"var(--green)":k==="mix"?"var(--amber)":"#8e8e93"}"></i><u style="left:${T[k]}%"></u></div></div>`).join("")}</div>
 <div class="hint">Mix of ${f(o.said)} answers from a sample of ${f(o.n)} customers. The tick is the guide's target. Positive answers come mostly from people who finished, so a flow that loses most people sits below 15%.</div>
 ${row("Drop-offs who said nothing",(sil*100).toFixed(0)+"%","Target about 30%.",Math.abs(sil-.3)<.08)}
 ${row("Answers with a suggestion",(sug*100).toFixed(0)+"%","Target at most 1 in 5.",sug<=.2)}
 ${row("Said it was fine but left",(fine*100).toFixed(0)+"%","The say and do gap should show up.",fine>=.05)}
 ${row("Answers rejected by the checks",f(o.fail)+" of "+f(o.said),"Too long, a banned word, more than one point, or repeating another answer in the same batch of 50. Rejected answers are never shown."+(o.fail?" "+(()=>{const s=Object.entries(o.fails).map(([k,c])=>k+" "+c).join(", ");return s.charAt(0).toUpperCase()+s.slice(1)+"."})():""),true)}
 ${row("Steps where drop-off rises again",String(o.bumps),"A real flow is rarely a smooth decline.",o.bumps>=1)}
 ${row("Drop-offs from people with high-end phones",(o.strongShare*100).toFixed(0)+"%","Not only low-digital customers should fail.",o.strongShare>=.1)}
 </details>`}
function drawVoc(){
 const el=$("voc");if(!el||!BASE)return;const p=cur(),k=LKSEL;
 if(k==null||!p.steps[k]){el.innerHTML='<div class="note">No step loses anyone in this flow.</div>';return}
 const s=p.steps[k],R=BASE,left=R.cust.filter(c=>c.dropK===k&&c.status==="drop"),N=left.length;
 const steps=p.steps.map((x,i)=>({x,i})).filter(o=>R.att[o.i]>0&&R.fail[o.i]>0);
 let h=`<div class="vocpills">${steps.map(o=>`<button class="${o.i===k?"on":""}" data-lk="${o.i}">${esc(o.x.name)}</button>`).join("")}</div>`;
 if(!N){el.innerHTML=h+'<div class="note">Nobody leaves at this step.</div>';return}
 // reasons
 const rc={};left.forEach(c=>{const r=c.rs||"No reason recorded";rc[r]=(rc[r]||0)+1});const rr=Object.entries(rc).sort((a,b)=>b[1]-a[1]);
 // who
 const pc={};left.forEach(c=>{pc[c.j]=(pc[c.j]||0)+1});const nAll=R.cust.length;
 const ovr=j=>(pc[j]/N)/Math.max(1e-9,R.perp[j].n/nAll),who=Object.entries(pc).map(([j,c])=>({j:+j,c,sh:c/N,base:R.perp[+j].n/nAll,ov:ovr(+j)})).filter(w=>w.sh>=.03).sort((a,b)=>b.ov-a.ov).slice(0,3);
 // behaviour on this screen
 const tOn=c=>c.path.filter(q=>q.k===k).reduce((a,q)=>a+(q.t1-q.t0),0),tries=c=>c.path.filter(q=>q.k===k).length;
 const passed=R.cust.filter(c=>c.dropK!==k&&c.path.some(q=>q.k===k)).slice(0,4000);
 const mL=medOf(left.map(tOn)),mP=medOf(passed.map(tOn)),retry=left.filter(c=>tries(c)>1).length/N;
 // behaviour: what happened on this screen, leavers against those who carried on
 const evRate=(cs,ch)=>cs.length?cs.filter(c=>(c.ev||[]).some(e=>e[0]===k&&e[1].includes(ch))).length/cs.length:0;
 const EVL=[["m","Mis-tapped or typed something wrong"],["b","Went back a step"],["i","Got interrupted"],["r","Re-read the screen without acting"],["w","Picked the wrong option"],["s","Skipped the terms"]];
 const evRows=EVL.map(([ch,l])=>({l,a:evRate(left,ch),b:evRate(passed,ch)})).filter(x=>x.a>=.01||x.b>=.01);
 const ac={};left.forEach(c=>{if(c.act)ac[c.act]=(ac[c.act]||0)+1});const acts=Object.entries(ac).sort((a,b)=>b[1]-a[1]);
 const ACTL={"gave up":"Gave up","go to a branch":"Went to a branch","call the bank":"Called the bank","asked someone, still stopped":"Asked someone, still stopped"};
 const moods=[0,0,0,0];left.forEach(c=>moods[c.mi||0]++);
 // voices: real simulated customers, most over-represented personas first; many say nothing, some say it was fine
 const tagOf=i=>p.steps[i]&&p.steps[i].tag,seen=new Set(),order=left.slice().sort((a,b)=>ovr(b.j)-ovr(a.j)||hr(a,77)-hr(b,77));
 const voices=[],usedJ=new Set();let silent=0,fineN=0,asked=0;
 left.forEach(c=>{const v=speak(c,p.personas[c.j],tagOf);asked++;if(v.silent)silent++;if(v.fine)fineN++});
 let fineShown=false;for(const c of order){if(voices.length>=3)break;if(usedJ.has(c.j))continue;const v=speak(c,p.personas[c.j],tagOf);if(!v.text)continue;if(v.fine&&fineShown)continue;
  if(qcheck(v.text,btr(p.personas[c.j]),seen).length)continue;usedJ.add(c.j);if(v.fine)fineShown=true;voices.push({c,v})}
 VOCV=voices;
 const isPost=!!s.post;
 h+=`<div class="vocgrid"><div><h4>What happened</h4>${rr.slice(0,6).map(([r,c])=>`<div class="vocr"><div class="vocr-t"><span>${esc(r)}</span><b>${(c/N*100).toFixed(0)}%</b></div><div class="vocr-b"><i style="width:${(c/rr[0][1]*100).toFixed(0)}%"></i></div></div>`).join("")}
 <div class="hint" style="margin-top:6px">Of the ${f(N)} simulated customers who left ${isPost?"after opening":"here"}. This is what happened, not what they said.</div></div>
 <div><h4>Who left, more than their share</h4>${who.map(w=>{const pe=p.personas[w.j],ov=w.base>0?w.sh/w.base:1;return`<div class="vocw">${typeof pav==="function"?pav(pe.name):""}<div><b>${esc(typeof pname==="function"?pname(pe.name):pe.name)}</b><span>${(w.sh*100).toFixed(0)}% of those who left, against ${(w.base*100).toFixed(0)}% of starters${ov>1.1?` · <b style="display:inline;color:var(--red);font-size:12.5px">${ov.toFixed(1)}×</b>`:""}</span></div></div>`}).join("")}
 ${isPost?"":`<h4 style="margin-top:14px">What they did</h4><div class="vocb"><div><b>${mins(mL)}</b><span>on this screen before leaving</span></div><div><b>${mins(mP)}</b><span>for people who carried on</span></div><div><b>${(retry*100).toFixed(0)}%</b><span>tried again before giving up</span></div></div>`}</div></div>
 ${isPost?"":`<div class="vocgrid" style="margin-top:16px"><div><h4>On this screen</h4><table class="vevt"><tr><th></th><th>Left</th><th>Carried on</th></tr>${evRows.map(x=>`<tr><td>${x.l}</td><td><b>${(x.a*100).toFixed(0)}%</b></td><td>${(x.b*100).toFixed(0)}%</td></tr>`).join("")}</table></div>
 <div><h4>When they got stuck</h4>${acts.map(([a,c])=>`<div class="vocr"><div class="vocr-t"><span>${esc(ACTL[a]||a)}</span><b>${(c/N*100).toFixed(0)}%</b></div><div class="vocr-b"><i style="width:${(c/acts[0][1]*100).toFixed(0)}%;background:#8e8e93"></i></div></div>`).join("")}
 <div class="hint" style="margin-top:6px">Mood that day: ${["Relaxed","Calm","Rushed","Stressed"].map((m,i)=>moods[i]?`${m.toLowerCase()} ${(moods[i]/N*100).toFixed(0)}%`:"").filter(Boolean).join(", ")}.</div></div></div>`}
 <h4 style="margin-top:16px">What they said when asked “Why did you stop?”</h4>
 <div class="hint" style="margin:0 0 8px"><b>${(silent/asked*100).toFixed(0)}% said nothing.</b> ${fineN?`${(fineN/asked*100).toFixed(0)}% said it was fine, even though they left.`:""}</div>
 <div class="vocq">${voices.map((o,i)=>{const c=o.c,pe=p.personas[c.j],I=typeof pinfo==="function"?pinfo(pe.name):null,B=btr(pe),ctx=[];
  if(I){const d=I.dev.replace(/^an? /,"");ctx.push(d[0].toUpperCase()+d.slice(1));ctx.push(I.dat)}
  if(!isPost){const t=tOn(c);ctx.push(mins(t)+" here");if(tries(c)>1)ctx.push("tried "+tries(c)+" times")}
  return`<figure data-vi="${i}"><blockquote>“${esc(o.v.text)}”</blockquote>${o.v.fine?'<div class="saydo">Said it was fine · left here</div>':""}<figcaption>${typeof pav==="function"?pav(pe.name):""}<span><b>${esc(typeof pname==="function"?pname(pe.name):pe.name)}</b>${I?`<i>${esc(pe.name)}</i>`:""}<i>${esc(ctx.join(" · "))}</i><i>What happened: ${esc((c.rs||"left").toLowerCase())}</i></span></figcaption></figure>`}).join("")}</div>
 <div class="foot noprint" id="vocAsk" style="display:none"><button id="vocAskBtn">Ask them again with Claude</button><span class="hint" id="vocAskMsg" style="margin:0">Writes fresh answers for these customers from their profile and what happened. Uses your Claude usage.</span></div>
 <div class="note" style="margin-top:10px">Synthetic, not real feedback. What they did and what they said are generated separately, so they can disagree, as real people do. Voices follow the persona behaviour guide: short, plain, often silent. Behaviour traits and voices are assumptions for research to refine.</div>`;
 h+=vocQuality(p,R);
 el.innerHTML=h;if(typeof goalSwap==="function")goalSwap(el);
}
function vocPick(k){LKSEL=k;document.querySelectorAll("#chLeak .lk").forEach(e=>e.classList.toggle("on",+e.dataset.lk===k));drawVoc()}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-lk]");if(!b)return;const fromChart=!!b.closest("#chLeak");vocPick(+b.dataset.lk);if(fromChart){const v=$("vocBox");if(v&&v.scrollIntoView)v.scrollIntoView({behavior:"smooth",block:"nearest"})}});
document.addEventListener("keydown",e=>{const b=e.target.closest&&e.target.closest(".lk[data-lk]");if(b&&(e.key==="Enter"||e.key===" ")){e.preventDefault();vocPick(+b.dataset.lk)}});
VOC_READY=true;drawVoc();

// Ask the shown customers again with Claude, using the guide's prompt. Template answers stay if anything fails.
var VSAMPLE=null;
(async()=>{try{if(window.claude&&window.claude.use)VSAMPLE=await window.claude.use("sample")}catch(e){}if(VSAMPLE){const a=$("vocAsk");if(a)a.style.display="";drawFlow()}})();
const _dv=drawVoc;drawVoc=function(){_dv();const a=$("vocAsk");if(a)a.style.display=VSAMPLE&&VOCV.length?"":"none"};
function vLog(c,p){const out=[],k=c.dropK;(c.ev||[]).forEach(([i,e])=>{const n=p.steps[i]?p.steps[i].name:"a screen";const m={m:"mis-tapped",b:"went back",i:"got interrupted",r:"re-read it without doing anything",w:"picked the wrong option",s:"skipped the terms"};out.push("On "+n+": "+[...e].map(ch=>m[ch]).join(", ")+".")});
 if(k>=0&&p.steps[k]){const t=c.path.filter(q=>q.k===k),mn=Math.round(t.reduce((a,q)=>a+(q.t1-q.t0),0)*1440);out.push("Stopped at "+p.steps[k].name+" after about "+Math.max(1,mn)+" minutes"+(t.length>1?", after trying "+t.length+" times":"")+".");if(c.rs)out.push("What really happened: "+c.rs.toLowerCase()+".");if(c.act)out.push("Then: "+c.act+".")}
 return out.join(" ")}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("#vocAskBtn");if(!b||!VSAMPLE||!VOCV.length)return;
 const p=cur(),msg=$("vocAskMsg"),old=msg.textContent;b.disabled=true;msg.textContent="Asking… this can take up to a minute.";
 const people=VOCV.map((o,i)=>{const pe=p.personas[o.c.j],B=btr(pe),I=typeof pinfo==="function"?pinfo(pe.name):null,ag=I?I.age.split(/[–-]/).map(Number):[30,40],age=Math.round(ag[0]+(ag[1]-ag[0])*hr(o.c,5));
  return`#${i+1}. You are ${pname(pe.name)}, ${age}, from a ${I?I.set:"township"} area. You speak ${B.lang}; your English is ${B.english.toLowerCase()}. You read at a ${B.reading.toLowerCase()} level. You are ${pe.name}.${I?" Money: "+I.inc+" a month.":""} Today you felt ${MOODS[o.c.mi||0].toLowerCase()}. How you talk: ${(STYLEL[B.style]||B.style).toLowerCase()}. You ${B.polite==="H"?"tend to say things were fine even when they weren't":B.polite==="M"?"are fairly honest":"say it straight"}. Max ${B.maxW} words.
What actually happened (do not list this back): ${vLog(o.c,p)}`}).join("\n\n");
 const prompt=`Each person below tried to do something in a banking app and stopped. Answer the question as each person, in their own voice.
Rules for every answer:
- Stay under that person's max words.
- Plain words, the way they would speak. Never use: seamless, intuitive, friction, onboarding, journey, flow, UX, UI, navigate, streamline, user-friendly, experience, interface, functionality, frustrating.
- One thing at most. They may be vague, unsure, off-topic or a bit unfair. "I don't know" is allowed.
- No advice unless it slips out. If they quit, they may not say why. Someone who says things were fine may say it was fine.
- Light home-language words only where natural, never a caricature.

Question: "Why did you stop?"

${people}

Reply with only a JSON array of ${VOCV.length} strings, one answer per person in order.`;
 try{const arr=await VSAMPLE.json(prompt,{cache:false});if(!Array.isArray(arr))throw{code:"invalid_json"};const seen=new Set();let ok=0;
  arr.slice(0,VOCV.length).forEach((t,i)=>{const o=VOCV[i],B=btr(p.personas[o.c.j]),txt=String(t||"").trim();const fig=document.querySelector(`#voc figure[data-vi="${i}"]`);if(!fig||!txt)return;
   if(qcheck(txt,B,seen).length)return;fig.querySelector("blockquote").textContent="“"+txt+"”";fig.classList.add("byc");const sd=fig.querySelector(".saydo");if(sd)sd.remove();ok++});
  msg.textContent=ok?`Rewritten by Claude: ${ok} of ${VOCV.length}. Answers that broke the guide's rules were kept as they were.`:"Claude's answers broke the guide's rules, so the originals were kept."}
 catch(err){msg.textContent=err&&err.code==="not_granted"?"Claude isn't allowed for this page.":err&&err.code==="rate_limited"?"Too many requests. Try again in a minute.":"Couldn't reach Claude. Try again later."}
 finally{b.disabled=false}});

FLOW_READY=true;drawFlow();
