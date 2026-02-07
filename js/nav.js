import { supabase } from "./supabaseClient.js";

export async function initNav() {
  const dashboardLink = document.getElementById("navDashboard");
  const adminLink = document.getElementById("navAdmin");
  const loginLink = document.getElementById("navLogin");
  const logoutBtn = document.getElementById("navLogout");

  const { data } = await supabase.auth.getSession();
  const session = data?.session || null;

  const setLoggedOutUI = () => {
    if (dashboardLink) dashboardLink.style.display = "none";
    if (adminLink) adminLink.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginLink) loginLink.style.display = "inline";
  };

  const setLoggedInUI = async (session) => {
    if (dashboardLink) dashboardLink.style.display = "inline";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (loginLink) loginLink.style.display = "none";

    if (adminLink) {
      adminLink.style.display = "none";

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role === "admin") {
        adminLink.style.display = "inline";
      }
    }
  };

  if (!session) {
    setLoggedOutUI();
  } else {
    await setLoggedInUI(session);
  }

  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await supabase.auth.signOut();
      window.location.href = "./index.html";
    };
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session) {
      setLoggedOutUI();
    } else {
      await setLoggedInUI(session);
    }
  });
}
