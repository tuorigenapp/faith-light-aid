import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Headphones, Pause, Play, Search, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrls } from "@/hooks/use-signed-urls";
import { usePlayer } from "@/lib/player";
import { normalizeText } from "@/lib/biblioteca";
import { EmptyState } from "@/components/EmptyState";

type Row = {
  id: string;
  title: string;
  affirmation: string;
  audio_url: string | null;
  cover_url: string | null;
  day_index: number;
  category_id: string;
};

/** Buscador de sonidos del Home: reproduce con el reproductor global (sigue en segundo plano). */
export function SonidosHome() {
  const [q, setQ] = useState("");
  const { current, isPlaying } = usePlayer();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sonidos_home"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const [audios, cats] = await Promise.all([
        supabase
          .from("manifest_audios")
          .select("id, title, affirmation, audio_url, cover_url, day_index, category_id")
          .order("day_index")
          .limit(200),
        supabase.from("manifest_categories").select("id, title"),
      ]);
      if (audios.error) throw audios.error;
      const names = new Map((cats.data ?? []).map((c) => [c.id, c.title]));
      return { rows: (audios.data ?? []) as Row[], names };
    },
  });

  const rows = data?.rows ?? [];
  const signCover = useSignedUrls("manifest-audios", rows.map((r) => r.cover_url));

  const filtered = useMemo(() => {
    const needle = normalizeText(q);
    if (!needle) return rows.slice(0, 8);
    return rows
      .filter((r) =>
        normalizeText(`${r.title} ${r.affirmation} ${data?.names.get(r.category_id) ?? ""}`).includes(needle),
      )
      .slice(0, 20);
  }, [q, rows, data]);

  return (
    <section className="app-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary">
            <Headphones className="h-3.5 w-3.5" /> Sonidos de manifestación
          </div>
          <h3 className="mt-1 font-display text-[17px] font-bold leading-tight">Busca tu audio y escúchalo ahora</h3>
        </div>
      </div>

      <label className="sr-only" htmlFor="buscar-sonido">Buscar un sonido</label>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="buscar-sonido"
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, 60))}
          placeholder="Abundancia, paz, perdón, propósito…"
          className="h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background pl-10 pr-3 text-[15px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
        />
      </div>

      {isLoading && (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[12px] bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-3 text-[13px] text-destructive">No pudimos cargar los sonidos. Intenta de nuevo en un momento.</p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={Headphones}
          title={q ? "Ningún sonido con ese nombre" : "Aún no hay sonidos publicados"}
          body={q ? "Prueba con otra palabra: paz, abundancia, perdón o propósito." : "Muy pronto vas a poder escuchar aquí tus audios guiados."}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <ul className="mt-3 space-y-2">
          {filtered.map((r) => {
            const active = current?.id === r.id;
            const cover = signCover(r.cover_url);
            return (
              <li key={r.id}>
                <Link
                  to="/visualiza/$categoryId/$day"
                  params={{ categoryId: r.category_id, day: String(r.day_index) }}
                  search={{ reproducir: 1 }}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] border border-border bg-card p-2.5 text-left transition active:scale-[.98] hover:border-primary/40"
                >
                  {cover ? (
                    <img src={cover} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-[10px] object-cover" />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary">
                      <Headphones className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold leading-tight">{r.title}</span>
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {data?.names.get(r.category_id) ?? "Manifestación"} · Día {r.day_index}
                    </span>
                  </span>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    {active && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/visualiza"
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[12px] bg-primary/10 text-[13px] font-semibold text-primary transition active:scale-[.98]"
      >
        Ver todas las playlists <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
