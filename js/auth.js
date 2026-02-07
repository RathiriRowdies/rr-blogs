import { supabase } from "./supabaseClient.js";

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function requireAuth(redirectTo = "./login.html") {
  const session = await getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "./index.html";
}

export async function getMyProfile() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,role")
    .eq("id", session.user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!session) return null;

  const profile = await getMyProfile();
  if (!profile || profile.role !== "admin") {
    window.location.href = "./dashboard.html";
    return null;
  }
  return profile;
}
