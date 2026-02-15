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

function setDisplay(el, show) {
  if (!el) return;
  el.style.display = show ? "inline" : "none";
}

export async function initNav() {
  const dashboardLink = document.getElementById("navDashboard");
  const adminLink = document.getElementById("navAdmin");
  const settingsLink = document.getElementById("navSettings");
  const loginLink = document.getElementById("navLogin");

  const { data } = await supabase.auth.getSession();
  const loggedIn = !!data.session;

  setDisplay(dashboardLink, loggedIn);
  setDisplay(settingsLink, loggedIn);
  setDisplay(loginLink, !loggedIn);

  if (adminLink) {
    adminLink.style.display = "none";
    if (loggedIn) {
      const ok = await isAdmin();
      setDisplay(adminLink, ok);
    }
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    const now = !!session;

    setDisplay(dashboardLink, now);
    setDisplay(settingsLink, now);
    setDisplay(loginLink, !now);

    if (adminLink) {
      adminLink.style.display = "none";
      if (now) {
        const ok = await isAdmin();
        setDisplay(adminLink, ok);
      }
    }
  });
}
