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

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwOwUMtsLuz7mVyoxn3L3C_6gsE9-MyEWq96CMNEkHR8FL3r_hx2YTCT8PPk0o12ioS/exec";

const GS = {
  // Standard POST (no-cors) — for daily data, works fine
  post: async (body) => {
    try {
      await fetch(SCRIPT_URL, {
        method:"POST",
        mode:"no-cors",
        headers:{"Content-Type":"text/plain"},
        body: JSON.stringify(body),
      });
    } catch(e) { console.error("GS post error:",e); }
  },
  // GET-based save — reliable for Users (no CORS issue)
  saveViaGet: async (params) => {
    try {
      const url = SCRIPT_URL + "?" + new URLSearchParams(params).toString();
      const res = await fetch(url);
      const d = await res.json();
      return d.success;
    } catch(e) {
      console.error("saveViaGet error:", e);
      return false;
    }
  },
  getAll: async (sheet) => {
    try {
      const res = await fetch(`${SCRIPT_URL}?sheet=${sheet}`);
      const d = await res.json();
      return d.success ? d.data : [];
    } catch(e) { return []; }
  },
  loadAllData: async () => {
    try {
      const [daily, staff, expenses, salaries, tasks, vehicles, attendance, users] = await Promise.all([
        GS.getAll("DailyRecords"),
        GS.getAll("Staff"),
        GS.getAll("Expenses"),
        GS.getAll("Salaries"),
        GS.getAll("Tasks"),
        GS.getAll("Vehicles"),
        GS.getAll("Attendance"),
        GS.getAll("Users"),
      ]);

      // Smart date parser
      const parseDate = (val) => {
        if(!val) return Date.now();
        // Already a timestamp number
        if(typeof val === "number") return val;
        const s = String(val).trim();
        // Pure number string (timestamp)
        if(/^\d{10,}$/.test(s)) return Number(s);
        // ISO format: 2024-01-15
        if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
          const d = new Date(s + "T00:00:00");
          return isNaN(d.getTime()) ? Date.now() : d.getTime();
        }
        // Bengali date like "১৫ জান, ২০২৪" — fallback
        if(/[০-৯]/.test(s)) return Date.now();
        // General parse
        const d = new Date(s);
        return isNaN(d.getTime()) ? Date.now() : d.getTime();
      };

      // Parse daily records
      const parsedDaily = daily.map(r => ({
        ...r,
        id: String(r.id),
        date: parseDate(r.date),
        carCount: Number(r.carCount)||0,
        tripCount: Number(r.tripCount)||0,
        totalIncome: Number(r.totalIncome)||0,
        totalExpense: Number(r.totalExpense)||0,
        netProfit: Number(r.netProfit)||0,
        expenses: (() => { try { return JSON.parse(r.expenses||"[]"); } catch{ return []; } })(),
        vehicleTrips: (() => { try { return JSON.parse(r.vehicleTrips||"{}"); } catch{ return {}; } })(),
      })).filter(r=>r.id);

      // Parse staff
      const parsedStaff = staff.map(s => ({
        ...s,
        id: String(s.id),
        dailyRate: Number(s.dailyRate)||0,
        isActive: s.isActive==="true"||s.isActive===true,
      })).filter(s=>s.id);

      // Parse expenses
      const parsedExpenses = expenses.map(e => ({
        ...e,
        id: String(e.id),
        date: parseDate(e.date),
        amount: Number(e.amount)||0,
        isRecurring: e.isRecurring==="true"||e.isRecurring===true,
      })).filter(e=>e.id);

      // Parse salaries
      const parsedSalaries = salaries.map(s => ({
        ...s,
        id: String(s.id),
        totalDays: Number(s.totalDays)||0,
        actualSalary: Number(s.actualSalary)||0,
        paidAmount: Number(s.paidAmount)||0,
        dueAmount: Number(s.dueAmount)||0,
        paidDate: parseDate(s.paidDate),
        startDate: parseDate(s.startDate),
        endDate: parseDate(s.endDate),
      })).filter(s=>s.id);

      // Parse tasks
      const parsedTasks = tasks.map(t => ({
        ...t,
        id: String(t.id),
        dueDate: parseDate(t.dueDate),
      })).filter(t=>t.id);

      // Parse vehicles
      const parsedVehicles = vehicles.map(v => ({
        ...v,
        id: String(v.id),
      })).filter(v=>v.id);

      // Parse attendance (flat rows → nested object)
      const parsedAttendance = {};
      attendance.forEach(row => {
        if(row.date && row.staffId) {
          if(!parsedAttendance[row.date]) parsedAttendance[row.date] = {};
          parsedAttendance[row.date][row.staffId] = row.status;
        }
      });

      // Parse users — always prefer Sheets data
      const parsedUsers = users.length > 0 ? users.map(u => ({
        id: String(u.id),
        username: String(u.username||""),
        password: String(u.password||""),
        name: String(u.name||""),
        role: String(u.role||"viewer"),
        active: u.active==="true"||u.active===true,
      })).filter(u=>u.id&&u.username&&u.password) : null;

      return {
        dailyRecords: parsedDaily,
        staff: parsedStaff,
        expenses: parsedExpenses,
        salaries: parsedSalaries,
        tasks: parsedTasks,
        vehicles: parsedVehicles,
        attendance: parsedAttendance,
        users: parsedUsers,
      };
    } catch(e) {
      console.error("loadAllData error:", e);
      return null;
    }
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
  attendance: LS.get("mht_attendance",{}),
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
    GS.post({action:"save",sheet:"DailyRecords",row:{id:rec.id,date:new Date(rec.date).toISOString().split("T")[0],carCount:rec.carCount,tripCount:rec.tripCount,totalIncome:rec.totalIncome,totalExpense:rec.totalExpense,netProfit:rec.netProfit,expenses:JSON.stringify(rec.expenses),vehicleTrips:JSON.stringify(rec.vehicleTrips||{})}});
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
      GS.post({action:"save",sheet:"DailyRecords",row:{id:rec.id,date:today,carCount:rec.carCount,tripCount:rec.tripCount,totalIncome:rec.totalIncome,totalExpense:0,netProfit:rec.totalIncome,expenses:"[]",vehicleTrips:"{}",note}});
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

// ═══ VEHICLE TRIP ENTRY ═══
function VehicleTripEntry({data,setData}){
  const{vehicles=[],dailyRecords,settings}=data;
  const[date,setDate]=useState(todayISO());
  const[trips,setTrips]=useState({});
  const[saved,setSaved]=useState(false);

  // Load existing trips for selected date
  useEffect(()=>{
    const existing=dailyRecords.find(r=>new Date(r.date).toISOString().split("T")[0]===date);
    if(existing?.vehicleTrips){
      setTrips(existing.vehicleTrips);
    } else {
      setTrips({});
    }
  },[date,dailyRecords]);

  const setVTrip=(vid,val)=>{
    setTrips(p=>({...p,[vid]:Math.max(0,Number(val)||0)}));
  };

  const totalTrips=Object.values(trips).reduce((a,v)=>a+Number(v||0),0);
  const totalIncome=totalTrips*settings.tripRate;

  const save=()=>{
    if(totalTrips===0)return;
    const dateTs=tsFrom(date);
    const existing=dailyRecords.find(r=>new Date(r.date).toISOString().split("T")[0]===date);

    if(existing){
      // Update existing record
      const updated={
        ...existing,
        tripCount:totalTrips,
        vehicleTrips:trips,
        totalIncome:(existing.carCount*settings.carRate)+(totalTrips*settings.tripRate),
        netProfit:((existing.carCount*settings.carRate)+(totalTrips*settings.tripRate))-existing.totalExpense,
      };
      const list=dailyRecords.map(r=>r.id===existing.id?updated:r);
      setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
      GS.post({action:"save",sheet:"VehicleTrips",row:{date,vehicleTrips:JSON.stringify(trips),totalTrips,totalIncome}});
    } else {
      // Create new record
      const rec={
        id:Date.now().toString(),
        date:dateTs,
        carCount:0,
        tripCount:totalTrips,
        vehicleTrips:trips,
        expenses:[],
        totalIncome,
        totalExpense:0,
        netProfit:totalIncome,
        createdAt:Date.now(),
      };
      const list=[rec,...dailyRecords];
      setData(p=>{const n={...p,dailyRecords:list};LS.set("mht_daily",list);return n;});
      GS.post({action:"save",sheet:"VehicleTrips",row:{date,vehicleTrips:JSON.stringify(trips),totalTrips,totalIncome}});
    }
    setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  // Monthly vehicle report
  const monthlyVehicleReport=useMemo(()=>{
    const month=date.slice(0,7);
    const report={};
    vehicles.forEach(v=>{report[v.id]={number:v.number,model:v.model,trips:0,income:0};});
    dailyRecords.forEach(r=>{
      if(!r.vehicleTrips)return;
      const rMonth=new Date(r.date).toISOString().slice(0,7);
      if(rMonth!==month)return;
      Object.entries(r.vehicleTrips).forEach(([vid,t])=>{
        if(report[vid]){
          report[vid].trips+=Number(t||0);
          report[vid].income+=Number(t||0)*settings.tripRate;
        }
      });
    });
    return Object.values(report).filter(r=>r.trips>0).sort((a,b)=>b.trips-a.trips);
  },[dailyRecords,vehicles,date,settings]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="fu0">
        <h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>গাড়িভিত্তিক ট্রিপ 🚛</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>প্রতিটি গাড়ির ট্রিপ এন্ট্রি — দৈনিক রেকর্ডে অটো যুক্ত হবে</p>
      </div>

      {vehicles.length===0?(
        <Card style={{padding:32,textAlign:"center"}} className="fu1">
          <p style={{color:"var(--text-muted)",fontSize:13,marginBottom:12}}>⚠️ কোনো গাড়ি যোগ করা নেই</p>
          <p style={{color:"var(--text-secondary)",fontSize:12}}>প্রথমে "গাড়ির তালিকা" পেজে গিয়ে গাড়ি যোগ করুন</p>
        </Card>
      ):(
        <>
          <Card className="fu1" style={{padding:22}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
              <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)"}}>📝 ট্রিপ এন্ট্রি</h3>
              <Field type="date" value={date} onChange={setDate}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {vehicles.map(v=>(
                <div key={v.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,background:"rgba(2,12,27,0.5)",border:"1px solid rgba(100,255,218,0.08)",borderRadius:12,padding:"12px 16px",flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,var(--navy-700),var(--navy-600))",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--green-400)",flexShrink:0}}>
                      <I.Truck/>
                    </div>
                    <div>
                      <p style={{fontWeight:700,fontSize:13,color:"var(--text-primary)"}}>{v.number}</p>
                      <p style={{fontSize:11,color:"var(--text-secondary)"}}>{v.model} · {v.type}</p>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={()=>setVTrip(v.id,Math.max(0,(trips[v.id]||0)-1))}
                      style={{width:32,height:32,borderRadius:"50%",background:"var(--navy-700)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
                    <input type="number" min="0" value={trips[v.id]||0} onChange={e=>setVTrip(v.id,e.target.value)}
                      style={{width:52,textAlign:"center",background:"rgba(2,12,27,0.7)",border:"1px solid rgba(100,255,218,0.15)",borderRadius:8,color:"var(--green-300)",padding:"6px",fontSize:16,fontWeight:900,outline:"none"}}/>
                    <button onClick={()=>setVTrip(v.id,(trips[v.id]||0)+1)}
                      style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",border:"none",color:"#020c1b",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
                    <span style={{fontSize:11,color:"var(--text-secondary)",minWidth:60}}>{BDT((trips[v.id]||0)*settings.tripRate)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:16,background:"rgba(15,186,129,0.08)",border:"1px solid rgba(15,186,129,0.15)",borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{fontSize:11,color:"var(--text-secondary)",marginBottom:2}}>মোট ট্রিপ</p>
                <p style={{fontSize:24,fontWeight:900,color:"var(--green-300)"}}>{totalTrips} টি</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontSize:11,color:"var(--text-secondary)",marginBottom:2}}>মোট আয়</p>
                <p style={{fontSize:24,fontWeight:900,color:"var(--green-400)"}}>{BDT(totalIncome)}</p>
              </div>
            </div>

            <div style={{marginTop:14}}>
              {saved?(
                <div style={{background:"rgba(15,186,129,0.15)",border:"1px solid rgba(15,186,129,0.3)",borderRadius:12,padding:"12px 20px",textAlign:"center",fontSize:14,fontWeight:700,color:"var(--green-400)"}}>
                  ✅ দৈনিক এন্ট্রিতে যুক্ত হয়েছে!
                </div>
              ):(
                <Btn onClick={save} icon={<I.Save/>} full disabled={totalTrips===0}>
                  সেভ করুন — দৈনিক এন্ট্রিতে অটো যুক্ত হবে
                </Btn>
              )}
            </div>
          </Card>

          {monthlyVehicleReport.length>0&&(
            <Card className="fu2" style={{padding:22}}>
              <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>
                📊 মাসিক গাড়িভিত্তিক রিপোর্ট ({date.slice(0,7)})
              </h3>
              <div style={{overflowX:"auto"}}>
                <table>
                  <thead><tr style={{borderBottom:"1px solid rgba(100,255,218,0.08)"}}>
                    <TH>গাড়ি নম্বর</TH>
                    <TH>মডেল</TH>
                    <TH>মোট ট্রিপ</TH>
                    <TH right>মোট আয়</TH>
                  </tr></thead>
                  <tbody>
                    {monthlyVehicleReport.map((r,i)=>(
                      <TR key={i}>
                        <TD bold color="var(--green-300)">{r.number}</TD>
                        <TD color="var(--text-secondary)">{r.model}</TD>
                        <TD>{r.trips} টি</TD>
                        <TD right mono bold color="var(--green-400)">{BDT(r.income)}</TD>
                      </TR>
                    ))}
                    <TR>
                      <td colSpan="2" style={{padding:"11px 8px",fontWeight:700,color:"var(--text-primary)"}}>মোট</td>
                      <TD bold>{monthlyVehicleReport.reduce((a,r)=>a+r.trips,0)} টি</TD>
                      <TD right mono bold color="var(--green-400)">{BDT(monthlyVehicleReport.reduce((a,r)=>a+r.income,0))}</TD>
                    </TR>
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}


// ═══ AUTH SYSTEM ═══

const DEFAULT_USERS = [
  {id:"admin001",username:"admin",password:"admin123",name:"Admin",role:"admin",active:true},
];

const ROLES = {
  admin:  {label:"অ্যাডমিন",  color:"green", pages:["all"]},
  manager:{label:"ম্যানেজার", color:"amber",  pages:["dashboard","quick","daily","vehicletrips","attendance","vehicles","staff","expenses","tasks","reports","monthly","search"]},
  viewer: {label:"ভিউয়ার",   color:"blue",   pages:["dashboard","monthly","reports","search"]},
};

const ROLE_PERMS = {
  admin:   {canEdit:true,  canDelete:true,  canManageUsers:true},
  manager: {canEdit:true,  canDelete:false, canManageUsers:false},
  viewer:  {canEdit:false, canDelete:false, canManageUsers:false},
};

const AUTH_KEY = "mht_auth_users_v3";
const DEFAULT_ADMIN = [{id:"admin001",username:"admin",password:"admin123",name:"Admin",role:"admin",active:true}];

const getUsers = () => {
  try {
    const s = localStorage.getItem(AUTH_KEY);
    if(s){
      const arr = JSON.parse(s);
      if(Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch(e){}
  return DEFAULT_ADMIN;
};
const saveUsers = (users) => {
  // 1. PRIMARY: Save to localStorage immediately
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(users)); } catch(e){}
  // 2. BACKUP: Save to Sheets via GET (non-blocking, best effort)
  users.forEach(u => {
    const p = new URLSearchParams({
      action:"saveUser",
      id:String(u.id),
      username:String(u.username||""),
      password:String(u.password||""),
      name:String(u.name||""),
      role:String(u.role||"viewer"),
      active:String(u.active===true),
    });
    fetch(SCRIPT_URL+"?"+p.toString()).catch(()=>{});
  });
};

const syncUsersFromSheets = async () => {
  try {
    const res = await fetch(SCRIPT_URL+"?sheet=Users", {cache:"no-store"});
    const d = await res.json();
    if(d.success && Array.isArray(d.data) && d.data.length > 0){
      const users = d.data.map(u=>({
        id:       String(u.id||"").trim(),
        username: String(u.username||"").trim(),
        password: String(u.password||"").trim(),
        name:     String(u.name||"").trim(),
        role:     String(u.role||"viewer").trim(),
        active:   u.active==="true"||u.active===true,
      })).filter(u=>u.id&&u.username&&u.password);
      if(users.length>0){
        try { localStorage.setItem(AUTH_KEY, JSON.stringify(users)); } catch(e){}
        return users;
      }
    }
  } catch(e){}
  return getUsers();
};

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({onLogin}){
  const[username,setUsername]=useState("");
  const[password,setPassword]=useState("");
  const[showPass,setShowPass]=useState(false);
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(false);

  const login=async()=>{
    if(!username||!password){setError("ইউজারনেম ও পাসওয়ার্ড দিন");return;}
    setLoading(true);
    setError("");
    try {
      // Step 1: Fetch fresh users from Sheets
      const sheetUsers = await GS.getAll("Users");
      let allUsers;
      if(sheetUsers && sheetUsers.length > 0){
        allUsers = sheetUsers.map(u=>({
          id: String(u.id||""),
          username: String(u.username||"").trim(),
          password: String(u.password||"").trim(),
          name: String(u.name||""),
          role: String(u.role||"viewer"),
          active: u.active==="true"||u.active===true,
        })).filter(u=>u.id&&u.username&&u.password);
        // Update localStorage with fresh data
        LS.set("mht_users", allUsers);
      } else {
        // Fallback to localStorage
        allUsers = getUsers();
      }
      // Step 2: Find matching user
      const uname = username.trim();
      const upass = password.trim();
      const user = allUsers.find(u=>
        u.username===uname && u.password===upass && u.active===true
      );
      if(user){
        LS.set("mht_session",{userId:user.id,loginTime:Date.now()});
        onLogin(user);
      } else {
        // Check if user exists but wrong password
        const exists = allUsers.find(u=>u.username===uname);
        if(exists && !exists.active){
          setError("এই অ্যাকাউন্ট নিষ্ক্রিয়। Admin-এর সাথে যোগাযোগ করুন।");
        } else {
          setError("ইউজারনেম বা পাসওয়ার্ড ভুল!");
        }
      }
    } catch(err) {
      // Offline fallback
      const allUsers = getUsers();
      const user = allUsers.find(u=>
        u.username===username.trim() && u.password===password.trim() && u.active===true
      );
      if(user){
        LS.set("mht_session",{userId:user.id,loginTime:Date.now()});
        onLogin(user);
      } else {
        setError("লগইন ব্যর্থ। ইন্টারনেট চেক করুন অথবা পাসওয়ার্ড যাচাই করুন।");
      }
    }
    setLoading(false);
  };

  // Password recovery
  const[showRecovery,setShowRecovery]=useState(false);
  const[recUsername,setRecUsername]=useState("");
  const[recNewPass,setRecNewPass]=useState("");
  const[recSecretKey,setRecSecretKey]=useState("");
  const[recMsg,setRecMsg]=useState("");
  const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "mhtransport2024";

  const recover=()=>{
    if(!recUsername||!recNewPass||!recSecretKey){setRecMsg("সব তথ্য পূরণ করুন");return;}
    if(recSecretKey!==SECRET_KEY){setRecMsg("সিক্রেট কী ভুল! মালিকের সাথে যোগাযোগ করুন।");return;}
    const users=getUsers();
    const uname=recUsername.trim();
    const user=users.find(u=>u.username===uname);
    if(!user){setRecMsg("এই ইউজারনেম পাওয়া যায়নি");return;}
    const updated=users.map(u=>u.username===uname?{...u,password:recNewPass.trim()}:u);
    saveUsers(updated);
    setRecMsg("✅ পাসওয়ার্ড পরিবর্তন হয়েছে! এখন লগইন করুন।");
    setTimeout(()=>{setShowRecovery(false);setRecMsg("");setRecUsername("");setRecNewPass("");setRecSecretKey("");},2000);
  };

  return(
    <div style={{minHeight:"100vh",background:"var(--navy-950)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Noto Sans Bengali',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Noto Sans Bengali',sans-serif;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse-green{0%,100%{box-shadow:0 0 0 0 rgba(15,186,129,0.4);}50%{box-shadow:0 0 0 8px rgba(15,186,129,0);}}
      `}</style>

      {/* Background decoration */}
      <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"-20%",right:"-10%",width:500,height:500,borderRadius:"50%",background:"rgba(15,186,129,0.04)",filter:"blur(80px)"}}/>
        <div style={{position:"absolute",bottom:"-20%",left:"-10%",width:400,height:400,borderRadius:"50%",background:"rgba(29,52,97,0.3)",filter:"blur(60px)"}}/>
      </div>

      <div style={{width:"100%",maxWidth:400,animation:"fadeUp 0.5s ease"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 32px rgba(15,186,129,0.3)",animation:"pulse-green 3s ease infinite"}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#020c1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h1 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>M.H. Transport</h1>
          <p style={{fontSize:13,color:"var(--green-500)",fontWeight:600}}>ম্যানেজমেন্ট সিস্টেম</p>
        </div>

        {/* Login Card */}
        <div style={{background:"rgba(17,34,64,0.9)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:20,padding:28,backdropFilter:"blur(16px)",boxShadow:"0 24px 80px rgba(2,12,27,0.6)"}}>
          <h2 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:22,textAlign:"center"}}>লগইন করুন</h2>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>ইউজারনেম</span>
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="আপনার ইউজারনেম"
                onKeyDown={e=>e.key==="Enter"&&login()}
                style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"11px 14px",outline:"none",fontSize:14,transition:"border-color 0.2s",fontFamily:"'Noto Sans Bengali',sans-serif"}}
                onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>পাসওয়ার্ড</span>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="পাসওয়ার্ড"
                  onKeyDown={e=>e.key==="Enter"&&login()}
                  style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"11px 44px 11px 14px",outline:"none",fontSize:14,width:"100%",transition:"border-color 0.2s",fontFamily:"'Noto Sans Bengali',sans-serif"}}
                  onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                  onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
                <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:12,fontFamily:"'Noto Sans Bengali',sans-serif"}}>
                  {showPass?"লুকান":"দেখান"}
                </button>
              </div>
            </div>

            {error&&(
              <div style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--danger)",textAlign:"center"}}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={login} disabled={loading}
              style={{background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",color:"#020c1b",border:"none",borderRadius:12,padding:"13px 20px",fontSize:14,fontWeight:800,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,transition:"all 0.18s",marginTop:4,fontFamily:"'Noto Sans Bengali',sans-serif"}}
              onMouseEnter={e=>!loading&&(e.currentTarget.style.filter="brightness(1.1)")}
              onMouseLeave={e=>(e.currentTarget.style.filter="")}>
              {loading?"লগইন হচ্ছে...":"লগইন করুন →"}
            </button>
          </div>

          <p style={{textAlign:"center",fontSize:11,color:"var(--text-muted)",marginTop:18}}>
            ডিফল্ট: username: <strong style={{color:"var(--green-400)"}}>admin</strong> · password: <strong style={{color:"var(--green-400)"}}>admin123</strong>
          </p>
          <div style={{textAlign:"center",marginTop:12}}>
            <button onClick={()=>setShowRecovery(true)} style={{background:"none",border:"none",color:"var(--green-500)",fontSize:12,cursor:"pointer",fontFamily:"'Noto Sans Bengali',sans-serif",textDecoration:"underline"}}>
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
          </div>
        </div>

        {/* Recovery Modal */}
        {showRecovery&&(
          <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowRecovery(false)}>
            <div style={{position:"absolute",inset:0,background:"rgba(2,12,27,0.85)",backdropFilter:"blur(6px)"}}/>
            <div style={{position:"relative",width:"100%",maxWidth:380,background:"var(--navy-800)",border:"1px solid rgba(100,255,218,0.15)",borderRadius:20,padding:28,boxShadow:"0 24px 80px rgba(2,12,27,0.8)"}} onClick={e=>e.stopPropagation()}>
              <h3 style={{fontWeight:800,fontSize:16,color:"var(--green-300)",marginBottom:6,textAlign:"center"}}>🔑 পাসওয়ার্ড রিকভারি</h3>
              <p style={{fontSize:12,color:"var(--text-secondary)",textAlign:"center",marginBottom:20}}>সিক্রেট কী দিয়ে পাসওয়ার্ড রিসেট করুন</p>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>ইউজারনেম</span>
                  <input value={recUsername} onChange={e=>setRecUsername(e.target.value)} placeholder="আপনার ইউজারনেম"
                    style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"10px 14px",outline:"none",fontSize:13,fontFamily:"'Noto Sans Bengali',sans-serif"}}
                    onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                    onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>নতুন পাসওয়ার্ড</span>
                  <input type="password" value={recNewPass} onChange={e=>setRecNewPass(e.target.value)} placeholder="নতুন পাসওয়ার্ড"
                    style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"10px 14px",outline:"none",fontSize:13,fontFamily:"'Noto Sans Bengali',sans-serif"}}
                    onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                    onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>সিক্রেট কী</span>
                  <input type="password" value={recSecretKey} onChange={e=>setRecSecretKey(e.target.value)} placeholder="মালিকের কাছ থেকে নিন"
                    style={{background:"rgba(2,12,27,0.6)",border:"1px solid rgba(100,255,218,0.12)",borderRadius:10,color:"var(--text-primary)",padding:"10px 14px",outline:"none",fontSize:13,fontFamily:"'Noto Sans Bengali',sans-serif"}}
                    onFocus={e=>e.target.style.borderColor="var(--green-500)"}
                    onBlur={e=>e.target.style.borderColor="rgba(100,255,218,0.12)"}/>
                </div>
                {recMsg&&(
                  <div style={{background:recMsg.includes("✅")?"rgba(15,186,129,0.1)":"rgba(255,107,107,0.1)",border:`1px solid ${recMsg.includes("✅")?"rgba(15,186,129,0.3)":"rgba(255,107,107,0.25)"}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:recMsg.includes("✅")?"var(--green-400)":"var(--danger)",textAlign:"center"}}>
                    {recMsg}
                  </div>
                )}
                <button onClick={recover}
                  style={{background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",color:"#020c1b",border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:800,cursor:"pointer",marginTop:4,fontFamily:"'Noto Sans Bengali',sans-serif"}}>
                  পাসওয়ার্ড রিসেট করুন
                </button>
                <button onClick={()=>setShowRecovery(false)}
                  style={{background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"10px",fontSize:13,color:"var(--text-secondary)",cursor:"pointer",fontFamily:"'Noto Sans Bengali',sans-serif"}}>
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── User Management (Admin only) ─────────────────────────────────────────────
function UserManagement({currentUser}){
  const[users,setUsers]=useState(()=>getUsers());
  useEffect(()=>{
    // Sync from Sheets on mount
    syncUsersFromSheets().then(fresh=>setUsers([...fresh]));
  },[]);
  const[showAdd,setShowAdd]=useState(false);
  const[uName,setUName]=useState("");
  const[uUsername,setUUsername]=useState("");
  const[uPass,setUPass]=useState("");
  const[uRole,setURole]=useState("manager");
  const[editId,setEditId]=useState(null);
  const[error,setError]=useState("");

  const reset=()=>{setUName("");setUUsername("");setUPass("");setURole("manager");setEditId(null);setShowAdd(false);setError("");};

  const save=()=>{
    if(!uName||!uUsername||(!editId&&!uPass)){setError("সব তথ্য পূরণ করুন");return;}
    const existing=users.find(u=>u.username===uUsername&&u.id!==editId);
    if(existing){setError("এই ইউজারনেম ইতিমধ্যে আছে");return;}
    let list;
    if(editId){
      list=users.map(u=>u.id===editId?{...u,name:uName,username:uUsername,...(uPass?{password:uPass}:{}),role:uRole}:u);
    } else {
      const newUser={id:Date.now().toString(),username:uUsername,password:uPass,name:uName,role:uRole,active:true};
      list=[...users,newUser];
    }
    saveUsers(list);
    setUsers([...list]);
    reset();
  };

  const toggleActive=(id)=>{
    if(id===currentUser.id){alert("নিজের অ্যাকাউন্ট বন্ধ করা যাবে না!");return;}
    const list=users.map(u=>u.id===id?{...u,active:!u.active}:u);
    saveUsers(list);
    setUsers([...list]);
  };

  const deleteUser=(id)=>{
    if(id===currentUser.id){alert("নিজের অ্যাকাউন্ট মুছা যাবে না!");return;}
    if(!confirm("এই ইউজার মুছে ফেলবেন?"))return;
    const list=users.filter(u=>u.id!==id);
    saveUsers(list);
    setUsers([...list]);
  };

  const loadEdit=(u)=>{setUName(u.name);setUUsername(u.username);setUPass("");setURole(u.role);setEditId(u.id);setShowAdd(true);};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}} className="fu0">
        <div><h2 style={{fontSize:22,fontWeight:900,color:"var(--text-primary)",marginBottom:4}}>ইউজার ম্যানেজমেন্ট 👤</h2>
        <p style={{color:"var(--text-secondary)",fontSize:13}}>ব্যবহারকারী ও অ্যাক্সেস নিয়ন্ত্রণ</p></div>
        <Btn onClick={()=>setShowAdd(true)} icon={<I.Plus/>}>নতুন ইউজার</Btn>
      </div>

      {/* Role info */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}} className="fu1">
        {Object.entries(ROLES).map(([key,r])=>(
          <Card key={key} style={{padding:"14px 16px"}}>
            <Pill color={r.color}>{r.label}</Pill>
            <p style={{fontSize:11,color:"var(--text-secondary)",marginTop:8,lineHeight:1.6}}>
              {key==="admin"?"সব কিছু দেখা ও পরিবর্তন করতে পারবে":key==="manager"?"এন্ট্রি দিতে পারবে, ডিলিট করতে পারবে না":"শুধু দেখতে পারবে"}
            </p>
          </Card>
        ))}
      </div>

      <Card className="fu2" style={{padding:22}}>
        <h3 style={{fontWeight:700,fontSize:14,color:"var(--green-300)",marginBottom:16}}>ইউজার তালিকা ({users.length} জন)</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {users.map(u=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,background:"rgba(2,12,27,0.5)",border:`1px solid ${u.id===currentUser.id?"rgba(15,186,129,0.2)":"rgba(100,255,218,0.08)"}`,borderRadius:12,padding:"12px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:u.active?"linear-gradient(135deg,var(--green-500),#0d9e6e)":"var(--navy-700)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:u.active?"#020c1b":"var(--text-muted)",flexShrink:0}}>
                  {u.name.charAt(0)}
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <p style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{u.name}</p>
                    {u.id===currentUser.id&&<Pill color="green">আপনি</Pill>}
                  </div>
                  <p style={{fontSize:12,color:"var(--text-secondary)"}}>@{u.username} · <span style={{color:ROLES[u.role].color==="green"?"var(--green-400)":ROLES[u.role].color==="amber"?"var(--amber)":"#6495ed"}}>{ROLES[u.role].label}</span></p>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <Pill color={u.active?"green":"slate"}>{u.active?"সক্রিয়":"নিষ্ক্রিয়"}</Pill>
                <Btn v="ghost" size="sm" onClick={()=>loadEdit(u)} icon={<I.Edit/>}>সম্পাদনা</Btn>
                {u.id!==currentUser.id&&(
                  <>
                    <Btn v="navy" size="sm" onClick={()=>toggleActive(u.id)}>{u.active?"বন্ধ করুন":"চালু করুন"}</Btn>
                    <IconBtn icon={<I.Trash/>} onClick={()=>deleteUser(u.id)}/>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={showAdd} onClose={reset} title={editId?"ইউজার সম্পাদনা":"নতুন ইউজার যোগ করুন"}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="পূর্ণ নাম" value={uName} onChange={setUName} placeholder="মো. রহিম"/>
          <Field label="ইউজারনেম" value={uUsername} onChange={setUUsername} placeholder="rahim123"/>
          <Field label={editId?"নতুন পাসওয়ার্ড (খালি রাখলে পুরনোটা থাকবে)":"পাসওয়ার্ড"} type="password" value={uPass} onChange={setUPass} placeholder="••••••••"/>
          <Sel label="রোল" value={uRole} onChange={setURole} options={Object.entries(ROLES).map(([v,r])=>({value:v,label:r.label}))}/>
          {error&&<div style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"var(--danger)"}}>{error}</div>}
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <Btn onClick={save} icon={<I.Save/>} full>{editId?"আপডেট করুন":"যোগ করুন"}</Btn>
            <Btn v="ghost" onClick={reset} full>বাতিল</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══ MAIN APP ═══
const NAV=[
  {id:"dashboard",label:"ড্যাশবোর্ড",Icon:I.Home},
  {id:"daily",label:"দৈনিক এন্ট্রি",Icon:I.Daily},
  {id:"vehicles",label:"গাড়ির তালিকা",Icon:I.Truck},
  {id:"vehicletrips",label:"গাড়িভিত্তিক ট্রিপ",Icon:I.Truck},
  {id:"attendance",label:"অ্যাটেন্ডেন্স",Icon:I.Staff},
  {id:"staff",label:"স্টাফ ও বেতন",Icon:I.Staff},
  {id:"expenses",label:"খরচ ট্র্যাকার",Icon:I.Expense},
  {id:"tasks",label:"কাজের তালিকা",Icon:I.Task},
  {id:"quick",label:"দ্রুত এন্ট্রি ⚡",Icon:I.Daily},
  {id:"monthly",label:"মাসিক রিপোর্ট",Icon:I.Report},
  {id:"search",label:"সার্চ ও ফিল্টার",Icon:I.Report},
  {id:"reports",label:"রিপোর্ট",Icon:I.Report},
  {id:"pdf",label:"PDF রিপোর্ট",Icon:I.Dl},
  {id:"invoices",label:"রসিদ ও ভাউচার",Icon:I.Report},
  {id:"users",label:"ইউজার ম্যানেজমেন্ট",Icon:I.Staff},
  {id:"settings",label:"সেটিংস",Icon:I.Gear},
];

export default function App(){
  const[data,setData]=useState(initData);
  const[page,setPage]=useState("dashboard");
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const[loading,setLoading]=useState(true);
  const[loadMsg,setLoadMsg]=useState("ডেটা লোড হচ্ছে...");
  const[currentUser,setCurrentUser]=useState(()=>{
    try {
      const s=localStorage.getItem("mht_session_v3");
      if(!s)return null;
      const session=JSON.parse(s);
      const users=getUsers();
      return users.find(u=>u.id===session.userId&&u.active===true)||null;
    } catch(e){ return null; }
  });

  // Load data from Google Sheets on mount
  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      setLoadMsg("Google Sheets থেকে ডেটা লোড হচ্ছে...");
      try {
        const sheetData = await GS.loadAllData();
        if(sheetData){
          setData(prev=>{
            const merged={
              ...prev,
              dailyRecords: sheetData.dailyRecords.length>0 ? sheetData.dailyRecords : prev.dailyRecords,
              staff: sheetData.staff.length>0 ? sheetData.staff : prev.staff,
              expenses: sheetData.expenses.length>0 ? sheetData.expenses : prev.expenses,
              salaries: sheetData.salaries.length>0 ? sheetData.salaries : prev.salaries,
              tasks: sheetData.tasks.length>0 ? sheetData.tasks : prev.tasks,
              vehicles: sheetData.vehicles.length>0 ? sheetData.vehicles : prev.vehicles,
              attendance: Object.keys(sheetData.attendance).length>0 ? sheetData.attendance : prev.attendance,
            };
            // Sync to localStorage
            LS.set("mht_daily", merged.dailyRecords);
            LS.set("mht_staff", merged.staff);
            LS.set("mht_expenses", merged.expenses);
            LS.set("mht_salaries", merged.salaries);
            LS.set("mht_tasks", merged.tasks);
            LS.set("mht_vehicles", merged.vehicles);
            LS.set("mht_attendance", merged.attendance);
            // Sync users from Sheets
            if(sheetData.users&&sheetData.users.length>0){
              try { localStorage.setItem(AUTH_KEY, JSON.stringify(sheetData.users)); } catch(e){}
            }
            return merged;
          });
          setLoadMsg("লোড সম্পন্ন ✅");
        } else {
          setLoadMsg("localStorage থেকে লোড হয়েছে");
        }
      } catch(e) {
        setLoadMsg("অফলাইন মোড — localStorage থেকে লোড হয়েছে");
      }
      setTimeout(()=>setLoading(false), 400);
    };
    load();
  },[]);

  const handleLogin=(user)=>setCurrentUser(user);
  const handleLogout=()=>{
    try{localStorage.removeItem("mht_session_v3");}catch(e){}
    setCurrentUser(null);
    setPage("dashboard");
  };

  // Loading screen
  if(loading){
    return(
      <div style={{minHeight:"100vh",background:"var(--navy-950)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,fontFamily:"'Noto Sans Bengali',sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700;900&display=swap');@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 32px rgba(15,186,129,0.3)"}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#020c1b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:18,fontWeight:900,color:"var(--text-primary)",marginBottom:8}}>M.H. Transport</p>
          <p style={{fontSize:13,color:"var(--text-secondary)"}}>{loadMsg}</p>
        </div>
        <div style={{width:40,height:40,border:"3px solid rgba(100,255,218,0.15)",borderTop:"3px solid var(--green-500)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      </div>
    );
  }

  if(!currentUser) return <LoginPage onLogin={handleLogin}/>;

  const perm=ROLE_PERMS[currentUser.role];
  const p={data,setData,currentUser,perm};

  const allPages={
    dashboard:<Dashboard {...p}/>,
    quick:<QuickEntry {...p} setPage={setPage} setSidebarOpen={setSidebarOpen}/>,
    daily:<DailyEntry {...p}/>,
    vehicles:<VehicleManagement {...p}/>,
    vehicletrips:<VehicleTripEntry {...p}/>,
    attendance:<Attendance {...p}/>,
    staff:<StaffSalary {...p}/>,
    expenses:<ExpenseTracker {...p}/>,
    tasks:<TaskManagement {...p}/>,
    monthly:<MonthlyChart {...p}/>,
    search:<SearchFilter {...p}/>,
    reports:<Reports {...p}/>,
    pdf:<PDFReport {...p}/>,
    invoices:<InvoiceReceipts {...p}/>,
    users:<UserManagement currentUser={currentUser}/>,
    settings:<SettingsPage {...p}/>,
  };

  // Filter pages by role
  const allowedPages=ROLES[currentUser.role].pages;
  const pages=Object.fromEntries(Object.entries(allPages).filter(([k])=>allowedPages.includes("all")||allowedPages.includes(k)||k==="users"&&perm.canManageUsers));

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
            <div style={{marginTop:12,padding:"10px 12px",background:"rgba(15,186,129,0.08)",border:"1px solid rgba(15,186,129,0.15)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <p style={{fontSize:12,fontWeight:700,color:"var(--text-primary)"}}>{currentUser.name}</p>
                <Pill color={ROLES[currentUser.role].color}>{ROLES[currentUser.role].label}</Pill>
              </div>
              <button onClick={handleLogout} style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:8,color:"var(--danger)",fontSize:11,fontWeight:700,cursor:"pointer",padding:"5px 10px",fontFamily:"'Noto Sans Bengali',sans-serif"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,107,107,0.2)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(255,107,107,0.1)"}>
                লগআউট
              </button>
            </div>
          </div>
          <nav style={{flex:1,padding:"14px 10px",overflowY:"auto"}}>
            {NAV.filter(({id})=>{
              if(id==="users") return perm.canManageUsers;
              if(allowedPages.includes("all")) return true;
              return allowedPages.includes(id);
            }).map(({id,label,Icon})=>(
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
            <p style={{fontSize:11,color:"var(--text-muted)",textAlign:"center"}}>v16.0 · Auth Rebuilt ✅</p>
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
