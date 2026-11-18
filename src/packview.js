// "Meet the customers": who is in each archetype, from the v7.1 pack (weighted by population_weight)
var PSTAT={};
function packStats(a){if(!PSTAT||!PACK||!PACKBY)return null;if(PSTAT[a])return PSTAT[a];const R=PACKBY[a];if(!R)return null;const W=R.tot,sh=f=>R.reduce((s,r)=>s+(f(r)?r.population_weight:0),0)/W;
 const q=(arr,p)=>{const v=arr.slice().sort((x,y)=>x.v-y.v),t=p*v.reduce((s,x)=>s+x.w,0);let c=0;for(const x of v){c+=x.w;if(c>=t)return x.v}return v.length?v[v.length-1].v:0};
 const ages=R.map(r=>({v:r.age,w:r.population_weight})),incs=R.map(r=>({v:r.personal_income_zar_pm,w:r.population_weight}));
 const mode=k=>{const m={};R.forEach(r=>m[r[k]]=(m[r[k]]||0)+r.population_weight);const e=Object.entries(m).sort((x,y)=>y[1]-x[1])[0];return e?[e[0],e[1]/W]:["",0]};
 const tops=k=>{const m={};R.forEach(r=>{if(r[k])m[r[k]]=(m[r[k]]||0)+r.population_weight});return Object.entries(m).sort((x,y)=>y[1]-x[1]).map(([v,w])=>[v,w/W])};
 const adults=R.reduce((s,r)=>s+r.represents_adults,0),all=PACK.reduce((s,r)=>s+r.represents_adults,0);
 const rn=mulberry(a.length*7919),feel={};R.forEach(r=>{const P=fromPack(r,rn);P.sens.forEach(t=>{if(CTAGS.includes(t))feel[t]=(feel[t]||0)+r.population_weight})});
 return PSTAT[a]={n:R.length,adults,shAd:adults/all,a10:q(ages,.1),a90:q(ages,.9),inc:q(incs,.5),area:mode("area_type"),phone:mode("phone_type"),data:mode("data_situation"),ch:mode("channel_preference"),lang:tops("home_language").slice(0,3),
  quit:tops("main_quit_trigger").slice(0,3),feel:Object.entries(feel).map(([t,w])=>[t,w/W]).sort((x,y)=>y[1]-x[1]).slice(0,5),
  facts:[["Prepaid or tight on data",sh(r=>String(r.data_situation).startsWith("Prepaid"))],["Feature phone or shares a phone",sh(r=>r.phone_type!=="Smartphone")],["Gets a grant",sh(r=>!!r.grants_received)],
   ["No proof of address in own name",sh(r=>r.proof_of_address!=="Yes")],["Patchy or poor network",sh(r=>r.network_reliability!=="Reliable")],["Basic reading level",sh(r=>r.reading_level==="Basic")],
   ["Highly anxious about scams",sh(r=>r.scam_anxiety==="High")],["Wants the app in their home language",sh(r=>r.prefers_home_language_in_app==="Yes")],["In a stokvel",sh(r=>r.stokvel_member==="Yes")],
   ["Works informally",sh(r=>r.employment_type==="Informal"||!!r.informal_work)],["Lives rurally",sh(r=>r.area_type==="Rural")],["Foreign national",sh(r=>r.citizenship==="Foreign national")],
   ["Has a bank account already",sh(r=>r.existing_bank_customer==="Yes")],["Tried to open an account and failed before",sh(r=>r.prior_failed_onboarding==="Yes")]],
  people:(()=>{const x=mulberry(a.length*104729),out=[],seen=new Set();for(let i=0;i<40&&out.length<3;i++){const r=packPick(a,x());if(r&&!seen.has(r.full_name)){seen.add(r.full_name);out.push(r)}}return out})()}}
const pct=v=>Math.round(v*100)+"%",zar=n=>"R"+Math.round(n).toLocaleString("en-ZA");
function packChips(a){const S=packStats(a);if(!S)return"";return`<div class="cuchips"><span>Age ${S.a10}–${S.a90}</span><span>Middle income ${zar(S.inc)} a month</span><span>Mostly ${esc(S.area[0].toLowerCase())}</span><span>${esc(S.phone[0])}</span><span>${esc(S.data[0])}</span><span>Prefers ${esc(S.ch[0].toLowerCase())}</span></div>`}
function packGroup(a){const S=packStats(a);if(!S)return"";const facts=S.facts.filter(f=>f[1]>=.05).sort((x,y)=>y[1]-x[1]).slice(0,8);
 return`<div class="pkg"><div class="pkg-h"><b>Who's in this group</b><span>${S.n.toLocaleString("en-ZA")} people in the v7.1 pack, standing for about ${(S.adults/1e6).toFixed(1)} million South African adults (${pct(S.shAd)} of adults). Weighted by population.</span></div>
 <div class="pkg-f">${facts.map(f=>`<div><b>${pct(f[1])}</b><span>${esc(f[0])}</span></div>`).join("")}</div>
 <div class="pkg-g"><div><h4>Most likely to make them quit</h4>${S.quit.map(q=>`<div class="pkg-r"><span>${esc(q[0])}</span><b>${pct(q[1])}</b></div>`).join("")}</div>
 <div><h4>What they feel more than most</h4>${S.feel.map(q=>`<div class="pkg-r"><span>${esc(tagL(q[0]))}</span><b>${pct(q[1])}</b></div>`).join("")}</div>
 <div><h4>Home languages</h4>${S.lang.map(q=>`<div class="pkg-r"><span>${esc(q[0])}</span><b>${pct(q[1])}</b></div>`).join("")}</div></div>
 <h4 class="pkg-ph">Three people from this group</h4><div class="pkg-p">${S.people.map(r=>`<div class="pkg-pp">${pavWho(r.full_name)}<div><b>${esc(r.full_name)}, ${r.age}</b><span>${esc(r.area_type)}, ${esc(r.province)} · ${esc(r.home_language)}</span><span>${esc(r.employment_type)}${r.informal_work?" ("+esc(r.informal_work.toLowerCase())+")":""} · ${zar(r.personal_income_zar_pm)} a month${r.grants_received?" · "+esc(r.grants_received.replace(/;/g,",")):""}</span><span>${esc(r.phone_type)}, ${esc(r.data_situation.toLowerCase())} · banks with ${esc(r.primary_bank)}</span><span class="pkg-q">Most likely to quit over: ${esc(r.main_quit_trigger)}</span></div></div>`).join("")}</div></div>`}
try{if(typeof drawCust==="function"&&BASE)drawCust()}catch(e){}
