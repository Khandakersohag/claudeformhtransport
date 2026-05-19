import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ SETTINGS ═══
function SettingsPage({data,setData}){
  const{settings}=data;
  const[tripRate,setTripRate]=useState(settings.tripRate);
  const[carRate,setCarRate]=useState(settings.carRate);
  const[companyName,setCompanyName]=useState(settings.companyName||"New M.H. Transport");

  const save=()=>{const s={tripRate:Number(tripRate),carRate:Number(carRate),companyName};setData(p=>{const n={...p,settings:s};LS.set("mht_settings",s);return n;});alert("✅ সেটিংস সেভ হয়েছে!");};
  const exportAll=()=>{const a=document.createElement("a");a.href="data:application/json,"+encodeURIComponent(JSON.stringify(data,null,2));a.download="mh-transport-backup.json";a.click();};
  const importAll=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);Object.entries(d).forEach(([k,v])=>LS.set(`mht_${k}`,v));setData(d);alert("✅ ডেটা আমদানি সফল!");}catch{alert("❌ ফাইল ফরম্যাট ভুল।");}};reader.readAsText(file);};
  const clearAll=()=>{if(!confirm("⚠️ সমস্ত ডেটা মুছে ফেলতে চান?"))return;["mht_daily","mht_staff","mht_expenses","mht_salaries","mht_tasks"].forEach(k=>localStorage.removeItem(k));window.location.reload();};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0"><h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>সেটিংস</h2><p style={{color:"var(--text-secondary)",fontSize:13}}>অ্যাপ কনফিগারেশন ও ডেটা ব্যবস্থাপনা</p></div>
      <div style={{display:"grid",gap:18}}>
        <Card className="fu1" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:18}}>⚙️ ব্যবসায়িক সেটিংস</h3>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Field label="প্রতিষ্ঠানের নাম" value={companyName} onChange={setCompanyName}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="ট্রিপ রেট (৳/ট্রিপ)" type="number" min="0" value={tripRate} onChange={setTripRate}/>
              <Field label="গাড়ি রেট (৳/গাড়ি)" type="number" min="0" value={carRate} onChange={setCarRate}/>
            </div>
            <div><Btn onClick={save} icon={<I.Save/>}>সেটিংস সেভ করুন</Btn></div>
          </div>
        </Card>
        <Card className="fu2" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:18}}>💾 ডেটা ব্যবস্থাপনা</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Btn v="ghost" onClick={exportAll} icon={<I.Dl/>} full>সব ডেটা ব্যাকআপ (JSON)</Btn>
            <label style={{display:"block"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 20px",borderRadius:12,border:"1px solid rgba(100,255,218,0.25)",color:"var(--green-500)",fontWeight:600,fontSize:13,cursor:"pointer"}}>
                <I.Ul/> ডেটা পুনরুদ্ধার করুন
              </div>
              <input type="file" accept=".json" onChange={importAll} style={{display:"none"}}/>
            </label>
          </div>
          <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(255,107,107,0.15)"}}>
            <p style={{fontSize:12,color:"var(--danger)",display:"flex",alignItems:"center",gap:6,marginBottom:10}}><I.Warn/> বিপজ্জনক এলাকা</p>
            <Btn v="danger" onClick={clearAll} full>সমস্ত ডেটা মুছুন</Btn>
          </div>
        </Card>
        <Card className="fu3" style={{padding:20,background:"rgba(15,186,129,0.04)",borderColor:"rgba(15,186,129,0.1)"}}>
          <h3 style={{fontWeight:700,fontSize:13,color:"var(--green-300)",marginBottom:12}}>💡 ব্যবহারের নির্দেশিকা</h3>
          <ul style={{fontSize:12,color:"var(--text-secondary)",lineHeight:2,listStylePosition:"inside"}}>
            {["ডেটা আপনার ব্রাউজারের localStorage-এ সংরক্ষিত হয়।","নিয়মিত JSON ব্যাকআপ নিন — ডেটা হারানো রোধ করুন।","ব্রাউজার ক্যাশ পরিষ্কার করলে ডেটা মুছে যেতে পারে।","Vercel / Netlify-তে বিনামূল্যে হোস্ট করা যায়।"].map((t,i)=>(
              <li key={i}>✦ {t}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}




export default SettingsPage;
