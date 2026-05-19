import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ DAILY ENTRY ═══
function DailyEntry({data,setData}){
  const{settings,dailyRecords}=data;
  const[date,setDate]=useState(todayISO());
  const[carCount,setCarCount]=useState(0);
  const[tripCount,setTripCount]=useState(0);
  const[expenses,setExpenses]=useState([]);
  const[editId,setEditId]=useState(null);
  const[expCat,setExpCat]=useState(EXPENSE_CATS[0]);
  const[expAmt,setExpAmt]=useState("");
  const[expDesc,setExpDesc]=useState("");

  const totalIncome=(Number(carCount)*settings.carRate)+(Number(tripCount)*settings.tripRate);
  const totalExpense=expenses.reduce((a,e)=>a+Number(e.amount||0),0);
  const netProfit=totalIncome-totalExpense;

  const loadRec=r=>{setDate(new Date(r.date).toISOString().split("T")[0]);setCarCount(r.carCount);setTripCount(r.tripCount);setExpenses(r.expenses||[]);setEditId(r.id);};
  const reset=()=>{setDate(todayISO());setCarCount(0);setTripCount(0);setExpenses([]);setEditId(null);};
  const addExp=()=>{if(!expAmt||Number(expAmt)<=0)return;setExpenses(p=>[...p,{category:expCat,amount:Number(expAmt),description:expDesc||expCat}]);setExpAmt("");setExpDesc("");};
  const save=()=>{
    const rec={id:editId||Date.now().toString(),date:tsFrom(date),carCount:Number(carCount),tripCount:Number(tripCount),expenses,totalIncome,totalExpense,netProfit,createdAt:Date.now()};
    const list=editId?dailyRecords.map(r=>r.id===editId?rec:r):[rec,...dailyRecords];
    setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
    GS.post({action:"save",sheet:"DailyRecords",row:{id:rec.id,date:new Date(rec.date).toISOString().split("T")[0],carCount:rec.carCount,tripCount:rec.tripCount,totalIncome:rec.totalIncome,totalExpense:rec.totalExpense,netProfit:rec.netProfit,expenses:JSON.stringify(rec.expenses),vehicleTrips:JSON.stringify(rec.vehicleTrips||{})}});
    reset();
  };
  const del=id=>{const list=dailyRecords.filter(r=>r.id!==id);setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});GS.post({action:"delete",sheet:"DailyRecords",id});if(editId===id)reset();};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}} className="fu0">
        <div>
          <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>দৈনিক এন্ট্রি</h2>
          <p style={{color:"var(--text-secondary)",fontSize:13}}>প্রতিদিনের আয় ও খরচ রেকর্ড</p>
        </div>
        {editId&&<Btn v="ghost" onClick={reset} icon={<I.X/>}>বাতিল</Btn>}
      </div>
      <div style={{display:"grid",gap:18}}>
        <Card className="fu1" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:18}}>{editId?"✏️ রেকর্ড সম্পাদনা":"➕ নতুন এন্ট্রি"}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Field label="তারিখ" type="date" value={date} onChange={setDate}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label={`গাড়ি (৳${settings.carRate}/টি)`} type="number" min="0" value={carCount} onChange={v=>setCarCount(Number(v))}/>
              <Field label={`ট্রিপ (৳${settings.tripRate}/টি)`} type="number" min="0" value={tripCount} onChange={v=>setTripCount(Number(v))}/>
            </div>
            <div style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.1)",borderRadius:12,padding:16}}>
              {[["মোট আয়",BDT(totalIncome),"var(--green-400)"],["মোট খরচ",BDT(totalExpense),"var(--danger)"]].map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}>
                  <span style={{color:"var(--text-secondary)"}}>{l}</span><span style={{fontWeight:700,color:c}}>{v}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10,marginTop:4}}>
                <span style={{fontWeight:700,color:"var(--text-primary)"}}>নেট লাভ</span>
                <span style={{fontWeight:900,fontSize:16,color:netProfit>=0?"var(--green-400)":"var(--danger)"}}>{BDT(netProfit)}</span>
              </div>
            </div>
            <div style={{background:"rgba(2,12,27,0.4)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:14}}>
              <p style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>খরচ যোগ করুন</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Sel value={expCat} onChange={setExpCat} options={EXPENSE_CATS}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field placeholder="পরিমাণ" type="number" min="0" value={expAmt} onChange={setExpAmt}/>
                  <Field placeholder="বিবরণ" value={expDesc} onChange={setExpDesc}/>
                </div>
                <Btn v="ghost" onClick={addExp} icon={<I.Plus/>} size="sm">যোগ করুন</Btn>
              </div>
            </div>
            {expenses.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:160,overflowY:"auto"}}>
              {expenses.map((e,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(15,186,129,0.05)",border:"1px solid rgba(15,186,129,0.1)",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:12}}><span style={{fontWeight:600,color:"var(--green-300)"}}>{e.category}</span><span style={{color:"var(--text-muted)",marginLeft:6}}>— {e.description}</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontWeight:700,color:"var(--danger)",fontSize:12}}>{BDT(e.amount)}</span>
                    <button onClick={()=>setExpenses(p=>p.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",display:"flex"}}><I.X/></button>
                  </div>
                </div>
              ))}
            </div>}
            <Btn onClick={save} icon={<I.Save/>} full>{editId?"আপডেট করুন":"সেভ করুন"}</Btn>
          </div>
        </Card>
        <Card className="fu2" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:18}}>📜 রেকর্ড ইতিহাস</h3>
          {dailyRecords.length===0?(
            <div style={{textAlign:"center",padding:"32px 0",color:"var(--text-muted)",fontSize:13}}>কোনো রেকর্ড নেই</div>
          ):(
            <div style={{overflowX:"auto"}}>
              <table><thead><tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
                <TH>তারিখ</TH><TH>গাড়ি</TH><TH>ট্রিপ</TH><TH right>আয়</TH><TH right>লাভ</TH><TH></TH>
              </tr></thead>
              <tbody>{dailyRecords.map(r=>(
                <TR key={r.id} highlight={editId===r.id}>
                  <TD color="var(--text-secondary)">{dateStr(r.date)}</TD>
                  <TD>{r.carCount}</TD><TD>{r.tripCount}</TD>
                  <TD right mono bold color="var(--green-400)">{BDT(r.totalIncome)}</TD>
                  <TD right mono bold color={r.netProfit>=0?"var(--green-300)":"var(--danger)"}>{BDT(r.netProfit)}</TD>
                  <td style={{padding:"11px 8px"}}>
                    <div style={{display:"flex",gap:4}}>
                      <IconBtn icon={<I.Edit/>} onClick={()=>loadRec(r)} hoverColor="var(--green-400)"/>
                      <IconBtn icon={<I.Trash/>} onClick={()=>del(r.id)}/>
                    </div>
                  </td>
                </TR>
              ))}</tbody></table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}



export default DailyEntry;
