# Mock "company export" for testing Athena Offline. All numbers are made up.
# Weekly grain, semicolon-delimited, different column names, split by channel, with stories built in.
import csv, math, random, datetime as dt, os
random.seed(1724)
OUT=os.path.join(os.path.dirname(__file__),"..","samples","mock_export");os.makedirs(OUT,exist_ok=True)
FLOWS={
 "MyMo Account":(5200,[("Choose account",.66),("Eligibility check",.97),("Personal details",.71),("ID capture",.89),("Identity verification",.76),("Confirm address",.91),("Terms and e-sign",.93),("Account opened → first transaction",.50)]),
 "MyMo Plus Account":(2100,[("Choose account",.70),("Eligibility check",.95),("Personal details",.74),("ID capture",.90),("Identity verification",.78),("Proof of address or income",.80),("Affordability and risk decision",.72),("Terms and e-sign",.94),("Account opened → first transaction",.58)]),
 "Achieva Account":(1300,[("Choose account",.72),("Eligibility check",.93),("Personal details",.76),("ID capture",.91),("Identity verification",.79),("Proof of address or income",.77),("Affordability and risk decision",.66),("Terms and e-sign",.95),("Account opened → first transaction",.64)]),
 "Prestige Banking Account":(520,[("Choose account",.75),("Eligibility check",.88),("Personal details",.79),("ID capture",.92),("Identity verification",.81),("Proof of income and address",.74),("Affordability and risk decision",.61),("Terms and e-sign",.96),("Account opened → first transaction",.71)])}
SEAS={1:1.14,2:1.02,3:1.03,4:.97,5:.99,6:.98,7:1.0,8:1.01,9:.99,10:1.02,11:.97,12:.86}
CH={"App":.68,"Web":.32};CHP={"App":0.0,"Web":-.25}  # web passes a little less (logit shift)
REASONS={"Choose account":["Compared fees and left","Not sure which account fits"],"Eligibility check":["Under 18","Not a SA resident"],
 "Personal details":["Form too long","Didn't know source of funds","Timed out"],"ID capture":["Photo blurry","Green ID book not accepted","Camera permission denied"],
 "Identity verification":["Selfie didn't match","Liveness check failed","Took too long"],"Confirm address":["No proof of address","Address not found"],
 "Proof of address or income":["No proof of address","Payslip upload failed","Statement too old"],"Proof of income and address":["No proof of address","Payslip upload failed","Statement too old"],
 "Affordability and risk decision":["Declined by risk rules","Income too low","Bureau mismatch"],"Terms and e-sign":["OTP not received","Too much to read"],
 "Account opened → first transaction":["Never made a first transaction","Waiting for card"]}
lg=lambda p:math.log(p/(1-p));il=lambda x:1/(1+math.exp(-x))
start=dt.date(2024,11,4);weeks=[start+dt.timedelta(7*i) for i in range(106)]  # 104 in the main export, the rest arrive as an update
fun=[];drops={}
for prod,(base,steps) in FLOWS.items():
  trend=1.0
  for w in weeks:
    trend*=1.0012;mid=w+dt.timedelta(3);s=SEAS[mid.month]
    pay=1.08 if (w.day>=22 or w.day<=2) else 1.0          # payday week
    camp=1.35 if prod=="MyMo Account" and dt.date(2026,3,2)<=w<dt.date(2026,3,23) else 1.0  # March campaign
    for ch,share in CH.items():
      n=int(base*share*s*pay*camp*trend*random.lognormvariate(0,.05))
      for name,p in steps:
        x=lg(p)+CHP[ch]+random.gauss(0,.05)
        if prod=="MyMo Account" and name=="Personal details" and w>=dt.date(2026,8,3): x+=.45   # redesign launched
        if prod=="Achieva Account" and name=="Proof of address or income" and w>=dt.date(2026,6,1): x-=.30  # stricter rule
        if name=="Identity verification" and mid.month==12: x-=.25                                 # holiday load
        if camp>1 and name=="Choose account": x-=.2
        c=int(round(n*il(x)))
        fun.append([prod,w.isoformat(),name,n,c,ch])
        key=(prod,mid.strftime("%Y-%m"),name);drops[key]=drops.get(key,0)+(n-c);n=c
CUT=weeks[104].isoformat();UPD=weeks[100].isoformat()
upd=[r[:] for r in fun if r[1]>=UPD];fun=[r for r in fun if r[1]<CUT]
for r in upd:   # the update restates the last 4 weeks with small corrections (late-arriving completions)
  if r[1]<CUT: r[4]=min(r[3],int(r[4]*1.01)+1)
H=["Product Name","Week Start","Step Name","Users In","Users Out","Channel"]
with open(os.path.join(OUT,"weekly_funnel_export.csv"),"w",newline="",encoding="utf-8-sig") as f:
  w=csv.writer(f,delimiter=";");w.writerow(H);w.writerows(fun)
with open(os.path.join(OUT,"weekly_funnel_update_nov2026.csv"),"w",newline="",encoding="utf-8-sig") as f:
  w=csv.writer(f,delimiter=";");w.writerow(H);w.writerows(upd)
with open(os.path.join(OUT,"dropoff_reasons_export.csv"),"w",newline="",encoding="utf-8-sig") as f:
  w=csv.writer(f,delimiter=";");w.writerow(["Product","Month","Step","Drop-off reason","Drop-offs"])
  for (prod,mo,name),d in sorted(drops.items()):
    if mo>="2026-11": continue
    rs=REASONS[name];wt=[random.uniform(.5,1.5)*(1.6 if i==0 else 1) for i in range(len(rs))]
    if prod=="Achieva Account" and "Proof" in name and mo>="2026-06": wt[0]*=2
    t=sum(wt);[w.writerow([prod,mo,name,r,int(d*x/t)]) for r,x in zip(rs,wt)]
print(len(fun),"funnel rows,",len(drops),"reason groups")
# a messy copy, to see the data checks catch problems
bad=[r[:] for r in fun]
bad=[r for r in bad if not (r[0]=="Prestige Banking Account" and r[1]=="2026-07-13")]           # a missing week
for r in bad:
  if r[0]=="MyMo Account" and r[1]=="2026-02-02" and r[2]=="ID capture" and r[5]=="App": r[4]=r[3]+40   # more out than in
  if r[0]=="MyMo Plus Account" and r[1]=="2025-09-08" and r[2]=="Terms and e-sign" and r[5]=="Web": r[3]=r[3]*3  # more in than came through
bad.append(next(r for r in fun if r[0]=="Achieva Account" and r[1]=="2026-01-05"))                 # a duplicate row
with open(os.path.join(OUT,"weekly_funnel_export_messy.csv"),"w",newline="",encoding="utf-8-sig") as f:
  w=csv.writer(f,delimiter=";");w.writerow(["Product Name","Week Start","Step Name","Users In","Users Out","Channel"]);w.writerows(bad)
print("messy copy written")
