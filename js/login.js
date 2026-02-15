import { supabase } from "./supabaseClient.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const msg = document.getElementById("msg");

function clean(s) {
  return String(s || "").trim();
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  msg.textContent = "Signing in…";

  const em = clean(email.value);
  const pw = String(password.value || "");

  if (!em || !pw) {
    msg.textContent = "Email and password required.";
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: em,
    password: pw
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  if (!data?.session) {
    msg.textContent = "Please confirm your email, then sign in.";
    return;
  }

  msg.textContent = "Success. Redirecting…";
  window.location.href = "./dashboard.html";
});

document.getElementById("signupBtn").addEventListener("click", () => {
  window.location.href = "./signup.html";
});
