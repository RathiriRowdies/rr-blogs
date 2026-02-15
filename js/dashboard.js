import { supabase } from "./supabaseClient.js";
import { requireAuth, getMyProfile } from "./auth.js";
import { wireEditor, getEditorHtml } from "./editor.js";

const who = document.getElementById("who");
const myPosts = document.getElementById("myPosts");
const msg = document.getElementById("msg");
const authorNameEl = document.getElementById("authorName");

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

function setCreateOpen(open) {
  const panel = document.getElementById("createPanel");
  const btn = document.getElementById("toggleCreate");
  if (!panel || !btn) return;

  panel.classList.toggle("is-open", open);
  btn.textContent = open ? "Close" : "Create";
}

async function loadMyPosts(uid) {
  myPosts.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at,is_published")
    .eq("author_id", uid)
    .order("created_at", { ascending: false });

  if (error) {
    myPosts.innerHTML = `<div class="card">Failed.</div>`;
    return { count: 0 };
  }

  myPosts.innerHTML =
    (data || [])
      .map(
        (p) => `
        <div class="card">
          <div class="meta">${new Date(p.created_at).toLocaleString()} • ${
          p.is_published ? "published" : "draft"
        }</div>
          <div class="title" style="font-size:18px;">
            <a href="./post.html?id=${p.id}">${escapeHtml(p.title)}</a>
          </div>
        </div>
      `
      )
      .join("") || `<div class="card">No posts yet.</div>`;

  return { count: (data || []).length };
}

async function init() {
  const session = await requireAuth();
  if (!session) return;

  wireEditor();

  const profile = await getMyProfile();
  const name = pickName(profile);
  if (who) who.textContent = `Signed in as ${name}`;
  if (authorNameEl) authorNameEl.textContent = name;

  const { count } = await loadMyPosts(session.user.id);

  if (count === 0) setCreateOpen(true);

  document.getElementById("publishBtn").addEventListener("click", async () => {
    msg.textContent = "Publishing…";

    const titleEl = document.getElementById("title");
    const editorEl = document.getElementById("editor");

    const title = (titleEl?.value || "").trim();
    const bodyHtml = getEditorHtml();

    if (!title) {
      msg.textContent = "Title required.";
      return;
    }
    if (!bodyHtml) {
      msg.textContent = "Post content required.";
      return;
    }

    const { error } = await supabase.from("posts").insert({
      author_id: session.user.id,
      title,
      body: bodyHtml,
      is_published: true
    });

    if (error) {
      msg.textContent = error.message;
      return;
    }

    msg.textContent = "Published.";
    if (titleEl) titleEl.value = "";
    if (editorEl) editorEl.innerHTML = "";

    await loadMyPosts(session.user.id);

    // If you want auto-collapse after publish, uncomment:
    // setCreateOpen(false);
  });
}

init();
