// Auth system with Dynamic Permissions
import GS from "../services/gs.js";

export const AUTH_KEY    = "mht_auth_users_v3";
export const SESSION_KEY = "mht_session_v3";

// All available pages with labels
export const ALL_PAGES = [
  { id: "dashboard",    label: "ড্যাশবোর্ড" },
  { id: "quick",        label: "দ্রুত এন্ট্রি ⚡" },
  { id: "daily",        label: "দৈনিক এন্ট্রি" },
  { id: "vehicles",     label: "গাড়ির তালিকা" },
  { id: "vehicletrips", label: "গাড়িভিত্তিক ট্রিপ" },
  { id: "attendance",   label: "অ্যাটেন্ডেন্স" },
  { id: "staff",        label: "স্টাফ ও বেতন" },
  { id: "expenses",     label: "খরচ ট্র্যাকার" },
  { id: "tasks",        label: "কাজের তালিকা" },
  { id: "monthly",      label: "মাসিক রিপোর্ট" },
  { id: "search",       label: "সার্চ ও ফিল্টার" },
  { id: "reports",      label: "রিপোর্ট" },
  { id: "pdf",          label: "PDF রিপোর্ট" },
  { id: "invoices",     label: "রসিদ ও ভাউচার" },
];

// Default pages per role (used when no custom pages set)
export const DEFAULT_ROLE_PAGES = {
  admin:   ["all"], // Admin sees everything always
  manager: ["dashboard","quick","daily","vehicles","vehicletrips","attendance","staff","expenses","tasks","monthly","search"],
  viewer:  ["dashboard","monthly","reports","search"],
};

export const ROLES = {
  admin:   { label: "অ্যাডমিন",  color: "green" },
  manager: { label: "ম্যানেজার", color: "amber"  },
  viewer:  { label: "ভিউয়ার",   color: "blue"   },
};

export const ROLE_PERMS = {
  admin:   { canEdit: true,  canDelete: true,  canManageUsers: true  },
  manager: { canEdit: true,  canDelete: false, canManageUsers: false },
  viewer:  { canEdit: false, canDelete: false, canManageUsers: false },
};

export const DEFAULT_ADMIN = [{
  id: "admin001", username: "admin", password: "admin123",
  name: "Admin", role: "admin", active: true, pages: ["all"],
}];

// ── Storage helpers ──────────────────────────────────────────────────────────
export const getUsers = () => {
  try {
    const s = localStorage.getItem(AUTH_KEY);
    if (s) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch(e) {}
  return DEFAULT_ADMIN;
};

export const saveUsers = (users) => {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(users)); } catch(e) {}
  // Sync to Sheets
  users.forEach(u => {
    GS.saveViaGet({
      action:   "saveUser",
      id:       String(u.id),
      username: String(u.username || ""),
      password: String(u.password || ""),
      name:     String(u.name || ""),
      role:     String(u.role || "viewer"),
      active:   String(u.active === true),
      pages:    JSON.stringify(u.pages || DEFAULT_ROLE_PAGES[u.role] || []),
    });
  });
};

export const syncUsersFromSheets = async () => {
  try {
    const data = await GS.getAll("Users");
    if (Array.isArray(data) && data.length > 0) {
      const users = data.map(u => ({
        id:       String(u.id       || "").trim(),
        username: String(u.username || "").trim(),
        password: String(u.password || "").trim(),
        name:     String(u.name     || "").trim(),
        role:     String(u.role     || "viewer").trim(),
        active:   u.active === "true" || u.active === true,
        // Parse pages — if admin, always ["all"]
        pages: (() => {
          if (u.role === "admin") return ["all"];
          try {
            const p = typeof u.pages === "string" ? JSON.parse(u.pages) : u.pages;
            if (Array.isArray(p) && p.length > 0) return p;
          } catch(e) {}
          return DEFAULT_ROLE_PAGES[u.role] || ["dashboard"];
        })(),
      })).filter(u => u.id && u.username && u.password);

      if (users.length > 0) {
        try { localStorage.setItem(AUTH_KEY, JSON.stringify(users)); } catch(e) {}
        return users;
      }
    }
  } catch(e) {}
  return getUsers();
};

// ── Get allowed pages for a user ─────────────────────────────────────────────
export const getUserPages = (user) => {
  if (!user) return [];
  if (user.role === "admin") return ["all"];
  if (Array.isArray(user.pages) && user.pages.length > 0) return user.pages;
  return DEFAULT_ROLE_PAGES[user.role] || ["dashboard"];
};

// ── Session helpers ──────────────────────────────────────────────────────────
export const getCurrentUser = () => {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    if (!s) return null;
    const session = JSON.parse(s);
    const users   = getUsers();
    return users.find(u => u.id === session.userId && u.active === true) || null;
  } catch(e) { return null; }
};

export const logoutUser = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
};
