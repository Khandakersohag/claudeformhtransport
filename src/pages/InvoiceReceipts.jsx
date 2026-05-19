import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ INVOICE & RECEIPTS ═══
function InvoiceReceipts({data}){
  const{salaries,expenses,staff,settings}=data;
  const[tab,setTab]=useState("বেতন রসিদ");
  const TABS=["বেতন রসিদ","খরচ ভাউচার"];

  const printSalaryReceipt=(sal)=>{
    const s=staff.find(x=>x.id===sal.staffId)||{position:"কর্মী"};
    const html=`
<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Noto Sans Bengali',sans-serif;background:#f8fafc;display:flex;justify-content:center;padding:30px;}
  .receipt{width:380px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);}
  .header{background:linear-gradient(135deg,#0a192f,#1d3461);color:white;padding:22px 24px;text-align:center;}
  .company{font-size:18px;font-weight:900;margin-bottom:2px;}
  .sub{font-size:11px;color:#64ffda;font-weight:600;}
  .receipt-title{background:#0fba81;color:#020c1b;text-align:center;padding:10px;font-weight:900;font-size:14px;letter-spacing:0.05em;}
  .body{padding:22px 24px;}
  .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #e2e8f0;font-size:13px;}
  .row:last-child{border-bottom:none;}
  .label{color:#64748b;}
  .value{font-weight:700;color:#1e293b;}
  .total-row{background:#f0fdf4;border-radius:10px;padding:14px 16px;margin:16px 0;display:flex;justify-content:space-between;align-items:center;}
  .total-label{font-size:13px;color:#166534;font-weight:700;}
  .total-value{font-size:22px;font-weight:900;color:#0fba81;}
  .due{background:#fff5f5;border-radius:10px;padding:10px 16px;display:flex;justify-content:space-between;margin-bottom:16px;}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;}
  .sign-box{text-align:center;padding-top:40px;border-top:1px solid #cbd5e1;font-size:11px;color:#94a3b8;}
  .footer{background:#f8fafc;padding:12px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;}
  .badge{display:inline-block;background:${sal.dueAmount>0?"#fff5f5":"#f0fdf4"};color:${sal.dueAmount>0?"#dc2626":"#166534"};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;}
  @media print{body{background:white;padding:0;} .receipt{box-shadow:none;border-radius:0;width:100%;}}
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="company">${settings.companyName||"M.H. Transport"}</div>
    <div class="sub">ট্রান্সপোর্ট ম্যানেজমেন্ট</div>
  </div>
  <div class="receipt-title">বেতন পরিশোধ রসিদ</div>
  <div class="body">
    <div class="row"><span class="label">কর্মীর নাম</span><span class="value">${sal.staffName}</span></div>
    <div class="row"><span class="label">পদবি</span><span class="value">${s.position||"কর্মী"}</span></div>
    <div class="row"><span class="label">কার্যকাল</span><span class="value">${sal.startDate?new Date(sal.startDate).toLocaleDateString("bn-BD"):"-"} — ${sal.endDate?new Date(sal.endDate).toLocaleDateString("bn-BD"):"-"}</span></div>
    <div class="row"><span class="label">মোট কার্যদিবস</span><span class="value">${sal.totalDays} দিন</span></div>
    <div class="row"><span class="label">মোট প্রাপ্য বেতন</span><span class="value">৳${sal.actualSalary.toLocaleString()}</span></div>
    <div class="total-row">
      <span class="total-label">✅ প্রদত্ত বেতন</span>
      <span class="total-value">৳${sal.paidAmount.toLocaleString()}</span>
    </div>
    ${sal.dueAmount>0?`<div class="due"><span style="font-size:13px;color:#dc2626;font-weight:700;">⚠️ বকেয়া বেতন</span><span style="font-size:16px;font-weight:900;color:#dc2626;">৳${sal.dueAmount.toLocaleString()}</span></div>`:""}
    <div class="row"><span class="label">পরিশোধের তারিখ</span><span class="value">${new Date(sal.paidDate).toLocaleDateString("bn-BD")}</span></div>
    <div class="row"><span class="label">স্ট্যাটাস</span><span class="badge">${sal.dueAmount>0?"আংশিক পরিশোধ":"সম্পূর্ণ পরিশোধ"}</span></div>
    <div class="sign">
      <div class="sign-box">প্রদানকারীর স্বাক্ষর</div>
      <div class="sign-box">গ্রহণকারীর স্বাক্ষর</div>
    </div>
  </div>
  <div class="footer">রসিদ নং: SAL-${sal.id.slice(-6).toUpperCase()} · তৈরি: ${new Date().toLocaleDateString("bn-BD")}</div>
</div>
<script>window.onload=function(){window.print();}</script>
</body>
</html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`salary-receipt-${sal.staffName}-${sal.id.slice(-4)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printExpenseVoucher=(exp)=>{
    const html=`
<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Noto Sans Bengali',sans-serif;background:#f8fafc;display:flex;justify-content:center;padding:30px;}
  .voucher{width:400px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);}
  .header{background:linear-gradient(135deg,#0a192f,#1d3461);color:white;padding:22px 24px;text-align:center;}
  .company{font-size:18px;font-weight:900;margin-bottom:2px;}
  .sub{font-size:11px;color:#64ffda;font-weight:600;}
  .voucher-title{background:#ff6b6b;color:white;text-align:center;padding:10px;font-weight:900;font-size:14px;}
  .body{padding:22px 24px;}
  .amount-box{background:linear-gradient(135deg,#fff5f5,#fee2e2);border:2px solid #fca5a5;border-radius:14px;padding:20px;text-align:center;margin:16px 0;}
  .amount-label{font-size:11px;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
  .amount-value{font-size:32px;font-weight:900;color:#dc2626;}
  .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #e2e8f0;font-size:13px;}
  .label{color:#64748b;}
  .value{font-weight:700;color:#1e293b;}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;}
  .sign-box{text-align:center;padding-top:40px;border-top:1px solid #cbd5e1;font-size:11px;color:#94a3b8;}
  .footer{background:#f8fafc;padding:12px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;}
  @media print{body{background:white;padding:0;} .voucher{box-shadow:none;border-radius:0;width:100%;}}
</style>
</head>
<body>
<div class="voucher">
  <div class="header">
    <div class="company">${settings.companyName||"M.H. Transport"}</div>
    <div class="sub">ট্রান্সপোর্ট ম্যানেজমেন্ট</div>
  </div>
  <div class="voucher-title">খরচ ভাউচার</div>
  <div class="body">
    <div class="amount-box">
      <div class="amount-label">মোট খরচ</div>
      <div class="amount-value">৳${exp.amount.toLocaleString()}</div>
    </div>
    <div class="row"><span class="label">তারিখ</span><span class="value">${new Date(exp.date).toLocaleDateString("bn-BD")}</span></div>
    <div class="row"><span class="label">ক্যাটাগরি</span><span class="value">${exp.category}</span></div>
    <div class="row"><span class="label">বিবরণ</span><span class="value">${exp.description}</span></div>
    <div class="row"><span class="label">ধরন</span><span class="value">${exp.isRecurring?"নিয়মিত খরচ":"একবারের খরচ"}</span></div>
    <div class="sign">
      <div class="sign-box">অনুমোদনকারীর স্বাক্ষর</div>
      <div class="sign-box">গ্রহণকারীর স্বাক্ষর</div>
    </div>
  </div>
  <div class="footer">ভাউচার নং: EXP-${exp.id.slice(-6).toUpperCase()} · তৈরি: ${new Date().toLocaleDateString("bn-BD")}</div>
</div>
<script>window.onload=function(){window.print();}</script>
</body>
</html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`expense-voucher-${exp.category}-${exp.id.slice(-4)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>রসিদ ও ভাউচার 🧾</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>প্রিন্টযোগ্য রসিদ ও ভাউচার তৈরি করুন</p>
      </div>

      <div style={{display:"flex",gap:8}} className="fu1">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 20px",borderRadius:999,fontSize:13,fontWeight:700,cursor:"pointer",border:tab===t?"1px solid var(--green-500)":"1px solid rgba(255,255,255,0.08)",background:tab===t?"rgba(15,186,129,0.15)":"transparent",color:tab===t?"var(--green-400)":"var(--text-secondary)",transition:"all 0.15s"}}>{t}</button>
        ))}
      </div>

      {tab==="বেতন রসিদ"&&(
        <Card className="fu2" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>💰 বেতন রসিদ তালিকা</h3>
          {salaries.length===0?(
            <p style={{textAlign:"center",padding:"28px 0",color:"var(--text-muted)",fontSize:13}}>কোনো বেতন রেকর্ড নেই</p>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[...salaries].reverse().map(sal=>(
                <div key={sal.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,background:"rgba(2,12,27,0.5)",border:"1px solid rgba(100,255,218,0.08)",borderRadius:12,padding:"12px 16px"}}>
                  <div>
                    <p style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{sal.staffName}</p>
                    <p style={{fontSize:12,color:"var(--text-secondary)"}}>{sal.totalDays} দিন · প্রদত্ত: <span style={{color:"var(--green-400)",fontWeight:700}}>{BDT(sal.paidAmount)}</span> {sal.dueAmount>0&&<span style={{color:"var(--danger)"}}>· বাকি: {BDT(sal.dueAmount)}</span>}</p>
                  </div>
                  <Btn v="success" size="sm" onClick={()=>printSalaryReceipt(sal)} icon={<I.Dl/>}>রসিদ</Btn>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab==="খরচ ভাউচার"&&(
        <Card className="fu2" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>💸 খরচ ভাউচার তালিকা</h3>
          {expenses.length===0?(
            <p style={{textAlign:"center",padding:"28px 0",color:"var(--text-muted)",fontSize:13}}>কোনো খরচ নেই</p>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[...expenses].reverse().map(exp=>(
                <div key={exp.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,background:"rgba(2,12,27,0.5)",border:"1px solid rgba(100,255,218,0.08)",borderRadius:12,padding:"12px 16px"}}>
                  <div>
                    <p style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{exp.description}</p>
                    <p style={{fontSize:12,color:"var(--text-secondary)"}}>{exp.category} · {dateStr(exp.date)} · <span style={{color:"var(--danger)",fontWeight:700}}>{BDT(exp.amount)}</span></p>
                  </div>
                  <Btn v="ghost" size="sm" onClick={()=>printExpenseVoucher(exp)} icon={<I.Dl/>}>ভাউচার</Btn>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="fu3" style={{padding:18,background:"rgba(15,186,129,0.04)",borderColor:"rgba(15,186,129,0.1)"}}>
        <h3 style={{fontWeight:700,fontSize:13,color:"var(--green-300)",marginBottom:10}}>💡 ব্যবহার নির্দেশিকা</h3>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {["রসিদ/ভাউচার বাটন চাপলে HTML ফাইল ডাউনলোড হবে","ফাইলটি Chrome দিয়ে খুলুন — স্বয়ংক্রিয় Print dialog আসবে","Save as PDF করুন অথবা সরাসরি প্রিন্ট করুন"].map((t,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{color:"var(--green-500)",flexShrink:0}}>✦</span>
              <span style={{fontSize:12,color:"var(--text-secondary)"}}>{t}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}




export default InvoiceReceipts;
