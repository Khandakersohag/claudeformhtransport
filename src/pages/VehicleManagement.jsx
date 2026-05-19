import { useState, useMemo, useEffect } from "react";
import { Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn, I } from "../components/common/ui.jsx";
import { BDT, dateStr, todayISO, tsFrom, parseDate } from "../utils/format.js";
import { EXPENSE_CATS, TASK_STATUSES, TASK_PRIORITIES } from "../utils/constants.js";
import LS from "../utils/storage.js";
import GS from "../services/gs.js";

// ═══ VEHICLE MANAGEMENT ═══
function VehicleManagement({data,setData}){
  const{vehicles=[]}=data;
  const[showAdd,setShowAdd]=useState(false);
  const[vNum,setVNum]=useState("");
  const[vModel,setVModel]=useState("");
  const[vType,setVType]=useState("ট্রাক");
  const[taxExp,setTaxExp]=useState(todayISO());
  const[fitExp,setFitExp]=useState(todayISO());
  const[insExp,setInsExp]=useState(todayISO());
  const[routeExp,setRouteExp]=useState(todayISO());
  const[lastService,setLastService]=useState(todayISO());
  const[editId,setEditId]=useState(null);

  const VTYPES=["ট্রাক","পিকআপ","কাভার্ড ভ্যান","বাস","মিনিবাস","অন্যান্য"];
  const WARN_DAYS=30;

  const daysLeft=dateStr=>{
    const diff=new Date(dateStr)-new Date();
    return Math.ceil(diff/86400000);
  };

  const statusColor=days=>{
    if(days<0)return{pill:"red",text:"মেয়াদ শেষ"};
    if(days<=WARN_DAYS)return{pill:"amber",text:`${days} দিন বাকি`};
    return{pill:"green",text:`${days} দিন বাকি`};
  };

  const reset=()=>{setVNum("");setVModel("");setVType("ট্রাক");setTaxExp(todayISO());setFitExp(todayISO());setInsExp(todayISO());setRouteExp(todayISO());setLastService(todayISO());setEditId(null);setShowAdd(false);};

  const loadVehicle=v=>{setVNum(v.number);setVModel(v.model);setVType(v.type);setTaxExp(v.taxExp);setFitExp(v.fitExp);setInsExp(v.insExp);setRouteExp(v.routeExp);setLastService(v.lastService);setEditId(v.id);setShowAdd(true);};

  const save=()=>{
    if(!vNum)return;
    const v={id:editId||Date.now().toString(),number:vNum,model:vModel,type:vType,taxExp,fitExp,insExp,routeExp,lastService,createdAt:Date.now()};
    const list=editId?vehicles.map(x=>x.id===editId?v:x):[v,...vehicles];
    setData(p=>{const n={...p,vehicles:list};LS.set("mht_vehicles",list);return n;});
    GS.post({action:"save",sheet:"Vehicles",row:{id:v.id,number:v.number,model:v.model,type:v.type,taxExp:v.taxExp,fitExp:v.fitExp,insExp:v.insExp,routeExp:v.routeExp,lastService:v.lastService}});
    reset();
  };

  const del=id=>{
    const list=vehicles.filter(v=>v.id!==id);
    setData(p=>{const n={...p,vehicles:list};LS.set("mht_vehicles",list);return n;});
    GS.post({action:"delete",sheet:"Vehicles",id});
  };

  // Expiry alerts
  const alerts=vehicles.flatMap(v=>[
    {vNum:v.number,label:"ট্যাক্স টোকেন",days:daysLeft(v.taxExp)},
    {vNum:v.number,label:"ফিটনেস",days:daysLeft(v.fitExp)},
    {vNum:v.number,label:"বীমা",days:daysLeft(v.insExp)},
    {vNum:v.number,label:"রুট পারমিট",days:daysLeft(v.routeExp)},
  ]).filter(a=>a.days<=WARN_DAYS).sort((a,b)=>a.days-b.days);

  const DOC_LABELS=["ট্যাক্স টোকেন","ফিটনেস","বীমা","রুট পারমিট"];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}} className="fu0">
        <div><h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>গাড়ির তালিকা</h2><p style={{color:"var(--text-secondary)",fontSize:13}}>গাড়ি ও কাগজপত্র ব্যবস্থাপনা</p></div>
        <Btn onClick={()=>setShowAdd(true)} icon={<I.Plus/>}>নতুন গাড়ি</Btn>
      </div>

      {alerts.length>0&&(
        <div className="fu1" style={{background:"rgba(255,209,102,0.08)",border:"1px solid rgba(255,209,102,0.25)",borderRadius:14,padding:16}}>
          <p style={{fontWeight:700,fontSize:13,color:"var(--amber)",marginBottom:10}}>⚠️ মেয়াদ সতর্কতা ({alerts.length}টি)</p>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {alerts.map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(2,12,27,0.4)",borderRadius:9,padding:"8px 12px"}}>
                <span style={{fontSize:13,color:"var(--text-primary)"}}><strong>{a.vNum}</strong> — {a.label}</span>
                <Pill color={a.days<0?"red":"amber"}>{a.days<0?"মেয়াদ শেষ!":`${a.days} দিন বাকি`}</Pill>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"grid",gap:14}} className="fu2">
        {vehicles.length===0?(
          <Card style={{padding:40,textAlign:"center"}}><p style={{color:"var(--text-muted)",fontSize:13}}>🚛 কোনো গাড়ি নেই। প্রথমে একটি গাড়ি যোগ করুন।</p></Card>
        ):vehicles.map(v=>{
          const docs=[
            {label:"ট্যাক্স টোকেন",exp:v.taxExp},
            {label:"ফিটনেস",exp:v.fitExp},
            {label:"বীমা",exp:v.insExp},
            {label:"রুট পারমিট",exp:v.routeExp},
          ];
          return(
            <Card key={v.id} style={{padding:20}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,var(--navy-700),var(--navy-600))",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--green-400)",flexShrink:0}}>
                    <I.Truck/>
                  </div>
                  <div>
                    <p style={{fontWeight:900,fontSize:16,color:"var(--text-primary)"}}>{v.number}</p>
                    <p style={{fontSize:12,color:"var(--text-secondary)"}}>{v.model} · {v.type}</p>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <IconBtn icon={<I.Edit/>} onClick={()=>loadVehicle(v)} hoverColor="var(--green-400)"/>
                  <IconBtn icon={<I.Trash/>} onClick={()=>del(v.id)}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                {docs.map(d=>{
                  const days=daysLeft(d.exp);
                  const sc=statusColor(days);
                  return(
                    <div key={d.label} style={{background:"rgba(2,12,27,0.5)",border:`1px solid ${days<=WARN_DAYS?"rgba(255,209,102,0.2)":"rgba(100,255,218,0.06)"}`,borderRadius:10,padding:"10px 12px"}}>
                      <p style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{d.label}</p>
                      <p style={{fontSize:12,color:"var(--text-secondary)",marginBottom:4}}>{d.exp}</p>
                      <Pill color={sc.pill}>{sc.text}</Pill>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:10,padding:"8px 12px",background:"rgba(2,12,27,0.4)",borderRadius:8,fontSize:12,color:"var(--text-secondary)"}}>
                🔧 সর্বশেষ সার্ভিসিং: <strong style={{color:"var(--green-300)"}}>{v.lastService}</strong>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={reset} title={editId?"গাড়ি সম্পাদনা":"নতুন গাড়ি যোগ করুন"}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="গাড়ির নম্বর" value={vNum} onChange={setVNum} placeholder="ঢাকা-মেট্রো-১২৩৪"/>
            <Field label="মডেল" value={vModel} onChange={setVModel} placeholder="Tata 407"/>
          </div>
          <Sel label="ধরন" value={vType} onChange={setVType} options={VTYPES}/>
          <p style={{fontSize:11,fontWeight:700,color:"var(--green-300)",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:4}}>📄 কাগজপত্রের মেয়াদ</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="ট্যাক্স টোকেন" type="date" value={taxExp} onChange={setTaxExp}/>
            <Field label="ফিটনেস" type="date" value={fitExp} onChange={setFitExp}/>
            <Field label="বীমা" type="date" value={insExp} onChange={setInsExp}/>
            <Field label="রুট পারমিট" type="date" value={routeExp} onChange={setRouteExp}/>
          </div>
          <Field label="সর্বশেষ সার্ভিসিং" type="date" value={lastService} onChange={setLastService}/>
          <div style={{display:"flex",gap:10,marginTop:6}}>
            <Btn onClick={save} icon={<I.Save/>} full>{editId?"আপডেট করুন":"সেভ করুন"}</Btn>
            <Btn v="ghost" onClick={reset} full>বাতিল</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}



export default VehicleManagement;
