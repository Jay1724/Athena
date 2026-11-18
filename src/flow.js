
// ===== Flow confidence: a readiness score for a flow before user testing =====
// Two inputs. (1) Evidence: computed from the funnel behind the selected flow. (2) Design review: the designer answers a checklist.
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
let FANS={},FKEY="";
function flowLoad(p){const k="flowconf:"+p.name;if(k===FKEY)return;FKEY=k;FANS={};try{const v=JSON.parse(localStorage.getItem(k)||"{}");if(v&&typeof v==="object")FANS=v}catch(x){}}
function flowSave(){try{localStorage.setItem(FKEY,JSON.stringify(FANS))}catch(x){}}

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
 else if(cov<.5){verdict="Early read";vc="var(--ink)";vsub="No blockers in the funnel evidence. Answer at least half of the design review to get a verdict."}
 else if(sc>=80){verdict="Ready for user testing";vc="var(--green)";vsub="No blockers and strong scores. Use testing to confirm, not to find the basics."}
 else if(sc>=60){verdict="Test with care";vc="var(--amber)";vsub="Testable, but fix the items below first or they will dominate the sessions."}
 else{verdict="Not ready yet";vc="var(--red)";vsub="Too many known problems. Fix the items below before spending time with customers."}
 if(!S.ans&&blocked)vsub+=" The score is from the funnel evidence only until the design review is done.";
 return{verdict,vc,vsub,sc};
}
function drawFlow(){
 const el=$("fcRoot");if(!el||!BASE)return;const p=cur();flowLoad(p);
 const A=flowAuto(BASE,p),S=flowScore(A),sc=Math.round(S.now.score),lo=Math.round(S.lo.score),hi=Math.round(S.hi.score),cov=S.ans/S.total;
 const {verdict,vc,vsub}=flowVerdict(A,S);
 let delta="";
 if(changed()){const s2=Math.round(flowScore(flowAuto(SCEN,p)).now.score),d=s2-sc;delta=`<div class="fdelta">With the changes you're testing in Drop-off and ideas: <b>${s2}</b> <span style="color:${d>0?"var(--green)":d<0?"var(--red)":"var(--mut)"}">(${d>0?"+":""}${d})</span></div>`}
 const C=2*Math.PI*52,ring=`<svg viewBox="0 0 128 128" class="fring" role="img" aria-label="Flow confidence ${sc} out of 100"><circle cx="64" cy="64" r="52" fill="none" stroke="#e9e9ee" stroke-width="11"/><circle cx="64" cy="64" r="52" fill="none" stroke="${fcol(sc)}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(C*sc/100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 64 64)"/><text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-size="38" font-weight="700" fill="#1d1d1f" style="letter-spacing:-.03em">${sc}</text><text x="64" y="92" text-anchor="middle" font-size="10" fill="#6e6e73">out of 100</text></svg>`;
 let h=`<div class="card"><h2>Flow confidence</h2><p class="lead">How ready is this flow for user testing?</p>
 <div class="fhero"><div class="fhero-l">${ring}<div><div class="fverdict" style="color:${vc}">${verdict}</div><div class="fsub">${vsub}</div>${delta}</div></div>
 <div class="ctlbox"><div class="ctl-l">How complete is this score?</div><div class="hint">${p.design?"Evidence checks use this design's screens and its predicted drop-off.":p.mock?"Evidence checks use this account's mock funnel numbers.":p.src==="template"?"Illustrative numbers. The evidence checks become real once you load funnel data.":"Evidence checks use this flow's funnel data."}</div>
 <div class="fcov"><div class="fcovbar"><i style="width:${(cov*100).toFixed(0)}%"></i></div><div class="hint">Design review: ${S.ans} of ${S.total} answered.${S.ans<S.total?` The score could land anywhere from <b>${lo}</b> to <b>${hi}</b> once it's complete.`:""}</div></div></div></div>
 <div class="fpill">${FP.map(P=>{const v=S.now.per[P[0]];return`<div class="fp"><div class="fp-n">${P[1]}</div><div class="fp-s" style="color:${v==null?"var(--mut)":fcol(v)}">${v==null?"–":Math.round(v)}</div><div class="fp-b"><i style="width:${v==null?0:v.toFixed(0)}%;background:${v==null?"transparent":fcol(v)}"></i></div><div class="fp-q">${v==null?"Needs the design review":P[2]}</div></div>`}).join("")}</div></div>`;
 // fix first
 const pw=Object.fromEntries(FP.map(P=>[P[0],P[3]])),fx=S.checks.filter(c=>c.s!=null&&c.s<.7).sort((a,b)=>(1-b.s)*b.w*pw[b.p]-(1-a.s)*a.w*pw[a.p]).slice(0,5);
 h+=`<div class="card"><h2>Fix these first</h2><p class="lead">The checks pulling the score down most.</p>${fx.length?fx.map((c,i)=>`<div class="frow"><div class="fnum">${i+1}</div><div class="fbody"><div class="ft">${c.auto?esc(c.t):esc(c.t)} <span class="chip">${esc(c.law)}</span>${c.auto?' <span class="chip calc">FROM THE DATA</span>':' <span class="chip ass">DESIGN REVIEW</span>'}</div>${c.auto?`<div class="ff">${esc(c.find)}</div>`:""}<div class="ffix">${esc(c.fix)}</div></div></div>`).join(""):`<div class="note">Nothing scores below 70 yet${S.ans<S.total?". Finish the design review to be sure":""}.</div>`}</div>`;
 // screen by screen
 const flag={};S.checks.filter(c=>c.auto&&c.k!=null&&c.s<.7).forEach(c=>{(flag[c.k]=flag[c.k]||[]).push(c.t)});
 const mot=k=>{const x=A.pre.find(y=>y.k===k);if(!x)return"First use";if(x===A.last)return"The finish";if(A.pre.indexOf(x)<A.lead)return"The opening";if(["verify","idcap"].includes(x.s.tag))return"Identity check";if(x.s.tag==="decision")return"Decision";return""};
 const rowsS=[...A.pre,...(A.post?[A.post]:[])];
 h+=`<div class="card"><h2>Screen by screen</h2><p class="lead">Share of people who leave at each screen. Moments of truth are marked.</p>${rowsS.map((x,i)=>{const m=mot(x.k),bad=x.r>=.5&&!x.s.post&&A.pre.indexOf(x)>=A.lead;return`<div class="fscr"><div class="fscr-n"><span class="fidx">${i+1}</span>${esc(x.s.name)}${m?` <span class="chip sim">${m.toUpperCase()}</span>`:""}${bad?' <span class="chip" style="background:var(--red);border-color:var(--red);color:#fff">BLOCKER</span>':""}</div><div class="fscr-b"><i style="width:${Math.max(x.r*100,1).toFixed(0)}%;background:${x.r>=.4?"var(--red)":x.r>=.2?"var(--amber)":"#c7c7cc"}"></i></div><div class="fscr-v">${(x.r*100).toFixed(0)}%</div></div>`}).join("")}</div>`;
 // evidence
 const pill=v=>{const w=fword(v);return`<span class="fpl ${w[1]}">${w[0]}</span>`};
 h+=`<div class="card"><h2>Evidence from the funnel</h2><p class="lead">Scored automatically from how people move through this flow today.</p>${FP.map(P=>{const cs=A.out.filter(c=>c.p===P[0]);return cs.length?`<h3 class="fh3">${P[1]}</h3>`+cs.map(c=>`<div class="frow"><div class="fbody"><div class="ft">${esc(c.t)} <span class="chip">${esc(c.law)}</span></div><div class="ff">${esc(c.find)}</div></div>${pill(c.s)}</div>`).join(""):""}).join("")}</div>`;
 // design review
 h+=`<div class="card"><h2>Design review</h2><p class="lead">Rate each statement against the designs. Be strict: “Partly” if it's true on some screens only.</p>${FP.map(P=>`<h3 class="fh3">${P[1]}</h3>`+FQ.filter(q=>q[1]===P[0]).map(q=>{const v=FANS[q[0]];return`<div class="frow rv"><div class="fbody"><div class="ft">${esc(q[3])}</div><div class="ff"><span class="chip" style="margin-left:0">${esc(q[2])}</span></div></div><div class="seg fa">${[["Yes",1],["Partly",.5],["No",0]].map(o=>`<button data-fq="${q[0]}" data-v="${o[1]}" class="${v===o[1]?"on":""}">${o[0]}</button>`).join("")}</div></div>`}).join("")).join("")}
 <div class="foot"><button id="fClear" class="linkbtn">Clear the review for this flow</button></div></div>`;
 h+=`<div class="card"><details class="legend"><summary>How the score works</summary><div class="note" style="margin-top:8px">
 <p>The score is a weighted average of five areas: ${FP.map(P=>`${P[1]} (${P[3]}%)`).join(", ")}. Inside each area, a check from the funnel data counts double a design review answer, because it is observed and not self-rated.</p>
 <p>Design review answers score Yes 100, Partly 50, No 0. Unanswered statements are left out, which is why the score comes with a range until the review is complete.</p>
 <p>Verdicts: 80 and above is ready for user testing, 60 to 79 is test with care, below 60 is not ready. Any screen after the opening that loses half or more of the people who reach it is a blocker and overrides the score.</p>
 <p>These weights and cut-offs are starting assumptions. The score is a structured checklist to catch known problems before testing. It does not predict how a test will go, and it should be tuned as you compare scores with real test results.</p></div></details></div>`;
 el.innerHTML=h;goalSwap(el);
}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button");if(!b)return;
 if(b.dataset.fq){const v=+b.dataset.v;if(FANS[b.dataset.fq]===v)delete FANS[b.dataset.fq];else FANS[b.dataset.fq]=v;flowSave();drawFlow()}
 else if(b.id==="fClear"){FANS={};flowSave();drawFlow()}});
FLOW_READY=true;drawFlow();
