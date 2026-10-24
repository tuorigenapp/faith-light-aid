import { PlayChoice } from "./PlayChoice";
import { missingPlaylistDays } from "@/lib/playlist-slots";
import { Button } from "@/components/ui/button";
import { useSessionState } from "@/hooks/use-session-step";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Eye, Flower2, HandHeart, Headphones, Heart, Lock, MousePointerClick, Pause, Play, Smile, Sparkles, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { usePlayer } from "@/lib/player";
import { awardGems } from "@/lib/gems";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { WordSearch } from "@/components/WordSearch";
import { cn } from "@/lib/utils";
import heroFallback from "@/assets/explore/music.jpg";
import { FREE_AUDIOS } from "@/components/visualiza/CustomTopic";
import { StageQuiz, type QuizItem } from "@/components/StageQuiz";

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
  const [step, setStep] = useSessionState<1 | 2 | 3>(`viz-music-${cat.id}`, 1);
  const [selId, setSelId] = useSessionState<string | null>(`viz-music-sel-${cat.id}`, null);
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
        <section className="relative flex min-h-[720px] flex-col overflow-hidden rounded-b-[28px] bg-sanctuary text-sanctuary-foreground sm:min-h-[800px]">
          <img src={page.cover_step1 || cat.cover_url || heroFallback} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 music-scrim" />
          <div className="relative mx-auto flex max-w-2xl flex-1 flex-col px-5 pb-8 pt-6 text-center">
            <Link to="/visualiza" className="mb-3 inline-flex min-h-11 items-center gap-1 self-start text-[13px] font-bold"><ArrowLeft className="h-4 w-4" /> Volver</Link>
            <div className="text-[12px] font-bold uppercase">Paso 1 de 3 · Bienvenida</div>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{page.hero_title || cat.title}</h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-sanctuary-foreground/90">{page.hero_text || cat.description}</p>
            <div className="mt-auto pt-24 sm:pt-32" />
            {includes.length > 0 && (
              <Card className="rounded-[16px] bg-card p-5 text-left text-card-foreground shadow-soft">
                <div className="mb-3 font-display text-base font-bold">Este programa incluye:</div>
                <ul className="space-y-2.5">
                  {includes.map((t, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary"><Check className="h-4 w-4" /></span>
                      <span className="text-foreground/85">{t}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {page.verse && (
              <div className="mt-4 rounded-[16px] border border-sanctuary-border bg-sanctuary-panel p-4">
                <Heart className="mx-auto h-5 w-5" />
                <p className="scripture mt-2 text-[15px] text-sanctuary-foreground">"{page.verse}"</p>
                {page.verse_ref && <p className="mt-1 text-[13px] font-bold text-sanctuary-foreground/90">{page.verse_ref}</p>}
              </div>
            )}
            <Button onClick={() => setStep(2)} className="mt-6 h-14 w-full gap-2 rounded-[12px] text-base font-bold active:scale-[.97]">
              <Sparkles className="h-5 w-5" /> {page.cta || "Empezar"}
            </Button>
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
  return <LessonStep cat={cat} page={page} accent={accent} subs={subs} sel={sel} entries={entries} isPaid={isPaid} onBack={() => setStep(2)} onPick={setSelId} dots={Dots} />;
}

const STOP = new Set(["PARA", "COMO", "CADA", "ESTA", "ESTE", "ESTOY", "TODO", "TODA", "TODOS", "DESDE", "SOBRE", "ENTRE", "HACIA", "PORQUE", "TENGO", "SOLO", "MUCHO", "AHORA", "DONDE", "CUANDO", "QUIEN", "TAMBIEN", "HASTA", "TUYO", "MISMO", "MISMA", "SIENTO", "PUEDO", "QUE", "LOS", "LAS", "DEL", "CON", "UNA", "UNO", "MIS", "TUS", "SUS", "POR", "SIN", "YA", "MAS", "SER", "HOY", "MUY", "ESA", "ESE", "ELLA", "ELLO", "NADA"]);
const BASE_WORDS = ["FE", "PAZ", "LUZ", "AMOR", "SANAR", "GRACIAS", "CREO", "VIDA"];

/** Palabras de la sopa: las del subtema o, si faltan, las sacadas de sus propios textos. */
export function lessonWords(own: string[] | undefined, texts: (string | null | undefined)[]) {
  const norm = (w: string) => w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
  const out: string[] = [];
  for (const w of [...(own ?? []), ...texts.filter(Boolean).join(" ").split(/\s+/)]) {
    const n = norm(w);
    if (n.length >= 3 && n.length <= 9 && !STOP.has(n) && !out.includes(n)) out.push(n);
    if (out.length >= 8) break;
  }
  for (const b of BASE_WORDS) if (out.length < 6 && !out.includes(b)) out.push(b);
  return out.slice(0, 8);
}

function lessonQuiz(sel: Sub, cat: any): QuizItem[] {
  const own = (sel.quiz?.questions ?? []).filter((q) => q?.question && q.options?.length >= 2);
  if (own.length) return own.map((q) => ({ q: q.question, options: q.options, correct: q.correctIndex, tip: q.explanation ?? "" }));
  const aff = sel.affirmation || cat.affirmation_ya_tengo || "Hoy elijo creer que lo nuevo ya empezó en mí.";
  return [
    { q: "¿Cuál de estas frases es la afirmación de tu lección?", options: ["Nada va a cambiar en mi vida", aff, "Mi pasado decide quién soy"], correct: 1, tip: "Repítela en voz alta tres veces, despacio y sintiéndola." },
    { q: `¿Qué te ayuda a vivir «${sel.title}»?`, options: ["Esperar sin hacer nada", "Sentirlo como real y dar un paso hoy", "Compararte con otras personas"], correct: 1, tip: "La fe se vuelve real cuando das un paso pequeño hoy." },
    { q: "¿Con qué cierras tu práctica de hoy?", options: ["Con culpa por lo que falta", "Con gratitud por lo que ya empezó", "Con prisa por terminar"], correct: 1, tip: "Agradecer antes de ver el resultado abre espacio para recibirlo." },
  ];
}

const AFF_STYLE = [
  { Icon: Sparkles, color: "#C98A12", bg: "#FFF3D6" },
  { Icon: Heart, color: "#D9468F", bg: "#FFE1F1" },
  { Icon: Flower2, color: "#1F8A63", bg: "#DFF6EA" },
  { Icon: HandHeart, color: "#6D4FE0", bg: "#EDE7FF" },
];
const EX_HINTS = [
  { label: "Visualiza", sub: "Tu vida ideal", Icon: Eye },
  { label: "Siente", sub: "La emoción", Icon: Waves },
  { label: "Agradece", sub: "Ya es tuyo", Icon: Smile },
  { label: "Confía", sub: "Todo fluye", Icon: Sparkles },
];

/** Paso 3 de 3 con la misma estructura de "Manifestar con Música": playlist, afirmaciones, sopa de letras, preguntas y ejercicio. */
function LessonStep({ cat, page, accent, subs, sel, entries, isPaid, onBack, onPick, dots }: {
  cat: any; page: Record<string, any>; accent: string; subs: Sub[]; sel: Sub; entries: Map<string, { completed?: boolean }>;
  isPaid: boolean; onBack: () => void; onPick: (id: string) => void; dots: ReactNode;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const player = usePlayer();
  const [exercise, setExercise] = useState("");
  const [saving, setSaving] = useState(false);
  const locked = !isPaid && sel.day_index > FREE_AUDIOS;
  const playingId = player.current?.id ?? null;
  const toTrack = (a: Sub) => ({ id: a.id, title: `#${String(a.day_index).padStart(2, "0")} — ${a.title}`, subtitle: cat.title, url: a.audio_url ?? "", cover: a.cover_url ?? null });
  const affirmations = Array.from(new Set([sel.affirmation, ...(page.affirmations ?? []), cat.affirmation_ya_tengo, cat.identity_yo_soy, cat.gratitude_gracias].filter(Boolean) as string[])).slice(0, 4);
  const words = lessonWords(sel.word_game?.words, [sel.title, sel.affirmation, cat.title, ...affirmations, sel.lesson]);
  const quiz = lessonQuiz(sel, cat);
  const doneCount = subs.filter((s) => entries.get(s.id)?.completed).length;

  const [choice, setChoice] = useState<Sub | null>(null);
  const lessonOf = (a: Sub) => navigate({ to: "/visualiza/$categoryId/$day", params: { categoryId: cat.id, day: String(a.day_index) } });
  function open(a: Sub) {
    onPick(a.id);
    setChoice(a);
  }
  function listen(a: Sub) {
    setChoice(null);
    if (!a.audio_url) return;
    if (!isPaid && a.day_index > FREE_AUDIOS) { navigate({ to: "/membresia" }); return; }
    if (playingId === a.id) { player.toggle(); return; }
    player.play(toTrack(a), subs.filter((x) => x.audio_url && (isPaid || x.day_index <= FREE_AUDIOS)).map(toTrack));
  }
  const fillers = missingPlaylistDays(subs);

  async function finish() {
    if (!user) return;
    if (exercise.trim().length < 10) return toast.error("Escribe al menos una intención para completar la lección.");
    setSaving(true);
    const { error } = await supabase.from("manifest_entries").upsert({ user_id: user.id, audio_id: sel.id, played: true, completed: true, peticion: exercise.trim() }, { onConflict: "user_id,audio_id" });
    setSaving(false);
    if (error) return toast.error("No pudimos guardar tu ejercicio. Revisa tu conexión e intenta de nuevo.");
    await awardGems(40, "manifest_exercise", { category: cat.id, day: sel.day_index });
    toast.success("Lección completada. +40 hojas");
    setExercise("");
    qc.invalidateQueries();
  }

  return (
    <div className="pb-32">
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <button onClick={onBack} className="inline-flex min-h-11 items-center gap-1 text-xs font-bold" style={{ color: accent }}><ArrowLeft className="h-3.5 w-3.5" /> Cambiar área</button>
        {(sel.cover_url || page.cover_step3) && <img src={sel.cover_url || page.cover_step3} alt="" className="mt-2 h-44 w-full rounded-[16px] object-cover" />}
        <div className="mt-3 text-center">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Paso 3 de 3 · Tu lección</div>
          <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight">{sel.title} <span>💗</span></h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Escucha, siente y practica. Todo en un solo lugar.</p>
        </div>
      </div>

      {/* Playlist */}
      <section className="mx-auto mt-6 max-w-3xl px-4">
        <Card className="rounded-[16px] border border-border/60 p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[12px]" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}>
              <Headphones className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-extrabold leading-tight">{page.playlist_title || (subs.some((a) => a.audio_url) ? "Playlist y prácticas" : "Prácticas guiadas")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{cat.title} · {page.playlist_text || "Escucha y practica a tu ritmo."}</p>
            </div>
          </div>
          {sel.lesson && !locked && <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-foreground/80">{sel.lesson}</p>}
        </Card>
        <div className="mt-3 overflow-hidden rounded-[16px] border border-border/60 bg-card">
          {subs.map((a) => {
            const l = !isPaid && a.day_index > FREE_AUDIOS;
            const active = playingId === a.id || (!playingId && a.id === sel.id);
            return (
              <button key={a.id} onClick={() => open(a)} className={cn("flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors last:border-b-0", active ? "bg-primary/10" : "hover:bg-muted/40")}>
                <div className="w-12 shrink-0 text-[11px] font-bold uppercase tracking-wide" style={{ color: active ? accent : undefined }}>#{String(a.day_index).padStart(2, "0")}</div>
                <div className={cn("min-w-0 flex-1", l && "select-none blur-[3px]")}><div className="truncate text-sm font-semibold">{a.title}</div></div>
                {entries.get(a.id)?.completed && <Check className="h-4 w-4 text-[#2F9C74]" />}
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: l ? "#94A3B822" : accent, color: l ? "#64748B" : "white" }}>
                  {l ? <Lock className="h-4 w-4" /> : !a.audio_url ? <ArrowRight className="h-4 w-4" /> : playingId === a.id && player.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                </div>
              </button>
            );
          })}
          {fillers.map((n) => (
            <div key={`f${n}`} aria-hidden="true" className="flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 last:border-b-0">
              <div className="w-12 shrink-0 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">#{String(n).padStart(2, "0")}</div>
              <div className="min-w-0 flex-1 select-none blur-[3px]"><div className="truncate text-sm font-semibold">Práctica guiada de sanación</div></div>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><Lock className="h-4 w-4" /></div>
            </div>
          ))}
        </div>
        {choice && <PlayChoice title={choice.title} canListen={Boolean(choice.audio_url)} onClose={() => setChoice(null)} onLesson={() => { setChoice(null); lessonOf(choice); }} onListen={() => listen(choice)} />}
        {!isPaid && (
          <Card className="mt-3 rounded-[16px] border p-4" style={{ borderColor: `${accent}50`, background: `${accent}10` }}>
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
              <div>
                <p className="text-sm font-bold">Desbloquea todas las prácticas</p>
                <p className="mt-1 text-xs text-muted-foreground">Con Camino ORÍGEN accedes a toda la playlist y a los demás temas.</p>
                <Link to="/membresia" className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-[12px] px-4 text-[13px] font-bold text-primary-foreground" style={{ background: accent }}>Ver planes <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          </Card>
        )}
      </section>

      {locked ? (
        <section className="mx-auto mt-8 max-w-3xl px-4">
          <Card className="rounded-[16px] p-5 text-center shadow-soft">
            <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 font-bold">Esta lección se abre con Camino ORÍGEN</p>
            <Link to="/membresia" className="mt-3 inline-flex min-h-11 items-center rounded-[12px] px-4 font-bold text-primary-foreground" style={{ background: accent }}>Ver Camino ORÍGEN</Link>
          </Card>
        </section>
      ) : (
        <>
          {/* Afirmaciones */}
          <section className="mx-auto mt-10 max-w-3xl px-4">
            <div className="text-center">
              <h2 className="font-display text-xl font-extrabold">Afirmaciones del día <span>💗</span></h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Repite estas afirmaciones con fe y convicción.</p>
            </div>
            <div className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
              {affirmations.map((t, i) => {
                const st = AFF_STYLE[i % AFF_STYLE.length];
                return (
                  <Card key={t} className="w-[62%] max-w-[220px] shrink-0 snap-center rounded-[16px] border border-border/60 p-4 text-center shadow-soft sm:w-[45%]" style={{ background: st.bg }}>
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-[12px] bg-card/70" style={{ color: st.color }}><st.Icon className="h-5 w-5" /></div>
                    <p className="mt-3 text-[13px] font-medium leading-relaxed text-[#2A2238]">{t}</p>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Sopa de letras */}
          <section className="mx-auto mt-10 max-w-3xl px-4">
            <div className="mb-4 text-center">
              <h2 className="font-display text-xl font-extrabold">Sopa de letras de la lección <span>🔎</span></h2>
              <p className="mt-2 text-sm text-muted-foreground">Encuentra palabras para acompañar tu reflexión y oración.</p>
            </div>
            <WordSearch words={words} storageKey={`custom-${cat.id}-${sel.day_index}`} gemsReward={40} />
          </section>

          {/* Preguntas */}
          <section className="mx-auto mt-10 max-w-3xl px-4">
            <div className="mb-4 text-center">
              <h2 className="font-display text-xl font-extrabold">Preguntas de la lección <span>🧠</span></h2>
              <p className="mt-2 text-sm text-muted-foreground">Responde desde el corazón. Cada acierto suma hojas.</p>
            </div>
            <StageQuiz items={quiz} storageKey={`custom-quiz-${sel.id}`} gemsPerCorrect={15} />
          </section>

          {/* Ejercicio */}
          <section className="mx-auto mt-10 max-w-3xl px-4">
            <Card className="rounded-[16px] border border-border/60 p-5 shadow-soft">
              <div className="text-center">
                <h2 className="font-display text-xl font-extrabold">Ejercicio de Reflexión Cristiana <span>✍️</span></h2>
                <p className="mt-2 text-sm text-muted-foreground">Reflexiona y escribe con intención.</p>
              </div>
              <label htmlFor="ex-text" className="mb-2 mt-5 block text-sm font-semibold">{sel.exercise || `¿Qué deseas llevar a la oración con «${sel.title}» y por qué es importante para ti?`}</label>
              <div className="relative">
                <Textarea id="ex-text" value={exercise} onChange={(e) => setExercise(e.target.value.slice(0, 1000))} placeholder="Escribe aquí con libertad..." className="min-h-32 resize-none rounded-[12px] pr-16" />
                <span className="absolute bottom-2 right-3 text-[11px] tabular-nums text-muted-foreground">{exercise.length}/1000</span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {EX_HINTS.map((h) => (
                  <div key={h.label} className="rounded-[12px] border border-border/60 bg-muted/30 py-3 text-center">
                    <h.Icon className="mx-auto h-4 w-4" style={{ color: accent }} />
                    <div className="mt-1 text-[11px] font-bold">{h.label}</div>
                    <div className="text-[10px] text-muted-foreground">{h.sub}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => void finish()} disabled={saving} className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[12px] text-base font-bold text-primary-foreground active:scale-[.97] disabled:opacity-60" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}DD)` }}>
                <Check className="h-5 w-5" /> {saving ? "Guardando…" : "Finalizar tarea del día"}
              </button>
              {doneCount > 0 && <p className="mt-3 text-center text-xs text-muted-foreground">Has completado <b style={{ color: accent }}>{doneCount}</b> de {subs.length} lecciones.</p>}
            </Card>
            {dots}
          </section>
        </>
      )}
    </div>
  );
}
