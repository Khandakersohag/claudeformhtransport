import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ SEARCH & FILTER ═══
function SearchFilter({data}){
  const{dailyRecords,expenses,staff,salaries,vehicles=[]}=data;
  const[query,setQuery]=useState("");
  const[type,setType]=useState("সব");
  const[fromDate,setFromDate]=useState("");
  const[toDate,setToDate]=useState("");

  const TYPES=["সব","দৈনিক এন্ট্রি","খরচ","বেতন","গাড়ি"];

  const results=useMemo(()=>{
    const q=query.toLowerCase();
    const fromTs=fromDate?tsFrom(fromDate):0;
    const toTs=toDate?tsFrom(toDate)+86399999:Infinity;

    let all=[];

    if(type==="সব"||type==="দৈনিক এন্ট্রি"){
      dailyRecords.forEach(r=>{
        if(r.date<fromTs||r.date>toTs)return;
        const text=`দৈনিক এন্ট্রি ${r.carCount} গাড়ি ${r.tripCount} ট্রিপ ${r.totalIncome}`;
        if(q&&!text.toLowerCase().includes(q))return;
        all.push({type:"দৈনিক",date:r.date,title:`${r.carCount} গাড়ি · ${r.tripCount} ট্রিপ`,sub:`আয়: ${BDT(r.totalIncome)} · লাভ: ${BDT(r.netProfit)}`,amount:r.totalIncome,positive:true,pill:"green"});
      });
    }

    if(type==="সব"||type==="খরচ"){
      expenses.forEach(e=>{
        if(e.date<fromTs||e.date>toTs)return;
        const text=`${e.category} ${e.description} ${e.amount}`;
        if(q&&!text.toLowerCase().includes(q))return;
        all.push({type:"খরচ",date:e.date,title:e.description||e.category,sub:`ক্যাটাগরি: ${e.category}`,amount:e.amount,positive:false,pill:"amber"});
      });
    }

    if(type==="সব"||type==="বেতন"){
      salaries.forEach(s=>{
        if(s.paidDate<fromTs||s.paidDate>toTs)return;
        const text=`${s.staffName} বেতন ${s.paidAmount}`;
        if(q&&!text.toLowerCase().includes(q))return;
        all.push({type:"বেতন",date:s.paidDate,title:s.staffName,sub:`${s.totalDays} দিন · বাকি: ${BDT(s.dueAmount)}`,amount:s.paidAmount,positive:false,pill:"blue"});
      });
    }

    if(type==="সব"||type==="গাড়ি"){
      vehicles.forEach(v=>{
        const text=`${v.number} ${v.model} ${v.type}`;
        if(q&&!text.toLowerCase().includes(q))return;
        all.push({type:"গাড়ি",date:v.createdAt||Date.now(),title:v.number,sub:`${v.model} · ${v.type}`,amount:null,positive:null,pill:"navy"});
      });
    }

    return all.sort((a,b)=>b.date-a.date);
  },[query,type,fromDate,toDate,dailyRecords,expenses,salaries,vehicles]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>সার্চ ও ফিল্টার 🔍</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>যেকোনো রেকর্ড খুঁজুন</p>
      </div>

      <Card className="fu1" style={{padding:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{position:"relative"}}>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔍 কীওয়ার্ড লিখুন..."
              style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.15)",borderRadius:12,color:"var(--text-primary)",padding:"12px 16px",outline:"none",width:"100%",fontSize:14,transition:"border-color 0.2s"}}
              onFocus={e=>e.target.style.borderColor="var(--green-500)"}
              onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.15)"}/>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {TYPES.map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{padding:"6px 14px",borderRadius:999,fontSize:12,fontWeight:700,cursor:"pointer",border:type===t?"1px solid var(--green-500)":"1px solid rgba(255,255,255,0.08)",background:type===t?"rgba(15,186,129,0.15)":"transparent",color:type===t?"var(--green-400)":"var(--text-secondary)",transition:"all 0.15s"}}>{t}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="শুরুর তারিখ" type="date" value={fromDate} onChange={setFromDate}/>
            <Field label="শেষ তারিখ" type="date" value={toDate} onChange={setToDate}/>
          </div>
        </div>
      </Card>

      <div className="fu2">
        <p style={{fontSize:12,color:"var(--text-secondary)",marginBottom:12}}>{results.length}টি ফলাফল পাওয়া গেছে</p>
        {results.length===0?(
          <Card style={{padding:40,textAlign:"center"}}><p style={{color:"var(--text-muted)",fontSize:13}}>কোনো ফলাফল নেই</p></Card>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {results.map((r,i)=>(
              <Card key={i} style={{padding:"14px 18px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <Pill color={r.pill}>{r.type}</Pill>
                    <div>
                      <p style={{fontWeight:700,fontSize:13,color:"var(--text-primary)"}}>{r.title}</p>
                      <p style={{fontSize:11,color:"var(--text-secondary)"}}>{r.sub} · {dateStr(r.date)}</p>
                    </div>
                  </div>
                  {r.amount!==null&&(
                    <span style={{fontWeight:800,fontSize:14,fontFamily:"monospace",color:r.positive?"var(--green-400)":"var(--danger)"}}>{r.positive?"+":"-"}{BDT(r.amount)}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




export default SearchFilter;
