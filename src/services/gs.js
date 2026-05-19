// Google Sheets service
const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwOwUMtsLuz7mVyoxn3L3C_6gsE9-MyEWq96CMNEkHR8FL3r_hx2YTCT8PPk0o12ioS/exec";

const GS = {
  post: async (body) => {
    try {
      await fetch(SCRIPT_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(body),
      });
    } catch(e) { console.error("GS.post error:", e); }
  },

  getAll: async (sheet) => {
    try {
      const res = await fetch(`${SCRIPT_URL}?sheet=${sheet}`, { cache: "no-store" });
      const d = await res.json();
      return d.success ? d.data : [];
    } catch(e) { return []; }
  },

  saveViaGet: (params) => {
    try {
      const url = SCRIPT_URL + "?" + new URLSearchParams(params).toString();
      fetch(url).catch(() => {});
    } catch(e) {}
  },
};

export default GS;
export { SCRIPT_URL };
