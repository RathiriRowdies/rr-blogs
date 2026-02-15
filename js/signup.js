import { supabase } from "./supabaseClient.js";

const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const username = document.getElementById("username");
const age = document.getElementById("age");
const email = document.getElementById("email");
const password = document.getElementById("password");
const msg = document.getElementById("msg");
const createBtn = document.getElementById("createBtn");

function clean(s) {
  return String(s || "").trim();
}

function cleanUsername(s) {
  return clean(s);
}

function validate() {
  const fn = clean(firstName.value);
  const ln = clean(lastName.value);
  const un = cleanUsername(username.value);
  const em = clean(email.value);
  const pw = String(password.value || "");
  const ag = Number(age.value);

  if (!fn) return "First name required.";
  if (!ln) return "Last name required.";
  if (!un) return "Username required.";
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(un)) return "Username must be 3–24 chars (letters, numbers, underscore).";
  if (!em) return "Email required.";
  if (!pw || pw.length < 8) return "Password must be at least 8 characters.";
  if (!Number.isFinite(ag) || ag < 13 || ag > 120) return "Age must be between 13 and 120.";
  return null;
}

async function usernameAvailable(un) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", un)
    .limit(1);

  if (error) throw error;
  return !data || data.length === 0;
}

async function saveProfile(userId) {
  const payload = {
    id: userId,
    email: clean(email.value),
    first_name: clean(firstName.value),
    last_name: clean(lastName.value),
    username: cleanUsername(username.value),
    age: Number(age.value),
    display_name: cleanUsername(username.value)
  };

  const { error: insErr } = await supabase.from("profiles").insert(payload);
  if (!insErr) return;

  const { error: upErr } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (upErr) throw upErr;
}

createBtn.addEventListener("click", async () => {
  msg.textContent = "";
  const err = validate();
  if (err) {
    msg.textContent = err;
    return;
  }

  createBtn.disabled = true;

  try {
    const un = cleanUsername(username.value);

    msg.textContent = "Checking username…";
    const ok = await usernameAvailable(un);
    if (!ok) {
      msg.textContent = "Username already taken. Choose another.";
      createBtn.disabled = false;
      return;
    }

    msg.textContent = "Creating account…";

    const em = clean(email.value);
    const pw = String(password.value || "");

    const emailRedirectTo = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "")}/login.html`;

    const { data, error } = await supabase.auth.signUp({
      email: em,
      password: pw,
      options: { emailRedirectTo }
    });

    if (error) {
      msg.textContent = error.message;
      createBtn.disabled = false;
      return;
    }

    const userId = data?.user?.id;

    if (!userId) {
      msg.textContent = "Account created. Check your email to confirm, then login.";
      createBtn.disabled = false;
      return;
    }

    try {
      await saveProfile(userId);
      msg.textContent = "Check your email to confirm, then login.";
    } catch (e) {
      msg.textContent = e?.message || "Account created. Confirm email, then login.";
    } finally {
      createBtn.disabled = false;
    }
  } catch (e) {
    msg.textContent = e?.message || "Signup failed.";
    createBtn.disabled = false;
  }
});
