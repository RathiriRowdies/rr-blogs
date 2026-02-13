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

function validate() {
  const fn = clean(firstName.value);
  const ln = clean(lastName.value);
  const un = clean(username.value);
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

async function upsertProfile(userId) {
  const payload = {
    id: userId,
    email: clean(email.value),
    first_name: clean(firstName.value),
    last_name: clean(lastName.value),
    username: clean(username.value),
    age: Number(age.value),
    display_name: clean(username.value)
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) throw error;
}

createBtn.addEventListener("click", async () => {
  msg.textContent = "";
  const err = validate();
  if (err) {
    msg.textContent = err;
    return;
  }

  createBtn.disabled = true;
  msg.textContent = "Creating account…";

  const em = clean(email.value);
  const pw = String(password.value || "");

  const { data, error } = await supabase.auth.signUp({
    email: em,
    password: pw
  });

  if (error) {
    msg.textContent = error.message;
    createBtn.disabled = false;
    return;
  }

  const userId = data?.user?.id;
  if (!userId) {
    msg.textContent = "Signup created. Please verify your email, then login.";
    createBtn.disabled = false;
    return;
  }

  try {
    await upsertProfile(userId);
    msg.textContent = "Check your email to confirm, then login.";
  } catch (e) {
    msg.textContent = e?.message || "Profile save failed. Please login after confirming email.";
  } finally {
    createBtn.disabled = false;
  }
});
