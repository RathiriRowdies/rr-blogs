import { supabase } from "./supabaseClient.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const msg = document.getElementById("msg");

document.getElementById("loginBtn").addEventListener("click", async () => {
  msg.textContent = "Signing in…";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  // If email not confirmed, Supabase may block session depending on settings
  msg.textContent = "Success. Redirecting…";
  window.location.href = "/dashboard.html";
});

document.getElementById("signupBtn").addEventListener("click", async () => {
  msg.textContent = "Creating account…";

  const { data, error } = await supabase.auth.signUp({
    email: email.value.trim(),
    password: password.value,
    options: {
      mailRedirectTo: "http://localhost:3000/dashboard.html"
    }
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  // Create profile row (RLS allows insert own profile)
  if (data?.user?.id) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      email: email.value.trim(),
      display_name: email.value.trim().split("@")[0],
      role: "user"
    });
  }

  msg.textContent = "Check your email to verify, then sign in.";
});
