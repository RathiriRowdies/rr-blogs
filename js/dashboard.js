import { supabase } from "./supabaseClient.js";
import { requireAuth, getMyProfile } from "./auth.js";
import { wireEditor, getEditorHtml } from "./editor.js";

const who = document.getElementById("who");
const myPosts = document.getElementById("myPosts");
const msg = document.getElementById("msg");

async function loadMyPosts(uid) {
  myPosts.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at,is_published")
    .eq("author_id", uid)
    .order("created_at", { ascending: false });

  if (error) {
    myPosts.innerHTML = `<div class="card">Failed.</div>`;
    return;
  }

  myPosts.innerHTML = data.map(p => `
    <div class="card">
      <div class="meta">${new Date(p.created_at).toLocaleString()} • ${p.is_published ? "published" : "draft"}</div>
      <div class="title" style="font-size:18px;">
        <a href="/post.html?id=${p.id}">${escapeHtml(p.title)}</a>
      </div>
    </div>
  `).join("") || `<div class="card">No posts yet.</div>`;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function init() {
  const session = await requireAuth();
  if (!session) return;

  wireEditor();

  const profile = await getMyProfile();
  who.textContent = profile ? `Signed in as ${profile.email}` : "Signed in";

  await loadMyPosts(session.user.id);

  document.getElementById("publishBtn").addEventListener("click", async () => {
    msg.textContent = "Publishing…";

    const title = document.getElementById("title").value.trim();
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
    document.getElementById("title").value = "";
    document.getElementById("editor").innerHTML = "";

    await loadMyPosts(session.user.id);
  });
}

init();
