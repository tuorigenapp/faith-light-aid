import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { awardLeaf, wholeHojas, type ActionLevel } from "@/lib/gems";
import { AnswerFeedback } from "@/components/AnswerFeedback";
import { CAMINO_TOTAL_DAYS, getCamino, getEtapa } from "@/lib/caminos";
import { DailyGames } from "@/components/games/DailyGames";
import { MemoryPairs, MentalTasks, StageGameStep, type GameKind } from "@/components/StageGames";
import { AffirmationSlider } from "@/components/AffirmationSlider";
import { useResumableStep, clearStepPosition } from "@/lib/game-progress";


import { useCaminoPack, caminoVariant, CAMINO_PACK_BASE } from "@/lib/camino-pack";
import { WordSearch } from "@/components/WordSearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowRight, Award, Check, Flame, HandHeart, Leaf, ListChecks,
  Loader2, PenLine, Sparkles, X,
} from "lucide-react";
import heartCrystal from "@/assets/st-heart-crystal.png";
import chest from "@/assets/st-chest.png";
import robot from "@/assets/st-robot.png";
import caminoFe from "@/assets/st-camino-fe.png";
import star3d from "@/assets/e3d-star.png";
import brain3d from "@/assets/e3d-brain.png";
import tree from "@/assets/hojas-tree.png";

export const Route = createFileRoute("/_authenticated/caminos/$caminoId/$day")({
  head: () => ({
    meta: [
      { title: "Etapa del día — Caminos ORIGEN" },
      { name: "description", content: "Vive tu etapa del día en 13 pasos: lección, soluciones, tareas, quiz, juegos y tu recompensa." },
      { property: "og:title", content: "Etapa del día — Caminos ORIGEN" },
      { property: "og:description", content: "Lección, tareas espirituales, quiz y juegos para transformarte un día a la vez." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaminoDia,
});

const TOTAL_STEPS = 20;
const DAY_XP = 120;

function todayIso() { return new Date().toISOString().slice(0, 10); }

function CaminoDia() {
  const { caminoId, day } = Route.useParams();
  const dayNum = Math.min(Math.max(Number(day) || 1, 1), CAMINO_TOTAL_DAYS);
  const camino = getCamino(caminoId);
  const etapa = camino ? getEtapa(camino, dayNum) : null;
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const stepKey = `camino:${user?.id ?? "anon"}:${caminoId}:${dayNum}`;
  const [step, setStep] = useResumableStep(stepKey, TOTAL_STEPS);

  const [openSol, setOpenSol] = useState<number | null>(null);
  const [solDone, setSolDone] = useState<number[]>([]);
  const [openTask, setOpenTask] = useState<number | null>(null);
  const [taskDone, setTaskDone] = useState<number[]>([]);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [quizPick, setQuizPick] = useState<number | null>(null);
const [feedback, setFeedback] = useState<"ok" | "fail" | null>(null);
  const [cargas, setCargas] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [feIdx, setFeIdx] = useState(0);
  const [feOk, setFeOk] = useState(0);
  const [emo, setEmo] = useState<Record<string, "soltar" | "recibir">>({});
  const [bienestar, setBienestar] = useState<Record<number, number>>({});
  const [earned, setEarned] = useState(0);

  const pack = useCaminoPack({
    camino: caminoId,
    caminoTitle: camino?.title ?? "",
    day: dayNum,
    dayTitle: etapa?.title ?? "",
    focus: etapa?.focus ?? "sanidad emocional",
  });

  const { data: state } = useQuery({
    queryKey: ["camino", caminoId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("daily_activity")
        .select("activity_type, activity_date, metadata")
        .eq("user_id", user!.id)
        .in("activity_type", ["camino_dia", "camino_semana"]);
      const mine = (rows ?? []).filter((r: any) => r.metadata?.camino === caminoId);
      return {
        done: mine.filter((r: any) => r.activity_type === "camino_dia").map((r: any) => ({ day: Number(r.metadata?.day), date: r.activity_date as string })),
        weekOpen: mine.some((r: any) => r.activity_type === "camino_semana"),
      };
    },
  });

  const memoryCards = useMemo(() => {
    const src = (pack.data?.promesas ?? CAMINO_PACK_BASE.promesas).slice();
    const seed = caminoVariant(caminoId, dayNum).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const picked: string[] = [];
    while (picked.length < 10 && src.length) picked.push(src.splice(Math.floor(rnd() * src.length), 1)[0]);
    const deck = [...picked, ...picked].map((t, i) => ({ id: i, text: t }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }, [pack.data?.promesas, caminoId, dayNum]);

  if (!camino || !etapa) {
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center">
        <h1 className="font-display font-extrabold text-[22px]">Etapa no disponible</h1>
        <Link to="/categorias" className="mt-4 inline-flex h-12 items-center rounded-[12px] px-5 btn-primary-gradient text-white text-[15px] font-semibold">Ver categorías</Link>
      </div>
    );
  }

  // Contenido base al instante; se refresca cuando llega el del día.
  const p = pack.data ?? CAMINO_PACK_BASE;
  const alreadyDone = (state?.done ?? []).some((d) => d.day === dayNum);

  async function reward(level: ActionLevel, reason: string) {
    const r = await awardLeaf("caminos", level, reason, { camino: caminoId, day: dayNum });
    setEarned((e) => e + r.granted);
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function finishDay() {
    if (!user) return;
    if (!alreadyDone) {
      await supabase.from("daily_activity").insert({
        user_id: user.id,
        activity_type: "camino_dia",
        activity_date: todayIso(),
        reference_id: crypto.randomUUID(),
        metadata: {
          camino: caminoId, day: dayNum, insignia: etapa!.insignia, xp: DAY_XP,
          mood, notes, quiz_ok: feOk,
        } as never,
      });
      await reward("major", `Día ${dayNum} · ${camino!.title}`);
    }
    qc.invalidateQueries({ queryKey: ["camino", caminoId] });
    setStep(20);
  }

  const next = () => setStep(step + 1);


  const solutions = p?.soluciones ?? [];
  const tasks = p?.tareas ?? [];
  const taskKind = (t: string) =>
    /^ora|oraci|ora\b|orar/i.test(t) ? "oracion" : /identific|reconoce|detecta/i.test(t) ? "identificar" : /escrib|anota|carta|diario/i.test(t) ? "escribir" : "accion";

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-[#F7F3FF] via-[#FDF6FB] to-[#F4F8FF]">
      {/* Fondo temático del camino */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img src={camino.banner} alt="" className="absolute -top-10 left-1/2 -translate-x-1/2 w-[140%] max-w-none opacity-[0.13] blur-[2px]" />
        <div className={cn("absolute inset-0 bg-gradient-to-b opacity-[0.10]", camino.gradient)} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/80 to-white/95" />
      </div>
      {/* Header — mismo sistema visual que /etapas */}
      <header className="sticky top-0 z-20 bg-card/85 backdrop-blur border-b border-border">
        <div className="max-w-[520px] mx-auto px-4 py-3">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3">
            <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-accent-pink to-primary text-white grid place-items-center font-display font-extrabold text-[15px] shadow-soft">
              {dayNum}
            </span>
            <span className="min-w-0 text-center text-[12px] font-bold leading-tight text-primary">
              Paso {step} de {TOTAL_STEPS}
            </span>
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#3FBE8F]/12 px-3 py-1.5 text-[13px] font-bold text-[#2F9C74]">
              <Leaf className="w-4 h-4" /> {wholeHojas(profile?.gems)}
            </span>
            <Link to="/caminos/$caminoId" params={{ caminoId }} aria-label="Cerrar y volver al mapa" className="w-11 h-11 shrink-0 rounded-full grid place-items-center text-muted-foreground hover:bg-primary/8 transition active:scale-95">
              <X className="w-5 h-5" />
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-1.5" aria-label={`Paso ${step} de ${TOTAL_STEPS}`}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", i + 1 <= step ? "bg-primary" : "bg-primary/15")} />
            ))}
          </div>
        </div>
      </header>


      <main className="relative z-10 max-w-[520px] mx-auto px-4 py-5 pb-32">
      <AnswerFeedback state={feedback} onClose={() => setFeedback(null)} />
        {pack.isFetching && (
          <div className="mb-3 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Personalizando tu etapa de hoy…
          </div>
        )}

        {p && step === 1 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <div className="rounded-[16px] overflow-hidden shadow-soft">
              <img src={camino.banner} alt={camino.title} loading="lazy" className="w-full h-auto block" />
            </div>
            <div className="app-card p-5 mt-4 text-center">
              <img src={heartCrystal} alt="" aria-hidden width={256} height={256} className="w-24 h-24 mx-auto object-contain animate-[float_4s_ease-in-out_infinite]" />
              <div className={cn("text-[11px] uppercase tracking-widest font-bold mt-2", camino.tint)}>Día {dayNum} · {camino.short}</div>
              <h1 className="font-display font-extrabold text-[26px] leading-tight mt-1">{etapa.title}</h1>
              <p className="text-[15px] text-muted-foreground mt-3 leading-relaxed text-left">{p.leccion}</p>
              <p className="scripture text-[13px] text-muted-foreground/85 mt-3">“{camino.scripture.text}” — {camino.scripture.ref}</p>
            </div>
            <AffirmationSlider className="mt-4" focus={etapa.focus} caminoId={caminoId} words={p.words ?? []} />
            <Cta onClick={next}>Comenzar la lección</Cta>
          </section>
        )}


        {p && step === 2 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Solución paso a paso" sub="Abre cada paso, aplícalo y guarda lo que descubriste." />
            <ol className="mt-3 space-y-2.5">
              {solutions.map((s, i) => {
                const ok = solDone.includes(i);
                const locked = i > 0 && !solDone.includes(i - 1);
                return (
                  <li key={i}>
                    <button
                      disabled={locked}
                      onClick={() => { setDraft(""); setOpenSol(i); }}
                      className={cn("w-full app-card p-4 text-left grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 active:scale-[.98] transition", locked && "opacity-55")}
                    >
                      <span className={cn("w-11 h-11 rounded-[12px] grid place-items-center text-white bg-gradient-to-br", camino.gradient)}>
                        {ok ? <Check className="w-5 h-5" /> : <span className="font-display font-extrabold">{i + 1}</span>}
                      </span>
                      <span className="min-w-0 text-[14.5px] font-medium leading-snug">{s}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ol>
            <Cta disabled={solDone.length < solutions.length} onClick={next}>
              {solDone.length < solutions.length ? `Completa los ${solutions.length} pasos` : "Continuar"}
            </Cta>

            <Dialog open={openSol !== null} onOpenChange={(o) => !o && setOpenSol(null)}>
              <DialogContent className="rounded-[16px]">
                <DialogHeader><DialogTitle className="font-display text-[19px] leading-snug">Paso {(openSol ?? 0) + 1}</DialogTitle></DialogHeader>
                <p className="text-[14.5px] leading-relaxed">{solutions[openSol ?? 0]}</p>
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} placeholder="¿Cómo lo aplicaste hoy?" className="rounded-[10px]" />
                <button
                  disabled={draft.trim().length < 3}
                  onClick={async () => {
                    const i = openSol ?? 0;
                    if (!solDone.includes(i)) { setSolDone((d) => [...d, i]); await reward("medium", `Paso ${i + 1} · ${etapa.title}`); }
                    setOpenSol(null);
                  }}
                  className="h-[52px] rounded-[12px] btn-primary-gradient text-white text-[16px] font-semibold disabled:opacity-50"
                >
                  Guardar y confirmar
                </button>
              </DialogContent>
            </Dialog>
          </section>
        )}

        {p && step === 3 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Tareas espirituales de hoy" sub="Cada tarea abre lo que necesitas para completarla." />
            <div className="mt-3 space-y-2.5">
              {tasks.map((t, i) => {
                const ok = taskDone.includes(i);
                const kind = taskKind(t);
                const Icon = kind === "oracion" ? HandHeart : kind === "identificar" ? ListChecks : PenLine;
                return (
                  <button key={i} onClick={() => { setDraft(""); setOpenTask(i); }} className="w-full app-card p-4 text-left grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 active:scale-[.98] transition">
                    <span className={cn("w-11 h-11 rounded-[12px] grid place-items-center", ok ? "bg-[#3FBE8F]/15 text-[#2F9C74]" : "bg-primary/10 text-primary")}>
                      {ok ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </span>
                    <span className="min-w-0 text-[14.5px] font-medium leading-snug">{t}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
            <div className="app-card p-4 mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <img src={chest} alt="" aria-hidden width={128} height={128} className="w-14 h-14 object-contain" />
              <p className="text-[13px] text-muted-foreground leading-snug">Completa tus {tasks.length} tareas y abre el cofre del día.</p>
            </div>
            <Cta disabled={taskDone.length < tasks.length} onClick={next}>
              {taskDone.length < tasks.length ? `Faltan ${tasks.length - taskDone.length} tareas` : "Abrir el cofre y seguir"}
            </Cta>

            <Dialog open={openTask !== null} onOpenChange={(o) => !o && setOpenTask(null)}>
              <DialogContent className="rounded-[16px]">
                <DialogHeader><DialogTitle className="font-display text-[19px] leading-snug">Tarea {(openTask ?? 0) + 1}</DialogTitle></DialogHeader>
                <p className="text-[14.5px] leading-relaxed">{tasks[openTask ?? 0]}</p>
                {taskKind(tasks[openTask ?? 0] ?? "") === "oracion" ? (
                  <div className="rounded-[12px] bg-primary/8 p-4">
                    <p className="scripture text-[14.5px] leading-relaxed">{p.oracion}</p>
                  </div>
                ) : null}
                {taskKind(tasks[openTask ?? 0] ?? "") === "identificar" ? (
                  <div className="space-y-2">
                    {(p.fe.slice(0, 2)).map((q, qi) => (
                      <div key={qi} className="rounded-[12px] border border-border p-3">
                        <p className="text-[13.5px] font-semibold">{q.q}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {q.options.map((o, oi) => (
                            <button key={oi} onClick={() => setDraft((d) => `${d}${d ? " · " : ""}${o}`)} className="rounded-[10px] bg-secondary px-3 py-2 text-[12.5px] font-medium">
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  placeholder={taskKind(tasks[openTask ?? 0] ?? "") === "oracion" ? "¿Qué sentiste al orar? (opcional)" : "Escribe aquí tu respuesta…"}
                  className="rounded-[10px]"
                />
                <button
                  onClick={async () => {
                    const i = openTask ?? 0;
                    const kind = taskKind(tasks[i] ?? "");
                    if (kind !== "oracion" && draft.trim().length < 3) { toast.error("Escribe tu respuesta para guardarla."); return; }
                    if (!taskDone.includes(i)) { setTaskDone((d) => [...d, i]); await reward("medium", `Tarea ${i + 1} · ${etapa.title}`); }
                    setOpenTask(null);
                  }}
                  className="h-[52px] rounded-[12px] btn-primary-gradient text-white text-[16px] font-semibold"
                >
                  {taskKind(tasks[openTask ?? 0] ?? "") === "oracion" ? "Confirmo que la realicé" : "Guardar tarea"}
                </button>
              </DialogContent>
            </Dialog>
          </section>
        )}

        {p && step === 4 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Tus notas personales" sub="Escribe sin filtro: nadie más lo lee." />
            <div className="app-card p-5 mt-3">
              <p className="scripture text-[15px]">“{p.afirmacion}”</p>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="¿Qué se movió en ti hoy?" className="mt-3 rounded-[10px]" />
              <div className="mt-3 flex flex-wrap gap-2">
                {["En paz", "Sensible", "Con fe", "Cansada/o", "Agradecida/o"].map((m) => (
                  <button key={m} onClick={() => setMood(m)} className={cn("h-9 rounded-[10px] px-3 text-[12.5px] font-semibold", mood === m ? "bg-primary text-white" : "bg-secondary text-foreground")}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <Cta disabled={notes.trim().length < 5 || !mood} onClick={next}>Guardar mi nota</Cta>
          </section>
        )}

        {p && step === 5 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Mini quiz del día" sub="Una pregunta para fijar la lección." />
            <div className="app-card p-5 mt-3">
              <img src={brain3d} alt="" aria-hidden width={128} height={128} className="w-16 h-16 object-contain" />
              <p className="font-display font-bold text-[18px] leading-snug mt-2">{p.fe[0]?.q}</p>
              <div className="mt-3 space-y-2">
                {(p.fe[0]?.options ?? []).map((o, i) => (
                  <button
                    key={i}
                    disabled={quizPick !== null}
                    onClick={async () => {
                      setQuizPick(i);
                      if (i === p.fe[0]?.correct) { setFeedback("ok"); await reward("medium", "Quiz del día"); }
                      else setFeedback("fail");
                    }}
                    className={cn("w-full min-h-[52px] rounded-[12px] px-4 py-3 text-left text-[15px] font-medium transition",
                      quizPick === null ? "bg-secondary" : i === p.fe[0]?.correct ? "bg-[#2F9A73] text-white font-bold" : quizPick === i ? "bg-[#D64545]/14 text-[#B91C1C] font-bold" : "bg-secondary/70 opacity-60")}
                  >
                    {o}
                  </button>
                ))}

              </div>
            </div>
            <Cta disabled={quizPick === null} onClick={next}>Continuar</Cta>
          </section>
        )}

        {p && step === 6 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Suelta lo que pesa" sub="Toca las cargas que quieres entregar hoy." />
            <div className="mt-3 rounded-[16px] p-5 bg-gradient-to-br from-[#EEE7FF] via-[#FDEEF8] to-[#E8F3FF] border border-border shadow-soft">
              <div className="flex flex-wrap gap-2">
                {p.cargas.map((c) => {
                  const sel = cargas.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setCargas((v) => (sel ? v.filter((x) => x !== c) : [...v, c]))}
                      className={cn("h-10 rounded-full px-4 text-[13.5px] font-semibold transition active:scale-[.97]",
                        sel ? "bg-primary text-white line-through" : "bg-card text-foreground shadow-soft")}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <img src={chest} alt="" aria-hidden width={192} height={192} className="w-24 h-24 mx-auto mt-4 object-contain" />
              <p className="text-center text-[13px] text-muted-foreground">{cargas.length} de {p.cargas.length} entregadas al cofre</p>
            </div>
            <Cta disabled={cargas.length < 3} onClick={async () => { await reward("medium", "Cargas entregadas"); next(); }}>
              {cargas.length < 3 ? "Elige al menos 3" : "Entregar y continuar"}
            </Cta>
          </section>
        )}

        {p && step === 7 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Sopa de letras del tema" sub="Encuentra las palabras clave de tu etapa." />
            <div className="mt-3">
              <WordSearch words={p.words} storageKey={caminoVariant(caminoId, dayNum)} gemsReward={40} />
            </div>
            <Cta onClick={next}>Continuar</Cta>
          </section>
        )}

        {p && step === 8 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Memoria de promesas" sub="Empareja las promesas: 10 parejas nuevas cada día." />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {memoryCards.map((card, i) => {
                const open = flipped.includes(i) || matched.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (open || flipped.length === 2) return;
                      const nf = [...flipped, i];
                      setFlipped(nf);
                      if (nf.length === 2) {
                        const [a, b] = nf;
                        if (memoryCards[a].text === memoryCards[b].text) {
                          setMatched((m) => [...m, a, b]);
                          setFlipped([]);
                          if (matched.length + 2 >= memoryCards.length) void reward("major", "Memoria de promesas");
                        } else setTimeout(() => setFlipped([]), 700);
                      }
                    }}
                    className={cn("aspect-square rounded-[12px] p-1 text-[9.5px] font-bold leading-tight grid place-items-center text-center transition",
                      open ? "bg-card text-foreground shadow-soft" : cn("text-white bg-gradient-to-br", camino.gradient))}
                  >
                    {open ? card.text : <Sparkles className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
            <Cta disabled={matched.length < memoryCards.length} onClick={next}>
              {matched.length < memoryCards.length ? `${matched.length / 2} de ${memoryCards.length / 2} parejas` : "Continuar"}
            </Cta>
          </section>
        )}

        {p && step === 9 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Camino de fe" sub={`Pregunta ${feIdx + 1} de ${p.fe.length}`} />
            <div className="mt-3 relative rounded-[16px] overflow-hidden shadow-soft">
              <img src={caminoFe} alt="" aria-hidden width={512} height={512} className="w-full h-40 object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/20" />
            </div>
            <div className="app-card p-5 mt-3">
              <p className="font-display font-bold text-[18px] leading-snug">{p.fe[feIdx]?.q}</p>
              <div className="mt-3 space-y-2">
                {(p.fe[feIdx]?.options ?? []).map((o, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      const ok = i === p.fe[feIdx]?.correct;
                      setFeedback(ok ? "ok" : "fail");
                      if (ok) { setFeOk((n) => n + 1); await reward("minor", "Camino de fe"); }
                      setTimeout(() => {
                        if (feIdx + 1 < p.fe.length) setFeIdx(feIdx + 1); else next();
                      }, 700);
                    }}
                    className="w-full min-h-[52px] rounded-[12px] bg-secondary px-4 py-3 text-left text-[15px] font-medium active:scale-[.98] transition"
                  >
                    {o}
                  </button>
                ))}

              </div>
            </div>
          </section>
        )}

        {p && step === 10 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Clasifica tus emociones" sub="¿Qué sueltas y qué recibes hoy?" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[...p.emociones.cargas, ...p.emociones.sanas].map((e) => (
                <div key={e} className="app-card p-3">
                  <div className="text-[13.5px] font-semibold truncate">{e}</div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button onClick={() => setEmo((v) => ({ ...v, [e]: "soltar" }))} className={cn("h-9 rounded-[10px] text-[11.5px] font-bold", emo[e] === "soltar" ? "bg-primary text-white" : "bg-secondary")}>Soltar</button>
                    <button onClick={() => setEmo((v) => ({ ...v, [e]: "recibir" }))} className={cn("h-9 rounded-[10px] text-[11.5px] font-bold", emo[e] === "recibir" ? "bg-[#3FBE8F] text-white" : "bg-secondary")}>Recibir</button>
                  </div>
                </div>
              ))}
            </div>

            <H title="Cuestionario de ánimo" sub="Responde con honestidad: esto es solo para cuidarte." className="mt-6" />
            <div className="mt-3 space-y-2.5">
              {p.bienestar.map((q, qi) => (
                <div key={qi} className="app-card p-4">
                  <p className="text-[14px] font-semibold leading-snug">{q.q}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.options.map((o, oi) => (
                      <button key={oi} onClick={() => setBienestar((v) => ({ ...v, [qi]: oi }))} className={cn("h-10 rounded-[10px] px-3 text-[12.5px] font-semibold", bienestar[qi] === oi ? "bg-primary text-white" : "bg-secondary")}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {Object.values(bienestar).some((v) => v >= 2) && (
              <div className="mt-3 rounded-[16px] border-2 border-[#F58BCB] bg-[#F58BCB]/8 p-4">
                <p className="text-[14px] font-semibold text-[#B44E8C]">No estás sola/o en esto.</p>
                <p className="text-[13px] text-muted-foreground mt-1 leading-snug">Habla hoy con alguien de confianza y, si el dolor es fuerte, busca ayuda profesional o de emergencia en tu país. Tu vida importa.</p>
              </div>
            )}
            <Cta
              disabled={Object.keys(emo).length < 6 || Object.keys(bienestar).length < p.bienestar.length}
              onClick={async () => { await reward("medium", "Clasificación emocional"); next(); }}
            >
              Continuar
            </Cta>
          </section>
        )}

        {/* ── Juegos 3D del tema, pantalla completa (pasos 11–17) ── */}
        {p && step >= 11 && step <= 16 && (
          <StageGameStep
            kind={(["cofre", "adivina", "pimpon", "pez", "dardo", "cofre"] as GameKind[])[step - 11]!}
            context={{
              good: (p.words ?? []).length ? p.words! : [etapa.focus],
              bad: p.cargas ?? ["Miedo", "Culpa", "Prisa"],
              mainWord: etapa.focus ?? etapa.title,
            }}
            storageKey={`${user?.id ?? "anon"}:${caminoId}-d${dayNum}:step-${step}`}
            onWin={() => reward("medium", `Juego 3D día ${dayNum}`)}
            onNext={next}
            onClose={() => navigate({ to: "/caminos/$caminoId", params: { caminoId } })}
          />

        )}

        {p && step === 17 && (
          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Retos mentales" sub="Atención y memoria, cortito." />
            <div className="mt-3 space-y-3">
              <MentalTasks tasks={p.words ?? []} onComplete={() => reward("minor", "Retos mentales")} />
              <MemoryPairs storageKey={`camino-${caminoId}-${dayNum}`} />
            </div>
            <Cta onClick={next}>Continuar</Cta>
          </section>
        )}

        {p && step === 18 && (

          <section style={{ animation: "fade-in .4s ease-out both" }}>
            <H title="Tu resumen de hoy" sub="Esto es lo que trabajaste." />
            <div className="app-card p-5 mt-3">
              <img src={robot} alt="" aria-hidden width={160} height={160} className="w-20 h-20 object-contain" />
              <p className="text-[15px] leading-relaxed mt-2">{p.resumen}</p>
              <ul className="mt-4 space-y-2">
                {[`${solDone.length} soluciones aplicadas`, `${taskDone.length} tareas espirituales`, `${cargas.length} cargas entregadas`, `${feOk} respuestas de fe correctas`].map((t) => (
                  <li key={t} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/12 text-primary grid place-items-center"><Check className="w-3.5 h-3.5" /></span>
                    <span className="text-[14px]">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Cta onClick={next}>Ver mi recompensa</Cta>
          </section>
        )}

        {p && step === 19 && (
          <section className="text-center" style={{ animation: "fade-in .4s ease-out both" }}>
            <img src={star3d} alt="" aria-hidden width={192} height={192} className="w-24 h-24 mx-auto object-contain animate-[float_4s_ease-in-out_infinite]" />
            <h2 className="font-display font-extrabold text-[26px] leading-tight mt-2">¡Día completado!</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Podium label="Hojas" value={`+${earned || 60}`} icon={<Leaf className="w-4 h-4 text-[#3FBE8F]" />} />
              <Podium label="XP" value={`+${DAY_XP}`} icon={<Sparkles className="w-4 h-4 text-primary" />} />
              <Podium label="Insignia" value={etapa.insignia} icon={<Award className="w-4 h-4 text-gold" />} />
            </div>
            <Cta onClick={finishDay}>Guardar mi progreso</Cta>
          </section>
        )}

        {p && step === 20 && (
          <section className="text-center" style={{ animation: "fade-in .4s ease-out both" }}>
            <img src={tree} alt="" aria-hidden width={256} height={256} className="w-28 h-28 mx-auto object-contain" />
            <h2 className="font-display font-extrabold text-[26px] leading-tight mt-2">Tu racha sigue activa</h2>
            <p className="text-[15px] text-muted-foreground mt-2">{dayNum < CAMINO_TOTAL_DAYS ? "Mañana se abre tu siguiente día. Un paso a la vez." : "Completaste este camino entero. Sigue con otro tema cuando quieras."}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF7A3C]/12 px-4 py-2 text-[14px] font-bold text-[#D9541B]">
              <Flame className="w-4 h-4" /> {profile?.consecutive_days ?? 1} días de racha
            </div>
            <div className="mt-6 text-left">
              <DailyGames
                words={[...(p.words ?? []), etapa.focus]}
                title="Juegos del día"
                subtitle={`Diez juegos mentales pensados para ${etapa.title.toLowerCase()}.`}
              />
            </div>

            <Link to="/caminos/$caminoId" params={{ caminoId }} className="mt-6 w-full h-14 rounded-[12px] btn-primary-gradient text-white text-[17px] font-semibold inline-flex items-center justify-center gap-2">
              Volver a mi mapa <ArrowRight className="w-5 h-5" />
            </Link>
            <button onClick={() => navigate({ to: "/categorias" })} className="mt-3 w-full h-12 rounded-[12px] bg-secondary text-[15px] font-semibold">Ver otras categorías</button>
          </section>
        )}

      </main>
    </div>
  );
}

function H({ title, sub, className }: { title: string; sub?: string; className?: string }) {
  return (
    <div className={className}>
      <h2 className="font-display font-extrabold text-[22px] leading-tight">{title}</h2>
      {sub && <p className="text-[13.5px] text-muted-foreground mt-1 leading-snug">{sub}</p>}
    </div>
  );
}

function Cta({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-4 w-full h-14 rounded-[12px] btn-primary-gradient text-white text-[17px] font-semibold inline-flex items-center justify-center gap-2 active:scale-[.97] transition disabled:opacity-50"
    >
      {children} <ArrowRight className="w-5 h-5" />
    </button>
  );
}

function Podium({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="app-card p-3">
      <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
      <div className="mt-1 inline-flex items-center gap-1.5">
        <span className="font-display font-extrabold text-[15px] leading-tight">{value}</span>
        {icon}
      </div>
    </div>
  );
}
