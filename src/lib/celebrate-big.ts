/**
 * Celebración grande y centrada: emoji 3D gigante + fondo difuminado.
 * Se inyecta en el DOM para poder usarse desde cualquier parte sin provider.
 */
export function celebrateBig(opts: { emoji?: string; title: string; body?: string; ms?: number }) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const ms = opts.ms ?? 2200;

  document.querySelectorAll("[data-origen-celebration]").forEach((n) => n.remove());

  const wrap = document.createElement("div");
  wrap.setAttribute("data-origen-celebration", "");
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");
  wrap.style.cssText =
    "position:fixed;inset:0;z-index:9998;display:grid;place-items:center;padding:24px;" +
    "background:rgba(27,25,48,.42);backdrop-filter:blur(10px);pointer-events:none;" +
    (reduce ? "" : "animation:origen-cel-in .28s ease-out both");

  const emojiHtml = opts.emoji
    ? `<img src="${opts.emoji}" alt="" width="180" height="180" style="width:min(46vw,180px);height:auto;object-fit:contain;${
        reduce ? "" : "animation:origen-cel-pop .5s cubic-bezier(.2,1.4,.4,1) both"
      }" />`
    : "";

  wrap.innerHTML = `
    <div style="text-align:center;max-width:380px">
      ${emojiHtml}
      <p style="margin:16px 0 0;font-family:Sora,Manrope,sans-serif;font-weight:800;font-size:26px;line-height:1.15;color:#fff">${opts.title}</p>
      ${opts.body ? `<p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:rgba(255,255,255,.82)">${opts.body}</p>` : ""}
    </div>`;

  document.body.appendChild(wrap);
  window.setTimeout(() => {
    wrap.style.transition = "opacity .3s ease-out";
    wrap.style.opacity = "0";
    window.setTimeout(() => wrap.remove(), 320);
  }, ms);
}
