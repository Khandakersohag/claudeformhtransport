import { useState, useEffect } from "react";
import LS from "./utils/storage.js";
import GS from "./services/gs.js";
import { parseDate } from "./utils/format.js";
import { ROLES, ROLE_PERMS, getUsers, getCurrentUser, logoutUser, syncUsersFromSheets } from "./utils/auth.js";
import { I, Pill } from "./components/common/ui.jsx";
import LoginPage from "./components/auth/LoginPage.jsx";
import UserManagement from "./components/auth/UserManagement.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import DailyEntry from "./pages/DailyEntry.jsx";
import StaffSalary from "./pages/StaffSalary.jsx";
import ExpenseTracker from "./pages/ExpenseTracker.jsx";
import TaskManagement from "./pages/TaskManagement.jsx";
import Reports from "./pages/Reports.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import VehicleManagement from "./pages/VehicleManagement.jsx";
import MonthlyChart from "./pages/MonthlyChart.jsx";
import QuickEntry from "./pages/QuickEntry.jsx";
import SearchFilter from "./pages/SearchFilter.jsx";
import PDFReport from "./pages/PDFReport.jsx";
import InvoiceReceipts from "./pages/InvoiceReceipts.jsx";
import Attendance from "./pages/Attendance.jsx";
import VehicleTripEntry from "./pages/VehicleTripEntry.jsx";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&display=swap');
  :root {
    --navy-950:#020c1b; --navy-900:#0a192f; --navy-800:#112240;
    --navy-700:#1d3461; --navy-600:#1e3a5f;
    --green-500:#0fba81; --green-400:#1de9b6; --green-300:#64ffda;
    --text-primary:#e6f1ff; --text-secondary:#8892b0; --text-muted:#4a5568;
    --card-bg:rgba(17,34,64,0.85); --card-border:rgba(100,255,218,0.08);
    --danger:#ff6b6b; --amber:#ffd166;
    --shadow-card:0 4px 24px rgba(2,12,27,0.5);
    --shadow-glow:0 0 20px rgba(15,186,129,0.15);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Noto Sans Bengali',sans-serif;background:var(--navy-950);color:var(--text-primary);min-height:100vh;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:var(--navy-900);}
  ::-webkit-scrollbar-thumb{background:var(--navy-700);border-radius:4px;}
  ::-webkit-scrollbar-thumb:hover{background:var(--green-500);}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pulse-dot{0%,100%{box-shadow:0 0 0 0 rgba(15,186,129,0.4);}50%{box-shadow:0 0 0 6px rgba(15,186,129,0);}}
  @keyframes spin{to{transform:rotate(360deg);}}
  .fu0{animation:fadeUp .35s ease both;}.fu1{animation:fadeUp .35s .05s ease both;}
  .fu2{animation:fadeUp .35s .1s ease both;}.fu3{animation:fadeUp .35s .15s ease both;}
  .fu4{animation:fadeUp .35s .2s ease both;}
  input,select,textarea,button{font-family:'Noto Sans Bengali',sans-serif;}
  table{border-collapse:collapse;width:100%;}
`;

const initData = () => ({
  settings:    LS.get("mht_settings", { tripRate:240, carRate:10, companyName:"New M.H. Transport" }),
  dailyRecords:LS.get("mht_daily",    []),
  staff:       LS.get("mht_staff",    []),
  expenses:    LS.get("mht_expenses", []),
  salaries:    LS.get("mht_salaries", []),
  tasks:       LS.get("mht_tasks",    []),
  vehicles:    LS.get("mht_vehicles", []),
  attendance:  LS.get("mht_attendance",{}),
});

const NAV = [
  { id:"dashboard",    label:"ড্যাশবোর্ড",        Icon:I.Home   },
  { id:"quick",        label:"দ্রুত এন্ট্রি ⚡",    Icon:I.Daily  },
  { id:"daily",        label:"দৈনিক এন্ট্রি",       Icon:I.Daily  },
  { id:"vehicles",     label:"গাড়ির তালিকা",        Icon:I.Truck  },
  { id:"vehicletrips", label:"গাড়িভিত্তিক ট্রিপ",  Icon:I.Truck  },
  { id:"attendance",   label:"অ্যাটেন্ডেন্স",       Icon:I.Staff  },
  { id:"staff",        label:"স্টাফ ও বেতন",        Icon:I.Staff  },
  { id:"expenses",     label:"খরচ ট্র্যাকার",        Icon:I.Expense},
  { id:"tasks",        label:"কাজের তালিকা",         Icon:I.Task   },
  { id:"monthly",      label:"মাসিক রিপোর্ট",        Icon:I.Report },
  { id:"search",       label:"সার্চ ও ফিল্টার",      Icon:I.Report },
  { id:"reports",      label:"রিপোর্ট",              Icon:I.Report },
  { id:"pdf",          label:"PDF রিপোর্ট",           Icon:I.Dl     },
  { id:"invoices",     label:"রসিদ ও ভাউচার",        Icon:I.Report },
  { id:"users",        label:"ইউজার ম্যানেজমেন্ট",  Icon:I.Staff  },
  { id:"settings",     label:"সেটিংস",               Icon:I.Gear   },
];

export default function App() {
  const [data, setData]               = useState(initData);
  const [page, setPage]               = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [loadMsg, setLoadMsg]         = useState("লোড হচ্ছে...");
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  // ── Load all data from Sheets on mount ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadMsg("Google Sheets থেকে লোড হচ্ছে...");
      try {
        const [daily, staff, expenses, salaries, tasks, vehicles, attendance] =
          await Promise.all([
            GS.getAll("DailyRecords"), GS.getAll("Staff"),
            GS.getAll("Expenses"),     GS.getAll("Salaries"),
            GS.getAll("Tasks"),        GS.getAll("Vehicles"),
            GS.getAll("Attendance"),
          ]);

        const pd = v => Number(v) || 0;
        const pb = v => v === "true" || v === true;
        const ps = v => String(v || "").trim();

        const parsedDaily = daily.map(r => ({
          ...r, id:ps(r.id), date:parseDate(r.date),
          carCount:pd(r.carCount), tripCount:pd(r.tripCount),
          totalIncome:pd(r.totalIncome), totalExpense:pd(r.totalExpense),
          netProfit:pd(r.netProfit),
          expenses:    (() => { try { return JSON.parse(r.expenses    || "[]"); } catch { return []; } })(),
          vehicleTrips:(() => { try { return JSON.parse(r.vehicleTrips|| "{}"); } catch { return {}; } })(),
        })).filter(r => r.id);

        const parsedStaff    = staff.map(s => ({ ...s, id:ps(s.id), dailyRate:pd(s.dailyRate), isActive:pb(s.isActive) })).filter(s => s.id);
        const parsedExpenses = expenses.map(e => ({ ...e, id:ps(e.id), date:parseDate(e.date), amount:pd(e.amount), isRecurring:pb(e.isRecurring) })).filter(e => e.id);
        const parsedSalaries = salaries.map(s => ({ ...s, id:ps(s.id), totalDays:pd(s.totalDays), actualSalary:pd(s.actualSalary), paidAmount:pd(s.paidAmount), dueAmount:pd(s.dueAmount), paidDate:parseDate(s.paidDate), startDate:parseDate(s.startDate), endDate:parseDate(s.endDate) })).filter(s => s.id);
        const parsedTasks    = tasks.map(t => ({ ...t, id:ps(t.id), dueDate:parseDate(t.dueDate) })).filter(t => t.id);
        const parsedVehicles = vehicles.map(v => ({ ...v, id:ps(v.id) })).filter(v => v.id);
        const parsedAttendance = {};
        attendance.forEach(row => {
          if (row.date && row.staffId) {
            if (!parsedAttendance[row.date]) parsedAttendance[row.date] = {};
            parsedAttendance[row.date][row.staffId] = row.status;
          }
        });

        setData(prev => {
          const m = {
            ...prev,
            dailyRecords: parsedDaily.length    > 0 ? parsedDaily    : prev.dailyRecords,
            staff:         parsedStaff.length    > 0 ? parsedStaff    : prev.staff,
            expenses:      parsedExpenses.length > 0 ? parsedExpenses : prev.expenses,
            salaries:      parsedSalaries.length > 0 ? parsedSalaries : prev.salaries,
            tasks:         parsedTasks.length    > 0 ? parsedTasks    : prev.tasks,
            vehicles:      parsedVehicles.length > 0 ? parsedVehicles : prev.vehicles,
            attendance:    Object.keys(parsedAttendance).length > 0 ? parsedAttendance : prev.attendance,
          };
          LS.set("mht_daily",      m.dailyRecords);
          LS.set("mht_staff",      m.staff);
          LS.set("mht_expenses",   m.expenses);
          LS.set("mht_salaries",   m.salaries);
          LS.set("mht_tasks",      m.tasks);
          LS.set("mht_vehicles",   m.vehicles);
          LS.set("mht_attendance", m.attendance);
          return m;
        });

        // Sync users
        await syncUsersFromSheets();
        setLoadMsg("লোড সম্পন্ন ✅");
      } catch(e) {
        setLoadMsg("অফলাইন মোড");
      }
      setTimeout(() => setLoading(false), 300);
    };
    load();
  }, []);

  const handleLogin  = user => setCurrentUser(user);
  const handleLogout = () => { logoutUser(); setCurrentUser(null); setPage("dashboard"); };
  const goto         = id  => { setPage(id); setSidebarOpen(false); };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{minHeight:"100vh",background:"#020c1b",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,fontFamily:"'Noto Sans Bengali',sans-serif"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#0fba81,#0d9e6e)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <I.Truck/>
      </div>
      <div style={{textAlign:"center"}}>
        <p style={{fontSize:18,fontWeight:900,color:"#e6f1ff",marginBottom:8}}>M.H. Transport</p>
        <p style={{fontSize:13,color:"#8892b0"}}>{loadMsg}</p>
      </div>
      <div style={{width:36,height:36,border:"3px solid rgba(100,255,218,0.15)",borderTop:"3px solid #0fba81",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    </div>
  );

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!currentUser) return <><style>{GLOBAL_CSS}</style><LoginPage onLogin={handleLogin}/></>;

  // ── Main app ────────────────────────────────────────────────────────────────
  const perm = ROLE_PERMS[currentUser.role];
  const p    = { data, setData, currentUser, perm };
  const allowedPages = ROLES[currentUser.role].pages;

  const allPages = {
    dashboard:    <Dashboard    {...p}/>,
    quick:        <QuickEntry   {...p} setPage={setPage} setSidebarOpen={setSidebarOpen}/>,
    daily:        <DailyEntry   {...p}/>,
    vehicles:     <VehicleManagement  {...p}/>,
    vehicletrips: <VehicleTripEntry   {...p}/>,
    attendance:   <Attendance   {...p}/>,
    staff:        <StaffSalary  {...p}/>,
    expenses:     <ExpenseTracker     {...p}/>,
    tasks:        <TaskManagement     {...p}/>,
    monthly:      <MonthlyChart {...p}/>,
    search:       <SearchFilter {...p}/>,
    reports:      <Reports      {...p}/>,
    pdf:          <PDFReport    {...p}/>,
    invoices:     <InvoiceReceipts    {...p}/>,
    users:        <UserManagement currentUser={currentUser}/>,
    settings:     <SettingsPage {...p}/>,
  };

  const pages = Object.fromEntries(
    Object.entries(allPages).filter(([k]) =>
      allowedPages.includes("all") || allowedPages.includes(k) ||
      (k === "users" && perm.canManageUsers)
    )
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{display:"flex",minHeight:"100vh",background:"var(--navy-950)"}}>

        {/* Overlay */}
        {sidebarOpen && (
          <div style={{position:"fixed",inset:0,background:"rgba(2,12,27,0.7)",zIndex:40,backdropFilter:"blur(4px)"}}
               onClick={() => setSidebarOpen(false)}/>
        )}

        {/* Sidebar */}
        <aside style={{position:"fixed",top:0,left:0,height:"100%",width:230,zIndex:50,
          background:"linear-gradient(180deg,var(--navy-900) 0%,var(--navy-950) 100%)",
          borderRight:"1px solid rgba(100,255,218,0.07)",display:"flex",flexDirection:"column",
          transform:sidebarOpen?"translateX(0)":"translateX(-100%)",
          transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)"}}>

          {/* Brand + user */}
          <div style={{padding:"22px 20px 18px",borderBottom:"1px solid rgba(100,255,218,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,var(--green-500),#0d9e6e)",display:"flex",alignItems:"center",justifyContent:"center",color:"#020c1b",flexShrink:0}}>
                <I.Truck/>
              </div>
              <div>
                <p style={{fontWeight:900,fontSize:13,color:"var(--text-primary)",lineHeight:1.2}}>{data.settings.companyName||"M.H. Transport"}</p>
                <p style={{fontSize:11,color:"var(--green-500)",fontWeight:600}}>ম্যানেজমেন্ট সিস্টেম</p>
              </div>
            </div>
            <div style={{padding:"10px 12px",background:"rgba(15,186,129,0.08)",border:"1px solid rgba(15,186,129,0.15)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <p style={{fontSize:12,fontWeight:700,color:"var(--text-primary)"}}>{currentUser.name}</p>
                <Pill color={ROLES[currentUser.role].color}>{ROLES[currentUser.role].label}</Pill>
              </div>
              <button onClick={handleLogout}
                style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:8,color:"var(--danger)",fontSize:11,fontWeight:700,cursor:"pointer",padding:"5px 10px",fontFamily:"'Noto Sans Bengali',sans-serif"}}>
                লগআউট
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav style={{flex:1,padding:"14px 10px",overflowY:"auto"}}>
            {NAV.filter(({id}) => {
              if (id === "users") return perm.canManageUsers;
              if (allowedPages.includes("all")) return true;
              return allowedPages.includes(id);
            }).map(({id, label, Icon}) => (
              <button key={id} onClick={() => goto(id)} style={{
                width:"100%",display:"flex",alignItems:"center",gap:12,
                padding:"11px 14px",borderRadius:12,marginBottom:3,
                background:page===id?"rgba(15,186,129,0.12)":"transparent",
                border:page===id?"1px solid rgba(15,186,129,0.2)":"1px solid transparent",
                color:page===id?"var(--green-300)":"var(--text-secondary)",
                fontWeight:page===id?700:500,fontSize:13,cursor:"pointer",
                transition:"all 0.15s",textAlign:"left",position:"relative",
              }}>
                {page===id && <span style={{position:"absolute",left:0,width:3,height:22,background:"var(--green-500)",borderRadius:"0 2px 2px 0"}}/>}
                <Icon/>{label}
              </button>
            ))}
          </nav>

          <div style={{padding:"14px 20px",borderTop:"1px solid rgba(100,255,218,0.06)"}}>
            <p style={{fontSize:11,color:"var(--text-muted)",textAlign:"center"}}>v17.0 · Multi-File ✅</p>
          </div>
        </aside>

        {/* Main content */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <header style={{position:"sticky",top:0,zIndex:30,display:"flex",alignItems:"center",
            justifyContent:"space-between",padding:"14px 20px",
            background:"rgba(10,25,47,0.92)",backdropFilter:"blur(16px)",
            borderBottom:"1px solid rgba(100,255,218,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={() => setSidebarOpen(true)}
                style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(100,255,218,0.1)",
                  color:"var(--text-secondary)",cursor:"pointer",padding:9,display:"flex",borderRadius:10}}>
                <I.Menu/>
              </button>
              <span style={{fontSize:16,fontWeight:800,color:"var(--text-primary)"}}>
                {NAV.find(n => n.id === page)?.label}
              </span>
            </div>
            <div style={{fontSize:12,color:"var(--text-secondary)",display:"flex",alignItems:"center",gap:7}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"var(--green-500)",display:"inline-block",animation:"pulse-dot 2s ease infinite"}}/>
              {new Date().toLocaleDateString("bn-BD",{day:"numeric",month:"long",year:"numeric"})}
            </div>
          </header>
          <main style={{flex:1,padding:"24px 20px",maxWidth:960,width:"100%",margin:"0 auto"}}>
            {pages[page] || <Dashboard {...p}/>}
          </main>
        </div>

      </div>
    </>
  );
}
