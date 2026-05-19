import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ ATTENDANCE ═══
function Attendance({data,setData}){
  const{staff,attendance={}}=data;
  const[selDate,setSelDate]=useState(todayISO());
  const[viewMonth,setViewMonth]=useState(()=>todayISO().slice(0,7));

  const dateKey=selDate;

  const todayAtt=attendance[dateKey]||{};

  const toggleAtt=(sid,status)=>{
    const updated={
      ...attendance,
      [dateKey]:{
        ...todayAtt,
        [sid]:todayAtt[sid]===status?"absent":status,
      }
    };
    setData(p=>{const n={...p,attendance:updated};LS.set("mht_attendance",updated);return n;});
    GS.post({action:"save",sheet:"Attendance",row:{date:dateKey,staffId:sid,staffName:staff.find(s=>s.id===sid)?.name||"",status:updated[dateKey][sid]}});
  };

  const STATUS={present:{label:"উপস্থিত",color:"green",emoji:"✅"},halfday:{label:"অর্ধদিন",color:"amber",emoji:"🌤"},absent:{label:"অনুপস্থিত",color:"red",emoji:"❌"},leave:{label:"ছুটি",color:"blue",emoji:"🏖"}};

  // Monthly summary
  const monthlySummary=useMemo(()=>{
    const summary={};
    staff.forEach(s=>{summary[s.id]={name:s.name,present:0,halfday:0,absent:0,leave:0};});
    Object.entries(attendance).forEach(([date,dayAtt])=>{
      if(!date.startsWith(viewMonth))return;
      Object.entries(dayAtt).forEach(([sid,status])=>{
        if(summary[sid]&&STATUS[status])summary[sid][status]=(summary[sid][status]||0)+1;
      });
    });
    return Object.values(summary);
  },[attendance,staff,viewMonth]);

  const activeStaff=staff.filter(s=>s.isActive);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>স্টাফ অ্যাটেন্ডেন্স 📅</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>দৈনিক উপস্থিতি রেকর্ড</p>
      </div>

      <Card className="fu1" style={{padding:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)"}}>📋 দৈনিক উপস্থিতি</h3>
          <Field type="date" value={selDate} onChange={setSelDate}/>
        </div>

        {activeStaff.length===0?(
          <p style={{textAlign:"center",padding:"28px 0",color:"var(--text-muted)",fontSize:13}}>কোনো সক্রিয় স্টাফ নেই</p>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {activeStaff.map(s=>{
              const cur=todayAtt[s.id]||"absent";
              return(
                <div key={s.id} style={{background:"rgba(2,12,27,0.5)",border:"1px solid rgba(100,255,218,0.08)",borderRadius:12,padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--navy-700),var(--navy-600))",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"var(--green-400)",flexShrink:0}}>{s.name.charAt(0)}</div>
                      <div>
                        <p style={{fontWeight:700,fontSize:13,color:"var(--text-primary)"}}>{s.name}</p>
                        <p style={{fontSize:11,color:"var(--text-secondary)"}}>{s.position||"কর্মী"}</p>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {Object.entries(STATUS).map(([key,val])=>(
                        <button key={key} onClick={()=>toggleAtt(s.id,key)}
                          style={{padding:"5px 12px",borderRadius:999,fontSize:11,fontWeight:700,cursor:"pointer",
                            border:cur===key?`1px solid ${key==="present"?"var(--green-500)":key==="halfday"?"var(--amber)":key==="absent"?"var(--danger)":"#6495ed"}`:"1px solid rgba(255,255,255,0.08)",
                            background:cur===key?key==="present"?"rgba(15,186,129,0.15)":key==="halfday"?"rgba(255,209,102,0.15)":key==="absent"?"rgba(255,107,107,0.15)":"rgba(100,149,237,0.15)":"transparent",
                            color:cur===key?key==="present"?"var(--green-400)":key==="halfday"?"var(--amber)":key==="absent"?"var(--danger)":"#6495ed":"var(--text-muted)",
                            transition:"all 0.15s"}}>
                          {val.emoji} {val.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeStaff.length>0&&(
          <div style={{marginTop:14,display:"flex",gap:10,flexWrap:"wrap"}}>
            {Object.entries(STATUS).map(([key,val])=>{
              const count=activeStaff.filter(s=>(todayAtt[s.id]||"absent")===key).length;
              return count>0&&<Pill key={key} color={val.color}>{val.emoji} {val.label}: {count}</Pill>;
            })}
          </div>
        )}
      </Card>

      <Card className="fu2" style={{padding:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)"}}>📊 মাসিক সারসংক্ষেপ</h3>
          <input type="month" value={viewMonth} onChange={e=>setViewMonth(e.target.value)}
            style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:8,color:"var(--text-primary)",padding:"8px 12px",outline:"none",fontSize:13}}
            onFocus={e=>e.target.style.borderColor="var(--green-500)"}
            onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
        </div>
        {monthlySummary.length===0?(
          <p style={{textAlign:"center",padding:"20px 0",color:"var(--text-muted)",fontSize:13}}>কোনো ডেটা নেই</p>
        ):(
          <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
                <TH>নাম</TH>
                <TH>✅ উপস্থিত</TH>
                <TH>🌤 অর্ধদিন</TH>
                <TH>🏖 ছুটি</TH>
                <TH>❌ অনুপস্থিত</TH>
              </tr></thead>
              <tbody>
                {monthlySummary.map((s,i)=>(
                  <TR key={i}>
                    <TD bold>{s.name}</TD>
                    <TD color="var(--green-400)">{s.present||0}</TD>
                    <TD color="var(--amber)">{s.halfday||0}</TD>
                    <TD color="#6495ed">{s.leave||0}</TD>
                    <TD color="var(--danger)">{s.absent||0}</TD>
                  </TR>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}



export default Attendance;
