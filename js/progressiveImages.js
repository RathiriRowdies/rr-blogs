export function wireProgressiveImages() {
  const nodes = document.querySelectorAll("[data-thumb][data-full]");
  if (!nodes.length) return;

  const io = new IntersectionObserver(async (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;

      const wrap = e.target;
      io.unobserve(wrap);

      const thumbUrl = wrap.getAttribute("data-thumb");
      const fullUrl = wrap.getAttribute("data-full");

      const thumbImg = new Image();
      thumbImg.src = thumbUrl;
      thumbImg.className = "lqip";
      thumbImg.alt = wrap.getAttribute("data-alt") || "post image";

      const fullImg = new Image();
      fullImg.src = fullUrl;
      fullImg.className = "full";
      fullImg.alt = thumbImg.alt;

      wrap.innerHTML = "";
      wrap.classList.add("imgwrap");
      wrap.appendChild(thumbImg);
      wrap.appendChild(fullImg);

      // decode() helps avoid flicker
      try { await fullImg.decode(); } catch(_) {}
      fullImg.classList.add("is-loaded");
    }
  }, { rootMargin: "200px" });

  nodes.forEach(n => io.observe(n));
}
