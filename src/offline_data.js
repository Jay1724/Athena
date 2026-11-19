// offline_data.js: Athena Offline's data workspace.
// Load funnel exports (CSV, daily, weekly or monthly) and drop-off reasons, check them, keep them on this laptop
// (IndexedDB), and turn them into accounts the simulator calibrates to. Nothing here talks to the network.
var ODATA={files:[],tags:{},saved:null,useMock:false},OCHK=null;

// ---------- CSV ----------
function csvParse(text){
 text=String(text||"").replace(/^\uFEFF/,"");const first=text.split(/\r?\n/,1)[0]||"";
 const cnt=ch=>(first.match(new RegExp("\\"+ch,"g"))||[]).length,del=[",",";","\t"].sort((a,b)=>cnt(b)-cnt(a))[0];
 const rows=[];let row=[],f="",q=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
  else if(c==='"')q=true;else if(c===del){row.push(f);f=""}else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(f);rows.push(row);row=[];f=""}else f+=c}
 if(f!==""||row.length){row.push(f);rows.push(row)}
 return rows.filter(r=>r.some(x=>String(x).trim()!==""))}
const numOf=v=>{const s=String(v==null?"":v).trim().replace(/[\s\u00a0]/g,"").replace(/,(?=\d{3}(\D|$))/g,"");if(s==="")return NaN;return Number(s.replace(",","."))};
const COLS={product:/^(product|account|journey|flow|product name)$/,period:/^(date|day|week|month|period|week start|month start)$/,step:/^(step|stage|screen|page|step name)$/,
 entered:/^(entered|started|reached|in|starts|count in|users in|sessions in)$/,completed:/^(completed|passed|out|finished|completions|count out|users out|sessions out)$/,
 segment:/^(segment|persona|cohort|channel|customer type)$/,reason:/^(reason|drop-?off reason|error|error code|code)$/,count:/^(count|n|drops|drop-?offs|customers|number)$/};
function colMap(h){const m={};h.forEach((x,i)=>{const k=String(x).trim().toLowerCase().replace(/[_]+/g," ");for(const c in COLS)if(m[c]==null&&COLS[c].test(k))m[c]=i});return m}

// ---------- periods ----------
const pad2=n=>String(n).padStart(2,"0");
function periodOf(v){const s=String(v||"").trim();let m;
 if(m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))return{d:`${m[1]}-${pad2(m[2])}-${pad2(m[3])}`,g:"day"};
 if(m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))return{d:`${m[3]}-${pad2(m[2])}-${pad2(m[1])}`,g:"day"};
 if(m=s.match(/^(\d{4})-?W(\d{1,2})$/i)){const t=Date.UTC(+m[1],0,4),dow=(new Date(t).getUTCDay()+6)%7,mon=t-dow*864e5+(+m[2]-1)*7*864e5;return{d:new Date(mon).toISOString().slice(0,10),g:"week"}}
 if(m=s.match(/^(\d{4})-(\d{1,2})$/))return{d:`${m[1]}-${pad2(m[2])}-01`,g:"month"};
 if(m=s.match(/^(\d{4})\/(\d{1,2})$/))return{d:`${m[1]}-${pad2(m[2])}-01`,g:"month"};
 return null}
const dayN=d=>Math.round(Date.parse(d+"T00:00:00Z")/864e5),dayS=n=>new Date(n*864e5).toISOString().slice(0,10),moOf=d=>d.slice(0,7);
function grainOf(dates,hint){if(hint==="month")return"month";const u=[...new Set(dates)].sort().map(dayN);if(u.length<2)return hint||"day";
 const g={};for(let i=1;i<u.length;i++){const x=u[i]-u[i-1];g[x]=(g[x]||0)+1}const top=+Object.entries(g).sort((a,b)=>b[1]-a[1])[0][0];
 return top===1?"day":top===7?"week":top>=28&&top<=31?"month":hint||"day"}

// ---------- step types ----------
const TAGRULES=[["activate",/first transaction|activat|funded|account open|opened/i],["select",/choose|select|landing|product|start|apply now/i],["elig",/eligib|qualif/i],
 ["idcap",/id capture|scan id|id doc|id card|capture id|green id|smart id/i],["verify",/verif|selfie|liveness|biometric|face/i],["fica",/address|proof|fica|income|upload|document/i],
 ["decision",/decision|affordab|risk|credit|approv|vetting/i],["sign",/terms|sign|consent|otp|agree|contract/i],["details",/personal|details|form|contact|about you|profile/i]];
const TAGL2={select:"Choose a product",elig:"Eligibility",details:"Personal details",idcap:"ID capture",verify:"Identity check",fica:"Documents (FICA)",decision:"Credit or risk decision",sign:"Terms and signing",activate:"After opening",none:"Other"};
function guessTag(n){const r=TAGRULES.find(x=>x[1].test(n));return r?r[0]:"none"}

// ---------- read a file ----------
function readFileText(name,text){
 const rows=csvParse(text);if(rows.length<2)return{name,kind:"unknown",issues:[{lv:"error",t:"The file is empty or has only a header row."}]};
 const h=rows[0],m=colMap(h),body=rows.slice(1),issues=[];
 const isF=m.step!=null&&m.entered!=null&&m.completed!=null,isR=m.reason!=null&&m.count!=null&&m.step!=null;
 if(!isF&&!isR)return{name,kind:"unknown",issues:[{lv:"error",t:`Couldn't find the columns Athena needs. A funnel file needs step, entered and completed (plus product and date or month). A reasons file needs step, reason and count. This file has: ${h.join(", ")}.`}]};
 const kind=isF?"funnel":"reasons",out=[];let bad=0,badEx=[],noPer=0;
 body.forEach((r,i)=>{const prod=m.product!=null?String(r[m.product]||"").trim()||"My account":"My account",step=String(r[m.step]||"").trim(),per=m.period!=null?periodOf(r[m.period]):{d:"2000-01-01",g:"none"};
  if(!step)return;if(!per){noPer++;return}
  if(kind==="funnel"){const e=numOf(r[m.entered]),c=numOf(r[m.completed]);if(!isFinite(e)||!isFinite(c)||e<0||c<0){bad++;if(badEx.length<3)badEx.push(i+2);return}
   out.push({p:prod,d:per.d,g:per.g,s:step,e,c,seg:m.segment!=null?String(r[m.segment]||"").trim():""})}
  else{const n=numOf(r[m.count]);if(!isFinite(n)||n<0){bad++;if(badEx.length<3)badEx.push(i+2);return}out.push({p:prod,d:per.d,g:per.g,s:step,r:String(r[m.reason]||"").trim()||"Not given",n})}});
 if(m.period==null)issues.push({lv:"warn",t:"No date or month column, so Athena treats the whole file as one period. Forecasts need dates."});
 if(noPer)issues.push({lv:"error",t:`${noPer} rows have a date Athena couldn't read. Use 2026-10-31 for days, 2026-W44 for weeks or 2026-10 for months.`});
 if(bad)issues.push({lv:"error",t:`${bad} rows have a missing, negative or unreadable number and were left out (rows ${badEx.join(", ")}${bad>3?" and more":""}).`});
 return{name,kind,rows:out,issues,grain:grainOf(out.map(x=>x.d),out[0]&&out[0].g)}}

// ---------- the checks ----------
function checkData(){
 const F=ODATA.files.filter(f=>f.kind==="funnel"),R=ODATA.files.filter(f=>f.kind==="reasons"),out=[],prods={};
 ODATA.files.forEach(f=>(f.issues||[]).forEach(x=>out.push(Object.assign({f:f.name},x))));
 F.forEach(f=>f.rows.forEach(r=>{const P=prods[r.p]||(prods[r.p]={name:r.p,grain:f.grain,per:{},steps:[],seen:{}});if(!P.seen[r.s]){P.seen[r.s]=1;P.steps.push(r.s)}
  const key=r.d+"|"+r.s+"|"+r.seg;const pd=P.per[r.d]||(P.per[r.d]={});if(pd[key]){P.dup=(P.dup||0)+1;return}pd[key]=r}));
 Object.values(prods).forEach(P=>{const nm=P.name,dates=Object.keys(P.per).sort();
  // step order: the order steps appear in the period with the most steps
  let best=dates[0];dates.forEach(d=>{if(Object.keys(P.per[d]).length>Object.keys(P.per[best]).length)best=d});
  const ord=[...new Set(Object.values(P.per[best]).map(r=>r.s))];P.steps.forEach(s=>{if(!ord.includes(s))ord.push(s)});P.steps=ord;
  // completed above entered
  let over=0,oEx=null,chain=0,cEx=null;
  dates.forEach(d=>{const by={};Object.values(P.per[d]).forEach(r=>{const a=by[r.s]||(by[r.s]={e:0,c:0});a.e+=r.e;a.c+=r.c;if(r.c>r.e){over++;oEx=oEx||`${r.s} on ${d}`}});
   for(let k=1;k<ord.length;k++){const a=by[ord[k-1]],b=by[ord[k]];if(a&&b&&b.e>a.c*1.02+5){chain++;cEx=cEx||`${ord[k]} on ${d}`}}
   P.per[d]._by=by});
  if(over)out.push({lv:"error",f:nm,t:`${over} rows show more people completing a step than entering it, for example ${oEx}. Those rows are capped at the number who entered.`});
  if(chain)out.push({lv:"warn",f:nm,t:`${chain} times more people entered a step than finished the step before it, for example ${cEx}. Check for steps that can be skipped or entered directly.`});
  if(P.dup)out.push({lv:"warn",f:nm,t:`${P.dup} duplicate rows (same date, step and segment). Athena kept the first.`});
  // gaps
  const step=P.grain==="day"?1:P.grain==="week"?7:null;let gaps=[];
  if(step){for(let i=1;i<dates.length;i++){const x=dayN(dates[i])-dayN(dates[i-1]);if(x>step)for(let n=dayN(dates[i-1])+step;n<dayN(dates[i]);n+=step)gaps.push(dayS(n))}}
  else if(P.grain==="month"){for(let i=1;i<dates.length;i++){let [y,m]=dates[i-1].split("-").map(Number);for(;;){m++;if(m>12){m=1;y++}const k=`${y}-${pad2(m)}-01`;if(k>=dates[i])break;gaps.push(k.slice(0,7))}}}
  if(gaps.length)out.push({lv:"warn",f:nm,t:`${gaps.length} missing ${P.grain==="day"?"days":P.grain==="week"?"weeks":"months"}: ${gaps.slice(0,4).join(", ")}${gaps.length>4?" and more":""}. Forecasts fill them from the days around them.`});
  // spikes in people starting
  const st=dates.map(d=>{const a=P.per[d]._by[ord[0]];return a?a.e:0}),spikes=[];
  st.forEach((v,i)=>{const w=st.slice(Math.max(0,i-14),i).concat(st.slice(i+1,i+15)).filter(x=>x>0).sort((a,b)=>a-b);if(w.length<6)return;const med=w[w.length>>1],mad=w.map(x=>Math.abs(x-med)).sort((a,b)=>a-b)[w.length>>1]||1;if(Math.abs(v-med)/(1.4826*mad)>6&&Math.abs(v/med-1)>.5)spikes.push(dates[i])});
  if(spikes.length)out.push({lv:"warn",f:nm,t:`Unusual numbers of people starting on ${spikes.slice(0,3).join(", ")}${spikes.length>3?" and more":""}. If it was a campaign or an outage, keep it in mind when reading forecasts.`});
  // history
  const months=[...new Set(dates.map(moOf))];P.months=months;P.dates=dates;
  if(months.length<6)out.push({lv:"warn",f:nm,t:`Only ${months.length} month${months.length===1?"":"s"} of data. Forecasts need at least 6, and 13 or more to learn the yearly pattern.`});
  else if(months.length<13)out.push({lv:"info",f:nm,t:`${months.length} months of data. With 13 or more, Athena can also learn the yearly pattern (for example, January highs and December lows).`});
  if(!ODATA.tags[nm])ODATA.tags[nm]={};ord.forEach((s,k)=>{if(!ODATA.tags[nm][s])ODATA.tags[nm][s]=k===ord.length-1&&guessTag(s)==="activate"?"activate":guessTag(s)==="activate"?"none":guessTag(s)});
 });
 R.forEach(f=>{const unk=[...new Set(f.rows.filter(r=>!prods[r.p]).map(r=>r.p))];if(unk.length)out.push({lv:"warn",f:f.name,t:`Reasons for ${unk.join(", ")} don't match any account in the funnel files, so they're not used.`})});
 if(!F.length&&ODATA.files.length)out.push({lv:"error",f:"",t:"No funnel file yet. Athena needs at least one file with step, entered and completed."});
 OCHK={prods,out,ok:F.length>0&&!out.some(x=>x.lv==="error"&&/columns|empty|No funnel/.test(x.t))};return OCHK}

// ---------- turn data into accounts ----------
function dataProducts(){
 if(!OCHK)checkData();const R=ODATA.files.filter(f=>f.kind==="reasons");
 return Object.values(OCHK.prods).map(P=>{const nm=P.name,tags={},posts={};P.steps.forEach(s=>{const t=ODATA.tags[nm][s]||"none";tags[s]=t==="activate"?"activate":t;posts[s]=t==="activate"});
  const pr={order:P.steps,no:{},months:P.months,personas:[],rows:[]};
  P.months.forEach(mo=>{const by={};P.dates.filter(d=>moOf(d)===mo).forEach(d=>Object.entries(P.per[d]._by).forEach(([s,a])=>{const b=by[s]||(by[s]={e:0,c:0});b.e+=a.e;b.c+=Math.min(a.c,a.e)}));
   P.steps.forEach(s=>{if(by[s])pr.rows.push({step:s,mo,pe:"",e:by[s].e,c:by[s].c,med:null})})});
  const p=buildProduct(nm,pr,tags,posts,true);
  // drop-off reasons from the reasons files, else typical ones for the step type
  p.steps.forEach(s=>{const rs={};R.forEach(f=>f.rows.forEach(r=>{if(r.p===nm&&r.s===s.name)rs[r.r]=(rs[r.r]||0)+r.n}));const tot=Object.values(rs).reduce((a,b)=>a+b,0);
   s.reasons=tot>0?Object.entries(rs).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([r,n])=>[r,n/tot]):(REASON_BY_TAG[s.tag]||null);s.reasonSrc=tot>0?"data":"typical"});
  const ar=archetypePersonas(p,null,false);p.personas=ar.personas;p.pm=ar.pm;p.personaSrc="assumed";calibrate(p);
  p.id="d_"+nm;p.tier="Your data";p.mock=false;p.example=false;p.series=seriesOf(P);
  p.notes=[`Your data: ${P.dates.length} ${P.grain==="day"?"days":P.grain==="week"?"weeks":"months"} from ${P.dates[0]} to ${P.dates[P.dates.length-1]}. The last month is held back to check the model.`];
  return p})}
// per-period counts for forecasting: starters and completions at each step
function seriesOf(P){return{grain:P.grain,steps:P.steps,rows:P.dates.map(d=>({d,v:P.steps.map(s=>{const a=P.per[d]._by[s];return a?[a.e,Math.min(a.c,a.e)]:null})}))}}

// ---------- keep it on this laptop ----------
const IDB={open(){return new Promise((ok,no)=>{try{const r=indexedDB.open("athena-offline",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}})},
 async put(k,v){const db=await this.open();return new Promise((ok,no)=>{const t=db.transaction("kv","readwrite");t.objectStore("kv").put(v,k);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)})},
 async get(k){const db=await this.open();return new Promise((ok,no)=>{const t=db.transaction("kv","readonly"),r=t.objectStore("kv").get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})},
 async del(k){const db=await this.open();return new Promise((ok,no)=>{const t=db.transaction("kv","readwrite");t.objectStore("kv").delete(k);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)})}};
async function saveProject(){ODATA.saved=new Date().toISOString();try{await IDB.put("project",JSON.parse(JSON.stringify(ODATA)));return true}catch(e){return false}}
async function loadProject(){try{const v=await IDB.get("project");if(v&&v.files){ODATA=Object.assign({files:[],tags:{},saved:null,useMock:false},v);return true}}catch(e){}return false}
function downloadText(name,text,type){const b=new Blob([text],{type:type||"text/plain"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},500)}
function exportProject(){downloadText(`athena-project-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({athena:1,saved:new Date().toISOString(),data:ODATA}),"application/json")}

// ---------- sample data, made here so the file needs nothing else ----------
function sampleFiles(){const rnd=mulberry(42),g=()=>norm(rnd(),rnd());
 const MOY=[0,1.15,1.05,1.02,.97,1,.96,1.03,1,.98,1.02,.97,.82],DOW=[1.12,1.08,1.05,1.04,1.02,.78,.70];
 const RS={select:[["Comparing offers elsewhere",.4],["Unclear fees or features",.35],["No real intent",.25]],elig:[["Unsure whether they qualify",.6],["Changed mind",.4]],details:[["Form too long",.4],["Info not at hand",.3],["Privacy concern",.3]],idcap:[["Camera or glare failure",.45],["No ID to hand",.35],["Not eligible after all",.2]],verify:[["Liveness failed repeatedly",.4],["Record lookup mismatch",.3],["Network timeout",.3]],fica:[["No proof to hand",.5],["Upload or size errors",.25],["Prefers a branch",.25]],decision:[["Declined by risk rules",.55],["Waiting for manual review",.45]],sign:[["Terms too long",.4],["OTP not received",.4],["Changed mind",.2]],activate:[["Never made a first transaction",1]]};
 const f=["product,date,step,entered,completed"],r=["product,month,step,reason,count"],acc={};const d0=dayN("2024-11-01"),d1=dayN("2026-10-31");
 libraryProducts().forEach(lp=>{const M=MOCK[lp.id];if(!M)return;const base=M[0]*12/365;
  for(let n=d0;n<=d1;n++){const ds=dayS(n),dt=new Date(n*864e5),i=n-d0,day=dt.getUTCDate(),pay=(day>=25||day<=2)?1.22:1;
   let e=Math.round(base*(1+M[1]*i/30.4)*MOY[dt.getUTCMonth()+1]*DOW[(dt.getUTCDay()+6)%7]*pay*Math.exp(.06*g()));
   lp.steps.forEach(s=>{let dr=s.post?M[3]:(M[2][s.tag]||.1);dr*=1+.04*Math.sin(i/90+s.tag.length);if(lp.id==="sb_mymo"&&s.tag==="idcap"&&ds>="2026-05-01")dr*=.72;if(s.tag==="verify"&&dt.getUTCMonth()===11)dr*=1.08;
    dr=Math.min(.9,Math.max(.005,dr*Math.exp(.05*g())));const c=Math.max(0,Math.min(e,Math.round(e*(1-dr)+g()*Math.sqrt(Math.max(1,e*dr*(1-dr))))));
    f.push(`${lp.name},${ds},${s.name},${e},${c}`);const k=lp.name+"|"+ds.slice(0,7)+"|"+s.name+"|"+s.tag;acc[k]=(acc[k]||0)+(e-c);e=c})}});
 Object.entries(acc).forEach(([k,n])=>{const [p,mo,s,t]=k.split("|"),w=RS[t]||[["Not given",1]];let left=n;w.forEach(([rr,wt],j)=>{const c=j<w.length-1?Math.min(left,Math.round(n*wt*Math.exp(.08*g()))):left;left-=c;r.push(`${p},${mo},${s},${rr},${c}`)})});
 return[{name:"sample_funnel_daily.csv",text:f.join("\n")},{name:"sample_dropoff_reasons.csv",text:r.join("\n")}]}
const TEMPLATE_FUNNEL=`product,date,step,entered,completed
MyMo Account,2026-10-01,Choose account,1520,1004
MyMo Account,2026-10-01,Personal details,1004,733
MyMo Account,2026-10-01,ID capture,733,623
MyMo Account,2026-10-01,Identity verification,623,474
MyMo Account,2026-10-01,Terms and e-sign,474,441
MyMo Account,2026-10-01,Account opened → first transaction,441,220`;
const TEMPLATE_REASONS=`product,month,step,reason,count
MyMo Account,2026-10,ID capture,Camera or glare failure,1210
MyMo Account,2026-10,ID capture,No ID to hand,940`;
