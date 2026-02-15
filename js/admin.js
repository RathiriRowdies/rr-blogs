import { supabase } from "./supabaseClient.js";
import { requireAdmin } from "./auth.js";

const allPosts = document.getElementById("allPosts");

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function getPinnedCount() {
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("is_pinned", true);

  if (error) return 0;
  return count ?? 0;
}

async function load() {
  const admin = await requireAdmin();
  if (!admin) return;

  allPosts.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at,is_published,is_pinned,profiles:author_id(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    allPosts.innerHTML = `<div class="card">Failed.</div>`;
    return;
  }

  const pinnedCount = await getPinnedCount();

  allPosts.innerHTML = data.map(p => {
    const author = p.profiles?.email || "user";
    const created = new Date(p.created_at).toLocaleString();
    const status = [
      p.is_published ? "published" : "draft",
      p.is_pinned ? "pinned" : null
    ].filter(Boolean).join(" • ");

    const pinDisabled = !p.is_pinned && pinnedCount >= 5;

    return `
      <div class="card">
        <div class="meta">${escapeHtml(author)} • ${created}${status ? ` • ${status}` : ""}</div>
        <div class="title" style="font-size:18px; margin-top:6px;">
          ${escapeHtml(p.title)}
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:12px;">
          <button class="btn" data-toggle="${p.id}">
            ${p.is_published ? "Unpublish" : "Publish"}
          </button>

          <button class="btn" data-pin="${p.id}" ${pinDisabled ? "disabled" : ""}>
            ${p.is_pinned ? "Unpin" : "Pin"}
          </button>

          <button class="btn" data-del="${p.id}">
            Delete
          </button>
        </div>

        ${pinDisabled ? `<div class="meta" style="margin-top:10px;">Pinned limit reached (5).</div>` : ""}
      </div>
    `;
  }).join("") || `<div class="card">No posts found.</div>`;

  document.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-toggle"));
      const row = data.find(x => x.id === id);
      if (!row) return;

      const { error } = await supabase
        .from("posts")
        .update({ is_published: !row.is_published })
        .eq("id", id);

      if (!error) load();
    });
  });

  document.querySelectorAll("[data-pin]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-pin"));
      const row = data.find(x => x.id === id);
      if (!row) return;

      if (!row.is_pinned) {
        const currentPinned = await getPinnedCount();
        if (currentPinned >= 5) {
          alert("You can pin at most 5 posts.");
          return;
        }
      }

      const { error } = await supabase
        .from("posts")
        .update({ is_pinned: !row.is_pinned })
        .eq("id", id);

      if (!error) load();
    });
  });

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-del"));
      if (!confirm("Delete this post?")) return;

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id);

      if (!error) load();
    });
  });
}

load();
