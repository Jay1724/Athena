// offline_ui.js: the "Your data" and "Forecast" tabs of Athena Offline.
var OFF_READY=false,OMSG="";
const pc0=v=>Math.round(v*100)+"%",pc1=v=>(v*100).toFixed(1)+"%";
const MSHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],moLab=mo=>MSHORT[+mo.slice(5)-1]+" "+mo.slice(2,4);
function setDataChip(){const c=$("dataChip");if(!c)return;const yours=PRODUCTS.some(p=>p.src==="data"&&!p.mock);c.textContent=yours?(ODATA.useMock?"YOUR DATA + MOCK":"YOUR DATA"):"MOCK DATA";c.className="chip "+(yours?"calc":"ass")}
function applyData(){FCC={k:"",v:null};const D=dataProducts();PRODUCTS=[...D,...(ODATA.useMock||!D.length?mockProducts():[])];SEL=0;PREV=null;IVAL={k:"",v:null,busy:false};resetChanges();drawAll();setDataChip();if(typeof drawSum==="function")try{drawSum()}catch(e){}}

// ---------- Your data ----------
function drawData(){const el=$("dyRoot");if(!el)return;const C=OCHK,F=ODATA.files;
 const lv={error:["Fix this","no"],warn:["Check this","part"],info:["Good to know","info"]};
 const summ=C&&Object.keys(C.prods).length?Object.values(C.prods).map(P=>`<b>${esc(P.name)}</b>: ${P.steps.length} steps, ${P.dates.length.toLocaleString("en-ZA")} ${P.grain==="day"?"days":P.grain==="week"?"weeks":"months"}, ${P.dates[0]} to ${P.dates[P.dates.length-1]}`).join("<br>"):"";
 el.innerHTML=`<div class="card"><h2>Your data stays on this laptop.</h2>
 <p class="lead">Athena Offline runs in this browser with no internet. Files you load are read here, checked, and saved in this browser only. Nothing is uploaded.</p>
 <label class="dzdrop" id="dyDrop"><input type="file" id="dyFile" accept=".csv,.txt,text/csv,.json" multiple hidden><b>Add CSV files</b><span>Funnel counts (daily, weekly or monthly) and, if you have them, drop-off reasons. Drop them here or click to choose.</span></label>
 <div class="btns" style="margin-top:12px"><button id="dySample">Try it with sample data</button><button id="dyTplF">Download funnel template</button><button id="dyTplR">Download reasons template</button></div>
 <div class="hint" id="dyMsg" style="margin-top:8px">${esc(OMSG)}</div>
 <details class="legend" style="margin-top:12px"><summary>What the files should look like</summary><div class="note" style="margin-top:8px">
 <p><b>Funnel file</b> (required): one row per account, date and step. Columns: <code>product, date, step, entered, completed</code>. Dates can be days (2026-10-31), weeks (2026-W44) or months (2026-10). An optional <code>segment</code> column is read too.</p>
 <p><b>Reasons file</b> (optional): <code>product, month, step, reason, count</code>. Used for "why they left" and to point fixes at the right problems.</p>
 <p>Excel files: save as CSV first (File, Save as, CSV UTF-8). Column names are matched loosely, so "Started" and "Finished" work too.</p></div></details></div>
 ${F.length?`<div class="card"><h2>Data checks</h2>
 <div class="dyfiles">${F.map((f,i)=>`<div class="dyf"><div><b>${esc(f.name)}</b><span>${f.kind==="funnel"?"Funnel":f.kind==="reasons"?"Drop-off reasons":"Not recognised"}${f.rows?` · ${f.rows.length.toLocaleString("en-ZA")} rows`:""}${f.grain&&f.kind==="funnel"?` · ${f.grain==="day"?"daily":f.grain==="week"?"weekly":"monthly"}`:""}</span></div><button class="linkbtn" data-dyrm="${i}">Remove</button></div>`).join("")}</div>
 ${summ?`<p style="margin-top:12px">${summ}</p>`:""}
 ${C&&C.out.length?`<ul class="dychk">${C.out.map(x=>`<li class="${lv[x.lv][1]}"><span class="dyl">${lv[x.lv][0]}</span><div>${x.f?`<b>${esc(x.f)}</b>: `:""}${esc(x.t)}</div></li>`).join("")}</ul>`:`<div class="ok1">✓ All checks passed.</div>`}
 <div class="btns" style="margin-top:14px"><button id="dyUse" class="on" ${C&&C.ok?"":"disabled"}>Use this data</button><label class="tg" style="margin-left:6px"><input type="checkbox" id="dyMock" ${ODATA.useMock?"checked":""}> Keep the mock accounts too</label></div></div>`:""}
 ${C&&Object.keys(C.prods).length?`<div class="card"><h2>Steps</h2><p class="lead">Athena guessed what each step is from its name. Correct any it got wrong: the step type decides which personas struggle there and which fixes apply.</p>
 ${Object.values(C.prods).map(P=>`<h3 class="fh3" style="margin-top:14px">${esc(P.name)}</h3><table class="ptab"><thead><tr><th>Step</th><th style="text-align:left">Type</th></tr></thead><tbody>${P.steps.map(s=>`<tr><td>${esc(s)}</td><td style="text-align:left"><select data-dytag="${esc(P.name)}|${esc(s)}">${Object.entries(TAGL2).map(([k,l])=>`<option value="${k}" ${ODATA.tags[P.name][s]===k?"selected":""}>${l}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table>`).join("")}</div>`:""}
 <div class="card"><h2>Saved on this laptop</h2><p class="lead">${ODATA.saved?`Last saved ${new Date(ODATA.saved).toLocaleString("en-ZA")}. It opens automatically next time, in this browser on this laptop.`:"Nothing saved yet."} To move it to another laptop or share it, export a project file.</p>
 <div class="btns"><button id="dyExp" ${F.length?"":"disabled"}>Export project file</button><label class="filebtn">Import project file<input type="file" id="dyImp" accept=".json" hidden></label><button id="dyClr" ${F.length?"":"disabled"}>Clear all data</button></div></div>`;
}
async function addFiles(list){let n=0;for(const fl of list){const text=await fl.text();
  if(/\.json$/i.test(fl.name)){try{const j=JSON.parse(text);if(j&&j.data&&j.data.files){ODATA=Object.assign({files:[],tags:{},saved:null,useMock:false},j.data);n++;continue}}catch(e){}OMSG=`${fl.name} isn't an Athena project file.`;continue}
  const r=readFileText(fl.name,text);ODATA.files=ODATA.files.filter(x=>x.name!==fl.name);ODATA.files.push(r);n++}
 checkData();OMSG=n?`Read ${n} file${n>1?"s":""}. Check the results below, then press "Use this data".`:OMSG;drawData()}
document.addEventListener("change",async e=>{const t=e.target;if(!t)return;
 if(t.id==="dyFile"&&t.files.length){await addFiles([...t.files]);t.value=""}
 else if(t.id==="dyImp"&&t.files.length){await addFiles([...t.files]);t.value="";if(OCHK&&OCHK.ok){await saveProject();applyData();OMSG="Project imported and in use.";drawData()}}
 else if(t.dataset&&t.dataset.dytag){const [p,s]=t.dataset.dytag.split("|");ODATA.tags[p][s]=t.value;await saveProject();if(PRODUCTS.some(x=>x.src==="data"))applyData();OMSG="Step type saved.";drawData()}
 else if(t.id==="dyMock"){ODATA.useMock=t.checked;await saveProject();if(PRODUCTS.some(x=>x.src==="data"&&!x.mock))applyData()}});
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("button");if(!b)return;
 if(b.id==="dySample"){OMSG="Making sample data…";drawData();setTimeout(async()=>{ODATA.files=sampleFiles().map(x=>readFileText(x.name,x.text));checkData();OMSG="Sample data loaded: four accounts, two years of daily numbers, and drop-off reasons. Press \"Use this data\".";drawData()},30)}
 else if(b.id==="dyTplF")downloadText("athena_funnel_template.csv",TEMPLATE_FUNNEL,"text/csv");
 else if(b.id==="dyTplR")downloadText("athena_reasons_template.csv",TEMPLATE_REASONS,"text/csv");
 else if(b.dataset.dyrm!=null){ODATA.files.splice(+b.dataset.dyrm,1);checkData();drawData()}
 else if(b.id==="dyUse"){b.disabled=true;b.textContent="Setting up…";setTimeout(async()=>{applyData();const ok=await saveProject();OMSG=ok?"In use and saved on this laptop. The other tabs now show your accounts.":"In use. Couldn't save in this browser, so export a project file to keep it.";drawData()},30)}
 else if(b.id==="dyExp")exportProject();
 else if(b.id==="dyClr"){if(!confirm("Clear all data from this browser? Export a project file first if you want to keep it."))return;ODATA={files:[],tags:{},saved:null,useMock:false};OCHK=null;try{await IDB.del("project")}catch(x){}PRODUCTS=mockProducts();SEL=0;resetChanges();drawAll();setDataChip();OMSG="Cleared. Showing the mock accounts again.";drawData()}});
document.addEventListener("dragover",e=>{if(e.target.closest&&e.target.closest("#dyDrop"))e.preventDefault()});
document.addEventListener("drop",async e=>{if(e.target.closest&&e.target.closest("#dyDrop")){e.preventDefault();await addFiles([...e.dataTransfer.files])}});

// ---------- Forecast ----------
var FCC={k:"",v:null};
function fcOf(p){const k=p.id+"|"+(p.series?p.series.rows.length:0);if(FCC.k!==k)FCC={k,v:p.series?forecastOf(p):null};return FCC.v}
function lineChart(hist,fut,o){const W=760,H=260,mg={l:56,r:16,t:16,b:30},all=[...hist.map(x=>x.v),...fut.map(x=>x.hi),...(o.alt||[]).map(x=>x.v)],mx=Math.max(...all)*1.1||1,n=hist.length+fut.length;
 const X=i=>mg.l+(W-mg.l-mg.r)*(i/(n-1)),Y=v=>mg.t+(H-mg.t-mg.b)*(1-v/mx),nk=v=>v>=1e6?(v/1e6).toFixed(1)+"m":v>=1e3?(v/1e3).toFixed(v>=1e4?0:1)+"k":Math.round(v);
 let g="";for(let i=0;i<=4;i++){const v=mx/1.1*i/4;g+=`<line x1="${mg.l}" x2="${W-mg.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ececf0"/><text x="${mg.l-8}" y="${Y(v)+4}" font-size="11" text-anchor="end" fill="#86868b">${nk(v)}</text>`}
 [...hist,...fut].forEach((x,i)=>{if(i%2===0||i===n-1)g+=`<text x="${X(i)}" y="${H-8}" font-size="11" text-anchor="middle" fill="#86868b">${moLab(x.mo)}</text>`});
 const h0=hist.length-1;g+=`<polygon points="${[`${X(h0)},${Y(hist[h0].v)}`,...fut.map((x,i)=>`${X(h0+1+i)},${Y(x.hi)}`),...fut.map((x,i)=>`${X(h0+1+i)},${Y(x.lo)}`).reverse()].join(" ")}" fill="#0071e3" opacity=".12"/>`;
 g+=`<line x1="${X(h0)}" x2="${X(h0)}" y1="${mg.t}" y2="${H-mg.b}" stroke="#d2d2d7" stroke-dasharray="3 4"/><text x="${X(h0)+6}" y="${mg.t+10}" font-size="11" fill="#86868b">Forecast</text>`;
 g+=`<polyline points="${hist.map((x,i)=>`${X(i)},${Y(x.v)}`).join(" ")}" fill="none" stroke="#1d1d1f" stroke-width="2"/>`;
 g+=`<polyline points="${[`${X(h0)},${Y(hist[h0].v)}`,...fut.map((x,i)=>`${X(h0+1+i)},${Y(x.v)}`)].join(" ")}" fill="none" stroke="#0071e3" stroke-width="2.5" stroke-dasharray="6 4"/>`;
 fut.forEach((x,i)=>g+=`<circle cx="${X(h0+1+i)}" cy="${Y(x.v)}" r="4" fill="#0071e3"/>`);
 if(o.alt)g+=`<polyline points="${[`${X(h0)},${Y(hist[h0].v)}`,...o.alt.map((x,i)=>`${X(h0+1+i)},${Y(x.v)}`)].join(" ")}" fill="none" stroke="#1f8a43" stroke-width="2.5"/>`+o.alt.map((x,i)=>`<circle cx="${X(h0+1+i)}" cy="${Y(x.v)}" r="4" fill="#1f8a43"/>`).join("");
 return`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label)}" style="width:100%;height:auto;display:block">${g}</svg>`}
function scenRatio(p){if(!BASE||!SCEN||!changed())return null;const b=BASE.openN/BASE.cust.length,s=SCEN.openN/SCEN.cust.length;return b>0?s/b:null}
function drawFc(){const el=$("fpRoot");if(!el)return;const p=cur();
 if(!p.series){el.innerHTML=`<div class="card"><h2>Forecasts need your data.</h2><p class="lead">${esc(p.name)} is a mock account with no history. Load your funnel files under Your data, or try the sample data, to see the next 3 months and how far to trust them.</p><div class="btns"><button class="on" onclick="tab('data')">Go to Your data</button></div></div>`;return}
 const R=fcOf(p);if(!R){el.innerHTML=`<div class="card"><h2>Not enough history yet.</h2><p class="lead">Athena needs at least 4 full months to forecast, and 9 to check itself.</p></div>`;return}
 const {M,f,B}=R,pre=f[0].steps.length-(p.steps[p.steps.length-1].post?1:0),op=m=>m.v[pre-1][1],hist=M.slice(-15).map(m=>({mo:m.mo,v:op(m)}));
 const tot=f.reduce((a,x)=>a+x.opened,0),lo=f.reduce((a,x)=>a+x.lo,0),hi=f.reduce((a,x)=>a+x.hi,0),last3=M.slice(-3).reduce((a,m)=>a+op(m),0);
 const ly=f.map(x=>{const prev=M.find(m=>m.mo===(+x.mo.slice(0,4)-1)+x.mo.slice(4));return prev?op(prev):null}),lyT=ly.every(v=>v!=null)?ly.reduce((a,b)=>a+b,0):null;
 const r=scenRatio(p),alt=r?f.map(x=>({mo:x.mo,v:x.opened*r})):null;
 const fmt=v=>Math.round(v).toLocaleString("en-ZA"),rng=(a,b)=>`${fmt(a)} to ${fmt(b)}`;
 const tc={High:"calc",Medium:"ass",Low:"sim"}[B.trust]||"ass";
 el.innerHTML=`<div class="card"><h2>${esc(p.name)}: the next 3 months</h2>
 <div class="pkpi" style="grid-template-columns:repeat(3,1fr)"><div><b>${fmt(tot)}</b><span>accounts opened, likely ${rng(lo,hi)}</span></div>
 <div><b>${lyT?((tot/lyT-1)>=0?"+":"")+pc0(tot/lyT-1):((tot/last3-1)>=0?"+":"")+pc0(tot/last3-1)}</b><span>${lyT?"against the same 3 months last year":"against the last 3 months"}</span></div>
 <div><b><span class="chip ${tc}" style="font-size:13px;margin:0;display:inline-block;width:auto">${B.ok?B.trust.toUpperCase():"NOT CHECKED"}</span></b><span>${B.ok?`trust level: it was off by ${pc1(B.mape)} on average when it replayed the past`:"needs 9 or more months to check itself"}</span></div></div>
 <div class="leg" style="margin-top:14px"><span><b style="background:#1d1d1f"></b>Actual</span><span><b style="background:#0071e3"></b>Forecast, with its likely range</span>${alt?`<span><b style="background:#1f8a43"></b>With your changes</span>`:""}</div>
 ${lineChart(hist,f.map(x=>({mo:x.mo,v:x.opened,lo:x.lo,hi:x.hi})),{label:"Accounts opened, actual and forecast",alt})}
 <table class="ptab" style="margin-top:12px"><thead><tr><th>Month</th><th>People starting</th><th>Accounts opened</th><th>Likely range</th>${alt?"<th>With your changes</th>":""}${ly.some(v=>v!=null)?"<th>Same month last year</th>":""}</tr></thead><tbody>
 ${f.map((x,i)=>`<tr><td>${moLab(x.mo)}</td><td>${fmt(x.start)}</td><td><b>${fmt(x.opened)}</b></td><td>${rng(x.lo,x.hi)}</td>${alt?`<td style="color:#1f8a43"><b>${fmt(alt[i].v)}</b></td>`:""}${ly.some(v=>v!=null)?`<td>${ly[i]!=null?fmt(ly[i]):""}</td>`:""}</tr>`).join("")}</tbody></table>
 ${alt?`<div class="note" style="margin-top:10px">"With your changes" applies the fixes or step changes you set under Drop-off and ideas (${(r-1>=0?"+":"")+pc1(r-1)} accounts opened in the simulation) from the first forecast month. It assumes they go live then and work as set.</div>`:`<div class="hint" style="margin-top:10px">Tick fixes under Drop-off and ideas to see them here as a third line.</div>`}</div>
 ${validCard(p,R)}${patternCard(p,R)}`}
function validCard(p,R){const B=R.B;if(!B.ok)return`<div class="card"><h2>How much to trust it</h2><p class="lead">Athena checks itself by replaying the past: it forecasts months you already have and compares with what happened. That needs 9 or more months; this account has ${B.n}.</p></div>`;
 const pts=B.res.filter(r=>r.h===1),W=760,H=200,mg={l:56,r:16,t:12,b:28},mx=Math.max(...pts.map(r=>Math.max(r.ao,r.fo)))*1.1,X=i=>mg.l+(W-mg.l-mg.r)*(pts.length>1?i/(pts.length-1):.5),Y=v=>mg.t+(H-mg.t-mg.b)*(1-v/mx);
 let g="";pts.forEach((r,i)=>{if(i%2===0||i===pts.length-1)g+=`<text x="${X(i)}" y="${H-8}" font-size="11" text-anchor="middle" fill="#86868b">${moLab(r.mo)}</text>`});
 g+=`<polyline points="${pts.map((r,i)=>`${X(i)},${Y(r.ao)}`).join(" ")}" fill="none" stroke="#1d1d1f" stroke-width="2"/><polyline points="${pts.map((r,i)=>`${X(i)},${Y(r.fo)}`).join(" ")}" fill="none" stroke="#0071e3" stroke-width="2" stroke-dasharray="5 4"/>`+pts.map((r,i)=>`<circle cx="${X(i)}" cy="${Y(r.fo)}" r="3" fill="#0071e3"/>`).join("");
 const better=B.nape>0?1-B.mape/B.nape:0;
 return`<div class="card"><h2>How much to trust it</h2><p class="lead">Athena replayed the last ${new Set(B.res.map(r=>r.mo)).size} months: each time it forecast from only the months before, then compared with what actually happened.</p>
 <div class="pkpi"><div><b>${pc1(B.byH[0])}</b><span>off on average, 1 month ahead</span></div><div><b>${B.byH[2]!=null?pc1(B.byH[2]):"–"}</b><span>off on average, 3 months ahead</span></div>
 <div><b>${B.cov!=null?pc0(B.cov):"–"}</b><span>of the time, the real number landed inside Athena's likely range (aim: about 80%)</span></div>
 <div><b>${better>0?pc0(better)+" better":pc0(-better)+" worse"}</b><span>than a simple "same as last month" forecast, which was off by ${pc1(B.nape)}</span></div></div>
 <div class="leg" style="margin-top:14px"><span><b style="background:#1d1d1f"></b>What happened</span><span><b style="background:#0071e3"></b>What Athena forecast a month earlier</span></div>
 <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Forecast against actual, one month ahead" style="width:100%;height:auto;display:block">${g}</svg>
 <h3 class="fh3" style="margin-top:14px">Each step, one month ahead</h3><table class="ptab"><thead><tr><th>Step</th><th>Pass rate last month</th><th>Forecast was off by</th></tr></thead><tbody>
 ${p.series.steps.map((s,k)=>{const L=R.M[R.M.length-1].v[k];return`<tr><td>${esc(s)}</td><td>${L[0]?pc1(L[1]/L[0]):"–"}</td><td>${B.stepErr[k]!=null?(B.stepErr[k]*100).toFixed(1)+" points":"–"}</td></tr>`}).join("")}</tbody></table>
 <div class="note" style="margin-top:10px">Trust level: <b>High</b> when the replay was off by 5% or less on average and the range caught reality about two times in three or more; <b>Medium</b> up to 10%; <b>Low</b> above that. Campaigns, outages and policy changes the data doesn't show will still move the real numbers.</div></div>`}
function patternCard(p,R){const rh=rhythmOf(p.series),S=R.F.seas,items=[];
 if(R.seasonal){const m=S.slice(1).map((v,i)=>[i,v]).sort((a,b)=>b[1]-a[1]);items.push(`<li><b>Yearly pattern:</b> busiest in ${MSHORT[m[0][0]]} (${pc0(m[0][1]-1)} above an average month), quietest in ${MSHORT[m[11][0]]} (${pc0(1-m[11][1])} below). The forecast allows for it.</li>`)}
 else items.push(`<li><b>Yearly pattern:</b> not learned yet. It needs at least 13 months, and gets sharper with each extra year; this account has ${R.M.length}.</li>`);
 if(rh){const d=rh.dow.map((v,i)=>[i,v]).sort((a,b)=>b[1]-a[1]),DN=["Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays","Sundays"];items.push(`<li><b>Weekly rhythm:</b> most people start on ${DN[d[0][0]]} (${pc0(d[0][1]-1)} above an average day) and fewest on ${DN[d[6][0]]} (${pc0(1-d[6][1])} below).${rh.pay!=null&&Math.abs(rh.pay)>.05?` Around payday (the 25th to the 2nd), ${pc0(Math.abs(rh.pay))} ${rh.pay>0?"more":"fewer"} people start each day.`:""}</li>`)}
 const M=R.M;if(M.length>=6){const ch=p.series.steps.map((s,k)=>{const r=a=>{const e=a.reduce((x,m)=>x+m.v[k][0],0),c=a.reduce((x,m)=>x+m.v[k][1],0);return e?c/e:null},a=r(M.slice(-3)),b=r(M.slice(-6,-3));return a!=null&&b!=null?{s,a,b,d:a-b}:null}).filter(x=>x&&Math.abs(x.d)>=.015).sort((x,y)=>Math.abs(y.d)-Math.abs(x.d)).slice(0,3);
  ch.forEach(x=>items.push(`<li><b>${esc(x.s)}</b> ${x.d>0?"improved":"got worse"}: ${pc1(x.b)} of people passed it three months ago, ${pc1(x.a)} in the last three.</li>`))}
 return`<div class="card"><h2>Patterns in your data</h2><ul class="dypat">${items.join("")}</ul></div>`}
