import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ PDF REPORT ═══
function PDFReport({data}){
  const{dailyRecords,expenses,salaries,staff,vehicles=[],settings}=data;
  const[from,setFrom]=useState(()=>{const d=new Date();d.setDate(1);return d.toISOString().split("T")[0];});
  const[to,setTo]=useState(todayISO());
  const[reportType,setReportType]=useState("সার্বিক");
  const[generating,setGenerating]=useState(false);

  const REPORT_TYPES=["সার্বিক","দৈনিক এন্ট্রি","খরচ বিবরণ","বেতন বিবরণ","গাড়ির তালিকা"];

  const fromTs=tsFrom(from);
  const toTs=tsFrom(to)+86399999;

  const fDaily=dailyRecords.filter(r=>r.date>=fromTs&&r.date<=toTs);
  const fExp=expenses.filter(e=>e.date>=fromTs&&e.date<=toTs);
  const fSal=salaries.filter(s=>s.paidDate>=fromTs&&s.paidDate<=toTs);

  const totalIncome=fDaily.reduce((a,r)=>a+r.totalIncome,0);
  const totalExp=fDaily.reduce((a,r)=>a+r.totalExpense,0)+fExp.reduce((a,e)=>a+e.amount,0);
  const totalSal=fSal.reduce((a,s)=>a+s.paidAmount,0);
  const net=totalIncome-totalExp;

  const generatePDF=()=>{
    setGenerating(true);

    const companyName=settings.companyName||"New M.H. Transport";
    const dateRange=`${from} থেকে ${to}`;

    let tableRows="";

    if(reportType==="সার্বিক"||reportType==="দৈনিক এন্ট্রি"){
      tableRows+=`
        <tr class="section-header"><td colspan="5">📋 দৈনিক এন্ট্রি</td></tr>
        <tr class="thead"><td>তারিখ</td><td>গাড়ি</td><td>ট্রিপ</td><td>আয়</td><td>লাভ</td></tr>
        ${fDaily.map(r=>`<tr><td>${dateStr(r.date)}</td><td>${r.carCount}</td><td>${r.tripCount}</td><td class="income">৳${r.totalIncome.toLocaleString()}</td><td class="${r.netProfit>=0?"income":"expense"}">৳${r.netProfit.toLocaleString()}</td></tr>`).join("")}
        <tr class="subtotal"><td colspan="3">মোট</td><td class="income">৳${totalIncome.toLocaleString()}</td><td class="${net>=0?"income":"expense"}">৳${net.toLocaleString()}</td></tr>
      `;
    }

    if(reportType==="সার্বিক"||reportType==="খরচ বিবরণ"){
      tableRows+=`
        <tr class="section-header"><td colspan="5">💸 খরচ বিবরণ</td></tr>
        <tr class="thead"><td>তারিখ</td><td colspan="2">বিবরণ</td><td>ক্যাটাগরি</td><td>পরিমাণ</td></tr>
        ${fExp.map(e=>`<tr><td>${dateStr(e.date)}</td><td colspan="2">${e.description}</td><td>${e.category}</td><td class="expense">৳${e.amount.toLocaleString()}</td></tr>`).join("")}
        <tr class="subtotal"><td colspan="4">মোট খরচ</td><td class="expense">৳${fExp.reduce((a,e)=>a+e.amount,0).toLocaleString()}</td></tr>
      `;
    }

    if(reportType==="সার্বিক"||reportType==="বেতন বিবরণ"){
      tableRows+=`
        <tr class="section-header"><td colspan="5">👥 বেতন বিবরণ</td></tr>
        <tr class="thead"><td>নাম</td><td>দিন</td><td>প্রাপ্য</td><td>প্রদত্ত</td><td>বাকি</td></tr>
        ${fSal.map(s=>`<tr><td>${s.staffName}</td><td>${s.totalDays}</td><td>৳${s.actualSalary.toLocaleString()}</td><td class="income">৳${s.paidAmount.toLocaleString()}</td><td class="${s.dueAmount>0?"expense":"income"}">৳${s.dueAmount.toLocaleString()}</td></tr>`).join("")}
        <tr class="subtotal"><td colspan="3">মোট বেতন</td><td class="income">৳${totalSal.toLocaleString()}</td><td></td></tr>
      `;
    }

    if(reportType==="গাড়ির তালিকা"){
      tableRows+=`
        <tr class="section-header"><td colspan="5">🚛 গাড়ির তালিকা</td></tr>
        <tr class="thead"><td>নম্বর</td><td>মডেল</td><td>ট্যাক্স টোকেন</td><td>ফিটনেস</td><td>বীমা</td></tr>
        ${vehicles.map(v=>`<tr><td><strong>${v.number}</strong></td><td>${v.model}</td><td>${v.taxExp}</td><td>${v.fitExp}</td><td>${v.insExp}</td></tr>`).join("")}
      `;
    }

    const html=`
<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${companyName} — রিপোর্ট</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Noto Sans Bengali',sans-serif;background:#f8fafc;color:#1e293b;padding:20px;}
  .page{max-width:800px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
  .header{background:linear-gradient(135deg,#0a192f,#1d3461);color:white;padding:28px 32px;}
  .company{font-size:22px;font-weight:900;margin-bottom:4px;}
  .subtitle{font-size:13px;color:#64ffda;font-weight:600;}
  .report-info{display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;flex-wrap:wrap;gap:8px;}
  .report-title{font-size:16px;font-weight:700;color:white;}
  .date-range{font-size:12px;color:#8892b0;}
  .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0;border-bottom:1px solid #e2e8f0;}
  .summary-item{padding:18px 20px;border-right:1px solid #e2e8f0;}
  .summary-item:last-child{border-right:none;}
  .s-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
  .s-value{font-size:20px;font-weight:900;}
  .s-income{color:#0fba81;}
  .s-expense{color:#ff6b6b;}
  .s-net{color:#1d3461;}
  .content{padding:24px 32px;}
  table{width:100%;border-collapse:collapse;margin-bottom:8px;}
  td,th{padding:10px 12px;text-align:left;font-size:13px;}
  .section-header td{background:#0a192f;color:#64ffda;font-weight:700;font-size:13px;padding:10px 12px;border-radius:4px;}
  .thead td{background:#f1f5f9;color:#475569;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;}
  tr:not(.section-header):not(.thead):not(.subtotal):hover{background:#f8fafc;}
  tr:not(.section-header):not(.thead):not(.subtotal){border-bottom:1px solid #f1f5f9;}
  .subtotal{background:#f8fafc;font-weight:700;}
  .subtotal td{border-top:2px solid #e2e8f0;padding:12px;}
  .income{color:#0fba81;font-weight:700;}
  .expense{color:#ff6b6b;font-weight:700;}
  .footer{padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;}
  @media print{body{padding:0;background:white;} .page{box-shadow:none;border-radius:0;} .no-print{display:none;}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="company">${companyName}</div>
    <div class="subtitle">ট্রান্সপোর্ট ম্যানেজমেন্ট সিস্টেম</div>
    <div class="report-info">
      <div class="report-title">${reportType} রিপোর্ট</div>
      <div class="date-range">সময়কাল: ${dateRange}</div>
    </div>
  </div>
  ${reportType!=="গাড়ির তালিকা"?`
  <div class="summary">
    <div class="summary-item"><div class="s-label">মোট আয়</div><div class="s-value s-income">৳${totalIncome.toLocaleString()}</div></div>
    <div class="summary-item"><div class="s-label">মোট খরচ</div><div class="s-value s-expense">৳${totalExp.toLocaleString()}</div></div>
    <div class="summary-item"><div class="s-label">নেট লাভ</div><div class="s-value s-net" style="color:${net>=0?"#0fba81":"#ff6b6b"}">৳${net.toLocaleString()}</div></div>
    <div class="summary-item"><div class="s-label">বেতন দেওয়া</div><div class="s-value" style="color:#1d3461">৳${totalSal.toLocaleString()}</div></div>
  </div>`:""}
  <div class="content">
    <table>${tableRows}</table>
  </div>
  <div class="footer">
    <span>${companyName} — গোপনীয় ব্যবসায়িক দস্তাবেজ</span>
    <span>তৈরির তারিখ: ${new Date().toLocaleDateString("bn-BD")}</span>
  </div>
</div>
<script>
  window.onload=function(){window.print();}
</script>
</body>
</html>`;

    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`${companyName}-${reportType}-${from}-${to}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setGenerating(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>PDF রিপোর্ট 📄</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>প্রিন্টযোগ্য রিপোর্ট তৈরি করুন</p>
      </div>

      <Card className="fu1" style={{padding:22}}>
        <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:18}}>⚙️ রিপোর্ট কনফিগারেশন</h3>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Sel label="রিপোর্টের ধরন" value={reportType} onChange={setReportType} options={REPORT_TYPES}/>
          {reportType!=="গাড়ির তালিকা"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="শুরুর তারিখ" type="date" value={from} onChange={setFrom}/>
              <Field label="শেষ তারিখ" type="date" value={to} onChange={setTo}/>
            </div>
          )}
        </div>
      </Card>

      {reportType!=="গাড়ির তালিকা"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}} className="fu2">
          <StatCard label="মোট আয়" value={BDT(totalIncome)} positive={true} IconComp={I.Up}/>
          <StatCard label="মোট খরচ" value={BDT(totalExp)} positive={false} IconComp={I.Down}/>
          <StatCard label="নেট লাভ" value={BDT(net)} positive={net>=0} IconComp={I.Truck}/>
          <StatCard label="রেকর্ড" value={`${fDaily.length} দিন`} IconComp={I.Daily}/>
        </div>
      )}

      <Card className="fu3" style={{padding:22,background:"linear-gradient(135deg,rgba(15,186,129,0.07),rgba(17,34,64,0.9))",borderColor:"rgba(100,255,218,0.15)"}}>
        <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:6}}>📥 রিপোর্ট ডাউনলোড</h3>
        <p style={{fontSize:12,color:"var(--text-secondary)",marginBottom:18}}>ডাউনলোড হওয়া ফাইলটি খুলুন → ব্রাউজার থেকে Print করুন → PDF হিসেবে সেভ করুন</p>
        <Btn onClick={generatePDF} icon={<I.Dl/>} full disabled={generating}>
          {generating?"তৈরি হচ্ছে...":"রিপোর্ট ডাউনলোড করুন"}
        </Btn>
      </Card>

      <Card className="fu4" style={{padding:18,background:"rgba(15,186,129,0.04)",borderColor:"rgba(15,186,129,0.1)"}}>
        <h3 style={{fontWeight:700,fontSize:13,color:"var(--green-300)",marginBottom:12}}>💡 কীভাবে PDF করবেন</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            "১. উপরের বাটন চাপুন — একটি HTML ফাইল ডাউনলোড হবে",
            "২. ফাইলটি Chrome/Firefox দিয়ে খুলুন",
            "৩. Print করুন (Ctrl+P বা Share → Print)",
            "৪. Destination: Save as PDF সিলেক্ট করুন",
            "৫. Save চাপুন — PDF তৈরি হয়ে যাবে ✅",
          ].map((t,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{color:"var(--green-500)",flexShrink:0,fontSize:12}}>✦</span>
              <span style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.6}}>{t}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}




export default PDFReport;
