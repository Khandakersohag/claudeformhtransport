import { useState, useEffect } from "react";
import { ROLES, ROLE_PERMS, ALL_PAGES, DEFAULT_ROLE_PAGES, getUsers, saveUsers, syncUsersFromSheets } from "../../utils/auth.js";
import GS from "../../services/gs.js";

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle = {
  background: "rgba(2,12,27,0.6)",
  border: "1px solid rgba(100,255,218,0.12)",
  borderRadius: 8, color: "#e6f1ff",
  padding: "10px 14px", outline: "none", width: "100%",
  fontSize: 13, fontFamily: "'Noto Sans Bengali', sans-serif",
  transition: "border-color 0.2s",
};
const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "#8892b0",
  textTransform: "uppercase", letterSpacing: "0.08em",
  display: "block", marginBottom: 6,
};
const cardStyle = {
  background: "rgba(17,34,64,0.85)",
  border: "1px solid rgba(100,255,218,0.08)",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(2,12,27,0.5)",
  padding: 22,
};
const pillStyle = (color) => {
  const colors = {
    green: { bg: "rgba(15,186,129,0.12)", c: "#1de9b6", b: "rgba(15,186,129,0.25)" },
    amber: { bg: "rgba(255,209,102,0.1)",  c: "#ffd166", b: "rgba(255,209,102,0.25)" },
    blue:  { bg: "rgba(100,149,237,0.12)", c: "#6495ed", b: "rgba(100,149,237,0.3)" },
    red:   { bg: "rgba(255,107,107,0.12)", c: "#ff6b6b", b: "rgba(255,107,107,0.25)" },
    slate: { bg: "rgba(29,52,97,0.8)",     c: "#8892b0", b: "rgba(100,255,218,0.1)" },
  };
  const c = colors[color] || colors.slate;
  return { background: c.bg, color: c.c, border: `1px solid ${c.b}`, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", display: "inline-block" };
};
const Btn = ({ children, onClick, v = "primary", full, icon, size = "md", disabled }) => {
  const sz = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "10px 20px", fontSize: 13 }, lg: { padding: "12px 24px", fontSize: 14 } };
  const vs = {
    primary: { background: "linear-gradient(135deg,#0fba81,#0d9e6e)", color: "#020c1b", border: "none", fontWeight: 700 },
    ghost:   { background: "transparent", color: "#0fba81", border: "1px solid rgba(100,255,218,0.25)", fontWeight: 600 },
    danger:  { background: "rgba(255,107,107,0.12)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.25)", fontWeight: 600 },
    navy:    { background: "#1d3461", color: "#e6f1ff", border: "1px solid rgba(255,255,255,0.08)", fontWeight: 600 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer", borderRadius: 12, transition: "all 0.18s", opacity: disabled ? 0.5 : 1, width: full ? "100%" : undefined, justifyContent: full ? "center" : undefined, fontFamily: "'Noto Sans Bengali',sans-serif", ...sz[size], ...vs[v] }}>
      {icon && <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>}
      {children}
    </button>
  );
};

// ── Permission Editor Modal ───────────────────────────────────────────────────
function PermissionEditor({ user, onSave, onClose }) {
  const [selectedPages, setSelectedPages] = useState(
    user.pages || DEFAULT_ROLE_PAGES[user.role] || []
  );

  const toggle = (pageId) => {
    setSelectedPages(prev =>
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    );
  };

  const selectAll  = () => setSelectedPages(ALL_PAGES.map(p => p.id));
  const clearAll   = () => setSelectedPages(["dashboard"]); // dashboard always
  const setDefault = () => setSelectedPages(DEFAULT_ROLE_PAGES[user.role] || ["dashboard"]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(2,12,27,0.85)", backdropFilter: "blur(6px)" }}/>
      <div style={{ position: "relative", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", borderRadius: 20, background: "#112240", border: "1px solid rgba(100,255,218,0.15)", boxShadow: "0 24px 80px rgba(2,12,27,0.8)", padding: 24 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: "#64ffda", marginBottom: 4 }}>
            🔐 পেজ অনুমতি — {user.name}
          </h3>
          <p style={{ fontSize: 12, color: "#8892b0" }}>
            কোন পেজগুলো দেখতে পাবে তা নির্বাচন করুন
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={selectAll}
            style={{ padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(15,186,129,0.3)", background: "rgba(15,186,129,0.1)", color: "#1de9b6", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
            সব নির্বাচন
          </button>
          <button onClick={setDefault}
            style={{ padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,209,102,0.3)", background: "rgba(255,209,102,0.1)", color: "#ffd166", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
            ডিফল্ট
          </button>
          <button onClick={clearAll}
            style={{ padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.1)", color: "#ff6b6b", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
            সব বাতিল
          </button>
        </div>

        {/* Page checkboxes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {ALL_PAGES.map(pg => {
            const checked = selectedPages.includes(pg.id);
            const isDashboard = pg.id === "dashboard";
            return (
              <label key={pg.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: checked ? "rgba(15,186,129,0.08)" : "rgba(2,12,27,0.4)",
                border: `1px solid ${checked ? "rgba(15,186,129,0.25)" : "rgba(255,255,255,0.05)"}`,
                borderRadius: 10, padding: "10px 14px", cursor: isDashboard ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}>
                <input
                  type="checkbox"
                  checked={checked || isDashboard}
                  disabled={isDashboard}
                  onChange={() => !isDashboard && toggle(pg.id)}
                  style={{ accentColor: "#0fba81", width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, fontWeight: checked ? 700 : 400, color: checked ? "#64ffda" : "#8892b0" }}>
                  {pg.label}
                  {isDashboard && <span style={{ fontSize: 10, color: "#4a5568", marginLeft: 4 }}>(সবসময়)</span>}
                </span>
              </label>
            );
          })}
        </div>

        {/* Selected count */}
        <div style={{ background: "rgba(15,186,129,0.06)", border: "1px solid rgba(15,186,129,0.1)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#8892b0" }}>
          মোট নির্বাচিত: <strong style={{ color: "#1de9b6" }}>{selectedPages.length}টি</strong> পেজ
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => onSave(selectedPages)} full>সেভ করুন</Btn>
          <Btn v="ghost" onClick={onClose} full>বাতিল</Btn>
        </div>
      </div>
    </div>
  );
}

// ── User Management Page ──────────────────────────────────────────────────────
function UserManagement({ currentUser }) {
  const [users, setUsers]           = useState(() => getUsers());
  const [showAdd, setShowAdd]       = useState(false);
  const [editPermUser, setEditPermUser] = useState(null);
  const [uName, setUName]           = useState("");
  const [uUsername, setUUsername]   = useState("");
  const [uPass, setUPass]           = useState("");
  const [uRole, setURole]           = useState("manager");
  const [editId, setEditId]         = useState(null);
  const [error, setError]           = useState("");
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    syncUsersFromSheets().then(fresh => setUsers([...fresh]));
  }, []);

  const reset = () => {
    setUName(""); setUUsername(""); setUPass(""); setURole("manager");
    setEditId(null); setShowAdd(false); setError("");
  };

  const save = () => {
    if (!uName || !uUsername || (!editId && !uPass)) { setError("সব তথ্য পূরণ করুন"); return; }
    const exists = users.find(u => u.username === uUsername && u.id !== editId);
    if (exists) { setError("এই ইউজারনেম ইতিমধ্যে আছে"); return; }

    let list;
    if (editId) {
      list = users.map(u => u.id === editId
        ? { ...u, name: uName, username: uUsername, ...(uPass ? { password: uPass } : {}), role: uRole }
        : u
      );
    } else {
      const newUser = {
        id: Date.now().toString(), username: uUsername, password: uPass,
        name: uName, role: uRole, active: true,
        pages: uRole === "admin" ? ["all"] : DEFAULT_ROLE_PAGES[uRole] || ["dashboard"],
      };
      list = [...users, newUser];
    }
    saveUsers(list);
    setUsers([...list]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    reset();
  };

  const toggleActive = (id) => {
    if (id === currentUser.id) { alert("নিজের অ্যাকাউন্ট বন্ধ করা যাবে না!"); return; }
    const list = users.map(u => u.id === id ? { ...u, active: !u.active } : u);
    saveUsers(list);
    setUsers([...list]);
  };

  const deleteUser = (id) => {
    if (id === currentUser.id) { alert("নিজের অ্যাকাউন্ট মুছা যাবে না!"); return; }
    if (!confirm("এই ইউজার মুছে ফেলবেন?")) return;
    GS.post({ action: "delete", sheet: "Users", id });
    const list = users.filter(u => u.id !== id);
    saveUsers(list);
    setUsers([...list]);
  };

  const loadEdit = (u) => {
    setUName(u.name); setUUsername(u.username); setUPass("");
    setURole(u.role); setEditId(u.id); setShowAdd(true);
  };

  const savePermissions = (userId, pages) => {
    const list = users.map(u => u.id === userId ? { ...u, pages } : u);
    saveUsers(list);
    setUsers([...list]);
    setEditPermUser(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "'Noto Sans Bengali', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#e6f1ff", marginBottom: 4 }}>ইউজার ম্যানেজমেন্ট 👤</h2>
          <p style={{ color: "#8892b0", fontSize: 13 }}>ব্যবহারকারী ও পেজ অনুমতি নিয়ন্ত্রণ</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#0fba81,#0d9e6e)", color: "#020c1b", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
          + নতুন ইউজার
        </button>
      </div>

      {/* Role info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
        {Object.entries(ROLES).map(([key, r]) => (
          <div key={key} style={{ ...cardStyle, padding: "14px 16px" }}>
            <span style={pillStyle(r.color)}>{r.label}</span>
            <p style={{ fontSize: 11, color: "#8892b0", marginTop: 8, lineHeight: 1.6 }}>
              {key === "admin"   ? "সব পেজ — পরিবর্তনযোগ্য নয়" :
               key === "manager" ? "নির্ধারিত পেজ দেখবে" :
                                   "সীমিত পেজ দেখবে"}
            </p>
          </div>
        ))}
      </div>

      {saved && (
        <div style={{ background: "rgba(15,186,129,0.1)", border: "1px solid rgba(15,186,129,0.3)", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#1de9b6", textAlign: "center" }}>
          ✅ সফলভাবে সেভ হয়েছে!
        </div>
      )}

      {/* User list */}
      <div style={cardStyle}>
        <h3 style={{ fontWeight: 700, fontSize: 14, color: "#64ffda", marginBottom: 16 }}>
          ইউজার তালিকা ({users.length} জন)
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map(u => {
            const allowedPages = u.role === "admin" ? ALL_PAGES : ALL_PAGES.filter(p => (u.pages || []).includes(p.id));
            return (
              <div key={u.id} style={{
                background: "rgba(2,12,27,0.5)",
                border: `1px solid ${u.id === currentUser.id ? "rgba(15,186,129,0.2)" : "rgba(100,255,218,0.08)"}`,
                borderRadius: 14, padding: "14px 16px",
              }}>
                {/* User info row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: u.active ? "linear-gradient(135deg,#0fba81,#0d9e6e)" : "#1d3461", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: u.active ? "#020c1b" : "#8892b0", flexShrink: 0 }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "#e6f1ff" }}>{u.name}</p>
                        {u.id === currentUser.id && <span style={pillStyle("green")}>আপনি</span>}
                      </div>
                      <p style={{ fontSize: 12, color: "#8892b0" }}>
                        @{u.username} · <span style={{ color: ROLES[u.role]?.color === "green" ? "#1de9b6" : ROLES[u.role]?.color === "amber" ? "#ffd166" : "#6495ed" }}>{ROLES[u.role]?.label}</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={pillStyle(u.active ? "green" : "slate")}>{u.active ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                    {/* Permission button — not for admin */}
                    {u.role !== "admin" && (
                      <button onClick={() => setEditPermUser(u)}
                        style={{ padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(100,149,237,0.3)", background: "rgba(100,149,237,0.1)", color: "#6495ed", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
                        🔐 অনুমতি
                      </button>
                    )}
                    <button onClick={() => loadEdit(u)}
                      style={{ padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(100,255,218,0.2)", background: "transparent", color: "#1de9b6", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
                      সম্পাদনা
                    </button>
                    {u.id !== currentUser.id && (
                      <>
                        <button onClick={() => toggleActive(u.id)}
                          style={{ padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "#1d3461", color: "#e6f1ff", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
                          {u.active ? "বন্ধ" : "চালু"}
                        </button>
                        <button onClick={() => deleteUser(u.id)}
                          style={{ padding: "6px 10px", borderRadius: 10, fontSize: 11, cursor: "pointer", border: "1px solid rgba(255,107,107,0.2)", background: "rgba(255,107,107,0.08)", color: "#ff6b6b", fontFamily: "'Noto Sans Bengali',sans-serif" }}>
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Allowed pages for this user */}
                <div>
                  <p style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    {u.role === "admin" ? "সব পেজ" : `অনুমোদিত পেজ (${allowedPages.length}টি)`}
                  </p>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {u.role === "admin" ? (
                      <span style={{ fontSize: 11, color: "#1de9b6", fontWeight: 700 }}>✅ সম্পূর্ণ অ্যাক্সেস</span>
                    ) : allowedPages.map(pg => (
                      <span key={pg.id} style={{ background: "rgba(15,186,129,0.08)", color: "#64ffda", border: "1px solid rgba(15,186,129,0.15)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                        {pg.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={reset}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(2,12,27,0.85)", backdropFilter: "blur(6px)" }}/>
          <div style={{ position: "relative", width: "100%", maxWidth: 450, borderRadius: 20, background: "#112240", border: "1px solid rgba(100,255,218,0.15)", padding: 24, boxShadow: "0 24px 80px rgba(2,12,27,0.8)" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: 15, color: "#64ffda", marginBottom: 20 }}>
              {editId ? "ইউজার সম্পাদনা" : "নতুন ইউজার যোগ করুন"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "পূর্ণ নাম",   val: uName,     set: setUName,     type: "text",     ph: "মো. রহিম" },
                { label: "ইউজারনেম",    val: uUsername, set: setUUsername, type: "text",     ph: "rahim123" },
                { label: editId ? "নতুন পাসওয়ার্ড (খালি = পুরনো)" : "পাসওয়ার্ড", val: uPass, set: setUPass, type: "password", ph: "••••••••" },
              ].map(({ label, val, set, type, ph }) => (
                <div key={label}>
                  <span style={labelStyle}>{label}</span>
                  <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#0fba81"}
                    onBlur={e  => e.target.style.borderColor = "rgba(100,255,218,0.12)"}/>
                </div>
              ))}

              <div>
                <span style={labelStyle}>রোল</span>
                <select value={uRole} onChange={e => setURole(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer", background: "rgba(2,12,27,0.7)" }}>
                  {Object.entries(ROLES).map(([v, r]) => (
                    <option key={v} value={v} style={{ background: "#0a192f" }}>{r.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#ff6b6b" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <Btn onClick={save} full>{editId ? "আপডেট করুন" : "যোগ করুন"}</Btn>
                <Btn v="ghost" onClick={reset} full>বাতিল</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Editor */}
      {editPermUser && (
        <PermissionEditor
          user={editPermUser}
          onSave={(pages) => savePermissions(editPermUser.id, pages)}
          onClose={() => setEditPermUser(null)}
        />
      )}
    </div>
  );
}

export default UserManagement;
