import { SubtopicIcon } from "./SubtopicIcon";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlayChoice } from "./PlayChoice";
import { missingPlaylistDays } from "@/lib/playlist-slots";
import { usePlayer } from "@/lib/player";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Headphones, Lock, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import heroFallback from "@/assets/explore/listen.jpg";

export const FREE_AUDIOS = 3;

type Sub = {
  id: string;
  day_index: number;
  title: string;
  affirmation: string | null;
  audio_url: string | null;
  cover_url: string | null;
  audio_only?: boolean | null;
  is_published?: boolean | null;
};

/** Portada del tema principal creado en el panel + sus subcategorías con número propio. */
export function CustomTopic({
  cat,
  audios,
  entries,
  isPaid,
  recipe = false,
}: {
  recipe?: boolean;
  cat: any;
  audios: Sub[];
  entries: Map<string, { completed?: boolean }>;
  isPaid: boolean;
}) {
  const subs = audios.filter((a) => a.is_published !== false).sort((a, b) => a.day_index - b.day_index);
  const [choice, setChoice] = useState<Sub | null>(null);
  const player = usePlayer();
  const navigate = useNavigate();
  function listen(sub: Sub) {
    setChoice(null);
    if (!sub.audio_url) return;
    if (!isPaid && subs.findIndex(s => s.id === sub.id) >= FREE_AUDIOS) { navigate({ to: "/membresia" }); return; }
    const track = (s: Sub) => ({ id: s.id, title: s.title, subtitle: cat.title, url: s.audio_url ?? "", cover: s.cover_url });
    player.play(track(sub), subs.filter((s, i) => s.audio_url && (isPaid || i < FREE_AUDIOS)).map(track));
  }
  const done = subs.filter((s) => entries.get(s.id)?.completed).length;
  const pct = subs.length ? Math.round((done / subs.length) * 100) : 0;
  const page = (cat.page ?? {}) as Record<string, any>;
  const affirmations = [cat.affirmation_ya_tengo, cat.identity_yo_soy, cat.gratitude_gracias].filter(Boolean) as string[];

  return (
    <div className="pb-32">
      <section className="relative overflow-hidden rounded-b-[28px]">
        <img src={page.cover_home || page.cover_step1 || cat.cover_url || heroFallback} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 music-scrim" />
        <div className="relative mx-auto max-w-3xl px-5 pt-6 pb-8 text-sanctuary-foreground">
          <Link to="/visualiza" className="inline-flex min-h-11 items-center gap-1 text-[13px] font-bold">
            <ArrowLeft className="h-4 w-4" /> Visualízalo y Vívelo
          </Link>
          <p className="mt-10 text-[12px] font-bold uppercase tracking-widest opacity-85">{recipe ? "Tema principal" : "Página principal"}</p>
          <h1 className="mt-1 font-display text-[32px] font-extrabold leading-[1.1]">{page.hero_title || cat.title}</h1>
          {(page.hero_text || cat.subtitle) && <p className="mt-2 text-[15px] opacity-90">{page.hero_text || cat.subtitle}</p>}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sanctuary-foreground/25">
              <div className="h-full rounded-full bg-sanctuary-foreground transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[13px] font-bold tabular-nums">{done}/{subs.length}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-6 px-4 pt-6">
        {cat.description && (
          <div className="app-card flex gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span>
            <p className="text-[14.5px] leading-relaxed text-foreground/85">{cat.description}</p>
          </div>
        )}

        {affirmations.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {affirmations.map((a) => (
              <div key={a} className="app-card p-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="mt-2 text-[14px] font-semibold leading-snug">{a}</p>
              </div>
            ))}
          </div>
        )}

        <section>
          {(page.cover_playlist || page.cover_step2) && <img src={page.cover_playlist || page.cover_step2} alt="" className="mb-3 h-36 w-full rounded-[16px] object-cover" loading="lazy" />}
          <h2 className="font-display text-[20px] font-extrabold">{page.playlist_title || (recipe ? "Recetas y prácticas" : "Sección de playlists")}</h2>
          {page.playlist_text && <p className="mt-1 text-[14px] text-foreground/80">{page.playlist_text}</p>}
          <p className="mt-1 text-[13px] text-muted-foreground">
            {isPaid ? "Tienes acceso a todas." : `Las primeras ${FREE_AUDIOS} están abiertas en tu plan gratis.`}
          </p>

          {subs.length === 0 ? (
            <div className="app-card mt-3 p-6 text-center">
              <Headphones className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 font-display text-[16px] font-bold">Muy pronto abrimos la primera práctica</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Mientras tanto, repite las afirmaciones de arriba en voz alta.</p>
              <Link to="/visualiza" className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-[12px] bg-primary/10 px-4 text-[14px] font-bold text-primary">
                Ver otros temas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {subs.map((s, i) => {
                const locked = !isPaid && i >= FREE_AUDIOS;
                const completed = !!entries.get(s.id)?.completed;
                const inner = (
                  <div className={cn("app-card flex items-center gap-3 p-3 transition active:scale-[.98]", locked && "opacity-70")}>
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-muted">
                      <SubtopicIcon title={s.title} category={cat.title} className="h-full w-full" />
                    </div>
                    <div className={cn("min-w-0 flex-1", locked && "blur-[3px] select-none")}>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                        #{String(s.day_index).padStart(2, "0")} · {recipe ? "Receta" : s.audio_only ? "Audio" : "Práctica completa"}
                      </p>
                      <p className="truncate font-display text-[15px] font-bold">{s.title}</p>
                      {s.affirmation && <p className="line-clamp-1 text-[12.5px] text-muted-foreground">{s.affirmation}</p>}
                    </div>
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", completed ? "bg-accent-green/15 text-accent-green" : "bg-primary/10 text-primary")}>
                      {locked ? <Lock className="h-4 w-4" /> : completed ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </span>
                  </div>
                );
                return (
                  <li key={s.id}>
                    <Button variant="ghost" onClick={() => setChoice(s)} className="h-auto w-full whitespace-normal p-0 text-left [&>div]:w-full">{inner}</Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 overflow-hidden rounded-[16px] border border-border bg-card">
            {missingPlaylistDays(subs).map(n => <div key={n} aria-hidden="true" className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"><span className="text-[12px] text-muted-foreground">#{String(n).padStart(2, "0")}</span><span className="flex-1 select-none blur-[3px] text-sm">Práctica guiada de sanación</span><Lock className="h-4 w-4 text-muted-foreground" /></div>)}
          </div>
          {choice && <PlayChoice title={choice.title} canListen={Boolean(choice.audio_url)} onClose={() => setChoice(null)} onListen={() => listen(choice)} onLesson={() => { const day = choice.day_index; setChoice(null); navigate({ to: "/visualiza/$categoryId/$day", params: { categoryId: cat.id, day: String(day) } }); }} />}
          {!isPaid && (
            <Link to="/membresia" className="app-card mt-4 flex items-center gap-3 p-4">
              <Lock className="h-5 w-5 shrink-0 text-primary" />
              <span className="flex-1 text-[13.5px] font-semibold">Desbloquea el resto de audios con Camino ORÍGEN</span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
