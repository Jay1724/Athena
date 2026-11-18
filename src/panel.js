// panel.js: customer feedback from the persona feedback kit v2 (bank mode), run on the 10,000 synthetic base.
// Who quits, and where, comes from the calibrated simulation. Who struggles, what they talk about, how they say it,
// their rating and what they'd change follow the kit's engine: tagged bank lines picked to fit each person's life and
// the review's findings on each step (or typical findings for that step until the screens are reviewed).
var PANEL_BASE=10000,PNL={k:null},PNLC=null;
// the kit's vocabulary
const KTOPICS=["registration","personal_details","id_capture","selfie","otp","proof_of_address","employment_income","product_choice","fees","consent_terms","account_ready",
 "beneficiary","eft_payment","bills_airtime","cash_send","payment_confirmation","stokvel_setup","stokvel_contributions","stokvel_payout","stokvel_records",
 "navigation","language_words","speed_data","errors_recovery","security_trust","help_support","look_feel"];
const CTAGS=["too_many_steps","retype","too_much_info","cluttered","slow","data_heavy","wait_unclear","unclear_words","jargon","language","hidden_info","fees_unclear","upsell","limits",
 "doc_burden","date_rule","address_format","employment_mismatch","old_id","camera_fail","lighting","device_limit","otp_fail","otp_confusing","network","crash","lost_progress",
 "error_unclear","blame","no_back","navigation","trust_doubt","scam_fear","forced_consent","too_much_security","no_human","small_text","low_contrast","keyboard","accessibility",
 "card_collection","confirmation_missing","notification_spam","reconciliation","approval_burden","edit_records","payment_timing","cross_bank","cash_gap","electricity_fail","pop_format","interruptions"];
const PTAGS=["quick","simple","clear","guided","autofill","saved_progress","good_errors","feels_safe","fee_upfront","doc_alternative","relevant","confirmation_clear","virtual_card",
 "repeat_payment","saved_meter","data_free","helpful_help","nice_look","large_text","search","reminder","examples"];
// plain labels for designers
const TAGL={too_many_steps:"Too many steps",retype:"Typing the same thing twice",too_much_info:"Too much to read",cluttered:"Cluttered screen",slow:"Slow to load",data_heavy:"Uses a lot of data",
 wait_unclear:"Unclear how long to wait",unclear_words:"Unclear words",jargon:"Bank jargon",language:"Not in their language",hidden_info:"Information missing or hidden",fees_unclear:"Fees unclear",
 upsell:"Pushy upselling",limits:"Limits unclear",doc_burden:"Documents they don't have",date_rule:"Document date rules",address_format:"Address doesn't fit the form",
 employment_mismatch:"Work options don't fit their life",old_id:"Green ID book not accepted",camera_fail:"Camera or photo fails",lighting:"Photo needs perfect light",device_limit:"Phone can't cope",
 otp_fail:"OTP doesn't arrive",otp_confusing:"OTP confusing",network:"Network drops",crash:"App crashes",lost_progress:"Progress lost",error_unclear:"Error doesn't say what to do",
 blame:"Error blames the customer",no_back:"Can't go back",navigation:"Hard to find the way",trust_doubt:"Not sure it's safe",scam_fear:"Feels like a scam",forced_consent:"Forced to agree",
 too_much_security:"Too many security checks",no_human:"No person to help",small_text:"Text too small",low_contrast:"Hard to see",keyboard:"Keyboard covers things",
 accessibility:"Not accessible",card_collection:"Card collection unclear",confirmation_missing:"No clear confirmation",notification_spam:"Too many messages",reconciliation:"Records don't add up",
 approval_burden:"Too many approvals",edit_records:"Can't fix records",payment_timing:"Payment timing unclear",cross_bank:"Doesn't work across banks",cash_gap:"No cash option",
 electricity_fail:"Electricity purchase fails",pop_format:"Proof of payment not usable",interruptions:"Interrupted mid-way",
 quick:"Quick",simple:"Simple",clear:"Clear",guided:"Guided step by step",autofill:"Fills things in for them",saved_progress:"Saves progress",good_errors:"Helpful error messages",
 feels_safe:"Feels safe",fee_upfront:"Fee shown upfront",doc_alternative:"Another way without documents",relevant:"Fits their life",confirmation_clear:"Clear confirmation",
 virtual_card:"Virtual card straight away",repeat_payment:"Easy to repeat a payment",saved_meter:"Saves the meter number",data_free:"Doesn't use data",helpful_help:"Help that helps",
 nice_look:"Looks good",large_text:"Big, readable text",search:"Easy to search",reminder:"Useful reminders",examples:"Shows examples"};
const tagL=t=>TAGL[t]||t.replace(/_/g," ").replace(/^./,c=>c.toUpperCase());
// typical findings by step tag until the screens are reviewed: topic, [[problem, severity]], [strengths]
const TFIND={select:["product_choice",[["jargon",1],["fees_unclear",1]],["simple"]],elig:["personal_details",[["unclear_words",1]],["quick"]],
 details:["personal_details",[["retype",2],["cluttered",1]],["saved_progress"]],idcap:["id_capture",[["camera_fail",2],["lighting",1]],["good_errors"]],
 verify:["selfie",[["camera_fail",2],["wait_unclear",1]],["feels_safe"]],fica:["proof_of_address",[["doc_burden",3],["date_rule",1]],[]],
 decision:["employment_income",[["employment_mismatch",2],["wait_unclear",1]],["relevant"]],sign:["consent_terms",[["too_much_info",1],["otp_fail",1]],["fee_upfront"]],
 activate:["account_ready",[["card_collection",2]],["virtual_card"]],none:["navigation",[["too_many_steps",1]],["simple"]]};
// praise that can't sit next to a complaint on the same step
const CONTRA={clear:["unclear_words","jargon","hidden_info","fees_unclear","limits","error_unclear","otp_confusing","language","wait_unclear"],simple:["too_many_steps","cluttered","too_much_info","navigation","retype"],
 quick:["too_many_steps","slow","wait_unclear","data_heavy","retype","network"],guided:["camera_fail","unclear_words","jargon","hidden_info","navigation","error_unclear"],
 fee_upfront:["fees_unclear","hidden_info"],good_errors:["error_unclear","blame","camera_fail","otp_fail"],autofill:["retype"],saved_progress:["lost_progress","crash"],
 doc_alternative:["doc_burden","old_id","date_rule"],feels_safe:["trust_doubt","scam_fear","forced_consent"],confirmation_clear:["confirmation_missing","wait_unclear"],
 data_free:["data_heavy"],large_text:["small_text","low_contrast"],helpful_help:["no_human"],relevant:["employment_mismatch","cash_gap"],virtual_card:["card_collection"],nice_look:["cluttered","low_contrast"]};
const clash=(g,tags)=>(CONTRA[g]||[]).some(t=>tags.includes(t));
// what a reason for leaving points at
const RTAG=[[/glare/i,"lighting"],[/camera|liveness|photo|selfie|check failed/i,"camera_fail"],[/no id/i,"old_id"],[/proof|document|file too big|wrong format|upload|not at hand|not to hand/i,"doc_burden"],
 [/form too long|too much to type/i,"too_many_steps"],[/terms too long/i,"too_much_info"],[/fees|limits surprised/i,"fees_unclear"],[/unsure|didn't see|what happens next|worried/i,"unclear_words"],
 [/privacy|why it's needed/i,"trust_doubt"],[/network|timeout/i,"network"],[/phone too slow/i,"device_limit"],[/otp/i,"otp_fail"],[/waiting/i,"wait_unclear"],[/declined|not what they hoped/i,"employment_mismatch"],[/branch/i,"no_human"]];
const NEUTRAL=/comparing|no real intent|just looking|changed mind|lost interest|not eligible|never made/i;
function rTag(rs){const m=RTAG.find(x=>x[0].test(rs||""));return m?m[1]:null}
function findOf(p,k){const s=p.steps[k];const T=TFIND[s&&s.tag]||TFIND.none;if(!s)return{topic:"navigation",is:[],gd:[],src:"typical"};
 const sc=FREV&&Array.isArray(FREV.screens)?FREV.screens.filter(x=>x.step===s.name):[];
 if(sc.length&&sc.some(x=>x.is||x.gd)){const is={},gd=new Set();let topic=null;sc.forEach(x=>{if(!topic&&x.topic)topic=x.topic;(x.is||[]).forEach(o=>{is[o.t]=Math.max(is[o.t]||0,o.s)});(x.gd||[]).forEach(t=>gd.add(t))});
  const I=Object.entries(is);return{topic:topic||T[0],is:I,gd:[...gd].filter(g=>!clash(g,I.map(x=>x[0]))),src:"review"}}
 return{topic:T[0],is:T[1],gd:T[2].filter(g=>!clash(g,T[1].map(x=>x[0]))),src:"typical"}}

// ---- the bank ----
const KB=KBANK.map((r,i)=>({id:i,topic:r[0],s:r[1],d:r[2],fits:r[3]?r[3].split(","):[],tags:r[4]?r[4].split(","):[],text:r[5],iq:!!r[6],iok:!!r[7]})),KBT={};
KB.forEach(b=>(KBT[b.topic]=KBT[b.topic]||[]).push(b));
// first names [female, male] and surnames, by home language
const NAMES={isiZulu:[["Sibongile","Thandeka","Nomvula","Zanele","Lindiwe","Nokuthula","Thembi"],["Sipho","Mandla","Bongani","Sifiso","Sbu","Themba","Lungelo"],["Zulu","Mkhize","Ngcobo","Dlamini","Khumalo","Mthembu","Ndlovu","Cele","Shabalala","Nxumalo"]],
 isiXhosa:[["Siphokazi","Esethu","Ayanda","Noxolo","Sinethemba","Nandi"],["Lwazi","Luthando","Siyabonga","Mthunzi","Aphiwe","Lunga"],["Mabuza","Mqhayi","Nkonyeni","Gqoba","Sityana","Mbeki","Tshabalala"]],
 siSwati:[["Thuli","Nomsa","Lindiwe"],["Sifiso","Mfundo","Sandile"],["Mdluli","Shongwe","Dlamini","Magagula"]],
 Sesotho:[["Palesa","Lerato","Refiloe","Mpho"],["Teboho","Thabo","Lebohang","Tumelo"],["Mokoena","Molefe","Phiri","Nthako","Moloi"]],
 Setswana:[["Goitseone","Onalenna","Boitumelo","Kelebogile"],["Kagiso","Tumelo","Tshepo","Katlego"],["Kekana","Molefe","Sebola","Moeng","Mokgosi"]],
 Sepedi:[["Karabo","Lesego","Mamello","Mahlatse"],["Tshepo","Mpho","Lehlogonolo","Kgothatso"],["Mohlala","Mahlangu","Maake","Ramokgopa","Selepe"]],
 Afrikaans:[["Danielle","Chantel","Riana","Shireen","Anneke"],["Elton","Johan","Pieter","Riaan","Ashwin"],["Booysen","Botha","van Wyk","Adams","Jacobs","Pretorius","Hendricks"]],
 English:[["Fatima","Priya","Michelle","Ayesha","Kerry"],["Ryan","Daniel","Kevin","Yusuf","Ravi"],["Bailey","Patel","Naidoo","Smith","Pillay","Williams","Moodley"]],
 foreign:[["Chipo","Tendai","Amina","Blessing","Rutendo"],["Farai","Tatenda","Joao","Blessing","Kudzai"],["Moyo","Ncube","Banda","Mutasa","Chikwanha","Sithole"]]};
const DIGL={entry:"Low",mid:"Medium",high:"High"};
const capS=s=>s.charAt(0).toUpperCase()+s.slice(1),lowS=s=>s.charAt(0).toLowerCase()+s.slice(1);
const inRange=(s,x)=>{const a=String(s||"").replace(/[R\s]/g,"").split(/[–-]/).map(Number).filter(n=>!isNaN(n));return a.length?Math.round(a[0]+((a[1]||a[0])-a[0])*x):0};

// one individual from an archetype: the kit's traits, filled in by archetype and South African base rates (assumptions until the v7.1 pack is loaded)
function personOf(c,pe,B,I,rn){const A=pe.name,t=new Set(),has=re=>re.test(A);
 const ag=I?I.age.split(/[–-]/).map(Number):[25,45],age=Math.round(ag[0]+((ag[1]||ag[0])-ag[0])*rn()),inc=I?inRange(I.inc,Math.pow(rn(),1.4)):6000;
 t.add(B.dev==="high"?"high":"low");if(age>=60)t.add("old");if(age<35)t.add("young");
 if(has(/Grant Receiver|Pension Caregiver/)||has(/Single Parent|Financial Survivor/)&&rn()<.5||age>=60&&rn()<.6||inc<2500&&rn()<.5)t.add("grant");
 const informal=has(/Informal Trader|Township Entrepreneur/)||has(/Hustler|Financial Survivor/)&&rn()<.5;if(informal)t.add("informal");
 if(rn()<.04)t.add("foreign");if(B.dev==="entry"&&rn()<.25)t.add("feature");if(inc>=12000)t.add("prof");if(inc<2500)t.add("lowinc");
 if(has(/Single Parent|Provider/)||age>=24&&age<=55&&rn()<.4)t.add("parent");
 const member=has(/Community Builder/)||rn()<.25;if(member)t.add("member");if(member&&rn()<(has(/Community Builder/)?.4:.1))t.add("treasurer");
 if((has(/Grant Receiver|Pension Caregiver|Financial Survivor|Community Builder/)&&rn()<.3)||rn()<.06)t.add("rural");
 const fem=has(/Single Parent/)?rn()<.85:rn()<.52;t.add(fem?"female":"male");
 const sal=!informal&&!has(/Grant Receiver|Pension Caregiver|Financial Survivor|Township Entrepreneur/)&&age<62;if(sal)t.add("salaried");if(sal||informal||has(/Entrepreneur|Hustler/))t.add("working");
 if(B.dat==="prepaid"||B.dat==="light")t.add("prepaid");if(B.trust==="L"||has(/Security Seeker/)||rn()<.1)t.add("scam_fear");
 // what this person feels more than most
 const s=new Set(),add=a=>a.forEach(x=>s.add(x));
 if(t.has("prepaid"))add(["data_heavy","data_free","slow"]);if(t.has("old"))add(["small_text","low_contrast","large_text","accessibility"]);
 if(B.dev==="entry"||t.has("feature"))add(["camera_fail","device_limit","crash","lighting"]);
 const noPoa=B.quit==="fica"||t.has("lowinc")&&rn()<.5||t.has("young")&&rn()<.35||t.has("rural")&&rn()<.6;if(noPoa||t.has("foreign"))add(["doc_burden","doc_alternative","hidden_info","date_rule","address_format"]);
 if(B.reading==="Basic"||B.english==="Home language first")add(["jargon","unclear_words","language","clear"]);
 if(t.has("scam_fear"))add(["scam_fear","trust_doubt","feels_safe","forced_consent"]);if(B.patience==="L")add(["too_many_steps","slow","wait_unclear","retype","lost_progress"]);
 if(t.has("rural")||B.dev==="entry"&&rn()<.5)add(["otp_fail","network","lost_progress","saved_progress"]);if(t.has("lowinc"))add(["fees_unclear","fee_upfront","upsell"]);
 if(B.stuck!=="retry alone")add(["no_human","helpful_help","guided"]);if(t.has("informal"))add(["employment_mismatch","relevant","cash_gap"]);if(t.has("treasurer"))add(["reconciliation","approval_burden","edit_records"]);
 // natural answer length, from how they talk
 const sty=STYLEL[B.style]||"",dm=Object.assign({},{"Short and blunt":{s:45,m:45,r:10},"Quiet, says little":{s:60,m:35,r:5},"Chatty, wanders":{s:5,m:35,r:60},Complainer:{s:15,m:45,r:40},"Easy-going":{s:30,m:50,r:20},Suspicious:{s:20,m:50,r:30}}[sty]||{s:30,m:45,r:25});
 if(B.reading==="Basic"){dm.s*=1.4;dm.r*=.6}const tot=dm.s+dm.m+dm.r;let x=rn()*tot;const depth=x<dm.s?"s":x<dm.s+dm.m?"m":"r";const dw={s:depth==="s"?1:.25,m:depth==="m"?1:.25,r:depth==="r"?1:.25};
 const nm=t.has("foreign")?NAMES.foreign:NAMES[B.lang]||NAMES.English,fn=nm[fem?0:1],other=["Capitec","FNB","Absa","TymeBank","Nedbank","my old bank"][Math.floor(rn()*6)];
 return{age,inc,t,sens:s,depth,dw,sty,fem,other,who:fn[Math.floor(rn()*fn.length)]+" "+nm[2][Math.floor(rn()*nm[2].length)]}}

// one real person from the v7.1 pack: the kit's traits(), sensitive_tags() and depth, exactly as the kit's engine reads them
function fromPack(r,rn){const t=new Set(),age=r.age,inc=r.personal_income_zar_pm,et=r.employment_type;
 t.add(r.digital_comfort==="Low"||r.digital_comfort==="Medium"?"low":"high");if(age>=60)t.add("old");if(age<35)t.add("young");if(r.grants_received)t.add("grant");
 if(et==="Informal"||r.informal_work)t.add("informal");if(r.citizenship==="Foreign national")t.add("foreign");if(r.phone_type!=="Smartphone")t.add("feature");
 if(inc>=12000)t.add("prof");if(inc<2500)t.add("lowinc");if(r.minor_children>0)t.add("parent");if(r.stokvel_member==="Yes")t.add("member");
 if(["Treasurer","Chairperson","Secretary"].includes(r.stokvel_role))t.add("treasurer");if(r.area_type==="Rural")t.add("rural");t.add(r.gender==="F"?"female":"male");
 if(["Salaried","Contract","Salaried + side hustle"].includes(et))t.add("salaried");if(["Salaried","Contract","Salaried + side hustle","Self-employed","Informal"].includes(et))t.add("working");
 if(String(r.data_situation).startsWith("Prepaid"))t.add("prepaid");if(r.scam_anxiety==="High"||r.experienced_fraud==="Yes")t.add("scam_fear");
 const s=new Set(),add=a=>a.forEach(x=>s.add(x));
 if(t.has("prepaid"))add(["data_heavy","data_free","slow"]);if(t.has("old")||r.accessibility_need==="Vision")add(["small_text","low_contrast","large_text","accessibility"]);
 if(r.device_tier==="Entry"||r.device_tier==="Basic"||t.has("feature"))add(["camera_fail","device_limit","crash"]);
 if(r.proof_of_address!=="Yes"||t.has("foreign")||/No valid/.test(r.id_document))add(["doc_burden","doc_alternative","hidden_info"]);
 if(r.reading_level==="Basic"||r.prefers_home_language_in_app==="Yes")add(["jargon","unclear_words","language","clear"]);
 if(t.has("scam_fear")||r.trust_in_banks==="Low")add(["scam_fear","trust_doubt","feels_safe","forced_consent"]);if(r.patience==="Low")add(["too_many_steps","slow","wait_unclear","retype","lost_progress"]);
 if(r.network_reliability==="Patchy"||r.network_reliability==="Poor")add(["otp_fail","network","lost_progress","saved_progress"]);if(t.has("lowinc"))add(["fees_unclear","fee_upfront","upsell"]);
 if(r.help_seeking!=="Self-service")add(["no_human","helpful_help","guided"]);if(t.has("informal"))add(["employment_mismatch","relevant","cash_gap"]);if(t.has("treasurer"))add(["reconciliation","approval_burden","edit_records"]);
 const depth=["s","m","r"].includes(r.feedback_depth)?r.feedback_depth:"m",dw={s:.25,m:.25,r:.25};dw[depth]=1;if(r.reading_level==="Basic"){dw.s*=1.4;dw.r*=.6}
 const ob=String(r.other_banks||"").split("; ").filter(b=>b&&!/Postbank/.test(b)&&b!==r.primary_bank);
 return{row:r,age,inc,t,sens:s,depth,dw,sty:r.feedback_style,fem:r.gender==="F",other:ob[0]||["Capitec","FNB","Absa","TymeBank","my old bank"][Math.floor(rn()*5)],who:r.full_name,
  lang:r.home_language,polite:({High:"H",Medium:"M",Low:"L"})[r.politeness_bias]||"M",maxw:r.max_feedback_words}}
// the kit's slots, filled from the person
function kFill(text,P,rn){const age=P.age,fam=[...(age>=50?["my son","my daughter","my grandson","my granddaughter"]:[]),...(age<35?["my sister","my brother","my cousin","my friend"]:[]),"my neighbour","my sister","my niece"];
 const amt=(P.inc<2500?[150,200,300,350]:P.inc<12000?[500,800,1200]:[2000,3500,5000])[Math.floor(rn()*(P.inc<2500?4:3))];
 const S={other_bank:P.other,family:fam[Math.floor(rn()*fam.length)],data_amount:["R12","R15","R29","R49","1GB"][Math.floor(rn()*5)],place:["taxi","queue at Shoprite","kitchen","bus","clinic queue","car while waiting"].concat(P.t.has("informal")?["shop between customers"]:[])[Math.floor(rn()*(P.t.has("informal")?7:6))],
  amount:amt.toLocaleString("en-ZA").replace(/\s/g,","),minutes:["twenty minutes","half an hour","almost an hour","forty minutes"][Math.floor(rn()*4)],bank:"the bank"};
 return text.replace(/\{(\w+)\}/g,(m,k)=>S[k]!=null?S[k]:m)}
const FLAV={N:{nguni:["Eish,","Haibo,","Yho,"],sotho:["Eish,","Aowa,","Yho,"],afr:["Ag,","Ag nee,","Jislaaik,"],en:["Ag,","Honestly,","Eish,"]},U:{nguni:["Ja,","Hmm,"],sotho:["Ja,","Hmm,"],afr:["Ja nee,","Ja,"],en:["Ja,","Well,"]},P:{nguni:["Sharp,","Ja,"],sotho:["Sharp,","Ja,"],afr:["Lekker,","Ja,"],en:["Ja,","Okay,"]}};
const lgrp=l=>/isiZulu|isiXhosa|siSwati|isiNdebele/.test(l)?"nguni":/Sesotho|Setswana|Sepedi|Tshivenda|Xitsonga/.test(l)?"sotho":l==="Afrikaans"?"afr":"en";
const ONB=new Set(["registration","personal_details","id_capture","selfie","otp","proof_of_address","employment_income","product_choice","fees","consent_terms","account_ready","overall"]);
// pick a bank line: right topic and feeling, fits the person, speaks to the step's problems, not overused, doesn't contradict what they did
function kPick(U,topic,sent,P,want,focus,outcome,rn,fall=["errors_recovery","overall"],excl){for(const tp of [topic,...fall]){
 const c=(KBT[tp]||[]).filter(b=>b.s===sent&&b.fits.every(f=>P.t.has(f))&&!(outcome==="quit"&&b.iok)&&!(outcome==="ok"&&b.iq)&&!(excl&&excl.some(w=>b.text.toLowerCase().includes(w))));if(!c.length)continue;
 const w=c.map(b=>{let o=1+3*b.tags.filter(x=>want.has(x)).length+(focus&&b.tags.includes(focus)?4:0)+1.5*b.tags.filter(x=>P.sens.has(x)).length+(b.fits.length?2.5:0);if(want.size&&b.tags.length&&!b.tags.some(x=>want.has(x))&&tp===topic)o*=.35;return o*(P.dw[b.d]||.2)/(1+2*(U[b.id]||0))});
 let r=rn()*w.reduce((a,v)=>a+v,0);for(let i=0;i<c.length;i++){r-=w[i];if(r<=0){U[c[i].id]=(U[c[i].id]||0)+1;return c[i]}}const b=c[c.length-1];U[b.id]=(U[b.id]||0)+1;return b}return null}
function kAddon(U,kind,sent,P,topic,rn){const c=(KBT[kind]||[]).filter(b=>(b.s===sent||b.s==="*")&&b.fits.every(f=>P.t.has(f))&&!(b.tags.includes("onb")&&!ONB.has(topic)));if(!c.length)return null;
 const w=c.map(b=>(b.fits.length?2.5:1)/(1+(U[b.id]||0)));let r=rn()*w.reduce((a,v)=>a+v,0);for(let i=0;i<c.length;i++){r-=w[i];if(r<=0){U[c[i].id]=(U[c[i].id]||0)+1;return c[i]}}return c[0]}
function kRender(U,b,P,B,sent,rn,addon=true){let t=kFill(b.text,P,rn),lead=null,tail=null;
 if(addon&&b.topic!=="masked"&&b.topic!=="suggestion"){const pr=b.d==="r"?.45:b.d==="m"?.15:0;if(rn()<pr){if(rn()<.5)lead=kAddon(U,"addon_lead",sent,P,b.topic,rn);else tail=kAddon(U,"addon_tail",sent,P,b.topic,rn)}}
 if(lead)t=kFill(lead.text,P,rn)+" "+t;if(tail)t=t+" "+kFill(tail.text,P,rn);t=t.charAt(0).toUpperCase()+t.slice(1);
 if(!lead&&FLAV[sent]&&rn()<(sent!=="P"?.14:.07)&&!/^(Eish|Haibo|Yho|Ag|Ja|Sharp|Lekker)/.test(t)){const f=FLAV[sent][lgrp(P.lang||B.lang)];t=f[Math.floor(rn()*f.length)]+" "+(/^(I |I'|[A-Z]{2}|Capitec|FNB|Absa|TymeBank|SASSA)/.test(t)?t:lowS(t))}
 return t}
const KS={N:"neg",U:"mix",P:"pos"};
const TALKN={"Quiet, says little":1,"Short and blunt":2,"Easy-going":2,Suspicious:2,Complainer:3,"Chatty, wanders":4};

function panelRun(p,R){
 const key=p.name+"|"+R.cust.length+"|"+R.openN+"|"+(FREV?FREV.at:0);if(PNL.k===key)return PNL;
 const all=R.cust.filter(c=>c.status==="done"||c.status==="drop"),N=Math.min(PANEL_BASE,all.length),stp=all.length/Math.max(1,N),pool=Array.from({length:N},(_,n)=>all[Math.floor(n*stp)]),out=[];
 const steps=p.steps.map((s,k)=>({s,k,f:findOf(p,k),reach:0,quit:0,str:0,CT:{},PT:{},com:[],ncom:0,sent:{neg:0,mix:0,pos:0,flat:0}}));
 const CT={},PT={},sent={neg:0,mix:0,pos:0,flat:0},seen=new Set(),U={};let uniq=0,allC=0,gap=0,fin=0,rs=0,dk=0;
 for(let n=0;n<N;n++){const c=pool[n],pe=p.personas[c.j],B=btr(pe),I=pinfo(pe.name),rn=mulberry(Math.floor(hr(c,4242)*4294967296)),row=typeof packPick==="function"?packPick(pe.name,hr(c,4343)):null,P=row?fromPack(row,rn):personOf(c,pe,B,I,rn);
  const reached=[...new Set(c.path.map(q=>q.k))].sort((a,b)=>a-b),dropped=c.status==="drop",ev={},tries={};(c.ev||[]).forEach(([i,e])=>ev[i]=(ev[i]||"")+e);c.path.forEach(q=>tries[q.k]=(tries[q.k]||0)+1);
  const so=[],ct=new Set(),pt=new Set();let nStr=0;
  reached.forEach(k=>{const st=steps[k],F=st.f;st.reach++;const quit=dropped&&c.dropK===k,hard=!!ev[k]||tries[k]>1;
   let fr=F.is.reduce((a,[t,v])=>a+v*(P.sens.has(t)?2.2:1),0)-.6*F.gd.filter(g=>P.sens.has(g)).length;fr=Math.max(0,fr);
   const felt=F.is.filter(([t])=>P.sens.has(t)).map(x=>x[0]),rt=quit?rTag(c.rs):null,neutral=quit&&NEUTRAL.test(c.rs||"");
   const struggled=quit&&!neutral||hard||rn()<1-Math.exp(-.075*fr);let tag=null;
   if(struggled){tag=rt||(()=>{const o=F.is.map(([t,v])=>[t,v*(P.sens.has(t)?2.2:1)]);if(!o.length)return null;let r=rn()*o.reduce((a,x)=>a+x[1],0);for(const x of o){r-=x[1];if(r<=0)return x[0]}return o[0][0]})();
    if(tag){ct.add(tag);st.CT[tag]=(st.CT[tag]||0)+1}st.str++;nStr++}
   if(quit)st.quit++;so.push({k,F,quit,neutral,struggled,felt,tag,topic:F.topic})});
  // which steps they talk about
  const tp=s=>s.quit?(s.neutral?.4:.9):s.struggled?.65:s.felt.length?.5:s.F.gd.length?.3:.1;
  const chosen=so.filter(s=>rn()<tp(s)).sort((a,b)=>tp(b)-tp(a)).slice(0,TALKN[P.sty]||2).sort((a,b)=>a.k-b.k);
  const S=[];const used=new Set();
  chosen.forEach(s=>{let w=s.quit&&!s.neutral?{N:85,U:15,P:0}:s.quit?{N:30,U:60,P:10}:s.struggled?{N:65,U:30,P:5}:s.F.is.length&&s.F.gd.length?{N:25,U:40,P:35}:s.F.is.length?{N:35+15*(s.felt.length>0),U:40,P:15}:s.F.gd.length?{N:6,U:30,P:64}:{N:15,U:50,P:35};
   if(P.sty==="Complainer"){w.N*=1.5;w.P*=.5}if(P.sty==="Easy-going"){w.P*=1.4;w.N*=.7}if(!s.F.gd.length)w.P=0;if(s.struggled)w.P=0;
   const tot=w.N+w.U+w.P;let r=rn()*tot,se=r<w.N?"N":r<w.N+w.U?"U":"P",masked=false;if(se==="N"&&(P.polite||B.polite)==="H"&&rn()<.45){se="U";masked=true}
   let tag=s.tag;if(se==="P"){const g=s.F.gd.filter(x=>P.sens.has(x));tag=(g.length?g:s.F.gd)[Math.floor(rn()*(g.length||s.F.gd.length))];pt.add(tag);steps[s.k].PT[tag]=(steps[s.k].PT[tag]||0)+1}
   const want=new Set(se==="P"?s.F.gd:s.F.is.map(x=>x[0])),b=kPick(U,s.topic,se,P,want,tag,s.quit?(masked?null:"quit"):"ok",rn);if(!b||used.has(b.id))return;used.add(b.id);
   S.push({k:s.k,kind:KS[se],tag:se==="P"?tag:(tag||b.tags.find(x=>want.has(x))||null),quit:s.quit,played:masked,text:kRender(U,b,P,B,se,rn),bid:b.id})});
  // overall, honest or played down
  const completed=!dropped,ow=!completed?{N:72,U:28,P:0}:nStr>=2?{N:45,U:45,P:10}:nStr===1?{N:20,U:50,P:30}:{N:6,U:34,P:60};
  let r0=rn()*100,os=r0<ow.N?"N":r0<ow.N+ow.U?"U":"P",down=false,ob;
  if(os==="N"&&(P.polite||B.polite)==="H"&&rn()<.55){ob=kPick(U,"masked",rn()<.67?"U":"P",P,new Set(),null,completed?"ok":null,rn,[])||kPick(U,"masked","U",P,new Set(),null,null,rn,[]);down=true}
  else{const tops=new Set(so.map(s=>s.topic)),ex=[];if(!tops.has("id_capture")&&!tops.has("selfie"))ex.push("picture","camera");if(!tops.has("proof_of_address"))ex.push("papers");
   ob=kPick(U,"overall",os,P,new Set(),null,completed?"ok":"quit",rn,[],ex)||kPick(U,"overall",os,P,new Set(),null,null,rn,[])}
  const overall=ob?kRender(U,ob,P,B,ob.s,rn,!down):"";
  // what would you change
  const worst={};so.forEach(s=>s.F.is.forEach(([t])=>{worst[t]=(worst[t]||0)+(s.felt.includes(t)?2:1)+(s.quit?3:0)}));const wk=Object.entries(worst).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
  let sb=null;if(rn()<(/Quiet|Easy/.test(P.sty)?.5:.3)||!wk.length)sb=kPick(U,"suggestion","U",P,new Set(["none"]),"none",null,rn,[]);
  else{const cs=(KBT.suggestion||[]).filter(x=>x.tags.some(t=>wk.includes(t))&&x.fits.every(f=>P.t.has(f)));sb=cs.length?cs[Math.floor(rn()*cs.length)]:kPick(U,"suggestion","U",P,new Set(["none"]),"none",null,rn,[])}
  const change=sb?kFill(sb.text,P,rn):"I don't know.";
  // rating
  let g=0;for(let q=0;q<3;q++)g+=rn();g=(g-1.5)*.55*2;const rating=Math.max(1,Math.min(5,Math.round({N:2,U:3.1,P:4.2}[os]+(completed?.4:-.3)-.25*nStr+({H:.7,M:0,L:-.4}[P.polite||B.polite]||0)+g)));
  const struggled=dropped||nStr>0,sayDo=down||rating>=4&&struggled;if(sayDo)gap++;if(down)dk++;
  const o={c,pe,B,I,P,S,rating,dropped,down,sayDo,overall,change,ct:[...ct],pt:[...pt],who:P.who,age:P.age,dig:P.row?P.row.digital_comfort:DIGL[B.dev]||"Medium"};
  S.forEach(x=>{const st=steps[x.k];sent[x.kind]++;st.sent[x.kind]++;st.ncom++;allC++;const kk=x.text.toLowerCase();if(!seen.has(kk)){uniq++;seen.add(kk)}
   if(st.com.length<600)st.com.push({ob:o,s:x});else if(rn()<600/st.ncom)st.com[Math.floor(rn()*600)]={ob:o,s:x}});
  ct.forEach(t=>CT[t]=(CT[t]||0)+1);pt.forEach(t=>PT[t]=(PT[t]||0)+1);if(completed)fin++;rs+=rating;out.push(o)}
 const arch={};out.forEach(o=>{const a=arch[o.pe.name]||(arch[o.pe.name]={n:0,f:0,r:0});a.n++;if(!o.dropped)a.f++;a.r+=o.rating});
 PNL={k:key,N,out,steps,CT,PT,sent,allC,uniq,gap,down:dk,fin,avg:N?rs/N:0,arch,src:steps.some(s=>s.f.src==="review")?"review":"typical"};PNLC=null;return PNL}

// designer-facing fixes for each complaint tag
const TFIX={too_many_steps:"Merge small screens, ask only what's needed today, and show how much is left.",retype:"Reuse what's already captured. The ID number gives the date of birth. Prefill the rest.",
 too_much_info:"Cut the text to what matters now. Put the rest behind \"Read more\".",cluttered:"One decision per screen, with one clear main button.",slow:"Speed up screen loads and show progress while waiting.",
 data_heavy:"Shrink downloads and uploads, say how much data it uses, and consider zero-rating the app.",wait_unclear:"Say how long it will take and what happens next.",
 unclear_words:"Swap bank terms for plain words and add a one-line example under each.",jargon:"Replace jargon with everyday words. Explain the few terms you must keep.",language:"Offer the main home languages, at least for key steps and errors.",
 hidden_info:"Show what's needed, what it costs and what comes next before asking for details.",fees_unclear:"Show the monthly fee and any charges in rands, up front.",upsell:"Hold the cross-sell until the account is open.",
 limits:"State the limits in plain numbers where people make the choice.",doc_burden:"Ask for documents only when needed, say upfront what's needed, and accept a declaration or a later upload.",
 date_rule:"Relax the document date rule or say it clearly before people go looking.",address_format:"Accept informal and rural addresses: free text, a landmark, a pin on the map.",
 employment_mismatch:"Add options for informal, part-time and grant income, in plain words.",old_id:"Accept the green ID book, or offer another way to verify.",
 camera_fail:"Auto-capture with clear framing, and after three failed tries offer another way: upload a photo or have an agent check it.",lighting:"Tell people about light before they start and let the camera adjust.",
 device_limit:"Test on small, entry-level Android phones. Keep the main button above the keyboard.",otp_fail:"Show a resend timer and offer WhatsApp or a slow, clear voice call.",
 otp_confusing:"Say where the code was sent and how long it lasts.",network:"Save progress after every step so a dropped connection doesn't start them over.",crash:"Fix the crash, and return people to where they were.",
 lost_progress:"Save progress after every step and let people continue later.",error_unclear:"Say what went wrong and exactly what to do next, in plain words.",blame:"Write errors that take the blame off the customer.",
 no_back:"Let people go back without losing what they entered.",navigation:"Make the next step obvious and label the way back.",trust_doubt:"Say why each detail is needed, and show clearly that it's the bank.",
 scam_fear:"Show the bank's verified signs and never ask for things a scammer would.",forced_consent:"Separate what's required from what's optional, and let people say no.",
 too_much_security:"Cut repeat checks. Ask once, at the moment it matters.",no_human:"Offer a call-back or chat with a person at the hard steps.",small_text:"Use bigger text by default and respect the phone's text size.",
 low_contrast:"Raise contrast to WCAG AA at least.",keyboard:"Keep fields and buttons visible above the keyboard.",accessibility:"Test with screen readers and larger text sizes.",
 card_collection:"Say where and when to get the card, or give a virtual card straight away.",confirmation_missing:"Show a clear confirmation with what happens next.",
 notification_spam:"Send fewer, more useful messages.",reconciliation:"Show a running record that adds up, member by member.",approval_burden:"Simplify approvals, with clear status for each approver.",
 edit_records:"Let the treasurer fix mistakes, with a visible history.",payment_timing:"Say when money leaves and when it arrives.",cross_bank:"Support members who bank elsewhere.",
 cash_gap:"Offer a cash in and cash out option.",electricity_fail:"Retry failed purchases automatically and show the token clearly.",pop_format:"Make proof of payment easy to share on WhatsApp.",
 interruptions:"Let people pause and pick up where they left off."};
// three quotes for one step: the step's top complaints first, then praise, all from different archetypes
function stepQuotes(P,k){const st=P.steps[k],res=[],ua=new Set(),ut=new Set(),ct=Object.keys(st?st.CT:{});if(!st||!st.com.length)return res;
 const order=[...Object.entries(st.CT).sort((a,b)=>b[1]-a[1]).map(e=>e[0]),...Object.entries(st.PT).sort((a,b)=>b[1]-a[1]).map(e=>e[0])];
 const tryAdd=f=>{for(const x of st.com){if(res.length>=3)return;if(!x||res.some(y=>y.s.bid===x.s.bid||y.s.text===x.s.text)||(PNLC||[]).some(q=>q.x.s.bid===x.s.bid)||x.s.kind==='pos'&&clash(x.s.tag,ct)||ua.has(x.ob.pe.name)||res.includes(x)||!f(x))continue;res.push(x);ua.add(x.ob.pe.name);ut.add(x.s.tag);return}};
 order.forEach(t=>{if(res.length<3&&!ut.has(t))tryAdd(x=>x.s.tag===t&&x.s.kind!=="flat")});tryAdd(x=>x.ob.sayDo);while(res.length<3){const n=res.length;tryAdd(()=>true);if(res.length===n)break}
 return res}
function pavWho(n){const w=n.split(/\s+/),ini=(w[0][0]+(w[w.length-1]||"")[0]).toUpperCase();let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))>>>0;return`<span class="av" style="background:${AVC[h%AVC.length]}">${esc(ini)}</span>`}
const SL={neg:"negative",mix:"mixed",pos:"positive",flat:"flat"};
// the headline numbers, from every simulated customer
function fbKpis(P){const pc=v=>Math.round(v*100)+"%",N=P.N||1,cs=P.allC||1,f=n=>n.toLocaleString("en-ZA");
 const A=Object.entries(P.arch).filter(e=>e[1].n>=N*.02).map(([n,a])=>({n,r:a.r/a.n})).sort((x,y)=>y.r-x.r),best=A[0],worst=A[A.length-1];
 return`<div class="pkpi"><div><b>${pc(P.fin/N)}</b><span>of the ${f(P.N)} synthetic customers finished</span></div><div><b>${P.avg.toFixed(1)}<small>/5</small></b><span>average rating${best&&worst&&best!==worst?` · ${esc(best.n.replace(/^The /,""))} ${best.r.toFixed(1)}, ${esc(worst.n.replace(/^The /,""))} ${worst.r.toFixed(1)}`:""}</span></div><div><b>${pc(P.gap/N)}</b><span>said it was fine or rated it 4 or 5, but struggled or quit</span></div><div><b>${pc(P.sent.neg/cs)}</b><span>of comments negative · ${pc(P.sent.pos/cs)} positive</span></div></div>`}
// one step's block: a summary line that opens into what to fix, what works, who struggles and three voices
function fbStep(p,P,R,k,i,laws,marks){const st=P.steps[k],f=n=>n.toLocaleString("en-ZA"),sh=n=>st.reach?n/st.reach:0,pc=v=>Math.round(v*100)+"%";
 const bad=[],good=[];
 Object.entries(st.CT).sort((a,b)=>b[1]-a[1]).slice(0,3).forEach(([t,n])=>bad.push({t:tagL(t),v:sh(n),d:`${f(n)} people had this problem here.`,fix:TFIX[t],src:"cust"}));
 const S=typeof stuckAt==="function"?stuckAt(p,R,k):null;if(S)S.rows.filter(r=>r.x>0&&r.focus).slice(0,2).forEach(r=>bad.push({t:`The “${r.f.n}” field`,v:null,d:`${(r.sh*100).toFixed(0)}% of the trouble on this step. Most people ${issueL((r.top||["x"])[0],r.f)}.`,fix:r.fix,src:"field"}));
 laws.forEach(x=>x.st==="works"?good.push({t:x.law,d:x.find||x.t}):bad.push({t:x.law,v:null,d:x.find||x.t,fix:x.fix,src:"screens",st:x.st}));
 const ctags=Object.keys(st.CT);Object.entries(st.PT).filter(([t])=>!clash(t,ctags)).sort((a,b)=>b[1]-a[1]).slice(0,3).forEach(([t,n])=>good.unshift({t:tagL(t),d:`${f(n)} people praised this`}));
 const L=R.cust.filter(c=>c.status==="drop"&&c.dropK===k),pcn={},n=R.cust.length;L.forEach(c=>pcn[c.j]=(pcn[c.j]||0)+1);let who=null;
 Object.entries(pcn).forEach(([j,c])=>{const ov=(c/L.length)/Math.max(1e-9,R.perp[+j].n/n);if(c/L.length>=.03&&(!who||ov>who.ov))who={j:+j,ov}});
 const Q=stepQuotes(P,k);PNLC.push(...Q.map((x,qi)=>({x,k,qi})));
 const SRC={cust:"Customers",field:"Field",screens:"Screen review"},q=sh(st.quit),s=Math.max(0,sh(st.str)-q),top=bad[0],pe=who&&who.ov>1.1?p.personas[who.j]:null;
 const item=(x,j)=>`<li><div class="fx-n">${j+1}</div><div class="fx-b"><div class="fx-t"><b>${esc(x.t)}</b><span class="fx-src">${SRC[x.src]}</span>${x.v!=null?`<span class="fx-v">${pc(x.v)}</span>`:""}</div>
  ${x.v!=null?`<div class="fx-bar"><i style="width:${Math.min(100,x.v*100).toFixed(1)}%"></i></div>`:""}<div class="fx-d">${esc(x.d)}</div>${x.fix?`<div class="fx-f"><span>Fix</span>${esc(x.fix)}</div>`:""}</div></li>`;
 return`<details class="fstep${marks.length?" hot":""}"${marks.length?" open":""}><summary class="fs-sum"><span class="fidx">${i+1}</span><div class="fs-m"><div class="fs-t"><b>${esc(st.s.name)}</b>${marks.map(m=>`<span class="chip ymark">${m}</span>`).join("")}</div>
  <div class="fs-top">${top?`Top problem: ${esc(top.t)}${top.v!=null?` · ${pc(top.v)}`:""}`:"No clear problem here"}</div></div>
  <div class="fs-k"><div class="fs-bar" title="Red: quit here. Amber: struggled but carried on."><i class="q" style="width:${(q*100).toFixed(1)}%"></i><i class="s" style="width:${(s*100).toFixed(1)}%"></i></div><div class="fs-nums"><b>${pc(q)}</b> quit · <b>${pc(sh(st.str))}</b> struggled · ${f(st.reach)} reached</div></div><span class="fs-chev" aria-hidden="true"></span></summary>
 <div class="fs-body"><div class="fs-col"><h4>What to fix</h4>${bad.length?`<ol class="fx">${bad.map(item).join("")}</ol>`:'<div class="hint">Nothing stands out here.</div>'}</div>
 <div class="fs-side"><h4>What works</h4>${good.length?good.map(x=>`<div class="fw"><b>✓ ${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join(""):'<div class="hint">Nothing stands out yet.</div>'}
 <h4>Who struggles most</h4>${pe?`<div class="fw who"><b>${esc(pname(pe.name))}</b><span>${esc(pe.name)} · <span title="${esc(OVTIP)}">${who.ov.toFixed(1)}× more likely to leave here than average</span></span></div>`:'<div class="fw who"><span>Nobody stands out. Everyone leaves here at about the same rate.</span></div>'}
 <button class="linkbtn" data-cfk="${k}">Full drop-off story →</button></div></div>
 ${Q.length?`<h4 class="fs-qh">In their words</h4><div class="cfs-qs">${Q.map((x,qi)=>{const o=x.ob;return`<figure data-qk="${k}" data-qi="${qi}">${pavWho(o.who)}<div><blockquote${x.s.byc?' class="byc"':""}>“${esc(x.s.text)}”</blockquote><figcaption><b>${esc(o.who)}, ${o.age}</b> · ${esc(o.pe.name.replace(/^The /,""))}<br>${o.dropped?(o.c.dropK===k?"Quit here":"Quit later"):"Finished"} · rated ${o.rating}/5${o.sayDo?" · played it down":""}</figcaption></div></figure>`}).join("")}</div>`:""}</details>`}
// the kit's LLM brief for one step comment
const DRULE={s:"Keep it short, under 15 words.",m:"Two to four sentences, 20 to 45 words.",r:"Tell it properly, like a small story, 50 to 110 words."},DCAP={s:[2,22],m:[12,60],r:[35,135]};
function pBrief(p,o,s){const B=o.B,I=o.I,P=o.P,F=findOf(p,s.k),felt=F.is.map(x=>x[0]).filter(t=>P.sens.has(t));
 let wh=s.quit?"You gave up here and didn't finish.":s.kind==="neg"||s.kind==="mix"&&s.tag?"You struggled here but got through.":"It went okay for you.";if(felt.length)wh+=" The parts that hit you hardest: "+felt.map(t=>t.replace(/_/g," ")).join(", ")+".";
 const ex=(KBT[F.topic]||[]).filter(b=>b.s===({neg:"N",mix:"U",pos:"P"}[s.kind]||"U")&&b.fits.every(f=>P.t.has(f))&&b.id!==s.bid).sort((a,b)=>b.tags.filter(t=>P.sens.has(t)||F.is.some(x=>x[0]===t)).length-a.tags.filter(t=>P.sens.has(t)||F.is.some(x=>x[0]===t)).length).slice(0,3).map(b=>`- "${kFill(b.text,P,Math.random)}"`).join("\n")||`- "${s.text}"`;
 const T=P.t,life=[T.has("informal")?"Works informally":T.has("salaried")?"Works for a salary":T.has("grant")?"Lives mostly on a grant":"Gets by on what comes in",T.has("parent")?"has children at home":"",T.has("member")?"is in a stokvel":""].filter(Boolean).join(", ");
 const r=P.row,f=n=>Number(n).toLocaleString("en-ZA").replace(/\s/g,",");
 const head=r?`You are ${r.full_name}, ${r.age}, living in a ${r.area_type.toLowerCase()} area in ${r.province}. Home language: ${r.home_language}; your English is ${r.english_comfort.toLowerCase()}. Reading level: ${r.reading_level.toLowerCase()}.
Life: ${r.employment_type}${r.informal_work?` (${r.informal_work.toLowerCase()})`:""}. About R${f(r.personal_income_zar_pm)} a month${r.grants_received?"; you get "+r.grants_received.replace(/;/g,","):""}. ${r.household_size>1?`You live with ${r.household_size-1} other people`:"You live alone"}${r.minor_children?`, including ${r.minor_children} child(ren) under 18`:""}. Phone: ${r.phone_type.toLowerCase()}${r.phone_type==="Smartphone"?`, ${r.device_tier.toLowerCase()} ${r.device_os}`:""}, data: ${r.data_situation.toLowerCase()}. Bank: ${r.primary_bank}.
How you talk: ${r.feedback_style.toLowerCase()}. ${r.politeness_bias==="High"?"You tend to say things were fine even when they weren't.":r.politeness_bias==="Low"?"You say it straight, even if it's harsh.":"You're fairly honest."}`
 :`You are ${o.who}, ${o.age}, living in a ${T.has("rural")?"rural":I?I.set:"township"} area. Home language: ${B.lang}; your English is ${lowS(B.english)}. Reading level: ${lowS(B.reading)}.
Life: ${life}. About R${f(P.inc)} a month${T.has("grant")?"; you get a grant":""}. Phone: ${T.has("feature")?"a feature phone":I?I.dev:"a smartphone"}, data: ${T.has("prepaid")?"prepaid":"wifi or contract"}. Other bank: ${P.other}.
How you talk: ${lowS(P.sty||"plain")}. ${B.polite==="H"?"You tend to say things were fine even when they weren't.":B.polite==="L"?"You say it straight, even if it's harsh.":"You're fairly honest."}`;
 return`${head}

You just tried this step in a banking app: "${p.steps[s.k].name}".
What happened to you there: ${wh}
What the design review found on this step: ${F.is.length?F.is.map(([t,v])=>`${t.replace(/_/g," ")} (severity ${v})`).join(", "):"nothing major"}

Say what you'd say to a researcher who asks "How was that part?"
- ${DRULE[P.depth]}
- Talk like you speak, plain everyday words. A bit of your home language is fine if it's natural for you; don't overdo it.
- Be specific: what you did, what you expected, what actually happened, how it made you feel, and what it cost you (time, data, money, a trip, someone's help). Mention your own life where it matters.
- You may be unsure, a bit unfair, off-topic, or contradict yourself. Don't be balanced or polite for the sake of it.
- Don't suggest a fix unless it just comes out naturally. Never sound like a designer.
- Never use these words: seamless, intuitive, friction, onboarding, journey, flow, UX, UI, navigate, streamline, user-friendly, interface, functionality, frustrating.
- Feeling to come through: ${{neg:"negative",mix:"mixed or flat",pos:"positive"}[s.kind]||"mixed or flat"}.${s.played?" You actually had a worse time than you'll admit, so play it down.":""}

Examples of how people talk about moments like this (for tone only, do not copy them or reuse their details):
${ex}`}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("#pnlAsk");if(!b||!VSAMPLE||!PNLC||!PNLC.length)return;
 const p=cur(),msg=$("pnlMsg"),jobs=PNLC.slice(0,30);b.disabled=true;msg.textContent="Asking… this can take a minute or two.";
 const prompt=`Below are ${jobs.length} briefs. Each one describes a person and a moment in a banking app. Answer each brief exactly as it asks, as that person, keeping to the length it gives.\n\n`+jobs.map((q,n)=>`=== Brief ${n+1} ===\n${pBrief(p,q.x.ob,q.x.s)}`).join("\n\n")+`\n\nReply with only a JSON array of ${jobs.length} strings, one answer per brief in order.`;
 try{const arr=await VSAMPLE.json(prompt,{cache:false});if(!Array.isArray(arr))throw{code:"invalid_json"};let ok=0;
  jobs.forEach((q,n)=>{const t=String(arr[n]||"").trim().replace(/^["“]|["”]$/g,""),w=wc(t),cap=DCAP[q.x.ob.P.depth]||[8,135];if(!t||w<cap[0]||w>cap[1]||BANNED.test(t))return;
   q.x.s.text=t;q.x.s.byc=1;const bq=document.querySelector(`#fcRoot figure[data-qk="${q.k}"][data-qi="${q.qi}"] blockquote`);if(bq){bq.textContent="“"+t+"”";bq.classList.add("byc")}ok++});
  msg.textContent=ok?`Rewritten by Claude: ${ok} of ${jobs.length}. Answers that broke the guide's rules were kept as they were.`:"Claude's answers broke the guide's rules, so the originals were kept."}
 catch(err){msg.textContent=err&&err.code==="not_granted"?"Claude isn't allowed for this page.":err&&err.code==="rate_limited"?"Too many requests. Try again in a minute.":"Couldn't reach Claude. Try again later."}
 finally{b.disabled=false}});
