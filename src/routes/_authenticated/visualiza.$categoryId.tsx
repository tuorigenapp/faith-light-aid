import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Play, Check, Headphones, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/visualiza/$categoryId")({
  head: () => ({ meta: [{ title: "Playlist — Reconectando" }] }),
  component: Playlist,
});

function Playlist() {
  const { categoryId } = useParams({ from: "/_authenticated/visualiza/$categoryId" });
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["playlist", categoryId, user?.id],
    queryFn: async () => {
      const [cat, audios, entries] = await Promise.all([
        supabase.from("manifest_categories").select("*").eq("id", categoryId).maybeSingle(),
        supabase.from("manifest_audios").select("*").eq("category_id", categoryId).order("day_index"),
        user ? supabase.from("manifest_entries").select("audio_id, completed, played").eq("user_id", user.id) : Promise.resolve({ data: [] as any[] }),
      ]);
      return { cat: cat.data, audios: audios.data ?? [], entries: new Map((entries.data ?? []).map((e: any) => [e.audio_id, e])) };
    },
  });

  if (!data?.cat) return <div className="p-8">Cargando...</div>;
  const c = data.cat;

  return (
    <div className="pb-24">
      <div className="relative h-72 md:h-80 overflow-hidden" style={{ background: `linear-gradient(180deg, ${c.color}, ${c.color}55 60%, transparent)` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 md:px-10 h-full flex flex-col justify-end pb-6">
          <Link to="/visualiza" className="inline-flex items-center gap-2 text-white/90 text-sm mb-4 w-fit"><ArrowLeft className="w-4 h-4" /> Playlists</Link>
          <div className="flex items-end gap-4">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl grid place-items-center shadow-glow shrink-0" style={{ background: c.color }}>
              <Headphones className="w-16 h-16 text-white drop-shadow" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/85 font-bold">Método de Cristo · Playlist</div>
              <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white mt-1 drop-shadow">{c.title}</h1>
              <p className="text-white/80 text-sm mt-2 max-w-xl">{c.subtitle} · 21 días</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-10 mt-6">
        <Card className="rounded-[1.7rem] p-5 shadow-soft">
          <div className="text-[11px] uppercase tracking-widest text-primary font-bold">Afirmación diaria</div>
          <p className="font-display font-bold text-xl md:text-2xl mt-2">"{c.affirmation_ya_tengo}"</p>
          <p className="text-sm text-muted-foreground mt-3">Escríbela 3 veces por la mañana, 6 al mediodía y 9 por la noche durante 21 días.</p>
        </Card>

        <div className="mt-5 space-y-2">
          {data.audios.map((a: any) => {
            const e = data.entries.get(a.id);
            const done = e?.completed;
            const started = e?.played;
            return (
              <Link key={a.id} to="/visualiza/$categoryId/$day" params={{ categoryId, day: String(a.day_index) }}>
                <Card className={cn("rounded-2xl p-4 flex items-center gap-4 hover:bg-accent/40 transition-colors", done && "border-accent bg-accent/10")}>
                  <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ background: done ? "var(--accent)" : c.color + "22", color: done ? "white" : c.color }}>
                    {done ? <Check className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">Día {a.day_index}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.audio_url ? "Audio listo" : "Audio próximamente · ejercicio disponible"}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{started && !done ? "En curso" : done ? "Completado" : ""}</div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
