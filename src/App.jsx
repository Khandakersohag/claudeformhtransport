import { useState, useEffect, useMemo } from "react";

const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&display=swap";
document.head.appendChild(FONT_LINK);

const GLOBAL_CSS = `
  :root {
    --navy-950: #020c1b;
    --navy-900: #0a192f;
    --navy-800: #112240;
    --navy-700: #1d3461;
    --green-500: #0fba81;
    --green-400: #1de9b6;
    --green-300: #64ffda;
    --text-primary: #e6f1ff;
    --text-secondary: #8892b0;
    --text-muted: #4a5568;
    --card-bg: rgba(17,34,64,0.85);
    --card-border: rgba(100,255,218,0.08);
    --danger: #ff6b6b;
    --amber: #ffd166;
    --shadow-card: 0 4px 24px rgba(2,12,27,0.5);
    --shadow-glow: 0 0 20px rgba(15,186,129,0.15);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans Bengali', sans-serif; background: var(--navy-950); color: var(--text-primary); min-height: 100vh; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--navy-900); }
  ::-webkit-scrollbar-thumb { background: var(--navy-700); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--green-500); }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(15,186,129,0.4);} 50%{box-shadow:0 0 0 6px rgba(15,186,129,0);} }
  .fu0{animation:fadeUp .35s ease both;}
  .fu1{animation:fadeUp .35s .05s ease both;}
  .fu2{animation:fadeUp .35s .1s ease both;}
  .fu3{animation:fadeUp .35s .15s ease both;}
  .fu4{animation:fadeUp .35s .2s ease both;}
  input,select,textarea,button { font-family:'Noto Sans Bengali',sans-serif; }
  table { border-collapse:collapse; width:100%; }
`;

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxIKQDbkVU2JjCKOA2Kqw1CDKoX76mi1LyTT4bKTY8lZJaSxcjrAXrCfQnQeZ1Pq8AZ/exec";

const GS = {
  post: async (body) => {
    try {
      await fetch(SCRIPT_URL, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    } catch(e) { console.error(e); }
  },
  getAll: async (sheet) => {
    try {
      const res = await fetch(`${SCRIPT_URL}?sheet=${sheet}`);
      const d = await res.json();
      return d.success ? d.data : [];
    } catch(e) { return []; }
  },
};

const LS = {
  get:(k,d)=>{ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;} },
  set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} },
};
const initData=()=>({
  settings: LS.get("mht_settings",{tripRate:240,carRate:10,companyName:"New M.H. Transport"}),
  dailyRecords: LS.get("mht_daily",[]),
  staff: LS.get("mht_staff",[]),
  expenses: LS.get("mht_expenses",[]),
  salaries: LS.get("mht_salaries",[]),
  tasks: LS.get("mht_tasks",[]),
  vehicles: LS.get("mht_vehicles",[]),
});
const BDT=n=>`৳${Number(n||0).toLocaleString("bn-BD")}`;
const dateStr=ts=>new Date(ts).toLocaleDateString("bn-BD",{day:"2-digit",month:"short",year:"numeric"});
const todayISO=()=>new Date().toISOString().split("T")[0];
const tsFrom=s=>new Date(s).getTime();
const EXPENSE_CATS=["Fuel","Servicing","Staff Salary","Office","Police","Welfare","Misc"];
const TASK_STATUSES={pending:"বাকি","in-progress":"চলছে",completed:"সম্পন্ন",cancelled:"বাতিল"};
const TASK_PRIORITIES={low:"কম",medium:"মাঝারি",high:"জরুরি"};

const Ic=({d,s=18})=>(
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {[].concat(d).map((p,i)=><path key={i} d={p}/>)}
  </svg>
);
const I={
  Home:()=><Ic d={["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"]}/>,
  Daily:()=><Ic d={["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"]}/>,
  Staff:()=><Ic d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"]}/>,
  Expense:()=><Ic d={["M12 1v22","M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]}/>,
  Report:()=><Ic d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"]}/>,
  Task:()=><Ic d={["M9 11l3 3L22 4","M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"]}/>,
  Gear:()=><Ic d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]}/>,
  Truck:()=><Ic d={["M1 3h15v13H1z","M16 8h4l3 3v5h-7V8z","M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z","M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"]}/>,
  Plus:()=><Ic d={["M12 5v14","M5 12h14"]}/>,
  Trash:()=><Ic d={["M3 6h18","M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"]}/>,
  Edit:()=><Ic d={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]}/>,
  Save:()=><Ic d={["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z","M17 21v-8H7v8","M7 3v5h8"]}/>,
  X:()=><Ic d={["M18 6 6 18","M6 6l12 12"]}/>,
  Check:()=><Ic d="M20 6 9 17l-5-5"/>,
  Up:()=><Ic d={["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"]}/>,
  Down:()=><Ic d={["M23 18l-9.5-9.5-5 5L1 6","M17 18h6v-6"]}/>,
  Menu:()=><Ic d={["M3 12h18","M3 6h18","M3 18h18"]}/>,
  Dl:()=><Ic d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"]}/>,
  Ul:()=><Ic d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]}/>,
  Warn:()=><Ic d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"]}/>,
};

const C={
  card:{background:"var(--card-bg)",border:"1px solid var(--card-border)",borderRadius:16,boxShadow:"var(--shadow-card)",backdropFilter:"blur(12px)"},
  cardGlow:{background:"var(--card-bg)",border:"1px solid rgba(100,255,218,0.2)",borderRadius:16,boxShadow:"var(--shadow-glow),var(--shadow-card)",backdropFilter:"blur(12px)"},
};

const Card=({children,className="",glow=false,style={}})=>(
  <div className={className} style={{...( glow?C.cardGlow:C.card),...style}}>{children}</div>
);

const Btn=({children,onClick,v="primary",size="md",icon,disabled,full,type="button"})=>{
  const sz={sm:{padding:"6px 14px",fontSize:12},md:{padding:"10px 20px",fontSize:13},lg:{padding:"12px 24px",fontSize:14}};
  const vs={
    primary:{background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",color:"#020c1b",border:"none",fontWeight:700},
    ghost:{background:"transparent",color:"var(--green-500)",border:"1px solid rgba(100,255,218,0.25)",fontWeight:600},
    danger:{background:"rgba(255,107,107,0.12)",color:"var(--danger)",border:"1px solid rgba(255,107,107,0.25)",fontWeight:600},
    navy:{background:"var(--navy-700)",color:"var(--text-primary)",border:"1px solid rgba(255,255,255,0.08)",fontWeight:600},
    success:{background:"rgba(15,186,129,0.12)",color:"var(--green-400)",border:"1px solid rgba(15,186,129,0.25)",fontWeight:600},
  };
  return(
    <button type={type} onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",gap:8,cursor:disabled?"not-allowed":"pointer",borderRadius:12,transition:"all 0.18s ease",opacity:disabled?0.5:1,width:full?"100%":undefined,justifyContent:full?"center":undefined,fontFamily:"'Noto Sans Bengali',sans-serif",...sz[size],...vs[v]}}
      onMouseEnter={e=>{if(!disabled){e.currentTarget.style.filter="brightness(1.12)";e.currentTarget.style.transform="translateY(-1px)";}}}
      onMouseLeave={e=>{e.currentTarget.style.filter="";e.currentTarget.style.transform="";}}>
      {icon&&<span style={{display:"flex",flexShrink:0}}>{icon}</span>}
      {children}
    </button>
  );
};

const Field=({label,value,onChange,type="text",placeholder,min})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {label&&<span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</span>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min}
      style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:8,color:"var(--text-primary)",padding:"10px 14px",outline:"none",width:"100%",transition:"border-color 0.2s"}}
      onFocus={e=>e.target.style.borderColor="var(--green-500)"}
      onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
  </div>
);

const Sel=({label,value,onChange,options})=>(
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {label&&<span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</span>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{background:"rgba(2,12,27,0.7)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:8,color:"var(--text-primary)",padding:"10px 14px",outline:"none",width:"100%",appearance:"none",cursor:"pointer"}}>
      {options.map(o=><option key={o.value??o} value={o.value??o} style={{background:"#0a192f"}}>{o.label??o}</option>)}
    </select>
  </div>
);

const Pill=({children,color="navy"})=>{
  const cs={navy:{bg:"rgba(29,52,97,0.8)",c:"var(--text-secondary)",b:"rgba(100,255,218,0.1)"},green:{bg:"rgba(15,186,129,0.12)",c:"var(--green-400)",b:"rgba(15,186,129,0.25)"},red:{bg:"rgba(255,107,107,0.12)",c:"var(--danger)",b:"rgba(255,107,107,0.25)"},amber:{bg:"rgba(255,209,102,0.1)",c:"var(--amber)",b:"rgba(255,209,102,0.25)"},blue:{bg:"rgba(100,149,237,0.12)",c:"#6495ed",b:"rgba(100,149,237,0.3)"}};
  const c=cs[color];
  return<span style={{background:c.bg,color:c.c,border:`1px solid ${c.b}`,borderRadius:999,padding:"2px 10px",fontSize:11,fontWeight:700,letterSpacing:"0.05em",display:"inline-block"}}>{children}</span>;
};

const Modal=({open,onClose,title,children})=>{
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(2,12,27,0.85)",backdropFilter:"blur(6px)"}}/>
      <div style={{position:"relative",width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",borderRadius:16,background:"var(--navy-800)",border:"1px solid rgba(100,255,218,0.15)",boxShadow:"0 24px 80px rgba(2,12,27,0.8)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
          <h3 style={{fontWeight:700,fontSize:15,color:"var(--green-300)"}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",padding:4,display:"flex",borderRadius:8}}><I.X/></button>
        </div>
        <div style={{padding:22}}>{children}</div>
      </div>
    </div>
  );
};

const StatCard=({label,value,sub,IconComp,positive,cls=""})=>(
  <Card glow={positive===true} className={cls} style={{padding:20}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
      <div style={{padding:10,borderRadius:12,background:positive===true?"rgba(15,186,129,0.15)":positive===false?"rgba(255,107,107,0.1)":"rgba(255,255,255,0.05)",color:positive===true?"var(--green-400)":positive===false?"var(--danger)":"var(--text-secondary)",display:"flex"}}>
        <IconComp/>
      </div>
      {sub&&<span style={{fontSize:11,color:positive?"var(--green-400)":"var(--danger)",fontWeight:700}}>{sub}</span>}
    </div>
    <p style={{fontSize:10,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{label}</p>
    <p style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",letterSpacing:"-0.02em"}}>{value}</p>
  </Card>
);

const TH=({children,right})=><th style={{padding:"0 8px 12px",textAlign:right?"right":"left",fontSize:10,color:"var(--text-muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{children}</th>;
const TR=({children,highlight})=>{
  const [hov,setHov]=useState(false);
  return<tr onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{borderBottom:"1px solid rgba(255,255,255,0.03)",background:highlight?"rgba(15,186,129,0.05)":hov?"rgba(100,255,218,0.02)":""}}>{children}</tr>;
};
const TD=({children,right,mono,bold,color})=><td style={{padding:"11px 8px",textAlign:right?"right":"left",fontFamily:mono?"monospace":undefined,fontWeight:bold?700:undefined,color:color||"var(--text-primary)",fontSize:13}}>{children}</td>;

const IconBtn=({icon,onClick,hoverColor="var(--danger)"})=>{
  const [hov,setHov]=useState(false);
  return<button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:"none",border:"none",color:hov?hoverColor:"var(--text-muted)",cursor:"pointer",display:"flex",padding:5,borderRadius:7,transition:"color 0.15s"}}>{icon}</button>;
};

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

// ═══ DAILY ENTRY ═══
function DailyEntry({data,setData}){
  const{settings,dailyRecords}=data;
  const[date,setDate]=useState(todayISO());
  const[carCount,setCarCount]=useState(0);
  const[tripCount,setTripCount]=useState(0);
  const[expenses,setExpenses]=useState([]);
  const[editId,setEditId]=useState(null);
  const[expCat,setExpCat]=useState(EXPENSE_CATS[0]);
  const[expAmt,setExpAmt]=useState("");
  const[expDesc,setExpDesc]=useState("");

  const totalIncome=(Number(carCount)*settings.carRate)+(Number(tripCount)*settings.tripRate);
  const totalExpense=expenses.reduce((a,e)=>a+Number(e.amount||0),0);
  const netProfit=totalIncome-totalExpense;

  const loadRec=r=>{setDate(new Date(r.date).toISOString().split("T")[0]);setCarCount(r.carCount);setTripCount(r.tripCount);setExpenses(r.expenses||[]);setEditId(r.id);};
  const reset=()=>{setDate(todayISO());setCarCount(0);setTripCount(0);setExpenses([]);setEditId(null);};
  const addExp=()=>{if(!expAmt||Number(expAmt)<=0)return;setExpenses(p=>[...p,{category:expCat,amount:Number(expAmt),description:expDesc||expCat}]);setExpAmt("");setExpDesc("");};
  const save=()=>{
    const rec={id:editId||Date.now().toString(),date:tsFrom(date),carCount:Number(carCount),tripCount:Number(tripCount),expenses,totalIncome,totalExpense,netProfit,createdAt:Date.now()};
    const list=editId?dailyRecords.map(r=>r.id===editId?rec:r):[rec,...dailyRecords];
    setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
    GS.post({action:"save",sheet:"DailyRecords",row:{id:rec.id,date:dateStr(rec.date),carCount:rec.carCount,tripCount:rec.tripCount,totalIncome:rec.totalIncome,totalExpense:rec.totalExpense,netProfit:rec.netProfit,expenses:JSON.stringify(rec.expenses)}});
    reset();
  };
  const del=id=>{const list=dailyRecords.filter(r=>r.id!==id);setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});GS.post({action:"delete",sheet:"DailyRecords",id});if(editId===id)reset();};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}} className="fu0">
        <div>
          <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>দৈনিক এন্ট্রি</h2>
          <p style={{color:"var(--text-secondary)",fontSize:13}}>প্রতিদিনের আয় ও খরচ রেকর্ড</p>
        </div>
        {editId&&<Btn v="ghost" onClick={reset} icon={<I.X/>}>বাতিল</Btn>}
      </div>
      <div style={{display:"grid",gap:18}}>
        <Card className="fu1" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:18}}>{editId?"✏️ রেকর্ড সম্পাদনা":"➕ নতুন এন্ট্রি"}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Field label="তারিখ" type="date" value={date} onChange={setDate}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label={`গাড়ি (৳${settings.carRate}/টি)`} type="number" min="0" value={carCount} onChange={v=>setCarCount(Number(v))}/>
              <Field label={`ট্রিপ (৳${settings.tripRate}/টি)`} type="number" min="0" value={tripCount} onChange={v=>setTripCount(Number(v))}/>
            </div>
            <div style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.1)",borderRadius:12,padding:16}}>
              {[["মোট আয়",BDT(totalIncome),"var(--green-400)"],["মোট খরচ",BDT(totalExpense),"var(--danger)"]].map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}>
                  <span style={{color:"var(--text-secondary)"}}>{l}</span><span style={{fontWeight:700,color:c}}>{v}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10,marginTop:4}}>
                <span style={{fontWeight:700,color:"var(--text-primary)"}}>নেট লাভ</span>
                <span style={{fontWeight:900,fontSize:16,color:netProfit>=0?"var(--green-400)":"var(--danger)"}}>{BDT(netProfit)}</span>
              </div>
            </div>
            <div style={{background:"rgba(2,12,27,0.4)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:14}}>
              <p style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>খরচ যোগ করুন</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Sel value={expCat} onChange={setExpCat} options={EXPENSE_CATS}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field placeholder="পরিমাণ" type="number" min="0" value={expAmt} onChange={setExpAmt}/>
                  <Field placeholder="বিবরণ" value={expDesc} onChange={setExpDesc}/>
                </div>
                <Btn v="ghost" onClick={addExp} icon={<I.Plus/>} size="sm">যোগ করুন</Btn>
              </div>
            </div>
            {expenses.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:160,overflowY:"auto"}}>
              {expenses.map((e,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(15,186,129,0.05)",border:"1px solid rgba(15,186,129,0.1)",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:12}}><span style={{fontWeight:600,color:"var(--green-300)"}}>{e.category}</span><span style={{color:"var(--text-muted)",marginLeft:6}}>— {e.description}</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontWeight:700,color:"var(--danger)",fontSize:12}}>{BDT(e.amount)}</span>
                    <button onClick={()=>setExpenses(p=>p.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",display:"flex"}}><I.X/></button>
                  </div>
                </div>
              ))}
            </div>}
            <Btn onClick={save} icon={<I.Save/>} full>{editId?"আপডেট করুন":"সেভ করুন"}</Btn>
          </div>
        </Card>
        <Card className="fu2" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:18}}>📜 রেকর্ড ইতিহাস</h3>
          {dailyRecords.length===0?(
            <div style={{textAlign:"center",padding:"32px 0",color:"var(--text-muted)",fontSize:13}}>কোনো রেকর্ড নেই</div>
          ):(
            <div style={{overflowX:"auto"}}>
              <table><thead><tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
                <TH>তারিখ</TH><TH>গাড়ি</TH><TH>ট্রিপ</TH><TH right>আয়</TH><TH right>লাভ</TH><TH></TH>
              </tr></thead>
              <tbody>{dailyRecords.map(r=>(
                <TR key={r.id} highlight={editId===r.id}>
                  <TD color="var(--text-secondary)">{dateStr(r.date)}</TD>
                  <TD>{r.carCount}</TD><TD>{r.tripCount}</TD>
                  <TD right mono bold color="var(--green-400)">{BDT(r.totalIncome)}</TD>
                  <TD right mono bold color={r.netProfit>=0?"var(--green-300)":"var(--danger)"}>{BDT(r.netProfit)}</TD>
                  <td style={{padding:"11px 8px"}}>
                    <div style={{display:"flex",gap:4}}>
                      <IconBtn icon={<I.Edit/>} onClick={()=>loadRec(r)} hoverColor="var(--green-400)"/>
                      <IconBtn icon={<I.Trash/>} onClick={()=>del(r.id)}/>
                    </div>
                  </td>
                </TR>
              ))}</tbody></table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

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
    GS.post({action:"save",sheet:"Salaries",row:{id:sal.id,staffName:sal.staffName,totalDays:sal.totalDays,actualSalary:sal.actualSalary,paidAmount:sal.paidAmount,dueAmount:sal.dueAmount,paidDate:dateStr(sal.paidDate)}});
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
    GS.post({action:"save",sheet:"Expenses",row:{id:e.id,date:dateStr(e.date),category:e.category,amount:e.amount,description:e.description,isRecurring:e.isRecurring}});
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
    GS.post({action:"save",sheet:"Tasks",row:{id:t.id,title:t.title,description:t.description,status:t.status,priority:t.priority,dueDate:dateStr(t.dueDate),assignedTo:t.assignedTo}});
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

// ═══ REPORTS ═══
function Reports({data}){
  const{dailyRecords,expenses,salaries}=data;
  const[from,setFrom]=useState(()=>{const d=new Date();d.setDate(1);return d.toISOString().split("T")[0];});
  const[to,setTo]=useState(todayISO());
  const fromTs=tsFrom(from);const toTs=tsFrom(to)+86399999;
  const fD=dailyRecords.filter(r=>r.date>=fromTs&&r.date<=toTs);
  const fE=expenses.filter(e=>e.date>=fromTs&&e.date<=toTs);
  const fS=salaries.filter(s=>s.paidDate>=fromTs&&s.paidDate<=toTs);
  const totalIncome=fD.reduce((a,r)=>a+r.totalIncome,0);
  const totalExp=fD.reduce((a,r)=>a+r.totalExpense,0)+fE.reduce((a,e)=>a+e.amount,0);
  const totalSal=fS.reduce((a,s)=>a+s.paidAmount,0);
  const net=totalIncome-totalExp;
  const byCat=useMemo(()=>{const m={};fE.forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;});fD.forEach(r=>(r.expenses||[]).forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;}));return m;},[fE,fD]);
  const exportCSV=()=>{const rows=[["তারিখ","গাড়ি","ট্রিপ","আয়","খরচ","লাভ"],...fD.map(r=>[dateStr(r.date),r.carCount,r.tripCount,r.totalIncome,r.totalExpense,r.netProfit])];const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));a.download=`mh-transport-${from}-${to}.csv`;a.click();};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}} className="fu0">
        <div><h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>রিপোর্ট</h2><p style={{color:"var(--text-secondary)",fontSize:13}}>নির্দিষ্ট সময়কালের প্রতিবেদন</p></div>
        <Btn v="ghost" onClick={exportCSV} icon={<I.Dl/>} size="sm">CSV রপ্তানি</Btn>
      </div>
      <Card className="fu1" style={{padding:18}}>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          <Field label="শুরুর তারিখ" type="date" value={from} onChange={setFrom}/>
          <Field label="শেষ তারিখ" type="date" value={to} onChange={setTo}/>
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}} className="fu2">
        <StatCard label="মোট আয়" value={BDT(totalIncome)} positive={true} IconComp={I.Up}/>
        <StatCard label="মোট খরচ" value={BDT(totalExp)} positive={false} IconComp={I.Down}/>
        <StatCard label="নেট লাভ" value={BDT(net)} positive={net>=0} IconComp={I.Truck}/>
        <StatCard label="বেতন দেওয়া" value={BDT(totalSal)} IconComp={I.Staff}/>
      </div>
      <div style={{display:"grid",gap:16}}>
        <Card className="fu3" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>ক্যাটাগরি অনুযায়ী খরচ</h3>
          {Object.keys(byCat).length===0?<p style={{textAlign:"center",padding:"24px 0",color:"var(--text-muted)",fontSize:13}}>কোনো তথ্য নেই</p>:(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
                <div key={cat}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
                    <span style={{color:"var(--text-secondary)"}}>{cat}</span><span style={{fontWeight:700,color:"var(--text-primary)"}}>{BDT(amt)}</span>
                  </div>
                  <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",background:"linear-gradient(90deg,var(--green-500),var(--green-400))",borderRadius:999,width:`${(amt/(totalExp||1))*100}%`,transition:"width 0.5s ease"}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="fu4" style={{padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>দৈনিক রেকর্ড ({fD.length} দিন)</h3>
          <div style={{overflowY:"auto",maxHeight:280}}>
            <table><thead style={{position:"sticky",top:0,background:"var(--navy-800)"}}>
              <tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}><TH>তারিখ</TH><TH>গাড়ি</TH><TH>ট্রিপ</TH><TH right>আয়</TH><TH right>লাভ</TH></tr>
            </thead><tbody>
              {fD.map(r=>(
                <TR key={r.id}>
                  <TD color="var(--text-secondary)">{dateStr(r.date)}</TD><TD>{r.carCount}</TD><TD>{r.tripCount}</TD>
                  <TD right mono bold color="var(--green-400)">{BDT(r.totalIncome)}</TD>
                  <TD right mono bold color={r.netProfit>=0?"var(--green-300)":"var(--danger)"}>{BDT(r.netProfit)}</TD>
                </TR>
              ))}
            </tbody></table>
          </div>
        </Card>
      </div>
    </div>
  );
}

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


// ═══ QUICK ENTRY (দ্রুত এন্ট্রি) ═══
function QuickEntry({data,setData,setPage,setSidebarOpen}){
  const gotoPage=(id)=>{setPage(id);setSidebarOpen(false);};
  const{settings,dailyRecords}=data;
  const[carCount,setCarCount]=useState(0);
  const[tripCount,setTripCount]=useState(0);
  const[note,setNote]=useState("");
  const[saved,setSaved]=useState(false);

  const totalIncome=(Number(carCount)*settings.carRate)+(Number(tripCount)*settings.tripRate);

  const save=()=>{
    if(Number(carCount)===0&&Number(tripCount)===0)return;
    const today=todayISO();
    const existing=dailyRecords.find(r=>new Date(r.date).toISOString().split("T")[0]===today);
    if(existing){
      const updated={...existing,carCount:existing.carCount+Number(carCount),tripCount:existing.tripCount+Number(tripCount),totalIncome:existing.totalIncome+totalIncome};
      const list=dailyRecords.map(r=>r.id===existing.id?updated:r);
      setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
      GS.post({action:"save",sheet:"DailyRecords",row:{id:updated.id,date:today,carCount:updated.carCount,tripCount:updated.tripCount,totalIncome:updated.totalIncome,totalExpense:updated.totalExpense||0,netProfit:updated.totalIncome-(updated.totalExpense||0),note}});
    } else {
      const rec={id:Date.now().toString(),date:new Date(today).getTime(),carCount:Number(carCount),tripCount:Number(tripCount),expenses:[],totalIncome,totalExpense:0,netProfit:totalIncome,note,createdAt:Date.now()};
      const list=[rec,...dailyRecords];
      setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
      GS.post({action:"save",sheet:"DailyRecords",row:{id:rec.id,date:today,carCount:rec.carCount,tripCount:rec.tripCount,totalIncome:rec.totalIncome,totalExpense:0,netProfit:rec.totalIncome,note}});
    }
    setCarCount(0);setTripCount(0);setNote("");setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  const todayRec=dailyRecords.find(r=>new Date(r.date).toISOString().split("T")[0]===todayISO());

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>দ্রুত এন্ট্রি ⚡</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>আজকের এন্ট্রি দ্রুত যোগ করুন</p>
      </div>

      {todayRec&&(
        <Card className="fu1" glow style={{padding:18,background:"rgba(15,186,129,0.06)",borderColor:"rgba(15,186,129,0.2)"}}>
          <p style={{fontSize:12,color:"var(--green-300)",fontWeight:700,marginBottom:10}}>✅ আজকের বর্তমান এন্ট্রি</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[["গাড়ি",todayRec.carCount],["ট্রিপ",todayRec.tripCount],["আয়",BDT(todayRec.totalIncome)]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(2,12,27,0.5)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                <p style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{l}</p>
                <p style={{fontSize:18,fontWeight:900,color:"var(--green-300)"}}>{v}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="fu2" style={{padding:24}}>
        <p style={{fontSize:12,color:"var(--text-secondary)",marginBottom:16}}>{todayRec?"আরও যোগ করুন (আজকের এন্ট্রিতে যুক্ত হবে)":"আজকের নতুন এন্ট্রি"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:14,padding:16,textAlign:"center"}}>
            <p style={{fontSize:11,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>গাড়ি চেক</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
              <button onClick={()=>setCarCount(Math.max(0,Number(carCount)-1))} style={{width:38,height:38,borderRadius:"50%",background:"var(--navy-700)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
              <span style={{fontSize:32,fontWeight:900,color:"var(--green-300)",minWidth:40,textAlign:"center"}}>{carCount}</span>
              <button onClick={()=>setCarCount(Number(carCount)+1)} style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",border:"none",color:"#020c1b",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
            </div>
            <p style={{fontSize:11,color:"var(--text-muted)",marginTop:8}}>৳{settings.carRate}/টি = <strong style={{color:"var(--green-400)"}}>{BDT(Number(carCount)*settings.carRate)}</strong></p>
          </div>
          <div style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:14,padding:16,textAlign:"center"}}>
            <p style={{fontSize:11,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>ট্রিপ</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
              <button onClick={()=>setTripCount(Math.max(0,Number(tripCount)-1))} style={{width:38,height:38,borderRadius:"50%",background:"var(--navy-700)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
              <span style={{fontSize:32,fontWeight:900,color:"var(--green-300)",minWidth:40,textAlign:"center"}}>{tripCount}</span>
              <button onClick={()=>setTripCount(Number(tripCount)+1)} style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",border:"none",color:"#020c1b",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
            </div>
            <p style={{fontSize:11,color:"var(--text-muted)",marginTop:8}}>৳{settings.tripRate}/টি = <strong style={{color:"var(--green-400)"}}>{BDT(Number(tripCount)*settings.tripRate)}</strong></p>
          </div>
        </div>

        <div style={{background:"rgba(15,186,129,0.08)",border:"1px solid rgba(15,186,129,0.15)",borderRadius:12,padding:"14px 16px",marginBottom:16,textAlign:"center"}}>
          <p style={{fontSize:11,color:"var(--text-secondary)",marginBottom:4}}>মোট আয়</p>
          <p style={{fontSize:28,fontWeight:900,color:"var(--green-300)"}}>{BDT(totalIncome)}</p>
        </div>

        <Field label="নোট (ঐচ্ছিক)" value={note} onChange={setNote} placeholder="বিশেষ কিছু থাকলে লিখুন..."/>

        <div style={{marginTop:16}}>
          {saved?(
            <div style={{background:"rgba(15,186,129,0.15)",border:"1px solid rgba(15,186,129,0.3)",borderRadius:12,padding:"12px 20px",textAlign:"center",fontSize:14,fontWeight:700,color:"var(--green-400)"}}>
              ✅ সফলভাবে সেভ হয়েছে!
            </div>
          ):(
            <Btn onClick={save} icon={<I.Check/>} full disabled={Number(carCount)===0&&Number(tripCount)===0}>
              এন্ট্রি সেভ করুন
            </Btn>
          )}
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="fu3">
        <button onClick={()=>gotoPage("daily")} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(100,255,218,0.1)",borderRadius:14,padding:"16px 12px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",color:"var(--text-secondary)"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--green-500)";e.currentTarget.style.color="var(--green-400)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(100,255,218,0.1)";e.currentTarget.style.color="var(--text-secondary)";}}>
          <div style={{fontSize:20,marginBottom:6}}>📋</div>
          <p style={{fontSize:12,fontWeight:600}}>বিস্তারিত এন্ট্রি</p>
        </button>
        <button onClick={()=>gotoPage("expenses")} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(100,255,218,0.1)",borderRadius:14,padding:"16px 12px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",color:"var(--text-secondary)"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--green-500)";e.currentTarget.style.color="var(--green-400)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(100,255,218,0.1)";e.currentTarget.style.color="var(--text-secondary)";}}>
          <div style={{fontSize:20,marginBottom:6}}>💸</div>
          <p style={{fontSize:12,fontWeight:600}}>খরচ যোগ করুন</p>
        </button>
      </div>
    </div>
  );
}

// ═══ SEARCH & FILTER ═══
function SearchFilter({data}){
  const{dailyRecords,expenses,staff,salaries,vehicles=[]}=data;
  const[query,setQuery]=useState("");
  const[type,setType]=useState("সব");
  const[fromDate,setFromDate]=useState("");
  const[toDate,setToDate]=useState("");

  const TYPES=["সব","দৈনিক এন্ট্রি","খরচ","বেতন","গাড়ি"];

  const results=useMemo(()=>{
    const q=query.toLowerCase();
    const fromTs=fromDate?tsFrom(fromDate):0;
    const toTs=toDate?tsFrom(toDate)+86399999:Infinity;

    let all=[];

    if(type==="সব"||type==="দৈনিক এন্ট্রি"){
      dailyRecords.forEach(r=>{
        if(r.date<fromTs||r.date>toTs)return;
        const text=`দৈনিক এন্ট্রি ${r.carCount} গাড়ি ${r.tripCount} ট্রিপ ${r.totalIncome}`;
        if(q&&!text.toLowerCase().includes(q))return;
        all.push({type:"দৈনিক",date:r.date,title:`${r.carCount} গাড়ি · ${r.tripCount} ট্রিপ`,sub:`আয়: ${BDT(r.totalIncome)} · লাভ: ${BDT(r.netProfit)}`,amount:r.totalIncome,positive:true,pill:"green"});
      });
    }

    if(type==="সব"||type==="খরচ"){
      expenses.forEach(e=>{
        if(e.date<fromTs||e.date>toTs)return;
        const text=`${e.category} ${e.description} ${e.amount}`;
        if(q&&!text.toLowerCase().includes(q))return;
        all.push({type:"খরচ",date:e.date,title:e.description||e.category,sub:`ক্যাটাগরি: ${e.category}`,amount:e.amount,positive:false,pill:"amber"});
      });
    }

    if(type==="সব"||type==="বেতন"){
      salaries.forEach(s=>{
        if(s.paidDate<fromTs||s.paidDate>toTs)return;
        const text=`${s.staffName} বেতন ${s.paidAmount}`;
        if(q&&!text.toLowerCase().includes(q))return;
        all.push({type:"বেতন",date:s.paidDate,title:s.staffName,sub:`${s.totalDays} দিন · বাকি: ${BDT(s.dueAmount)}`,amount:s.paidAmount,positive:false,pill:"blue"});
      });
    }

    if(type==="সব"||type==="গাড়ি"){
      vehicles.forEach(v=>{
        const text=`${v.number} ${v.model} ${v.type}`;
        if(q&&!text.toLowerCase().includes(q))return;
        all.push({type:"গাড়ি",date:v.createdAt||Date.now(),title:v.number,sub:`${v.model} · ${v.type}`,amount:null,positive:null,pill:"navy"});
      });
    }

    return all.sort((a,b)=>b.date-a.date);
  },[query,type,fromDate,toDate,dailyRecords,expenses,salaries,vehicles]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>সার্চ ও ফিল্টার 🔍</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>যেকোনো রেকর্ড খুঁজুন</p>
      </div>

      <Card className="fu1" style={{padding:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{position:"relative"}}>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔍 কীওয়ার্ড লিখুন..."
              style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.15)",borderRadius:12,color:"var(--text-primary)",padding:"12px 16px",outline:"none",width:"100%",fontSize:14,transition:"border-color 0.2s"}}
              onFocus={e=>e.target.style.borderColor="var(--green-500)"}
              onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.15)"}/>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {TYPES.map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{padding:"6px 14px",borderRadius:999,fontSize:12,fontWeight:700,cursor:"pointer",border:type===t?"1px solid var(--green-500)":"1px solid rgba(255,255,255,0.08)",background:type===t?"rgba(15,186,129,0.15)":"transparent",color:type===t?"var(--green-400)":"var(--text-secondary)",transition:"all 0.15s"}}>{t}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="শুরুর তারিখ" type="date" value={fromDate} onChange={setFromDate}/>
            <Field label="শেষ তারিখ" type="date" value={toDate} onChange={setToDate}/>
          </div>
        </div>
      </Card>

      <div className="fu2">
        <p style={{fontSize:12,color:"var(--text-secondary)",marginBottom:12}}>{results.length}টি ফলাফল পাওয়া গেছে</p>
        {results.length===0?(
          <Card style={{padding:40,textAlign:"center"}}><p style={{color:"var(--text-muted)",fontSize:13}}>কোনো ফলাফল নেই</p></Card>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {results.map((r,i)=>(
              <Card key={i} style={{padding:"14px 18px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <Pill color={r.pill}>{r.type}</Pill>
                    <div>
                      <p style={{fontWeight:700,fontSize:13,color:"var(--text-primary)"}}>{r.title}</p>
                      <p style={{fontSize:11,color:"var(--text-secondary)"}}>{r.sub} · {dateStr(r.date)}</p>
                    </div>
                  </div>
                  {r.amount!==null&&(
                    <span style={{fontWeight:800,fontSize:14,fontFamily:"monospace",color:r.positive?"var(--green-400)":"var(--danger)"}}>{r.positive?"+":"-"}{BDT(r.amount)}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ MAIN APP ═══
const NAV=[
  {id:"dashboard",label:"ড্যাশবোর্ড",Icon:I.Home},
  {id:"daily",label:"দৈনিক এন্ট্রি",Icon:I.Daily},
  {id:"vehicles",label:"গাড়ির তালিকা",Icon:I.Truck},
  {id:"staff",label:"স্টাফ ও বেতন",Icon:I.Staff},
  {id:"expenses",label:"খরচ ট্র্যাকার",Icon:I.Expense},
  {id:"tasks",label:"কাজের তালিকা",Icon:I.Task},
  {id:"quick",label:"দ্রুত এন্ট্রি ⚡",Icon:I.Daily},
  {id:"monthly",label:"মাসিক রিপোর্ট",Icon:I.Report},
  {id:"search",label:"সার্চ ও ফিল্টার",Icon:I.Report},
  {id:"reports",label:"রিপোর্ট",Icon:I.Report},
  {id:"settings",label:"সেটিংস",Icon:I.Gear},
];

export default function App(){
  const[data,setData]=useState(initData);
  const[page,setPage]=useState("dashboard");
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const p={data,setData};
  const pages={dashboard:<Dashboard {...p}/>,quick:<QuickEntry {...p} setPage={setPage} setSidebarOpen={setSidebarOpen}/>,daily:<DailyEntry {...p}/>,vehicles:<VehicleManagement {...p}/>,staff:<StaffSalary {...p}/>,expenses:<ExpenseTracker {...p}/>,tasks:<TaskManagement {...p}/>,monthly:<MonthlyChart {...p}/>,search:<SearchFilter {...p}/>,reports:<Reports {...p}/>,settings:<SettingsPage {...p}/>};
  const goto=id=>{setPage(id);setSidebarOpen(false);};

  return(
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{display:"flex",minHeight:"100vh",background:"var(--navy-950)"}}>
        {sidebarOpen&&<div style={{position:"fixed",inset:0,background:"rgba(2,12,27,0.7)",zIndex:40,backdropFilter:"blur(4px)"}} onClick={()=>setSidebarOpen(false)}/>}

        {/* SIDEBAR */}
        <aside style={{position:"fixed",top:0,left:0,height:"100%",width:230,zIndex:50,background:"linear-gradient(180deg,var(--navy-900) 0%,var(--navy-950) 100%)",borderRight:"1px solid rgba(100,255,218,0.07)",display:"flex",flexDirection:"column",transform:sidebarOpen?"translateX(0)":"translateX(-100%)",transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",boxShadow:sidebarOpen?"4px 0 40px rgba(2,12,27,0.8)":"none"}}>
          <div style={{padding:"22px 20px 18px",borderBottom:"1px solid rgba(100,255,218,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",display:"flex",alignItems:"center",justifyContent:"center",color:"#020c1b",boxShadow:"0 4px 16px rgba(15,186,129,0.3)",flexShrink:0}}>
                <I.Truck/>
              </div>
              <div>
                <p style={{fontWeight:900,fontSize:13,color:"var(--text-primary)",lineHeight:1.2}}>{data.settings.companyName||"M.H. Transport"}</p>
                <p style={{fontSize:11,color:"var(--green-500)",fontWeight:600,letterSpacing:"0.05em"}}>ম্যানেজমেন্ট সিস্টেম</p>
              </div>
            </div>
          </div>
          <nav style={{flex:1,padding:"14px 10px",overflowY:"auto"}}>
            {NAV.map(({id,label,Icon})=>(
              <button key={id} onClick={()=>goto(id)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,marginBottom:3,background:page===id?"rgba(15,186,129,0.12)":"transparent",border:page===id?"1px solid rgba(15,186,129,0.2)":"1px solid transparent",color:page===id?"var(--green-300)":"var(--text-secondary)",fontWeight:page===id?700:500,fontSize:13,cursor:"pointer",transition:"all 0.15s",textAlign:"left",position:"relative"}}
                onMouseEnter={e=>{if(page!==id){e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="var(--text-primary)";}}}
                onMouseLeave={e=>{if(page!==id){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--text-secondary)";}}}
              >
                {page===id&&<span style={{position:"absolute",left:0,width:3,height:22,background:"var(--green-500)",borderRadius:"0 2px 2px 0"}}/>}
                <Icon/>{label}
              </button>
            ))}
          </nav>
          <div style={{padding:"14px 20px",borderTop:"1px solid rgba(100,255,218,0.06)"}}>
            <p style={{fontSize:11,color:"var(--text-muted)",textAlign:"center"}}>v5.0 · দ্রুত এন্ট্রি + সার্চ ✅</p>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <header style={{position:"sticky",top:0,zIndex:30,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",background:"rgba(10,25,47,0.92)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(100,255,218,0.07)",boxShadow:"0 2px 20px rgba(2,12,27,0.4)"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>setSidebarOpen(true)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(100,255,218,0.1)",color:"var(--text-secondary)",cursor:"pointer",padding:9,display:"flex",borderRadius:10,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--green-500)";e.currentTarget.style.color="var(--green-400)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(100,255,218,0.1)";e.currentTarget.style.color="var(--text-secondary)";}}>
                <I.Menu/>
              </button>
              <span style={{fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>{NAV.find(n=>n.id===page)?.label}</span>
            </div>
            <div style={{fontSize:12,color:"var(--text-secondary)",display:"flex",alignItems:"center",gap:7}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"var(--green-500)",display:"inline-block",animation:"pulse-dot 2s ease infinite"}}/>
              {new Date().toLocaleDateString("bn-BD",{day:"numeric",month:"long",year:"numeric"})}
            </div>
          </header>
          <main style={{flex:1,padding:"24px 20px",maxWidth:960,width:"100%",margin:"0 auto"}}>
            {pages[page]}
          </main>
        </div>
      </div>
    </>
  );
                    }
