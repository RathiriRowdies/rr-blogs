import { supabase } from "./supabaseClient.js";

function applyColor(color) {
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("foreColor", false, color);
}

function applyFont(font) {
  document.execCommand("fontName", false, font);
}

function sanitizeBasic(html) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");

  doc.querySelectorAll("script,style,iframe,object,embed").forEach((n) => n.remove());

  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || "");

      if (name.startsWith("on")) el.removeAttribute(attr.name);

      if (name === "href") {
        const v = value.trim().toLowerCase();
        if (v.startsWith("javascript:")) el.removeAttribute("href");
      }
    });
  });

  return doc.body.innerHTML;
}

async function uploadImage(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `editor/${fileName}`;

  const { error: upErr } = await supabase.storage
    .from("rr-post-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from("rr-post-images").getPublicUrl(path);
  return data.publicUrl;
}

function insertImage(editor, url, layout) {
  const wrapper = document.createElement("div");
  wrapper.className = layout === "full" ? "figure-full" : "figure-inline";

  const resizable = document.createElement("div");
  resizable.className = "resizable";
  resizable.style.width = layout === "full" ? "100%" : "260px";

  const img = document.createElement("img");
  img.src = url;
  img.alt = "post image";

  resizable.appendChild(img);
  wrapper.appendChild(resizable);

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    editor.appendChild(wrapper);
    return;
  }

  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(wrapper);

  range.setStartAfter(wrapper);
  range.setEndAfter(wrapper);
  sel.removeAllRanges();
  sel.addRange(range);
}

function normalizeUrl(raw) {
  const v = String(raw || "").trim();
  if (!v) return "";

  if (/^https?:\/\//i.test(v)) return v;
  if (/^mailto:/i.test(v)) return v;
  if (/^tel:/i.test(v)) return v;

  return `https://${v}`;
}

function insertLink(editor) {
  const raw = prompt("Paste link URL:");
  const url = normalizeUrl(raw);
  if (!url) return;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);

  if (range.collapsed) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = url;

    range.insertNode(a);
    range.setStartAfter(a);
    range.setEndAfter(a);
    sel.removeAllRanges();
    sel.addRange(range);
    editor.focus();
    return;
  }

  document.execCommand("createLink", false, url);

  const anchor = sel.anchorNode?.parentElement?.closest("a");
  if (anchor) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }

  editor.focus();
}

export function wireEditor() {
  const editor = document.getElementById("editor");
  if (!editor) return;

  const fontSelect = document.getElementById("fontSelect");

  const colorBlack = document.getElementById("colorBlack");
  const colorRed = document.getElementById("colorRed");
  const colorBlue = document.getElementById("colorBlue");

  const boldBtn = document.getElementById("boldBtn");
  const italicBtn = document.getElementById("italicBtn");

  const imgFile = document.getElementById("imgFile");

  const insertInline = document.getElementById("insertInline");
  const insertFull = document.getElementById("insertFull");
  const insertLinkBtn = document.getElementById("insertLink");

  if (fontSelect) fontSelect.addEventListener("change", () => applyFont(fontSelect.value));

  colorBlack?.addEventListener("click", () => applyColor("black"));
  colorRed?.addEventListener("click", () => applyColor("red"));
  colorBlue?.addEventListener("click", () => applyColor("blue"));

  boldBtn?.addEventListener("click", () => document.execCommand("bold"));
  italicBtn?.addEventListener("click", () => document.execCommand("italic"));

  let pendingLayout = "inline";

  insertInline?.addEventListener("click", () => {
    pendingLayout = "inline";
    imgFile?.click();
  });

  insertFull?.addEventListener("click", () => {
    pendingLayout = "full";
    imgFile?.click();
  });

  insertLinkBtn?.addEventListener("click", () => {
    insertLink(editor);
  });

  imgFile?.addEventListener("change", async () => {
    const file = imgFile.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      imgFile.value = "";
      return;
    }

    try {
      const url = await uploadImage(file);
      insertImage(editor, url, pendingLayout);
    } catch (e) {
      alert(e?.message || "Image upload failed");
    } finally {
      imgFile.value = "";
    }
  });
}

export function getEditorHtml() {
  const editor = document.getElementById("editor");
  if (!editor) return "";
  return sanitizeBasic(editor.innerHTML.trim());
}
