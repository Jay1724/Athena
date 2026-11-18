// ===== Commercial model (pure, deterministic, unrounded internally) =====
const INTENT=["High intent","Medium intent","Exploratory"];
const ASSUME=[ // key,label,unit,min,max,step
 ["act","Account activation rate","%",0,100,.01],
 ["active","Active customer rate","%",0,100,.1],
 ["pay","Payments per active customer / month","",0,1000,.1],
 ["val","Average payment value","R",0,1e7,10],
 ["dep","Average deposit balance","R",0,1e8,100],
 ["prod","Products per active customer","",0,50,.1],
 ["ret","12-month retention","%",0,100,.1],
 ["con","Annual contribution per active customer","R",0,1e7,10]];
const CHAIN=[["profile","Profile created"],["init","Application initiated"],["kyc","KYC completed"],["completion","Application completed"]];
function defaultsC(){
 const tb={act:13,active:60,pay:2,val:500,dep:2000,prod:1.1,ret:75,con:600};
 const sb={act:21.58,active:60,pay:2,val:500,dep:2000,prod:1.3,ret:80,con:600};
 const mk=(stages,s)=>({intent:{shares:[30,45,25],idx:[1,1,1]},stages,acq:{campaign:0,onboarding:0},s});
 return{visitors:10000,scen:"base",show:"both",
  trad:mk({profile:null,init:null,kyc:null,completion:null},{down:{...tb},base:{...tb},up:{...tb}}),
  soft:mk({profile:61,init:61,kyc:71,completion:null},{
   down:{act:15,active:45,pay:1,val:350,dep:1000,prod:1.0,ret:65,con:300},
   base:{...sb},
   up:{act:25,active:70,pay:3,val:500,dep:2500,prod:1.5,ret:85,con:750}})};
}
function normShares(sh){const s=sh.reduce((a,b)=>a+(+b||0),0);return s>0?sh.map(x=>(+x||0)/s):[.3,.45,.25]}
function calc(V,mc,sk){
 const p=mc.s[sk],sh=normShares(mc.intent.shares);
 const seg=sh.map((s,i)=>{const vis=V*s,rate=Math.min(1,Math.max(0,p.act/100*mc.intent.idx[i]));return{vis,share:s,rate,act:vis*rate}});
 const activated=seg.reduce((a,x)=>a+x.act,0);
 const active=activated*p.active/100,tx=active*p.pay,val=tx*p.val;
 const spend=(+mc.acq.campaign||0)+(+mc.acq.onboarding||0);
 return{V,seg,activated,rate:V>0?activated/V:0,active,activeOfV:V>0?active/V:0,tx,val,ann:val*12,dep:active*p.dep,
  prodRel:active*p.prod,retained:active*p.ret/100,contrib:active*p.con,spend,cac:activated>0?spend/activated:null,
  avgTx:p.val,freq:p.pay,avgDep:p.dep,prodPer:p.prod,retRate:p.ret/100,activeRate:p.active/100};
}
function funnelOf(V,mc,res){
 const st=mc.stages,rows=[{k:"vis",label:"Visitors",n:V}];let cur=V,known=false;
 CHAIN.forEach(([key,label])=>{const r=st[key];if(r==null||r===""){rows.push({k:key,label,n:null});return}
  cur=cur*r/100;known=true;rows.push({k:key,label,n:cur,calc:true})});
 const seqEnd=known?cur:null;
 rows.push({k:"act",label:"Activated accounts",n:res.activated});
 rows.push({k:"actv",label:"Active customers",n:res.active});
 return{rows,seqEnd,gap:seqEnd==null?null:seqEnd-res.activated};
}
function recon(V,mc,res){
 const f=funnelOf(V,mc,res);if(f.seqEnd==null)return null;
 const factor=f.seqEnd>0?res.activated/f.seqEnd:null,dens=[],solves=[];let cur=V;
 CHAIN.forEach(([key,label])=>{const r=mc.stages[key];if(r==null||r==="")return;
  dens.push({key,label,rate:r,den:cur,num:cur*r/100});cur=cur*r/100;
  if(factor!=null)solves.push({key,label,rate:r,needed:r*factor})});
 return{seqEnd:f.seqEnd,seqRate:V>0?f.seqEnd/V:0,rate:res.rate,gapPts:(V>0?(f.seqEnd-res.activated)/V:0)*100,gapN:f.seqEnd-res.activated,factor,dens,solves};
}
function runTests(){
 const D=defaultsC(),V=10000,t=calc(V,D.trad,"base"),s=calc(V,D.soft,"base"),out=[];
 const T=(name,exp,got)=>out.push({name,exp,got,pass:Math.round(got)===exp});
 const M=[["Activated accounts","activated",1300,2158],["Active customers","active",780,1295],["Monthly transactions","tx",1560,2590],
  ["Monthly payment value (R)","val",780000,1294800],["Deposit balances (R)","dep",1560000,2589600],["Product relationships","prodRel",858,1683],
  ["12-month retained","retained",585,1036],["Annual contribution (R)","contrib",468000,776880]];
 M.forEach(([n,k,a,b])=>{T("Traditional · "+n,a,t[k]);T("Soft Profile · "+n,b,s[k])});
 const I=[["Activated accounts","activated",858],["Active customers","active",515],["Monthly transactions","tx",1030],["Monthly payment value (R)","val",514800],
  ["Deposit balances (R)","dep",1029600],["Product relationships","prodRel",825],["12-month retained","retained",451],["Annual contribution (R)","contrib",308880]];
 I.forEach(([n,k,e])=>T("Incremental · "+n,e,s[k]-t[k]));
 out.push({name:"Soft activation preserved at confirmed 2,158 (21.58%)",exp:2158,got:s.activated,pass:Math.abs(s.activated-2158)<1e-6});
 const rc=recon(V,D.soft,s);
 out.push({name:"Soft sequential funnel ≈ 26.41% (brief, truncated)",exp:26.41,got:rc.seqRate*100,pass:Math.abs(rc.seqRate*100-26.41)<.02});
 out.push({name:"Discrepancy flagged (sequential ≠ confirmed)",exp:"gap > 0",got:rc.gapN,pass:rc.gapN>400});
 return out;
}
