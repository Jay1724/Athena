// offline_review.js: Athena Offline's review engine. No AI: you describe each screen in a short form, and fixed,
// visible rules turn that into design-law verdicts, problem tags with a severity, and strengths. The result is stored
// exactly like a screen review, so the 10,000 personas, the stuck fields and the step blocks all use it.
// For a future flow (Test a design), it also moves each step's predicted drop-off: worse than a typical screen of
// that kind loses more people, better loses fewer. Flows calibrated to your data keep your data's numbers.
var ORV={},ORVK="",OROPEN=null;
const JARGON=["source of funds","source of income","tax residency","tax number","fica","kyc","know your customer","debit order","mandate","beneficiary","liveness","biometric","marital regime","in community of property","antenuptial","nominated","remuneration","gross","nett","net income","verification","authenticate","authorise","affordability","credit bureau","credit check","popia","aml","anti-money laundering","sanctions","politically exposed","pep","fatca","crs","domicile","residential status","indemnity","waiver","juristic","signatory","proof of residence","debicheck","otp","one-time pin","biometrics","consent to","terms and conditions","t&cs","statement of account","overdraft facility","revolving","provisional","pending verification"];
const FKIND=[["otp",/otp|one-?time|pin sent|verification code/i],["camera",/selfie|photo|picture|scan|camera|liveness/i],["upload",/upload|attach|document|statement|payslip|proof/i],["id",/\bid\b|id number|identity number|passport/i],["phone",/cell|phone|mobile/i],["email",/e-?mail/i],["money",/income|salary|amount|rand|\bzar\b|expenses|earn/i],["date",/date|birth|dob/i],["address",/address|street|suburb|postal|code/i],["consent",/agree|accept|terms|consent|declare/i],["choice",/select|choose|option|type of|which/i]];
const DOCS={none:"No documents",address:"Proof of address",income:"Proof of income",id:"An ID document or card",several:"Several documents"};
const OFLAGS=[["upfront","Says up front what people need and how long it takes"],["progress","Shows how far along they are"],["why","Explains why each detail is needed"],["fees","Shows fees or costs before asking for commitment"],["prefill","Fills in what the bank already knows"],["example","Shows an example of the format (ID, phone, dates)"],["errhelp","Errors say what went wrong and how to fix it"],["save","Lets people stop and pick up where they left off"],["help","Offers a person to help (chat or call)"],["alt","Offers another way (a declaration instead of a document, an upload instead of a live photo)"],["resend","For codes: a resend timer and another way to receive it"],["oneMain","Has one clear main button, within thumb reach"],["light","Light on data: no big images, video or downloads"],["confirm","Says clearly what happens next"]];
function orvKey(p){return"orv:v1:"+p.name}
function orvLoad(p){const k=orvKey(p);if(k===ORVK)return;ORVK=k;try{ORV=JSON.parse(localStorage.getItem(k)||"null")||{steps:{}}}catch(e){ORV={steps:{}}}}
function orvSave(p){try{localStorage.setItem(orvKey(p),JSON.stringify(ORV))}catch(e){}}
// a starting point for each kind of step, to edit rather than fill from blank
const ODEF={select:{fields:"",options:4,docs:"none",flags:["oneMain"]},elig:{fields:"Age\nSA citizen or resident",options:2,docs:"none",flags:["oneMain"]},
 details:{fields:"First name\nSurname\nSA ID number\nCellphone number\nEmail address\nGross monthly income\nSource of funds",options:0,docs:"none",flags:["oneMain"]},
 idcap:{fields:"Photo of ID card front\nPhoto of ID card back",options:0,docs:"id",flags:["oneMain"]},verify:{fields:"Selfie\nLiveness check",options:0,docs:"none",flags:[]},
 fica:{fields:"Residential address\nUpload proof of address",options:0,docs:"address",flags:[]},decision:{fields:"",options:0,docs:"none",flags:[]},
 sign:{fields:"I accept the terms and conditions\nOTP code",options:0,docs:"none",flags:["oneMain"]},activate:{fields:"",options:0,docs:"none",flags:["confirm"]},none:{fields:"",options:0,docs:"none",flags:[]}};
function specOf(p,s){orvLoad(p);return ORV.steps[s.name]||Object.assign({words:"",flags:[]},JSON.parse(JSON.stringify(ODEF[s.tag]||ODEF.none)),{auto:1})}

// ---------- the rules ----------
function fieldsOf(sp){return String(sp.fields||"").split(/\n+/).map(x=>x.trim()).filter(Boolean).map(n=>{const k=(FKIND.find(x=>x[1].test(n))||[0,0])[0]||"text",lo=n.toLowerCase();
 return{n:n.slice(0,60),k,j:JARGON.some(w=>lo.includes(w))?1:0,h:sp.flags.includes("example")?1:0,f:/id|phone|date|code/.test(k)&&!sp.flags.includes("example")?1:0,p:sp.flags.includes("prefill")?1:0,l:0}})}
function wordsCheck(text){const t=String(text||"").trim();if(!t)return{jar:[],avg:0,long:0,n:0};const lo=t.toLowerCase(),jar=JARGON.filter(w=>lo.includes(w));
 const sen=t.split(/[.!?\n]+/).map(x=>x.trim()).filter(x=>x.split(/\s+/).length>2),w=t.split(/\s+/).filter(Boolean);
 return{jar,avg:sen.length?w.length/sen.length:0,long:w.filter(x=>x.replace(/[^a-z]/gi,"").length>=12).length/Math.max(1,w.length),n:w.length}}
function reviewStep(p,s,k,spx){const sp=spx||specOf(p,s),F=fieldsOf(sp),fl=t=>sp.flags.includes(t),kinds=new Set(F.map(x=>x.k)),W=wordsCheck(sp.words+"\n"+sp.fields);
 const is={},gd=new Set(),add=(t,v)=>{is[t]=Math.max(is[t]||0,v)},why=[];
 const n=F.length,opt=+sp.options||0,sens=["idcap","verify","fica","details","decision"].includes(s.tag)||kinds.has("id")||kinds.has("money")||kinds.has("camera");
 if(n>7){add("too_many_steps",2);why.push(`${n} things to fill in on one screen`)}else if(n>5)add("cluttered",1);
 if(opt>6){add("cluttered",2);why.push(`${opt} options to choose from`)}else if(opt>4)add("cluttered",1);
 if((kinds.has("id")||kinds.has("phone")||kinds.has("date"))&&!fl("example"))add("error_unclear",1);
 if(n>=3&&!fl("prefill")&&[...kinds].some(x=>["text","id","address","phone","email","date"].includes(x)))add("retype",2);
 if(sp.docs==="address")add("doc_burden",fl("alt")?2:3);else if(sp.docs==="income")add("doc_burden",fl("alt")?1:2);else if(sp.docs==="several")add("doc_burden",3);else if(sp.docs==="id"&&!fl("alt"))add("old_id",1);
 if(sp.docs!=="none"&&!fl("upfront"))add("hidden_info",1);
 if(kinds.has("camera")){add("camera_fail",fl("alt")&&fl("errhelp")?1:2);if(!fl("help"))add("lighting",1)}
 if(kinds.has("upload")&&!fl("light"))add("data_heavy",1);
 if(kinds.has("otp")){add("otp_fail",fl("resend")?1:2);if(!fl("resend"))add("otp_confusing",1)}
 if(kinds.has("consent")&&W.n>150)add("too_much_info",2);if(kinds.has("consent")&&!fl("why"))add("forced_consent",1);
 if(W.jar.length){add("jargon",Math.min(3,W.jar.length));why.push(`bank terms: ${W.jar.slice(0,3).join(", ")}`)}
 if(W.avg>20||W.long>.15)add("unclear_words",1);
 if(sens&&!fl("why")){add("trust_doubt",2);if(["idcap","verify"].includes(s.tag))add("scam_fear",1)}
 if((s.tag==="select"||s.tag==="sign")&&!fl("fees"))add("fees_unclear",2);
 if(!fl("save")&&(sp.docs!=="none"||kinds.has("camera")||n>5))add("lost_progress",1);
 if(!fl("help")&&(sp.docs!=="none"||kinds.has("camera")||s.tag==="verify"))add("no_human",1);
 if(!fl("errhelp")&&(n>0||kinds.has("camera")))add("error_unclear",1);
 if(!fl("oneMain")&&!s.post)add("navigation",1);
 if(!fl("light")&&(kinds.has("camera")||kinds.has("upload")))add("data_heavy",1);
 if(s.post&&!fl("confirm"))add("confirmation_missing",2);
 // strengths
 if(fl("prefill"))gd.add("autofill");if(fl("save"))gd.add("saved_progress");if(fl("errhelp"))gd.add("good_errors");if(fl("fees"))gd.add("fee_upfront");if(fl("alt")&&sp.docs!=="none")gd.add("doc_alternative");
 if(fl("why")&&sens)gd.add("feels_safe");if(fl("help"))gd.add("helpful_help");if(fl("example"))gd.add("examples");if(fl("confirm"))gd.add("confirmation_clear");if(fl("light"))gd.add("data_free");
 const sev=Object.values(is).reduce((a,v)=>a+v,0);if(n<=3&&opt<=4&&!W.jar.length&&sev<=2)gd.add("simple");if(kinds.has("camera")&&fl("help")&&fl("errhelp"))gd.add("guided");
 const I=Object.entries(is),G=[...gd].filter(g=>!clash(g,I.map(x=>x[0])));
 return{n:k+1,step:s.name,topic:(TFIND[s.tag]||TFIND.none)[0],fields:F,is:I.map(([t,v])=>({t,s:v})),gd:G,sp,why,W,kinds:[...kinds],opt}}
// law verdicts from all the screens
function lawsOf(p,R){const L={},put=(id,st,find,fix,scr)=>{L[id]={st,find,fix:fix||(FQ.find(q=>q[0]===id)||[])[4]||"",scr:scr||[]}},nm=r=>`screen ${r.n} (${r.step})`,lst=a=>a.slice(0,3).map(nm).join(", ")+(a.length>3?` and ${a.length-3} more`:"");
 const judge=(id,bad,part,okTxt,badTxt,partTxt)=>{if(bad.length)put(id,"needs work",badTxt+" "+lst(bad)+".",null,bad.map(r=>r.n));else if(part.length)put(id,"partly",partTxt+" "+lst(part)+".",null,part.map(r=>r.n));else put(id,"works",okTxt)};
 const has=(r,t)=>r.sp.flags.includes(t),inp=R.filter(r=>r.fields.length);
 judge("hick",R.filter(r=>r.opt>6),R.filter(r=>r.opt>4&&r.opt<=6),"No screen offers more than four options.","Too many options on","Five or six options on");
 judge("miller",R.filter(r=>r.fields.length>7),R.filter(r=>r.fields.length>5&&r.fields.length<=7),"No screen asks for more than five things.","More than seven things to fill in on","Six or seven things to fill in on");
 judge("tesler",R.filter(r=>r.fields.length>=3&&!has(r,"prefill")),[],"Known details are filled in for people.","People retype what the bank may already know on","");
 judge("postel",R.filter(r=>r.kinds.some(k=>["id","phone","date"].includes(k))&&!has(r,"example")),[],"Format-sensitive fields show an example.","ID, phone or date fields without an example on","");
 judge("plain",R.filter(r=>r.W.jar.length>=2),R.filter(r=>r.W.jar.length===1||r.W.avg>20),"No bank jargon found in the words you gave.","Bank terms on","One bank term or long sentences on");
 judge("gradient",R.filter(r=>!r.sp.auto&&!has(r,"progress")),[],"Every screen shows how far along people are.","No progress shown on","");
 judge("zeigarnik",R.filter(r=>(r.sp.docs!=="none"||r.kinds.includes("camera"))&&!has(r,"save")),R.filter(r=>r.fields.length>5&&!has(r,"save")),"People can stop and come back where it matters.","People can't save and return on","Long forms with no save on");
 judge("expect",R.slice(0,1).filter(r=>!has(r,"upfront")),[],"The first screen says what people need and how long it takes.","Nothing up front about what people need, on","");
 judge("idwhy",R.filter(r=>["idcap","verify"].includes(p.steps[r.n-1].tag)&&(!has(r,"why")||!has(r,"errhelp"))),[],"The identity steps explain why and what to do if they fail.","The identity check doesn't explain why, or what to do if it fails, on","");
 const last=R[R.length-1];judge("peak",last&&!has(last,"confirm")?[last]:[],[],"The flow ends by saying clearly what happens next.","No clear ending on","");
 judge("fees",R.filter(r=>["select","sign"].includes(p.steps[r.n-1].tag)&&!has(r,"fees")),[],"Fees are shown before people commit.","Fees not shown before commitment on","");
 judge("perm",R.filter(r=>r.kinds.some(k=>["camera","upload"].includes(k))&&!has(r,"why")),[],"Camera and upload requests say why.","Camera or upload requests without a reason on","");
 judge("errors",inp.filter(r=>!has(r,"errhelp")),[],"Errors say what went wrong and how to fix it.","Error help not confirmed on","");
 judge("human",R.filter(r=>(r.sp.docs!=="none"||r.kinds.includes("camera")||p.steps[r.n-1].tag==="verify")&&!has(r,"help")),[],"Hard steps offer a person to help.","No route to a person on","");
 judge("inclusive",R.filter(r=>(r.kinds.includes("camera")||r.kinds.includes("upload"))&&!has(r,"light")),R.filter(r=>!has(r,"oneMain")),"Light on data with one clear button per screen.","Data-heavy capture on","No single clear main button on");
 judge("restorff",[],R.filter(r=>!has(r,"oneMain")),"Each screen has one main action.","","No single main action on");judge("fitts",[],R.filter(r=>!has(r,"oneMain")),"The main button is clear on every screen.","","Main button not confirmed on");
 ["jakob","proximity","doherty","named","value"].forEach(id=>put(id,"can't tell","The offline review can't judge this from a description. Check it on the real screens or in a prototype."));
 return L}
function runOReview(p){const R=p.steps.map((s,k)=>reviewStep(p,s,k));const v={at:Date.now(),n:R.length,laws:lawsOf(p,R),screens:R.map(r=>({n:r.n,step:r.step,topic:r.topic,fields:r.fields,is:r.is,gd:r.gd})),offline:1};
 setReview(v,true);if(p.design)applyReviewToDesign(p,R);if(typeof PNL!=="undefined")PNL.k=null;return{R,v}}
// for a future flow: each screen is scored against a typical screen of its kind (the starting answers). Better loses fewer
// people, worse loses more: about 10% per severity point, never more than double or less than half
function applyReviewToDesign(p,R){const sc=r=>r.is.reduce((a,x)=>a+x.s,0)-.5*r.gd.length;p.steps.forEach((s,k)=>{if(s.post)return;if(s.net0==null)s.net0=s.net;
 const ref=sc(reviewStep(p,s,k,Object.assign({words:"",flags:[]},JSON.parse(JSON.stringify(ODEF[s.tag]||ODEF.none))))),m=Math.min(2,Math.max(.5,Math.exp(.1*(sc(R[k])-ref))));
 s.net=clampJ(s.net0*m,.002,.95)});calibrate(p)}

// ---------- the form ----------
function oreviewHtml(p){orvLoad(p);const done=FREV&&FREV.offline;
 return`<div class="orv"><div class="frev-t"><b>Offline screen review</b> <span class="hint" style="margin:0">${done?`Reviewed ${new Date(FREV.at).toLocaleDateString("en-ZA")}. Its findings are in each step below.`:"Describe each screen and Athena checks it against the design laws, then sends all 10,000 personas through it. No internet or AI needed."}</span></div>
 <div class="orv-steps">${p.steps.map((s,k)=>{const sp=specOf(p,s),open=OROPEN===k;return`<details class="orv-s"${open?" open":""} data-orvk="${k}"><summary><span class="fidx">${k+1}</span><b>${esc(s.name)}</b><span class="hint" style="margin:0 0 0 auto">${sp.auto?"Typical answers, not yet checked":"Described"}</span></summary>
  <div class="orv-f"><label>What does the screen ask for? <span>One per line, as labelled on the screen</span><textarea data-orv="fields" rows="4" placeholder="SA ID number&#10;Cellphone number">${esc(sp.fields||"")}</textarea></label>
  <div class="orv-2"><label>Options to choose from <span>If the screen asks people to pick one</span><input type="number" min="0" max="30" data-orv="options" value="${+sp.options||0}"></label>
  <label>Documents asked for<select data-orv="docs">${Object.entries(DOCS).map(([v,l])=>`<option value="${v}" ${sp.docs===v?"selected":""}>${l}</option>`).join("")}</select></label></div>
  <label>Other words on the screen <span>Headings, help text, buttons. Used to find bank jargon and long sentences</span><textarea data-orv="words" rows="3">${esc(sp.words||"")}</textarea></label>
  <div class="orv-fl">${OFLAGS.map(([id,l])=>`<label class="tg"><input type="checkbox" data-orvf="${id}" ${sp.flags.includes(id)?"checked":""}> ${l}</label>`).join("")}</div></div></details>`}).join("")}</div>
 <div class="btns" style="margin-top:12px"><button id="orvRun" class="on">Run the review</button>${done?'<button class="linkbtn" id="orvClear">Clear the review</button>':""}<span class="hint" id="orvMsg" style="margin:0"></span></div>
 <div class="note" style="margin-top:10px">The rules are fixed and visible: for example, more than seven things to fill in on one screen, or a proof-of-address upload with no other way, counts against the screen. ${p.design?"For this future flow, screens better than a typical screen of their kind lose fewer people in the prediction, and worse ones lose more.":"This flow is calibrated to real numbers, so the review shapes the feedback, not the drop-off figures."}</div></div>`}
function orvField(el){const p=cur(),d=el.closest("[data-orvk]");if(!d)return;const s=p.steps[+d.dataset.orvk];orvLoad(p);const sp=ORV.steps[s.name]||(ORV.steps[s.name]=(()=>{const x=specOf(p,s);delete x.auto;return x})());delete sp.auto;
 if(el.dataset.orv)sp[el.dataset.orv]=el.type==="number"?+el.value:el.value;else if(el.dataset.orvf){const f=el.dataset.orvf;sp.flags=sp.flags.filter(x=>x!==f);if(el.checked)sp.flags.push(f)}orvSave(p);OROPEN=+d.dataset.orvk}
document.addEventListener("input",e=>{if(e.target.closest&&e.target.closest(".orv-f"))orvField(e.target)});
document.addEventListener("change",e=>{if(e.target.closest&&e.target.closest(".orv-f"))orvField(e.target)});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button");if(!b)return;const p=cur();
 if(b.id==="orvRun"){const {R}=runOReview(p),nI=R.reduce((a,r)=>a+r.is.length,0),nG=R.reduce((a,r)=>a+r.gd.length,0);if(p.design&&typeof run==="function")run();drawFlow();const m=$("orvMsg");if(m)m.textContent=`Reviewed ${R.length} screens: ${nI} problems and ${nG} strengths found. The steps below now use them.`}
 else if(b.id==="orvClear"){FREV=null;FANS={};try{localStorage.removeItem(FKEY)}catch(x){}p.steps.forEach(s=>{if(s.net0!=null){s.net=s.net0;delete s.net0}});if(p.design){calibrate(p);if(typeof run==="function")run()}if(typeof PNL!=="undefined")PNL.k=null;drawFlow()}});
// show the offline review where the Claude review would be
if(typeof drawFlow==="function"){const _dF=drawFlow;drawFlow=function(){_dF();try{const fr=document.querySelector("#fcRoot .frev");if(fr)fr.outerHTML=oreviewHtml(cur());}catch(e){}};if(typeof FLOW_READY!=="undefined"&&FLOW_READY)drawFlow()}
