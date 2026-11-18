// ===== Commercial UI =====
(function(){
let C=defaultsC(),sensModel="soft";
const $=id=>document.getElementById(id);
const COL={trad:"#8e8e93",soft:"#0071e3"},MN={trad:"Traditional",soft:"Soft Profile"};
const SCN=[["down","Downside"],["base","Base"],["up","Upside"]];
const sname=k=>SCN.find(s=>s[0]===k)[1];
const ms=()=>C.show==="both"?["trad","soft"]:[C.show];
const N=x=>Math.round(x).toLocaleString("en-US"),R=x=>"R"+Math.round(x).toLocaleString("en-US");
const Rs=x=>Math.abs(x)>=1e6?"R"+(x/1e6).toFixed(2)+"m":R(x);
const sg=(x,f)=>(x>0?"+":x<0?"−":"")+f(Math.abs(x));
const P1=(x,d=1)=>(x*100).toFixed(d)+"%";
const cacTxt=r=>r.spend>0&&r.cac!=null?R(r.cac):"Not configured";
const both=()=>C.show==="both";
function res(m,sk){return calc(C.visitors,C[m],sk||C.scen)}
function allRes(sk){const o={};ms().forEach(m=>o[m]=res(m,sk));return o}
function setPath(o,p,v){const k=p.split(".");let c=o;for(let i=0;i<k.length-1;i++)c=c[k[i]];c[k[k.length-1]]=v}
function getPath(o,p){return p.split(".").reduce((a,k)=>a[k],o)}
function tbl(head,rows,cls){return `<div class="scroll"><table class="${cls||""}"><tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr>${rows.map(r=>`<tr>${r.map(c=>typeof c==="object"&&c?`<td class="${c.c||""}">${c.t}</td>`:`<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`}
function dcell(d,f,goodUp=true){if(d==null)return"—";if(Math.abs(d)<1e-9)return{t:f(0),c:""};return{t:sg(d,f),c:(d>0)===goodUp?"up":"dn"}}

const MET=[
 ["activated","Activated accounts",N,"Simulated output"],["rate","Activation rate",x=>P1(x,2),"Simulated output"],
 ["active","Active customers",N,"Projection"],["tx","Monthly transactions",N,"Projection"],["val","Monthly payment value",R,"Projection"],
 ["ann","Annualised payment value",R,"Projection"],["dep","Deposit balances",R,"Projection"],["prodRel","Product relationships",N,"Projection"],
 ["retained","12-month retained",N,"Projection"],["contrib","Annual contribution",R,"Projection"],["cac","Cost per acquired customer",null,"Projection"]];

function renderControls(){
 $("cVis").value=C.visitors;$("cGrow").value=C.growth||0;
 $("cTot").textContent=both()?"Total simulated: "+N(C.visitors*2)+".":"";
 $("cShow").innerHTML=[["trad","Traditional only"],["soft","Soft Profile only"],["both","Both together"]].map(([k,l])=>`<button data-show="${k}" class="${C.show===k?"on":""}">${l}</button>`).join("");
 $("cScn").innerHTML=SCN.map(([k,l])=>`<button data-scn="${k}" class="${C.scen===k?"on":""}">${l}</button>`).join("");
 const d=defaultsC(),sameTrad=["down","up"].some(k=>JSON.stringify(C.trad.s[k])===JSON.stringify(C.trad.s.base))&&C.scen!=="base"&&ms().includes("trad");
 let n="";
 if(C.scen==="down")n+=`<div class="banner down">Downside: hypothetical stress-test assumptions, not a forecast.</div>`;
 if(C.scen==="up")n+=`<div class="banner up">Upside: hypothetical stress-test assumptions, not a forecast.</div>`;
 if(sameTrad)n+=`<div class="banner warn">The brief defines downside and upside only once. Traditional ${sname(C.scen).toLowerCase()} currently equals Traditional base. Edit it below to stress-test the benchmark.</div>`;
 const fj=C.fromJourney,src=$("cSrc");
 if(src)src.innerHTML=fj&&fj.name?`<b>${fj.name.replace(/[&<>]/g,"")}</b>${fj.illus?' <span class="chip ass">MOCK DATA</span>':""}<div class="hint">Taken from Drop-off and ideas: ${fj.trad[1].toFixed(1)}% of people who start open an account today, ${fj.soft[1].toFixed(1)}% with the Soft Banking Profile. Downside and upside use a weaker and a stronger Soft Banking Profile effect.</div>`:`<b>Generic example</b><div class="hint">Not tied to the selected account.</div>`;
 $("cNote").innerHTML=n;
}
function summary(R_){
 const t=R_.trad,s=R_.soft,V=C.visitors;
 if(!both()){const m=ms()[0],r=R_[m];$("cSummary").innerHTML=`<h2>Executive summary <span class="chip calc">PROJECTION</span></h2><p>Across ${N(V)} prospective customers, ${MN[m]} onboarding is simulated to activate <b>${N(r.activated)}</b> accounts (${P1(r.rate,2)}), giving about ${N(r.active)} active customers, ${Rs(r.val)} in monthly payment value and ${Rs(r.dep)} in deposit balances. Switch to “Both together” for the comparison.</p><p class="note">Illustrative simulation, not a forecast.</p>`;return}
 const da=s.activated-t.activated,up=t.activated>0?da/t.activated:null,dA=s.active-t.active,dV=s.val-t.val,dD=s.dep-t.dep;
 const same=JSON.stringify(Object.assign({},C.trad.s[C.scen],{act:0}))===JSON.stringify(Object.assign({},C.soft.s[C.scen],{act:0}));
 const allPos=da>=0&&dA>=0&&dV>=0&&dD>=0;
 const p2=allPos?`this creates an opportunity for approximately <b>${N(dA)}</b> additional active customers, <b>${R(dV)}</b> in additional monthly payment value and <b>${Rs(dD)}</b> in additional deposit balances.`
  :`this changes active customers by <b>${sg(dA,N)}</b>, monthly payment value by <b>${sg(dV,R)}</b> and deposit balances by <b>${sg(dD,Rs)}</b>.`;
 $("cSummary").innerHTML=`<h2>Executive summary <span class="chip calc">PROJECTION</span></h2>
 <p>Across an equivalent population of <b>${N(V)}</b> prospective customers, Soft Banking Profile ${da>=0?"increases":"decreases"} simulated account activation from <b>${N(t.activated)}</b> to <b>${N(s.activated)}</b>, representing ${N(Math.abs(da))} ${da>=0?"additional":"fewer"} accounts${up==null?"":` and a ${Math.abs(up*100).toFixed(0)}% relative ${da>=0?"uplift":"reduction"}`}.</p>
 <p>${same?"Assuming comparable downstream customer behaviour":"Using the downstream assumptions configured for each model"}, ${p2}</p>
 <p>The model demonstrates the potential to turn lower-friction acquisition into increased payment engagement and deeper banking relationships.</p>
 <p class="note">${sname(C.scen)} scenario. Illustrative simulation, not a forecast. Payment value is gross throughput and deposits are balances; neither is revenue.</p>`;
}
function exec(R_){
 const m=ms(),head=["Metric",...m.map(x=>MN[x]),...(both()?["Difference"]:[]),"Type"];
 const rows=MET.map(([k,l,f,type])=>{
  const cells=m.map(x=>k==="cac"?cacTxt(R_[x]):f(R_[x][k]));
  let diff=[];
  if(both()){const t=R_.trad,s=R_.soft;
   if(k==="rate")diff=[dcell((s.rate-t.rate)*100,x=>x.toFixed(2)+" pts")];
   else if(k==="cac")diff=[(t.spend>0&&s.spend>0&&t.cac!=null&&s.cac!=null)?dcell(s.cac-t.cac,R,false):"—"];
   else{const d=s[k]-t[k];const p=t[k]>0?d/t[k]:null;const c=dcell(d,f);diff=[c===("—")?c:{t:c.t+(p==null?"":` (${sg(p*100,x=>x.toFixed(0))}%)`),c:c.c}]}}
  return[l,...cells,...diff,`<span class="chip ${type==="Projection"?"calc":"sim"}">${type}</span>`]}).filter(r=>!m.every((x,i)=>r[1+i]==="Not configured"));
 let h=`<h2>Executive comparison · ${sname(C.scen)} <span class="chip">${N(C.visitors)} visitors each</span></h2>`+tbl(head,rows);
 if(both()){const t=R_.trad,s=R_.soft;
  h+=`<h3>Incremental value of Soft Profile</h3><div class="grid kpis">`+[
   ["Additional accounts",sg(s.activated-t.activated,N),"Acquisition"],
   ["Monthly payment value",sg(s.val-t.val,Rs),"Gross throughput, not revenue"],
   ["Deposit balances",sg(s.dep-t.dep,Rs),"Balances, not revenue"],
   ["Annual contribution",sg(s.contrib-t.contrib,Rs),"Illustrative net contribution"]].map(([l,v,n])=>`<div class="kpi"><b>${v}</b><span>${l}</span><br><span style="font-size:11px">${n}</span></div>`).join("")+`</div>`}
 $("cExec").innerHTML=h;
}
function funnel(R_){
 const m=ms(),F={};m.forEach(x=>F[x]=funnelOf(C.visitors,C[x],R_[x]));
 const keys=[["vis","Visitors"],["profile","Profile created"],["init","Application initiated"],["kyc","KYC completed"],["completion","Application completed"],["act","Activated accounts"],["actv","Active customers"]];
 let h=`<div class="leg">${m.map(x=>`<span><b style="background:${COL[x]}"></b>${MN[x]}</span>`).join("")}</div>`;
 keys.forEach(([k,l])=>{
  h+=`<div style="margin:10px 0"><div style="font-size:13px;font-weight:600">${l}</div>`;
  m.forEach(x=>{
   const rows=F[x].rows,r=rows.find(y=>y.k===k),V=R_[x].V;
   if(!r||r.n==null){h+=`<div class="bar dash"></div><div class="lbl">${MN[x]}: not provided (enter a rate under assumptions)</div>`;return}
   let pn=null,pl="";for(let i=rows.indexOf(r)-1;i>=0;i--)if(rows[i].n!=null){pn=rows[i].n;pl=rows[i].label;break}
   const conv=pn>0?r.n/pn:null,tag=r.calc?` <span class="chip calc">calculated</span>`:(k==="vis"?"":` <span class="chip ${k==="act"?"sim":"calc"}">${k==="act"?"simulated output":"projection"}</span>`);
   const warn=k==="act"&&F[x].gap!=null&&Math.abs(F[x].gap)>=.5?` <span class="pill">⚠ ${sg(-F[x].gap,N)} vs sequential calc ${N(F[x].seqEnd)}</span>`:"";
   h+=`<div class="bar"><div style="width:${V>0?100*r.n/V:0}%;background:${COL[x]}"></div></div><div class="lbl"><b style="color:var(--ink)">${N(r.n)}</b> ${MN[x]}${k==="vis"?"":` · ${conv==null?"n/a":P1(conv)} of ${pl} · drop-off ${sg(-(pn-r.n),N)}`}${tag}${warn}</div>`});
  h+=`</div>`});
 let ov=`<h3>Overall conversion</h3>`+tbl(["",...m.map(x=>MN[x]),...(both()?["Relative uplift"]:[])],[
  ["Visitors → activated",...m.map(x=>P1(R_[x].rate,2)),...(both()?[dcell(R_.trad.rate>0?R_.soft.rate/R_.trad.rate-1:null,x=>(x*100).toFixed(1)+"%")]:[])],
  ["Visitors → active customer",...m.map(x=>P1(R_[x].activeOfV,2)),...(both()?[dcell(R_.trad.activeOfV>0?R_.soft.activeOfV/R_.trad.activeOfV-1:null,x=>(x*100).toFixed(1)+"%")]:[])]]);
 const ir=[];m.forEach(x=>R_[x].seg.forEach((s,i)=>ir.push([MN[x],INTENT[i],P1(s.share,0),N(s.vis),P1(s.rate,2),N(s.act)])));
 ov+=`<h3>By customer intent</h3>`+tbl(["Model","Intent","Share","Visitors","Activation","Activated"],ir)+`<div class="note">Relative propensity of 1.00 means no difference between intent segments, because no per-intent conversion data was provided. Set propensities under assumptions to test it.</div>`;
 const k=[];if(both()){const t=R_.trad,s=R_.soft;k.push(["Visitors",N(C.visitors)+" each"],["Additional accounts",sg(s.activated-t.activated,N)],["Relative uplift",t.activated>0?sg((s.activated/t.activated-1)*100,x=>x.toFixed(1))+"%":"n/a"])}
 $("cAcq").innerHTML=`<h2>A. Acquisition comparison · ${sname(C.scen)}</h2>`+(k.length?`<div class="grid kpis">${k.map(([l,v])=>`<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join("")}<div class="kpi"><b>${P1(R_.trad.rate,2)} → ${P1(R_.soft.rate,2)}</b><span>Activation rate</span></div></div>`:"")+funnel_wrap(h)+ov;
}
function funnel_wrap(h){return `<h3>Conversion funnel</h3>`+h}
function reconCard(R_){
 let h=`<h2>Funnel reconciliation diagnostic</h2>`;
 ms().forEach(m=>{
  const rc=recon(C.visitors,C[m],R_[m]);
  h+=`<h3>${MN[m]}</h3>`;
  if(!rc){h+=`<div class="note">Intermediate funnel rates not provided, so there is nothing to reconcile. Enter them under assumptions to enable this check. The ${P1(R_[m].rate,2)} activation rate is used as configured.</div>`;return}
  const flag=Math.abs(rc.gapN)>=.5;
  h+=(flag?`<div class="banner warn"><b>Discrepancy flagged.</b> The sequential funnel gives ${P1(rc.seqRate,2)} (${N(rc.seqEnd)} accounts). The ${R_[m].rate===defaultsC()[m].s[C.scen].act/100?"confirmed ":""}output is ${P1(rc.rate,2)} (${N(R_[m].activated)} accounts). Gap: ${rc.gapPts.toFixed(2)} pts / ${N(rc.gapN)} accounts. The simulation output has not been changed.</div>`:`<div class="note">Sequential funnel and activation output agree.</div>`)
   +tbl(["","Value","Type"],[["Sequential calculation",P1(rc.seqRate,2)+" · "+N(rc.seqEnd),`<span class="chip calc">calculated</span>`],["Activation output used",P1(rc.rate,2)+" · "+N(R_[m].activated),`<span class="chip sim">simulated output</span>`],["Gap",rc.gapPts.toFixed(2)+" pts · "+N(rc.gapN),""],["Implied unallocated post-funnel conversion",rc.factor==null?"n/a":P1(rc.factor,1),`<span class="chip calc">calculated</span>`]])
   +`<h3>Stage denominators</h3>`+tbl(["Stage","Rate","Denominator","Result"],rc.dens.map(d=>[d.label,d.rate+"%",N(d.den),N(d.num)]))
   +`<h3>What would reconcile it (one change at a time, not applied)</h3>`+tbl(["Stage","Configured","Would need to be"],rc.solves.map(s=>[s.label,s.rate+"%",s.needed.toFixed(1)+"%"]))
   +`<div class="btns"><button data-recon="use" data-m="${m}">Use sequential result as activation (override)</button><button data-recon="restore" data-m="${m}">Restore confirmed value</button></div>`;
 });
 $("cRecon").innerHTML=h;
}
function pairs(items,R_){
 const m=ms();
 return items.map(it=>{
  const vals=m.map(x=>it.v(R_[x])),mx=Math.max(...vals.filter(x=>x!=null),0)||1;
  let h=`<div class="pr"><div class="lbl">${it.l}</div>`+m.map((x,i)=>`<div class="ln"><div class="tr"><div style="width:${vals[i]==null?0:100*vals[i]/mx}%;background:${COL[x]}"></div></div><span>${vals[i]==null?"n/a":it.f(vals[i])}</span></div>`).join("");
  if(both()&&vals[0]!=null&&vals[1]!=null){const d=vals[1]-vals[0];h+=`<div class="lbl ${d>=0?"up":"dn"}" style="color:${d>=0?"var(--green)":"var(--red)"}">Difference ${sg(d,it.f)}</div>`}
  return h+`</div>`}).join("");
}
const legendM=()=>`<div class="leg">${ms().map(x=>`<span><b style="background:${COL[x]}"></b>${MN[x]}</span>`).join("")}</div>`;
function sections(R_){
 $("cPay").innerHTML=`<h2>B. Payment activity <span class="chip">Gross throughput, not revenue</span></h2>`+legendM()+pairs([
  {l:"Monthly transactions",f:N,v:r=>r.tx},{l:"Monthly payment value",f:R,v:r=>r.val},{l:"Annualised payment value",f:R,v:r=>r.ann},
  {l:"Average transaction value",f:R,v:r=>r.avgTx},{l:"Transaction frequency (per active customer / month)",f:x=>x.toFixed(1),v:r=>r.freq}],R_);
 const dd=both()?R_.soft.dep-R_.trad.dep:null;
 $("cDep").innerHTML=`<h2>C. Deposit growth <span class="chip">Balances, not revenue</span></h2>`+legendM()+pairs([
  {l:"Active customers",f:N,v:r=>r.active},{l:"Average deposit balance",f:R,v:r=>r.avgDep},{l:"Total deposit balances",f:R,v:r=>r.dep}],R_)+(dd==null?"":`<div class="kpi" style="margin-top:8px"><b>${sg(dd,R)}</b><span>Incremental deposit opportunity (balances, not income)</span></div>`);
 $("cRel").innerHTML=`<h2>D. Relationship depth <span class="chip">Estimated relationships, not unique customers</span></h2>`+legendM()+pairs([
  {l:"Product relationships",f:N,v:r=>r.prodRel},{l:"Products per active customer",f:x=>x.toFixed(2),v:r=>r.prodPer},{l:"12-month retention",f:x=>P1(x,1),v:r=>r.retRate},{l:"Retained customers",f:N,v:r=>r.retained}],R_);
 let ex="";
 if(both()){const t=R_.trad,s=R_.soft,da=s.activated-t.activated,ds=s.spend-t.spend;
  ex=`<div class="grid kpis"><div class="kpi"><b>${sg(s.contrib-t.contrib,R)}</b><span>Incremental annual contribution</span></div>
  <div class="kpi"><b>${sg(ds,R)}</b><span>Incremental acquisition spend</span></div>
  <div class="kpi"><b>${da>0&&(t.spend>0||s.spend>0)?R(ds/da):"n/a"}</b><span>Incremental cost per additional account</span></div></div>`}
 $("cCon").innerHTML=`<h2>E. Commercial contribution <span class="chip">Illustrative net contribution</span></h2>`+legendM()+pairs([
  {l:"Annual contribution",f:R,v:r=>r.contrib},{l:"Acquisition expenditure (as entered)",f:R,v:r=>r.spend},
  {l:"Cost per acquired account (acquisition spend ÷ activated accounts)",f:R,v:r=>r.spend>0?r.cac:null},
  {l:"Contribution per R1 of acquisition spend",f:x=>"R"+x.toFixed(2),v:r=>r.spend>0?r.contrib/r.spend:null}],R_)+ex
  +`<div class="note">Acquisition spend is zero unless you enter it under assumptions; equal spend is never assumed. Not modelled: servicing and operating cost, funding cost on deposits, credit losses, capital, and any acquisition spend not entered. This is not total revenue or profit.</div>`;
}
function scenCard(){
 const out=[["activated","Activated accounts",N],["active","Active customers",N],["val","Monthly payment value",R],["dep","Deposit balances",R],["retained","12-month retained",N],["contrib","Annual contribution",R]];
 const all={};["trad","soft"].forEach(m=>SCN.forEach(([k])=>all[m+k]=res(m,k)));
 let h=`<h2>F. Scenario comparison <span class="chip">Hypothetical stress tests, not forecasts</span></h2>`;
 h+=tbl(["Metric",...["trad","soft"].flatMap(m=>SCN.map(([k,l])=>`${MN[m].split(" ")[0]} ${l.slice(0,4)}.`))],out.map(([k,l,f])=>[l,...["trad","soft"].flatMap(m=>SCN.map(([sk])=>f(all[m+sk][k])))]));
 h+=`<h3>Soft Profile minus Traditional, matched scenarios</h3>`+tbl(["Metric",...SCN.map(s=>s[1])],out.map(([k,l,f])=>[l,...SCN.map(([sk])=>dcell(all["soft"+sk][k]-all["trad"+sk][k],f))]));
 h+=`<h3>Range across scenarios (downside → upside)</h3>`+tbl(["Metric","Traditional","Soft Profile"],out.map(([k,l,f])=>[l,...["trad","soft"].map(m=>{const v=SCN.map(([sk])=>all[m+sk][k]);return f(Math.min(...v))+" → "+f(Math.max(...v))})]));
 const cols=[["activated","Activated"],["active","Active"],["tx","Txns"],["val","Pay value"],["dep","Deposits"],["prodRel","Products"],["retained","Retained"],["contrib","Contribution"]];
 const base=res(sensModel),rows=ASSUME.map(([k,l])=>{const c=JSON.parse(JSON.stringify(C[sensModel]));c.s[C.scen][k]*=1.1;const r=calc(C.visitors,c,C.scen);
  return[l,...cols.map(([ck])=>{const p=base[ck]>0?r[ck]/base[ck]-1:0;return Math.abs(p)<1e-9?{t:"·",c:""}:{t:"+"+(p*100).toFixed(1)+"%",c:"up"}})]});
 h+=`<h3>What moves when one assumption rises 10%</h3><div class="btns"><select id="cSens" style="padding:6px;border-radius:8px;border:1px solid var(--line);font:inherit"><option value="trad" ${sensModel==="trad"?"selected":""}>Traditional</option><option value="soft" ${sensModel==="soft"?"selected":""}>Soft Profile</option></select></div>`+tbl(["+10% to",...cols.map(c=>c[1])],rows)+`<div class="note">Model: ${MN[sensModel]}, ${sname(C.scen)}. A dot means the metric does not depend on that assumption.</div>`;
 $("cScen").innerHTML=h;
}
function popCard(R_){
 const pops=[...new Set([C.visitors,5000,10000,50000,100000])].sort((a,b)=>a-b);
 const rows=pops.map(V=>{const t=calc(V,C.trad,C.scen),s=calc(V,C.soft,C.scen);return[N(V)+(V===C.visitors?" (current)":""),N(t.activated),N(s.activated),dcell(s.activated-t.activated,N),Rs(t.contrib),Rs(s.contrib),dcell(s.contrib-t.contrib,Rs)]});
 $("cPop").innerHTML=`<h2>Visitor population comparison · ${sname(C.scen)}</h2>`+tbl(["Visitors each","Trad. activated","Soft activated","Difference","Trad. contribution","Soft contribution","Difference"],rows)+`<div class="note">Deterministic and linear: population scales volumes, rates stay as configured.</div>`;
}
function editor(){
 const sk=C.scen,m=ms(),fld=(p,v,min,max,step,opt)=>`<input type="number" data-path="${p}" data-min="${min}" data-max="${max}" step="${step}" value="${v==null?"":v}"${opt?' data-opt="1" placeholder="not provided"':""}>`;
 let h=`<h2>Assumptions · editing ${sname(sk)} <span class="chip ass">ASSUMPTION</span></h2><div class="note">Each model has its own inputs. Changing one model never changes the other. Invalid values are outlined in red and ignored.</div><div class="edgrid ${m.length>1?"two":""}">`;
 m.forEach(x=>{const mc=C[x];
  h+=`<div><h3>${MN[x]} · ${sname(sk)}</h3>`;
  ASSUME.forEach(([k,l,u,min,max,step])=>{h+=`<div class="fld"><span>${l}${u?` (${u})`:""}</span>${fld(`${x}.s.${sk}.${k}`,mc.s[sk][k],min,max,step)}</div>`;
   if(k==="act")h+=`<div class="note" data-badge="${x}"></div>`});
  h+=`<h3>Funnel stage rates (%) <span class="chip ass">ASSUMPTION</span></h3><div class="note">Each is a share of the previous stage. Optional for stages without data.</div>`;
  CHAIN.forEach(([k,l])=>{if(x==="trad"&&k==="profile")return;h+=`<div class="fld"><span>${l}</span>${fld(`${x}.stages.${k}`,mc.stages[k],0,100,.1,1)}</div>`});
  h+=`<h3>Customer intent</h3><div class="note">Share of visitors (must total 100%) and relative activation propensity (1.00 = no difference).</div>`;
  INTENT.forEach((l,i)=>{h+=`<div class="fld"><span>${l}</span><span>${fld(`${x}.intent.shares.${i}`,mc.intent.shares[i],0,100,1)} % ${fld(`${x}.intent.idx.${i}`,mc.intent.idx[i],0,10,.05)} ×</span></div>`});
  h+=`<div class="note" data-sum="${x}"></div>`;
  h+=`<h3>Acquisition expenditure (R)</h3><div class="fld"><span>Campaign expenditure</span>${fld(`${x}.acq.campaign`,mc.acq.campaign,0,1e10,1000)}</div><div class="fld"><span>Incremental onboarding cost</span>${fld(`${x}.acq.onboarding`,mc.acq.onboarding,0,1e10,1000)}</div></div>`});
 $("cEdit").innerHTML=h+`</div>`;
}
function badges(){
 const d=defaultsC();
 ms().forEach(x=>{
  const b=document.querySelector(`[data-badge="${x}"]`),s=document.querySelector(`[data-sum="${x}"]`);
  if(b){const v=C[x].s[C.scen].act,dv=d[x].s[C.scen].act;
   b.textContent=v===dv?(C.scen==="base"?"Confirmed simulation output (preserved)":(x==="soft"?"Hypothetical stress-test assumption":"Not specified in brief")):"User-modified (default "+dv+"%)";
   if(x==="trad"&&C.scen!=="base"&&v===dv)b.textContent="Not specified in brief (equals base)"}
  if(s){const t=C[x].intent.shares.reduce((a,c)=>a+(+c||0),0);const ok=Math.abs(t-100)<1e-6;
   s.innerHTML=ok?`Total: 100%`:`<span class="pill">Total ${t}% must equal 100%</span> Calculations use the shares normalised to 100%.`}});
}
function tests(){
 const T=runTests(),p=T.filter(x=>x.pass).length;
 $("cTestBadge").textContent=`Acceptance tests ${p}/${T.length} passed`;$("cTestBadge").style.color=p===T.length?"var(--green)":"var(--red)";
 $("cTests").innerHTML=`<h2>Acceptance tests <span class="chip">${p}/${T.length} passed</span></h2><div class="note">Run against the agreed defaults at 10,000 visitors, independent of current edits.</div>`+tbl(["Check","Expected","Model gives","Result"],T.map(x=>[x.name,typeof x.exp==="number"?N(x.exp):x.exp,typeof x.got==="number"?(Math.abs(x.got)<100&&x.exp===26.41?x.got.toFixed(2):N(x.got)):x.got,{t:x.pass?"Pass":"FAIL",c:x.pass?"up":"dn"}]));
}
function csv(R_){
 const q=s=>`"${String(s).replace(/"/g,'""')}"`,L=[];
 L.push(["Scenario",sname(C.scen)].join(","),["Visitors per model",C.visitors].join(","),"");
 const t=calc(C.visitors,C.trad,C.scen),s=calc(C.visitors,C.soft,C.scen);
 L.push("Metric,Traditional,Soft Profile,Difference");
 MET.forEach(([k,l])=>{if(k==="cac"){L.push([q(l),t.spend>0?Math.round(t.cac):"n/a",s.spend>0?Math.round(s.cac):"n/a",""].join(","));return}
  const f=k==="rate"?x=>(x*100).toFixed(2)+"%":x=>Math.round(x);L.push([q(l),f(t[k]),f(s[k]),k==="rate"?((s.rate-t.rate)*100).toFixed(2)+" pts":Math.round(s[k]-t[k])].join(","))});
 L.push("","All scenarios","Metric,"+["trad","soft"].flatMap(m=>SCN.map(([,l])=>MN[m]+" "+l)).join(","));
 [["activated","Activated accounts"],["active","Active customers"],["tx","Monthly transactions"],["val","Monthly payment value"],["ann","Annualised payment value"],["dep","Deposit balances"],["prodRel","Product relationships"],["retained","12-month retained"],["contrib","Annual contribution"]].forEach(([k,l])=>L.push([q(l),...["trad","soft"].flatMap(m=>SCN.map(([sk])=>Math.round(res(m,sk)[k])))].join(",")));
 L.push("","Note: illustrative simulation outputs, not forecasts. Payment value is gross throughput; deposits are balances; contribution is an illustrative net assumption.");
 return L.join("\n");
}
function exportCard(R_){
 $("cExport").innerHTML=`<h2>Export comparative results</h2><div class="btns"><button id="cCopy">Copy CSV</button><span class="note" id="cCopyMsg"></span></div><textarea id="cCsv" readonly>${csv(R_).replace(/</g,"&lt;")}</textarea>`;
}
function fcCard(){
 const el=$("cFc");if(!el)return;const g=(+C.growth||0)/100,now=new Date(),MS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
 const lab=[0,1,2].map(i=>MS[(now.getMonth()+i)%12]),Vm=[0,1,2].map(i=>C.visitors*Math.pow(1+g,i));
 const mods=ms(),data={};mods.forEach(m=>{data[m]={};SCN.forEach(([k])=>data[m][k]=Vm.map(v=>calc(v,C[m],k)))});
 const key=C.fcMetric||"activated";
 const MET=[["activated","Accounts opened"],["active","Active customers"],["contrib","Annual contribution (R)"]];
 const W=640,H=250,mg={l:48,r:14,t:16,b:28};
 let all=[];mods.forEach(m=>SCN.forEach(([k])=>data[m][k].forEach(r=>all.push(r[key]))));const mx=Math.max(...all,1)*1.18;
 const x=i=>mg.l+(W-mg.l-mg.r)*(i/2),y=v=>mg.t+(H-mg.t-mg.b)*(1-v/mx);
 const nk=v=>v>=1e6?(v/1e6).toFixed(1)+"m":v>=1000?(v/1000).toFixed(v>=1e4?0:1)+"k":Math.round(v);
 let g2="";for(let i=0;i<=3;i++){const v=mx/1.18*i/3;g2+=`<line x1="${mg.l}" x2="${W-mg.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e5e8ef"/><text x="${mg.l-6}" y="${y(v)+4}" font-size="10" text-anchor="end" fill="#5b6478">${nk(v)}</text>`}
 lab.forEach((l,i)=>g2+=`<text x="${x(i)}" y="${H-8}" font-size="11" text-anchor="middle" fill="#5b6478">${l}</text>`);
 mods.forEach(m=>{const up=data[m].up.map(r=>r[key]),dn=data[m].down.map(r=>r[key]),bs=data[m].base.map(r=>r[key]),c=COL[m];
  g2+=`<polygon points="${[...up.map((v,i)=>`${x(i)},${y(v)}`),...dn.map((v,i)=>`${x(i)},${y(v)}`).reverse()].join(" ")}" fill="${c}" opacity=".16"/><polyline points="${bs.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="${c}" stroke-width="3"/>`;
  bs.forEach((v,i)=>g2+=`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${c}"/><text x="${x(i)}" y="${y(v)-9}" font-size="11" font-weight="700" text-anchor="middle" fill="${c}">${nk(v)}</text>`);
  up.forEach((v,i)=>{if(Math.abs(v-bs[i])>1e-9)g2+=`<text x="${x(i)+22}" y="${y(v)+4}" font-size="10" fill="#3a7d44">${nk(v)}</text>`});
  dn.forEach((v,i)=>{if(Math.abs(v-bs[i])>1e-9)g2+=`<text x="${x(i)+22}" y="${y(v)+4}" font-size="10" fill="#b0402f">${nk(v)}</text>`})});
 const f1=key==="contrib"?Rs:N,rows=[];
 mods.forEach(m=>SCN.slice().reverse().forEach(([k,l])=>{const v=data[m][k].map(r=>r[key]);rows.push([`<span style="color:${COL[m]};font-weight:700">${MN[m]}</span> ${l.toLowerCase()}`,...v.map(f1),`<b>${f1(v.reduce((a,b)=>a+b,0))}</b>`])}));
 const tradNote=mods.includes("trad")&&JSON.stringify(C.trad.s.down)===JSON.stringify(C.trad.s.base)?`<div class="note">Traditional downside and upside currently equal its base, because the brief defines them only once. Edit them below to widen the Traditional range.</div>`:"";
 const j="";
 el.innerHTML=`<h2>The next 3 months <span class="chip calc">PROJECTION</span></h2>${j}
 <div class="btns">${MET.map(([k,l])=>`<button data-fcm="${k}" class="${key===k?"on":""}">${l}</button>`).join("")}</div>
 <div class="leg">${mods.map(m=>`<span><b style="background:${COL[m]}"></b>${MN[m]} (line is base, shading is downside to upside)</span>`).join("")}</div>
 <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${g2}</svg>
 ${tbl(["",...lab,"3 months"],rows)}
 ${tradNote}<div class="note">Uses the downside, base and upside assumptions already set for each model. Hypothetical, not a forecast. It leaves out seasonality and campaign effects.</div>`;
}
function renderOut(){
 const R_=allRes();renderControls();fcCard();
 // exec table and dashboard always need both models for deltas; allRes covers shown models only
 summary(R_);exec(R_);funnelSection(R_);reconCard(R_);sections(R_);scenCard();popCard(R_);tests();exportCard(R_);badges();
}
function funnelSection(R_){funnel(R_)}
function rebuild(){renderControls();editor();renderOut()}

// events
document.addEventListener("input",e=>{
 const el=e.target,p=el.dataset&&el.dataset.path;if(!p)return;
 const v=el.value.trim();let val;
 if(v===""){if(el.dataset.opt)val=null;else{el.classList.add("bad");return}}
 else{val=+v;if(!isFinite(val)||val<+el.dataset.min||val>+el.dataset.max){el.classList.add("bad");return}}
 el.classList.remove("bad");if(p==="visitors")val=Math.round(val);
 setPath(C,p,val);renderOut();
});
document.addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.show){C.show=b.dataset.show;rebuild()}
 else if(b.dataset.scn){C.scen=b.dataset.scn;rebuild()}
 else if(b.id==="cReset"){C=defaultsC();rebuild()}
 else if(b.dataset.fjreset){C=defaultsC();rebuild()}
 else if(b.id==="cResync"){window.bizSync&&window.bizSync(true)}
 else if(b.dataset.fcm){C.fcMetric=b.dataset.fcm;fcCard()}
 else if(b.dataset.recon){const m=b.dataset.m,d=defaultsC();
  if(b.dataset.recon==="use"){const rc=recon(C.visitors,C[m],res(m));if(rc)C[m].s[C.scen].act=Math.min(100,+(rc.seqRate*100).toFixed(4))}
  else C[m].s[C.scen].act=d[m].s[C.scen].act;
  editor();renderOut()}
 else if(b.id==="cCopy"){const t=$("cCsv").value,msg=$("cCopyMsg");
  try{navigator.clipboard.writeText(t).then(()=>msg.textContent="Copied.",()=>{$("cCsv").select();msg.textContent="Select and copy the text below."})}catch(x){$("cCsv").select();msg.textContent="Select and copy the text below."}}
});
document.addEventListener("change",e=>{if(e.target.id==="cSens"){sensModel=e.target.value;scenCard()}});
// tabs
const TABS=[["summary","S"],["journey","J"],["customers","U"],["flow","F"],["commercial","C"],["design","D"]];
function tab(t){if(!TABS.some(x=>x[0]===t))t="summary";TABS.forEach(([k,s])=>{$("tab"+s).style.display=k===t?"":"none";$("tb"+s).className=k===t?"on":""});if(t==="summary"&&window.drawSum)window.drawSum();if(t==="design"&&window.drawDesign)window.drawDesign();try{history.replaceState(null,"","#"+t)}catch(x){}}
TABS.forEach(([k,s])=>{$("tb"+s).onclick=()=>tab(k)});
window.addEventListener("hashchange",()=>tab(location.hash.slice(1)));
rebuild();tab(location.hash.slice(1));
window.__C={get:()=>C,calc,runTests,apply:(act,active)=>{const s=C.trad.s.base;s.act=act;s.active=active;rebuild()},
 applyBoth:(at,as,ar)=>{const d=defaultsC(),sc=(mk,key,v)=>{const b=d[mk].s.base[key];["down","base","up"].forEach(k=>{C[mk].s[k][key]=+(v*(b>0?d[mk].s[k][key]/b:1)).toFixed(4)})};
  sc("trad","act",at);sc("soft","act",as);if(ar!=null){sc("trad","active",ar);sc("soft","active",ar)}
  C.soft.stages={profile:null,init:null,kyc:null,completion:null};C.fromJourney=C.fromJourney||true;rebuild()},
 sync:o=>{["down","base","up"].forEach((k,i)=>{C.trad.s[k].act=o.trad[i];C.soft.s[k].act=o.soft[i];const D=defaultsC();C.trad.s[k].active=o.ar!=null?o.ar:D.trad.s[k].active;C.soft.s[k].active=o.ar!=null?o.ar:D.soft.s[k].active});
  C.visitors=o.visitors;C.growth=o.growth;C.soft.stages={profile:null,init:null,kyc:null,completion:null};C.fromJourney=o;rebuild()}};
if(window.bizSync)window.bizSync(true);if(window.drawSum)window.drawSum();
})();
