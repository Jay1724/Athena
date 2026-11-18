
// ===== Fields: where on a screen the synthetic customers get stuck =====
// Each screen has fields: read from the designer's screens by the screen review, or typical fields for that type of step.
// Every event and drop-off a customer has on a screen is placed on a field, weighted by the field (kind, jargon, strict format,
// help, prefill, length) and by the persona (reading level, English comfort, devices, trust). Step totals don't change, only where they land.
// k: text id phone email money date address select choice toggle upload camera otp consent info. j jargon, h help, f strict, p prefilled, l long.
const DFIELDS={
 select:[{n:"Account options",k:"choice"},{n:"Monthly fee and benefits",k:"info"},{n:"Apply now button",k:"choice"}],
 elig:[{n:"Age and citizenship questions",k:"choice"},{n:"Monthly income band",k:"select"}],
 details:[{n:"First name and surname",k:"text"},{n:"SA ID number",k:"id",f:1},{n:"Cellphone number",k:"phone",f:1},{n:"Email address",k:"email"},{n:"Employment status",k:"select"},{n:"Employer name",k:"text"},{n:"Gross monthly income",k:"money"},{n:"Source of funds",k:"select",j:1}],
 idcap:[{n:"Photo of ID card front",k:"camera"},{n:"Photo of ID card back",k:"camera"}],
 verify:[{n:"Selfie",k:"camera"},{n:"Liveness check (turn your head)",k:"camera",j:1}],
 fica:[{n:"Residential address",k:"address"},{n:"Proof of address upload",k:"upload",j:1}],
 decision:[{n:"Overdraft or credit offer",k:"choice",j:1},{n:"Affordability questions",k:"money"}],
 sign:[{n:"Tax residency declaration",k:"choice",j:1},{n:"Terms and conditions",k:"consent",l:1},{n:"OTP code",k:"otp"}],
 none:[{n:"Main input",k:"text"},{n:"Continue button",k:"choice"}]};
const GFIELDS={select:[{n:"What this is",k:"info"},{n:"Start button",k:"choice"}],details:[{n:"Recipient or account",k:"select"},{n:"Amount",k:"money"},{n:"Reference",k:"text"}],idcap:[{n:"Photo capture",k:"camera"}],verify:[{n:"OTP or approval",k:"otp"}],fica:[{n:"Document upload",k:"upload"}],decision:[{n:"Offer",k:"choice",j:1}],sign:[{n:"Review summary",k:"info"},{n:"Confirm button",k:"choice"}],none:[{n:"Main input",k:"text"},{n:"Continue button",k:"choice"}]};
const TYPING=["text","id","phone","email","money","date","address"],PICK=["select","choice","toggle"];
const ISSUE={m:"mis-tapped or typed it wrong",r:"re-read it",w:"picked the wrong option",i:"got interrupted",b:"went back",s:"skipped it",x:"left the flow here"};
// which kinds of field a reason for leaving points at
const RKIND=[[/camera|glare|liveness|check failed|photo/i,["camera"]],[/otp/i,["otp"]],[/no proof|upload|file too|document/i,["upload"]],[/record lookup|don't match/i,["id","text"]],
 [/not at hand|not to hand|no id/i,["money","address","id","text","upload"]],[/privacy|unsure why/i,["money","select","camera"]],[/terms|t&cs|worried/i,["consent","info"]],
 [/declined|answer not|waiting|manual/i,["choice","money"]],[/fees|comparing|qualify|no real intent|just looking|didn't see|unclear what/i,["info","choice"]],
 [/form too long|too much to type/i,TYPING],[/network|timeout|interrupted|signal/i,["camera","upload","otp"]],[/branch/i,["upload","camera","consent"]],[/first transaction/i,["info"]]];
function fieldsFor(p,k){
 const s=p.steps[k];if(!s||s.post)return null;if(typeof flowLoad==="function")flowLoad(p);
 if(FREV&&Array.isArray(FREV.screens)){const fs=[];FREV.screens.forEach(sc=>{if(sc&&sc.step===s.name&&Array.isArray(sc.fields))sc.fields.forEach(f=>fs.push(f))});if(fs.length)return{src:"screens",f:fs}}
 const base=(p.standalone?GFIELDS:DFIELDS)[s.tag]||DFIELDS.none;return{src:"typical",f:base}}
function fw(f,type,B,reason,i,N){
 const k=f.k||"text",ty=TYPING.includes(k),pk=PICK.includes(k),J=f.j?(B.english==="Home language first"||B.reading==="Basic"?4:2.5):1;let w=1;
 if(type==="m")w=ty?(1+(f.f?1.2:0))*(f.p?.3:1)*(B.dev==="entry"?1.3:1):k==="otp"?.8:.15;
 else if(type==="r")w=J*(f.l?2:1)*(f.h?.6:1)*(pk||k==="consent"||k==="info"?1.3:.8);
 else if(type==="w")w=pk?2*J:.1;
 else if(type==="i")w=(["camera","upload","otp"].includes(k)?1.6:1)*(f.l?1.3:1);
 else if(type==="b")w=pk||k==="upload"?1.2:.6;
 else if(type==="s")w=k==="consent"?4:k==="info"?1:.05;
 else if(type==="x"){const m=RKIND.find(q=>q[0].test(reason||""));w=m?(m[1].includes(k)?5:.25):1;if(/form too long|too much/i.test(reason||""))w*=.5+(i+1)/N;w*=f.j?1.4:1;if(/privacy|unsure why/i.test(reason||"")&&B.trust==="L")w*=1.3}
 return Math.max(.001,w)}
const pickW=(ws,x)=>{const T=ws.reduce((a,b)=>a+b,0);let a=0;for(let i=0;i<ws.length;i++){a+=ws[i]/T;if(x<=a)return i}return ws.length-1};
let FSC={b:"",m:{}};
// where customers got stuck on screen k: per field, counts by issue, who, and how many left there
function stuckAt(p,R,k){
 const F=fieldsFor(p,k);if(!F||!F.f.length)return null;const b=p.name+"|"+R.cust.length+"|"+R.openN+"|"+(FREV?FREV.at:0);if(FSC.b!==b)FSC={b,m:{}};if(FSC.m[k])return FSC.m[k];
 const N=F.f.length,rows=F.f.map(f=>({f,t:0,x:0,by:{},who:{}}));let tot=0;
 R.cust.forEach(c=>{const pe=p.personas[c.j],B=btr(pe);const add=(type,salt,reason)=>{const i=pickW(F.f.map((f,ix)=>fw(f,type,B,reason,ix,N)),hr(c,salt));const r=rows[i];r.t++;tot++;r.by[type]=(r.by[type]||0)+1;r.who[c.j]=(r.who[c.j]||0)+1;if(type==="x")r.x++};
  (c.ev||[]).forEach(([kk,e],ei)=>{if(kk===k)[...e].forEach((ch,ci)=>add(ch,300+ei*7+ci))});
  if(c.status==="drop"&&c.dropK===k&&p.steps[k].tag!=="elig")add("x",401,c.rs)});
 const all={};rows.forEach(r=>Object.entries(r.who).forEach(([j,c])=>all[j]=(all[j]||0)+c));
 rows.forEach(r=>{r.sh=tot?r.t/tot:0;r.top=Object.entries(r.by).sort((a,b)=>b[1]-a[1]).filter(e=>e[0]!=="x")[0];
  // the persona most over-represented on this field, compared with everyone stuck on this screen
  let best=null;Object.entries(r.who).forEach(([j,c])=>{if(c/r.t<.04)return;const ov=(c/r.t)/(all[j]/tot);if(!best||ov>best.ov)best={j:+j,ov}});r.wj=best&&best.ov>=1.2?best.j:null;r.wov=best?best.ov:1;
  r.focus=r.sh>=1.3/N;r.fix=fieldFix(r)});
 const out={src:F.src,tot,rows:rows.filter(r=>r.t>0).sort((a,b)=>b.t-a.t)};FSC.m[k]=out;return out}
const issueL=(t,f)=>t==="m"?(TYPING.includes(f.k)?"typed it wrong":"mis-tapped"):ISSUE[t];
function fieldFix(r){const f=r.f,k=f.k||"text",t=r.top?r.top[0]:"x";
 if(f.j&&(t==="r"||t==="w"||t==="x"))return`Say “${f.n}” in everyday words and add a one-line reason.`;
 if(k==="id"||k==="phone")return"Accept spaces and dashes, show an example, and check it as they type.";
 if(k==="money")return"Offer ranges or prefill from what the bank already knows.";
 if(k==="address")return"Use address lookup, and prefill it for existing customers.";
 if(k==="camera")return"Show a framing guide, check the light first, and allow a retry without starting over.";
 if(k==="upload")return"Let them take a photo instead of finding a file, accept any size, or let them finish later.";
 if(k==="otp")return"Show a resend timer and offer a call-me option.";
 if(k==="consent")return"Put a three-line summary above the full terms.";
 if(PICK.includes(k))return"Use fewer, clearer options, with the most common one first.";
 if(t==="i")return"Save what they entered so they can pick up where they stopped.";
 if(k==="info")return"Lead with what they get and what it costs, in one line.";
 return"Check it as they type and keep what they entered when there is an error."}
function stuckHtml(p,S,n){if(!S||!S.rows.length)return"";const rows=S.rows.slice(0,n);
 return`<div class="stk">${rows.map(r=>{const pe=r.wj!=null?p.personas[r.wj]:null,issues=Object.entries(r.by).filter(e=>e[0]!=="x").sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>`${(e[1]/r.t*100).toFixed(0)}% ${issueL(e[0],r.f)}`);
  return`<div class="stk-r"><div class="stk-h"><b>${esc(r.f.n)}</b>${r.f.j?'<span class="chip ass">JARGON</span>':""}<span class="stk-s">${(r.sh*100).toFixed(0)}% of the trouble</span></div><div class="stk-b"><i style="width:${(r.sh/rows[0].sh*100).toFixed(0)}%"></i></div>
  <div class="ff">${r.x?`${f(r.x)} left here. `:""}${issues.length?"Of everyone stuck here: "+issues.join(", ")+".":""}${pe?` <span title="Their share of the trouble on this field, divided by their share of the trouble on this screen.">${esc(pname(pe.name))} is ${r.wov.toFixed(1)}× more likely to get stuck on this field than other customers on this screen.</span>`:""}</div><div class="ffix">${esc(r.fix)}</div></div>`}).join("")}</div>
 <div class="hint" style="margin-top:4px">${S.src==="screens"?"Fields read from your screens by the screen review.":"Typical fields for this kind of step. Review your screens under Feedback to use the real ones."}</div>`}
