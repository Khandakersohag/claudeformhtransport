import { useState } from "react";

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



export { Ic, I, C, Card, Btn, Field, Sel, Pill, Modal, StatCard, TH, TR, TD, IconBtn };
