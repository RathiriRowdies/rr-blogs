import { supabase } from "./supabaseClient.js";
import { initNav } from "./nav.js";

const RR_ICON_URL =
  "https://btvhnttpeuudhdwkyfnr.supabase.co/storage/v1/object/public/rr-assets/rr-icon.svg";

function headerTemplate() {
  return `
    <div class="nav">
      <div class="brand">
        <img id="brandIcon" src="${RR_ICON_URL}" alt="RR" />
        <span>Rathiri Rowdies (RR)</span>
      </div>

      <div class="navlinks">
        <a href="./index.html">Home</a>
        <a id="navDashboard" href="./dashboard.html" style="display:none;">Dashboard</a>
        <a id="navAdmin" href="./admin.html" style="display:none;">Admin</a>
        <a id="navSettings" href="./settings.html">Settings</a>
        <a id="navLogin" href="./login.html">Login</a>
      </div>
    </div>
  `;
}

function footerTemplate() {
  return `
    <div class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h3>Rathiri Rowdies (RR)</h3>
            <div class="muted">Clean blogs for the RR group.</div>
          </div>

          <div>
            <h3>Contacts</h3>
            <ul class="footer-list">
              <li><a href="mailto:rathirirowdies2024@gmail.com">rathirirowdies2024@gmail.com</a></li>
              <li class="muted">Add socials later</li>
            </ul>
          </div>

          <div>
            <h3>Pinned Blogs</h3>
            <ul id="pinnedBlogs" class="footer-list">
              <li class="muted">Loading…</li>
            </ul>

            <div style="height:10px"></div>

            <div class="footer-actions">
              <a class="btn" href="./assets/resume.pdf" target="_blank" rel="noopener">Resume</a>
              <a class="btn" href="./index.html">Home</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadPinnedBlogs() {
  const el = document.getElementById("pinnedBlogs");
  if (!el) return;

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id,title")
      .eq("is_pinned", true)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!data?.length) {
      el.innerHTML = `<li class="muted">No pinned blogs yet.</li>`;
      return;
    }

    el.innerHTML = data
      .map(
        (p) => `
        <li>
          <a href="./post.html?id=${p.id}">${escapeHtml(p.title)}</a>
        </li>
      `
      )
      .join("");
  } catch (_) {
    el.innerHTML = `<li class="muted">No pinned blogs yet.</li>`;
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function initLayout() {
  const headerMount = document.getElementById("siteHeader");
  const footerMount = document.getElementById("siteFooter");

  if (headerMount) headerMount.innerHTML = headerTemplate();
  if (footerMount) footerMount.innerHTML = footerTemplate();

  await initNav();
  await loadPinnedBlogs();
}
