import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ DASHBOARD ═══
function Dashboard({data}){
  const{dailyRecords,expenses,staff,tasks}=data;
  const totalIncome=useMemo(()=>dailyRecords.reduce((a,r)=>a+(r.totalIncome||0),0),[dailyRecords]);
  const totalExp=useMemo(()=>dailyRecords.reduce((a,r)=>a+(r.totalExpense||0),0)+expenses.reduce((a,e)=>a+(e.amount||0),0),[dailyRecords,expenses]);
  const balance=totalIncome-totalExp;
  const activeStaff=staff.filter(s=>s.isActive).length;
  const pendingTasks=tasks.filter(t=>t.status==="pending"||t.status==="in-progress").length;
  const recent=useMemo(()=>[...dailyRecords.map(r=>({date:r.date,desc:`দৈনিক (${r.carCount} গাড়ি, ${r.tripCount} ট্রিপ)`,cat:"আয়",amount:r.totalIncome,pos:true})),...expenses.map(e=>({date:e.date,desc:e.description,cat:e.category,amount:e.amount,pos:false}))].sort((a,b)=>b.date-a.date).slice(0,8),[dailyRecords,expenses]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>ব্যবসায়িক সারসংক্ষেপ</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>সর্বশেষ তথ্যের উপর ভিত্তি করে</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
        <StatCard label="মোট আয়" value={BDT(totalIncome)} positive={true} IconComp={I.Up} cls="fu1"/>
        <StatCard label="মোট খরচ" value={BDT(totalExp)} positive={false} IconComp={I.Down} cls="fu2"/>
        <StatCard label="নেট ব্যালেন্স" value={BDT(balance)} positive={balance>=0} IconComp={I.Truck} cls="fu3"/>
        <StatCard label="সক্রিয় স্টাফ" value={`${activeStaff} জন`} sub={`${pendingTasks} বাকি`} positive={true} IconComp={I.Staff} cls="fu4"/>
      </div>
      <div style={{display:"grid",gap:18}}>
        <Card className="fu2" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:18}}>সাম্প্রতিক লেনদেন</h3>
          {recent.length===0?(
            <div style={{textAlign:"center",padding:"32px 0",color:"var(--text-muted)",fontSize:13}}>📋 কোনো ডেটা নেই। প্রথমে দৈনিক এন্ট্রি যোগ করুন।</div>
          ):(
            <div style={{overflowX:"auto"}}>
              <table><thead><tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
                <TH>তারিখ</TH><TH>বিবরণ</TH><TH>ধরন</TH><TH right>পরিমাণ</TH>
              </tr></thead>
              <tbody>{recent.map((r,i)=>(
                <TR key={i}>
                  <TD color="var(--text-secondary)">{dateStr(r.date)}</TD>
                  <TD>{r.desc}</TD>
                  <TD><Pill color={r.pos?"green":"amber"}>{r.cat}</Pill></TD>
                  <TD right mono bold color={r.pos?"var(--green-400)":"var(--danger)"}>{r.pos?"+":"-"}{BDT(r.amount)}</TD>
                </TR>
              ))}</tbody></table>
            </div>
          )}
        </Card>
        <Card className="fu3" style={{padding:22,background:"linear-gradient(135deg,rgba(15,186,129,0.07) 0%,rgba(17,34,64,0.9) 100%)",borderColor:"rgba(100,255,218,0.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,color:"var(--green-400)"}}>
            <I.Truck/>
            <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)"}}>অপারেশনাল ভলিউম</h3>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[["মোট গাড়ি",dailyRecords.reduce((a,r)=>a+(r.carCount||0),0)],["মোট ট্রিপ",dailyRecords.reduce((a,r)=>a+(r.tripCount||0),0)],["মোট দিন",dailyRecords.length]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(2,12,27,0.4)",borderRadius:12,padding:"14px 12px",border:"1px solid rgba(100,255,218,0.08)"}}>
                <p style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{l}</p>
                <p style={{fontSize:26,fontWeight:900,color:"var(--green-300)"}}>{v}</p>
              </div>
            ))}
          </div>
          {totalIncome>0&&<div style={{marginTop:14,padding:"10px 14px",background:"rgba(2,12,27,0.4)",borderRadius:10,border:"1px solid rgba(100,255,218,0.08)"}}>
            <p style={{fontSize:12,color:"var(--text-secondary)"}}>গড় দৈনিক আয়: <strong style={{color:"var(--green-400)"}}>{BDT(Math.round(totalIncome/(dailyRecords.length||1)))}</strong></p>
          </div>}
        </Card>
      </div>
    </div>
  );
}



export default Dashboard;
