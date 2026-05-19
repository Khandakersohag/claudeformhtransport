import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ TASK MANAGEMENT ═══
function TaskManagement({data,setData}){
  const{tasks,staff}=data;
  const[showAdd,setShowAdd]=useState(false);
  const[title,setTitle]=useState("");const[desc,setDesc]=useState("");
  const[priority,setPriority]=useState("medium");const[dueDate,setDueDate]=useState(todayISO());
  const[assignedTo,setAssignedTo]=useState("");const[filterStatus,setFilterStatus]=useState("সব");

  const add=()=>{
    if(!title)return;
    const t={id:Date.now().toString(),title,description:desc,status:"pending",priority,dueDate:tsFrom(dueDate),createdAt:Date.now(),assignedTo};
    const list=[t,...tasks];setData(p=>{const n={...p,tasks:list};LS.set("mht_tasks",list);return n;});
    GS.post({action:"save",sheet:"Tasks",row:{id:t.id,title:t.title,description:t.description,status:t.status,priority:t.priority,dueDate:new Date(t.dueDate).toISOString().split("T")[0],assignedTo:t.assignedTo}});
    setTitle("");setDesc("");setPriority("medium");setDueDate(todayISO());setAssignedTo("");setShowAdd(false);
  };
  const upStatus=(id,status)=>{const list=tasks.map(t=>t.id===id?{...t,status}:t);setData(p=>{const n={...p,tasks:list};LS.set("mht_tasks",list);return n;});};
  const del=id=>{const list=tasks.filter(t=>t.id!==id);setData(p=>{const n={...p,tasks:list};LS.set("mht_tasks",list);return n;});GS.post({action:"delete",sheet:"Tasks",id});};
  const filtered=filterStatus==="সব"?tasks:tasks.filter(t=>t.status===filterStatus);
  const prC={low:"green",medium:"amber",high:"red"};
  const stC={pending:"navy","in-progress":"blue",completed:"green",cancelled:"red"};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}} className="fu0">
        <div><h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>কাজের তালিকা</h2><p style={{color:"var(--text-secondary)",fontSize:13}}>অপারেশনাল টাস্ক ম্যানেজমেন্ট</p></div>
        <Btn onClick={()=>setShowAdd(true)} icon={<I.Plus/>}>নতুন কাজ</Btn>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}} className="fu1">
        {["সব",...Object.keys(TASK_STATUSES)].map(s=>(
          <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"6px 14px",borderRadius:999,fontSize:12,fontWeight:700,cursor:"pointer",border:filterStatus===s?"1px solid var(--green-500)":"1px solid rgba(255,255,255,0.08)",background:filterStatus===s?"rgba(15,186,129,0.15)":"transparent",color:filterStatus===s?"var(--green-400)":"var(--text-secondary)",transition:"all 0.15s"}}>
            {s==="সব"?"সব":TASK_STATUSES[s]} ({s==="সব"?tasks.length:tasks.filter(t=>t.status===s).length})
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
        {filtered.length===0?<div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 0",color:"var(--text-muted)",fontSize:13}}>কোনো কাজ নেই</div>:
        filtered.map((t,idx)=>(
          <Card key={t.id} className={`fu${(idx%4)+1}`} style={{padding:18}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Pill color={prC[t.priority]}>{TASK_PRIORITIES[t.priority]}</Pill><Pill color={stC[t.status]}>{TASK_STATUSES[t.status]}</Pill></div>
              <IconBtn icon={<I.Trash/>} onClick={()=>del(t.id)}/>
            </div>
            <h4 style={{fontWeight:700,fontSize:14,color:"var(--text-primary)",marginBottom:6}}>{t.title}</h4>
            {t.description&&<p style={{fontSize:12,color:"var(--text-secondary)",marginBottom:10,lineHeight:1.5}}>{t.description}</p>}
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <p style={{fontSize:11,color:"var(--text-muted)"}}>শেষ: {dateStr(t.dueDate)}</p>
              {t.assignedTo&&<p style={{fontSize:11,color:"var(--text-secondary)"}}>👤 {staff.find(s=>s.id===t.assignedTo)?.name||"?"}</p>}
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:12}}>
              {Object.keys(TASK_STATUSES).filter(s=>s!==t.status).map(s=>(
                <button key={s} onClick={()=>upStatus(t.id,s)} style={{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"var(--text-secondary)",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--green-500)";e.currentTarget.style.color="var(--green-400)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.color="var(--text-secondary)";}}>
                  {TASK_STATUSES[s]}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="নতুন কাজ যোগ করুন">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="শিরোনাম" value={title} onChange={setTitle} placeholder="কাজের শিরোনাম"/>
          <Field label="বিবরণ" value={desc} onChange={setDesc} placeholder="বিস্তারিত"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Sel label="অগ্রাধিকার" value={priority} onChange={setPriority} options={Object.entries(TASK_PRIORITIES).map(([v,l])=>({value:v,label:l}))}/>
            <Field label="শেষ তারিখ" type="date" value={dueDate} onChange={setDueDate}/>
          </div>
          {staff.length>0&&<Sel label="দায়িত্বপ্রাপ্ত" value={assignedTo} onChange={setAssignedTo} options={[{value:"",label:"— নির্বাচন করুন —"},...staff.map(s=>({value:s.id,label:s.name}))]}/>}
          <div style={{display:"flex",gap:10,marginTop:6}}><Btn onClick={add} icon={<I.Save/>} full>যোগ করুন</Btn><Btn v="ghost" onClick={()=>setShowAdd(false)} full>বাতিল</Btn></div>
        </div>
      </Modal>
    </div>
  );
}



export default TaskManagement;
