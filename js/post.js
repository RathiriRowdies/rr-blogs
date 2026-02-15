import { supabase } from "./supabaseClient.js";
import { getSession } from "./auth.js";
import { wireProgressiveImages } from "./progressiveImages.js";

const postEl = document.getElementById("post");
const commentsEl = document.getElementById("comments");
const msg = document.getElementById("msg");

const id = new URLSearchParams(location.search).get("id");

document.getElementById("shareBtn").addEventListener("click", async () => {
  const url = window.location.href;
  const title = "RR Post";
  const text = "Rathiri Rowdies post";

  if (navigator.share) {
    try { await navigator.share({ title, text, url }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(url);
    alert("Link copied!");
  }
});

function sanitizeForDisplay(html) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed").forEach(n => n.remove());
  doc.querySelectorAll("*").forEach(el => {
    [...el.attributes].forEach(a => {
      const n = a.name.toLowerCase();
      if (n.startsWith("on")) el.removeAttribute(a.name);
    });
  });
  return doc.body.innerHTML;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pickName(profile) {
  const u = profile?.username?.trim();
  const d = profile?.display_name?.trim();
  const e = profile?.email?.trim();
  if (u) return u;
  if (d) return d;
  if (e) return e.split("@")[0];
  return "RR Member";
}

async function loadPost() {
  postEl.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,body,created_at,font_color,image_thumb_path,image_full_path,profiles:author_id(username,display_name,email)")
    .eq("id", id)
    .single();

  if (error || !data) {
    postEl.innerHTML = `<div class="card">Post not found.</div>`;
    return;
  }

  const author = pickName(data.profiles);
  const created = new Date(data.created_at).toLocaleString();

  const imgBlock = (data.image_thumb_path && data.image_full_path)
    ? `<div class="imgwrap" data-thumb="${data.image_thumb_path}" data-full="${data.image_full_path}" data-alt="${escapeHtml(data.title)}"></div><div style="height:12px"></div>`
    : "";

  const safeBody = sanitizeForDisplay(data.body || "");

  postEl.innerHTML = `
    <div class="card">
      <div class="meta">${escapeHtml(author)} • ${created}</div>
      <h1 class="title">${escapeHtml(data.title)}</h1>
      ${imgBlock}
      <div class="user-post" data-color="${data.font_color || "black"}">
        ${safeBody}
      </div>
    </div>
  `;

  wireProgressiveImages();
}

async function loadComments() {
  commentsEl.innerHTML = `Loading…`;

  const { data, error } = await supabase
    .from("comments")
    .select("id,body,created_at,profiles:author_id(username,display_name,email)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    commentsEl.innerHTML = `Failed to load.`;
    return;
  }

  commentsEl.innerHTML = (data || []).map(c => {
    const name = pickName(c.profiles);
    const when = new Date(c.created_at).toLocaleString();
    return `
      <div style="margin:10px 0;">
        <div class="meta">${escapeHtml(name)} • ${when}</div>
        <div>${escapeHtml(c.body)}</div>
      </div>
    `;
  }).join("") || `<div class="meta">No comments yet.</div>`;
}

document.getElementById("commentBtn").addEventListener("click", async () => {
  msg.textContent = "Posting…";

  const session = await getSession();
  if (!session) {
    msg.textContent = "Please login to comment.";
    return;
  }

  const body = document.getElementById("commentBody").value.trim();
  if (!body) {
    msg.textContent = "Comment required.";
    return;
  }

  const { error } = await supabase.from("comments").insert({
    post_id: Number(id),
    author_id: session.user.id,
    body
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  document.getElementById("commentBody").value = "";
  msg.textContent = "Posted.";
  await loadComments();
});

loadPost();
loadComments();
