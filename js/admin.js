import { supabase } from "./supabaseClient.js";
import { requireAdmin } from "./auth.js";

const allPosts = document.getElementById("allPosts");
const adminMsg = document.getElementById("adminMsg");

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function statusBadge(isPublished) {
  const label = isPublished ? "published" : "unpublished";
  const color = isPublished ? "black" : "red";
  return `<span class="meta" style="border:1px solid var(--border); padding:4px 8px; border-radius:999px; color:${color};">${label}</span>`;
}

async function load() {
  adminMsg.textContent = "";

  const admin = await requireAdmin();
  if (!admin) return;

  allPosts.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at,is_published,profiles:author_id(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    adminMsg.textContent = error.message;
    allPosts.innerHTML = `<div class="card">Failed to load posts.</div>`;
    return;
  }

  if (!data || data.length === 0) {
    allPosts.innerHTML = `<div class="card">No posts found.</div>`;
    return;
  }

  adminMsg.textContent = `Loaded ${data.length} posts.`;

  allPosts.innerHTML = data.map(p => {
    const email = p.profiles?.email || "user";
    const created = new Date(p.created_at).toLocaleString();
    const badge = statusBadge(p.is_published);

    return `
      <div class="card">
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
          <div>
            <div class="meta">${escapeHtml(email)} • ${created}</div>
            <div class="title" style="font-size:18px; margin-top:6px;">
              <a href="./post.html?id=${p.id}">${escapeHtml(p.title)}</a>
            </div>
          </div>
          <div>${badge}</div>
        </div>

        <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
          <button class="btn" data-toggle="${p.id}">
            ${p.is_published ? "Unpublish" : "Publish"}
          </button>
          <button class="btn" data-del="${p.id}">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const postId = Number(btn.getAttribute("data-toggle"));
      const row = data.find(x => x.id === postId);
      if (!row) return;

      btn.disabled = true;

      const { error } = await supabase
        .from("posts")
        .update({ is_published: !row.is_published })
        .eq("id", postId);

      btn.disabled = false;

      if (error) {
        adminMsg.textContent = error.message;
        return;
      }

      load();
    });
  });

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const postId = Number(btn.getAttribute("data-del"));
      if (!confirm("Delete this post?")) return;

      btn.disabled = true;

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      btn.disabled = false;

      if (error) {
        adminMsg.textContent = error.message;
        return;
      }

      load();
    });
  });
}

load();
