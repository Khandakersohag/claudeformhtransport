import { useState, useEffect, useMemo } from "react";

/* ─── Google Fonts injected once ─────────────────────────────────────────── */
const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href =
  "https://fonts.googleapis.com/css2?family=Tiro+Bangla:ital@0;1&family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&display=swap";
document.head.appendChild(FONT_LINK);

/* ─── CSS Variables & Global Styles ─────────────────────────────────────── */
const GLOBAL_CSS = `
  :root {
    --navy-950: #020c1b;
    --navy-900: #0a192f;
    --navy-800: #112240;
    --navy-700: #1d3461;
    --navy-600: #1e3a5f;
    --green-500: #0fba81;
    --green-400: #1de9b6;
    --green-300: #64ffda;
    --green-glow: rgba(15,186,129,0.18);
    --text-primary: #e6f1ff;
    --text-secondary: #8892b0;
    --text-muted: #4a5568;
    --card-bg: rgba(17,34,64,0.85);
    --card-border: rgba(100,255,218,0.08);
    --card-hover: rgba(100,255,218,0.04);
    --danger: #ff6b6b;
    --amber: #ffd166;
    --radius-xl: 16px;
    --radius-lg: 12px;
    --radius-md: 8px;
    --shadow-card: 0 4px 24px rgba(2,12,27,0.5);
    --shadow-glow: 0 0 20px rgba(15,186,129,0.15);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Noto Sans Bengali', sans-serif;
    background: var(--navy-950);
    color: var(--text-primary);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--navy-900); }
  ::-webkit-scrollbar-thumb { background: var(--navy-700); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--green-500); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-green {
    0%, 100% { box-shadow: 0 0 0 0 rgba(15,186,129,0.4); }
    50%       { box-shadow: 0 0 0 8px rgba(15,186,129,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .fade-up { animation: fadeUp 0.4s ease both; }
  .fade-up-1 { animation: fadeUp 0.4s 0.05s ease both; }
  .fade-up-2 { animation: fadeUp 0.4s 0.1s ease both; }
  .fade-up-3 { animation: fadeUp 0.4s 0.15s ease both; }
  .fade-up-4 { animation: fadeUp 0.4s 0.2s ease both; }

  input, select, textarea {
    font-family: 'Noto Sans Bengali', sans-serif;
    font-size: 14px;
  }
  button { font-family: 'Noto Sans Bengali', sans-serif; }

  table { border-collapse: collapse; width: 100%; }
`;

/* ─── LocalStorage ───────────────────────────────────────────────────────── */
const LS = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const initData = () => ({
  settings: LS.get("mht_settings", { tripRate: 240, carRate: 10, companyName: "New M.H. Transport" }),
  dailyRecords: LS.get("mht_daily", []),
  staff: LS.get("mht_staff", []),
  expenses: LS.get("mht_expenses", []),
  salaries: LS.get("mht_salaries", []),
  tasks: LS.get("mht_tasks", []),
});

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const BDT = (n) => `৳${Number(n || 0).toLocaleString("bn-BD")}`;
const dateStr = (ts) => new Date(ts).toLocaleDateString("bn-BD", { day: "2-digit", month: "short", year: "numeric" });
const todayISO = () => new Date().toISOString().split("T")[0];
const tsFrom = (s) => new Date(s).getTime();

const EXPENSE_CATS = ["Fuel", "Servicing", "Staff Salary", "Office", "Police", "Welfare", "Misc"];
const TASK_STATUSES = { pending: "বাকি", "in-progress": "চলছে", completed: "সম্পন্ন", cancelled: "বাতিল" };
const TASK_PRIORITIES = { low: "কম", medium: "মাঝারি", high: "জরুরি" };

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
const Ic = ({ d, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {[].concat(d).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const I = {
  Home:    () => <Ic d={["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"]} />,
  Daily:   () => <Ic d={["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"]} />,
  Staff:   () => <Ic d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"]} />,
  Expense: () => <Ic d={["M12 1v22","M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]} />,
  Report:  () => <Ic d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"]} />,
  Task:    () => <Ic d={["M9 11l3 3L22 4","M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"]} />,
  Gear:    () => <Ic d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]} />,
  Truck:   () => <Ic d={["M1 3h15v13H1z","M16 8h4l3 3v5h-7V8z","M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z","M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"]} />,
  Plus:    () => <Ic d={["M12 5v14","M5 12h14"]} />,
  Trash:   () => <Ic d={["M3 6h18","M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"]} />,
  Edit:    () => <Ic d={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]} />,
  Save:    () => <Ic d={["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z","M17 21v-8H7v8","M7 3v5h8"]} />,
  X:       () => <Ic d={["M18 6 6 18","M6 6l12 12"]} />,
  Check:   () => <Ic d="M20 6 9 17l-5-5" />,
  Up:      () => <Ic d={["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"]} />,
  Down:    () => <Ic d={["M23 18l-9.5-9.5-5 5L1 6","M17 18h6v-6"]} />,
  Menu:    () => <Ic d={["M3 12h18","M3 6h18","M3 18h18"]} />,
  Dl:      () => <Ic d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"]} />,
  Ul:      () => <Ic d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]} />,
  Warn:    () => <Ic d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"]} />,
};

/* ─── Primitive UI Components ────────────────────────────────────────────── */
const Card = ({ children, className = "", glow = false, style = {} }) => (
  <div className={className} style={{
    background: "var(--card-bg)",
    border: `1px solid ${glow ? "rgba(100,255,218,0.2)" : "var(--card-border)"}`,
    borderRadius: "var(--radius-xl)",
    boxShadow: glow ? "var(--shadow-glow), var(--shadow-card)" : "var(--shadow-card)",
    backdropFilter: "blur(12px)",
    ...style,
  }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, v = "primary", size = "md", icon, disabled, full, type = "button", className = "" }) => {
  const sizes = { sm: { padding: "6px 14px", fontSize: "12px" }, md: { padding: "10px 20px", fontSize: "13px" }, lg: { padding: "12px 24px", fontSize: "14px" } };
  const variants = {
    primary: { background: "linear-gradient(135deg, var(--green-500), #0d9e6e)", color: "#020c1b", border: "none", fontWeight: 700 },
    ghost:   { background: "transparent", color: "var(--green-500)", border: "1px solid rgba(100,255,218,0.25)", fontWeight: 600 },
    danger:  { background: "rgba(255,107,107,0.12)", color: "var(--danger)", border: "1px solid rgba(255,107,107,0.25)", fontWeight: 600 },
    navy:    { background: "var(--navy-700)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.08)", fontWeight: 600 },
    success: { background: "rgba(15,186,129,0.12)", color: "var(--green-400)", border: "1px solid rgba(15,186,129,0.25)", fontWeight: 600 },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer",
      borderRadius: "var(--radius-lg)", transition: "all 0.18s ease", opacity: disabled ? 0.5 : 1,
      width: full ? "100%" : undefined, justifyContent: full ? "center" : undefined,
      fontFamily: "'Noto Sans Bengali', sans-serif", letterSpacing: "0.01em",
      ...sizes[size], ...variants[v],
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
      className={className}
    >
      {icon && <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>}
      {children}
    </button>
  );
};

const Field = ({ label, value, onChange, type = "text", placeholder, min, step }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} step={step}
      style={{
        background: "rgba(2,12,27,0.6)", border: "1px solid rgba(100,255,218,0.12)", borderRadius: "var(--radius-md)",
        color: "var(--text-primary)", padding: "10px 14px", outline: "none", width: "100%", transition: "border-color 0.2s",
      }}
      onFocus={e => e.target.style.borderColor = "var(--green-500)"}
      onBlur={e => e.target.style.borderColor = "rgba(100,255,218,0.12)"}
    />
  </div>
);

const Sel = ({ label, value, onChange, options }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        background: "rgba(2,12,27,0.7)", border: "1px solid rgba(100,255,218,0.12)", borderRadius: "var(--radius-md)",
        color: "var(--text-primary)", padding: "10px 14px", outline: "none", width: "100%",
        appearance: "none", cursor: "pointer",
      }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o} style={{ background: "#0a192f" }}>{o.label ?? o}</option>)}
    </select>
  </div>
);

const Pill = ({ children, color = "navy" }) => {
  const colors = {
    navy: { bg: "rgba(29,52,97,0.8)", color: "var(--text-secondary)", border: "rgba(100,255,218,0.1)" },
    green: { bg: "rgba(15,186,129,0.12)", color: "var(--green-400)", border: "rgba(15,186,129,0.25)" },
    red: { bg: "rgba(255,107,107,0.12)", color: "var(--danger)", border: "rgba(255,107,107,0.25)" },
    amber: { bg: "rgba(255,209,102,0.1)", color: "var(--amber)", border: "rgba(255,209,102,0.25)" },
    blue: { bg: "rgba(100,149,237,0.12)", color: "#6495ed", border: "rgba(100,149,237,0.3)" },
  };
  const c = colors[color];
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", display: "inline-block" }}>
      {children}
    </span>
  );
};

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(2,12,27,0.85)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", borderRadius: "var(--radius-xl)", background: "var(--navy-800)", border: "1px solid rgba(100,255,218,0.15)", boxShadow: "0 24px 80px rgba(2,12,27,0.8), var(--shadow-glow)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(100,255,218,0.08)" }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--green-300)" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4, display: "flex", borderRadius: 8 }}><I.X /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, IconComp, positive, delay = 0 }) => (
  <Card glow={positive === true} className={`fade-up-${delay}`} style={{ padding: 20 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ padding: 10, borderRadius: 12, background: positive === true ? "rgba(15,186,129,0.15)" : positive === false ? "rgba(255,107,107,0.1)" : "rgba(255,255,255,0.05)", color: positive === true ? "var(--green-400)" : positive === false ? "var(--danger)" : "var(--text-secondary)", display: "flex" }}>
        <IconComp />
      </div>
      {sub && <span style={{ fontSize: 11, color: positive ? "var(--green-400)" : "var(--danger)", fontWeight: 700 }}>{sub}</span>}
    </div>
    <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</p>
    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{value}</p>
  </Card>
);

/* ════════════════════════════════════════════════════════════════════════════
   PAGES
   ════════════════════════════════════════════════════════════════════════════ */

/* ─── Dashboard ─────────────────────────────────────────────────────────── */
function Dashboard({ data }) {
  const { dailyRecords, expenses, staff, tasks } = data;
  const totalIncome = useMemo(() => dailyRecords.reduce((a, r) => a + (r.totalIncome || 0), 0), [dailyRecords]);
  const totalExp = useMemo(() => dailyRecords.reduce((a, r) => a + (r.totalExpense || 0), 0) + expenses.reduce((a, e) => a + (e.amount || 0), 0), [dailyRecords, expenses]);
  const balance = totalIncome - totalExp;
  const activeStaff = staff.filter(s => s.isActive).length;
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in-progress").length;

  const recent = useMemo(() => [...dailyRecords.map(r => ({ date: r.date, desc: `দৈনিক (${r.carCount} গাড়ি, ${r.tripCount} ট্রিপ)`, cat: "আয়", amount: r.totalIncome, pos: true })), ...expenses.map(e => ({ date: e.date, desc: e.description, cat: e.category, amount: e.amount, pos: false }))].sort((a, b) => b.date - a.date).slice(0, 8), [dailyRecords, expenses]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="fade-up">
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>ব্যবসায়িক সারসংক্ষেপ</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>সর্বশেষ তথ্যের উপর ভিত্তি করে</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14 }}>
        <StatCard label="মোট আয়" value={BDT(totalIncome)} positive={true} IconComp={I.Up} delay={1} />
        <StatCard label="মোট খরচ" value={BDT(totalExp)} positive={false} IconComp={I.Down} delay={2} />
        <StatCard label="নেট ব্যালেন্স" value={BDT(balance)} positive={balance >= 0} IconComp={I.Truck} delay={3} />
        <StatCard label="সক্রিয় স্টাফ" value={`${activeStaff} জন`} sub={`${pendingTasks} কাজ বাকি`} positive={true} IconComp={I.Staff} delay={4} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
        {/* Transactions */}
        <Card className="fade-up-2" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)" }}>সাম্প্রতিক লেনদেন</h3>
          </div>
          {recent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              কোনো ডেটা নেই। প্রথমে দৈনিক এন্ট্রি যোগ করুন।
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(100,255,218,0.08)" }}>
                    {["তারিখ", "বিবরণ", "ধরন", "পরিমাণ"].map(h => (
                      <th key={h} style={{ padding: "0 10px 12px", textAlign: h === "পরিমাণ" ? "right" : "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--card-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: "12px 10px", color: "var(--text-secondary)", fontSize: 12, whiteSpace: "nowrap" }}>{dateStr(r.date)}</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-primary)", fontSize: 13, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.desc}</td>
                      <td style={{ padding: "12px 10px" }}><Pill color={r.pos ? "green" : "amber"}>{r.cat}</Pill></td>
                      <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", fontSize: 13, color: r.pos ? "var(--green-400)" : "var(--danger)" }}>{r.pos ? "+" : "-"}{BDT(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Operational Volume */}
        <Card className="fade-up-3" style={{ padding: 22, background: "linear-gradient(135deg, rgba(15,186,129,0.08) 0%, rgba(17,34,64,0.9) 100%)", borderColor: "rgba(100,255,218,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, color: "var(--green-400)" }}>
            <I.Truck />
            <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)" }}>অপারেশনাল ভলিউম</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              ["মোট গাড়ি", dailyRecords.reduce((a, r) => a + (r.carCount || 0), 0)],
              ["মোট ট্রিপ", dailyRecords.reduce((a, r) => a + (r.tripCount || 0), 0)],
              ["মোট দিন", dailyRecords.length],
            ].map(([label, val]) => (
              <div key={label} style={{ background: "rgba(2,12,27,0.4)", borderRadius: 12, padding: "14px 12px", border: "1px solid rgba(100,255,218,0.08)" }}>
                <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: "var(--green-300)" }}>{val}</p>
              </div>
            ))}
          </div>
          {totalIncome > 0 && (
            <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(2,12,27,0.4)", borderRadius: 10, border: "1px solid rgba(100,255,218,0.08)" }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>গড় দৈনিক আয়: <strong style={{ color: "var(--green-400)" }}>{BDT(Math.round(totalIncome / (dailyRecords.length || 1)))}</strong></p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─── Daily Entry ────────────────────────────────────────────────────────── */
function DailyEntry({ data, setData }) {
  const { settings, dailyRecords } = data;
  const [date, setDate] = useState(todayISO());
  const [carCount, setCarCount] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [editId, setEditId] = useState(null);
  const [expCat, setExpCat] = useState(EXPENSE_CATS[0]);
  const [expAmt, setExpAmt] = useState("");
  const [expDesc, setExpDesc] = useState("");

  const totalIncome = (Number(carCount) * settings.carRate) + (Number(tripCount) * settings.tripRate);
  const totalExpense = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
  const netProfit = totalIncome - totalExpense;

  const loadRecord = r => { setDate(new Date(r.date).toISOString().split("T")[0]); setCarCount(r.carCount); setTripCount(r.tripCount); setExpenses(r.expenses || []); setEditId(r.id); };
  const reset = () => { setDate(todayISO()); setCarCount(0); setTripCount(0); setExpenses([]); setEditId(null); };

  const addExp = () => {
    if (!expAmt || Number(expAmt) <= 0) return;
    setExpenses(p => [...p, { category: expCat, amount: Number(expAmt), description: expDesc || expCat }]);
    setExpAmt(""); setExpDesc("");
  };

  const save = () => {
    const rec = { id: editId || Date.now().toString(), date: tsFrom(date), carCount: Number(carCount), tripCount: Number(tripCount), expenses, totalIncome, totalExpense, netProfit, createdAt: Date.now() };
    const list = editId ? dailyRecords.map(r => r.id === editId ? rec : r) : [rec, ...dailyRecords];
    setData(p => { const n = { ...p, dailyRecords: list }; LS.set("mht_daily", list); return n; });
    reset();
  };

  const del = id => { const list = dailyRecords.filter(r => r.id !== id); setData(p => { const n = { ...p, dailyRecords: list }; LS.set("mht_daily", list); return n; }); if (editId === id) reset(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="fade-up">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>দৈনিক এন্ট্রি</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>প্রতিদিনের আয় ও খরচ রেকর্ড</p>
        </div>
        {editId && <Btn v="ghost" onClick={reset} icon={<I.X />}>বাতিল</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 18 }}>
        {/* Form */}
        <Card className="fade-up-1" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)", marginBottom: 18 }}>{editId ? "✏️ রেকর্ড সম্পাদনা" : "➕ নতুন এন্ট্রি"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="তারিখ" type="date" value={date} onChange={setDate} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label={`গাড়ি চেক (৳${settings.carRate}/টি)`} type="number" min="0" value={carCount} onChange={v => setCarCount(Number(v))} />
              <Field label={`ট্রিপ (৳${settings.tripRate}/টি)`} type="number" min="0" value={tripCount} onChange={v => setTripCount(Number(v))} />
            </div>

            {/* Summary */}
            <div style={{ background: "rgba(2,12,27,0.6)", border: "1px solid rgba(100,255,218,0.1)", borderRadius: 12, padding: 16 }}>
              {[["মোট আয়", BDT(totalIncome), "var(--green-400)"], ["মোট খরচ", BDT(totalExpense), "var(--danger)"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{l}</span>
                  <span style={{ fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>নেট লাভ</span>
                <span style={{ fontWeight: 900, fontSize: 16, color: netProfit >= 0 ? "var(--green-400)" : "var(--danger)" }}>{BDT(netProfit)}</span>
              </div>
            </div>

            {/* Add Expense */}
            <div style={{ background: "rgba(2,12,27,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>খরচ যোগ করুন</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Sel value={expCat} onChange={setExpCat} options={EXPENSE_CATS} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Field placeholder="পরিমাণ" type="number" min="0" value={expAmt} onChange={setExpAmt} />
                  <Field placeholder="বিবরণ" value={expDesc} onChange={setExpDesc} />
                </div>
                <Btn v="ghost" onClick={addExp} icon={<I.Plus />} size="sm">যোগ করুন</Btn>
              </div>
            </div>

            {expenses.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                {expenses.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(15,186,129,0.05)", border: "1px solid rgba(15,186,129,0.1)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: "var(--green-300)" }}>{e.category}</span>
                      <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>— {e.description}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: 12 }}>{BDT(e.amount)}</span>
                      <button onClick={() => setExpenses(p => p.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}><I.X /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Btn onClick={save} icon={<I.Save />} full>{editId ? "আপডেট করুন" : "সেভ করুন"}</Btn>
          </div>
        </Card>

        {/* History */}
        <Card className="fade-up-2" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)", marginBottom: 18 }}>📜 রেকর্ড ইতিহাস</h3>
          {dailyRecords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>কোনো রেকর্ড নেই</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(100,255,218,0.08)" }}>
                    {["তারিখ", "গাড়ি", "ট্রিপ", "আয়", "লাভ", ""].map((h, i) => (
                      <th key={i} style={{ padding: "0 8px 12px", textAlign: i > 2 ? "right" : "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyRecords.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: editId === r.id ? "rgba(15,186,129,0.05)" : "" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(100,255,218,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = editId === r.id ? "rgba(15,186,129,0.05)" : ""}>
                      <td style={{ padding: "11px 8px", color: "var(--text-secondary)", fontSize: 12, whiteSpace: "nowrap" }}>{dateStr(r.date)}</td>
                      <td style={{ padding: "11px 8px", textAlign: "center", color: "var(--text-primary)", fontSize: 13 }}>{r.carCount}</td>
                      <td style={{ padding: "11px 8px", textAlign: "center", color: "var(--text-primary)", fontSize: 13 }}>{r.tripCount}</td>
                      <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "var(--green-400)", fontWeight: 700 }}>{BDT(r.totalIncome)}</td>
                      <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: r.netProfit >= 0 ? "var(--green-300)" : "var(--danger)" }}>{BDT(r.netProfit)}</td>
                      <td style={{ padding: "11px 8px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => loadRecord(r)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: 4, borderRadius: 6 }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--green-400)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}><I.Edit /></button>
                          <button onClick={() => del(r.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: 4, borderRadius: 6 }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}><I.Trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─── Staff Salary ───────────────────────────────────────────────────────── */
function StaffSalary({ data, setData }) {
  const { staff, salaries } = data;
  const [showAdd, setShowAdd] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [sel, setSel] = useState(null);
  const [sName, setSName] = useState(""); const [sPos, setSPos] = useState(""); const [sRate, setSRate] = useState("");
  const [salStart, setSalStart] = useState(todayISO()); const [salEnd, setSalEnd] = useState(todayISO()); const [salPaid, setSalPaid] = useState("");

  const addStaff = () => {
    if (!sName || !sRate) return;
    const s = { id: Date.now().toString(), name: sName, position: sPos, dailyRate: Number(sRate), isActive: true };
    const list = [...staff, s]; setData(p => { const n = { ...p, staff: list }; LS.set("mht_staff", list); return n; });
    setSName(""); setSPos(""); setSRate(""); setShowAdd(false);
  };

  const toggle = id => { const list = staff.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s); setData(p => { const n = { ...p, staff: list }; LS.set("mht_staff", list); return n; }); };
  const del = id => { const list = staff.filter(s => s.id !== id); setData(p => { const n = { ...p, staff: list }; LS.set("mht_staff", list); return n; }); };

  const openPay = s => { setSel(s); setSalStart(todayISO()); setSalEnd(todayISO()); setSalPaid(""); setShowPay(true); };

  const paySalary = () => {
    if (!sel || !salPaid) return;
    const days = Math.max(1, Math.ceil((tsFrom(salEnd) - tsFrom(salStart)) / 86400000) + 1);
    const actual = days * sel.dailyRate;
    const paid = Number(salPaid);
    const sal = { id: Date.now().toString(), staffId: sel.id, staffName: sel.name, startDate: tsFrom(salStart), endDate: tsFrom(salEnd), totalDays: days, actualSalary: actual, paidAmount: paid, dueAmount: actual - paid, paidDate: Date.now() };
    const list = [...salaries, sal]; setData(p => { const n = { ...p, salaries: list }; LS.set("mht_salaries", list); return n; });
    setShowPay(false);
  };

  const calcDays = () => Math.max(1, Math.ceil((tsFrom(salEnd) - tsFrom(salStart)) / 86400000) + 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="fade-up">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>স্টাফ ও বেতন</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>কর্মী ও বেতন ব্যবস্থাপনা</p>
        </div>
        <Btn onClick={() => setShowAdd(true)} icon={<I.Plus />}>নতুন স্টাফ</Btn>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <Card className="fade-up-1" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)", marginBottom: 16 }}>👥 স্টাফ তালিকা</h3>
          {staff.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)", fontSize: 13 }}>কোনো স্টাফ নেই</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {staff.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, background: "rgba(2,12,27,0.5)", border: "1px solid rgba(100,255,218,0.08)", borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: s.isActive ? "linear-gradient(135deg,var(--green-500),#0d9e6e)" : "var(--navy-700)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: s.isActive ? "#020c1b" : "var(--text-muted)", flexShrink: 0 }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{s.name}</p>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.position || "কর্মী"} · {BDT(s.dailyRate)}/দিন</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Pill color={s.isActive ? "green" : "navy"}>{s.isActive ? "সক্রিয়" : "অসক্রিয়"}</Pill>
                    <Btn v="success" size="sm" onClick={() => openPay(s)}>বেতন দিন</Btn>
                    <Btn v="navy" size="sm" onClick={() => toggle(s.id)}>{s.isActive ? "বন্ধ" : "চালু"}</Btn>
                    <button onClick={() => del(s.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: 6, borderRadius: 8 }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}><I.Trash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="fade-up-2" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)", marginBottom: 16 }}>💰 বেতন রেকর্ড</h3>
          {salaries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)", fontSize: 13 }}>কোনো বেতন রেকর্ড নেই</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr style={{ borderBottom: "1px solid rgba(100,255,218,0.08)" }}>
                  {["নাম", "দিন", "প্রাপ্য", "প্রদত্ত", "বাকি"].map((h, i) => (
                    <th key={h} style={{ padding: "0 8px 12px", textAlign: i > 1 ? "right" : "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[...salaries].reverse().map(s => (
                    <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "11px 8px", fontWeight: 700, color: "var(--text-primary)", fontSize: 13 }}>{s.staffName}</td>
                      <td style={{ padding: "11px 8px", color: "var(--text-secondary)", fontSize: 12 }}>{s.totalDays}</td>
                      <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)" }}>{BDT(s.actualSalary)}</td>
                      <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--green-400)" }}>{BDT(s.paidAmount)}</td>
                      <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: s.dueAmount > 0 ? "var(--danger)" : "var(--green-400)" }}>{BDT(s.dueAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="নতুন স্টাফ যোগ করুন">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="নাম" value={sName} onChange={setSName} placeholder="স্টাফের নাম" />
          <Field label="পদবি" value={sPos} onChange={setSPos} placeholder="ড্রাইভার / হেল্পার / ম্যানেজার" />
          <Field label="দৈনিক রেট (৳)" type="number" min="0" value={sRate} onChange={setSRate} placeholder="500" />
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Btn onClick={addStaff} icon={<I.Save />} full>সেভ করুন</Btn>
            <Btn v="ghost" onClick={() => setShowAdd(false)} full>বাতিল</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={showPay} onClose={() => setShowPay(false)} title={`বেতন প্রদান — ${sel?.name}`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="শুরু" type="date" value={salStart} onChange={setSalStart} />
            <Field label="শেষ" type="date" value={salEnd} onChange={setSalEnd} />
          </div>
          {salStart && salEnd && (
            <div style={{ background: "rgba(2,12,27,0.6)", border: "1px solid rgba(100,255,218,0.1)", borderRadius: 10, padding: 14 }}>
              {[["মোট দিন", calcDays()], ["দৈনিক রেট", BDT(sel?.dailyRate)], ["প্রাপ্য বেতন", BDT(calcDays() * (sel?.dailyRate || 0))]].map(([l, v], i) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: i < 2 ? 8 : 0, paddingTop: i === 2 ? 10 : 0, borderTop: i === 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{l}</span>
                  <span style={{ fontWeight: i === 2 ? 900 : 700, color: i === 2 ? "var(--green-400)" : "var(--text-primary)" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          <Field label="প্রদত্ত পরিমাণ (৳)" type="number" min="0" value={salPaid} onChange={setSalPaid} placeholder="0" />
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Btn onClick={paySalary} icon={<I.Check />} full>বেতন দিন</Btn>
            <Btn v="ghost" onClick={() => setShowPay(false)} full>বাতিল</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Expense Tracker ────────────────────────────────────────────────────── */
function ExpenseTracker({ data, setData }) {
  const { expenses } = data;
  const [showAdd, setShowAdd] = useState(false);
  const [date, setDate] = useState(todayISO()); const [cat, setCat] = useState(EXPENSE_CATS[0]);
  const [amount, setAmount] = useState(""); const [desc, setDesc] = useState("");
  const [isRec, setIsRec] = useState(false); const [filterCat, setFilterCat] = useState("সব");

  const add = () => {
    if (!amount || Number(amount) <= 0) return;
    const e = { id: Date.now().toString(), date: tsFrom(date), category: cat, amount: Number(amount), description: desc || cat, isRecurring: isRec };
    const list = [e, ...expenses]; setData(p => { const n = { ...p, expenses: list }; LS.set("mht_expenses", list); return n; });
    setAmount(""); setDesc(""); setShowAdd(false);
  };

  const del = id => { const list = expenses.filter(e => e.id !== id); setData(p => { const n = { ...p, expenses: list }; LS.set("mht_expenses", list); return n; }); };

  const filtered = filterCat === "সব" ? expenses : expenses.filter(e => e.category === filterCat);
  const total = filtered.reduce((a, e) => a + e.amount, 0);
  const byCat = useMemo(() => { const m = {}; expenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; }); return m; }, [expenses]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="fade-up">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>খরচ ট্র্যাকার</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>বিবিধ ব্যয় পর্যবেক্ষণ</p>
        </div>
        <Btn onClick={() => setShowAdd(true)} icon={<I.Plus />}>নতুন খরচ</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }} className="fade-up-1">
        {Object.entries(byCat).map(([c, a]) => (
          <div key={c} style={{ background: "rgba(15,186,129,0.05)", border: "1px solid rgba(15,186,129,0.1)", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}
            onClick={() => setFilterCat(filterCat === c ? "সব" : c)}>
            <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{c}</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: "var(--green-300)" }}>{BDT(a)}</p>
          </div>
        ))}
      </div>

      <Card className="fade-up-2" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)" }}>তালিকা · <span style={{ color: "var(--danger)" }}>{BDT(total)}</span></h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["সব", ...EXPENSE_CATS].map(c => (
              <button key={c} onClick={() => setFilterCat(c)} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: filterCat === c ? "1px solid var(--green-500)" : "1px solid rgba(255,255,255,0.08)", background: filterCat === c ? "rgba(15,186,129,0.15)" : "transparent", color: filterCat === c ? "var(--green-400)" : "var(--text-secondary)", transition: "all 0.15s" }}>{c}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)", fontSize: 13 }}>কোনো খরচ নেই</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr style={{ borderBottom: "1px solid rgba(100,255,218,0.08)" }}>
                {["তারিখ", "ক্যাটাগরি", "বিবরণ", "পরিমাণ", ""].map((h, i) => (
                  <th key={i} style={{ padding: "0 8px 12px", textAlign: i === 3 ? "right" : "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "11px 8px", color: "var(--text-secondary)", fontSize: 12, whiteSpace: "nowrap" }}>{dateStr(e.date)}</td>
                    <td style={{ padding: "11px 8px" }}><Pill color="amber">{e.category}</Pill></td>
                    <td style={{ padding: "11px 8px", color: "var(--text-primary)", fontSize: 13 }}>{e.description} {e.isRecurring && <Pill color="blue">নিয়মিত</Pill>}</td>
                    <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>{BDT(e.amount)}</td>
                    <td style={{ padding: "11px 8px" }}>
                      <button onClick={() => del(e.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: 4, borderRadius: 6 }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}><I.Trash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="নতুন খরচ যোগ করুন">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="তারিখ" type="date" value={date} onChange={setDate} />
          <Sel label="ক্যাটাগরি" value={cat} onChange={setCat} options={EXPENSE_CATS} />
          <Field label="পরিমাণ (৳)" type="number" min="0" value={amount} onChange={setAmount} placeholder="0" />
          <Field label="বিবরণ" value={desc} onChange={setDesc} placeholder="খরচের বিবরণ" />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={isRec} onChange={e => setIsRec(e.target.checked)} style={{ accentColor: "var(--green-500)" }} />
            নিয়মিত খরচ
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Btn onClick={add} icon={<I.Save />} full>যোগ করুন</Btn>
            <Btn v="ghost" onClick={() => setShowAdd(false)} full>বাতিল</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Task Management ────────────────────────────────────────────────────── */
function TaskManagement({ data, setData }) {
  const { tasks, staff } = data;
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("medium"); const [dueDate, setDueDate] = useState(todayISO());
  const [assignedTo, setAssignedTo] = useState(""); const [filterStatus, setFilterStatus] = useState("সব");

  const add = () => {
    if (!title) return;
    const t = { id: Date.now().toString(), title, description: desc, status: "pending", priority, dueDate: tsFrom(dueDate), createdAt: Date.now(), assignedTo };
    const list = [t, ...tasks]; setData(p => { const n = { ...p, tasks: list }; LS.set("mht_tasks", list); return n; });
    setTitle(""); setDesc(""); setPriority("medium"); setDueDate(todayISO()); setAssignedTo(""); setShowAdd(false);
  };

  const updateStatus = (id, status) => { const list = tasks.map(t => t.id === id ? { ...t, status } : t); setData(p => { const n = { ...p, tasks: list }; LS.set("mht_tasks", list); return n; }); };
  const del = id => { const list = tasks.filter(t => t.id !== id); setData(p => { const n = { ...p, tasks: list }; LS.set("mht_tasks", list); return n; }); };

  const filtered = filterStatus === "সব" ? tasks : tasks.filter(t => t.status === filterStatus);

  const priorColor = { low: "green", medium: "amber", high: "red" };
  const statusColor = { pending: "navy", "in-progress": "blue", completed: "green", cancelled: "red" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="fade-up">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>কাজের তালিকা</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>অপারেশনাল টাস্ক ম্যানেজমেন্ট</p>
        </div>
        <Btn onClick={() => setShowAdd(true)} icon={<I.Plus />}>নতুন কাজ</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="fade-up-1">
        {["সব", ...Object.keys(TASK_STATUSES)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", border: filterStatus === s ? "1px solid var(--green-500)" : "1px solid rgba(255,255,255,0.08)", background: filterStatus === s ? "rgba(15,186,129,0.15)" : "transparent", color: filterStatus === s ? "var(--green-400)" : "var(--text-secondary)", transition: "all 0.15s" }}>
            {s === "সব" ? "সব" : TASK_STATUSES[s]} ({s === "সব" ? tasks.length : tasks.filter(t => t.status === s).length})
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>কোনো কাজ নেই</div>
        ) : filtered.map((t, idx) => (
          <Card key={t.id} className={`fade-up-${(idx % 4) + 1}`} style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Pill color={priorColor[t.priority]}>{TASK_PRIORITIES[t.priority]}</Pill>
                <Pill color={statusColor[t.status]}>{TASK_STATUSES[t.status]}</Pill>
              </div>
              <button onClick={() => del(t.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", flexShrink: 0, padding: 2, borderRadius: 6 }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}><I.Trash /></button>
            </div>
            <h4 style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>{t.title}</h4>
            {t.description && <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>{t.description}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>শেষ: {dateStr(t.dueDate)}</p>
              {t.assignedTo && <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>👤 {staff.find(s => s.id === t.assignedTo)?.name || "?"}</p>}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
              {Object.keys(TASK_STATUSES).filter(s => s !== t.status).map(s => (
                <button key={s} onClick={() => updateStatus(t.id, s)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green-500)"; e.currentTarget.style.color = "var(--green-400)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                  {TASK_STATUSES[s]}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="নতুন কাজ যোগ করুন">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="শিরোনাম" value={title} onChange={setTitle} placeholder="কাজের শিরোনাম" />
          <Field label="বিবরণ" value={desc} onChange={setDesc} placeholder="বিস্তারিত" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Sel label="অগ্রাধিকার" value={priority} onChange={setPriority} options={Object.entries(TASK_PRIORITIES).map(([v, l]) => ({ value: v, label: l }))} />
            <Field label="শেষ তারিখ" type="date" value={dueDate} onChange={setDueDate} />
          </div>
          {staff.length > 0 && <Sel label="দায়িত্বপ্রাপ্ত" value={assignedTo} onChange={setAssignedTo} options={[{ value: "", label: "— নির্বাচন করুন —" }, ...staff.map(s => ({ value: s.id, label: s.name }))]} />}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Btn onClick={add} icon={<I.Save />} full>যোগ করুন</Btn>
            <Btn v="ghost" onClick={() => setShowAdd(false)} full>বাতিল</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Reports ────────────────────────────────────────────────────────────── */
function Reports({ data }) {
  const { dailyRecords, expenses, salaries } = data;
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [to, setTo] = useState(todayISO());

  const fromTs = tsFrom(from); const toTs = tsFrom(to) + 86399999;
  const fDaily = dailyRecords.filter(r => r.date >= fromTs && r.date <= toTs);
  const fExp = expenses.filter(e => e.date >= fromTs && e.date <= toTs);
  const fSal = salaries.filter(s => s.paidDate >= fromTs && s.paidDate <= toTs);

  const totalIncome = fDaily.reduce((a, r) => a + r.totalIncome, 0);
  const totalExp = fDaily.reduce((a, r) => a + r.totalExpense, 0) + fExp.reduce((a, e) => a + e.amount, 0);
  const totalSal = fSal.reduce((a, s) => a + s.paidAmount, 0);
  const net = totalIncome - totalExp;

  const expByCat = useMemo(() => {
    const m = {};
    fExp.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    fDaily.forEach(r => (r.expenses || []).forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; }));
    return m;
  }, [fExp, fDaily]);

  const exportCSV = () => {
    const rows = [["তারিখ", "গাড়ি", "ট্রিপ", "আয়", "খরচ", "লাভ"], ...fDaily.map(r => [dateStr(r.date), r.carCount, r.tripCount, r.totalIncome, r.totalExpense, r.netProfit])];
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.map(r => r.join(",")).join("\n")); a.download = `mh-transport-${from}-${to}.csv`; a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }} className="fade-up">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>রিপোর্ট</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>নির্দিষ্ট সময়কালের প্রতিবেদন</p>
        </div>
        <Btn v="ghost" onClick={exportCSV} icon={<I.Dl />} size="sm">CSV রপ্তানি</Btn>
      </div>

      <Card className="fade-up-1" style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field label="শুরুর তারিখ" type="date" value={from} onChange={setFrom} />
          <Field label="শেষ তারিখ" type="date" value={to} onChange={setTo} />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12 }} className="fade-up-2">
        <StatCard label="মোট আয়" value={BDT(totalIncome)} positive={true} IconComp={I.Up} />
        <StatCard label="মোট খরচ" value={BDT(totalExp)} positive={false} IconComp={I.Down} />
        <StatCard label="নেট লাভ" value={BDT(net)} positive={net >= 0} IconComp={I.Truck} />
        <StatCard label="বেতন দেওয়া" value={BDT(totalSal)} IconComp={I.Staff} />
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <Card className="fade-up-3" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)", marginBottom: 16 }}>ক্যাটাগরি অনুযায়ী খরচ</h3>
          {Object.keys(expByCat).length === 0 ? (
            <p style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>কোনো তথ্য নেই</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{cat}</span>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{BDT(amt)}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg, var(--green-500), var(--green-400))", borderRadius: 999, width: `${(amt / (totalExp || 1)) * 100}%`, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="fade-up-4" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)", marginBottom: 16 }}>দৈনিক রেকর্ড ({fDaily.length} দিন)</h3>
          <div style={{ overflowY: "auto", maxHeight: 280 }}>
            <table>
              <thead style={{ position: "sticky", top: 0, background: "var(--navy-800)" }}>
                <tr style={{ borderBottom: "1px solid rgba(100,255,218,0.08)" }}>
                  {["তারিখ", "গাড়ি", "ট্রিপ", "আয়", "লাভ"].map((h, i) => (
                    <th key={h} style={{ padding: "0 8px 12px", textAlign: i > 2 ? "right" : "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fDaily.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "10px 8px", color: "var(--text-secondary)", fontSize: 12 }}>{dateStr(r.date)}</td>
                    <td style={{ padding: "10px 8px", color: "var(--text-primary)", fontSize: 12, textAlign: "center" }}>{r.carCount}</td>
                    <td style={{ padding: "10px 8px", color: "var(--text-primary)", fontSize: 12, textAlign: "center" }}>{r.tripCount}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "var(--green-400)", fontWeight: 700 }}>{BDT(r.totalIncome)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: r.netProfit >= 0 ? "var(--green-300)" : "var(--danger)" }}>{BDT(r.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── Settings ───────────────────────────────────────────────────────────── */
function SettingsPage({ data, setData }) {
  const { settings } = data;
  const [tripRate, setTripRate] = useState(settings.tripRate);
  const [carRate, setCarRate] = useState(settings.carRate);
  const [companyName, setCompanyName] = useState(settings.companyName || "New M.H. Transport");

  const save = () => {
    const s = { tripRate: Number(tripRate), carRate: Number(carRate), companyName };
    setData(p => { const n = { ...p, settings: s }; LS.set("mht_settings", s); return n; });
    alert("✅ সেটিংস সেভ হয়েছে!");
  };

  const exportAll = () => {
    const a = document.createElement("a"); a.href = "data:application/json," + encodeURIComponent(JSON.stringify(data, null, 2)); a.download = "mh-transport-backup.json"; a.click();
  };

  const importAll = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        Object.entries(d).forEach(([k, v]) => LS.set(`mht_${k}`, v));
        setData(d); alert("✅ ডেটা আমদানি সফল!");
      } catch { alert("❌ ফাইল ফরম্যাট ভুল।"); }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (!confirm("⚠️ সমস্ত ডেটা মুছে ফেলতে চান? এটি ফেরানো যাবে না!")) return;
    ["mht_daily", "mht_staff", "mht_expenses", "mht_salaries", "mht_tasks"].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="fade-up">
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>সেটিংস</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>অ্যাপ কনফিগারেশন ও ডেটা ব্যবস্থাপনা</p>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <Card className="fade-up-1" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)", marginBottom: 18 }}>⚙️ ব্যবসায়িক সেটিংস</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="প্রতিষ্ঠানের নাম" value={companyName} onChange={setCompanyName} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="ট্রিপ রেট (৳/ট্রিপ)" type="number" min="0" value={tripRate} onChange={setTripRate} />
              <Field label="গাড়ি রেট (৳/গাড়ি)" type="number" min="0" value={carRate} onChange={setCarRate} />
            </div>
            <div><Btn onClick={save} icon={<I.Save />}>সেটিংস সেভ করুন</Btn></div>
          </div>
        </Card>

        <Card className="fade-up-2" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "var(--green-300)", marginBottom: 18 }}>💾 ডেটা ব্যবস্থাপনা</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn v="ghost" onClick={exportAll} icon={<I.Dl />} full>সব ডেটা ব্যাকআপ (JSON)</Btn>
            <label style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(100,255,218,0.25)", color: "var(--green-500)", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.18s", background: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.12)"}
                onMouseLeave={e => e.currentTarget.style.filter = ""}>
                <I.Ul /> ডেটা পুনরুদ্ধার করুন
              </div>
              <input type="file" accept=".json" onChange={importAll} style={{ display: "none" }} />
            </label>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,107,107,0.15)" }}>
            <p style={{ fontSize: 12, color: "var(--danger)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><I.Warn /> বিপজ্জনক এলাকা</p>
            <Btn v="danger" onClick={clearAll} full>সমস্ত ডেটা মুছুন</Btn>
          </div>
        </Card>

        <Card className="fade-up-3" style={{ padding: 20, background: "rgba(15,186,129,0.04)", borderColor: "rgba(15,186,129,0.1)" }}>
          <h3 style={{ fontWeight: 700, fontSize: 13, color: "var(--green-300)", marginBottom: 12 }}>💡 ব্যবহারের নির্দেশিকা</h3>
          <ul style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 2, listStylePosition: "inside" }}>
            {["ডেটা আপনার ব্রাউজারের localStorage-এ সংরক্ষিত হয়।", "নিয়মিত JSON ব্যাকআপ নিন — ডেটা হারানো রোধ করুন।", "ব্রাউজার ক্যাশ পরিষ্কার করলে ডেটা মুছে যেতে পারে।", "Vercel / Netlify-তে বিনামূল্যে হোস্ট করা যায়।"].map((t, i) => (
              <li key={i}>✦ {t}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LAYOUT & ROUTER
   ════════════════════════════════════════════════════════════════════════════ */
const NAV = [
  { id: "dashboard", label: "ড্যাশবোর্ড", Icon: I.Home },
  { id: "daily",     label: "দৈনিক এন্ট্রি", Icon: I.Daily },
  { id: "staff",     label: "স্টাফ ও বেতন", Icon: I.Staff },
  { id: "expenses",  label: "খরচ ট্র্যাকার", Icon: I.Expense },
  { id: "tasks",     label: "কাজের তালিকা", Icon: I.Task },
  { id: "reports",   label: "রিপোর্ট",       Icon: I.Report },
  { id: "settings",  label: "সেটিংস",        Icon: I.Gear },
];

export default function App() {
  const [data, setData] = useState(initData);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const props = { data, setData };
  const pages = { dashboard: <Dashboard {...props} />, daily: <DailyEntry {...props} />, staff: <StaffSalary {...props} />, expenses: <ExpenseTracker {...props} />, tasks: <TaskManagement {...props} />, reports: <Reports {...props} />, settings: <SettingsPage {...props} /> };

  const goto = id => { setPage(id); setSidebarOpen(false); };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--navy-950)" }}>

        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(2,12,27,0.7)", zIndex: 40, backdropFilter: "blur(4px)" }}
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside style={{
          position: "fixed", top: 0, left: 0, height: "100%", width: 230, zIndex: 50,
          background: "linear-gradient(180deg, var(--navy-900) 0%, var(--navy-950) 100%)",
          borderRight: "1px solid rgba(100,255,218,0.07)",
          display: "flex", flexDirection: "column",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: sidebarOpen ? "4px 0 40px rgba(2,12,27,0.8)" : "none",
        }}>
          {/* Brand */}
          <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(100,255,218,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,var(--green-500),#0d9e6e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#020c1b", boxShadow: "0 4px 16px rgba(15,186,129,0.3)", animation: "pulse-green 3s ease infinite" }}>
                <I.Truck />
              </div>
              <div>
                <p style={{ fontWeight: 900, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.2 }}>{data.settings.companyName || "M.H. Transport"}</p>
                <p style={{ fontSize: 11, color: "var(--green-500)", fontWeight: 600, letterSpacing: "0.05em" }}>ম্যানেজমেন্ট সিস্টেম</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
            {NAV.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => goto(id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, marginBottom: 3,
                background: page === id ? "rgba(15,186,129,0.12)" : "transparent",
                border: page === id ? "1px solid rgba(15,186,129,0.2)" : "1px solid transparent",
                color: page === id ? "var(--green-300)" : "var(--text-secondary)",
                fontWeight: page === id ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.15s", textAlign: "left",
              }}
                onMouseEnter={e => { if (page !== id) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
                onMouseLeave={e => { if (page !== id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}>
                {page === id && <span style={{ position: "absolute", left: 10, width: 3, height: 22, background: "var(--green-500)", borderRadius: 2 }} />}
                <Icon />
                {label}
              </button>
            ))}
          </nav>

          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(100,255,218,0.06)" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>v2.0 · ব্যক্তিগত ব্যবহার</p>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header */}
          <header style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "rgba(10,25,47,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(100,255,218,0.07)", boxShadow: "0 2px 20px rgba(2,12,27,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={() => setSidebarOpen(true)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(100,255,218,0.1)", color: "var(--text-secondary)", cursor: "pointer", padding: 9, display: "flex", borderRadius: 10, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green-500)"; e.currentTarget.style.color = "var(--green-400)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,255,218,0.1)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                <I.Menu />
              </button>
              <div>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{NAV.find(n => n.id === page)?.label}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-500)", display: "inline-block", animation: "pulse-green 2s ease infinite" }} />
              {new Date().toLocaleDateString("bn-BD", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </header>

          {/* Page Content */}
          <main style={{ flex: 1, padding: "24px 20px", maxWidth: 960, width: "100%", margin: "0 auto" }}>
            {pages[page]}
          </main>
        </div>
      </div>
    </>
  );
}
