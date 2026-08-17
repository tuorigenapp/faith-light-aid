import { createFileRoute } from "@tanstack/react-router";
import coverFallback from "@/assets/e3d-book.png";
import { EBOOKS, LIBRARY_RULES, matchesQuery } from "@/lib/biblioteca";
import { useBiblioteca } from "@/hooks/use-biblioteca";
import { Download, Lock, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

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

const PAGE_SIZE = 10;

function BookSkeleton() {
  return (
    <div className="rounded-[16px] overflow-hidden border border-border/60 bg-card shadow-soft animate-pulse">
      <div className="w-full aspect-[3/4] bg-muted" />
      <div className="p-2.5 space-y-2">
        <div className="h-11 w-full rounded-[10px] bg-muted" />
      </div>
    </div>
  );
}

function Biblioteca() {
  const { state, unlock, isLoading } = useBiblioteca();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const isPaid = state?.plan === "camino";
  const remaining = state?.remaining ?? 0;

  const filtered = useMemo(() => EBOOKS.filter((b) => matchesQuery(b, query)), [query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const clearSearch = () => {
    setQuery("");
    setPage(1);
  };

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

      <div className="mt-5 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por nombre del libro…"
          aria-label="Buscar libro por nombre"
          className="h-12 w-full rounded-[12px] border border-border bg-card pl-10 pr-10 text-[14.5px] outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full grid place-items-center text-muted-foreground hover:text-foreground active:scale-90 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <BookSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center text-center gap-3 py-10">
          <span className="w-14 h-14 rounded-full bg-secondary grid place-items-center">
            <Search className="w-6 h-6 text-muted-foreground" />
          </span>
          <p className="font-display font-bold text-[16px]">No encontramos ese libro</p>
          <p className="text-[13.5px] text-muted-foreground max-w-[280px]">
            Intenta con otro nombre o revisa la ortografía. También puedes explorar todo el catálogo.
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="mt-1 h-11 px-5 rounded-[12px] bg-secondary text-foreground font-semibold text-[14px] active:scale-[.98] transition-transform"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {pageItems.map((b, i) => {
              const open = state?.unlocked.has(b.id) ?? false;
              return (
                <article
                  key={b.id}
                  className="rounded-[16px] overflow-hidden border border-border/60 bg-card shadow-soft"
                  style={{ animation: `fade-in .35s ease-out ${Math.min(i, 12) * 35}ms both` }}
                >
                  <img
                    src={b.cover}
                    alt={`Portada de ${b.title}`}
                    loading="lazy"
                    className="w-full aspect-[3/4] object-cover bg-secondary"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.dataset["fallback"]) return;
                      el.dataset["fallback"] = "1";
                      el.src = coverFallback;
                    }}
                  />
                  <div className="p-2.5 space-y-2">
                    <p className="text-[12.5px] font-semibold leading-snug line-clamp-2 min-h-[32px]">{b.title}</p>
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

          {totalPages > 1 && (
            <nav aria-label="Paginación de la biblioteca" className="mt-6 flex items-center justify-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="h-10 px-3 rounded-[10px] border border-border bg-card text-[13px] font-semibold disabled:opacity-40 active:scale-[.97] transition-transform"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    aria-current={n === safePage ? "page" : undefined}
                    className={
                      n === safePage
                        ? "h-10 w-10 rounded-[10px] bg-primary text-primary-foreground text-[13px] font-bold"
                        : "h-10 w-10 rounded-[10px] border border-border bg-card text-[13px] font-semibold active:scale-[.97] transition-transform"
                    }
                  >
                    {n}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="h-10 px-3 rounded-[10px] border border-border bg-card text-[13px] font-semibold disabled:opacity-40 active:scale-[.97] transition-transform"
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
