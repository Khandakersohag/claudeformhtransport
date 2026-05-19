import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ EXPENSE TRACKER ═══
function ExpenseTracker({data,setData}){
  const{expenses}=data;
  const[showAdd,setShowAdd]=useState(false);
  const[date,setDate]=useState(todayISO());const[cat,setCat]=useState(EXPENSE_CATS[0]);
  const[amount,setAmount]=useState("");const[desc,setDesc]=useState("");
  const[isRec,setIsRec]=useState(false);const[filterCat,setFilterCat]=useState("সব");

  const add=()=>{
    if(!amount||Number(amount)<=0)return;
    const e={id:Date.now().toString(),date:tsFrom(date),category:cat,amount:Number(amount),description:desc||cat,isRecurring:isRec};
    const list=[e,...expenses];setData(p=>{const n={...p,expenses:list};LS.set("mht_expenses",list);return n;});
    GS.post({action:"save",sheet:"Expenses",row:{id:e.id,date:new Date(e.date).toISOString().split("T")[0],category:e.category,amount:e.amount,description:e.description,isRecurring:e.isRecurring}});
    setAmount("");setDesc("");setShowAdd(false);
  };
  const del=id=>{const list=expenses.filter(e=>e.id!==id);setData(p=>{const n={...p,expenses:list};LS.set("mht_expenses",list);return n;});GS.post({action:"delete",sheet:"Expenses",id});};
  const filtered=filterCat==="সব"?expenses:expenses.filter(e=>e.category===filterCat);
  const total=filtered.reduce((a,e)=>a+e.amount,0);
  const byCat=useMemo(()=>{const m={};expenses.forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;});return m;},[expenses]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}} className="fu0">
        <div><h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>খরচ ট্র্যাকার</h2><p style={{color:"var(--text-secondary)",fontSize:13}}>বিবিধ ব্যয় পর্যবেক্ষণ</p></div>
        <Btn onClick={()=>setShowAdd(true)} icon={<I.Plus/>}>নতুন খরচ</Btn>
      </div>
      {Object.keys(byCat).length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}} className="fu1">
        {Object.entries(byCat).map(([c,a])=>(
          <div key={c} style={{background:"rgba(15,186,129,0.05)",border:"1px solid rgba(15,186,129,0.1)",borderRadius:12,padding:"14px 16px",cursor:"pointer"}} onClick={()=>setFilterCat(filterCat===c?"সব":c)}>
            <p style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{c}</p>
            <p style={{fontSize:18,fontWeight:900,color:"var(--green-300)"}}>{BDT(a)}</p>
          </div>
        ))}
      </div>}
      <Card className="fu2" style={{padding:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)"}}>তালিকা · <span style={{color:"var(--danger)"}}>{BDT(total)}</span></h3>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["সব",...EXPENSE_CATS].map(c=>(
              <button key={c} onClick={()=>setFilterCat(c)} style={{padding:"4px 12px",borderRadius:999,fontSize:11,fontWeight:700,cursor:"pointer",border:filterCat===c?"1px solid var(--green-500)":"1px solid rgba(255,255,255,0.08)",background:filterCat===c?"rgba(15,186,129,0.15)":"transparent",color:filterCat===c?"var(--green-400)":"var(--text-secondary)",transition:"all 0.15s"}}>{c}</button>
            ))}
          </div>
        </div>
        {filtered.length===0?<div style={{textAlign:"center",padding:"28px 0",color:"var(--text-muted)",fontSize:13}}>কোনো খরচ নেই</div>:(
          <div style={{overflowX:"auto"}}>
            <table><thead><tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
              <TH>তারিখ</TH><TH>ক্যাটাগরি</TH><TH>বিবরণ</TH><TH right>পরিমাণ</TH><TH></TH>
            </tr></thead>
            <tbody>{filtered.map(e=>(
              <TR key={e.id}>
                <TD color="var(--text-secondary)">{dateStr(e.date)}</TD>
                <TD><Pill color="amber">{e.category}</Pill></TD>
                <TD>{e.description}{e.isRecurring&&<> <Pill color="blue">নিয়মিত</Pill></>}</TD>
                <TD right mono bold color="var(--danger)">{BDT(e.amount)}</TD>
                <td style={{padding:"11px 8px"}}><IconBtn icon={<I.Trash/>} onClick={()=>del(e.id)}/></td>
              </TR>
            ))}</tbody></table>
          </div>
        )}
      </Card>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="নতুন খরচ যোগ করুন">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="তারিখ" type="date" value={date} onChange={setDate}/>
          <Sel label="ক্যাটাগরি" value={cat} onChange={setCat} options={EXPENSE_CATS}/>
          <Field label="পরিমাণ (৳)" type="number" min="0" value={amount} onChange={setAmount} placeholder="0"/>
          <Field label="বিবরণ" value={desc} onChange={setDesc} placeholder="খরচের বিবরণ"/>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text-secondary)",cursor:"pointer"}}>
            <input type="checkbox" checked={isRec} onChange={e=>setIsRec(e.target.checked)} style={{accentColor:"var(--green-500)"}}/>নিয়মিত খরচ
          </label>
          <div style={{display:"flex",gap:10,marginTop:6}}><Btn onClick={add} icon={<I.Save/>} full>যোগ করুন</Btn><Btn v="ghost" onClick={()=>setShowAdd(false)} full>বাতিল</Btn></div>
        </div>
      </Modal>
    </div>
  );
}



export default ExpenseTracker;
