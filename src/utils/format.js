// Format helpers
export const BDT = (n) => `৳${Number(n || 0).toLocaleString("bn-BD")}`;
export const dateStr = (ts) => new Date(ts).toLocaleDateString("bn-BD", { day: "2-digit", month: "short", year: "numeric" });
export const todayISO = () => new Date().toISOString().split("T")[0];
export const tsFrom = (s) => new Date(s).getTime();
export const parseDate = (val) => {
  if (!val) return Date.now();
  if (typeof val === "number") return val;
  const s = String(val).trim();
  if (/^\d{10,}$/.test(s)) return Number(s);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T00:00:00");
    return isNaN(d.getTime()) ? Date.now() : d.getTime();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
};
