// Auth system
import LS from "./storage.js";
import GS from "../services/gs.js";

export const AUTH_KEY = "mht_auth_users_v3";
export const SESSION_KEY = "mht_session_v3";

export const DEFAULT_ADMIN = [{
  id: "admin001", username: "admin", password: "admin123",
  name: "Admin", role: "admin", active: true,
}];

export const ROLES = {
  admin:   { label: "অ্যাডমিন",  color: "green", pages: ["all"] },
  manager: { label: "ম্যানেজার", color: "amber",  pages: ["dashboard","quick","daily","vehicletrips","attendance","vehicles","staff","expenses","tasks","reports","monthly","search"] },
  viewer:  { label: "ভিউয়ার",   color: "blue",   pages: ["dashboard","monthly","reports","search"] },
};

export const ROLE_PERMS = {
  admin:   { canEdit: true,  canDelete: true,  canManageUsers: true },
  manager: { canEdit: true,  canDelete: false, canManageUsers: false },
  viewer:  { canEdit: false, canDelete: false, canManageUsers: false },
};

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
  users.forEach(u => {
    GS.saveViaGet({
      action: "saveUser",
      id: String(u.id),
      username: String(u.username || ""),
      password: String(u.password || ""),
      name: String(u.name || ""),
      role: String(u.role || "viewer"),
      active: String(u.active === true),
    });
  });
};

export const syncUsersFromSheets = async () => {
  try {
    const data = await GS.getAll("Users");
    if (Array.isArray(data) && data.length > 0) {
      const users = data.map(u => ({
        id:       String(u.id || "").trim(),
        username: String(u.username || "").trim(),
        password: String(u.password || "").trim(),
        name:     String(u.name || "").trim(),
        role:     String(u.role || "viewer").trim(),
        active:   u.active === "true" || u.active === true,
      })).filter(u => u.id && u.username && u.password);
      if (users.length > 0) {
        try { localStorage.setItem(AUTH_KEY, JSON.stringify(users)); } catch(e) {}
        return users;
      }
    }
  } catch(e) {}
  return getUsers();
};

export const loginUser = async (username, password) => {
  const u = username.trim();
  const p = password.trim();
  // Sync from Sheets first
  let users = await syncUsersFromSheets();
  // Find user
  let user = users.find(x => x.username === u && x.password === p && x.active === true);
  // Offline fallback
  if (!user) {
    users = getUsers();
    user = users.find(x => x.username === u && x.password === p && x.active === true);
  }
  if (user) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, loginTime: Date.now() })); } catch(e) {}
    return { success: true, user };
  }
  const exists = users.find(x => x.username === u);
  if (exists && !exists.active) return { success: false, error: "এই অ্যাকাউন্ট নিষ্ক্রিয়!" };
  if (exists) return { success: false, error: "পাসওয়ার্ড ভুল!" };
  return { success: false, error: "ইউজারনেম পাওয়া যায়নি!" };
};

export const getCurrentUser = () => {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    if (!s) return null;
    const session = JSON.parse(s);
    const users = getUsers();
    return users.find(u => u.id === session.userId && u.active === true) || null;
  } catch(e) { return null; }
};

export const logoutUser = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
};
