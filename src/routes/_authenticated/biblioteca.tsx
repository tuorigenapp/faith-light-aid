import { createFileRoute } from "@tanstack/react-router";
import { EBOOKS, LIBRARY_RULES } from "@/lib/biblioteca";
import { useBiblioteca } from "@/hooks/use-biblioteca";
import { Download, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca Digital — ORIGEN" },
      { name: "description", content: "Descarga los libros de ORIGEN: lecturas que acompañan tu proceso de sanación y reconexión." },
      { property: "og:title", content: "Biblioteca Digital — ORIGEN" },
      { property: "og:description", content: "Libros para acompañar tu camino de sanación y reconexión." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Biblioteca,
});

function Biblioteca() {
  const { state, unlock, isLoading } = useBiblioteca();
  const isPaid = state?.plan === "camino";
  const remaining = state?.remaining ?? 0;

  const handle = async (bookId: string, files: string[], index: number) => {
    const already = state?.unlocked.has(bookId);
    if (!already) {
      if (remaining <= 0) {
        toast.error(
          isPaid
            ? "Ya desbloqueaste tus 2 libros de esta semana. El lunes se renueva tu cupo."
            : "El plan Explorador incluye 1 libro. Activa Camino ORIGEN para desbloquear 2 libros cada semana.",
        );
        return;
      }
      const ok = await unlock(bookId);
      if (!ok) {
        toast.error("No pudimos registrar tu descarga. Intenta de nuevo.");
        return;
      }
      toast.success("Libro desbloqueado. Tu descarga comienza ahora.");
    }
    window.open(files[index], "_blank", "noopener,noreferrer");
  };

  return (
    <div className="px-4 py-6 md:px-6 max-w-[1100px] mx-auto mobile-safe-bottom lg:pb-10">
      <h1 className="font-display font-extrabold text-[28px] leading-tight">Biblioteca Digital</h1>
      <p className="text-muted-foreground mt-2 text-[15px]">
        Lecturas para acompañar tu proceso. Descárgalas y léelas cuando quieras.
      </p>

      <div className="mt-4 rounded-[16px] border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-[12px] bg-primary/10 text-primary grid place-items-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="font-display font-bold text-[15px] leading-tight">
              {isPaid ? "Camino ORIGEN · 2 libros por semana" : "Explorador · 1 libro incluido"}
            </p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              {isLoading
                ? "Revisando tu cupo…"
                : remaining > 0
                  ? `Te quedan ${remaining} de ${state?.limit ?? LIBRARY_RULES.freeTotal} por desbloquear.`
                  : isPaid
                    ? "Cupo semanal completo. Se renueva el lunes."
                    : "Ya usaste tu libro incluido."}
            </p>
          </div>
        </div>
        {!isPaid && (
          <Link
            to="/membresia"
            className="mt-3 flex h-12 items-center justify-center rounded-[12px] bg-primary/10 text-primary font-semibold text-[14px] active:scale-[.98] transition-transform"
          >
            Desbloquear 2 libros cada semana
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {EBOOKS.map((b, i) => {
          const open = state?.unlocked.has(b.id) ?? false;
          return (
            <article
              key={b.id}
              className="rounded-[16px] overflow-hidden border border-border/60 bg-card shadow-soft"
              style={{ animation: `fade-in .35s ease-out ${Math.min(i, 12) * 35}ms both` }}
            >
              <img
                src={b.cover}
                alt="Portada de libro de la Biblioteca Digital ORIGEN"
                loading="lazy"
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="p-2.5 space-y-2">
                {b.files.map((f, idx) => (
                  <button
                    key={f + idx}
                    type="button"
                    onClick={() => handle(b.id, b.files, idx)}
                    className={
                      open
                        ? "flex h-11 w-full items-center justify-center gap-1.5 rounded-[10px] bg-primary text-primary-foreground text-[12.5px] font-bold uppercase tracking-wide active:scale-[.98] transition-transform"
                        : "flex h-11 w-full items-center justify-center gap-1.5 rounded-[10px] bg-secondary text-foreground text-[12.5px] font-bold uppercase tracking-wide active:scale-[.98] transition-transform"
                    }
                  >
                    {open ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {b.files.length > 1 ? `Descargar ${idx + 1}` : "Descargar ahora"}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
