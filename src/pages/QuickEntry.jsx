import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ QUICK ENTRY (দ্রুত এন্ট্রি) ═══
function QuickEntry({data,setData,setPage,setSidebarOpen}){
  const gotoPage=(id)=>{setPage(id);setSidebarOpen(false);};
  const{settings,dailyRecords}=data;
  const[carCount,setCarCount]=useState(0);
  const[tripCount,setTripCount]=useState(0);
  const[note,setNote]=useState("");
  const[saved,setSaved]=useState(false);

  const totalIncome=(Number(carCount)*settings.carRate)+(Number(tripCount)*settings.tripRate);

  const save=()=>{
    if(Number(carCount)===0&&Number(tripCount)===0)return;
    const today=todayISO();
    const existing=dailyRecords.find(r=>new Date(r.date).toISOString().split("T")[0]===today);
    if(existing){
      const updated={...existing,carCount:existing.carCount+Number(carCount),tripCount:existing.tripCount+Number(tripCount),totalIncome:existing.totalIncome+totalIncome};
      const list=dailyRecords.map(r=>r.id===existing.id?updated:r);
      setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
      GS.post({action:"save",sheet:"DailyRecords",row:{id:updated.id,date:today,carCount:updated.carCount,tripCount:updated.tripCount,totalIncome:updated.totalIncome,totalExpense:updated.totalExpense||0,netProfit:updated.totalIncome-(updated.totalExpense||0),note}});
    } else {
      const rec={id:Date.now().toString(),date:new Date(today).getTime(),carCount:Number(carCount),tripCount:Number(tripCount),expenses:[],totalIncome,totalExpense:0,netProfit:totalIncome,note,createdAt:Date.now()};
      const list=[rec,...dailyRecords];
      setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
      GS.post({action:"save",sheet:"DailyRecords",row:{id:rec.id,date:today,carCount:rec.carCount,tripCount:rec.tripCount,totalIncome:rec.totalIncome,totalExpense:0,netProfit:rec.totalIncome,expenses:"[]",vehicleTrips:"{}",note}});
    }
    setCarCount(0);setTripCount(0);setNote("");setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  const todayRec=dailyRecords.find(r=>new Date(r.date).toISOString().split("T")[0]===todayISO());

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>দ্রুত এন্ট্রি ⚡</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>আজকের এন্ট্রি দ্রুত যোগ করুন</p>
      </div>

      {todayRec&&(
        <Card className="fu1" glow style={{padding:18,background:"rgba(15,186,129,0.06)",borderColor:"rgba(15,186,129,0.2)"}}>
          <p style={{fontSize:12,color:"var(--green-300)",fontWeight:700,marginBottom:10}}>✅ আজকের বর্তমান এন্ট্রি</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[["গাড়ি",todayRec.carCount],["ট্রিপ",todayRec.tripCount],["আয়",BDT(todayRec.totalIncome)]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(2,12,27,0.5)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                <p style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{l}</p>
                <p style={{fontSize:18,fontWeight:900,color:"var(--green-300)"}}>{v}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="fu2" style={{padding:24}}>
        <p style={{fontSize:12,color:"var(--text-secondary)",marginBottom:16}}>{todayRec?"আরও যোগ করুন (আজকের এন্ট্রিতে যুক্ত হবে)":"আজকের নতুন এন্ট্রি"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:14,padding:16,textAlign:"center"}}>
            <p style={{fontSize:11,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>গাড়ি চেক</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
              <button onClick={()=>setCarCount(Math.max(0,Number(carCount)-1))} style={{width:38,height:38,borderRadius:"50%",background:"var(--navy-700)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
              <span style={{fontSize:32,fontWeight:900,color:"var(--green-300)",minWidth:40,textAlign:"center"}}>{carCount}</span>
              <button onClick={()=>setCarCount(Number(carCount)+1)} style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",border:"none",color:"#020c1b",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
            </div>
            <p style={{fontSize:11,color:"var(--text-muted)",marginTop:8}}>৳{settings.carRate}/টি = <strong style={{color:"var(--green-400)"}}>{BDT(Number(carCount)*settings.carRate)}</strong></p>
          </div>
          <div style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:14,padding:16,textAlign:"center"}}>
            <p style={{fontSize:11,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>ট্রিপ</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
              <button onClick={()=>setTripCount(Math.max(0,Number(tripCount)-1))} style={{width:38,height:38,borderRadius:"50%",background:"var(--navy-700)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
              <span style={{fontSize:32,fontWeight:900,color:"var(--green-300)",minWidth:40,textAlign:"center"}}>{tripCount}</span>
              <button onClick={()=>setTripCount(Number(tripCount)+1)} style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",border:"none",color:"#020c1b",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
            </div>
            <p style={{fontSize:11,color:"var(--text-muted)",marginTop:8}}>৳{settings.tripRate}/টি = <strong style={{color:"var(--green-400)"}}>{BDT(Number(tripCount)*settings.tripRate)}</strong></p>
          </div>
        </div>

        <div style={{background:"rgba(15,186,129,0.08)",border:"1px solid rgba(15,186,129,0.15)",borderRadius:12,padding:"14px 16px",marginBottom:16,textAlign:"center"}}>
          <p style={{fontSize:11,color:"var(--text-secondary)",marginBottom:4}}>মোট আয়</p>
          <p style={{fontSize:28,fontWeight:900,color:"var(--green-300)"}}>{BDT(totalIncome)}</p>
        </div>

        <Field label="নোট (ঐচ্ছিক)" value={note} onChange={setNote} placeholder="বিশেষ কিছু থাকলে লিখুন..."/>

        <div style={{marginTop:16}}>
          {saved?(
            <div style={{background:"rgba(15,186,129,0.15)",border:"1px solid rgba(15,186,129,0.3)",borderRadius:12,padding:"12px 20px",textAlign:"center",fontSize:14,fontWeight:700,color:"var(--green-400)"}}>
              ✅ সফলভাবে সেভ হয়েছে!
            </div>
          ):(
            <Btn onClick={save} icon={<I.Check/>} full disabled={Number(carCount)===0&&Number(tripCount)===0}>
              এন্ট্রি সেভ করুন
            </Btn>
          )}
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="fu3">
        <button onClick={()=>gotoPage("daily")} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(100,255,218,0.1)",borderRadius:14,padding:"16px 12px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",color:"var(--text-secondary)"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--green-500)";e.currentTarget.style.color="var(--green-400)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(100,255,218,0.1)";e.currentTarget.style.color="var(--text-secondary)";}}>
          <div style={{fontSize:20,marginBottom:6}}>📋</div>
          <p style={{fontSize:12,fontWeight:600}}>বিস্তারিত এন্ট্রি</p>
        </button>
        <button onClick={()=>gotoPage("expenses")} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(100,255,218,0.1)",borderRadius:14,padding:"16px 12px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",color:"var(--text-secondary)"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--green-500)";e.currentTarget.style.color="var(--green-400)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(100,255,218,0.1)";e.currentTarget.style.color="var(--text-secondary)";}}>
          <div style={{fontSize:20,marginBottom:6}}>💸</div>
          <p style={{fontSize:12,fontWeight:600}}>খরচ যোগ করুন</p>
        </button>
      </div>
    </div>
  );
}



export default QuickEntry;
