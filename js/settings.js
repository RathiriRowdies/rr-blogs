import { supabase } from "./supabaseClient.js";

const settingsMsg = document.getElementById("settingsMsg");

const loggedOutActions = document.getElementById("loggedOutActions");
const loggedInActions = document.getElementById("loggedInActions");
const who = document.getElementById("who");

const profileCard = document.getElementById("profileCard");
const securityCard = document.getElementById("securityCard");

const profileMsg = document.getElementById("profileMsg");
const securityMsg = document.getElementById("securityMsg");

function setMsg(el, text) {
  if (!el) return;
  el.textContent = text || "";
}

function setVisible(el, yes) {
  if (!el) return;
  el.style.display = yes ? "block" : "none";
}

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

async function loadMyProfile(uid) {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name,last_name,username,age,email")
    .eq("id", uid)
    .single();

  if (error) return null;
  return data;
}

async function init() {
  setMsg(settingsMsg, "");
  setMsg(profileMsg, "");
  setMsg(securityMsg, "");

  const session = await getSession();

  if (!session) {
    setVisible(loggedOutActions, true);
    setVisible(loggedInActions, false);
    setVisible(profileCard, false);
    setVisible(securityCard, false);
    return;
  }

  setVisible(loggedOutActions, false);
  setVisible(loggedInActions, true);
  setVisible(profileCard, true);
  setVisible(securityCard, true);

  who.textContent = `Signed in as ${session.user.email}`;

  const profile = await loadMyProfile(session.user.id);

  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const username = document.getElementById("username");
  const age = document.getElementById("age");

  if (profile) {
    if (firstName) firstName.value = profile.first_name || "";
    if (lastName) lastName.value = profile.last_name || "";
    if (username) username.value = profile.username || "";
    if (age) age.value = profile.age ?? "";
  }

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "./index.html";
  });

  document.getElementById("saveProfileBtn")?.addEventListener("click", async () => {
    setMsg(profileMsg, "Saving…");

    const fn = firstName?.value.trim() || "";
    const ln = lastName?.value.trim() || "";
    const un = username?.value.trim() || "";
    const a = Number(age?.value || 0);

    if (!un) {
      setMsg(profileMsg, "Username required.");
      return;
    }
    if (age?.value && (a < 13 || a > 120)) {
      setMsg(profileMsg, "Age must be between 13 and 120.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: fn,
        last_name: ln,
        username: un,
        age: age?.value ? a : null
      })
      .eq("id", session.user.id);

    if (error) {
      setMsg(profileMsg, error.message);
      return;
    }

    setMsg(profileMsg, "Saved.");
  });

  document.getElementById("changeEmailBtn")?.addEventListener("click", async () => {
    setMsg(securityMsg, "Updating email…");

    const newEmail = document.getElementById("newEmail")?.value.trim();
    if (!newEmail) {
      setMsg(securityMsg, "Email required.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setMsg(securityMsg, error.message);
      return;
    }

    setMsg(securityMsg, "Check your email to confirm the change.");
  });

  document.getElementById("changePasswordBtn")?.addEventListener("click", async () => {
    setMsg(securityMsg, "Updating password…");

    const newPassword = document.getElementById("newPassword")?.value || "";
    if (!newPassword || newPassword.length < 8) {
      setMsg(securityMsg, "Password must be at least 8 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMsg(securityMsg, error.message);
      return;
    }

    document.getElementById("newPassword").value = "";
    setMsg(securityMsg, "Password updated.");
  });
}

init();
