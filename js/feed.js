import { supabase } from "./supabaseClient.js";

const feed = document.getElementById("feed");

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

function authorName(p) {
  const u = p?.profiles?.username?.trim();
  const d = p?.profiles?.display_name?.trim();
  const e = p?.profiles?.email?.trim();
  if (u) return u;
  if (d) return d;
  if (e) return e.split("@")[0];
  return "RR Member";
}

async function sharePost(id, title) {
  const url = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, "")}post.html?id=${id}`;
  const text = "Rathiri Rowdies post";

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (_) {}
  }

  await navigator.clipboard.writeText(url);
  alert("Link copied!");
}

function wireActions() {
  document.querySelectorAll("[data-more]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-more");
      const body = document.querySelector(`[data-body="${id}"]`);
      if (!body) return;

      const expanded = body.classList.contains("is-expanded");
      body.classList.toggle("is-expanded", !expanded);
      body.classList.toggle("is-collapsed", expanded);
      btn.textContent = expanded ? "More" : "Less";
    });
  });

  document.querySelectorAll("[data-share]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-share");
      const title = btn.getAttribute("data-title") || "RR Post";
      await sharePost(id, title);
    });
  });
}

async function loadFeed() {
  feed.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,body,created_at,is_published,profiles:author_id(username,display_name,email)")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    feed.innerHTML = `<div class="card">Failed to load posts.</div>`;
    return;
  }

  if (!data?.length) {
    feed.innerHTML = `<div class="card">No posts yet.</div>`;
    return;
  }

  feed.innerHTML = data.map(p => {
    const author = authorName(p);
    const created = new Date(p.created_at).toLocaleString();
    const safeBody = sanitizeForDisplay(p.body || "");
    const title = escapeHtml(p.title || "");

    return `
      <div class="card">
        <div class="meta">${escapeHtml(author)} • ${created}</div>

        <div class="title" style="font-size:20px;">
          ${title}
        </div>

        <div class="post-body is-collapsed" data-body="${p.id}">
          ${safeBody}
        </div>

        <div class="post-actions">
          <button class="btn" data-more="${p.id}">More</button>
          <button class="btn" data-share="${p.id}" data-title="${title}">Share</button>
          <a class="btn" href="./post.html?id=${p.id}">Comments</a>
        </div>
      </div>
    `;
  }).join("");

  wireActions();
}

loadFeed();
