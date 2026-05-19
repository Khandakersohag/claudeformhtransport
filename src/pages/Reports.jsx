import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ REPORTS ═══
function Reports({data}){
  const{dailyRecords,expenses,salaries}=data;
  const[from,setFrom]=useState(()=>{const d=new Date();d.setDate(1);return d.toISOString().split("T")[0];});
  const[to,setTo]=useState(todayISO());
  const fromTs=tsFrom(from);const toTs=tsFrom(to)+86399999;
  const fD=dailyRecords.filter(r=>r.date>=fromTs&&r.date<=toTs);
  const fE=expenses.filter(e=>e.date>=fromTs&&e.date<=toTs);
  const fS=salaries.filter(s=>s.paidDate>=fromTs&&s.paidDate<=toTs);
  const totalIncome=fD.reduce((a,r)=>a+r.totalIncome,0);
  const totalExp=fD.reduce((a,r)=>a+r.totalExpense,0)+fE.reduce((a,e)=>a+e.amount,0);
  const totalSal=fS.reduce((a,s)=>a+s.paidAmount,0);
  const net=totalIncome-totalExp;
  const byCat=useMemo(()=>{const m={};fE.forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;});fD.forEach(r=>(r.expenses||[]).forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;}));return m;},[fE,fD]);
  const exportCSV=()=>{const rows=[["তারিখ","গাড়ি","ট্রিপ","আয়","খরচ","লাভ"],...fD.map(r=>[dateStr(r.date),r.carCount,r.tripCount,r.totalIncome,r.totalExpense,r.netProfit])];const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));a.download=`mh-transport-${from}-${to}.csv`;a.click();};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}} className="fu0">
        <div><h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>রিপোর্ট</h2><p style={{color:"var(--text-secondary)",fontSize:13}}>নির্দিষ্ট সময়কালের প্রতিবেদন</p></div>
        <Btn v="ghost" onClick={exportCSV} icon={<I.Dl/>} size="sm">CSV রপ্তানি</Btn>
      </div>
      <Card className="fu1" style={{padding:18}}>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          <Field label="শুরুর তারিখ" type="date" value={from} onChange={setFrom}/>
          <Field label="শেষ তারিখ" type="date" value={to} onChange={setTo}/>
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}} className="fu2">
        <StatCard label="মোট আয়" value={BDT(totalIncome)} positive={true} IconComp={I.Up}/>
        <StatCard label="মোট খরচ" value={BDT(totalExp)} positive={false} IconComp={I.Down}/>
        <StatCard label="নেট লাভ" value={BDT(net)} positive={net>=0} IconComp={I.Truck}/>
        <StatCard label="বেতন দেওয়া" value={BDT(totalSal)} IconComp={I.Staff}/>
      </div>
      <div style={{display:"grid",gap:16}}>
        <Card className="fu3" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>ক্যাটাগরি অনুযায়ী খরচ</h3>
          {Object.keys(byCat).length===0?<p style={{textAlign:"center",padding:"24px 0",color:"var(--text-muted)",fontSize:13}}>কোনো তথ্য নেই</p>:(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
                <div key={cat}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
                    <span style={{color:"var(--text-secondary)"}}>{cat}</span><span style={{fontWeight:700,color:"var(--text-primary)"}}>{BDT(amt)}</span>
                  </div>
                  <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",background:"linear-gradient(90deg,var(--green-500),var(--green-400))",borderRadius:999,width:`${(amt/(totalExp||1))*100}%`,transition:"width 0.5s ease"}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="fu4" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>দৈনিক রেকর্ড ({fD.length} দিন)</h3>
          <div style={{overflowY:"auto",maxHeight:280}}>
            <table><thead style={{position:"sticky",top:0,background:"var(--navy-800)"}}>
              <tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}><TH>তারিখ</TH><TH>গাড়ি</TH><TH>ট্রিপ</TH><TH right>আয়</TH><TH right>লাভ</TH></tr>
            </thead><tbody>
              {fD.map(r=>(
                <TR key={r.id}>
                  <TD color="var(--text-secondary)">{dateStr(r.date)}</TD><TD>{r.carCount}</TD><TD>{r.tripCount}</TD>
                  <TD right mono bold color="var(--green-400)">{BDT(r.totalIncome)}</TD>
                  <TD right mono bold color={r.netProfit>=0?"var(--green-300)":"var(--danger)"}>{BDT(r.netProfit)}</TD>
                </TR>
              ))}
            </tbody></table>
          </div>
        </Card>
      </div>
    </div>
  );
}



export default Reports;
