// ===== Journey engine: persona-based, calibrated to funnel data =====
const TAGS=["none","select","elig","details","idcap","verify","fica","decision","sign","activate"];
const TAGSENS={idcap:1,verify:1,fica:.8,sign:.5};
const LEV=[
 ["reuse","Reuse verified identity (One ID): existing customers skip ID, verification, FICA"],
 ["instant","Instant ID check (Identity Instant): fewer failures, faster"],
 ["fields","Prefill and fewer form fields"],
 ["fica","Auto proof-of-address and income lookup"],
 ["decision","Instant pre-approval decision"],
 ["resume","Save and resume across sessions"],
 ["nudge","Activation nudges (first transaction)"]];
const L={reuse:0,instant:0,fields:0,fica:0,decision:0,resume:0,nudge:0,redirect:0,soft:0,guide:0,trust:0,speed:0};
const ZERO=()=>({reuse:0,instant:0,fields:0,fica:0,decision:0,resume:0,nudge:0,redirect:0,soft:0,guide:0,trust:0,speed:0});
const PRESETS={"Baseline":{},"One ID":{reuse:.7},"Identity Instant":{instant:.7},"Both + prefill":{reuse:.7,instant:.7,fields:.5,fica:.4},
 "All levers":{reuse:.7,instant:.7,fields:.5,fica:.5,decision:.5,resume:.6,nudge:.4}};
const P={arr:1200,days:30,seed:7};
const HEXTA=26;
let PRODUCTS=[],SEL=0,PREV=null,BASE,SCEN,hmMode="rate",hmView="s",snapView="s",selStep=0;

// ---------- math ----------
const clampJ=(x,a,b)=>Math.min(b,Math.max(a,x));
const netDrop=(p,rp)=>p*(1-rp*(1-p/2));
function invNet(t,rp){if(t<=0)return 0;if(t>=netDrop(1,rp))return 1;let a=0,b=1;for(let i=0;i<40;i++){const m=(a+b)/2;netDrop(m,rp)<t?a=m:b=m}return(a+b)/2}
function wilson(x,n,z=1.96){if(n<=0)return[0,1];const p=x/n,d=1+z*z/n,c=p+z*z/(2*n),m=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return[(c-m)/d,(c+m)/d]}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function norm(u1,u2){return Math.sqrt(-2*Math.log(u1||1e-9))*Math.cos(6.283185307*u2)}

// ---------- product model ----------
// how likely a persona is to give each reason for leaving (assumptions, used to make synthetic feedback persona-specific)
function rwt(nm,pe){let w=1;const tE=pe.techE||0,a=pe.name||"";
 if(/camera|glare|liveness|check failed|upload|file too|phone too slow|network|timeout|otp/i.test(nm))w*=Math.max(.3,1+1.5*tE);
 if(/network|timeout|otp|upload|file too/i.test(nm)&&/Grant|Survivor|Informal|Commuter|Pension/.test(a))w*=1.5;
 if(/too long|too much|terms|t&cs|unclear|worried|unsure why/i.test(nm))w*=Math.max(.4,pe.dwell||1);
 if(/privacy|unsure why|declined|worried/i.test(nm)&&/Security|Pension|Community/.test(a))w*=2;
 if(/no proof|not at hand|not to hand|no id/i.test(nm)){if(pe.seg==="new")w*=1.3;if(/Grant|Survivor|Informal|Hustler|Township|First Salary/.test(a))w*=1.7}
 if(/comparing|no real intent|just looking|changed mind/i.test(nm))w*=Math.max(.4,1-1.2*tE);
 if(/branch/i.test(nm)&&/Pension|Informal|Grant|Survivor|Security/.test(a))w*=2;
 if(/qualify/i.test(nm)&&(pe.elig==null?1:pe.elig)<.8)w*=1.6;
 return w}
function pickReason(rs,pe,x){const ws=rs.map(r=>r[1]*rwt(r[0],pe)),T=ws.reduce((a,b)=>a+b,0);let a=0;for(let i=0;i<rs.length;i++){a+=ws[i]/T;if(x<=a)return rs[i][0]}return rs[rs.length-1][0]}
function mkStep(name,tag,net,med,resume,extra){return Object.assign({name,tag,net,med,resume,sens:TAGSENS[tag]||0,post:false,delta:0,dtime:0,skip:"none",reasons:null,window:14},extra||{})}
function demoProduct(){
 const R=(a)=>a;
 const steps=[
  mkStep("Choose account","select",.10,1.5,.10,{reasons:[["Comparing offers elsewhere",.4],["Unclear fees or features",.35],["No real intent",.25]]}),
  mkStep("Personal details","details",.14,3.5,.10,{reasons:[["Form too long",.4],["Info not at hand",.3],["Privacy concern",.3]]}),
  mkStep("ID capture","idcap",.16,2,.12,{reasons:[["Camera or glare failure",.45],["No ID to hand",.35],["Passport or non-SA ID friction",.2]]}),
  mkStep("Identity verification","verify",.20,2.5,.12,{reasons:[["Liveness failed repeatedly",.4],["Record lookup mismatch",.3],["Network timeout",.3]]}),
  mkStep("FICA documents","fica",.30,8,.20,{reasons:[["No proof of address to hand",.5],["Upload or size errors",.25],["Prefers a branch",.25]]}),
  mkStep("Risk decision","decision",.08,1,.05,{reasons:[["Declined by risk rules",.55],["Referred for manual review wait",.45]]}),
  mkStep("T&Cs and e-sign","sign",.09,2,.12,{reasons:[["T&Cs too long",.4],["OTP not received",.4],["Changed mind",.2]]}),
  mkStep("Account opened → first transaction","activate",.35,0,0,{post:true,reasons:[["Never made a first transaction",1]]})];
 const pers=illustrativePersonas(steps);
 const p={id:"demo",name:"Demo product (illustrative)",src:"demo",steps,personas:pers.personas,pm:pers.pm,personaSrc:"assumed",obs:null,months:[]};
 calibrate(p);return p;
}
function illustrativePersonas(steps){
 const T={ // multipliers by tag
  a:{details:.6,idcap:.7,verify:.7,fica:.6},
  b:{select:1.1,details:.8,sign:1.2,activate:1.2,fica:1.0},
  c:{},
  d:{details:1.2,idcap:1.1,fica:1.35,decision:1.4,activate:1.2},
  e:{idcap:1.1,verify:1.1,sign:1.2}};
 const personas=[
  {name:"Existing · digital-first",share:30,seg:"existing",techE:-.15,dwell:.8,key:"a"},
  {name:"Existing · branch-leaning",share:15,seg:"existing",techE:.1,dwell:1.3,key:"b"},
  {name:"New · confident digital",share:25,seg:"new",techE:0,dwell:1,key:"c"},
  {name:"New · first-time banked",share:20,seg:"new",techE:.3,dwell:1.5,key:"d"},
  {name:"Low-bandwidth / entry device",share:10,seg:"new",techE:.5,dwell:1.6,key:"e"}];
 const pm=personas.map(p=>steps.map(s=>T[p.key][s.tag]||1));
 personas.forEach(p=>delete p.key);
 return{personas,pm};
}
// solve each step's raw drop so the persona-blended NET drop equals the step's target
function calibrate(prod){
 const K=prod.steps.length,J=prod.personas.length,tot=prod.personas.reduce((a,p)=>a+(+p.share||0),0)||1;
 let S=prod.personas.map(p=>(+p.share||0)/tot);prod.h=[];prod.pnet=[];
 for(let k=0;k<K;k++){
  const s=prod.steps[k];
  const pk=(j,h)=>clampJ(h*prod.pm[j][k]*(1+s.sens*prod.personas[j].techE),0,.98);
  const ie=j=>s.tag==="elig"?1-(prod.personas[j].elig==null?1:prod.personas[j].elig):0;
  const tj=(j,h)=>ie(j)+(1-ie(j))*netDrop(pk(j,h),Math.min(.9,s.resume*rfOf(prod.personas[j])));
  const blend=h=>{let n=0,d=0;for(let j=0;j<J;j++){n+=S[j]*tj(j,h);d+=S[j]}return d>0?n/d:0};
  let lo=0,hi=20;for(let i=0;i<50;i++){const m=(lo+hi)/2;blend(m)<s.net?lo=m:hi=m}
  const h=(lo+hi)/2;prod.h[k]=h;prod.pnet[k]=S.map((_,j)=>tj(j,h));
  S=S.map((x,j)=>x*(1-prod.pnet[k][j]));
 }
}

// ===== Behaviour layer: how each persona acts and talks (from the persona behaviour guide). Every trait is an assumption for research to refine. =====
const BTRAIT={"The Provider": {"err": "M", "back": "L", "terms": "Skims", "distract": "M", "ret": 25, "reading": "Average", "english": "Comfortable", "retries": 2, "stuck": "ask someone", "quit": "fica", "mood": "Calm", "style": "blunt", "polite": "M", "maxW": 15, "patience": "M", "motivation": "H", "trust": "M", "lang": "isiZulu", "dev": "mid", "dat": "prepaid"}, "The Hustler": {"err": "M", "back": "M", "terms": "Skips", "distract": "H", "ret": 30, "reading": "Average", "english": "Comfortable", "retries": 2, "stuck": "try a workaround", "quit": "details", "mood": "Rushed", "style": "complainer", "polite": "L", "maxW": 12, "patience": "L", "motivation": "H", "trust": "M", "lang": "isiZulu", "dev": "mid", "dat": "prepaid"}, "The First Salary Earner": {"err": "M", "back": "M", "terms": "Skims", "distract": "M", "ret": 25, "reading": "Average", "english": "Comfortable", "retries": 3, "stuck": "ask someone", "quit": "fica", "mood": "Rushed", "style": "chatty", "polite": "H", "maxW": 25, "patience": "M", "motivation": "H", "trust": "M", "lang": "Sesotho", "dev": "mid", "dat": "prepaid"}, "The Young Climber": {"err": "L", "back": "L", "terms": "Skips", "distract": "M", "ret": 15, "reading": "Strong", "english": "Fluent", "retries": 1, "stuck": "give up", "quit": "details", "mood": "Rushed", "style": "blunt", "polite": "L", "maxW": 8, "patience": "L", "motivation": "M", "trust": "H", "lang": "English", "dev": "high", "dat": "wifi"}, "The Informal Trader": {"err": "H", "back": "M", "terms": "Skips", "distract": "H", "ret": 30, "reading": "Basic", "english": "Home language first", "retries": 2, "stuck": "ask someone", "quit": "fica", "mood": "Stressed", "style": "chatty", "polite": "H", "maxW": 20, "patience": "M", "motivation": "M", "trust": "L", "lang": "isiZulu", "dev": "entry", "dat": "light"}, "The Township Entrepreneur": {"err": "M", "back": "M", "terms": "Skims", "distract": "H", "ret": 25, "reading": "Average", "english": "Home language first", "retries": 2, "stuck": "go to a branch", "quit": "fica", "mood": "Rushed", "style": "complainer", "polite": "M", "maxW": 15, "patience": "M", "motivation": "H", "trust": "M", "lang": "Setswana", "dev": "mid", "dat": "prepaid"}, "The Community Builder": {"err": "M", "back": "M", "terms": "Reads", "distract": "M", "ret": 30, "reading": "Average", "english": "Home language first", "retries": 3, "stuck": "ask someone", "quit": "sign", "mood": "Calm", "style": "chatty", "polite": "H", "maxW": 25, "patience": "H", "motivation": "M", "trust": "L", "lang": "isiZulu", "dev": "mid", "dat": "prepaid"}, "The Grant Receiver": {"err": "H", "back": "M", "terms": "Skips", "distract": "H", "ret": 20, "reading": "Basic", "english": "Home language first", "retries": 2, "stuck": "go to a branch", "quit": "idcap", "mood": "Stressed", "style": "quiet", "polite": "H", "maxW": 8, "patience": "M", "motivation": "M", "trust": "L", "lang": "isiXhosa", "dev": "entry", "dat": "light"}, "The Pension Caregiver": {"err": "H", "back": "H", "terms": "Reads", "distract": "M", "ret": 20, "reading": "Basic", "english": "Home language first", "retries": 3, "stuck": "ask someone", "quit": "verify", "mood": "Calm", "style": "suspicious", "polite": "H", "maxW": 15, "patience": "H", "motivation": "M", "trust": "L", "lang": "Sepedi", "dev": "entry", "dat": "light"}, "The Saver": {"err": "L", "back": "L", "terms": "Reads", "distract": "L", "ret": 25, "reading": "Strong", "english": "Comfortable", "retries": 3, "stuck": "retry alone", "quit": "decision", "mood": "Relaxed", "style": "easy", "polite": "M", "maxW": 12, "patience": "H", "motivation": "M", "trust": "M", "lang": "Setswana", "dev": "mid", "dat": "prepaid"}, "The Asset Aspirer": {"err": "L", "back": "L", "terms": "Reads", "distract": "L", "ret": 20, "reading": "Strong", "english": "Fluent", "retries": 2, "stuck": "retry alone", "quit": "decision", "mood": "Calm", "style": "blunt", "polite": "L", "maxW": 10, "patience": "M", "motivation": "H", "trust": "M", "lang": "Afrikaans", "dev": "high", "dat": "wifi"}, "The Security Seeker": {"err": "M", "back": "M", "terms": "Reads", "distract": "M", "ret": 15, "reading": "Average", "english": "Comfortable", "retries": 2, "stuck": "call the bank", "quit": "verify", "mood": "Stressed", "style": "suspicious", "polite": "L", "maxW": 15, "patience": "M", "motivation": "M", "trust": "L", "lang": "isiZulu", "dev": "mid", "dat": "prepaid"}, "The Commuter": {"err": "M", "back": "M", "terms": "Skips", "distract": "H", "ret": 35, "reading": "Average", "english": "Comfortable", "retries": 2, "stuck": "give up", "quit": "details", "mood": "Rushed", "style": "blunt", "polite": "M", "maxW": 8, "patience": "L", "motivation": "M", "trust": "M", "lang": "siSwati", "dev": "mid", "dat": "prepaid"}, "The Connected Customer": {"err": "L", "back": "L", "terms": "Skips", "distract": "M", "ret": 10, "reading": "Strong", "english": "Fluent", "retries": 1, "stuck": "give up", "quit": "details", "mood": "Rushed", "style": "complainer", "polite": "L", "maxW": 10, "patience": "L", "motivation": "M", "trust": "H", "lang": "English", "dev": "high", "dat": "wifi"}, "The Side-Hustle Professional": {"err": "L", "back": "M", "terms": "Skims", "distract": "M", "ret": 20, "reading": "Strong", "english": "Fluent", "retries": 2, "stuck": "try a workaround", "quit": "details", "mood": "Rushed", "style": "blunt", "polite": "M", "maxW": 10, "patience": "M", "motivation": "H", "trust": "M", "lang": "Sepedi", "dev": "high", "dat": "wifi"}, "The Single Parent": {"err": "M", "back": "M", "terms": "Skims", "distract": "H", "ret": 35, "reading": "Average", "english": "Comfortable", "retries": 2, "stuck": "retry alone", "quit": "details", "mood": "Stressed", "style": "easy", "polite": "H", "maxW": 12, "patience": "L", "motivation": "H", "trust": "M", "lang": "Sesotho", "dev": "mid", "dat": "prepaid"}, "The Emerging Professional": {"err": "L", "back": "L", "terms": "Skips", "distract": "L", "ret": 10, "reading": "Strong", "english": "Fluent", "retries": 1, "stuck": "give up", "quit": "verify", "mood": "Rushed", "style": "complainer", "polite": "L", "maxW": 10, "patience": "L", "motivation": "M", "trust": "H", "lang": "English", "dev": "high", "dat": "wifi"}, "The Established Provider": {"err": "L", "back": "L", "terms": "Skims", "distract": "M", "ret": 15, "reading": "Strong", "english": "Fluent", "retries": 1, "stuck": "call the bank", "quit": "details", "mood": "Calm", "style": "blunt", "polite": "L", "maxW": 10, "patience": "L", "motivation": "M", "trust": "H", "lang": "Afrikaans", "dev": "high", "dat": "wifi"}, "The Digitally Curious": {"err": "M", "back": "H", "terms": "Reads", "distract": "M", "ret": 30, "reading": "Average", "english": "Comfortable", "retries": 3, "stuck": "ask someone", "quit": "sign", "mood": "Calm", "style": "chatty", "polite": "H", "maxW": 20, "patience": "H", "motivation": "M", "trust": "M", "lang": "English", "dev": "mid", "dat": "prepaid"}, "The Financial Survivor": {"err": "H", "back": "M", "terms": "Skips", "distract": "H", "ret": 20, "reading": "Basic", "english": "Home language first", "retries": 1, "stuck": "give up", "quit": "fica", "mood": "Stressed", "style": "quiet", "polite": "M", "maxW": 6, "patience": "L", "motivation": "L", "trust": "L", "lang": "isiZulu", "dev": "entry", "dat": "light"}};
const BDEF={err:"M",back:"M",terms:"Skims",distract:"M",ret:25,reading:"Average",english:"Comfortable",retries:2,stuck:"retry alone",quit:null,mood:"Calm",style:"blunt",polite:"M",maxW:12,patience:"M",motivation:"M",trust:"M",lang:"English",dev:"mid",dat:"prepaid"};
const btr=pe=>BTRAIT[pe&&pe.name]||BDEF,LMH={L:.6,M:1,H:2},MOODS=["Relaxed","Calm","Rushed","Stressed"],MOODF=[.85,.95,1.1,1.25],MOODT=[1.05,1,.85,1.1],TERMSQ={Reads:.1,Skims:.4,"Skips":.75};
// how readily a persona comes back after a failed attempt, relative to an average customer
function rfOf(pe){const B=btr(pe);return Math.max(.4,Math.min(1.8,(B.ret/25)*({L:.8,M:1,H:1.2}[B.patience]||1)*({L:.85,M:1,H:1.1}[B.motivation]||1)))}
// chance of each non-linear event on a screen, and how much it raises the chance of leaving there
function evQ(B,tag,mi){const busy=["sign","details","decision","fica"].includes(tag);return[
 ["m",Math.min(.6,.04*(B.err==="H"?2.5:LMH[B.err])*(B.dev==="entry"?1.5:1)*(mi>=2?1.5:1)),1.5],
 ["b",Math.min(.5,.05*LMH[B.back]),1.15],
 ["s",tag==="sign"?TERMSQ[B.terms]||.4:0,.8],
 ["i",Math.min(.5,.04*LMH[B.distract]*(B.dat!=="wifi"?1.4:1)),2],
 ["r",Math.min(.5,.03*(B.reading==="Basic"?2:1)*(busy?1.5:1)),1.3],
 ["w",Math.min(.5,.03*(B.reading==="Basic"?2:1)*(B.english==="Home language first"?1.5:1)),1.4]]}
const moodIdx=B=>Math.max(0,MOODS.indexOf(B.mood));
function moodE(B){const b=moodIdx(B);let s=0;for(const d of[-1,0,1])s+=MOODF[Math.max(0,Math.min(3,b+d))];return s/3}
const INTR={wifi:["a call came in","the kids needed me","load-shedding"],prepaid:["my data ran out","a call came in","load-shedding","the taxi signal dropped"],light:["my data ran out","my data ran out","the signal dropped","load-shedding"]};

// ---------- simulation ----------
function simJ(prod,lev,P){
 const st=prod.steps,K=st.length,pers=prod.personas,J=pers.length,H=P.days+HEXTA,main=mulberry(P.seed*101+3),W=[1.1,1.15,1.1,1.05,1.2,.8,.6];
 const tot=pers.reduce((a,p)=>a+(+p.share||0),0)||1,cum=[];let c0=0;pers.forEach(p=>{c0+=(+p.share||0)/tot;cum.push(c0)});
 const R={H,K,starts:new Float64Array(H),opened:new Float64Array(H),done:new Float64Array(H),
  att:Array(K).fill(0),skip:Array(K).fill(0),fail:Array(K).fill(0),rec:Array(K).fill(0),why:Array.from({length:K},()=>({})),
  perp:pers.map(()=>({n:0,opened:0,done:0,inel:0,att:Array(K).fill(0),fail:Array(K).fill(0)})),inel:Array(K).fill(0),redir:0,cust:[],openN:0,doneN:0};
 const hasPost=st.some(s=>s.post);let id=0;
 for(let d=0;d<P.days;d++){
  const lam=P.arr*W[d%7],n=Math.max(0,Math.round(lam+Math.sqrt(lam)*norm(main(),main())));
  for(let i=0;i<n;i++){
   const r=mulberry(P.seed*7919+id*104729+13);id++;
   const pu=r();let j=cum.findIndex(x=>pu<=x);if(j<0)j=J-1;
   const pe=pers[j],reuseU=r(),eligU=r(),t0s=d+.25+r()*.7,B=btr(pe),mi=Math.max(0,Math.min(3,moodIdx(B)+Math.floor(r()*3)-1)),rfp=rfOf(pe);let ev=null,act="";
   let t=t0s,path=[],status=null,dropK=-1,endT=0,open=-1,redir=false,rs="";R.starts[d]++;R.perp[j].n++;
   for(let k=0;k<K;k++){
    const s=st[k],u=[r(),r(),r(),r(),r(),r()],tag=s.tag;
    const reuse=pe.seg==="existing"&&lev.reuse>0&&(tag==="idcap"||tag==="verify"||tag==="fica")&&reuseU<lev.reuse;
    if(reuse||s.skip==="all"||(s.skip==="existing"&&pe.seg==="existing")){R.skip[k]++;if(s.post){open=t;R.openN++;R.opened[Math.min(H-1,Math.floor(t))]++}continue}
    R.att[k]++;R.perp[j].att[k]++;
    let tm=1,lm=1;
    if(tag==="details"){lm=1-.5*lev.fields;tm=1-.3*lev.fields}
    if(tag==="idcap"){lm=1-.5*lev.instant;tm=1-.5*lev.instant}
    if(tag==="verify"){lm=1-.6*lev.instant;tm=1-.5*lev.instant}
    if(tag==="fica"){lm=1-.6*lev.fica;tm=1-.5*lev.fica}
    if(tag==="decision"){lm=1-.5*lev.decision;tm=1-.8*lev.decision}
    if(lev.soft>0){const sf=lev.soft;   // Soft Banking Profile: light profile first, checks later with the profile already saved
     if(tag==="details"){lm*=1-.3*sf;tm*=1-.25*sf}
     else if(tag==="idcap"||tag==="verify")lm*=1-.2*sf;
     else if(tag==="fica"){lm*=1-.4*sf;tm*=1-.4*sf}
     else if(tag==="decision")lm*=1-.12*sf;
     else if(tag==="sign")lm*=1-.15*sf}
    // general ideas that apply to any flow (assumed effect sizes)
    if(!s.post){if(lev.guide>0)lm*=1-.2*lev.guide;if(lev.speed>0){tm*=1-.4*lev.speed;lm*=1-.08*lev.speed}
     if(lev.trust>0&&(tag==="verify"||tag==="decision"||tag==="sign"||tag==="idcap"))lm*=1-.25*lev.trust}
    if(s.post)lm*=1-.4*lev.nudge;
    lm*=1+s.delta/100;tm*=Math.max(.05,1+s.dtime/100);
    const te=1+s.sens*pe.techE;
    let ind=1,evk="",xt=0;
    if(!s.post&&tag!=="elig"){const Q=evQ(B,tag,mi);let D=moodE(B);ind=MOODF[mi];
     for(const[c,q,F]of Q){D*=1+q*(F-1);if(q>0&&r()<q){ind*=F;evk+=c}}ind/=D;
     if(evk){(ev=ev||[]).push([k,evk])}}
    const p=clampJ(prod.h[k]*prod.pm[j][k]*te*lm*ind,0,.95);
    if(s.post){
     open=t;R.openN++;R.opened[Math.min(H-1,Math.floor(t))]++;
     if(u[2]<p){status="drop";dropK=k;endT=t+s.window;R.fail[k]++;R.perp[j].fail[k]++;rs=s.reasons?pickReason(s.reasons,pe,(u[5]*7919)%1):"Never made a first transaction";R.why[k][rs]=(R.why[k][rs]||0)+1;path.push({k,t0:t,t1:endT})}
     else{status="done";endT=t+.2+u[1]*(s.window-.2)*(1-.35*lev.nudge);path.push({k,t0:t,t1:endT})}
     break;
    }
    let dwell=s.med*tm*pe.dwell*te*MOODT[mi]*Math.exp(.6*norm(u[0],u[1]))/1440;
    if(evk){if(evk.includes("s"))dwell*=.3;if(evk.includes("m"))dwell+=dwell*.3+.5/1440;if(evk.includes("b"))dwell*=1.5;if(evk.includes("r"))dwell*=1.6;if(evk.includes("w"))dwell*=1.4}
    let a0=t,a1=t+dwell;path.push({k,t0:a0,t1:a1});
    if(tag==="elig"&&eligU>(pe.elig==null?1:pe.elig)){
     R.fail[k]++;R.perp[j].fail[k]++;R.inel[k]++;R.perp[j].inel++;
     const rd=u[3]<lev.redirect;if(rd)R.redir++;
     const w=rd?"Not eligible (redirected to another account)":"Not eligible";R.why[k][w]=(R.why[k][w]||0)+1;rs=w;
     status="drop";dropK=k;endT=a1;redir=rd;break}
    if(u[2]<p){
     const rp=Math.min(.9,s.resume*rfp+lev.resume*.35+lev.soft*.2);let recovered=false;
     if(u[3]<rp){const delay=.25-Math.log(u[4]||1e-9)*1.5;a0=a1+delay;a1=a0+dwell*.7;path.push({k,t0:a0,t1:a1});
      if(((u[5]*9973)%1)>p*.5){recovered=true;R.rec[k]++;act=B.stuck==='ask someone'||B.stuck==='try a workaround'?B.stuck:'retry alone'}}
     if(!recovered){R.fail[k]++;R.perp[j].fail[k]++;
      const xr=r(),xa=r();
      if(evk.includes("i")&&xr<.5){const L=INTR[B.dat]||INTR.prepaid;rs="Got interrupted: "+L[Math.floor(xa*L.length)]}
      else if(xr<.12)rs="No clear reason";
      else if(s.reasons)rs=pickReason(s.reasons,pe,(u[5]*7919)%1);
      if(rs)R.why[k][rs]=(R.why[k][rs]||0)+1;
      act=(B.stuck==="go to a branch"||B.stuck==="call the bank")&&xa<.6?B.stuck:B.stuck==="ask someone"&&xa<.4?"asked someone, still stopped":"gave up";
      status="drop";dropK=k;endT=a1;break}
     t=a1;
    }else t=a1;
    if(evk.includes("i")&&!status)t+=.05+r()*.25;
   }
   if(!status){status="done";endT=t;if(!hasPost){open=t;R.openN++;R.opened[Math.min(H-1,Math.floor(t))]++}}
   if(status==="done"){R.doneN++;R.done[Math.min(H-1,Math.floor(endT))]++;R.perp[j].done++}
   if(open>=0)R.perp[j].opened++;
   R.cust.push({j,start:t0s,path,status,dropK,endT,open,redir,rs,mi,ev,act});
  }
 }
 R.entered=Array.from({length:K},(_,k)=>R.att[k]+R.skip[k]);
 return R;
}
function snapshot(R,t){
 const K=R.K,inflight=Array(K).fill(0),dropped=Array(K).fill(0);let arrived=0,opened=0,done=0,fl=0,dr=0;
 for(const c of R.cust){
  if(c.start>t)continue;arrived++;if(c.open>=0&&c.open<=t)opened++;
  if(t>=c.endT){if(c.status==="drop"){dropped[c.dropK]++;dr++}else done++}
  else{let s=0;for(const e of c.path){if(e.t0<=t)s=e.k;else break}inflight[s]++;fl++}
 }
 return{inflight,dropped,arrived,opened,done,fl,dr};
}

// ---------- data import ----------
function guessTag(n){const s=n.toLowerCase();
 if(/activat|first.?trans|funded|first.?deposit/.test(s))return"activate";
 if(/eligib|qualif|criteria/.test(s))return"elig";
 if(/verif|liveness|selfie|biometric|dha|kyc/.test(s))return"verify";
 if(/id.?(capture|scan|upload|doc)|capture|passport|identity doc|id number/.test(s))return"idcap";
 if(/fica|address|income|proof|payslip|document/.test(s))return"fica";
 if(/decision|credit|risk|approv|afford/.test(s))return"decision";
 if(/sign|terms|t&c|otp|consent|agreement/.test(s))return"sign";
 if(/detail|personal|form|info|profile/.test(s))return"details";
 if(/select|choose|product|account type/.test(s))return"select";
 return"none"}
function parseData(text){
 const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
 if(lines.length<2)return{err:"Paste a header row and at least one data row."};
 const dl=[",","\t",";"].map(d=>[d,lines[0].split(d).length]).sort((a,b)=>b[1]-a[1])[0][0];
 const hdr=lines[0].split(dl).map(h=>h.trim().toLowerCase().replace(/[^a-z_ ]/g,"").replace(/ +/g,"_"));
 const ix=(...n)=>hdr.findIndex(h=>n.includes(h));
 const c={product:ix("product","product_name"),persona:ix("persona","segment"),step:ix("step","step_name","stage"),no:ix("step_no","step_order","order"),
  e:ix("entered","started","reached","visitors","sessions"),c:ix("completed","passed","succeeded","converted"),month:ix("month","period"),med:ix("median_minutes","median_mins","median_time_min")};
 if(c.step<0||c.e<0||c.c<0)return{err:"Missing required columns. Need step, entered and completed. Found: "+hdr.join(", ")};
 const prods={},warn=[];
 lines.slice(1).forEach((ln,i)=>{
  const f=ln.split(dl).map(x=>x.trim().replace(/^"|"$/g,"")),num=x=>+String(x).replace(/[\s,]/g,"");
  const e=num(f[c.e]),cc=num(f[c.c]);
  if(!isFinite(e)||!isFinite(cc)||e<0||cc<0){warn.push(`Row ${i+2}: counts must be numbers.`);return}
  if(cc>e){warn.push(`Row ${i+2}: completed (${cc}) is larger than entered (${e}).`);return}
  const pn=(c.product>=0&&f[c.product])||"Imported product",pr=prods[pn]||(prods[pn]={order:[],no:{},rows:[],months:[],personas:[]});
  const step=f[c.step];if(!step){warn.push(`Row ${i+2}: step name is empty.`);return}
  if(!pr.order.includes(step))pr.order.push(step);
  if(c.no>=0&&f[c.no]!==""&&isFinite(num(f[c.no])))pr.no[step]=num(f[c.no]);
  const mo=c.month>=0?f[c.month]:"",pe=c.persona>=0?f[c.persona]:"";
  if(mo&&!pr.months.includes(mo))pr.months.push(mo);if(pe&&!pr.personas.includes(pe))pr.personas.push(pe);
  pr.rows.push({step,mo,pe,e,c:cc,med:c.med>=0&&f[c.med]!==""?num(f[c.med]):null});
 });
 Object.values(prods).forEach(pr=>{if(Object.keys(pr.no).length)pr.order.sort((a,b)=>(pr.no[a]??1e9)-(pr.no[b]??1e9));
  if(pr.months.every(m=>/^\d{4}-\d{2}/.test(m)))pr.months.sort()});
 if(!Object.keys(prods).length)return{err:"No usable rows. "+warn.slice(0,3).join(" ")};
 return{prods,warn};
}
function aggregate(pr,months){
 const sel=r=>!months||!r.mo||months.includes(r.mo);
 const steps=pr.order.map(n=>{let e=0,c=0,ms=0,mn=0;pr.rows.forEach(r=>{if(r.step===n&&sel(r)){e+=r.e;c+=r.c;if(r.med!=null){ms+=r.med*r.e;mn+=r.e}}});return{name:n,e,c,med:mn?ms/mn:null}});
 const per={};pr.personas.forEach(p=>{per[p]=pr.order.map(n=>{let e=0,c=0;pr.rows.forEach(r=>{if(r.step===n&&r.pe===p&&sel(r)){e+=r.e;c+=r.c}});return{e,c}})});
 return{steps,per};
}
function buildProduct(name,pr,tags,posts,holdout){
 const months=pr.months,hold=holdout&&months.length>=3?months[months.length-1]:null,calM=hold?months.slice(0,-1):(months.length?months:null);
 const cal=aggregate(pr,calM),hd=hold?aggregate(pr,[hold]):null;
 const steps=cal.steps.map((s,k)=>{const net=s.e>0?1-s.c/s.e:0,tag=tags[s.name]||"none",post=!!posts[s.name];
  return mkStep(s.name,tag,net,post?0:(s.med??2),post?0:.10,{post,tag:post?"activate":tag,sens:TAGSENS[tag]||0})});
 // only the last step may be the post-account outcome
 steps.forEach((s,k)=>{if(s.post&&k!==steps.length-1){s.post=false;s.resume=.10}});
 let personas,pm,src="none";
 const withData=pr.personas.length>=2&&pr.personas.every(p=>cal.per[p][0].e>0);
 if(withData){
  src="data";const tot=pr.personas.reduce((a,p)=>a+cal.per[p][0].e,0);
  personas=pr.personas.map(p=>({name:p,share:+(100*cal.per[p][0].e/tot).toFixed(2),seg:/existing|etb|current/i.test(p)?"existing":"new",techE:0,dwell:1,elig:1}));
  pm=pr.personas.map(p=>steps.map((s,k)=>{const o=cal.per[p][k];if(o.e<30)return 1;const net=1-o.c/o.e,ref=invNet(s.net,s.resume);if(ref<=0)return 1;return clampJ(invNet(net,s.resume)/ref,.05,10)}));
 }else{personas=[{name:"All customers",share:100,seg:"new",techE:0,dwell:1,elig:1}];pm=[steps.map(()=>1)]}
 const trend=months.map(m=>{const a=aggregate(pr,[m]).steps;let i=a.length-1;while(i>0&&posts[a[i].name])i--;return{month:m,e:a[0]?a[0].e:0,c:a.length?a[i].c:0}});
 // how much each step's drop-off normally moves from month to month (used to judge the held-out month fairly)
 let sd=null;if(calM&&calM.length>=2){const per=calM.map(m=>aggregate(pr,[m]).steps);sd=cal.steps.map((s,k)=>{const d=per.map(a=>a[k]&&a[k].e>0?1-a[k].c/a[k].e:null).filter(x=>x!=null);if(d.length<2)return null;const mu=d.reduce((x,y)=>x+y,0)/d.length;return Math.sqrt(d.reduce((x,y)=>x+(y-mu)*(y-mu),0)/(d.length-1))})}
 const prod={id:"d_"+name,name,src:"data",steps,personas,pm,personaSrc:src,months,hold,
  obs:{cal:cal.steps.map(s=>({e:s.e,c:s.c})),hold:hd?hd.steps.map(s=>({e:s.e,c:s.c})):null,trend,sd}};
 calibrate(prod);return prod;
}

// ===== Standard Bank account starting points (illustrative funnels; eligibility rules where known) =====
const REASON_BY_TAG={
 select:[["Comparing offers elsewhere",.4],["Unclear fees or features",.35],["No real intent",.25]],
 elig:[["Unsure whether they qualify",.6],["Changed mind",.4]],
 details:[["Form too long",.4],["Info not at hand",.3],["Privacy concern",.3]],
 idcap:[["Camera or glare failure",.45],["No ID to hand",.35],["Not eligible after all",.2]],
 verify:[["Liveness failed repeatedly",.4],["Record lookup mismatch",.3],["Network timeout",.3]],
 fica:[["No proof to hand",.5],["Upload or size errors",.25],["Prefers a branch",.25]],
 decision:[["Declined by risk rules",.55],["Waiting for manual review",.45]],
 sign:[["Terms too long",.4],["OTP not received",.4],["Changed mind",.2]],
 activate:[["Never made a first transaction",1]]};
function mkProd(id,name,tier,facts,defs,pers){
 const steps=defs.map(d=>mkStep(d[0],d[1],d[2],d[3],d[4],{post:d[1]==="activate",reasons:REASON_BY_TAG[d[1]]||null}));
 const personas=pers.map(p=>({name:p[0],share:p[1],seg:p[2],techE:p[3],dwell:p[4],elig:p[6]==null?1:p[6]}));
 const pm=pers.map(p=>steps.map(s=>(p[5]||{})[s.tag]||1));
 const tot=personas.reduce((a,p)=>a+p.share,0),binel=personas.reduce((a,p)=>a+p.share*(1-p.elig),0)/tot;
 steps.forEach(s=>{if(s.tag==="elig")s.net=binel+(1-binel)*s.net});   // net = hard stops + friction
 const prod={id,name,tier,facts,src:"template",steps,personas,pm,personaSrc:"assumed",obs:null,months:[]};calibrate(prod);return prod;
}
function libraryProducts(){
 const A="Account opened → first transaction",E=["Eligibility check","elig",.04,1,.05];
 const nathi=(sh,el)=>["Nathi: Ground Breakers (31, degree)",sh,"new",-.2,.8,{details:.8,idcap:.8,verify:.8,fica:.9},el];
 const arthur=(sh,el,m)=>["Arthur: Upper Main (46)",sh,"new",-.05,.9,Object.assign({fica:1.1},m||{}),el];
 const margaret=(sh,el)=>["Margaret: Over-55 retiree (66)",sh,"new",.3,1.4,{idcap:1.15,verify:1.2,sign:1.2},el];
 const upgrading=(sh,el)=>["Existing customer upgrading",sh,"existing",-.1,.8,{details:.6,idcap:.7,verify:.7,fica:.6,activate:.8},el];
 const lowBw=(sh,el)=>["Low-bandwidth or entry-level device",sh,"new",.5,1.6,{idcap:1.15,verify:1.15,sign:1.2},el];
 return[
 mkProd("sb_mymo","MyMo Account","Entry, digital",[
  "Can be opened on the Standard Bank app or online.",
  "You need to be 16 or older, a South African citizen with a South African ID, and living in South Africa. This is checked up front at sign-up.",
  "Under 18 with an ID can open on the app. Under 18 without an ID must apply in a branch.",
  "Standard Bank's page says you only need your South African ID, so this starting point has no proof-of-address upload.",
  "Personas are the six mass segments from the Mass Clients deck (October 2024). Their shares and friction effects are assumptions, because the deck gives no sizes."],
  [["Choose account","select",.08,1,.10],E,["Personal details","details",.12,3,.10],["ID capture (SA ID)","idcap",.14,2,.12],["Identity verification","verify",.16,2.5,.12],["Confirm address","fica",.10,2,.15],["Terms and e-sign","sign",.08,2,.12],[A,"activate",.30,0,0]],
  [["Survivalist (no income)",8,"new",.5,1.6,{fica:1.3,activate:1.3,details:1.1},.97],
   ["Inconsistent earner (piece work, self-employed)",14,"new",.4,1.5,{fica:1.3,activate:1.2},.97],
   ["Consistent earner (under R3k, employed)",24,"new",.3,1.3,{fica:1.1},.97],
   ["Emerging market (R3k–R8k, under 39)",24,"new",.1,1.0,{details:.9},.98],
   ["Established provider (R3k–R8k, over 39)",14,"new",.3,1.3,{idcap:1.15,verify:1.2},.98],
   ["Grant or pension recipient",8,"new",.4,1.6,{verify:1.25,sign:1.2,activate:.8},.97],
   ["Under 18 with an ID",8,"new",.15,1.2,{idcap:1.25,verify:1.2,sign:1.3},.9]]),
 mkProd("sb_mymoplus","MyMo Plus Account","Mid, digital",[
  "Standard Bank says MyMo Plus can be opened online or on the Banking App.",
  "Eligibility rules were not provided, so everyone is treated as eligible. Send the criteria to model them.",
  "Personas are the three middle-market personas from the deck plus existing and entry-level customers. Shares and friction effects are assumptions."],
  [["Choose account","select",.08,1,.10],E,["Personal details","details",.13,3.5,.10],["ID capture","idcap",.14,2,.12],["Identity verification","verify",.17,2.5,.12],["Proof of address or income","fica",.24,6,.20],["Affordability and risk decision","decision",.12,1,.05],["Terms and e-sign","sign",.08,2,.12],[A,"activate",.28,0,0]],
  [nathi(20,1),arthur(15,1),margaret(15,1),upgrading(30,1),lowBw(20,1)]),
 mkProd("sb_achieva","Achieva Account","Mid, full service",[
  "Standard Bank says Achieva is the renamed Elite account.",
  "To qualify you must be 18 or older, have a South African ID or a passport, live in South Africa and earn at least R8,000 gross a month. This is checked up front at sign-up. (Criteria supplied by you.)",
  "How many of each persona meet the R8,000 income test is my assumption. Replace it with your declined-for-criteria numbers.",
  "Personas are the three middle-market personas from the deck plus existing and entry-level customers. Shares and friction effects are assumptions."],
  [["Choose account","select",.09,1,.10],E,["Personal details","details",.14,3.5,.10],["ID capture","idcap",.14,2,.12],["Identity verification","verify",.17,2.5,.12],["Proof of address or income","fica",.27,7,.20],["Affordability and risk decision","decision",.14,1,.05],["Terms and e-sign","sign",.08,2,.12],[A,"activate",.25,0,0]],
  [nathi(15,.85),arthur(25,.9),margaret(15,.7),upgrading(35,.95),lowBw(10,.45)]),
 mkProd("sb_prestige","Prestige Banking Account","Premium",[
  "To qualify you must be 18 or older and either earn at least R25,000 a month, or hold a 4-year undergraduate degree and earn at least R5,000 a month if you are 30 or younger. (Criteria supplied by you.)",
  "Eligibility is checked up front, as the customer signs up.",
  "Listed on Standard Bank's accounts page at R250 a month. Check the current pricing guide. Whether it opens fully in the app was not found publicly.",
  "How many of each persona qualify is my assumption from the deck's average incomes and ages. Replace it with your declined-for-criteria numbers."],
  [["Choose account","select",.10,1.5,.10],E,["Personal details","details",.14,3.5,.10],["ID capture","idcap",.12,2,.12],["Identity verification","verify",.15,2.5,.12],["Proof of income and address","fica",.32,9,.20],["Affordability and risk decision","decision",.14,1.5,.05],["Terms and e-sign","sign",.07,2,.12],[A,"activate",.22,0,0]],
  [nathi(20,.15),arthur(25,.45,{decision:1.2}),margaret(10,.10),["Young graduate (30 or under, degree, R5k+)",20,"new",-.15,.8,{details:.9},.9],["High earner (R25k+)",25,"new",-.05,.8,{select:.8,details:.8,sign:.8},1]])
 ];
}



// ===== 20 behavioural archetypes (names from your list; every number below is an assumption, not measured) =====
// [name, banks with us?, digital friction, speed, drop-off multipliers by step type, weight in MyMo/Achieva/Prestige mix, share who qualify for MyMo/Achieva/Prestige, one-line read]
const ARCH=[
 ["The Provider","existing",0,1.0,{fica:1.1,decision:1.1},[8,10,8],[.98,.85,.35],"Employed breadwinner, steady mid income"],
 ["The Hustler","new",-.1,.9,{fica:1.35,activate:1.2,decision:1.2},[7,4,1],[.98,.5,.05],"Several income streams, hard to prove income"],
 ["The First Salary Earner","new",-.25,.8,{details:.9,fica:1.1,activate:.8},[7,6,5],[.98,.7,.4],"New to formal work and to banking"],
 ["The Young Climber","existing",-.3,.7,{details:.8,idcap:.85,verify:.85,activate:.8},[6,9,14],[.98,.9,.55],"Early career, digital first, moving up"],
 ["The Informal Trader","new",.4,1.4,{fica:1.5,activate:1.3,details:1.1,decision:1.3},[8,2,.5],[.97,.3,.02],"Cash-based income with no payslips"],
 ["The Township Entrepreneur","new",.2,1.2,{fica:1.4,decision:1.3,activate:1.1},[4,4,2],[.97,.55,.1],"Runs a small local business"],
 ["The Community Builder","existing",.1,1.1,{sign:1.1},[4,4,3],[.97,.7,.15],"Stokvels and community money circles"],
 ["The Grant Receiver","new",.45,1.6,{verify:1.25,sign:1.2,idcap:1.15,activate:.8},[8,.5,.1],[.97,.02,0],"Social grant is the main income"],
 ["The Pension Caregiver","existing",.4,1.5,{verify:1.2,sign:1.2,idcap:1.15,details:1.1},[5,3,2],[.97,.45,.1],"Pension income, supporting family"],
 ["The Saver","existing",0,1.1,{select:1.1,sign:1.1,activate:.7},[6,8,8],[.98,.8,.3],"Disciplined, goal-driven saving"],
 ["The Asset Aspirer","existing",-.1,.9,{decision:1.2,fica:1.1},[3,9,10],[.98,.9,.5],"Saving towards a home or car"],
 ["The Security Seeker","existing",.25,1.3,{verify:1.25,sign:1.2,idcap:1.15,select:1.1},[4,6,6],[.98,.8,.3],"Cautious, wary of fraud and fees"],
 ["The Commuter","new",-.05,.9,{details:.95,activate:.9},[6,5,2],[.98,.7,.1],"Daily travel, pays on the move"],
 ["The Connected Customer","existing",-.35,.7,{details:.8,idcap:.8,verify:.8,fica:.85,activate:.75},[5,7,9],[.98,.85,.4],"Lives in the app, expects instant"],
 ["The Side-Hustle Professional","existing",-.2,.8,{fica:1.2,decision:1.15},[3,6,8],[.98,.85,.45],"Salary plus a side income"],
 ["The Single Parent","existing",.1,1.3,{details:1.1,fica:1.2,decision:1.15,activate:1.1},[6,5,2],[.98,.6,.1],"One income, time-poor"],
 ["The Emerging Professional","existing",-.3,.8,{details:.85,idcap:.85,verify:.85,activate:.8},[4,10,16],[.98,.95,.65],"Graduate, growing salary"],
 ["The Established Provider","existing",.15,1.1,{idcap:1.1,verify:1.15,sign:1.1},[4,10,16],[.98,.95,.7],"Senior earner with dependants"],
 ["The Digitally Curious","new",-.1,1.1,{select:1.2,sign:1.1,activate:1.2},[4,4,3],[.98,.7,.2],"Exploring digital banking, needs reassurance"],
 ["The Financial Survivor","new",.5,1.7,{fica:1.35,activate:1.35,details:1.1,decision:1.3},[4,.5,0],[.97,.05,0],"Day-to-day money stress, minimal income"]];
// archetypes as personas for one product. onlySeg limits to people who already bank with us ("existing") or not ("new").
function archetypePersonas(p,onlySeg,fixedElig){
 const key=/prestige|private/i.test(p.name)?2:/achieva/i.test(p.name)?1:0,sh=.6;
 const L=ARCH.filter(a=>!onlySeg||a[1]===onlySeg),tot=L.reduce((x,a)=>x+Math.max(a[5][key],.2),0);
 return{personas:L.map(a=>({name:a[0],share:+(100*Math.max(a[5][key],.2)/tot).toFixed(1),seg:a[1],techE:a[2]*sh,dwell:1+(a[3]-1)*sh,elig:fixedElig?1:a[6][key],note:a[7]})),
  pm:L.map(a=>p.steps.map(s=>(1+((a[4][s.tag]||1)-1)*sh)*((BTRAIT[a[0]]||{}).quit===s.tag&&!s.post?1.8:1)))};
}

// ===== Mock data for the four public Standard Bank accounts =====
// Nothing here is Standard Bank data. Monthly counts are generated from the made-up step rates below, with seeded noise.
// The steps and eligibility rules come from Standard Bank's public pages.
const MO=["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","2026-09","2026-10"];
// per account: [starts a month, monthly trend, made-up share lost per step type, share of opened accounts never used]
const MOCK={
 sb_mymo:[40000,-.006,{select:.34,elig:.03,details:.27,idcap:.15,verify:.24,fica:.10,sign:.07},.50],
 sb_mymoplus:[12000,.004,{select:.38,elig:.03,details:.25,idcap:.14,verify:.20,fica:.26,decision:.12,sign:.07},.44],
 sb_achieva:[18000,-.002,{select:.42,elig:.04,details:.30,idcap:.14,verify:.21,fica:.29,decision:.16,sign:.08},.46],
 sb_prestige:[6000,.008,{select:.45,elig:.04,details:.24,idcap:.12,verify:.17,fica:.33,decision:.15,sign:.07},.38]};
function mockProducts(){
 return libraryProducts().map((lp,pi)=>{
  const M=MOCK[lp.id],rnd=mulberry(9001+pi*77),z=()=>norm(rnd(),rnd());
  const ar0=archetypePersonas(lp,null,false),tot=ar0.personas.reduce((a,x)=>a+x.share,0),binel=ar0.personas.reduce((a,x)=>a+x.share*(1-x.elig),0)/tot;
  const pre=lp.steps.filter(s=>!s.post),post=lp.steps.find(s=>s.post);
  const pr={order:lp.steps.map(s=>s.name),no:{},months:MO.slice(),personas:[],rows:[]},tags={},posts={};
  lp.steps.forEach(s=>{tags[s.name]=s.tag;posts[s.name]=!!s.post});
  const opened=[],active=[];
  MO.forEach((mo,m)=>{let e=Math.round(M[0]*(1+M[1]*m)*(1+.05*z()));
   pre.forEach(s=>{let d=M[2][s.tag]||.1;if(s.tag==="elig")d=binel+(1-binel)*d;d=clampJ(d*(1+.04*z()),.005,.9);const c=Math.round(e*(1-d));pr.rows.push({step:s.name,mo,pe:"",e,c,med:s.med});e=c});
   const act=Math.round(e*(1-clampJ(M[3]*(1+.04*z()),.05,.9)));opened.push(e);active.push(act);
   if(post)pr.rows.push({step:post.name,mo,pe:"",e,c:act,med:null})});
  const p=buildProduct(lp.name,pr,tags,posts,true);
  p.steps.forEach((s,k)=>{s.reasons=lp.steps[k].reasons;s.resume=lp.steps[k].post?0:lp.steps[k].resume});
  const ar=archetypePersonas(p,null,false);p.personas=ar.personas;p.pm=ar.pm;p.personaSrc="assumed";
  p.id=lp.id;p.tier=lp.tier;p.mock=true;p.example=true;
  p.notes=["Mock data. The monthly numbers for this account are made up for demonstration. They are not Standard Bank figures.","The steps and eligibility rules below come from Standard Bank's public pages.",...lp.facts.filter(x=>!/persona|my assumption|declined-for-criteria/i.test(x))];
  p.actuals={months:MO,opened,active,label:lp.name+", mock"};
  calibrate(p);return p});
}
