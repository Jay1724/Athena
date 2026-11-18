
// ===== Summary: the one-screen story for the selected flow =====
function drawSum(){
 const el=$("smRoot");if(!el||!BASE)return;const p=cur(),own=changed(),bp=p.design&&p.base?PRODUCTS.find(x=>x.name===p.base&&!x.design):null,dz=!!bp,sa=!!p.standalone;
 const SR=softRuns(p),RA=dz?baseRun(bp):BASE,PR=dz?BASE:(own?SCEN:SR.medium),pa=dz?bp:p,n=RA.cust.length,np=PR.cust.length;
 const ob=RA.openN/n*100,os=PR.openN/np*100,lo=SR.light.openN/SR.light.cust.length*100,hi=SR.strong.openN/SR.strong.cust.length*100;
 const mkL=(prod,R)=>prod.steps.map((s,k)=>({s,k,w:R.fail[k]/R.cust.length*100,att:R.att[k]})).filter(x=>!x.s.post&&x.att>0),top2=L=>L.filter(x=>x.s.tag!=="elig").slice().sort((a,b)=>b.w-a.w).slice(0,2);
 const LA=mkL(pa,RA),LB=mkL(p,PR),top=top2(dz?LB:LA),topA=top2(LA).map(x=>x.s.name),topB=dz?top.map(x=>x.s.name):topA,lost=100-(dz?os:ob),topSum=top.reduce((a,x)=>a+x.w,0);
 const F=fcSeries(pa),b3=F.st.map((x,i)=>x*F.r[i]).reduce((a,b)=>a+b,0),ratio=ob>0?os/ob:1,x3=b3*(ratio-1),x3lo=b3*(lo/ob-1),x3hi=b3*(hi/ob-1),r10=v=>Math.round(v/10)*10;
 let money="";const W=window.__C;
 if(W&&ob>0&&!sa){const C=W.get(),V=F.st.reduce((a,b)=>a+b,0),mk=a=>{const m=JSON.parse(JSON.stringify(C.trad));m.s.base.act=a;return W.calc(V,m,"base")},d=mk(os).contrib-mk(ob).contrib;
  money=`<div class="fp fplink" data-go="commercial" data-to="cExec" role="button" tabindex="0"><span class="fpgo" aria-hidden="true">›</span><div class="fp-n">Worth, per year</div><div class="fp-s">${d>=1e6?"R"+(d/1e6).toFixed(1)+"m":"R"+f(Math.round(d/1000))+"k"}</div><div class="fp-q">Contribution from those extra accounts. <span class="chip ass" style="margin-left:0">PLACEHOLDER VALUE PER CUSTOMER</span></div></div>`}
 flowLoad(p);const A=flowAuto(BASE,p),S=flowScore(A),V=flowVerdict(A,S);
 const pw=Object.fromEntries(FP.map(P=>[P[0],P[3]])),fx=S.checks.filter(c=>c.s!=null&&c.s<.7).sort((a,b)=>(1-b.s)*b.w*pw[b.p]-(1-a.s)*a.w*pw[a.p]).slice(0,3);
 const cr=custRows(p,BASE).filter(x=>x.sh>=2).sort((a,b)=>a.r-b.r),low=cr[0],hiP=cr[cr.length-1];
 const VS=typeof validStats==="function"?validStats(p):null;
 const bar=(lbl,L,tops,open,col)=>`<div class="smbar-l"><b>${lbl}</b><span>${open.toFixed(0)} in 100 open an account</span></div><div class="smbar">${L.map(x=>{const w=x.w;return w>=.4?`<i title="${esc(x.s.name)}: ${w.toFixed(0)} lost" style="flex:${w.toFixed(2)};background:${tops.includes(x.s.name)?"var(--amber)":"#d1d1d6"}">${w>=5?`<em>${w.toFixed(0)}</em>`:""}</i>`:""}).join("")}<i style="flex:${open.toFixed(2)};background:${col}"><em>${open.toFixed(0)} open</em></i></div>`;
 const propLbl=own?"With your changes":"With the Soft Banking Profile";
 let h=`<div class="card sm"><div class="smtop"><div class="ctl-l" style="margin:0;color:var(--mut)">Summary</div><div class="smtop-r"><button id="smPrint" class="noprint">Save as PDF</button><span id="smPdfMsg" class="hint noprint" style="margin:0"></span></div></div>
 <h1 class="smh">${esc(p.name)} ${dz||sa?"would lose":"loses"} <span style="color:var(--amber)">${lost.toFixed(0)} of every 100</span> people who start.</h1>
 <p class="lead" style="margin-bottom:20px">${sa?`${top.length===2?`Two screens cause ${topSum.toFixed(0)} of those: <b>${esc(top[0].s.name)}</b> and <b>${esc(top[1].s.name)}</b>. `:""}${p.anchor?`Scaled to your estimate that ${p.anchor} in 100 finish today.`:"Drop-off per screen uses generic defaults, because this design is not compared with a live flow."} <span class="chip ass">PREDICTED, NOT MEASURED</span>`:dz?`Today's ${esc(bp.name)} flow opens ${ob.toFixed(0)} accounts in every 100. This design is predicted to open ${os.toFixed(0)}. <span class="chip ass">PREDICTED, NOT MEASURED</span>`:`${top.length===2?`Two screens cause ${topSum.toFixed(0)} of those: <b>${esc(top[0].s.name)}</b> and <b>${esc(top[1].s.name)}</b>.`:""} ${os>ob+.5?`${own?"The changes being tested":"A Soft Banking Profile"} would lift accounts opened from ${ob.toFixed(0)} to ${os.toFixed(0)} in every 100.`:""}${p.mock?' <span class="chip ass">MOCK DATA</span>':p.src==="template"?' <span class="chip ass">ILLUSTRATIVE NUMBERS</span>':""}`}</p>
 ${sa?bar("This design",LA,topA,ob,"var(--blue)"):bar(dz?"Today: "+esc(bp.name):"Today",LA,topA,ob,"var(--ink)")+bar(dz?"This design":propLbl,LB,topB,os,"var(--blue)")}
 <div class="hint" style="margin-top:8px">Each block is the people lost at one screen, out of 100 who start. Orange marks the two biggest leaks.</div>
 <div class="fpill" style="grid-template-columns:repeat(${money?4:3},1fr);margin-top:18px">
 ${sa?`<div class="fp fplink" data-go="journey" data-to="sumK" role="button" tabindex="0"><span class="fpgo" aria-hidden="true">›</span><div class="fp-n">People who finish, per 100</div><div class="fp-s" style="color:var(--blue)">${ob.toFixed(0)}</div><div class="fp-q">${p.anchor?"Scaled to your estimate of how many finish today.":"From generic defaults for each type of screen."}</div></div>
 <div class="fp fplink" data-go="journey" data-to="chLeak" role="button" tabindex="0"><span class="fpgo" aria-hidden="true">›</span><div class="fp-n">Screens</div><div class="fp-s">${LA.length}</div><div class="fp-q">${top[0]?"The biggest leak is "+esc(top[0].s.name)+".":""}</div></div>`:` <div class="fp fplink" data-go="journey" data-to="sumK" role="button" tabindex="0"><span class="fpgo" aria-hidden="true">›</span><div class="fp-n">Accounts opened per 100</div><div class="fp-s">${ob.toFixed(0)} <span style="color:var(--mut)">→</span> <span style="color:var(--blue)">${os.toFixed(0)}</span></div><div class="fp-q">${dz?"Today's flow against this design.":own?"With the ideas switched on in Drop-off and ideas.":`Between ${lo.toFixed(0)} and ${hi.toFixed(0)}, depending on how well it works.`}</div></div>
 <div class="fp fplink" data-go="journey" data-to="fc" role="button" tabindex="0"><span class="fpgo" aria-hidden="true">›</span><div class="fp-n">Next 3 months</div><div class="fp-s">${x3>=0?"+":"−"}${f(r10(Math.abs(x3)))}</div><div class="fp-q">extra accounts, on top of ${f(r10(b3))} at today's flow${own||dz?"":` (range +${f(r10(x3lo))} to +${f(r10(x3hi))})`}.</div></div>`}
 ${money}
 <div class="fp fplink" data-go="flow" data-to="" role="button" tabindex="0"><span class="fpgo" aria-hidden="true">›</span><div class="fp-n">Flow confidence</div><div class="fp-s" style="color:${fcol(V.sc)}">${V.sc}</div><div class="fp-q"><b style="color:${V.vc}">${V.verdict}.</b> ${FREV?"Screens reviewed.":"Screens not reviewed yet."}</div></div></div></div>
 <div class="smtwo"><div class="card"><h2>Fix first</h2>${fx.length?fx.map((c,i)=>`<div class="frow"><div class="fnum">${i+1}</div><div class="fbody"><div class="ft">${esc(c.t)} <span class="chip">${esc(c.law)}</span></div>${c.auto?`<div class="ff">${esc(c.find)}</div>`:""}<div class="ffix">${esc(c.fix)}</div></div></div>`).join(""):'<div class="note">No weak checks yet.</div>'}<div class="foot noprint"><button class="linkbtn" data-go="flow">Open feedback</button></div></div>
 <div class="card"><h2>Who it fails</h2>${low?`<div class="cuhead" style="margin-top:6px">${pav(low.pe.name,true)}<div><div class="ft"><b>${esc(pname(low.pe.name))}</b>${pinfo(low.pe.name)?", "+esc(low.pe.name):""}</div><div class="ff">Only ${low.r.toFixed(0)} in 100 open an account${hiP&&hiP!==low?`, against ${hiP.r.toFixed(0)} for ${esc(pname(hiP.pe.name))}`:""}.</div></div></div>${pinfo(low.pe.name)?`<p class="cuprof" style="font-size:14.5px">${esc(pinfo(low.pe.name).pain)}</p>`:""}<div class="hint">${p.personaSrc==="data"?"From your persona data.":"Customer differences are assumptions, under review by research."}</div>`:""}<div class="foot noprint"><button class="linkbtn" data-go="customers">Meet the customers</button></div></div></div>
 ${p.design?"":`<div class="card dzcta noprint"><div><h2 style="margin:0 0 4px">Have a new design for this flow?</h2><div class="fsub" style="margin:0">Upload the screens and see how it would do against today, before any customer sees it.</div></div><button data-go="design" class="on">Test a design</button></div>`}
 <div class="card"><h2>How sure are we?</h2>
 <div class="frow"><span class="fpl ${p.mock?"mute":"g"}">${p.mock?"Mock":"Measured"}</span><div class="fbody"><div class="ft">${sa?"Nothing. This design has never been live and is not compared with a live flow. Drop-off "+(p.anchor?"is scaled to your own estimate.":"uses generic defaults for each type of screen."):dz?"Nothing. This design has never been live, so its drop-off is predicted from "+esc(bp.name)+"'s numbers for each type of screen.":p.mock?"Where people leave is mock data: "+f(p.obs.cal[0].e)+" made-up starts over "+(p.months.length-1)+" months. Load real funnel numbers to replace it.":p.src==="template"?"Nothing yet. This flow uses illustrative numbers.":"Where people leave. "+f(p.obs.cal[0].e)+" real starts"+(p.months.length?" over "+p.months.length+" months":"")+"."}</div></div></div>
 <div class="frow"><span class="fpl ${VS&&VS.hold?"g":"mute"}">Tested</span><div class="fbody"><div class="ft">${VS&&VS.hold?`${p.mock?"On mock data only, which shows the method works, not that it matches reality. ":""}The model predicted a month it had not seen: ${VS.ok} of ${VS.K} steps within normal movement, average miss ${(VS.mae*100).toFixed(1)} points.`:"Not independently tested for this flow."}</div></div></div>
 <div class="frow"><span class="fpl a">Assumed</span><div class="fbody"><div class="ft">How much each idea helps, how customers differ from each other, and the rand value per customer. These need a pilot, research and finance to confirm.</div></div></div></div>`;
 el.innerHTML=h;goalSwap(el);
}
function goTo(g,to){const t={flow:"tbF",customers:"tbU",design:"tbD",journey:"tbJ",commercial:"tbC"}[g];if(t)$(t).click();
 const el=to&&$(to),box=el&&(el.closest(".bt")||el.closest(".card")||el);if(box&&box.scrollIntoView){setTimeout(()=>{box.scrollIntoView({behavior:"smooth",block:"start"});box.classList.add("flash");setTimeout(()=>box.classList.remove("flash"),1400)},60)}else window.scrollTo&&window.scrollTo(0,0)}
document.addEventListener("keydown",e=>{const f=e.target.closest&&e.target.closest(".fplink");if(f&&(e.key==="Enter"||e.key===" ")){e.preventDefault();goTo(f.dataset.go,f.dataset.to)}});
document.addEventListener("click",e=>{const f=e.target.closest&&e.target.closest(".fplink");if(f){goTo(f.dataset.go,f.dataset.to);return}const b=e.target.closest&&e.target.closest("button");if(!b)return;
 if(b.dataset.go){goTo(b.dataset.go,"")}
 else if(b.id==="smPrint"){savePdf(b)}});

// Save the Summary as a PDF. The viewer's frame blocks printing and plain downloads, so the page draws the PDF itself and hands it over through the downloads capability.
function loadJs(src){return new Promise((ok,no)=>{if([...document.scripts].some(s=>s.src===src))return ok();const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>no(new Error("load"));document.head.appendChild(s)})}
async function savePdf(btn){
 const msg=$("smPdfMsg"),say=t=>{if(msg)msg.textContent=t},label=btn.textContent;btn.disabled=true;btn.textContent="Preparing PDF…";say("");
 try{
  await loadJs("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  await loadJs("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const root=$("smRoot");root.classList.add("pdfmode");root.style.width="900px";await new Promise(r=>setTimeout(r,60));
  const cards=[...root.children].filter(e=>!e.classList.contains("noprint")&&e.offsetHeight>0);
  const pdf=new window.jspdf.jsPDF({unit:"mm",format:"a4"}),W=210,H=297,M=12,CW=W-2*M;let y=M,first=true;
  pdf.setFont("helvetica","bold");pdf.setFontSize(9);pdf.setTextColor(110);
  const head=()=>{pdf.text("Account Origination Simulator · "+cur().name+" · "+new Date().toISOString().slice(0,10)+(cur().mock?" · mock data":""),M,8)};head();
  for(const el of cards){
   const parts=[el];
   for(const part of parts){
    const c=await html2canvas(part,{scale:2,backgroundColor:"#ffffff",logging:false,useCORS:true,ignoreElements:e=>e.classList&&e.classList.contains("noprint")});
    let h=c.height/c.width*CW;
    if(h>H-2*M){h=H-2*M}
    if(y+h>H-M&&!first){pdf.addPage();head();y=M}
    pdf.addImage(c.toDataURL("image/jpeg",.92),"JPEG",M,y,CW,h);y+=h+5;first=false}}
  root.classList.remove("pdfmode");root.style.width="";
  const blob=pdf.output("blob"),name=("Summary - "+cur().name).replace(/[^\w .-]+/g," ").trim()+".pdf";
  const dl=window.claude&&window.claude.use?await window.claude.use("downloads"):null;
  if(dl){await dl.save({filename:name,data:blob});say("Saved.")}
  else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();say("Downloaded.")}
 }catch(e){$("smRoot").classList.remove("pdfmode");$("smRoot").style.width="";const c=e&&e.code;say(c==="declined"?"Not saved.":c==="rate_limited"?"A save is already waiting for you. Try again in a moment.":e&&e.message==="load"?"Couldn't load the PDF tools. Check your connection and try again.":"Couldn't save the PDF here. Open the simulator in its own browser tab and try again.")}
 finally{btn.disabled=false;btn.textContent=label}
}
XTRA_READY=true;drawSum();drawCust();
