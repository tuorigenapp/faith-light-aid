import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Copy, Facebook, Mail, MessageCircle, Send, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { sharePreviewFor } from "@/lib/share-previews";

/** Botón flotante para compartir la sección actual; el enlace muestra su tarjeta con imagen y título. */
export function ShareSection() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const preview = sharePreviewFor(pathname);
  const url = `https://tuorigen.app${pathname}`;
  const title = preview?.title ?? "ORÍGEN";
  const text = `${preview?.description ?? "Sana tu historia con Dios."}`;
  const msg = encodeURIComponent(`${title}\n${text}\n${url}`);

  const targets = [
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${msg}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: "X", icon: Share2, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: "Correo", icon: Mail, href: `mailto:?subject=${encodeURIComponent(title)}&body=${msg}` },
  ];

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* la persona cerró el menú */
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Compartir esta sección"
        className="fixed left-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-primary shadow-soft transition active:scale-[.97] lg:bottom-6"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 100px)" }}
      >
        <Share2 className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid items-end bg-foreground/40 sm:place-items-center" onClick={() => setOpen(false)}>
          <div
            className="w-full rounded-t-[24px] bg-card p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-xl sm:max-w-[420px] sm:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-[19px] font-bold text-foreground">Compartir esta sección</h2>
                <p className="text-[13px] text-muted-foreground">Llegará con su imagen y una invitación a entrar.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            {preview && (
              <div className="mt-4 overflow-hidden rounded-[16px] border border-border">
                <img src={preview.image} alt="" className="aspect-[1200/630] w-full object-cover" loading="lazy" />
                <div className="p-3">
                  <p className="text-[14px] font-semibold text-foreground">{preview.title}</p>
                  <p className="text-[12px] text-muted-foreground">{preview.description}</p>
                </div>
              </div>
            )}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {targets.map((t) => (
                <a key={t.label} href={t.href} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-[12px] font-medium text-foreground">
                  <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-primary/10 text-primary">
                    <t.icon className="h-5 w-5" />
                  </span>
                  {t.label}
                </a>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(url);
                  toast.success("Enlace copiado");
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-primary/10 text-[14px] font-semibold text-primary"
              >
                <Copy className="h-4 w-4" /> Copiar enlace
              </button>
              <button onClick={nativeShare} className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-primary text-[14px] font-semibold text-primary-foreground">
                <Share2 className="h-4 w-4" /> Más opciones
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
