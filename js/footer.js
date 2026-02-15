import { supabase } from "./supabaseClient.js";

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

export async function initFooter() {
  const pinnedEl = document.getElementById("pinnedLinks");
  if (!pinnedEl) return;

  pinnedEl.innerHTML = `<li class="muted">Loading…</li>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at")
    .eq("is_published", true)
    .eq("is_pinned", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    pinnedEl.innerHTML = `<li class="muted">Failed to load.</li>`;
    return;
  }

  if (!data || data.length === 0) {
    pinnedEl.innerHTML = `<li class="muted">No pinned blogs yet.</li>`;
    return;
  }

  pinnedEl.innerHTML = data.map(p => `
    <li><a href="./post.html?id=${p.id}">${escapeHtml(p.title)}</a></li>
  `).join("");
}
