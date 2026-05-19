import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ STAFF SALARY ═══
function StaffSalary({data,setData}){
  const{staff,salaries}=data;
  const[showAdd,setShowAdd]=useState(false);
  const[showPay,setShowPay]=useState(false);
  const[sel,setSel]=useState(null);
  const[sName,setSName]=useState("");const[sPos,setSPos]=useState("");const[sRate,setSRate]=useState("");
  const[salStart,setSalStart]=useState(todayISO());const[salEnd,setSalEnd]=useState(todayISO());const[salPaid,setSalPaid]=useState("");

  const addStaff=()=>{
    if(!sName||!sRate)return;
    const s={id:Date.now().toString(),name:sName,position:sPos,dailyRate:Number(sRate),isActive:true};
    const list=[...staff,s];setData(p=>{const n={...p,staff:list};LS.set("mht_staff",list);return n;});
    GS.post({action:"save",sheet:"Staff",row:{id:s.id,name:s.name,position:s.position,dailyRate:s.dailyRate,isActive:s.isActive}});
    setSName("");setSPos("");setSRate("");setShowAdd(false);
  };
  const toggle=id=>{const list=staff.map(s=>s.id===id?{...s,isActive:!s.isActive}:s);setData(p=>{const n={...p,staff:list};LS.set("mht_staff",list);return n;});};
  const del=id=>{const list=staff.filter(s=>s.id!==id);setData(p=>{const n={...p,staff:list};LS.set("mht_staff",list);return n;});GS.post({action:"delete",sheet:"Staff",id});};
  const openPay=s=>{setSel(s);setSalStart(todayISO());setSalEnd(todayISO());setSalPaid("");setShowPay(true);};
  const calcDays=()=>Math.max(1,Math.ceil((tsFrom(salEnd)-tsFrom(salStart))/86400000)+1);
  const pay=()=>{
    if(!sel||!salPaid)return;
    const days=calcDays();const actual=days*sel.dailyRate;const paid=Number(salPaid);
    const sal={id:Date.now().toString(),staffId:sel.id,staffName:sel.name,startDate:tsFrom(salStart),endDate:tsFrom(salEnd),totalDays:days,actualSalary:actual,paidAmount:paid,dueAmount:actual-paid,paidDate:Date.now()};
    const list=[...salaries,sal];setData(p=>{const n={...p,salaries:list};LS.set("mht_salaries",list);return n;});
    GS.post({action:"save",sheet:"Salaries",row:{id:sal.id,staffId:sal.staffId,staffName:sal.staffName,startDate:new Date(sal.startDate).toISOString().split("T")[0],endDate:new Date(sal.endDate).toISOString().split("T")[0],totalDays:sal.totalDays,actualSalary:sal.actualSalary,paidAmount:sal.paidAmount,dueAmount:sal.dueAmount,paidDate:new Date(sal.paidDate).toISOString().split("T")[0]}});
    setShowPay(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}} className="fu0">
        <div><h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>স্টাফ ও বেতন</h2><p style={{color:"var(--text-secondary)",fontSize:13}}>কর্মী ও বেতন ব্যবস্থাপনা</p></div>
        <Btn onClick={()=>setShowAdd(true)} icon={<I.Plus/>}>নতুন স্টাফ</Btn>
      </div>
      <div style={{display:"grid",gap:18}}>
        <Card className="fu1" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>👥 স্টাফ তালিকা</h3>
          {staff.length===0?<div style={{textAlign:"center",padding:"28px 0",color:"var(--text-muted)",fontSize:13}}>কোনো স্টাফ নেই</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {staff.map(s=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,background:"rgba(2,12,27,0.5)",border:"1px solid rgba(100,255,218,0.08)",borderRadius:12,padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:s.isActive?"linear-gradient(135deg,var(--green-500),#0d9e6e)":"var(--navy-700)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:s.isActive?"#020c1b":"var(--text-muted)",flexShrink:0}}>{s.name.charAt(0)}</div>
                    <div>
                      <p style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{s.name}</p>
                      <p style={{fontSize:12,color:"var(--text-secondary)"}}>{s.position||"কর্মী"} · {BDT(s.dailyRate)}/দিন</p>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <Pill color={s.isActive?"green":"navy"}>{s.isActive?"সক্রিয়":"অসক্রিয়"}</Pill>
                    <Btn v="success" size="sm" onClick={()=>openPay(s)}>বেতন দিন</Btn>
                    <Btn v="navy" size="sm" onClick={()=>toggle(s.id)}>{s.isActive?"বন্ধ":"চালু"}</Btn>
                    <IconBtn icon={<I.Trash/>} onClick={()=>del(s.id)}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="fu2" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>💰 বেতন রেকর্ড</h3>
          {salaries.length===0?<div style={{textAlign:"center",padding:"28px 0",color:"var(--text-muted)",fontSize:13}}>কোনো বেতন রেকর্ড নেই</div>:(
            <div style={{overflowX:"auto"}}>
              <table><thead><tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
                <TH>নাম</TH><TH>দিন</TH><TH right>প্রাপ্য</TH><TH right>প্রদত্ত</TH><TH right>বাকি</TH>
              </tr></thead>
              <tbody>{[...salaries].reverse().map(s=>(
                <TR key={s.id}>
                  <TD bold>{s.staffName}</TD><TD color="var(--text-secondary)">{s.totalDays}</TD>
                  <TD right mono color="var(--text-secondary)">{BDT(s.actualSalary)}</TD>
                  <TD right mono bold color="var(--green-400)">{BDT(s.paidAmount)}</TD>
                  <TD right mono bold color={s.dueAmount>0?"var(--danger)":"var(--green-400)"}>{BDT(s.dueAmount)}</TD>
                </TR>
              ))}</tbody></table>
            </div>
          )}
        </Card>
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="নতুন স্টাফ যোগ করুন">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="নাম" value={sName} onChange={setSName} placeholder="স্টাফের নাম"/>
          <Field label="পদবি" value={sPos} onChange={setSPos} placeholder="ড্রাইভার / হেল্পার"/>
          <Field label="দৈনিক রেট (৳)" type="number" min="0" value={sRate} onChange={setSRate} placeholder="500"/>
          <div style={{display:"flex",gap:10,marginTop:6}}><Btn onClick={addStaff} icon={<I.Save/>} full>সেভ করুন</Btn><Btn v="ghost" onClick={()=>setShowAdd(false)} full>বাতিল</Btn></div>
        </div>
      </Modal>
      <Modal open={showPay} onClose={()=>setShowPay(false)} title={`বেতন প্রদান — ${sel?.name}`}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="শুরু" type="date" value={salStart} onChange={setSalStart}/>
            <Field label="শেষ" type="date" value={salEnd} onChange={setSalEnd}/>
          </div>
          {salStart&&salEnd&&<div style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.1)",borderRadius:10,padding:14}}>
            {[["মোট দিন",calcDays()],["দৈনিক রেট",BDT(sel?.dailyRate)],["প্রাপ্য বেতন",BDT(calcDays()*(sel?.dailyRate||0))]].map(([l,v],i)=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:i<2?8:0,paddingTop:i===2?10:0,borderTop:i===2?"1px solid rgba(255,255,255,0.06)":"none"}}>
                <span style={{color:"var(--text-secondary)"}}>{l}</span>
                <span style={{fontWeight:i===2?900:700,color:i===2?"var(--green-400)":"var(--text-primary)"}}>{v}</span>
              </div>
            ))}
          </div>}
          <Field label="প্রদত্ত পরিমাণ (৳)" type="number" min="0" value={salPaid} onChange={setSalPaid} placeholder="0"/>
          <div style={{display:"flex",gap:10,marginTop:6}}><Btn onClick={pay} icon={<I.Check/>} full>বেতন দিন</Btn><Btn v="ghost" onClick={()=>setShowPay(false)} full>বাতিল</Btn></div>
        </div>
      </Modal>
    </div>
  );
}



export default StaffSalary;
