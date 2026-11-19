// offline_forecast.js: Athena Offline's forecast and validation engines.
// Monthly model: people starting (damped trend + yearly pattern when there are 24+ months) times each step's
// pass rate (weighted recent average, plus a yearly pattern when there's enough history). Ranges come from how wrong
// the same model was when it replayed the past (rolling backtest), so the ranges are earned, not assumed.
const MDAYS=mo=>{const [y,m]=mo.split("-").map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate()};
const nextMo=mo=>{let [y,m]=mo.split("-").map(Number);m++;if(m>12){m=1;y++}return`${y}-${pad2(m)}`};
const lgt=p=>Math.log(Math.max(1e-4,Math.min(1-1e-4,p))/(1-Math.max(1e-4,Math.min(1-1e-4,p)))),ilg=x=>1/(1+Math.exp(-x));
const qtl=(a,q)=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),i=(s.length-1)*q,lo=Math.floor(i),hi=Math.ceil(i);return s[lo]+(s[hi]-s[lo])*(i-lo)};
// months from the series: starters, and entered/completed per step
// calendar weight of each day (day of the week, payday), learned from daily data; 1 for weekly or monthly data
function calW(series){const rh=rhythmOf(series);if(!rh)return null;const pay=1+(rh.pay||0);return ds=>{const dt=new Date(ds+"T00:00:00Z"),day=dt.getUTCDate();return rh.dow[(dt.getUTCDay()+6)%7]*((day>=25||day<=2)?pay:1)/(1+(pay-1)*8/30.4)}}
function monthW(mo,wf){const n=MDAYS(mo);if(!wf)return n;let s=0;for(let d=1;d<=n;d++)s+=wf(`${mo}-${pad2(d)}`);return s}
function monthly(series){const M={},wk=series.grain==="week",put=(mo,x,v)=>{const a=M[mo]||(M[mo]={mo,n:0,v:series.steps.map(()=>[0,0])});a.n+=wk?7*x:1;v.forEach((y,k)=>{if(y){a.v[k][0]+=y[0]*x;a.v[k][1]+=y[1]*x}})};
 // weekly rows are shared across the months their 7 days fall in, so a 5-week month isn't read as a busy month
 series.rows.forEach(r=>{if(!wk){put(r.d.slice(0,7),1,r.v);return}const t=Date.parse(r.d+"T00:00:00Z"),c={};for(let i=0;i<7;i++){const mo=new Date(t+864e5*i).toISOString().slice(0,7);c[mo]=(c[mo]||0)+1}for(const mo in c)put(mo,c[mo]/7,r.v)});
 const L=Object.values(M).sort((a,b)=>a.mo<b.mo?-1:1);
 // a part month at the end (daily or weekly data that stops mid-month) is scaled up so it isn't read as a drop
 if(series.grain!=="month"&&L.length){const last=L[L.length-1],exp=MDAYS(last.mo);if(last.n<exp*.9)L.pop();if(wk&&L.length&&L[0].n<MDAYS(L[0].mo)*.9)L.shift()}
 const wf=calW(series);L.forEach(m=>m.W=monthW(m.mo,wf));L.wf=wf;return L}
// one fitted model from months[0..n-1]
function fitModel(M,post){
 const n=M.length,K=M[0].v.length,pre=post?K-1:K;
 // people starting, per day of the month
 const rate=M.map(m=>m.v[0][0]/m.W);let seas=Array(13).fill(1);
 // yearly pattern: each month against the 12 months around it; needs 13+ months, and is trusted more with each extra year
 if(n>=13){const by={};for(let i=0;i<n;i++){const a=Math.max(0,Math.min(i-6,n-12)),w=rate.slice(a,a+12),mu=w.reduce((x,y)=>x+y,0)/w.length;(by[+M[i].mo.slice(5)]=by[+M[i].mo.slice(5)]||[]).push(rate[i]/mu)}
  for(let m=1;m<=12;m++){const v=by[m];if(!v)continue;const c=v.length,avg=v.reduce((x,y)=>x+y,0)/c,sh=c/(c+.5);seas[m]=1+(avg-1)*sh}const mu=seas.slice(1).reduce((a,b)=>a+b,0)/12;for(let m=1;m<=12;m++)seas[m]/=mu}
 const ds=rate.map((x,i)=>x/seas[+M[i].mo.slice(5)]);
 // damped Holt, smoothing picked by one-step-ahead error
 let best=null;for(const a of[.2,.35,.5,.7])for(const b of[0,.05,.15,.3])for(const phi of[.9,.98]){let l=ds[0],t=n>1?(ds[Math.min(n-1,3)]-ds[0])/Math.min(n-1,3):0,sse=0;
  for(let i=1;i<n;i++){const f=l+phi*t,e=ds[i]-f;sse+=e*e;const l2=a*ds[i]+(1-a)*f;t=b*(l2-l)+(1-b)*phi*t;l=l2}if(!best||sse<best.sse)best={a,b,phi,l,t,sse}}
 // each step's pass rate on the logit scale: weighted recent average, plus a yearly pattern with 24+ months
 const steps=[];for(let k=0;k<K;k++){const p=M.map(m=>m.v[k][0]>0?m.v[k][1]/m.v[k][0]:null),z=p.map(x=>x==null?null:lgt(x));
  let bestA=null;for(const a of[.15,.3,.5,.7]){let lv=z.find(x=>x!=null),se=0;z.forEach((x,i)=>{if(x==null||i===0)return;se+=(x-lv)*(x-lv);lv=a*x+(1-a)*lv});if(!bestA||se<bestA.se)bestA={a,se}}
  let lv=z.find(x=>x!=null)??0;z.forEach(x=>{if(x!=null)lv=bestA.a*x+(1-bestA.a)*lv});
  const off=Array(13).fill(0);if(n>=24){const by={};z.forEach((x,i)=>{if(x==null)return;const w=z.slice(Math.max(0,i-6),i+7).filter(v=>v!=null),mu=w.reduce((s,v)=>s+v,0)/w.length;(by[+M[i].mo.slice(5)]=by[+M[i].mo.slice(5)]||[]).push(x-mu)});for(let m=1;m<=12;m++)off[m]=by[m]?.5*by[m].reduce((s,v)=>s+v,0)/by[m].length:0}
  steps.push({lv,off})}
 return{last:M[n-1].mo,seas,h:best,steps,pre,K,wf:M.wf}}
// forecast h months ahead from a fitted model
function fcast(F,h){const out=[];let mo=F.last,l=F.h.l,t=F.h.t,damp=0;
 for(let i=1;i<=h;i++){mo=nextMo(mo);damp+=Math.pow(F.h.phi,i);const m=+mo.slice(5),start=Math.max(0,(l+damp*t))*F.seas[m]*monthW(mo,F.wf);
  const pass=F.steps.map(s=>ilg(s.lv+s.off[m]));let e=start;const st=pass.map((p,k)=>{const r={e,c:e*p};e=r.c;return r});
  out.push({mo,start,steps:st,opened:st[F.pre-1].c,active:F.pre<F.K?st[F.K-1].c:null})}
 return out}
// "same as last month": the simple forecast Athena has to beat
function naive(M,h){const L=M[M.length-1],out=[];let mo=L.mo;for(let i=1;i<=h;i++){mo=nextMo(mo);out.push({mo,start:L.v[0][0],opened:null})}return out}

// ---------- validation engine: replay the past ----------
function backtest(p){const M=monthly(p.series),post=p.steps.length&&p.steps[p.steps.length-1].post,n=M.length,res=[];if(n<9)return{n,res,ok:false};
 const pre=post?M[0].v.length-1:M[0].v.length,op=m=>m.v[pre-1][1];
 for(let t=n>=24?n-12:Math.max(6,n-15);t<n;t++){const Ms=M.slice(0,t);Ms.wf=M.wf;const F=fitModel(Ms,post),f=fcast(F,3),nv=M[t-1];
  f.forEach((x,i)=>{const a=M[t+i];if(!a)return;res.push({h:i+1,mo:x.mo,fo:x.opened,ao:op(a),fs:x.start,as:a.v[0][0],no:op(nv),
   steps:x.steps.map((s,k)=>({f:s.e>0?s.c/s.e:null,a:a.v[k][0]>0?a.v[k][1]/a.v[k][0]:null}))})})}
 const ape=r=>Math.abs(r.fo/r.ao-1),byH=[1,2,3].map(h=>{const R=res.filter(r=>r.h===h);return R.length?R.reduce((s,r)=>s+ape(r),0)/R.length:null});
 const mape=res.reduce((s,r)=>s+ape(r),0)/Math.max(1,res.length),nape=res.reduce((s,r)=>s+Math.abs(r.no/r.ao-1),0)/Math.max(1,res.length);
 // ranges: from the spread of errors at each horizon, tested on each replay without its own error (fair coverage)
 const lr=h=>res.filter(r=>r.h===h).map(r=>Math.log(r.ao/r.fo));let hit=0,tot=0;
 res.forEach((r,i)=>{const o=res.filter((x,j)=>x.h===r.h&&j!==i).map(x=>Math.log(x.ao/x.fo));if(o.length<3)return;tot++;const v=Math.log(r.ao/r.fo),k=1+1/Math.sqrt(o.length),mid=qtl(o,.5);if(v>=mid+(qtl(o,.1)-mid)*k&&v<=mid+(qtl(o,.9)-mid)*k)hit++});
 // a few replays make ranges look tighter than they are: widen them by the small-sample factor
 const band=[1,2,3].map(h=>{const e=lr(h);if(e.length<3)return null;const k=1+1/Math.sqrt(e.length),mid=qtl(e,.5);return[mid+(qtl(e,.1)-mid)*k,mid+(qtl(e,.9)-mid)*k]});
 const stepErr=M[0].v.map((_,k)=>{const d=res.filter(r=>r.h===1&&r.steps[k].a!=null).map(r=>Math.abs(r.steps[k].f-r.steps[k].a));return d.length?d.reduce((a,b)=>a+b,0)/d.length:null});
 const cov=tot?hit/tot:null,trust=mape<=.05&&(cov==null||cov>=.65)?"High":mape<=.1?"Medium":"Low";
 return{n,res,ok:true,mape,byH,nape,cov,band,stepErr,trust,pre}}
// the forecast to show: fitted on all months, with ranges from the backtest
function forecastOf(p){const M=monthly(p.series),post=p.steps.length&&p.steps[p.steps.length-1].post;if(M.length<4)return null;
 const F=fitModel(M,post),f=fcast(F,3),B=backtest(p),sd=.06;
 f.forEach((x,i)=>{const b=B.ok&&B.band[i]?B.band[i]:[-1.28*sd*Math.sqrt(i+1),1.28*sd*Math.sqrt(i+1)];x.lo=x.opened*Math.exp(b[0]);x.hi=x.opened*Math.exp(b[1]);x.slo=x.start*Math.exp(b[0]);x.shi=x.start*Math.exp(b[1])});
 return{M,F,f,B,seasonal:M.length>=13}}
// the weekly rhythm in daily data: which days are busier, and the payday lift
function rhythmOf(series){if(series.grain!=="day")return null;const dw=Array(7).fill(0),dn=Array(7).fill(0);let pay=0,pn=0,oth=0,on=0;
 series.rows.forEach(r=>{const v=r.v[0]?r.v[0][0]:0,dt=new Date(r.d+"T00:00:00Z"),w=(dt.getUTCDay()+6)%7,day=dt.getUTCDate();dw[w]+=v;dn[w]++;if(day>=25||day<=2){pay+=v;pn++}else{oth+=v;on++}});
 const avg=dw.map((v,i)=>dn[i]?v/dn[i]:0),mu=avg.reduce((a,b)=>a+b,0)/7;return{dow:avg.map(v=>mu?v/mu:1),pay:pn&&on&&oth?(pay/pn)/(oth/on)-1:null}}
