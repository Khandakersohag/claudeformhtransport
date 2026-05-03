import { useState, useEffect, useMemo, useCallback } from "react";

// ─── Utility helpers ───────────────────────────────────────────────────────
const BDT = (n) => `৳${Number(n || 0).toLocaleString("bn-BD")}`;
const dateStr = (ts) => new Date(ts).toLocaleDateString("bn-BD", { day: "2-digit", month: "short", year: "numeric" });
const todayISO = () => new Date().toISOString().split("T")[0];
const tsFromISO = (s) => new Date(s).getTime();

// ─── LocalStorage persistence ──────────────────────────────────────────────
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const initData = () => ({
  settings: LS.get("mht_settings", { tripRate: 240, carRate: 10, companyName: "New M.H. Transport" }),
  dailyRecords: LS.get("mht_daily", []),
  staff: LS.get("mht_staff", []),
  expenses: LS.get("mht_expenses", []),
  salaries: LS.get("mht_salaries", []),
  tasks: LS.get("mht_tasks", []),
  attendance: LS.get("mht_attendance", {}),
});

// ─── Icons (inline SVG components) ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = "currentColor", fill = "none", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const Icons = {
  Dashboard: () => <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />,
  Daily: () => <Icon d="M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01" />,
  Staff: () => <Icon d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"]} />,
  Expense: () => <Icon d={["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]} />,
  Report: () => <Icon d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"]} />,
  Task: () => <Icon d={["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"]} />,
  Settings: () => <Icon d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"]} />,
  Truck: () => <Icon d={["M1 3h15v13H1z", "M16 8h4l3 3v5h-7V8z", "M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", "M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"]} />,
  Plus: () => <Icon d={["M12 5v14", "M5 12h14"]} />,
  Trash: () => <Icon d={["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"]} />,
  Edit: () => <Icon d={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]} />,
  Save: () => <Icon d={["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", "M17 21v-8H7v8", "M7 3v5h8"]} />,
  X: () => <Icon d={["M18 6 6 18", "M6 6l12 12"]} />,
  Check: () => <Icon d="M20 6 9 17l-5-5" />,
  TrendUp: () => <Icon d={["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"]} />,
  TrendDown: () => <Icon d={["M23 18l-9.5-9.5-5 5L1 6", "M17 18h6v-6"]} />,
  Salary: () => <Icon d={["M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z", "M7 7h.01"]} />,
  Menu: () => <Icon d={["M3 12h18", "M3 6h18", "M3 18h18"]} />,
  Download: () => <Icon d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"]} />,
  Upload: () => <Icon d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"]} />,
  Alert: () => <Icon d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"]} />,
};

// ─── Expense categories ─────────────────────────────────────────────────────
const EXPENSE_CATS = ["Fuel", "Servicing", "Staff Salary", "Office", "Police", "Welfare", "Misc"];
const TASK_PRIORITIES = ["low", "medium", "high"];
const TASK_STATUSES = ["pending", "in-progress", "completed", "cancelled"];

// ─── Shared UI primitives ───────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`} style={{ boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)" }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", icon, disabled, className = "", type = "button" }) => {
  const base = "inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-150 cursor-pointer select-none";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary: "bg-[#001f3f] text-white hover:bg-[#002a57] active:scale-95",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 active:scale-95",
    success: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95",
    ghost: "text-slate-600 hover:bg-slate-100 active:scale-95",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder, min, step, required, className = "" }) => (
  <label className={`flex flex-col gap-1 ${className}`}>
    {label && <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} step={step} required={required}
      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001f3f]/20 focus:border-[#001f3f] transition bg-white"
    />
  </label>
);

const Select = ({ label, value, onChange, options, className = "" }) => (
  <label className={`flex flex-col gap-1 ${className}`}>
    {label && <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>}
    <select value={value} onChange={e => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001f3f]/20 focus:border-[#001f3f] transition bg-white">
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </label>
);

const Badge = ({ children, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${colors[color]}`}>{children}</span>;
};

const Modal = ({ open, onClose, title, children, width = "max-w-lg" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Icons.X /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ─── Stat card ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: IconComp, positive }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${positive === undefined ? "bg-slate-100 text-slate-600" : positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
        <IconComp />
      </div>
      {sub !== undefined && (
        <span className={`text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>{sub}</span>
      )}
    </div>
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
    <p className="text-xl font-black text-slate-800">{value}</p>
  </Card>
);

// ═══════════════════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════════════════

// ─── Dashboard ─────────────────────────────────────────────────────────────
function Dashboard({ data }) {
  const { dailyRecords, expenses, staff, tasks } = data;

  const totalIncome = useMemo(() => dailyRecords.reduce((a, r) => a + (r.totalIncome || 0), 0), [dailyRecords]);
  const totalExpenses = useMemo(() => {
    const daily = dailyRecords.reduce((a, r) => a + (r.totalExpense || 0), 0);
    const misc = expenses.reduce((a, e) => a + (e.amount || 0), 0);
    return daily + misc;
  }, [dailyRecords, expenses]);
  const balance = totalIncome - totalExpenses;
  const activeStaff = staff.filter(s => s.isActive).length;
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in-progress").length;

  const recent = useMemo(() => {
    const rows = [
      ...dailyRecords.map(r => ({ date: r.date, desc: `দৈনিক এন্ট্রি (${r.carCount} গাড়ি, ${r.tripCount} ট্রিপ)`, cat: "আয়", amount: r.totalIncome, pos: true })),
      ...expenses.map(e => ({ date: e.date, desc: e.description, cat: e.category, amount: e.amount, pos: false })),
    ].sort((a, b) => b.date - a.date);
    return rows.slice(0, 8);
  }, [dailyRecords, expenses]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">ব্যবসায়িক সারসংক্ষেপ</h2>
        <p className="text-slate-400 text-sm">সর্বশেষ এন্ট্রিসমূহের উপর ভিত্তি করে</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="মোট আয়" value={BDT(totalIncome)} positive={true} icon={Icons.TrendUp} />
        <StatCard label="মোট খরচ" value={BDT(totalExpenses)} positive={false} icon={Icons.TrendDown} />
        <StatCard label="নেট ব্যালেন্স" value={BDT(balance)} positive={balance >= 0} icon={Icons.Truck} />
        <StatCard label="সক্রিয় স্টাফ" value={`${activeStaff} জন`} icon={Icons.Staff} sub={`${pendingTasks} কাজ বাকি`} positive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold text-slate-700 mb-4">সাম্প্রতিক লেনদেন</h3>
          {recent.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">কোনো ডেটা নেই। প্রথমে দৈনিক এন্ট্রি যোগ করুন।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-100">
                  <th className="pb-3 text-left">তারিখ</th>
                  <th className="pb-3 text-left">বিবরণ</th>
                  <th className="pb-3 text-left">ধরন</th>
                  <th className="pb-3 text-right">পরিমাণ</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {recent.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 text-slate-500 whitespace-nowrap">{dateStr(r.date)}</td>
                      <td className="py-3 text-slate-700 max-w-[180px] truncate">{r.desc}</td>
                      <td className="py-3"><Badge color={r.pos ? "green" : "amber"}>{r.cat}</Badge></td>
                      <td className={`py-3 text-right font-bold font-mono ${r.pos ? "text-emerald-600" : "text-red-500"}`}>
                        {r.pos ? "+" : "-"}{BDT(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5 bg-[#001f3f] text-white">
            <div className="flex items-center gap-2 mb-4">
              <Icons.Truck />
              <h3 className="font-bold">অপারেশনাল ভলিউম</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">মোট গাড়ি চেক</span>
                <span className="font-bold">{dailyRecords.reduce((a, r) => a + (r.carCount || 0), 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">মোট ট্রিপ</span>
                <span className="font-bold">{dailyRecords.reduce((a, r) => a + (r.tripCount || 0), 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">মোট দিন</span>
                <span className="font-bold">{dailyRecords.length} দিন</span>
              </div>
              {totalIncome > 0 && (
                <div className="pt-3 border-t border-white/10 text-xs text-white/50">
                  গড় দৈনিক আয়: {BDT(Math.round(totalIncome / (dailyRecords.length || 1)))}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-slate-700 mb-3">ব্যয় অনুপাত</h3>
            <div className="space-y-2">
              {totalIncome > 0 ? (
                <>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>ব্যয় / আয়</span>
                    <span className="font-bold">{((totalExpenses / totalIncome) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#001f3f] rounded-full transition-all" style={{ width: `${Math.min((totalExpenses / totalIncome) * 100, 100)}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">নেট মার্জিন: {((balance / totalIncome) * 100).toFixed(1)}%</p>
                </>
              ) : <p className="text-xs text-slate-400">ডেটা নেই</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Daily Entry ────────────────────────────────────────────────────────────
function DailyEntry({ data, setData }) {
  const { settings, dailyRecords } = data;
  const [date, setDate] = useState(todayISO());
  const [carCount, setCarCount] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [editId, setEditId] = useState(null);

  // New expense fields
  const [expCat, setExpCat] = useState(EXPENSE_CATS[0]);
  const [expAmt, setExpAmt] = useState("");
  const [expDesc, setExpDesc] = useState("");

  const totalIncome = (carCount * settings.carRate) + (tripCount * settings.tripRate);
  const totalExpense = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
  const netProfit = totalIncome - totalExpense;

  const loadRecord = (rec) => {
    setDate(new Date(rec.date).toISOString().split("T")[0]);
    setCarCount(rec.carCount);
    setTripCount(rec.tripCount);
    setExpenses(rec.expenses || []);
    setEditId(rec.id);
  };

  const resetForm = () => {
    setDate(todayISO()); setCarCount(0); setTripCount(0);
    setExpenses([]); setEditId(null);
  };

  const addExpense = () => {
    if (!expAmt || Number(expAmt) <= 0) return;
    setExpenses(prev => [...prev, { category: expCat, amount: Number(expAmt), description: expDesc || expCat }]);
    setExpAmt(""); setExpDesc("");
  };

  const removeExpense = (i) => setExpenses(prev => prev.filter((_, idx) => idx !== i));

  const save = () => {
    const rec = {
      id: editId || Date.now().toString(),
      date: tsFromISO(date), carCount: Number(carCount), tripCount: Number(tripCount),
      expenses, totalIncome, totalExpense, netProfit, createdAt: Date.now(),
    };
    let records;
    if (editId) {
      records = dailyRecords.map(r => r.id === editId ? rec : r);
    } else {
      records = [rec, ...dailyRecords];
    }
    setData(prev => { const n = { ...prev, dailyRecords: records }; LS.set("mht_daily", records); return n; });
    resetForm();
  };

  const deleteRecord = (id) => {
    const records = dailyRecords.filter(r => r.id !== id);
    setData(prev => { const n = { ...prev, dailyRecords: records }; LS.set("mht_daily", records); return n; });
    if (editId === id) resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">দৈনিক এন্ট্রি</h2>
          <p className="text-slate-400 text-sm">প্রতিদিনের আয় ও খরচ রেকর্ড করুন</p>
        </div>
        {editId && <Btn variant="secondary" onClick={resetForm} icon={<Icons.X />}>বাতিল</Btn>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-5 space-y-4">
          <h3 className="font-bold text-slate-700">{editId ? "রেকর্ড সম্পাদনা" : "নতুন এন্ট্রি"}</h3>
          <Input label="তারিখ" type="date" value={date} onChange={setDate} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={`গাড়ি (৳${settings.carRate}/টি)`} type="number" min="0" value={carCount} onChange={v => setCarCount(Number(v))} />
            <Input label={`ট্রিপ (৳${settings.tripRate}/টি)`} type="number" min="0" value={tripCount} onChange={v => setTripCount(Number(v))} />
          </div>

          <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">মোট আয়</span><span className="font-bold text-emerald-600">{BDT(totalIncome)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">মোট খরচ</span><span className="font-bold text-red-500">{BDT(totalExpense)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 mt-1"><span className="font-bold">নেট লাভ</span><span className={`font-black ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{BDT(netProfit)}</span></div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">খরচ যোগ করুন</p>
            <Select value={expCat} onChange={setExpCat} options={EXPENSE_CATS} />
            <div className="flex gap-2">
              <Input placeholder="পরিমাণ" type="number" min="0" value={expAmt} onChange={setExpAmt} className="flex-1" />
              <Input placeholder="বিবরণ" value={expDesc} onChange={setExpDesc} className="flex-1" />
            </div>
            <Btn onClick={addExpense} variant="secondary" size="sm" icon={<Icons.Plus />}>যোগ করুন</Btn>
          </div>

          {expenses.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {expenses.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-xs rounded-lg bg-slate-50 px-3 py-2">
                  <div><span className="font-semibold text-slate-600">{e.category}</span> <span className="text-slate-400">— {e.description}</span></div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-500">{BDT(e.amount)}</span>
                    <button onClick={() => removeExpense(i)} className="text-slate-400 hover:text-red-500"><Icons.X /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Btn onClick={save} icon={<Icons.Save />} className="w-full justify-center">
            {editId ? "আপডেট করুন" : "সেভ করুন"}
          </Btn>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold text-slate-700 mb-4">রেকর্ড ইতিহাস</h3>
          {dailyRecords.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">কোনো রেকর্ড নেই</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-100">
                  <th className="pb-3 text-left">তারিখ</th>
                  <th className="pb-3 text-center">গাড়ি</th>
                  <th className="pb-3 text-center">ট্রিপ</th>
                  <th className="pb-3 text-right">আয়</th>
                  <th className="pb-3 text-right">খরচ</th>
                  <th className="pb-3 text-right">লাভ</th>
                  <th className="pb-3" />
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {dailyRecords.map(r => (
                    <tr key={r.id} className={`hover:bg-slate-50/60 transition ${editId === r.id ? "bg-blue-50/50" : ""}`}>
                      <td className="py-3 text-slate-600 whitespace-nowrap">{dateStr(r.date)}</td>
                      <td className="py-3 text-center">{r.carCount}</td>
                      <td className="py-3 text-center">{r.tripCount}</td>
                      <td className="py-3 text-right font-mono text-emerald-600">{BDT(r.totalIncome)}</td>
                      <td className="py-3 text-right font-mono text-red-500">{BDT(r.totalExpense)}</td>
                      <td className={`py-3 text-right font-bold font-mono ${r.netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{BDT(r.netProfit)}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button onClick={() => loadRecord(r)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"><Icons.Edit /></button>
                          <button onClick={() => deleteRecord(r.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500"><Icons.Trash /></button>
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

// ─── Staff Salary ───────────────────────────────────────────────────────────
function StaffSalary({ data, setData }) {
  const { staff, salaries } = data;
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showPaySalary, setShowPaySalary] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Staff form
  const [sName, setSName] = useState(""); const [sPos, setSPos] = useState(""); const [sRate, setSRate] = useState("");

  // Salary form
  const [salStartDate, setSalStartDate] = useState(todayISO());
  const [salEndDate, setSalEndDate] = useState(todayISO());
  const [salPaid, setSalPaid] = useState("");

  const addStaff = () => {
    if (!sName || !sRate) return;
    const s = { id: Date.now().toString(), name: sName, position: sPos, dailyRate: Number(sRate), isActive: true, points: 100 };
    const list = [...staff, s]; setData(prev => { const n = { ...prev, staff: list }; LS.set("mht_staff", list); return n; });
    setSName(""); setSPos(""); setSRate(""); setShowAddStaff(false);
  };

  const toggleActive = (id) => {
    const list = staff.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    setData(prev => { const n = { ...prev, staff: list }; LS.set("mht_staff", list); return n; });
  };

  const deleteStaff = (id) => {
    const list = staff.filter(s => s.id !== id);
    setData(prev => { const n = { ...prev, staff: list }; LS.set("mht_staff", list); return n; });
  };

  const openPaySalary = (s) => { setSelectedStaff(s); setSalStartDate(todayISO()); setSalEndDate(todayISO()); setSalPaid(""); setShowPaySalary(true); };

  const paySalary = () => {
    if (!selectedStaff || !salPaid) return;
    const days = Math.ceil((tsFromISO(salEndDate) - tsFromISO(salStartDate)) / 86400000) + 1;
    const actual = days * selectedStaff.dailyRate;
    const paid = Number(salPaid);
    const sal = {
      id: Date.now().toString(), staffId: selectedStaff.id, staffName: selectedStaff.name,
      startDate: tsFromISO(salStartDate), endDate: tsFromISO(salEndDate),
      totalDays: days, actualSalary: actual, paidAmount: paid, dueAmount: actual - paid, paidDate: Date.now(),
    };
    const list = [...salaries, sal]; setData(prev => { const n = { ...prev, salaries: list }; LS.set("mht_salaries", list); return n; });
    setShowPaySalary(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-slate-800">স্টাফ ও বেতন</h2><p className="text-slate-400 text-sm">কর্মীদের তথ্য ও বেতন ব্যবস্থাপনা</p></div>
        <Btn onClick={() => setShowAddStaff(true)} icon={<Icons.Plus />}>নতুন স্টাফ</Btn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-bold text-slate-700 mb-4">স্টাফ তালিকা</h3>
          {staff.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">কোনো স্টাফ নেই</p> : (
            <div className="space-y-3">
              {staff.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${s.isActive ? "bg-[#001f3f] text-white" : "bg-slate-200 text-slate-500"}`}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.position || "কর্মী"} · {BDT(s.dailyRate)}/দিন</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={s.isActive ? "green" : "slate"}>{s.isActive ? "সক্রিয়" : "অসক্রিয়"}</Badge>
                    <Btn size="sm" variant="success" onClick={() => openPaySalary(s)}>বেতন</Btn>
                    <button onClick={() => toggleActive(s.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 text-xs">{s.isActive ? "বন্ধ" : "চালু"}</button>
                    <button onClick={() => deleteStaff(s.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500"><Icons.Trash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-700 mb-4">বেতন রেকর্ড</h3>
          {salaries.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">কোনো বেতন রেকর্ড নেই</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-100">
                  <th className="pb-3 text-left">নাম</th>
                  <th className="pb-3 text-center">দিন</th>
                  <th className="pb-3 text-right">প্রাপ্য</th>
                  <th className="pb-3 text-right">প্রদত্ত</th>
                  <th className="pb-3 text-right">বাকি</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {salaries.slice().reverse().map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-semibold text-slate-700">{s.staffName}</td>
                      <td className="py-3 text-center text-slate-500">{s.totalDays}</td>
                      <td className="py-3 text-right font-mono">{BDT(s.actualSalary)}</td>
                      <td className="py-3 text-right font-mono text-emerald-600">{BDT(s.paidAmount)}</td>
                      <td className={`py-3 text-right font-bold font-mono ${s.dueAmount > 0 ? "text-red-500" : "text-emerald-600"}`}>{BDT(s.dueAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={showAddStaff} onClose={() => setShowAddStaff(false)} title="নতুন স্টাফ যোগ করুন">
        <div className="space-y-4">
          <Input label="নাম" value={sName} onChange={setSName} placeholder="স্টাফের নাম" />
          <Input label="পদবি" value={sPos} onChange={setSPos} placeholder="ড্রাইভার / হেল্পার / ম্যানেজার" />
          <Input label="দৈনিক রেট (৳)" type="number" min="0" value={sRate} onChange={setSRate} placeholder="500" />
          <div className="flex gap-3 pt-2">
            <Btn onClick={addStaff} className="flex-1 justify-center" icon={<Icons.Save />}>সেভ করুন</Btn>
            <Btn variant="secondary" onClick={() => setShowAddStaff(false)} className="flex-1 justify-center">বাতিল</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={showPaySalary} onClose={() => setShowPaySalary(false)} title={`বেতন প্রদান — ${selectedStaff?.name}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="শুরুর তারিখ" type="date" value={salStartDate} onChange={setSalStartDate} />
            <Input label="শেষ তারিখ" type="date" value={salEndDate} onChange={setSalEndDate} />
          </div>
          {salStartDate && salEndDate && (
            <div className="rounded-xl bg-slate-50 p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">মোট দিন</span><span className="font-bold">{Math.max(0, Math.ceil((tsFromISO(salEndDate) - tsFromISO(salStartDate)) / 86400000) + 1)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">দৈনিক রেট</span><span className="font-bold">{BDT(selectedStaff?.dailyRate)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-1"><span className="font-bold">প্রাপ্য বেতন</span>
                <span className="font-black text-emerald-600">{BDT(Math.max(0, Math.ceil((tsFromISO(salEndDate) - tsFromISO(salStartDate)) / 86400000) + 1) * (selectedStaff?.dailyRate || 0))}</span>
              </div>
            </div>
          )}
          <Input label="প্রদত্ত পরিমাণ (৳)" type="number" min="0" value={salPaid} onChange={setSalPaid} placeholder="0" />
          <div className="flex gap-3 pt-2">
            <Btn onClick={paySalary} className="flex-1 justify-center" icon={<Icons.Check />}>বেতন দিন</Btn>
            <Btn variant="secondary" onClick={() => setShowPaySalary(false)} className="flex-1 justify-center">বাতিল</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Expense Tracker ────────────────────────────────────────────────────────
function ExpenseTracker({ data, setData }) {
  const { expenses } = data;
  const [showAdd, setShowAdd] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [cat, setCat] = useState(EXPENSE_CATS[0]);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [filterCat, setFilterCat] = useState("সব");

  const addExpense = () => {
    if (!amount || Number(amount) <= 0) return;
    const exp = { id: Date.now().toString(), date: tsFromISO(date), category: cat, amount: Number(amount), description: desc || cat, isRecurring };
    const list = [exp, ...expenses]; setData(prev => { const n = { ...prev, expenses: list }; LS.set("mht_expenses", list); return n; });
    setAmount(""); setDesc(""); setShowAdd(false);
  };

  const deleteExpense = (id) => {
    const list = expenses.filter(e => e.id !== id); setData(prev => { const n = { ...prev, expenses: list }; LS.set("mht_expenses", list); return n; });
  };

  const filtered = filterCat === "সব" ? expenses : expenses.filter(e => e.category === filterCat);
  const total = filtered.reduce((a, e) => a + e.amount, 0);

  const byCat = useMemo(() => {
    const m = {}; expenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; }); return m;
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-slate-800">খরচ ট্র্যাকার</h2><p className="text-slate-400 text-sm">বিবিধ ব্যয় পর্যবেক্ষণ</p></div>
        <Btn onClick={() => setShowAdd(true)} icon={<Icons.Plus />}>নতুন খরচ</Btn>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(byCat).map(([c, a]) => (
          <Card key={c} className="p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{c}</p>
            <p className="text-lg font-black text-slate-800">{BDT(a)}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-700">খরচের তালিকা · <span className="text-emerald-600">{BDT(total)}</span></h3>
          <div className="flex gap-2">
            {["সব", ...EXPENSE_CATS].map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${filterCat === c ? "bg-[#001f3f] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">কোনো খরচ নেই</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-100">
                <th className="pb-3 text-left">তারিখ</th>
                <th className="pb-3 text-left">ক্যাটাগরি</th>
                <th className="pb-3 text-left">বিবরণ</th>
                <th className="pb-3 text-right">পরিমাণ</th>
                <th className="pb-3" />
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="py-3 text-slate-500 whitespace-nowrap">{dateStr(e.date)}</td>
                    <td className="py-3"><Badge color="amber">{e.category}</Badge></td>
                    <td className="py-3 text-slate-700">{e.description} {e.isRecurring && <Badge color="blue">নিয়মিত</Badge>}</td>
                    <td className="py-3 text-right font-bold font-mono text-red-500">{BDT(e.amount)}</td>
                    <td className="py-3"><button onClick={() => deleteExpense(e.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500"><Icons.Trash /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="নতুন খরচ যোগ করুন">
        <div className="space-y-4">
          <Input label="তারিখ" type="date" value={date} onChange={setDate} />
          <Select label="ক্যাটাগরি" value={cat} onChange={setCat} options={EXPENSE_CATS} />
          <Input label="পরিমাণ (৳)" type="number" min="0" value={amount} onChange={setAmount} placeholder="0" />
          <Input label="বিবরণ" value={desc} onChange={setDesc} placeholder="খরচের বিবরণ" />
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded" />
            নিয়মিত খরচ (Recurring)
          </label>
          <div className="flex gap-3 pt-2">
            <Btn onClick={addExpense} className="flex-1 justify-center" icon={<Icons.Save />}>যোগ করুন</Btn>
            <Btn variant="secondary" onClick={() => setShowAdd(false)} className="flex-1 justify-center">বাতিল</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Task Management ────────────────────────────────────────────────────────
function TaskManagement({ data, setData }) {
  const { tasks, staff } = data;
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("medium"); const [dueDate, setDueDate] = useState(todayISO());
  const [assignedTo, setAssignedTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("সব");

  const addTask = () => {
    if (!title) return;
    const t = { id: Date.now().toString(), title, description: desc, status: "pending", priority, dueDate: tsFromISO(dueDate), createdAt: Date.now(), assignedTo };
    const list = [t, ...tasks]; setData(prev => { const n = { ...prev, tasks: list }; LS.set("mht_tasks", list); return n; });
    setTitle(""); setDesc(""); setPriority("medium"); setDueDate(todayISO()); setAssignedTo(""); setShowAdd(false);
  };

  const updateStatus = (id, status) => {
    const list = tasks.map(t => t.id === id ? { ...t, status } : t);
    setData(prev => { const n = { ...prev, tasks: list }; LS.set("mht_tasks", list); return n; });
  };

  const deleteTask = (id) => {
    const list = tasks.filter(t => t.id !== id); setData(prev => { const n = { ...prev, tasks: list }; LS.set("mht_tasks", list); return n; });
  };

  const filtered = filterStatus === "সব" ? tasks : tasks.filter(t => t.status === filterStatus);

  const priorColor = { low: "green", medium: "amber", high: "red" };
  const statusColor = { pending: "slate", "in-progress": "blue", completed: "green", cancelled: "red" };
  const statusLabel = { pending: "বাকি", "in-progress": "চলছে", completed: "সম্পন্ন", cancelled: "বাতিল" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-slate-800">কাজের তালিকা</h2><p className="text-slate-400 text-sm">অপারেশনাল টাস্ক ম্যানেজমেন্ট</p></div>
        <Btn onClick={() => setShowAdd(true)} icon={<Icons.Plus />}>নতুন কাজ</Btn>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["সব", ...TASK_STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterStatus === s ? "bg-[#001f3f] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {s === "সব" ? "সব" : statusLabel[s]} ({s === "সব" ? tasks.length : tasks.filter(t => t.status === s).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400 text-sm">কোনো কাজ নেই</div>
        ) : filtered.map(t => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge color={priorColor[t.priority]}>{t.priority}</Badge>
                <Badge color={statusColor[t.status]}>{statusLabel[t.status]}</Badge>
              </div>
              <button onClick={() => deleteTask(t.id)} className="p-1 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500"><Icons.Trash /></button>
            </div>
            <h4 className="font-bold text-slate-800 mb-1">{t.title}</h4>
            {t.description && <p className="text-sm text-slate-500 mb-3">{t.description}</p>}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">শেষ তারিখ: {dateStr(t.dueDate)}</p>
              {t.assignedTo && <p className="text-xs text-slate-500">👤 {staff.find(s => s.id === t.assignedTo)?.name || t.assignedTo}</p>}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {TASK_STATUSES.filter(s => s !== t.status).map(s => (
                <button key={s} onClick={() => updateStatus(t.id, s)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                  {statusLabel[s]}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="নতুন কাজ যোগ করুন">
        <div className="space-y-4">
          <Input label="শিরোনাম" value={title} onChange={setTitle} placeholder="কাজের শিরোনাম" />
          <Input label="বিবরণ" value={desc} onChange={setDesc} placeholder="বিস্তারিত বিবরণ" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="অগ্রাধিকার" value={priority} onChange={setPriority} options={TASK_PRIORITIES.map(p => ({ value: p, label: p }))} />
            <Input label="শেষ তারিখ" type="date" value={dueDate} onChange={setDueDate} />
          </div>
          {staff.length > 0 && (
            <Select label="দায়িত্বপ্রাপ্ত স্টাফ" value={assignedTo} onChange={setAssignedTo}
              options={[{ value: "", label: "— নির্বাচন করুন —" }, ...staff.map(s => ({ value: s.id, label: s.name }))]} />
          )}
          <div className="flex gap-3 pt-2">
            <Btn onClick={addTask} className="flex-1 justify-center" icon={<Icons.Save />}>যোগ করুন</Btn>
            <Btn variant="secondary" onClick={() => setShowAdd(false)} className="flex-1 justify-center">বাতিল</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Reports ────────────────────────────────────────────────────────────────
function Reports({ data }) {
  const { dailyRecords, expenses, salaries, staff } = data;
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [to, setTo] = useState(todayISO());

  const fromTs = tsFromISO(from); const toTs = tsFromISO(to) + 86399999;

  const filteredDaily = dailyRecords.filter(r => r.date >= fromTs && r.date <= toTs);
  const filteredExp = expenses.filter(e => e.date >= fromTs && e.date <= toTs);
  const filteredSal = salaries.filter(s => s.paidDate >= fromTs && s.paidDate <= toTs);

  const totalIncome = filteredDaily.reduce((a, r) => a + r.totalIncome, 0);
  const totalDailyExp = filteredDaily.reduce((a, r) => a + r.totalExpense, 0);
  const totalMiscExp = filteredExp.reduce((a, e) => a + e.amount, 0);
  const totalSal = filteredSal.reduce((a, s) => a + s.paidAmount, 0);
  const totalExpenses = totalDailyExp + totalMiscExp;
  const netProfit = totalIncome - totalExpenses;

  const expByCat = {};
  filteredExp.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount; });
  filteredDaily.forEach(r => r.expenses?.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount; }));

  const exportCSV = () => {
    const rows = [
      ["তারিখ", "গাড়ি", "ট্রিপ", "আয়", "খরচ", "লাভ"],
      ...filteredDaily.map(r => [dateStr(r.date), r.carCount, r.tripCount, r.totalIncome, r.totalExpense, r.netProfit]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `mh-transport-report-${from}-${to}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-xl font-black text-slate-800">রিপোর্ট</h2><p className="text-slate-400 text-sm">নির্দিষ্ট সময়কালের প্রতিবেদন</p></div>
        <Btn onClick={exportCSV} variant="secondary" icon={<Icons.Download />} size="sm">CSV রপ্তানি</Btn>
      </div>

      <Card className="p-5">
        <div className="flex gap-4 flex-wrap">
          <Input label="শুরুর তারিখ" type="date" value={from} onChange={setFrom} />
          <Input label="শেষ তারিখ" type="date" value={to} onChange={setTo} />
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="মোট আয়" value={BDT(totalIncome)} positive={true} icon={Icons.TrendUp} />
        <StatCard label="মোট খরচ" value={BDT(totalExpenses)} positive={false} icon={Icons.TrendDown} />
        <StatCard label="নেট লাভ" value={BDT(netProfit)} positive={netProfit >= 0} icon={Icons.Truck} />
        <StatCard label="বেতন প্রদান" value={BDT(totalSal)} icon={Icons.Salary} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-bold text-slate-700 mb-4">ক্যাটাগরি অনুযায়ী খরচ</h3>
          {Object.keys(expByCat).length === 0 ? <p className="text-slate-400 text-sm text-center py-6">কোনো তথ্য নেই</p> : (
            <div className="space-y-3">
              {Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{cat}</span>
                    <span className="font-bold text-slate-800">{BDT(amt)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#001f3f] rounded-full" style={{ width: `${(amt / (totalExpenses || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-700 mb-4">দৈনিক রেকর্ড ({filteredDaily.length} দিন)</h3>
          <div className="overflow-y-auto max-h-64">
            <table className="w-full text-sm">
              <thead><tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-100 sticky top-0 bg-white">
                <th className="pb-2 text-left">তারিখ</th>
                <th className="pb-2 text-right">আয়</th>
                <th className="pb-2 text-right">লাভ</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDaily.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-2 text-slate-500">{dateStr(r.date)}</td>
                    <td className="py-2 text-right font-mono text-emerald-600">{BDT(r.totalIncome)}</td>
                    <td className={`py-2 text-right font-bold font-mono ${r.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{BDT(r.netProfit)}</td>
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

// ─── Settings ───────────────────────────────────────────────────────────────
function SettingsPage({ data, setData }) {
  const { settings } = data;
  const [tripRate, setTripRate] = useState(settings.tripRate);
  const [carRate, setCarRate] = useState(settings.carRate);
  const [companyName, setCompanyName] = useState(settings.companyName || "New M.H. Transport");

  const save = () => {
    const s = { tripRate: Number(tripRate), carRate: Number(carRate), companyName };
    setData(prev => { const n = { ...prev, settings: s }; LS.set("mht_settings", s); return n; });
    alert("সেটিংস সেভ হয়েছে ✓");
  };

  const exportAll = () => {
    const json = JSON.stringify(data, null, 2);
    const a = document.createElement("a");
    a.href = "data:application/json," + encodeURIComponent(json);
    a.download = "mh-transport-backup.json";
    a.click();
  };

  const importAll = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        Object.entries(d).forEach(([k, v]) => LS.set(`mht_${k}`, v));
        setData(d); alert("ডেটা আমদানি সফল হয়েছে! পেজ রিলোড করুন।");
      } catch { alert("ফাইল ফরম্যাট ভুল।"); }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (!confirm("সমস্ত ডেটা মুছে ফেলতে চান? এটি ফেরানো যাবে না!")) return;
    ["mht_daily", "mht_staff", "mht_expenses", "mht_salaries", "mht_tasks", "mht_attendance"].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-black text-slate-800">সেটিংস</h2><p className="text-slate-400 text-sm">অ্যাপ কনফিগারেশন</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <h3 className="font-bold text-slate-700">ব্যবসায়িক সেটিংস</h3>
          <Input label="প্রতিষ্ঠানের নাম" value={companyName} onChange={setCompanyName} />
          <Input label="ট্রিপ রেট (৳/ট্রিপ)" type="number" min="0" value={tripRate} onChange={setTripRate} />
          <Input label="গাড়ি চেক রেট (৳/গাড়ি)" type="number" min="0" value={carRate} onChange={setCarRate} />
          <Btn onClick={save} icon={<Icons.Save />}>সেটিংস সেভ করুন</Btn>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-bold text-slate-700">ডেটা ব্যবস্থাপনা</h3>
          <div className="space-y-3">
            <Btn onClick={exportAll} variant="secondary" icon={<Icons.Download />} className="w-full justify-center">
              সব ডেটা ব্যাকআপ (JSON)
            </Btn>
            <label className="w-full">
              <div className="inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-150 px-4 py-2 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer w-full justify-center">
                <Icons.Upload /> ডেটা পুনরুদ্ধার করুন
              </div>
              <input type="file" accept=".json" onChange={importAll} className="hidden" />
            </label>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3 flex items-center gap-1"><Icons.Alert /> বিপজ্জনক এলাকা</p>
            <Btn onClick={clearAll} variant="danger" className="w-full justify-center">সমস্ত ডেটা মুছুন</Btn>
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-slate-50">
        <h3 className="font-bold text-slate-600 mb-2">💡 ব্যবহারের নির্দেশিকা</h3>
        <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
          <li>সব ডেটা আপনার ব্রাউজারের localStorage-এ সংরক্ষিত হয়।</li>
          <li>নিয়মিত JSON ব্যাকআপ নিন যাতে ডেটা হারিয়ে না যায়।</li>
          <li>ব্রাউজার ক্যাশ পরিষ্কার করলে ডেটা মুছে যেতে পারে।</li>
          <li>একই ব্রাউজার ও ডিভাইসে সর্বদা ব্যবহার করুন।</li>
          <li>Vercel / Netlify-তে বিনামূল্যে হোস্ট করতে পারবেন।</li>
        </ul>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
const NAV = [
  { id: "dashboard", label: "ড্যাশবোর্ড", Icon: Icons.Dashboard },
  { id: "daily", label: "দৈনিক এন্ট্রি", Icon: Icons.Daily },
  { id: "staff", label: "স্টাফ ও বেতন", Icon: Icons.Staff },
  { id: "expenses", label: "খরচ", Icon: Icons.Expense },
  { id: "tasks", label: "কাজের তালিকা", Icon: Icons.Task },
  { id: "reports", label: "রিপোর্ট", Icon: Icons.Report },
  { id: "settings", label: "সেটিংস", Icon: Icons.Settings },
];

export default function App() {
  const [data, setData] = useState(initData);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageProps = { data, setData };
  const pages = {
    dashboard: <Dashboard {...pageProps} />,
    daily: <DailyEntry {...pageProps} />,
    staff: <StaffSalary {...pageProps} />,
    expenses: <ExpenseTracker {...pageProps} />,
    tasks: <TaskManagement {...pageProps} />,
    reports: <Reports {...pageProps} />,
    settings: <SettingsPage {...pageProps} />,
  };

  const navigate = (id) => { setPage(id); setSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-[#001f3f] text-white z-30 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><Icons.Truck /></div>
            <div>
              <p className="font-black text-sm leading-tight">{data.settings.companyName || "M.H. Transport"}</p>
              <p className="text-white/50 text-xs">ম্যানেজমেন্ট সিস্টেম</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${page === id ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
              <Icon />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-white/30 text-xs text-center">v1.0 · ব্যক্তিগত ব্যবহারের জন্য</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"><Icons.Menu /></button>
          <div className="lg:hidden font-black text-slate-800 text-sm">{NAV.find(n => n.id === page)?.label}</div>
          <div className="hidden lg:block">
            <p className="font-bold text-slate-800">{NAV.find(n => n.id === page)?.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{new Date().toLocaleDateString("bn-BD", { weekday: "short", day: "numeric", month: "long" })}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {pages[page]}
        </main>
      </div>
    </div>
  );
                        }
