import { supabase } from "./supabaseClient.js";
import { requireAdmin } from "./auth.js";

const allPosts = document.getElementById("allPosts");

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

async function getPinnedCount() {
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("is_pinned", true);

  if (error) return 0;
  return count ?? 0;
}

async function togglePublish(data, id) {
  const row = data.find((x) => x.id === id);
  if (!row) return;

  await supabase
    .from("posts")
    .update({ is_published: !row.is_published })
    .eq("id", id);
}

async function togglePin(data, id) {
  const row = data.find((x) => x.id === id);
  if (!row) return;

  if (!row.is_pinned) {
    const currentPinned = await getPinnedCount();
    if (currentPinned >= 5) {
      alert("You can pin at most 5 posts.");
      return;
    }
  }

  await supabase
    .from("posts")
    .update({ is_pinned: !row.is_pinned })
    .eq("id", id);
}

async function deletePost(id) {
  const ok = confirm("Delete this post?");
  if (!ok) return;

  await supabase
    .from("posts")
    .delete()
    .eq("id", id);
}

function render(data, pinnedCount) {
  if (!data?.length) {
    allPosts.innerHTML = `<div class="card">No posts found.</div>`;
    return;
  }

  allPosts.innerHTML = data
    .map((p) => {
      const author = pickName(p.profiles);
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
            <a class="btn" href="./post.html?id=${p.id}">Open</a>

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

          ${
            pinDisabled
              ? `<div class="meta" style="margin-top:10px;">Pinned limit reached (5).</div>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

async function load() {
  const admin = await requireAdmin();
  if (!admin) return;

  allPosts.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at,is_published,is_pinned,profiles:author_id(username,display_name,email)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    allPosts.innerHTML = `<div class="card">Failed.</div>`;
    return;
  }

  const pinnedCount = await getPinnedCount();
  render(data, pinnedCount);

  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-toggle"));
      await togglePublish(data, id);
      await load();
    });
  });

  document.querySelectorAll("[data-pin]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-pin"));
      await togglePin(data, id);
      await load();
    });
  });

  document.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-del"));
      await deletePost(id);
      await load();
    });
  });
}

load();
