import { useState } from "react";
import GS from "../../services/gs.js";
import { AUTH_KEY, SESSION_KEY, getUsers, saveUsers, syncUsersFromSheets } from "../../utils/auth.js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "mhtransport2024";

function LoginPage({ onLogin }) {
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [status, setStatus]           = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recUsername, setRecUsername] = useState("");
  const [recNewPass, setRecNewPass]   = useState("");
  const [recSecretKey, setRecSecretKey] = useState("");
  const [recMsg, setRecMsg]           = useState("");

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async () => {
    const u = username.trim();
    const p = password.trim();
    if (!u || !p) { setError("ইউজারনেম ও পাসওয়ার্ড দিন"); return; }

    setLoading(true);
    setError("");
    setStatus("Sheets থেকে ইউজার লোড হচ্ছে...");

    try {
      // 1. Fetch fresh users from Sheets
      let users = await syncUsersFromSheets();

      // 2. Match user
      let user = users.find(x =>
        x.username === u && x.password === p && x.active === true
      );

      // 3. Offline fallback
      if (!user) {
        users = getUsers();
        user = users.find(x =>
          x.username === u && x.password === p && x.active === true
        );
      }

      setStatus("");

      if (user) {
        // Save session using SESSION_KEY from auth.js
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify({
            userId: user.id,
            loginTime: Date.now(),
          }));
        } catch(e) {}
        onLogin(user);
      } else {
        const exists = users.find(x => x.username === u);
        if (exists && !exists.active) {
          setError("এই অ্যাকাউন্ট নিষ্ক্রিয়!");
        } else if (exists) {
          setError("পাসওয়ার্ড ভুল!");
        } else {
          setError("ইউজারনেম পাওয়া যায়নি!");
        }
      }
    } catch(err) {
      setStatus("");
      // Full offline fallback
      const users = getUsers();
      const user = users.find(x =>
        x.username === u && x.password === p && x.active === true
      );
      if (user) {
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify({
            userId: user.id,
            loginTime: Date.now(),
          }));
        } catch(e) {}
        onLogin(user);
      } else {
        setError("লগইন ব্যর্থ। আবার চেষ্টা করুন।");
      }
    }
    setLoading(false);
  };

  // ── Password Recovery ──────────────────────────────────────────────────────
  const recover = () => {
    if (!recUsername || !recNewPass || !recSecretKey) {
      setRecMsg("সব তথ্য পূরণ করুন"); return;
    }
    if (recSecretKey !== SECRET_KEY) {
      setRecMsg("সিক্রেট কী ভুল!"); return;
    }
    const users = getUsers();
    const uname = recUsername.trim();
    const user  = users.find(u => u.username === uname);
    if (!user) { setRecMsg("ইউজারনেম পাওয়া যায়নি"); return; }
    const updated = users.map(u =>
      u.username === uname ? { ...u, password: recNewPass.trim() } : u
    );
    saveUsers(updated);
    setRecMsg("✅ পাসওয়ার্ড পরিবর্তন হয়েছে! এখন লগইন করুন।");
    setTimeout(() => {
      setShowRecovery(false);
      setRecMsg(""); setRecUsername(""); setRecNewPass(""); setRecSecretKey("");
    }, 2000);
  };

  // ── Shared input style ─────────────────────────────────────────────────────
  const inputStyle = {
    background: "rgba(2,12,27,0.6)",
    border: "1px solid rgba(100,255,218,0.12)",
    borderRadius: 10,
    color: "#e6f1ff",
    padding: "11px 14px",
    outline: "none",
    width: "100%",
    fontSize: 14,
    fontFamily: "'Noto Sans Bengali', sans-serif",
    transition: "border-color 0.2s",
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 700,
    color: "#8892b0",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: 6,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020c1b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'Noto Sans Bengali', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg,#0fba81,#0d9e6e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(15,186,129,0.3)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#020c1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h15v13H1z"/>
              <path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#e6f1ff", marginBottom: 4 }}>
            M.H. Transport
          </h1>
          <p style={{ fontSize: 13, color: "#0fba81", fontWeight: 600 }}>
            ম্যানেজমেন্ট সিস্টেম
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: "rgba(17,34,64,0.9)",
          border: "1px solid rgba(100,255,218,0.12)",
          borderRadius: 20,
          padding: 28,
          backdropFilter: "blur(16px)",
          boxShadow: "0 24px 80px rgba(2,12,27,0.6)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#e6f1ff", marginBottom: 22, textAlign: "center" }}>
            লগইন করুন
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Username */}
            <div>
              <span style={labelStyle}>ইউজারনেম</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && login()}
                placeholder="আপনার ইউজারনেম"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#0fba81"}
                onBlur={e  => e.target.style.borderColor = "rgba(100,255,218,0.12)"}
              />
            </div>

            {/* Password */}
            <div>
              <span style={labelStyle}>পাসওয়ার্ড</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && login()}
                  placeholder="পাসওয়ার্ড"
                  style={{ ...inputStyle, paddingRight: 70 }}
                  onFocus={e => e.target.style.borderColor = "#0fba81"}
                  onBlur={e  => e.target.style.borderColor = "rgba(100,255,218,0.12)"}
                />
                <button onClick={() => setShowPass(p => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#8892b0", cursor: "pointer", fontSize: 12, fontFamily: "'Noto Sans Bengali',sans-serif" }}>
                  {showPass ? "লুকান" : "দেখান"}
                </button>
              </div>
            </div>

            {/* Status */}
            {status && (
              <div style={{ background: "rgba(15,186,129,0.08)", border: "1px solid rgba(15,186,129,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#1de9b6", textAlign: "center" }}>
                ⏳ {status}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ff6b6b", textAlign: "center" }}>
                ⚠️ {error}
              </div>
            )}

            {/* Login button */}
            <button onClick={login} disabled={loading}
              style={{ background: "linear-gradient(135deg,#0fba81,#0d9e6e)", color: "#020c1b", border: "none", borderRadius: 12, padding: "13px 20px", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4, fontFamily: "'Noto Sans Bengali',sans-serif" }}>
              {loading ? "যাচাই হচ্ছে..." : "লগইন করুন →"}
            </button>

            {/* Hint */}
            <p style={{ textAlign: "center", fontSize: 11, color: "#4a5568", marginTop: 4 }}>
              ডিফল্ট: <strong style={{ color: "#64ffda" }}>admin</strong> / <strong style={{ color: "#64ffda" }}>admin123</strong>
            </p>

            {/* Recovery link */}
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setShowRecovery(true)}
                style={{ background: "none", border: "none", color: "#0fba81", fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Modal */}
      {showRecovery && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setShowRecovery(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(2,12,27,0.85)", backdropFilter: "blur(6px)" }}/>
          <div style={{ position: "relative", width: "100%", maxWidth: 380, background: "#112240", border: "1px solid rgba(100,255,218,0.15)", borderRadius: 20, padding: 28, boxShadow: "0 24px 80px rgba(2,12,27,0.8)" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: "#64ffda", marginBottom: 6, textAlign: "center" }}>🔑 পাসওয়ার্ড রিকভারি</h3>
            <p style={{ fontSize: 12, color: "#8892b0", textAlign: "center", marginBottom: 20 }}>সিক্রেট কী দিয়ে পাসওয়ার্ড রিসেট করুন</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "ইউজারনেম", val: recUsername, set: setRecUsername, type: "text",     ph: "আপনার ইউজারনেম" },
                { label: "নতুন পাসওয়ার্ড", val: recNewPass, set: setRecNewPass, type: "password", ph: "নতুন পাসওয়ার্ড" },
                { label: "সিক্রেট কী", val: recSecretKey, set: setRecSecretKey, type: "password", ph: "মালিকের কাছ থেকে নিন" },
              ].map(({ label, val, set, type, ph }) => (
                <div key={label}>
                  <span style={labelStyle}>{label}</span>
                  <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    style={{ ...inputStyle, background: "rgba(2,12,27,0.7)" }}
                    onFocus={e => e.target.style.borderColor = "#0fba81"}
                    onBlur={e  => e.target.style.borderColor = "rgba(100,255,218,0.12)"}/>
                </div>
              ))}

              {recMsg && (
                <div style={{ background: recMsg.includes("✅") ? "rgba(15,186,129,0.1)" : "rgba(255,107,107,0.1)", border: `1px solid ${recMsg.includes("✅") ? "rgba(15,186,129,0.3)" : "rgba(255,107,107,0.25)"}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: recMsg.includes("✅") ? "#1de9b6" : "#ff6b6b", textAlign: "center" }}>
                  {recMsg}
                </div>
              )}

              <button onClick={recover}
                style={{ background: "linear-gradient(135deg,#0fba81,#0d9e6e)", color: "#020c1b", border: "none", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
                পাসওয়ার্ড রিসেট করুন
              </button>
              <button onClick={() => setShowRecovery(false)}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 10, fontSize: 13, color: "#8892b0", cursor: "pointer", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
