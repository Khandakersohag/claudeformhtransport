import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ MONTHLY CHART REPORT ═══
function MonthlyChart({data}){
  const{dailyRecords,expenses}=data;

  const monthlyData=useMemo(()=>{
    const map={};
    dailyRecords.forEach(r=>{
      const d=new Date(r.date);
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[key])map[key]={month:key,income:0,expense:0};
      map[key].income+=r.totalIncome||0;
      map[key].expense+=r.totalExpense||0;
    });
    expenses.forEach(e=>{
      const d=new Date(e.date);
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[key])map[key]={month:key,income:0,expense:0};
      map[key].expense+=e.amount||0;
    });
    return Object.values(map).sort((a,b)=>a.month.localeCompare(b.month)).slice(-6);
  },[dailyRecords,expenses]);

  const maxVal=Math.max(...monthlyData.flatMap(m=>[m.income,m.expense]),1);

  const monthBN=key=>{
    const[y,m]=key.split("-");
    const months=["জানু","ফেব্রু","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টো","নভে","ডিসে"];
    return`${months[parseInt(m)-1]} ${y}`;
  };

  const totalIncome=monthlyData.reduce((a,m)=>a+m.income,0);
  const totalExp=monthlyData.reduce((a,m)=>a+m.expense,0);
  const net=totalIncome-totalExp;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>মাসিক রিপোর্ট</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>সর্বশেষ ৬ মাসের আয়-খরচ বিশ্লেষণ</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}} className="fu1">
        <StatCard label="মোট আয়" value={BDT(totalIncome)} positive={true} IconComp={I.Up}/>
        <StatCard label="মোট খরচ" value={BDT(totalExp)} positive={false} IconComp={I.Down}/>
        <StatCard label="নেট লাভ" value={BDT(net)} positive={net>=0} IconComp={I.Truck}/>
      </div>

      <Card className="fu2" style={{padding:22}}>
        <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:20}}>📊 মাসিক আয় vs খরচ</h3>
        {monthlyData.length===0?(
          <p style={{textAlign:"center",padding:"32px 0",color:"var(--text-muted)",fontSize:13}}>পর্যাপ্ত ডেটা নেই</p>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {monthlyData.map((m,i)=>(
              <div key={m.month}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}>
                  <span style={{fontWeight:700,color:"var(--text-primary)"}}>{monthBN(m.month)}</span>
                  <span style={{color:"var(--text-secondary)"}}>লাভ: <strong style={{color:m.income-m.expense>=0?"var(--green-400)":"var(--danger)"}}>{BDT(m.income-m.expense)}</strong></span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,color:"var(--green-400)",width:30,textAlign:"right",flexShrink:0}}>আয়</span>
                    <div style={{flex:1,height:18,background:"rgba(255,255,255,0.04)",borderRadius:999,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(m.income/maxVal)*100}%`,background:"linear-gradient(90deg,var(--green-500),var(--green-400))",borderRadius:999,transition:"width 0.6s ease",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6}}>
                        {m.income>0&&<span style={{fontSize:9,color:"#020c1b",fontWeight:800}}>{BDT(m.income)}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,color:"var(--danger)",width:30,textAlign:"right",flexShrink:0}}>খরচ</span>
                    <div style={{flex:1,height:18,background:"rgba(255,255,255,0.04)",borderRadius:999,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(m.expense/maxVal)*100}%`,background:"linear-gradient(90deg,#ff6b6b,#ff8e8e)",borderRadius:999,transition:"width 0.6s ease",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6}}>
                        {m.expense>0&&<span style={{fontSize:9,color:"#fff",fontWeight:800}}>{BDT(m.expense)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="fu3" style={{padding:22}}>
        <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>📋 মাসভিত্তিক বিবরণ</h3>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
              <TH>মাস</TH><TH right>আয়</TH><TH right>খরচ</TH><TH right>লাভ</TH>
            </tr></thead>
            <tbody>
              {monthlyData.map(m=>(
                <TR key={m.month}>
                  <TD color="var(--text-secondary)">{monthBN(m.month)}</TD>
                  <TD right mono bold color="var(--green-400)">{BDT(m.income)}</TD>
                  <TD right mono bold color="var(--danger)">{BDT(m.expense)}</TD>
                  <TD right mono bold color={m.income-m.expense>=0?"var(--green-300)":"var(--danger)"}>{BDT(m.income-m.expense)}</TD>
                </TR>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}




export default MonthlyChart;
