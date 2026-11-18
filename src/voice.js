
// ===== Voice: what a simulated customer says, kept separate from what they did =====
// Follows the persona behaviour guide: short, plain, one point, often silent, sometimes says "fine" after leaving.
const BANNED=/\b(seamless|intuitive|friction|onboarding|journey|flow|ux|ui|navigat\w*|streamlin\w*|user-friendly|experience|interface|functionality|frustrat\w*)\b/i;
const CORE=[
 [/comparing offers/i,["Checking the other banks first.","Still deciding.","Wanted to compare prices.","Other bank might be cheaper."]],
 [/unclear fees|fees or limits/i,["Didn't know what it costs.","The fees came at the end.","How much per month? It didn't say.","Charges weren't clear."]],
 [/no real intent|just looking/i,["Just looking.","Wasn't ready today.","Only checking what it is."]],
 [/qualify/i,["Not sure I qualify.","Didn't know if I earn enough.","Maybe it's not for me."]],
 [/changed mind/i,["Changed my mind.","Don't really need it.","Left it for now."]],
 [/form too long|too much to type/i,["Too long.","So many questions.","Too much typing on the phone.","Took forever. I gave up."]],
 [/not at hand|not to hand/i,["Didn't have my papers with me.","My documents are at home.","Needed stuff I didn't have."]],
 [/privacy|unsure why it/i,["Why do they need all that?","Too personal.","Didn't like giving all that info."]],
 [/camera|glare/i,["Photo kept failing.","My camera is not good.","Picture was blurry every time."]],
 [/no id/i,["ID was at home.","Didn't have my ID card."]],
 [/^not eligible|eligible after all/i,["Said I don't qualify.","Can't get it, apparently.","Wasted my time, I don't qualify."]],
 [/passport/i,["Only have a passport.","It wanted an SA ID."]],
 [/liveness|check failed/i,["Selfie kept failing.","It couldn't see it was me.","Face thing didn't work."]],
 [/record lookup|don't match/i,["Said my details don't match.","My name didn't match, I don't know why."]],
 [/network|timeout|signal/i,["My data finished halfway.","Network dropped.","It kicked me out."]],
 [/no proof/i,["No address proof in my name.","The house isn't in my name.","Don't have a bill with my name."]],
 [/upload|file too/i,["Upload wouldn't work.","It said file too big.","Kept spinning on the upload."]],
 [/branch/i,["I'll rather go to the branch.","Prefer to do this in person."]],
 [/declined|answer not what/i,["It said no.","Got declined, no reason.","Didn't get what I wanted."]],
 [/manual review|waiting/i,["Said wait for review.","Didn't want to wait days."]],
 [/terms|t&cs/i,["Too much small print.","Too many pages to read.","Didn't want to sign what I don't understand."]],
 [/worried about getting it wrong/i,["Scared to send it wrong.","Wasn't sure it was right."]],
 [/otp/i,["OTP never came.","Code took too long.","The SMS didn't come."]],
 [/first transaction/i,["Haven't needed it yet.","My money still goes to the other bank.","Forgot about it."]],
 [/didn't see why/i,["Didn't see the point.","What do I get?"]],
 [/unclear what happens/i,["Didn't know what happens next.","Scared it would charge me."]],
 [/phone too slow/i,["Phone froze.","App got very slow."]],
 [/lost interest/i,["Got bored.","Lost interest."]],
 [/something went wrong/i,["Something broke.","Got an error."]],
 [/interrupted: (.*)/i,null],
 [/no clear reason/i,["Don't know. Just stopped.","Something came up.","I'll do it later.","Didn't feel like it."]]];
const QUIET=["I don't know.","Okay.","Nothing really.","Not sure.","I don't remember."];
const FINE=["It was fine.","No problem really.","Fine I guess.","It was okay. I'll finish later.","All good."];
const STORY=["Was in the queue at the shops.","Did it after work.","My cousin said it's quick.","Tried it on Sunday.","Was on the taxi.","Started it at lunch."];
const TAIL=["Anyway, data is expensive.","My phone is old also.","Then supper had to be made.","Long day."];
const BLAME=["Typical.","Always something.","Banks make everything hard.","Waste of my time."];
const SOFT=["No stress.","I'll try again sometime.","It happens.","Not a big deal."];
const SUSP=["Is this safe?","Who sees all this?","Feels like a scam."];
const SUGG={fica:"Just let me bring it to the branch.",details:"Ask less.",verify:"Let me do it later.",idcap:"Let me do the photo later.",sign:"Make it shorter.",decision:"Tell me why.",select:"Show the price first."};
const HLW={isiZulu:"Eish,",isiXhosa:"Eish,",siSwati:"Eish,",Sesotho:"Aowa,",Setswana:"Aowa,",Sepedi:"Aowa,",Afrikaans:"Ag,"};
const POS=["Quick. Nice.","Easier than I thought.","Done in a few minutes.","Ja, it worked.","Was okay, quick."];
const NEU=["Fine.","Nothing really.","It was okay.","I don't remember much.","Normal."];
const MIXEV={m:"Pressed the wrong thing once. Done now.",b:"Had to go back once, but okay.",i:"Got interrupted, came back later. Done.",r:"Had to read it twice. Got there.",w:"Picked the wrong option first. Fine now.",s:"Didn't read the terms, just clicked."};
const MIXG=["Took long but it's done.","Too many questions, but fine.","Slow, but okay."];
// a stable pseudo-random number for one customer and one purpose
const hr=(c,salt)=>{let h=2166136261^salt;const s=c.j*7919+Math.round(c.start*1e5)+(c.dropK+2)*131;h=Math.imul(h^s,16777619);h^=h>>>13;h=Math.imul(h,1274126177);return((h^(h>>>16))>>>0)/4294967296};
const pickA=(a,x)=>a[Math.floor(x*a.length)%a.length];
const SENT=r=>/comparing|no real intent|just looking|changed mind/i.test(r)?"neu":/qualify|no clear|branch|waiting|manual|lost interest|interrupted|first transaction/i.test(r)?"mix":"neg";
const wc=t=>t.trim().split(/\s+/).length;
function capWords(t,n){if(wc(t)<=n)return t;const s=t.split(/(?<=[.?!])\s+/)[0];if(wc(s)<=n)return s;return t.split(/\s+/).slice(0,n).join(" ").replace(/[,;:]$/,"")+"."}
function coreFor(rs,x){if(/interrupted: (.*)/i.test(rs)){const w=rs.split(": ")[1];return w.charAt(0).toUpperCase()+w.slice(1)+"."}const m=CORE.find(q=>q[0].test(rs||""));return m&&m[1]?pickA(m[1],x):"I just stopped."}
// returns {text|null, sent:"neg"|"mix"|"neu"|"pos", fine, sugg, silent}
function speak(c,pe,tagOf){
 const B=btr(pe),x=k=>hr(c,k),dropped=c.status==="drop",style=B.style;
 if(dropped){
  const silentP={quiet:.5,blunt:.32,chatty:.18,complainer:.2,easy:.25,suspicious:.25}[style]||.3;
  if(x(1)<silentP)return{text:null,sent:"neu",silent:true};
  if(B.polite==="H"&&x(2)<.4||B.polite==="M"&&x(2)<.12)return{text:pickA(FINE,x(3)),sent:"neu",fine:true};
  let t=coreFor(c.rs,x(4)),sent=SENT(c.rs||""),sugg=false;const sg=SUGG[tagOf(c.dropK)];
  if(style!=="quiet"&&sg&&x(9)<.18){t=x(11)<.3?sg:t+" "+sg;sugg=true}
  else if(style==="quiet"){if(x(5)<.45){t=pickA(QUIET,x(6));sent="mix"}else t=capWords(t,4)}
  else if(style==="chatty"){t=pickA(STORY,x(6))+" "+t;if(x(7)<.4)t+=" "+pickA(TAIL,x(8))}
  else if(style==="complainer"&&x(7)<.7){t+=" "+pickA(BLAME,x(8));sent="neg"}
  else if(style==="easy"&&x(7)<.7){t+=" "+pickA(SOFT,x(8));if(sent==="neg")sent="mix"}
  else if(style==="suspicious"&&x(7)<.6){t+=" "+pickA(SUSP,x(8));sent="neg"}
  if(B.english==="Home language first"&&x(10)<.17&&HLW[B.lang])t=HLW[B.lang]+" "+t.charAt(0).toLowerCase()+t.slice(1);
  return{text:capWords(t,B.maxW),sent,sugg};
 }
 if(x(1)<.2)return{text:null,sent:"neu",silent:true};
 const evs=(c.ev||[]).map(e=>e[1]).join("");
 if(evs&&x(2)<.5){const ch=evs[Math.floor(x(3)*evs.length)];return{text:capWords(MIXEV[ch],B.maxW),sent:"mix"}}
 if(style==="complainer"&&x(4)<.5)return{text:capWords(pickA(MIXG,x(5)),B.maxW),sent:"mix"};
 if(x(6)<(style==="easy"||B.polite==="H"?.75:.6))return{text:capWords(pickA(POS,x(7)),B.maxW),sent:"pos"};
 return{text:capWords(pickA(style==="quiet"?QUIET:NEU,x(8)),B.maxW),sent:"neu"};
}
// the guide's quality checks on one answer
function qcheck(text,B,seen){const f=[];if(!text)return f;if(wc(text)>B.maxW)f.push("too long");if(BANNED.test(text))f.push("banned word");if((text.match(/[.?!](\s|$)/g)||[]).length>3)f.push("more than one point");const key=text.toLowerCase().replace(/[^a-z ]/g,"");if(wc(text)>3&&seen.has(key))f.push("repeats another answer");seen.add(key);return f}
// a sample of the whole run, to check the mix against the guide's targets
let VRUN={k:null};
function voiceRun(p,R){const key=p.name+"|"+R.cust.length+"|"+R.openN;if(VRUN.k===key)return VRUN;const N=R.cust.length,step=Math.max(1,Math.floor(N/1500)),tagOf=k=>p.steps[k]&&p.steps[k].tag;let seen=new Set();
 const o={k:key,n:0,said:0,sent:{neg:0,mix:0,neu:0,pos:0},drops:0,silentDrops:0,sugg:0,fine:0,fail:0,fails:{}};
 for(let i=0;i<N;i+=step){const c=R.cust[i];const pe=p.personas[c.j],v=speak(c,pe,tagOf);o.n++;if(c.status==="drop"){o.drops++;if(v.silent)o.silentDrops++;if(v.fine)o.fine++}
  if(v.text){o.said++;if(o.said%50===0)seen=new Set();o.sent[v.sent]++;if(v.sugg)o.sugg++;const fl=qcheck(v.text,btr(pe),seen);if(fl.length){o.fail++;fl.forEach(x=>o.fails[x]=(o.fails[x]||0)+1)}}}
 const rate=k=>R.att[k]>0?R.fail[k]/R.att[k]:0,rs=p.steps.map((s,k)=>({s,r:rate(k)})).filter(x=>!x.s.post&&x.s.tag!=="elig");let ups=0;for(let i=1;i<rs.length;i++)if(rs[i].r>rs[i-1].r+.01)ups++;o.bumps=ups;
 let strongDrops=0,allDrops=0;R.cust.forEach(c=>{if(c.status==="drop"&&p.steps[c.dropK].tag!=="elig"){allDrops++;if(btr(p.personas[c.j]).dev==="high")strongDrops++}});o.strongShare=allDrops?strongDrops/allDrops:0;
 VRUN=o;return o}
