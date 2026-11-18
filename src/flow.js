
// ===== Flow confidence: a readiness score for a flow before user testing =====
// Inputs: the funnel behind the selected flow, the simulated customers, and Claude's review of the screens against design laws.
// Every threshold and weight in this file is a working assumption, not a validated benchmark.
var FLOW_READY=false;
const FP=[["effort","Effort","How much work is it?",20],["clarity","Clarity","Is it obvious what to do?",15],["momentum","Momentum","Do people keep going?",20],["truth","Moments of truth","Do the make-or-break moments hold?",25],["trust","Trust and recovery","Do people feel safe, and can they recover?",20]];
// [id, pillar, law or principle, statement the designer rates, what to do if the answer is no]
const FQ=[
 ["hick","effort","Hick's law","Each screen asks for one decision, with only a few options.","Split screens that ask for several decisions, and cut the options on each."],
 ["miller","effort","Miller's law","Forms are chunked. No screen asks for more than about five things.","Break long forms into small groups of related fields."],
 ["tesler","effort","Tesler's law","We prefill or skip anything the bank already knows about the customer.","Carry known details forward so the customer only confirms them."],
 ["postel","effort","Postel's law","Inputs are forgiving. Any sensible format for ID and phone numbers works, and paste and autofill work.","Accept spaces, dashes and pasted values, then format them for the customer."],
 ["jakob","clarity","Jakob's law","Screens use patterns customers already know from the Standard Bank app.","Swap custom patterns for the ones customers already use elsewhere in the app."],
 ["fitts","clarity","Fitts's law","The main button is large and within thumb reach on every screen.","Make the main action full width near the bottom, with a touch target of at least 44 points."],
 ["restorff","clarity","Von Restorff effect","Each screen has one main action that clearly stands out from everything else.","Keep one primary button per screen and tone down the rest."],
 ["proximity","clarity","Law of proximity","Related fields are grouped, and labels and help sit right next to the field they describe.","Group related fields and move help text next to its field."],
 ["plain","clarity","Plain language","A customer could explain each screen back in their own words. No bank jargon.","Rewrite jargon (FICA, PIP, declarations) in everyday words and say why each thing is asked."],
 ["gradient","momentum","Goal-gradient effect","Customers can always see how far they are and how much is left.","Add a step counter or progress bar, and make the last steps feel close."],
 ["zeigarnik","momentum","Zeigarnik effect","Customers can leave and pick up exactly where they stopped, and we remind them.","Save progress automatically and send a reminder with a link back to the same step."],
 ["doherty","momentum","Doherty threshold","Every tap responds within about 0.4 seconds, and longer waits show what is happening.","Add instant feedback on tap, and a progress state for checks that take longer."],
 ["expect","momentum","Zero moment of truth","Before starting, customers are told what they need and how long it takes.","Add a short “what you need” screen: ID, a few minutes, and what they get."],
 ["named","truth","Moments of truth","We have named the make-or-break moments in this flow and designed each one on purpose.","Mark the moments of truth on the flow and review each one as a team."],
 ["idwhy","truth","Moment of truth","At the identity check, customers are told why it is needed and what to do if it fails.","Explain the check in one line, and give a clear next step when it fails."],
 ["peak","truth","Peak-end rule","The ending is clear and positive: the account is confirmed and the customer knows what happens next.","Design a confirmation that celebrates and gives one clear next action."],
 ["value","truth","Second moment of truth","Customers can use the account straight away and are prompted to make a first transaction.","Offer a first action at the end: add money, get the card, or pay someone."],
 ["fees","trust","Transparency","Fees and terms are shown in plain view before the customer commits.","Show the monthly fee and key terms before the customer signs."],
 ["perm","trust","Trust","Each permission or sensitive request (camera, selfie, location) says why it is needed.","Add a one-line reason before each permission prompt."],
 ["errors","trust","Error recovery","Errors say what went wrong and how to fix it, without losing what was typed.","Validate inline, keep the customer's input, and write errors as instructions."],
 ["human","trust","Service recovery","If a check fails, there is a route to a person or a branch without starting again.","Add a fallback: call, chat or branch, with the application carried over."],
 ["inclusive","trust","Inclusive design","It works on an entry-level phone with weak signal, large text and a screen reader.","Test on a low-end device with poor signal, 200% text and a screen reader."]];
// FANS holds a score per design law, filled from the screen review (works 1, partly 0.5, needs work 0). Laws Claude could not judge stay out.
let FANS={},FKEY="",FREV=null;const STV={works:1,partly:.5,"needs work":0};
function flowLoad(p){const k="review:v1:"+p.name;if(k===FKEY)return;FKEY=k;FANS={};FREV=null;try{const v=JSON.parse(localStorage.getItem(k)||"null");if(v&&v.laws)setReview(v,false)}catch(x){}}
function setReview(v,save){FREV=v;FANS={};Object.entries(v.laws||{}).forEach(([id,o])=>{if(o&&STV[o.st]!=null)FANS[id]=STV[o.st]});if(save){try{localStorage.setItem(FKEY,JSON.stringify(v))}catch(x){}}}

// ---------- evidence from the funnel ----------
function flowAuto(R,p){
 const n=R.cust.length||1,cl=x=>Math.max(0,Math.min(1,x)),pct=x=>(x*100).toFixed(0)+"%",avg=a=>a.reduce((x,y)=>x+y.r,0)/(a.length||1);
 const S=p.steps.map((s,k)=>({s,k,att:R.att[k],r:R.att[k]>0?R.fail[k]/R.att[k]:0})).filter(x=>x.att>0&&x.s.tag!=="elig");
 const pre=S.filter(x=>!x.s.post),post=S.find(x=>x.s.post),N=pre.length,out=[];
 if(!N)return{out,pre,post,lead:0,block:[]};
 const add=o=>out.push(Object.assign({auto:true,w:2},o));
 let lead=0;while(lead<N-1&&pre[lead].s.tag==="select")lead++;if(!lead)lead=1;
 const last=pre[N-1];
 // effort
 add({p:"effort",law:"Miller's law",t:"Number of screens",s:cl(1-(N-5)/9),find:`${N} screens before the account opens.`,fix:"Merge or remove screens. Aim for seven or fewer."});
 const seen={};pre.forEach(x=>{if(["details","sign","fica","idcap"].includes(x.s.tag))seen[x.s.tag]=(seen[x.s.tag]||0)+1});
 const extra=Object.values(seen).reduce((a,v)=>a+v-1,0),rep=Object.entries(seen).filter(e=>e[1]>1).map(e=>`${e[1]} ${TAGLBL[e[0]].toLowerCase()} screens`).join(", ");
 add({p:"effort",law:"Tesler's law",t:"Asking for the same kind of thing more than once",s:cl(1-1.5*extra/N),find:extra?`The flow has ${rep}.`:"No type of screen is repeated.",fix:"Combine screens of the same type, so customers meet each kind of ask once."});
 const form=pre.filter(x=>["details","fica","sign","idcap"].includes(x.s.tag)&&x!==last).sort((a,b)=>b.r-a.r)[0];
 if(form)add({p:"effort",law:"Hick's law",t:"Hardest form screen",k:form.k,s:cl(1-form.r/.4),find:`“${form.s.name}” loses ${pct(form.r)} of the people who reach it.`,fix:"Cut fields, prefill, or split the screen. Test “Shorter form with prefill” in Drop-off and ideas."});
 const ex=p.personas.map((pe,j)=>pe.seg==="existing"?j:-1).filter(j=>j>=0),exN=ex.reduce((a,j)=>a+R.perp[j].n,0),ks=pre.filter(x=>["details","idcap","fica"].includes(x.s.tag)).map(x=>x.k);
 if(exN/n>=.2&&ks.length){const lost=ex.reduce((a,j)=>a+ks.reduce((b,k)=>b+R.perp[j].fail[k],0),0)/exN;
  add({p:"effort",law:"Tesler's law",t:"Existing customers re-entering what the bank knows",s:cl(1-lost/.4),find:`${pct(lost)} of existing customers leave at details, ID or address screens.`,fix:"Prefill or skip these for existing customers. Test “Reuse a verified identity (One ID)”."})}
 // momentum
 const l0=1-pre.slice(0,lead).reduce((a,x)=>a*(1-x.r),1),lk=pre.slice(0,lead).sort((a,b)=>b.r-a.r)[0].k;
 add({p:"momentum",law:"Zero moment of truth",t:"The opening",k:lk,s:cl(1-(l0-.1)/.6),find:`${pct(l0)} leave on the opening ${lead>1?"screens":"screen"}, before entering anything.`,fix:"Say up front what the customer gets, what they need and how long it takes."});
 const body=pre.slice(lead,N-1);
 if(body.length>=2){const h=Math.floor(body.length/2),e=avg(body.slice(0,h)),l=avg(body.slice(-h)),ratio=l/(e||.001);
  add({p:"momentum",law:"Goal-gradient effect",t:"Getting easier towards the end",s:cl(1-(ratio-.6)),find:Math.abs(l-e)<.015?`Drop-off stays at about ${pct(e)} a screen from start to end. It should fall as people get closer.`:l>e?`People leave faster in the second half (${pct(l)} a screen) than in the first (${pct(e)}).`:`Drop-off slows from ${pct(e)} a screen in the first half to ${pct(l)} in the second.`,fix:"Move the heavy asks earlier or lighten the late screens, and show how close the end is."})}
 // moments of truth
 add({p:"truth",law:"Peak-end rule",t:"The finish",k:last.k,s:cl(1-last.r/.4),find:`“${last.s.name}” is the last screen and loses ${pct(last.r)} of the people who reach it.`,fix:"The last step should be the easiest. Find what fails here (checks, errors, waiting) before testing."});
 const idv=pre.filter(x=>["verify","idcap"].includes(x.s.tag)&&x!==last).sort((a,b)=>b.r-a.r)[0];
 if(idv)add({p:"truth",law:"Moment of truth",t:"The identity check",k:idv.k,s:cl(1-idv.r/.3),find:`“${idv.s.name}” loses ${pct(idv.r)} of the people who reach it.`,fix:"Explain the check, make retries easy, and give a fallback. Test “Instant ID check”."});
 const dec=pre.filter(x=>x.s.tag==="decision"&&x!==last).sort((a,b)=>b.r-a.r)[0];
 if(dec)add({p:"truth",law:"Moment of truth",t:"The decision or offer",k:dec.k,s:cl(1-dec.r/.3),find:`“${dec.s.name}” loses ${pct(dec.r)} of the people who reach it.`,fix:"Make the decision instant and explain the outcome. Test “Instant decision”."});
 let fu=null;if(post)fu=post.r;else if(p.actuals){const a=p.actuals;fu=1-a.active.reduce((x,y)=>x+y,0)/a.opened.reduce((x,y)=>x+y,0)}
 if(fu!=null)add({p:"truth",law:"Second moment of truth",t:"First use of the account",k:post?post.k:undefined,s:cl(1-(fu-.1)/.6),find:`${pct(fu)} of opened accounts are never used.`,fix:"Prompt a first transaction straight after opening. Test “First-transaction nudges”."});
 // trust: the customer who struggles most (persona values are assumptions)
 const inelT=R.perp.reduce((a,x)=>a+x.inel,0),pr=p.personas.map((pe,j)=>{const q=R.perp[j].n-R.perp[j].inel;return{n:pe.name,c:q,r:q>0?R.perp[j].opened/q:0}}).filter(x=>x.c>=n*.02).sort((a,b)=>a.r-b.r),ov=R.openN/Math.max(1,n-inelT);
 if(pr.length>1&&ov>0)add({p:"trust",law:"Inclusive design",t:"The customer who struggles most",w:1,soft:true,s:cl((pr[0].r/ov-.3)/.6),find:`${pr[0].n} opens at ${(pr[0].r*100).toFixed(1)} per 100 against ${(ov*100).toFixed(1)} overall${inelT?", among people who qualify":""}. Persona values are assumptions.`,fix:"Walk the flow as this customer: entry-level phone, low data, less confidence."});
 const block=pre.slice(lead).filter(x=>x.r>=.5);
 return{out,pre,post,lead,block,last};
}
function flowScore(A){
 const checks=[...A.out,...FQ.map(q=>({id:q[0],p:q[1],law:q[2],t:q[3],fix:q[4],s:FANS[q[0]]==null?null:FANS[q[0]],w:1}))];
 const calc=fill=>{let T=0,W=0;const per={};FP.forEach(P=>{let a=0,b=0,hard=0;checks.filter(c=>c.p===P[0]).forEach(c=>{const v=c.s==null?fill:c.s;if(v==null)return;a+=v*c.w;b+=c.w;if(!c.soft)hard++});if(!hard)b=0;per[P[0]]=b?a/b*100:null;if(b){T+=per[P[0]]*P[3];W+=P[3]}});return{score:W?T/W:0,per}};
 const ans=FQ.filter(q=>FANS[q[0]]!=null).length;
 return{checks,now:calc(null),lo:calc(0),hi:calc(1),ans,total:FQ.length};
}
const fcol=s=>s>=80?"var(--green)":s>=60?"var(--amber)":"var(--red)";
const fword=v=>v==null?["Not rated","mute"]:v>=.8?["Strong","g"]:v>=.55?["Okay","a"]:["Weak","r"];

function flowVerdict(A,S){
 const sc=Math.round(S.now.score),cov=S.ans/S.total;
 const blocked=A.block.length>0;
 let verdict,vc,vsub;
 if(blocked){verdict="Fix before testing";vc="var(--red)";vsub=`${A.block.length===1?"One screen loses":A.block.length+" screens lose"} half or more of the people who reach ${A.block.length===1?"it":"them"}. Testing will mostly confirm that.`}
 else if(cov<.5){verdict="Early read";vc="var(--ink)";vsub="No blockers in the funnel. Review the screens to complete the score."}
 else if(sc>=80){verdict="Ready for user testing";vc="var(--green)";vsub="No blockers and strong scores. Use testing to confirm, not to find the basics."}
 else if(sc>=60){verdict="Test with care";vc="var(--amber)";vsub="Testable, but fix the items below first or they will dominate the sessions."}
 else{verdict="Not ready yet";vc="var(--red)";vsub="Too many known problems. Fix the items below before spending time with customers."}
 if(!S.ans&&blocked)vsub+=" The score uses the funnel only until the screens are reviewed.";
 return{verdict,vc,vsub,sc};
}
// ===== Customer and design feedback dashboard =====
// Three sources, never mixed up: the funnel (data), the simulated customers (behaviour and voices), and a review of the screens (design laws).
let FSHOTS={},FBUSY=false;
const lawLbl=s=>s==="works"?["Works well","g"]:s==="partly"?["Partly","a"]:s==="needs work"?["Needs work","r"]:["Can't tell from the screens","mute"];
const autoSt=v=>v>=.8?"works":v>=.55?"partly":"needs work";
function shotsFor(p){if(p.design&&typeof DSG!=="undefined"&&("Design: "+DSG.name)===p.name){const s=DSG.screens.filter(x=>x.big||x.img).map(x=>({n:x.n,img:x.big||x.img,small:!x.big}));if(s.length)return s}return FSHOTS[p.name]||[]}
// customer feedback per screen, from the simulated customers
const OVTIP="Their share of the people who left this screen, divided by their share of everyone who started. 1.0× means they leave here at the usual rate.";
function custByScreen(p,R){
 const K=p.steps.length,left=Array.from({length:K},()=>[]),pass=Array.from({length:K},()=>[]),tagOf=k=>p.steps[k]&&p.steps[k].tag;
 R.cust.forEach((c,i)=>{if(c.status==="drop"&&c.dropK>=0)left[c.dropK].push(c);else if(i%4===0)c.path.forEach(q=>{if(pass[q.k].length<3000)pass[q.k].push(c)})});
 const EV={m:"mis-tapped",b:"went back",i:"got interrupted",r:"re-read it without acting",w:"picked the wrong option",s:"skipped the terms"},n=R.cust.length;
 return p.steps.map((s,k)=>{if(!R.att[k]||s.tag==="elig")return null;const L=left[k];if(!L.length)return{k,s,st:stuckAt(p,R,k),rate:0,n:0};
  const rc={};L.forEach(c=>{const r=c.rs||"No reason";rc[r]=(rc[r]||0)+1});const top=Object.entries(rc).sort((a,b)=>b[1]-a[1])[0];
  const er=(cs,ch)=>cs.length?cs.filter(c=>(c.ev||[]).some(e=>e[0]===k&&e[1].includes(ch))).length/cs.length:0;
  const evs=Object.keys(EV).map(ch=>{const a=er(L,ch),b=er(pass[k],ch);return{ch,a,b,d:a-b,r:a/Math.max(.005,b)}}).filter(x=>x.d>.015).sort((x,y)=>y.r-x.r).slice(0,2);
  const pc={};L.forEach(c=>{pc[c.j]=(pc[c.j]||0)+1});let who=null;Object.entries(pc).forEach(([j,c])=>{const ov=(c/L.length)/Math.max(1e-9,R.perp[+j].n/n);if(c/L.length>=.03&&(!who||ov>who.ov))who={j:+j,ov}});
  // three voices from different customers with different reasons, over-represented personas first
  const q=[],uj=new Set(),ur=new Set(),seen=new Set(),ovj=j=>(pc[j]||0)/L.length/Math.max(1e-9,R.perp[j].n/n),cand=L.filter((c,i)=>i%Math.max(1,Math.floor(L.length/400))===0).sort((a,b)=>ovj(b.j)-ovj(a.j)||hr(a,91)-hr(b,91));
  for(const pass of[0,1])for(const c of cand){if(q.length>=3)break;const r=(c.rs||"").split(":")[0];if(uj.has(c.j)||(pass===0&&ur.has(r)))continue;const v=speak(c,p.personas[c.j],tagOf);if(!v.text||(v.fine&&q.some(x=>x.fine)))continue;if(qcheck(v.text,btr(p.personas[c.j]),seen).length)continue;uj.add(c.j);ur.add(r);q.push({c,t:v.text,fine:!!v.fine})}
  return{k,s,st:stuckAt(p,R,k),rate:R.fail[k]/R.att[k],n:L.length,top:top?[top[0],top[1]/L.length]:null,ev:evs.map(x=>({l:EV[x.ch],a:x.a,b:x.b})),who,q}}).filter(Boolean)}
// take the top items, keeping at least two from each source when both have them
function mixSrc(L,n){const d=L.filter(x=>x.src==="data"),s=L.filter(x=>x.src==="screens");if(!d.length||!s.length)return L.slice(0,n);const keep=[...d.slice(0,Math.max(2,n-Math.min(2,s.length))),...s.slice(0,Math.max(2,n-Math.min(2,d.length)))];return L.filter(x=>keep.includes(x)).slice(0,n)}
function drawFlow(){
 const el=$("fcRoot");if(!el||!BASE)return;const p=cur();flowLoad(p);
 const A=flowAuto(BASE,p),S=flowScore(A),sc=Math.round(S.now.score),lo=Math.round(S.lo.score),hi=Math.round(S.hi.score),reviewed=!!FREV;
 const {verdict,vc,vsub}=flowVerdict(A,S);
 let delta="";
 if(changed()){const s2=Math.round(flowScore(flowAuto(SCEN,p)).now.score),d=s2-sc;delta=`<div class="fdelta">With the changes you're testing in Drop-off and ideas: <b>${s2}</b> <span style="color:${d>0?"var(--green)":d<0?"var(--red)":"var(--mut)"}">(${d>0?"+":""}${d})</span></div>`}
 const C=2*Math.PI*52,ring=`<svg viewBox="0 0 128 128" class="fring" role="img" aria-label="Flow confidence ${sc} out of 100"><circle cx="64" cy="64" r="52" fill="none" stroke="#e9e9ee" stroke-width="11"/><circle cx="64" cy="64" r="52" fill="none" stroke="${fcol(sc)}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(C*sc/100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 64 64)"/><text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-size="38" font-weight="700" fill="#1d1d1f" style="letter-spacing:-.03em">${sc}</text><text x="64" y="92" text-anchor="middle" font-size="10" fill="#6e6e73">out of 100</text></svg>`;
 const src=(ok,l)=>`<div class="fsrc"><span class="${ok?"on":""}">${ok?"✓":"○"}</span>${l}</div>`;
 let h=`<div class="card"><h2>Customer and design feedback</h2><p class="lead">What works, what doesn't and why, from three sources: the funnel, the synthetic customers and a review of the screens.</p>
 <div class="fhero"><div class="fhero-l">${ring}<div><div class="ctl-l" style="margin:0 0 2px;color:var(--mut)">Flow confidence</div><div class="fverdict" style="color:${vc}">${verdict}</div><div class="fsub">${vsub}</div>${delta}</div></div>
 <div class="ctlbox"><div class="ctl-l">What this is based on</div>${src(true,"Funnel: where people leave"+(p.mock?" (mock data)":p.design?" (predicted)":""))}${src(true,"Synthetic customers: what they did and said")}${src(reviewed,reviewed?`Screen review: ${FREV.n} screens, ${new Date(FREV.at).toISOString().slice(0,10)}`:"Screen review: not done yet")}
 ${reviewed?"":`<div class="hint" style="margin-top:6px">Until the screens are reviewed, the score could land anywhere from <b>${lo}</b> to <b>${hi}</b>.</div>`}</div></div>
 <div class="fpill">${FP.map(P=>{const v=S.now.per[P[0]];return`<div class="fp"><div class="fp-n">${P[1]}</div><div class="fp-s" style="color:${v==null?"var(--mut)":fcol(v)}">${v==null?"–":Math.round(v)}</div><div class="fp-b"><i style="width:${v==null?0:v.toFixed(0)}%;background:${v==null?"transparent":fcol(v)}"></i></div><div class="fp-q">${v==null?"Needs the screen review":P[2]}</div></div>`}).join("")}</div>`;
 // one feedback section: every step's numbers, problems, strengths and voices, from all simulated customers plus the screen review
 const R=FREV&&FREV.laws||{},P=panelRun(p,BASE),shots=shotsFor(p),canAsk=!!VSAMPLE;PNLC=[];
 const k2=Object.fromEntries((FREV&&FREV.screens||[]).map(s=>[s.n,p.steps.findIndex(x=>x.name===s.step)])),byStep={},flowWide=[];let pending=0;const cant=[];
 FQ.forEach(q=>{const o=R[q[0]];if(!o){pending++;return}if(STV[o.st]==null){cant.push({law:q[2],t:q[3],find:o.find});return}
  const x={law:q[2],t:q[3],st:o.st,find:o.find,fix:o.fix||q[4]},ks=[...new Set((o.scr||[]).map(n=>k2[n]).filter(k=>k>=0))].slice(0,2);
  if(ks.length)ks.forEach(k=>(byStep[k]=byStep[k]||[]).push(x));else flowWide.push(x)});
 A.out.forEach(c=>flowWide.push({law:c.law,t:c.t,st:autoSt(c.s),find:c.find,fix:c.fix,data:1}));
 const live=P.steps.filter(s=>s.reach),wq=live.reduce((m,s)=>!m||s.quit>m.quit?s:m,null),ws=live.reduce((m,s)=>!m||s.str/s.reach>m.str/m.reach?s:m,null);
 h+=fbKpis(P);
 h+=`<div class="frev"><div class="frev-t"><b>Screen review</b> <span class="hint" style="margin:0">${reviewed?`${FREV.n} screens reviewed by Claude on ${new Date(FREV.at).toISOString().slice(0,10)}. Its findings sit in each step below.`:"Add the screens and Claude checks them against the design laws. Its findings land in each step below. Until then, each step uses typical findings."}</span></div>
 ${shots.length?`<div class="fshots">${shots.map((s,i)=>`<figure><img src="${s.img}" alt=""><figcaption><em>${i+1}</em>${esc(s.n)}</figcaption></figure>`).join("")}</div>`:""}
 <div class="frev-a"><label class="dzdrop" id="fDrop"><input type="file" id="fFile" accept="image/*" multiple hidden><b>${shots.length?"Replace the screens":"Add the screens"}</b><span>PNG or JPG from Figma, in flow order</span></label>
 <button id="fReview" class="on" ${shots.length&&canAsk&&!FBUSY?"":"disabled"}>${FBUSY?"Reviewing…":reviewed?"Review again":"Review with Claude"}</button>${reviewed?'<button class="linkbtn" id="fRevClear">Clear</button>':""}</div>
 <div class="hint" id="fRevMsg">${!canAsk?"The screen review needs Claude, so it only works when this page is opened in Claude.":!shots.length?"":"Takes about a minute. Uses your Claude usage."}</div></div>`;
 h+=`<h3 class="fsec">Step by step</h3><p class="lead" style="margin-top:2px">The full synthetic base of ${P.N.toLocaleString("en-ZA")} customers, plus the screen review. The steps that need the most attention are open. Tap any step to open it.</p>`;
 live.forEach((s,i)=>{const m=[];if(s===wq)m.push("MOST QUIT");if(s===ws)m.push("HARDEST");h+=fbStep(p,P,BASE,s.k,i,byStep[s.k]||[],m)});
 const fw=flowWide.sort((a,b)=>(STV[a.st]??1)-(STV[b.st]??1)).filter((x,i,a)=>a.findIndex(y=>y.law===x.law)===i),fwb=fw.filter(x=>x.st!=="works"),fwg=fw.filter(x=>x.st==="works");
 const frow=(x,ok)=>`<li class="${ok?"ok":x.st==="partly"?"part":"no"}"><div><b>${esc(x.law)}</b> ${x.data?'<span class="chip calc">DATA</span>':'<span class="chip sim">SCREENS</span>'}</div><div class="ff">${esc(x.find||x.t)}</div>${ok?"":`<div class="ffix">${esc(x.fix)}</div>`}</li>`;
 h+=`<details class="fstep"${live.length?"":" open"}><summary class="fs-sum"><span class="fidx">∑</span><div class="fs-m"><div class="fs-t"><b>Across the whole flow</b></div><div class="fs-top">${fwb.length} design laws to fix · ${fwg.length} working</div></div><div class="fs-k"></div><span class="fs-chev" aria-hidden="true"></span></summary>
 <div class="fs-body"><div class="fs-col"><h4>What to fix</h4>${fwb.length?`<ol class="fx">${fwb.map((x,j)=>`<li><div class="fx-n">${j+1}</div><div class="fx-b"><div class="fx-t"><b>${esc(x.law)}</b><span class="fx-src">${x.data?"Data":"Screen review"}</span></div><div class="fx-d">${esc(x.find||x.t)}</div>${x.fix?`<div class="fx-f"><span>Fix</span>${esc(x.fix)}</div>`:""}</div></li>`).join("")}</ol>`:'<div class="hint">Nothing flagged.</div>'}</div>
 <div class="fs-side"><h4>What works</h4>${fwg.length?fwg.map(x=>`<div class="fw"><b>✓ ${esc(x.law)}</b><span>${esc(x.find||x.t)}</span></div>`).join(""):'<div class="hint">Nothing yet.</div>'}</div></div>
 ${pending?`<div class="pendbox" style="margin-top:10px"><b>${pending} more design checks run once the screens are reviewed.</b> <button class="linkbtn" id="fGoRev">Add the screens</button></div>`:""}
 ${cant.length?`<details class="legend" style="margin-top:10px"><summary>${cant.length} checks Claude couldn't judge from static screens</summary><div class="note" style="margin-top:6px">${cant.map(c=>`<b>${esc(c.law)}</b>: ${esc(c.find||c.t)}`).join("<br>")}<br>Check these in a prototype or in user testing.</div></details>`:""}</details>`;
 h+=`${canAsk?`<div class="foot"><button id="pnlAsk" class="on">Ask them again with Claude</button><span class="hint" id="pnlMsg" style="margin:0">Claude rewrites the quotes above in each person's voice and natural length, from what happened to them and what the review found on that step.</span></div>`:""}
 <div class="note" style="margin-top:12px">Synthetic customers, not real feedback. Ratings, comments and tags come from each persona's traits and what they did in this run, using the persona behaviour guide. Use them to decide what to test with real people first.</div>
 <details class="legend" style="margin-top:12px"><summary>How this works</summary><div class="note" style="margin-top:8px">
 <p><b>Customers.</b> Feedback comes from the persona feedback kit v2. Who quits, and where, comes from the calibrated simulation. Who struggles at each step follows the kit's engine: each problem the review found on that step counts more for people who feel it most (data-heavy screens for prepaid users, small text for people over 60, document demands for people without proof of address, jargon for basic readers). Each person's comments are picked from ${KBANK.length} tagged lines in the kit's bank that fit their life and the step's problems, and filled in with their details. Each person also gives an overall answer, a rating from 1 to 5 and what they'd change. Polite personas often say it was fine even when they struggled. That is the say-vs-do gap.</p>
 <p><b>People.</b> Each simulated customer is a real person from the v7.1 persona pack (10,000 South Africans, weighted by population), picked from the same archetype. Their age, income, grants, work, phone, data, network, documents, reading level, trust, patience and way of talking come from the pack.</p>
 <p><b>Fields.</b> Every slip and drop-off on a step is placed on one of its fields, weighted by what the field is and who the customer is.</p>
 <p><b>Screens.</b> Claude checks the screens you add against each design law. It sees only the images, so treat its findings as a strong first pass for the team to confirm.</p>
 <p><b>Score.</b> A weighted average of five areas: ${FP.map(P=>`${P[1]} (${P[3]}%)`).join(", ")}. 80 and above is ready for user testing, 60 to 79 is test with care, below 60 is not ready. Weights, cut-offs and how each persona reacts are starting assumptions to tune against real test results.</p></div></details></div>`;

 el.innerHTML=h;goalSwap(el);
}
// adding screens for the review
function fAddShots(files){const p=cur(),list=[...files].filter(f=>/^image\//.test(f.type)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));if(!list.length)return;let left=list.length;const out=[];
 list.forEach((file,i)=>{const nm=file.name.replace(/\.[a-z0-9]+$/i,"").replace(/[_-]+/g," ").replace(/^\d+\s*/,"").trim()||"Screen "+(i+1);const done=img=>{out[i]={n:nm,img};if(--left===0){FSHOTS[p.name]=out.filter(x=>x&&x.img);drawFlow()}};
  const fr=new FileReader();fr.onerror=()=>done("");fr.onload=()=>{const im=new Image();im.onerror=()=>done("");im.onload=()=>{try{const w=Math.min(1000,im.width),c=document.createElement("canvas");c.width=w;c.height=Math.round(im.height/im.width*w);c.getContext("2d").drawImage(im,0,0,c.width,c.height);done(c.toDataURL("image/jpeg",.82))}catch(x){done("")}};im.src=fr.result};fr.readAsDataURL(file)})}
const toBlob=u=>{const [h,b]=u.split(","),bin=atob(b),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:(h.match(/:(.*?);/)||[])[1]||"image/jpeg"})};
async function fReview(){
 const p=cur(),shots=shotsFor(p),msg=()=>$("fRevMsg");if(!VSAMPLE||!shots.length||FBUSY)return;FBUSY=true;drawFlow();msg().textContent="Reviewing… this can take a minute or two.";
 try{const lim=await VSAMPLE.limits().catch(()=>null),max=lim&&lim.images?lim.images.maxCount:0;if(!max)throw{code:"images_unavailable"};
  const use=shots.slice(0,max),screens=use.map((s,i)=>`${i+1}. ${s.n}`).join("\n"),lawList=FQ.map(q=>`- id "${q[0]}" (${q[2]}): ${q[3]}`).join("\n"),stepList=p.steps.filter(s=>!s.post).map(s=>`"${s.name}"`).join(", ");

  const prompt=`You are reviewing the screens of a banking app flow for a South African bank before user testing. The images are the screens in order:
${screens}
The flow is: ${p.name}${p.design?" (a new design)":""}. Customers include people on entry-level phones with small data bundles, people who read at a basic level or are more comfortable in another home language, older customers, and confident digital users.

Check the screens against each design law below. For each, decide:
- "works" if the screens clearly do this,
- "partly" if some screens do and some don't,
- "needs work" if the screens clearly don't,
- "can't tell" if it can't be judged from static screens (for example load speed or what happens after an error).
Write the finding as one short plain sentence a designer can act on, naming what you saw. If not "works", give one short fix. List the screen numbers it applies to. Do not invent things that are not visible.

Laws:
${lawList}

Also list the input fields and controls on each screen, as the customer sees them, so we can show which fields customers get stuck on. Also give, per screen, "topic": the one that fits best from ${KTOPICS.join(", ")}. And "issues": the problems a customer would likely hit there, as an object of tag to severity, with tags chosen exactly from ${CTAGS.join(", ")} and severity 1 (minor), 2 (slows people down) or 3 (stops people). And "strengths": what the screen does well, chosen exactly from ${PTAGS.join(", ")}. Only list what is visible. For each screen give "step": the name of the step it belongs to, chosen exactly from this list: ${stepList}. For each field give "name" (the label as shown), "kind" (one of text, id, phone, email, money, date, address, select, choice, toggle, upload, camera, otp, consent, info), and true or false for "jargon" (a bank or legal term a customer may not know), "help" (help text or an example next to it), "strict" (looks like it needs an exact format), "prefilled", "long" (a lot of text to read).

Reply with only JSON like {"laws":{"hick":{"status":"partly","finding":"...","fix":"...","screens":[2,3]}, ...},"screens":[{"n":1,"step":"Personal details","fields":[{"name":"ID number","kind":"id","jargon":false,"help":true,"strict":true,"prefilled":false,"long":false}],"topic":"personal_details","issues":{"retype":2},"strengths":["saved_progress"]}]} with every law id above present and one entry per screen.`;
  const out=await VSAMPLE.json(prompt,{images:use.map(s=>toBlob(s.img)),cache:false});
  const L=out&&out.laws;if(!L||typeof L!=="object")throw{code:"invalid_json"};
  const laws={};FQ.forEach(q=>{const o=L[q[0]];if(!o)return;const st=String(o.status||"").toLowerCase();laws[q[0]]={st:STV[st]!=null?st:"can't tell",find:String(o.finding||"").slice(0,300),fix:String(o.fix||"").slice(0,240),scr:Array.isArray(o.screens)?o.screens.filter(n=>Number.isInteger(n)).slice(0,10):[]}});
  if(!Object.keys(laws).length)throw{code:"invalid_json"};
  const KS=["text","id","phone","email","money","date","address","select","choice","toggle","upload","camera","otp","consent","info"],names=p.steps.map(s=>s.name);
  const scr=Array.isArray(out.screens)?out.screens.slice(0,use.length).map((sc,i)=>{const st=sc&&names.includes(sc.step)?sc.step:(p.design&&p.steps[i]?p.steps[i].name:null);
   return{n:i+1,step:st,fields:(Array.isArray(sc&&sc.fields)?sc.fields:[]).slice(0,14).map(x=>({n:String(x.name||"Field").slice(0,60),k:KS.includes(x.kind)?x.kind:"text",j:x.jargon?1:0,h:x.help?1:0,f:x.strict?1:0,p:x.prefilled?1:0,l:x.long?1:0})),topic:KTOPICS.includes(sc&&sc.topic)?sc.topic:null,is:Object.entries(sc&&sc.issues&&typeof sc.issues==="object"&&!Array.isArray(sc.issues)?sc.issues:{}).filter(([t])=>CTAGS.includes(t)).slice(0,6).map(([t,v])=>({t,s:Math.max(1,Math.min(3,Math.round(+v||1)))})),gd:(Array.isArray(sc&&sc.strengths)?sc.strengths:[]).filter(t=>PTAGS.includes(t)).slice(0,4)}}):[];
  setReview({at:Date.now(),n:use.length,laws,screens:scr},true);FBUSY=false;drawFlow();
  if(shots.length>max)$("fRevMsg").textContent=`Reviewed the first ${max} screens. Claude can look at ${max} at a time.`;
  if(typeof drawSum==="function")drawSum()}
 catch(e){FBUSY=false;drawFlow();const c=e&&e.code;$("fRevMsg").textContent=c==="not_granted"?"Claude isn't allowed for this page.":c==="images_unavailable"?"This view can't send images to Claude.":c==="rate_limited"?"Too many requests. Try again in a minute.":c==="invalid_json"?"The review came back in the wrong shape. Try again.":"Couldn't finish the review. Try again later."}}
document.addEventListener("change",e=>{if(e.target&&e.target.id==="fFile"){fAddShots(e.target.files);e.target.value=""}});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button");if(b){if(b.id==="fGoRev"){const d=$("fDrop");if(d&&d.scrollIntoView)d.scrollIntoView({behavior:"smooth",block:"center"});return}if(b.id==="fReview"){fReview();return}if(b.id==="fRevClear"){try{localStorage.removeItem(FKEY)}catch(x){}FANS={};FREV=null;drawFlow();return}}
 const r=e.target.closest&&e.target.closest("[data-cfk]");if(r){const k=+r.dataset.cfk;$("tbJ").click();if(typeof vocPick==="function")vocPick(k);const v=$("vocBox");if(v&&v.scrollIntoView)setTimeout(()=>v.scrollIntoView({behavior:"smooth",block:"start"}),60)}});
["dragover","drop"].forEach(ev=>document.addEventListener(ev,e=>{const z=e.target.closest&&e.target.closest("#fDrop");if(!z)return;e.preventDefault();if(ev==="drop"&&e.dataTransfer)fAddShots(e.dataTransfer.files)}));

