import { supabase } from "./supabaseClient.js";

async function isAdmin() {
  const { data: sess } = await supabase.auth.getSession();
  const user = sess?.session?.user;
  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) return false;
  return data?.role === "admin";
}

export async function initNav() {
  const dashboardLink = document.getElementById("navDashboard");
  const adminLink = document.getElementById("navAdmin");
  const loginLink = document.getElementById("navLogin");
  const logoutBtn = document.getElementById("navLogout");

  const { data } = await supabase.auth.getSession();
  const loggedIn = !!data.session;

  if (dashboardLink) dashboardLink.style.display = loggedIn ? "inline" : "none";
  if (logoutBtn) logoutBtn.style.display = loggedIn ? "inline-block" : "none";
  if (loginLink) loginLink.style.display = loggedIn ? "none" : "inline";

  if (adminLink) {
    adminLink.style.display = "none";
    if (loggedIn) {
      const ok = await isAdmin();
      adminLink.style.display = ok ? "inline" : "none";
    }
  }

  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await supabase.auth.signOut();
      window.location.href = "./index.html";
    };
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    const now = !!session;

    if (dashboardLink) dashboardLink.style.display = now ? "inline" : "none";
    if (logoutBtn) logoutBtn.style.display = now ? "inline-block" : "none";
    if (loginLink) loginLink.style.display = now ? "none" : "inline";

    if (adminLink) {
      adminLink.style.display = "none";
      if (now) {
        const ok = await isAdmin();
        adminLink.style.display = ok ? "inline" : "none";
      }
    }
  });
}
