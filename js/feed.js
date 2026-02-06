import { supabase } from "./supabaseClient.js";
import { wireProgressiveImages } from "./progressiveImages.js";

const feed = document.getElementById("feed");

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function makeExcerpt(html, maxChars = 220) {
  const text = stripHtml(html).trim();
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trim() + "…";
}

async function loadFeed() {
  feed.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,body,created_at,image_thumb_path,image_full_path,profiles:author_id(display_name)")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    feed.innerHTML = `<div class="card">Failed to load posts: ${escapeHtml(error.message)}</div>`;
    return;
  }

  feed.innerHTML = data.map(p => {
    const author = p.profiles?.display_name || "RR Member";
    const created = new Date(p.created_at).toLocaleString();
    const excerpt = makeExcerpt(p.body);

    const imgBlock = (p.image_thumb_path && p.image_full_path)
      ? `<div class="imgwrap" data-thumb="${p.image_thumb_path}" data-full="${p.image_full_path}" data-alt="${escapeHtml(p.title)}"></div>`
      : "";

    return `
      <div class="card">
        <div class="meta">${escapeHtml(author)} • ${created}</div>
        <h2 class="title"><a href="/post.html?id=${p.id}">${escapeHtml(p.title)}</a></h2>
        ${imgBlock}
        <div class="post-excerpt">${escapeHtml(excerpt)}</div>
        <div style="margin-top:10px;">
          <a class="btn" href="/post.html?id=${p.id}">More</a>
        </div>
      </div>
    `;
  }).join("") || `<div class="card">No posts yet.</div>`;

  wireProgressiveImages();
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

loadFeed();
