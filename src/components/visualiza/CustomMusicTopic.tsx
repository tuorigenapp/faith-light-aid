import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Headphones, Heart, Lock, MousePointerClick, Sparkles, Play, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WordSearch } from "@/components/WordSearch";
import { cn } from "@/lib/utils";
import heroFallback from "@/assets/visualiza-hero.jpg";
import { FREE_AUDIOS } from "@/components/visualiza/CustomTopic";
import { StageQuiz } from "@/components/StageQuiz";

type Sub = {
  id: string; day_index: number; title: string; affirmation: string | null; lesson: string | null;
  exercise: string | null; audio_url: string | null; cover_url: string | null; is_published?: boolean | null;
  word_game?: { words?: string[] } | null; quiz?: { tasks?: string[]; questions?: { question: string; options: string[]; correctIndex: number; explanation?: string }[] } | null;
};

/** Mismo formato de 3 pasos que "Manifestar con Música", con el contenido propio del tema creado. */
export function CustomMusicTopic({ cat, audios, entries, isPaid }: { cat: any; audios: Sub[]; entries: Map<string, { completed?: boolean }>; isPaid: boolean }) {
  const page = (cat.page ?? {}) as Record<string, any>;
  const accent: string = page.accent || cat.color || "#7C5CFF";
  const subs = audios.filter((a) => a.is_published !== false).sort((a, b) => a.day_index - b.day_index);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selId, setSelId] = useState<string | null>(null);
  const sel = subs.find((s) => s.id === selId) ?? subs[0];
  const includes: string[] = page.includes?.length ? page.includes : [cat.subtitle, cat.affirmation_ya_tengo, cat.identity_yo_soy].filter(Boolean);

  const Dots = (
    <div className="flex items-center justify-center gap-2 pt-4">
      {[1, 2, 3].map((n) => <div key={n} className={cn("h-1.5 rounded-full transition-all", step === n ? "w-8" : "w-4 bg-border")} style={step === n ? { background: accent } : undefined} />)}
    </div>
  );

  if (step === 1)
    return (
      <div className="pb-24">
        <section className="relative flex min-h-[92vh] flex-col overflow-hidden rounded-b-[2.5rem]">
          <img src={page.cover_step1 || cat.cover_url || heroFallback} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" />
          <div className="relative mx-auto flex max-w-2xl flex-1 flex-col px-5 pb-8 pt-6 text-center">
            <Link to="/visualiza" className="mb-3 inline-flex min-h-11 items-center gap-1 self-start text-xs font-bold" style={{ color: accent }}><ArrowLeft className="h-3.5 w-3.5" /> Volver</Link>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Paso 1 de 3 · Bienvenida</div>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{page.hero_title || cat.title}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground/75">{page.hero_text || cat.description}</p>
            <div className="mt-auto pt-48 sm:pt-64" />
            {includes.length > 0 && (
              <Card className="rounded-[16px] bg-card/95 p-5 text-left shadow-soft backdrop-blur-xl">
                <div className="mb-3 font-display text-base font-bold">Este programa incluye:</div>
                <ul className="space-y-2.5">
                  {includes.map((t, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: `${accent}1F`, color: accent }}><Check className="h-4 w-4" /></span>
                      <span className="text-foreground/85">{t}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {page.verse && (
              <div className="mt-4 rounded-[16px] border p-4" style={{ background: `${accent}12`, borderColor: `${accent}40` }}>
                <Heart className="mx-auto h-5 w-5" style={{ color: accent }} fill="currentColor" />
                <p className="scripture mt-2 text-sm text-foreground/80">"{page.verse}"</p>
                {page.verse_ref && <p className="mt-1 text-xs font-bold text-foreground/70">{page.verse_ref}</p>}
              </div>
            )}
            <button onClick={() => setStep(2)} className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[12px] text-base font-bold text-primary-foreground active:scale-[.97]" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}DD)` }}>
              <Sparkles className="h-5 w-5" /> {page.cta || "Empezar"}
            </button>
            {Dots}
          </div>
        </section>
      </div>
    );

  if (step === 2)
    return (
      <div className="mx-auto flex min-h-[92vh] max-w-2xl flex-col px-4 pb-24 pt-6">
        <button onClick={() => setStep(1)} className="inline-flex min-h-11 items-center gap-1 self-start text-xs font-bold" style={{ color: accent }}><ArrowLeft className="h-3.5 w-3.5" /> Atrás</button>
        {page.cover_step2 && <img src={page.cover_step2} alt="" className="mt-2 h-40 w-full rounded-[16px] object-cover" />}
        <div className="mt-3 text-center">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Paso 2 de 3 · Elige un área</div>
          <h2 className="mt-2 font-display text-2xl font-extrabold">{page.step2_title || `¿En qué quieres enfocarte?`}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{page.step2_text || cat.subtitle}</p>
        </div>
        <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border p-3" style={{ borderColor: `${accent}50`, color: accent, background: `${accent}10` }}>
          <MousePointerClick className="h-4 w-4 shrink-0" />
          <p className="text-xs font-semibold">{page.step2_hint || "Pulsa el área que deseas trabajar para continuar."}</p>
        </div>
        {subs.length === 0 ? (
          <p className="mt-6 rounded-[16px] bg-muted p-5 text-center text-sm text-muted-foreground">Las áreas de este tema se están preparando. Vuelve pronto.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {subs.map((s) => {
              const locked = !isPaid && s.day_index > FREE_AUDIOS;
              const done = entries.get(s.id)?.completed;
              return (
                <button key={s.id} onClick={() => { setSelId(s.id); setStep(3); }} className="rounded-[16px] border border-border/60 bg-card p-3 text-center shadow-soft transition active:scale-[.97]">
                  <div className="relative mx-auto mb-2 h-16 w-full overflow-hidden rounded-[12px]" style={{ background: `${accent}1A` }}>
                    {s.cover_url ? <img src={s.cover_url} alt="" className="h-full w-full object-cover" /> : <Headphones className="m-auto mt-5 h-6 w-6" style={{ color: accent }} />}
                    {(locked || done) && <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-card">{done ? <Check className="h-3.5 w-3.5 text-[#2F9C74]" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}</span>}
                  </div>
                  <div className="text-[13px] font-bold leading-tight">{s.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">#{String(s.day_index).padStart(2, "0")}</div>
                </button>
              );
            })}
          </div>
        )}
        {page.step2_note && (
          <div className="mt-4 flex items-start gap-2.5 rounded-[12px] p-3.5" style={{ background: `${accent}10` }}>
            <Heart className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} fill="currentColor" />
            <p className="text-xs leading-relaxed text-foreground/80">{page.step2_note}</p>
          </div>
        )}
        {Dots}
      </div>
    );

  if (!sel) return null;
  const locked = !isPaid && sel.day_index > FREE_AUDIOS;
  const words = (sel.word_game?.words ?? []).slice(0, 8);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-6">
      <button onClick={() => setStep(2)} className="inline-flex min-h-11 items-center gap-1 text-xs font-bold" style={{ color: accent }}><ArrowLeft className="h-3.5 w-3.5" /> Cambiar área</button>
      <img src={sel.cover_url || page.cover_step3 || cat.cover_url || heroFallback} alt="" className="mt-2 h-44 w-full rounded-[16px] object-cover" />
      <div className="mt-4 text-center">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Paso 3 de 3 · Tu lección</div>
        <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight">{sel.title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{page.step3_text || "Escucha, siente y practica. Todo en un solo lugar."}</p>
      </div>
      {locked ? (
        <Card className="mt-5 rounded-[16px] p-5 text-center shadow-soft">
          <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 font-bold">Esta lección se abre con Camino ORÍGEN</p>
          <Link to="/membresia" className="mt-3 inline-flex min-h-11 items-center rounded-[12px] px-4 font-bold text-primary-foreground" style={{ background: accent }}>Ver Camino ORÍGEN</Link>
        </Card>
      ) : (
        <div className="mt-5 space-y-4">
          {sel.affirmation && <Card className="rounded-[16px] p-5 text-center shadow-soft"><Sparkles className="mx-auto h-5 w-5" style={{ color: accent }} /><p className="mt-2 font-display text-[18px] font-bold leading-snug">"{sel.affirmation}"</p></Card>}
          {sel.lesson && (
            <Card className="rounded-[16px] p-5 shadow-soft">
              <p className="inline-flex items-center gap-2 font-display text-[17px] font-bold"><BookOpen className="h-4 w-4" style={{ color: accent }} /> Tu lección</p>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{sel.lesson}</p>
            </Card>
          )}
          <Link to="/visualiza/$categoryId/$day" params={{ categoryId: cat.id, day: String(sel.day_index) }} search={{ reproducir: 1 }} className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[12px] text-[16px] font-bold text-primary-foreground active:scale-[.97]" style={{ background: accent }}>
            <Play className="h-5 w-5" /> {sel.audio_url ? "Escuchar y practicar" : "Hacer la práctica"}
          </Link>
          {words.length >= 3 && <WordSearch words={words} storageKey={`custom-${cat.id}-${sel.day_index}`} gemsReward={20} />}
          {(sel.quiz?.questions?.length ?? 0) > 0 && <StageQuiz storageKey={`custom-quiz-${sel.id}`} gemsPerCorrect={2} items={(sel.quiz?.questions ?? []).map(q => ({ q: q.question, options: q.options, correct: q.correctIndex, tip: q.explanation ?? "" }))} />}
          {sel.exercise && <section className="border-t border-border py-4"><h3 className="font-display text-lg font-bold">Tu práctica</h3><p className="mt-2 whitespace-pre-wrap text-sm">{sel.exercise}</p></section>}
        </div>
      )}
      {Dots}
    </div>
  );
}
