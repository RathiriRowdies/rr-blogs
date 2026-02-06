import { supabase } from "./supabaseClient.js";

function applyColor(color) {
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("foreColor", false, color);
}

function applyFont(font) {
  // execCommand fontName works in most browsers
  document.execCommand("fontName", false, font);
}

function sanitizeBasic(html) {
  // very basic safety: remove script/style/iframe and inline event handlers
  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll("script,style,iframe,object,embed").forEach(n => n.remove());

  // remove on* handlers
  doc.querySelectorAll("*").forEach(el => {
    [...el.attributes].forEach(attr => {
      const n = attr.name.toLowerCase();
      if (n.startsWith("on")) el.removeAttribute(attr.name);
    });
  });

  return doc.body.innerHTML;
}

async function uploadImage(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `editor/${fileName}`;

  const { error: upErr } = await supabase
    .storage
    .from("rr-post-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from("rr-post-images").getPublicUrl(path);
  return data.publicUrl;
}

function insertImage(editor, url, layout) {
  // Resizable wrapper
  const wrapper = document.createElement("div");
  wrapper.className = layout === "full" ? "figure-full" : "figure-inline";

  const resizable = document.createElement("div");
  resizable.className = "resizable";
  resizable.style.width = layout === "full" ? "100%" : "260px"; // default sizes

  const img = document.createElement("img");
  img.src = url;
  img.alt = "post image";

  resizable.appendChild(img);
  wrapper.appendChild(resizable);

  // Insert at caret
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    editor.appendChild(wrapper);
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(wrapper);

  // Move caret after image
  range.setStartAfter(wrapper);
  range.setEndAfter(wrapper);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function wireEditor() {
  const editor = document.getElementById("editor");
  const fontSelect = document.getElementById("fontSelect");

  const colorBlack = document.getElementById("colorBlack");
  const colorRed = document.getElementById("colorRed");
  const colorBlue = document.getElementById("colorBlue");

  const boldBtn = document.getElementById("boldBtn");
  const italicBtn = document.getElementById("italicBtn");

  const imgFile = document.getElementById("imgFile");
  const imgInlineBtn = document.getElementById("imgInlineBtn");
  const imgFullBtn = document.getElementById("imgFullBtn");

  if (!editor) return;

  fontSelect?.addEventListener("change", () => applyFont(fontSelect.value));
  colorBlack?.addEventListener("click", () => applyColor("black"));
  colorRed?.addEventListener("click", () => applyColor("red"));
  colorBlue?.addEventListener("click", () => applyColor("blue"));

  boldBtn?.addEventListener("click", () => document.execCommand("bold"));
  italicBtn?.addEventListener("click", () => document.execCommand("italic"));

  let pendingLayout = "inline";

  imgInlineBtn?.addEventListener("click", () => {
    pendingLayout = "inline";
    imgFile.click();
  });

  imgFullBtn?.addEventListener("click", () => {
    pendingLayout = "full";
    imgFile.click();
  });

  imgFile?.addEventListener("change", async () => {
    const file = imgFile.files?.[0];
    if (!file) return;

    // Basic type guard
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
