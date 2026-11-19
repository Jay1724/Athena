// offline_accounts.js: the account list of Athena Offline. It starts from the four Standard Bank accounts and can be
// edited (when the bank changes an account) or added to (a new account), all without internet. Changes are saved in
// this browser and shared as an "accounts update" file that colleagues load into their copy.
var OACC=null,ACCED=null,AMSG="";
const MIXL=["Entry (like MyMo)","Mid (like Achieva)","Premium (like Prestige)"];
const ACC_LOSS={select:.38,elig:.03,details:.27,idcap:.14,verify:.21,fica:.26,decision:.14,sign:.07,activate:.45,none:.10};
const ACC_MED={select:1,elig:1,details:3,idcap:2,verify:2.5,fica:6,decision:1,sign:2,activate:0,none:2};
const ACC_RES={select:.10,elig:.05,details:.10,idcap:.12,verify:.12,fica:.20,decision:.05,sign:.12,activate:0,none:.10};
const ACC_FEE={sb_mymo:"",sb_mymoplus:"",sb_achieva:"",sb_prestige:"R250 a month (check the current pricing guide)"};
function accDefaults(){return libraryProducts().map((lp,i)=>{const M=MOCK[lp.id];return{id:lp.id,name:lp.name,tier:lp.tier,mix:/prestige/i.test(lp.name)?2:/achieva/i.test(lp.name)?1:0,
 fee:ACC_FEE[lp.id]||"",facts:lp.facts.slice(),starts:M[0],trend:M[1],builtin:1,seed:i,
 steps:lp.steps.map(s=>({name:s.name,tag:s.tag,loss:s.post?M[3]:(M[2][s.tag]??.1),med:s.med,resume:s.resume}))}})}
function accList(){return(OACC&&OACC.list)||accDefaults()}
function accFor(name){const n=String(name).trim().toLowerCase();return accList().find(a=>!a.hidden&&a.name.trim().toLowerCase()===n)}
function accSame(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function accStatus(a){if(a.hidden)return["Hidden","info"];if(!a.builtin)return["New","calc"];const d=accDefaults().find(x=>x.id===a.id);return d&&!accSame(d,a)?["Edited","part"]:["As on the bank's site","ok"]}
async function saveAcc(){try{await IDB.put("accounts",JSON.parse(JSON.stringify(OACC)));return true}catch(e){return false}}
async function loadAcc(){try{const v=await IDB.get("accounts");if(v&&v.list){OACC=v;return true}}catch(e){}return false}
function accTouch(what){if(!OACC)OACC={v:0,at:null,by:"",list:accDefaults(),log:[]};OACC.v++;OACC.at=new Date().toISOString();(OACC.log=OACC.log||[]).unshift({v:OACC.v,at:OACC.at,by:OACC.by||"",what});OACC.log=OACC.log.slice(0,40)}
function hashStr(s){let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h}

// mock numbers for one account, made the same way as the original four (same seeds, so they don't change)
function accProduct(a){const steps=a.steps.map(s=>mkStep(s.name,s.tag,s.loss,s.med,s.resume,{post:s.tag==="activate",reasons:REASON_BY_TAG[s.tag]||null}));
 const lp={id:a.id,name:a.name,tier:a.tier,mix:a.mix,steps},seed=a.seed!=null?a.seed:hashStr(a.id)%997,rnd=mulberry(9001+seed*77),z=()=>norm(rnd(),rnd());
 const ar0=archetypePersonas(lp,null,false),tot=ar0.personas.reduce((x,y)=>x+y.share,0),binel=ar0.personas.reduce((x,y)=>x+y.share*(1-y.elig),0)/tot;
 const pre=steps.filter(s=>!s.post),post=steps.find(s=>s.post),pr={order:steps.map(s=>s.name),no:{},months:MO.slice(),personas:[],rows:[]},tags={},posts={};
 steps.forEach(s=>{tags[s.name]=s.tag;posts[s.name]=!!s.post});const opened=[],active=[],unused=post?a.steps[a.steps.length-1].loss:0;
 MO.forEach((mo,m)=>{let e=Math.round(a.starts*(1+a.trend*m)*(1+.05*z()));
  pre.forEach(s=>{let d=s.net||.1;if(s.tag==="elig")d=binel+(1-binel)*d;d=clampJ(d*(1+.04*z()),.005,.9);const c=Math.round(e*(1-d));pr.rows.push({step:s.name,mo,pe:"",e,c,med:s.med});e=c});
  const act=Math.round(e*(1-clampJ(unused*(1+.04*z()),.05,.9)));opened.push(e);active.push(act);if(post)pr.rows.push({step:post.name,mo,pe:"",e,c:act,med:null})});
 const p=buildProduct(a.name,pr,tags,posts,true);p.mix=a.mix;
 p.steps.forEach((s,k)=>{s.reasons=steps[k].reasons;s.resume=steps[k].post?0:steps[k].resume});
 const ar=archetypePersonas(p,null,false);p.personas=ar.personas;p.pm=ar.pm;p.personaSrc="assumed";
 p.id=a.id;p.tier=a.tier;p.mock=true;p.example=true;
 p.notes=["Mock data. The monthly numbers for this account are made up for demonstration. They are not Standard Bank figures.",
  a.builtin?"The steps and eligibility rules below come from Standard Bank's public pages"+(accStatus(a)[0]==="Edited"?", as edited in Athena Offline.":"."):`Added in Athena Offline. Its numbers come from the share lost at each step set for it.`,
  ...(a.fee?["Fee: "+a.fee]:[]),...a.facts.filter(x=>!/persona|my assumption|declined-for-criteria/i.test(x))];
 p.actuals={months:MO,opened,active,label:a.name+", mock"};calibrate(p);return p}
// accounts with your data use your numbers; the rest use mock numbers (new accounts always show, so you can test them)
function accProducts(D,withMock){const have=new Set(D.map(p=>p.name.trim().toLowerCase()));
 return accList().filter(a=>!a.hidden&&!have.has(a.name.trim().toLowerCase())&&(withMock||!a.builtin)).map(accProduct)}

// ---------- the Accounts tab ----------
function stepRow(s,k,n){return`<tr data-ak="${k}"><td><input data-af="name" value="${esc(s.name)}" style="width:100%"></td>
 <td><select data-af="tag">${Object.entries(TAGL2).map(([t,l])=>`<option value="${t}" ${s.tag===t?"selected":""}>${l}</option>`).join("")}</select></td>
 <td><input data-af="loss" type="number" min="0" max="90" step="1" value="${Math.round(s.loss*100)}" style="width:64px"> %</td>
 <td><input data-af="med" type="number" min="0" max="60" step=".5" value="${s.med}" style="width:60px"></td>
 <td style="white-space:nowrap"><button class="linkbtn" data-aa="up" ${k?"":"disabled"}>↑</button> <button class="linkbtn" data-aa="down" ${k<n-1?"":"disabled"}>↓</button> <button class="linkbtn" data-aa="del">Remove</button></td></tr>`}
function accEditor(){const a=ACCED.a;return`<div class="card" id="accEd"><h2>${ACCED.isNew?"Create an account":"Edit "+esc(ACCED.orig)}</h2>
 <div class="hint">${ACCED.isNew?"Start from an existing account or a standard set of steps, then change what's different.":"Change what the bank changed. You can reset a Standard Bank account to how it started at any time."}</div>
 <div class="orv-f" style="padding:0;margin-top:12px">
 <div class="orv-2"><label>Account name<input data-ae="name" value="${esc(a.name)}"></label><label>Short description <span>For example "Entry, digital"</span><input data-ae="tier" value="${esc(a.tier)}"></label></div>
 <div class="orv-2"><label>Who it's for <span>Sets which of the 20 customer types qualify</span><select data-ae="mix">${MIXL.map((l,i)=>`<option value="${i}" ${+a.mix===i?"selected":""}>${l}</option>`).join("")}</select></label>
 <label>Monthly fee <span>As customers see it</span><input data-ae="fee" value="${esc(a.fee||"")}" placeholder="R0 a month"></label></div>
 <label>What to know about it <span>One per line: who qualifies, where it opens, what's needed</span><textarea data-ae="facts" rows="4">${esc(a.facts.join("\n"))}</textarea></label>
 <div class="orv-2"><label>People starting a month <span>For the mock numbers, until you load real data</span><input data-ae="starts" type="number" min="100" step="100" value="${a.starts}"></label>
 <label>Monthly change <span>In %, for example 0.5 or -0.4</span><input data-ae="trend" type="number" step=".1" value="${(a.trend*100).toFixed(1)}"></label></div></div>
 <h3 style="margin:18px 0 6px">Steps</h3><div class="hint" style="margin:0 0 8px">In order. "Lost here" is the share of people who reach the step and don't finish it. The last step can be "After opening" (people who never use the account).</div>
 <div style="overflow-x:auto"><table class="ptab"><thead><tr><th>Step</th><th>Type</th><th>Lost here</th><th>Minutes</th><th></th></tr></thead><tbody>${a.steps.map((s,k)=>stepRow(s,k,a.steps.length)).join("")}</tbody></table></div>
 <div class="btns" style="margin-top:8px"><button class="linkbtn" data-aa="add">Add a step</button></div>
 <div class="btns" style="margin-top:16px"><button class="on" id="accSave">${ACCED.isNew?"Create the account":"Save changes"}</button><button id="accCancel">Cancel</button><span class="hint" id="accErr" style="margin:0;color:#b42318"></span></div></div>`}
function drawAcc(){const el=$("acRoot");if(!el)return;const L=accList(),D=PRODUCTS.filter(p=>p.src==="data"&&!p.mock).map(p=>p.name.trim().toLowerCase());
 el.innerHTML=`<div class="card"><h2>Accounts</h2><div class="hint">These are the accounts Athena knows. Edit one when the bank changes it, or create a new one. Changes are saved on this laptop. To give colleagues the same accounts, export an update file and they load it into their copy.</div>
 ${AMSG?`<div class="note" style="margin-top:10px">${AMSG}</div>`:""}
 <div class="btns" style="margin-top:12px"><button class="on" id="accNew">Create an account</button><button id="accExp">Export accounts update</button><label class="filebtn"><input type="file" id="accImp" accept=".json" hidden>Load an accounts update</label></div>
 <div class="hint" style="margin:10px 0 0">${OACC&&OACC.v?`Version ${OACC.v}, updated ${new Date(OACC.at).toLocaleDateString("en-ZA",{day:"numeric",month:"short",year:"numeric"})}${OACC.log&&OACC.log[0]&&OACC.log[0].by?" by "+esc(OACC.log[0].by):""}.`:"The four Standard Bank accounts, as first set up."} Your name on updates: <input id="accBy" value="${esc((OACC&&OACC.by)||"")}" placeholder="Your name" style="font:inherit;font-size:13px;padding:2px 6px;border:1px solid var(--line);border-radius:6px;width:150px"></div>
 <div style="overflow-x:auto;margin-top:12px"><table class="ptab"><thead><tr><th>Account</th><th>For</th><th>Steps</th><th>Numbers</th><th>Status</th><th></th></tr></thead><tbody>
 ${L.map(a=>{const st=accStatus(a),dat=D.includes(a.name.trim().toLowerCase());return`<tr data-aid="${esc(a.id)}"${a.hidden?' style="opacity:.55"':""}><td><b>${esc(a.name)}</b><div class="hint" style="margin:0">${esc(a.tier)}${a.fee?" · "+esc(a.fee):""}</div></td><td>${["Entry","Mid","Premium"][+a.mix]}</td><td>${a.steps.length}</td>
  <td>${dat?'<span class="chip calc" style="margin:0">Your data</span>':'<span class="chip ass" style="margin:0">Mock</span>'}</td><td><span class="chip ${st[1]}" style="margin:0">${st[0]}</span></td>
  <td style="white-space:nowrap"><button class="linkbtn" data-ac="edit">Edit</button> <button class="linkbtn" data-ac="copy">Copy</button> <button class="linkbtn" data-ac="hide">${a.hidden?"Show":"Hide"}</button>${a.builtin?(st[0]==="Edited"?' <button class="linkbtn" data-ac="reset">Reset</button>':""):' <button class="linkbtn" data-ac="delete">Delete</button>'}</td></tr>`}).join("")}</tbody></table></div>
 <div class="note" style="margin-top:12px">An account with the same name as one in your data files uses your data's steps and numbers, and takes its description, fee and customer mix from here. The others use mock numbers built from the share lost at each step.</div></div>
 ${ACCED?accEditor():""}
 ${OACC&&OACC.log&&OACC.log.length?`<div class="card"><h2>Changes</h2><table class="ptab"><tbody>${OACC.log.slice(0,12).map(l=>`<tr><td>Version ${l.v}</td><td>${new Date(l.at).toLocaleString("en-ZA",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</td><td>${esc(l.by||"")}</td><td>${esc(l.what)}</td></tr>`).join("")}</tbody></table></div>`:""}`;
 if(ACCED){const e=$("accEd");if(e)["change","input"].forEach(t=>e.addEventListener(t,x=>x.stopPropagation()));if(e&&ACCED.scroll){e.scrollIntoView({block:"start"});ACCED.scroll=false}}}
function accTemplate(){return{id:"acc_"+Date.now().toString(36),name:"",tier:"",mix:0,fee:"",facts:[],starts:5000,trend:0,steps:["select","elig","details","idcap","verify","fica","sign","activate"].map(t=>({name:{select:"Choose account",elig:"Eligibility check",details:"Personal details",idcap:"ID capture",verify:"Identity verification",fica:"Proof of address",sign:"Terms and e-sign",activate:"Account opened → first transaction"}[t],tag:t,loss:ACC_LOSS[t],med:ACC_MED[t],resume:ACC_RES[t]}))}}
function accCheck(a,isNew){const L=accList();if(!a.name.trim())return"Give the account a name.";
 if(L.some(x=>x.id!==a.id&&x.name.trim().toLowerCase()===a.name.trim().toLowerCase()))return"There's already an account with that name.";
 if(a.steps.filter(s=>s.tag!=="activate").length<2)return"Add at least two steps before the account opens.";
 if(a.steps.some(s=>!s.name.trim()))return"Every step needs a name.";const nm=a.steps.map(s=>s.name.trim().toLowerCase());if(new Set(nm).size<nm.length)return"Two steps have the same name.";
 const ai=a.steps.findIndex(s=>s.tag==="activate");if(ai>=0&&ai!==a.steps.length-1)return'"After opening" can only be the last step.';
 if(a.steps.some(s=>!(s.loss>=0&&s.loss<=.9)))return"Lost here must be between 0% and 90%.";if(!(a.starts>=100))return"People starting a month should be at least 100.";return""}
function accApply(){if(OCHK&&OCHK.ok&&ODATA.files.length)applyData();else{PRODUCTS=accProducts([],true);SEL=0;PREV=null;resetChanges();drawAll();setDataChip()}}
function accRead(){const a=ACCED.a,r=$("accEd");if(!r)return;r.querySelectorAll("[data-ae]").forEach(i=>{const f=i.dataset.ae;let v=i.value;
 if(f==="mix")v=+v;else if(f==="starts")v=+v;else if(f==="trend")v=(+v||0)/100;else if(f==="facts")v=v.split(/\n+/).map(x=>x.trim()).filter(Boolean);a[f]=v});
 r.querySelectorAll("tr[data-ak]").forEach(tr=>{const s=a.steps[+tr.dataset.ak];tr.querySelectorAll("[data-af]").forEach(i=>{const f=i.dataset.af;
  if(f==="tag"){if(s.tag!==i.value){s.tag=i.value;s.resume=ACC_RES[s.tag]}}else if(f==="loss")s.loss=(+i.value||0)/100;else if(f==="med")s.med=+i.value||0;else s.name=i.value})})}
function accExport(){if(!OACC)accTouch("Started from the four Standard Bank accounts");const by=(OACC.by||"").trim();
 downloadText(`athena-accounts-v${OACC.v}-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({athena:"accounts",v:OACC.v,at:OACC.at,by,list:OACC.list,log:OACC.log},null,1),"application/json");
 AMSG=`Exported version ${OACC.v}. Send the file to colleagues; they open Accounts and press "Load an accounts update".`;drawAcc()}
async function accImport(text,name){let j;try{j=JSON.parse(text)}catch(e){AMSG=`${esc(name)} isn't an accounts update file.`;return false}
 if(!j||j.athena!=="accounts"||!Array.isArray(j.list)){AMSG=`${esc(name)} isn't an accounts update file.`;return false}
 const cur=accList(),add=[],chg=[];const L=cur.map(a=>{const n=j.list.find(x=>x.id===a.id);if(n&&!accSame(n,a)){chg.push(n.name);return n}return a});
 j.list.forEach(n=>{if(!cur.some(a=>a.id===n.id)){add.push(n.name);L.push(n)}});
 if(!add.length&&!chg.length){AMSG=`You already have everything in ${esc(name)} (version ${j.v}).`;return false}
 const by=OACC?OACC.by:"";OACC=OACC||{v:0,list:L,log:[]};OACC.list=L;OACC.by=by;OACC.v=Math.max(OACC.v,j.v||0);
 accTouch(`Loaded update v${j.v}${j.by?" from "+j.by:""}: `+[add.length?"added "+add.join(", "):"",chg.length?"updated "+chg.join(", "):""].filter(Boolean).join("; "));
 await saveAcc();accApply();AMSG=`Loaded version ${j.v}${j.by?" from "+esc(j.by):""}. `+(add.length?`Added ${add.length}: ${esc(add.join(", "))}. `:"")+(chg.length?`Updated ${chg.length}: ${esc(chg.join(", "))}.`:"");return true}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("button");if(!b||!b.closest("#acRoot"))return;const row=b.closest("[data-aid]");
 if(b.id==="accNew"){ACCED={isNew:true,a:accTemplate(),scroll:true};AMSG="";drawAcc();return}
 if(b.id==="accExp"){accExport();return}
 if(b.id==="accCancel"){ACCED=null;drawAcc();return}
 if(b.dataset.aa){accRead();const a=ACCED.a,tr=b.closest("tr[data-ak]"),k=tr?+tr.dataset.ak:-1;
  if(b.dataset.aa==="add"){const t=a.steps.length&&a.steps[a.steps.length-1].tag==="activate"?a.steps.length-1:a.steps.length;a.steps.splice(t,0,{name:"New step",tag:"none",loss:ACC_LOSS.none,med:ACC_MED.none,resume:ACC_RES.none})}
  else if(b.dataset.aa==="del")a.steps.splice(k,1);else if(b.dataset.aa==="up"&&k>0)[a.steps[k-1],a.steps[k]]=[a.steps[k],a.steps[k-1]];else if(b.dataset.aa==="down"&&k<a.steps.length-1)[a.steps[k+1],a.steps[k]]=[a.steps[k],a.steps[k+1]];
  drawAcc();return}
 if(b.id==="accSave"){accRead();const a=ACCED.a,err=accCheck(a,ACCED.isNew);if(err){$("accErr").textContent=err;return}
  if(!OACC)accTouch("Started from the four Standard Bank accounts");const L=OACC.list,i=L.findIndex(x=>x.id===a.id);if(i>=0)L[i]=a;else L.push(a);
  accTouch(ACCED.isNew?`Created ${a.name}`:`Edited ${a.name}`);await saveAcc();const nm=a.name;ACCED=null;accApply();const k=PRODUCTS.findIndex(p=>p.name===nm);if(k>=0){SEL=k;drawAll()}
  AMSG=`Saved ${esc(nm)}. It's selected, so the other tabs now show it.`;drawAcc();return}
 if(row){const id=row.dataset.aid,a=accList().find(x=>x.id===id);if(!a)return;const act=b.dataset.ac;
  if(act==="edit"){ACCED={isNew:false,orig:a.name,a:JSON.parse(JSON.stringify(a)),scroll:true};AMSG="";drawAcc();return}
  if(act==="copy"){const c=JSON.parse(JSON.stringify(a));c.id="acc_"+Date.now().toString(36);c.name=a.name+" (copy)";delete c.builtin;delete c.seed;delete c.hidden;ACCED={isNew:true,a:c,scroll:true};AMSG="";drawAcc();return}
  if(!OACC)accTouch("Started from the four Standard Bank accounts");const L=OACC.list,i=L.findIndex(x=>x.id===id);
  if(act==="hide"){L[i].hidden=L[i].hidden?undefined:1;if(!L[i].hidden)delete L[i].hidden;accTouch((L[i].hidden?"Hid ":"Showed ")+a.name)}
  else if(act==="reset"){const d=accDefaults().find(x=>x.id===id);if(!d||!confirm(`Reset ${a.name} to how it started? Your edits to it are lost.`))return;L[i]=d;accTouch("Reset "+d.name)}
  else if(act==="delete"){if(!confirm(`Delete ${a.name}? Colleagues who loaded it keep their copy until they delete it too.`))return;L.splice(i,1);accTouch("Deleted "+a.name)}
  await saveAcc();accApply();AMSG="";drawAcc()}});
document.addEventListener("change",async e=>{const t=e.target;if(!t)return;
 if(t.id==="accImp"&&t.files.length){const f=t.files[0];await accImport(await f.text(),f.name);t.value="";drawAcc()}
 else if(t.id==="accBy"){if(!OACC)OACC={v:0,at:null,by:"",list:accDefaults(),log:[]};OACC.by=t.value.trim();await saveAcc()}});
