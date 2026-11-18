
// ===== Test a design: upload screens, order them, say what each one is, and run it as a new account =====
// A design has no data of its own. Each screen type borrows the measured loss for that type from the account it is based on.
let DSG={name:"My new design",base:null,finish:"",screens:[]},BRC={k:"",R:null};
// screen types when a design is tested on its own (any flow, not only account opening), and generic loss per type. Assumptions.
const GREASON={select:[["Didn't see why it matters",.4],["Just looking",.35],["Unclear what happens next",.25]],details:[["Too much to type",.4],["Details not to hand",.3],["Unsure why it's needed",.3]],idcap:[["Camera or glare failure",.45],["Document not to hand",.3],["Phone too slow",.25]],verify:[["OTP not received",.4],["Check failed repeatedly",.35],["Network timeout",.25]],fica:[["File too big or wrong format",.4],["Document not to hand",.35],["Prefers to do it in branch",.25]],decision:[["Answer not what they hoped",.55],["Waiting too long for an answer",.45]],sign:[["Worried about getting it wrong",.4],["Fees or limits surprised them",.35],["Changed mind",.25]],none:[["Lost interest",.5],["Something went wrong",.5]]};
const GLBL={select:"Intro or information",details:"Form or data entry",idcap:"Photo or document capture",verify:"Security or identity check",fica:"Document upload",decision:"Offer or decision",sign:"Review, confirm or sign",none:"Other (choose a type)"},GNET={select:.10,details:.14,idcap:.12,verify:.10,fica:.16,decision:.10,sign:.06,none:.04};
const dLbl=t=>DSG.base?(t==="none"?"Other (choose a type)":TAGLBL[t]):GLBL[t]||TAGLBL[t];
const DTAGS=["select","elig","details","idcap","verify","fica","decision","sign","none"],DKEY="designs:v1";
function baseRun(bp){const k=bp.name+"|"+bp.steps.map(s=>s.net.toFixed(4)).join();if(BRC.k!==k)BRC={k,R:simJ(bp,ZERO(),P)};return BRC.R}
const dBases=()=>PRODUCTS.filter(p=>!p.design);
function guessTag(n){n=n.toLowerCase();
 if(/elig|qualif/.test(n))return"elig";if(/selfie|face|liveness|biometric|verif/.test(n))return"verify";if(/\bid\b|id[-_ ]?(scan|capture|card|doc)|passport|scan/.test(n))return"idcap";
 if(/address|fica|proof|income|payslip|document|upload/.test(n))return"fica";if(/offer|decision|credit|afford|limit|upsell/.test(n))return"decision";
 if(/terms|sign|declar|consent|otp|agree|review|confirm/.test(n))return"sign";if(/detail|personal|profile|contact|about|name|employ|form/.test(n))return"details";
 if(/product|benefit|welcome|landing|intro|start|choose|pricing|home/.test(n))return"select";return"none"}
function typeNet(bp,tag){
 if(tag==="elig")return .03;const of=p=>{const xs=p.steps.filter(s=>s.tag===tag&&!s.post);return xs.length?1-xs.reduce((a,s)=>a*(1-s.net),1):null};
 let v=of(bp);if(v==null){const all=dBases().map(of).filter(x=>x!=null);v=all.length?all.reduce((a,b)=>a+b,0)/all.length:.04}return v}
function buildDesign(d){
 if(!d.base)return buildAlone(d);
 const bp=dBases().find(p=>p.name===d.base)||dBases()[0],cnt={};d.screens.forEach(s=>cnt[s.tag]=(cnt[s.tag]||0)+1);
 const steps=d.screens.map(sc=>{const T=typeNet(bp,sc.tag),m=bp.steps.filter(s=>s.tag===sc.tag&&!s.post),med=m.length?m.reduce((a,s)=>a+s.med,0)/cnt[sc.tag]:1.5;
  return mkStep(sc.n||"Screen",sc.tag,1-Math.pow(1-T,1/cnt[sc.tag]),med,.10,{reasons:REASON_BY_TAG[sc.tag]||GREASON.none})});
 const post=bp.steps.find(s=>s.post);if(post)steps.push(mkStep(post.name,"activate",post.net,0,0,{post:true}));
 const ar=archetypePersonas({name:bp.name,steps},null,false),tot=ar.personas.reduce((a,x)=>a+x.share,0),binel=ar.personas.reduce((a,x)=>a+x.share*(1-x.elig),0)/tot;
 steps.forEach(s=>{if(s.tag==="elig")s.net=binel+(1-binel)*s.net});
 const prod={id:"design_"+d.name,name:"Design: "+d.name,tier:"Design under test",design:true,base:bp.name,src:"template",steps,personas:ar.personas,pm:ar.pm,personaSrc:"assumed",obs:null,months:[],
  facts:["This design has never been live, so nothing here is measured.","Each screen borrows the share of people lost at that type of screen in "+bp.name+" today. If the design has two screens of one type, that loss is split between them. If it drops a type, that loss goes away.","It cannot yet see what is on a screen. A better or worse layout of the same type of screen scores the same until you answer the design review in Flow confidence.","Customers and volumes are the same as "+bp.name+"."]};
 calibrate(prod);return prod}
// a design tested on its own: generic loss per screen type, optionally scaled so the whole flow matches the designer's own estimate
function buildAlone(d){
 const cnt={};d.screens.forEach(s=>{const t=s.tag==="elig"?"none":s.tag;cnt[t]=(cnt[t]||0)+1});
 let nets=d.screens.map(sc=>{const t=sc.tag==="elig"?"none":sc.tag;return 1-Math.pow(1-GNET[t],1/cnt[t])});
 const fin=+d.finish,anchor=fin>0&&fin<100?fin:null;
 if(anchor){let lo=0,hi=40;for(let i=0;i<60;i++){const x=(lo+hi)/2,done=nets.reduce((a,v)=>a*(1-Math.min(.97,v*x)),1);done>anchor/100?lo=x:hi=x}nets=nets.map(v=>Math.min(.97,v*(lo+hi)/2))}
 const steps=d.screens.map((sc,i)=>{const t=sc.tag==="elig"?"none":sc.tag;return mkStep(sc.n||"Screen",t,nets[i],1.5,.10,{reasons:GREASON[t]||GREASON.none})});
 const ar=archetypePersonas({name:"",steps},null,true);
 const prod={id:"design_"+d.name,name:"Design: "+d.name,tier:"Design under test",design:true,standalone:true,anchor,base:null,src:"template",steps,personas:ar.personas,pm:ar.pm,personaSrc:"assumed",obs:null,months:[],
  facts:["This design has never been live and is not compared with a live flow, so nothing here is measured.",anchor?"You estimated that "+anchor+" in 100 people finish this kind of flow today. The loss at each screen is scaled to add up to that.":"Each type of screen uses a generic share of people lost. These are working assumptions, not benchmarks. Enter your own estimate of how many finish today to anchor them.","It cannot yet see what is on a screen. Layout quality enters through the design review in Flow confidence.","Customers are a general mix of the 20 personas."]};
 calibrate(prod);return prod}
function dSave(){try{localStorage.setItem(DKEY,JSON.stringify(DSG))}catch(x){try{localStorage.setItem(DKEY,JSON.stringify(Object.assign({},DSG,{screens:DSG.screens.map(s=>({n:s.n,tag:s.tag}))})))}catch(y){}}}
function dLoad(){try{const v=JSON.parse(localStorage.getItem(DKEY)||"null");if(v&&Array.isArray(v.screens))DSG=v}catch(x){}}
function flowEvid(R,p){const keep=FANS;FANS={};const v=Math.round(flowScore(flowAuto(R,p)).now.score);FANS=keep;return v}
function dProd(){return PRODUCTS.find(p=>p.design&&p.name==="Design: "+DSG.name)}
function drawDesign(){
 const el=$("dzRoot");if(!el)return;const bases=dBases();if(DSG.base==null)DSG.base=cur().design?(cur().base||""):cur().name;if(DSG.base&&!bases.find(p=>p.name===DSG.base))DSG.base="";const alone=!DSG.base;
 const N=DSG.screens.length,none=DSG.screens.filter(s=>s.tag==="none").length;
 let h=`<div class="card"><h2>Test a design</h2><p class="lead">Upload the screens of a new flow, put them in order and say what each one is. The simulator runs it before any customer sees it, on its own or against one of today's flows.</p>
 <div class="ctlgrid"><div class="ctlbox"><div class="ctl-l">Name of this design</div><input type="text" id="dName" class="selw" style="background-image:none;padding-right:12px" value="${esc(DSG.name)}"></div>
 <div class="ctlbox"><div class="ctl-l">Compare it with</div><select id="dBase" class="selw"><option value="" ${alone?"selected":""}>Nothing. Test it on its own</option>${bases.map(p=>`<option value="${esc(p.name)}" ${p.name===DSG.base?"selected":""}>${esc(p.name)}</option>`).join("")}</select><div class="hint">${alone?"For any flow, such as payments or servicing. Drop-off uses generic defaults for each type of screen.":"Today's flow. The design borrows its customers, volumes and drop-off by screen type."}</div></div>
 ${alone?`<div class="ctlbox" style="grid-column:1/-1"><div class="ctl-l">How many people finish this kind of flow today? <span style="font-weight:400;color:var(--mut)">Optional</span></div><div class="inw"><input type="number" id="dFin" min="1" max="99" step="1" value="${esc(String(DSG.finish||""))}" placeholder="e.g. 70"><span class="unit">in 100</span></div><div class="hint">If you know it, the prediction is scaled to match. If you leave it empty, generic defaults are used.</div></div>`:""}</div>
 <label class="dzdrop" id="dDrop"><input type="file" id="dFile" accept="image/*" multiple hidden><b>Drop screen images here, or choose files</b><span>PNG or JPG, exported from Figma in flow order. Images stay in this browser.</span></label>
 ${N?`<div class="dzgrid">${DSG.screens.map((s,i)=>`<div class="dzc"><div class="dzimg">${s.img?`<img src="${s.img}" alt="">`:`<span>No image</span>`}<em>${i+1}</em></div>
  <input type="text" data-dn="${i}" value="${esc(s.n)}" aria-label="Screen name">
  <select data-dt="${i}" aria-label="Screen type" class="${s.tag==="none"?"warn":""}">${DTAGS.filter(t=>!alone||t!=="elig").map(t=>`<option value="${t}" ${t===s.tag?"selected":""}>${dLbl(t)}</option>`).join("")}</select>
  <div class="dzbtn"><button data-dz="l" data-i="${i}" ${i?"":"disabled"} aria-label="Move earlier">←</button><button data-dz="r" data-i="${i}" ${i<N-1?"":"disabled"} aria-label="Move later">→</button><button data-dz="x" data-i="${i}" aria-label="Remove">Remove</button></div></div>`).join("")}</div>`:""}
 <div class="foot"><button id="dTest" ${N?"":"disabled"} class="${N?"on":""}">Test this design</button><button id="dAdd" class="linkbtn">Add a screen without an image</button>${N?'<button id="dClear" class="linkbtn">Start again</button>':""}</div>
 ${none?`<div class="hint" style="margin-top:8px">${none} ${none>1?"screens have":"screen has"} no type yet. Untyped screens get a small default loss, so pick a type for a better prediction.</div>`:""}</div>`;
 const dp=dProd();
 if(dp&&dp.standalone){const RD=cur()===dp?BASE:simJ(dp,ZERO(),P),nn=RD.cust.length,od=RD.doneN/nn*100,L=dp.steps.map((s,k)=>({s,w:RD.fail[k]/nn*100,r:RD.att[k]>0?RD.fail[k]/RD.att[k]:0})).sort((a,b)=>b.w-a.w),ed=flowEvid(RD,dp);
  h+=`<div class="card"><h2>Result <span class="chip ass">PREDICTED, NOT MEASURED</span></h2><p class="lead">${esc(DSG.name)} is predicted to see <b style="color:var(--ink)">${od.toFixed(0)} in every 100</b> people finish.</p>
  <div class="fpill" style="grid-template-columns:repeat(3,1fr)"><div class="fp"><div class="fp-n">People who finish, per 100</div><div class="fp-s" style="color:var(--blue)">${od.toFixed(0)}</div><div class="fp-q">${dp.anchor?"Scaled to your estimate of "+dp.anchor+" in 100.":"From generic defaults for each type of screen."}</div></div>
  <div class="fp"><div class="fp-n">Biggest leak</div><div class="fp-s" style="font-size:20px;line-height:1.5">${esc(L[0].s.name)}</div><div class="fp-q">${L[0].w.toFixed(0)} of every 100 who start leave here.</div></div>
  <div class="fp"><div class="fp-n">Flow confidence, evidence only</div><div class="fp-s" style="color:${fcol(ed)}">${ed}</div><div class="fp-q">Before the design review. Answer it in Flow confidence.</div></div></div>
  <div class="hint" style="margin-top:10px">With nothing to compare against, the number of people who finish is ${dp.anchor?"your estimate":"a generic assumption"}. What the tool adds is where they are likely to leave, which customers struggle, and the Flow confidence checks. It cannot see the layout of a screen.</div>
  <div class="foot"><button id="dGo" class="on">Open the full Summary for this design</button><button class="linkbtn" id="dGoF">Do the design review</button></div></div>`}
 else if(dp){const bp=bases.find(p=>p.name===dp.base)||bases[0],RB=baseRun(bp),RD=cur()===dp?BASE:simJ(dp,ZERO(),P),ob=RB.openN/RB.cust.length*100,od=RD.openN/RD.cust.length*100,d=od-ob;
  const ct=p=>{const o={};p.steps.forEach(s=>{if(!s.post)o[s.tag]=(o[s.tag]||0)+1});return o},cb=ct(bp),cd=ct(dp),ch=[];
  DTAGS.filter(t=>t!=="none").forEach(t=>{const a=cb[t]||0,b=cd[t]||0;if(a&&!b)ch.push(`<b>${TAGLBL[t]}</b> is gone, so nobody is lost there.`);else if(!a&&b)ch.push(`<b>${TAGLBL[t]}</b> is new. Its loss is borrowed from the other accounts.`);else if(a!==b)ch.push(`<b>${TAGLBL[t]}</b> goes from ${a} ${a>1?"screens":"screen"} to ${b}. The same loss is spread over them.`)});
  const nb=bp.steps.filter(s=>!s.post).length,nd=dp.steps.filter(s=>!s.post).length,eb=flowEvid(RB,bp),ed=flowEvid(RD,dp);
  h+=`<div class="card"><h2>Result <span class="chip ass">PREDICTED, NOT MEASURED</span></h2><p class="lead">${esc(DSG.name)} is predicted to open <b style="color:var(--ink)">${od.toFixed(0)} accounts in every 100</b>, against ${ob.toFixed(0)} for ${esc(bp.name)} today.</p>
  <div class="fpill" style="grid-template-columns:repeat(3,1fr)"><div class="fp"><div class="fp-n">Accounts opened per 100</div><div class="fp-s">${ob.toFixed(0)} <span style="color:var(--mut)">→</span> <span style="color:${d>=0?"var(--blue)":"var(--red)"}">${od.toFixed(0)}</span></div><div class="fp-q">${Math.abs(d)<.5?"About the same as today.":(d>0?"+":"−")+Math.abs(d).toFixed(0)+" against today."}</div></div>
  <div class="fp"><div class="fp-n">Screens before the account opens</div><div class="fp-s">${nb} <span style="color:var(--mut)">→</span> ${nd}</div><div class="fp-q">${nd<nb?"Shorter than today.":nd>nb?"Longer than today.":"Same length as today."}</div></div>
  <div class="fp"><div class="fp-n">Flow confidence, evidence only</div><div class="fp-s">${eb} <span style="color:var(--mut)">→</span> <span style="color:${fcol(ed)}">${ed}</span></div><div class="fp-q">Before the design review. Answer it in Flow confidence.</div></div></div>
  <h3 class="fh3">What is different from today</h3>${ch.length?`<ul class="notesul" style="font-size:14.5px">${ch.map(x=>`<li>${x}</li>`).join("")}</ul>`:`<p class="ff" style="font-size:14.5px;margin-top:8px">The same types of screen as today, so the prediction matches today. The difference will come from the design review.</p>`}
  <div class="hint" style="margin-top:10px">The prediction only knows which types of screen the design has and in what order. It cannot see the layout, so two designs with the same screen types score the same here.</div>
  <div class="foot"><button id="dGo" class="on">Open the full Summary for this design</button><button class="linkbtn" id="dGoF">Do the design review</button></div></div>`}
 el.innerHTML=h;goalSwap(el);
}
function dAddFiles(files){
 const list=[...files].filter(f=>/^image\//.test(f.type)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));let left=list.length;if(!left)return;
 const out=[];list.forEach((file,i)=>{const nm=file.name.replace(/\.[a-z0-9]+$/i,"").replace(/[_-]+/g," ").replace(/^\d+\s*/,"").trim()||"Screen "+(i+1);
  const done=img=>{out[i]={n:nm,tag:guessTag(nm),img};if(--left===0){DSG.screens.push(...out);dSave();drawDesign()}};
  const fr=new FileReader();fr.onerror=()=>done("");fr.onload=()=>{const im=new Image();im.onerror=()=>done("");im.onload=()=>{try{const w=200,c=document.createElement("canvas");c.width=w;c.height=Math.round(im.height/im.width*w);c.getContext("2d").drawImage(im,0,0,c.width,c.height);done(c.toDataURL("image/jpeg",.72))}catch(x){done("")}};im.src=fr.result};fr.readAsDataURL(file)})}
function dTest(){
 if(!DSG.screens.length)return;DSG.name=(DSG.name||"").trim()||"My new design";const prod=buildDesign(DSG),i=PRODUCTS.findIndex(p=>p.design&&p.name===prod.name);
 if(i>=0)PRODUCTS[i]=prod;else PRODUCTS.push(prod);SEL=PRODUCTS.indexOf(prod);selStep=0;resetChanges();drawAll();dSave();drawDesign();
 const c=$("dzRoot").querySelectorAll(".card")[1];if(c&&c.scrollIntoView)c.scrollIntoView({behavior:"smooth",block:"start"})}
document.addEventListener("change",e=>{const t=e.target;if(!t||!t.closest||!t.closest("#dzRoot"))return;
 if(t.id==="dFile"){dAddFiles(t.files);t.value=""}else if(t.id==="dName"){DSG.name=t.value;dSave()}else if(t.id==="dBase"){DSG.base=t.value;dSave();drawDesign()}else if(t.id==="dFin"){DSG.finish=t.value;dSave()}
 else if(t.dataset.dn!=null){DSG.screens[+t.dataset.dn].n=t.value;dSave()}else if(t.dataset.dt!=null){DSG.screens[+t.dataset.dt].tag=t.value;dSave();drawDesign()}});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#dzRoot button");if(!b)return;const i=+b.dataset.i,S=DSG.screens;
 if(b.dataset.dz==="l"&&i>0){[S[i-1],S[i]]=[S[i],S[i-1]]}else if(b.dataset.dz==="r"&&i<S.length-1){[S[i+1],S[i]]=[S[i],S[i+1]]}else if(b.dataset.dz==="x"){S.splice(i,1)}
 else if(b.id==="dAdd"){S.push({n:"Screen "+(S.length+1),tag:"none",img:""})}else if(b.id==="dClear"){DSG.screens=[]}
 else if(b.id==="dTest"){dTest();return}else if(b.id==="dGo"||b.id==="dGoF"){const dp=dProd();if(dp){const s=$("jSel");SEL=PRODUCTS.indexOf(dp);s.value=SEL;selStep=0;resetChanges();drawAll()}$(b.id==="dGo"?"tbS":"tbF").click();window.scrollTo&&window.scrollTo(0,0);return}
 else return;dSave();drawDesign()});
["dragover","drop"].forEach(ev=>document.addEventListener(ev,e=>{const z=e.target.closest&&e.target.closest("#dDrop");if(!z)return;e.preventDefault();if(ev==="drop"&&e.dataTransfer)dAddFiles(e.dataTransfer.files)}));
dLoad();drawDesign();
