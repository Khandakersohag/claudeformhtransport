import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ VEHICLE TRIP ENTRY ═══
function VehicleTripEntry({data,setData}){
  const{vehicles=[],dailyRecords,settings}=data;
  const[date,setDate]=useState(todayISO());
  const[trips,setTrips]=useState({});
  const[saved,setSaved]=useState(false);

  // Load existing trips for selected date
  useEffect(()=>{
    const existing=dailyRecords.find(r=>new Date(r.date).toISOString().split("T")[0]===date);
    if(existing?.vehicleTrips){
      setTrips(existing.vehicleTrips);
    } else {
      setTrips({});
    }
  },[date,dailyRecords]);

  const setVTrip=(vid,val)=>{
    setTrips(p=>({...p,[vid]:Math.max(0,Number(val)||0)}));
  };

  const totalTrips=Object.values(trips).reduce((a,v)=>a+Number(v||0),0);
  const totalIncome=totalTrips*settings.tripRate;

  const save=()=>{
    if(totalTrips===0)return;
    const dateTs=tsFrom(date);
    const existing=dailyRecords.find(r=>new Date(r.date).toISOString().split("T")[0]===date);

    if(existing){
      // Update existing record
      const updated={
        ...existing,
        tripCount:totalTrips,
        vehicleTrips:trips,
        totalIncome:(existing.carCount*settings.carRate)+(totalTrips*settings.tripRate),
        netProfit:((existing.carCount*settings.carRate)+(totalTrips*settings.tripRate))-existing.totalExpense,
      };
      const list=dailyRecords.map(r=>r.id===existing.id?updated:r);
      setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
      GS.post({action:"save",sheet:"VehicleTrips",row:{date,vehicleTrips:JSON.stringify(trips),totalTrips,totalIncome}});
    } else {
      // Create new record
      const rec={
        id:Date.now().toString(),
        date:dateTs,
        carCount:0,
        tripCount:totalTrips,
        vehicleTrips:trips,
        expenses:[],
        totalIncome,
        totalExpense:0,
        netProfit:totalIncome,
        createdAt:Date.now(),
      };
      const list=[rec,...dailyRecords];
      setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
      GS.post({action:"save",sheet:"VehicleTrips",row:{date,vehicleTrips:JSON.stringify(trips),totalTrips,totalIncome}});
    }
    setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  // Monthly vehicle report
  const monthlyVehicleReport=useMemo(()=>{
    const month=date.slice(0,7);
    const report={};
    vehicles.forEach(v=>{report[v.id]={number:v.number,model:v.model,trips:0,income:0};});
    dailyRecords.forEach(r=>{
      if(!r.vehicleTrips)return;
      const rMonth=new Date(r.date).toISOString().slice(0,7);
      if(rMonth!==month)return;
      Object.entries(r.vehicleTrips).forEach(([vid,t])=>{
        if(report[vid]){
          report[vid].trips+=Number(t||0);
          report[vid].income+=Number(t||0)*settings.tripRate;
        }
      });
    });
    return Object.values(report).filter(r=>r.trips>0).sort((a,b)=>b.trips-a.trips);
  },[dailyRecords,vehicles,date,settings]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>গাড়িভিত্তিক ট্রিপ 🚛</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>প্রতিটি গাড়ির ট্রিপ এন্ট্রি — দৈনিক রেকর্ডে অটো যুক্ত হবে</p>
      </div>

      {vehicles.length===0?(
        <Card style={{padding:32,textAlign:"center"}} className="fu1">
          <p style={{color:"var(--text-muted)",fontSize:13,marginBottom:12}}>⚠️ কোনো গাড়ি যোগ করা নেই</p>
          <p style={{color:"var(--text-secondary)",fontSize:12}}>প্রথমে "গাড়ির তালিকা" পেজে গিয়ে গাড়ি যোগ করুন</p>
        </Card>
      ):(
        <>
          <Card className="fu1" style={{padding:22}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
              <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)"}}>📝 ট্রিপ এন্ট্রি</h3>
              <Field type="date" value={date} onChange={setDate}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {vehicles.map(v=>(
                <div key={v.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,background:"rgba(2,12,27,0.5)",border:"1px solid rgba(100,255,218,0.08)",borderRadius:12,padding:"12px 16px",flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,var(--navy-700),var(--navy-600))",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--green-400)",flexShrink:0}}>
                      <I.Truck/>
                    </div>
                    <div>
                      <p style={{fontWeight:700,fontSize:13,color:"var(--text-primary)"}}>{v.number}</p>
                      <p style={{fontSize:11,color:"var(--text-secondary)"}}>{v.model} · {v.type}</p>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={()=>setVTrip(v.id,Math.max(0,(trips[v.id]||0)-1))}
                      style={{width:32,height:32,borderRadius:"50%",background:"var(--navy-700)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
                    <input type="number" min="0" value={trips[v.id]||0} onChange={e=>setVTrip(v.id,e.target.value)}
                      style={{width:52,textAlign:"center",background:"rgba(2,12,27,0.7)",border:"1px solid rgba(100,255,218,0.15)",borderRadius:8,color:"var(--green-300)",padding:"6px",fontSize:16,fontWeight:900,outline:"none"}}/>
                    <button onClick={()=>setVTrip(v.id,(trips[v.id]||0)+1)}
                      style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",border:"none",color:"#020c1b",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
                    <span style={{fontSize:11,color:"var(--text-secondary)",minWidth:60}}>{BDT((trips[v.id]||0)*settings.tripRate)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:16,background:"rgba(15,186,129,0.08)",border:"1px solid rgba(15,186,129,0.15)",borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{fontSize:11,color:"var(--text-secondary)",marginBottom:2}}>মোট ট্রিপ</p>
                <p style={{fontSize:24,fontWeight:900,color:"var(--green-300)"}}>{totalTrips} টি</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontSize:11,color:"var(--text-secondary)",marginBottom:2}}>মোট আয়</p>
                <p style={{fontSize:24,fontWeight:900,color:"var(--green-400)"}}>{BDT(totalIncome)}</p>
              </div>
            </div>

            <div style={{marginTop:14}}>
              {saved?(
                <div style={{background:"rgba(15,186,129,0.15)",border:"1px solid rgba(15,186,129,0.3)",borderRadius:12,padding:"12px 20px",textAlign:"center",fontSize:14,fontWeight:700,color:"var(--green-400)"}}>
                  ✅ দৈনিক এন্ট্রিতে যুক্ত হয়েছে!
                </div>
              ):(
                <Btn onClick={save} icon={<I.Save/>} full disabled={totalTrips===0}>
                  সেভ করুন — দৈনিক এন্ট্রিতে অটো যুক্ত হবে
                </Btn>
              )}
            </div>
          </Card>

          {monthlyVehicleReport.length>0&&(
            <Card className="fu2" style={{padding:22}}>
              <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>
                📊 মাসিক গাড়িভিত্তিক রিপোর্ট ({date.slice(0,7)})
              </h3>
              <div style={{overflowX:"auto"}}>
                <table>
                  <thead><tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
                    <TH>গাড়ি নম্বর</TH>
                    <TH>মডেল</TH>
                    <TH>মোট ট্রিপ</TH>
                    <TH right>মোট আয়</TH>
                  </tr></thead>
                  <tbody>
                    {monthlyVehicleReport.map((r,i)=>(
                      <TR key={i}>
                        <TD bold color="var(--green-300)">{r.number}</TD>
                        <TD color="var(--text-secondary)">{r.model}</TD>
                        <TD>{r.trips} টি</TD>
                        <TD right mono bold color="var(--green-400)">{BDT(r.income)}</TD>
                      </TR>
                    ))}
                    <TR>
                      <td colSpan="2" style={{padding:"11px 8px",fontWeight:700,color:"var(--text-primary)"}}>মোট</td>
                      <TD bold>{monthlyVehicleReport.reduce((a,r)=>a+r.trips,0)} টি</TD>
                      <TD right mono bold color="var(--green-400)">{BDT(monthlyVehicleReport.reduce((a,r)=>a+r.income,0))}</TD>
                    </TR>
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}




export default VehicleTripEntry;
