import { SubtopicIcon } from "@/components/visualiza/SubtopicIcon";
import { resolvePractice } from "@/lib/visualiza-content";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Play, Pause, Download, ArrowLeft, Check, Headphones, Lock } from "lucide-react";
import { getUserPlan } from "@/lib/plan";
import { FREE_AUDIOS } from "@/components/visualiza/CustomTopic";
import { jsPDF } from "jspdf";
import { jsPdfLogo, jsPdfPromoPage, METHOD_TITLE } from "@/lib/pdf-brand";
import { awardLeaf } from "@/lib/gems";
import { CELEBRATIONS } from "@/lib/celebrate-step";
import { WordSearch } from "@/components/WordSearch";
import { StageQuiz } from "@/components/StageQuiz";
import lessonCover from "@/assets/explore/listen.jpg";

export const Route = createFileRoute("/_authenticated/visualiza/$categoryId/$day")({
  head: () => ({ meta: [{ title: "Práctica de Visualízalo y Vívelo — ORÍGEN" }, { name: "description", content: "Audio, afirmación y práctica guiada del día." }, { property: "og:image", content: "https://tuorigen.app/og/visualiza.jpg" }, { name: "twitter:image", content: "https://tuorigen.app/og/visualiza.jpg" }, { property: "og:title", content: "Práctica de Visualízalo y Vívelo — ORÍGEN" }, { property: "og:description", content: "Audio, afirmación y práctica guiada del día." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  validateSearch: (s: Record<string, unknown>): { reproducir?: number } => (s.reproducir ? { reproducir: 1 } : {}),
  component: DayPlayer,
});

function DayPlayer() {
  const { categoryId, day } = useParams({ from: "/_authenticated/visualiza/$categoryId/$day" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [yaTengo, setYaTengo] = useState("");
  const [yoSoy, setYoSoy] = useState("");
  const [gratitud, setGratitud] = useState("");
  const [peticion, setPeticion] = useState("");

  const { data } = useQuery({
    queryKey: ["day-audio", categoryId, day, user?.id],
    queryFn: async () => {
      const [cat, audio] = await Promise.all([
        supabase.from("manifest_categories").select("*").eq("id", categoryId).maybeSingle(),
        supabase.from("manifest_audios").select("*").eq("category_id", categoryId).eq("day_index", Number(day)).maybeSingle(),
      ]);
      const entry = audio.data && user ? await supabase.from("manifest_entries").select("*").eq("user_id", user.id).eq("audio_id", audio.data.id).maybeSingle() : { data: null };
      const plan = user ? await getUserPlan(user.id) : "explorador";
      const { data: siblings } = await supabase.from("manifest_audios").select("id, title, day_index, affirmation, lesson, exercise, quiz, word_game").eq("category_id", categoryId).order("day_index");
      let position = Number(day);
      if ((cat.data as any)?.is_custom && audio.data) {
        const audioDay = audio.data.day_index;
        const { data: list } = await supabase.from("manifest_audios").select("day_index").eq("category_id", categoryId).order("day_index");
        position = (list ?? []).findIndex((r) => r.day_index === audioDay) + 1;
      }
      const { data: unlocks } = user ? await supabase.from("audio_unlocks").select("audio_id").eq("user_id", user.id) : { data: [] as { audio_id: string | null }[] };
      const credits = (unlocks ?? []).filter((u) => !u.audio_id).length;
      const audioId = audio.data?.id;
      const unlocked = !!audioId && (unlocks ?? []).some((u) => u.audio_id === audioId);
      const hiddenByPlan = !audio.data && plan !== "camino" && Number(day) > FREE_AUDIOS;
      return { cat: cat.data, audio: audio.data, siblings: siblings ?? [], entry: entry.data, credits, locked: hiddenByPlan || (plan !== "camino" && position > FREE_AUDIOS && !unlocked) };
    },
  });

  useEffect(() => {
    if (!data?.entry) return;
    setYaTengo(data.entry.ya_tengo ?? "");
    setYoSoy(data.entry.yo_soy ?? "");
    setGratitud(data.entry.gratitud ?? "");
    setPeticion(data.entry.peticion ?? "");
  }, [data?.entry]);

  const c = data?.cat;
  const a = data?.audio;

  const { reproducir } = Route.useSearch();
  const autoplayed = useRef(false);
  useEffect(() => {
    if (!reproducir || autoplayed.current || !a?.audio_url) return;
    const el = audioRef.current;
    if (!el) return;
    autoplayed.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.play().then(() => { setPlaying(true); markPlayed(); }).catch(() => { /* el navegador pidió un toque: queda listo el botón */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reproducir, a?.audio_url]);

  async function togglePlay() {
    if (!audioRef.current || !a?.audio_url) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); return; }
    try { await audioRef.current.play(); setPlaying(true); void markPlayed(); }
    catch { toast.error("No pudimos reproducir el audio. Vuelve a tocar escuchar; si continúa, avisa al administrador."); }
  }

  async function markPlayed() {
    if (!user || !a) return;
    await supabase.from("manifest_entries").upsert({ user_id: user.id, audio_id: a.id, played: true }, { onConflict: "user_id,audio_id" });
  }

  async function saveAndComplete() {
    if (!user || !a) return;
    if (!yaTengo.trim() || !yoSoy.trim() || !gratitud.trim() || !peticion.trim()) return toast.error("Completa los 4 campos del método.");
    const { error } = await supabase.from("manifest_entries").upsert({
      user_id: user.id, audio_id: a.id, ya_tengo: yaTengo, yo_soy: yoSoy, gratitud, peticion, played: true, completed: true,
    }, { onConflict: "user_id,audio_id" });
    if (error) return toast.error(error.message);
    await awardLeaf("visualiza", "major", `Día ${a.day_index} — ${c?.title ?? "Manifestación"}`);
    CELEBRATIONS.vivelo();
    qc.invalidateQueries();
  }

  async function downloadPdf() {
    if (!c || !a) return;
    const doc = new jsPDF({ format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    doc.setFont("times", "italic"); doc.setFontSize(11);
    await jsPdfLogo(doc as never, 4);
    doc.text(`CATEGORÍA: ${c.title.toUpperCase()}`, w / 2, 24, { align: "center" });
    doc.setFont("times", "bold"); doc.setFontSize(15);
    doc.text(METHOD_TITLE, w / 2, 33, { align: "center" });
    doc.setFont("helvetica", "italic"); doc.setFontSize(10);
    doc.text(`Hoy es: ___/___/____   ·   Día ${a.day_index}`, w / 2, 42, { align: "center" });

    let y = 55;
    const section = (label: string, box: number) => {
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.setTextColor(30);
      const lines = doc.splitTextToSize(label, w - 30);
      doc.text(lines, 15, y); y += lines.length * 5 + 2;
      doc.setDrawColor(150); doc.setLineWidth(0.3); doc.roundedRect(15, y, w - 30, box, 3, 3);
      y += box + 8;
    };
    section("Escribe 3 veces aquello que ya ves realizado en tu vida por fe en tiempo presente", 28);
    section("Escribe 6 veces la identidad que estás desarrollando para caminar en esa promesa", 45);
    section("Escribe 9 veces una declaración de gratitud conforme a la voluntad de Dios", 60);
    section("Finaliza cada ejercicio escribiendo una petición sencilla y directa", 18);
    doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(120);
    doc.text("Tu práctica personal — ORÍGEN", w / 2, 285, { align: "center" });
    await jsPdfPromoPage(doc as never);
    doc.save(`metodo-origen-${categoryId}-dia${day}.pdf`);
  }

  async function applyUnlock() {
    const { data: ok } = await supabase.rpc("claim_audio_unlock", { _category_id: categoryId, _day_index: Number(day) });
    if (!ok) return toast.error("No pudimos usar tu desbloqueo. Intenta de nuevo.");
    qc.invalidateQueries({ queryKey: ["day-audio"] });
  }

  if (!data) return <div className="mx-auto max-w-2xl space-y-3 p-4"><div className="h-56 animate-pulse rounded-[16px] bg-muted" /><div className="h-24 animate-pulse rounded-[16px] bg-muted" /><div className="h-40 animate-pulse rounded-[16px] bg-muted" /></div>;
  if (data.locked)
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><Lock className="h-6 w-6" /></span>
        <p className="mt-3 font-display text-[20px] font-bold">Tus {FREE_AUDIOS} audios gratis ya están abiertos</p>
        <p className="mt-1 text-[14px] text-muted-foreground">Este audio y el resto del programa se abren con Membresía ORÍGEN.</p>
        {data.credits > 0 && (
          <button onClick={applyUnlock} className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-[12px] bg-primary/10 font-bold text-primary">Usar mi desbloqueo de la ruleta</button>
        )}
        <Link to="/membresia" className="mt-3 flex min-h-[52px] items-center justify-center rounded-[12px] bg-primary font-bold text-primary-foreground">Desbloquear todo</Link>
        <Link to="/visualiza/$categoryId" params={{ categoryId }} className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary">Volver al tema</Link>
      </div>
    );
  if (!c || !a)
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="font-display text-[18px] font-bold">Esta práctica todavía no está lista</p>
        <p className="mt-1 text-[14px] text-muted-foreground">Vuelve al tema y elige otra mientras la preparamos.</p>
        <Link to="/visualiza/$categoryId" params={{ categoryId }} className="mt-4 inline-flex min-h-11 items-center rounded-[12px] bg-primary/10 px-4 font-bold text-primary">Volver al tema</Link>
      </div>
    );
  if (data.locked)
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><Lock className="h-6 w-6" /></span>
        <p className="mt-3 font-display text-[20px] font-bold">Tus {FREE_AUDIOS} audios gratis ya están abiertos</p>
        <p className="mt-1 text-[14px] text-muted-foreground">"{a.title}" y el resto del programa se abren con Camino ORÍGEN.</p>
        <Link to="/membresia" className="mt-5 flex min-h-[52px] items-center justify-center rounded-[12px] bg-primary font-bold text-primary-foreground">Desbloquear todo</Link>
        <Link to="/visualiza/$categoryId" params={{ categoryId }} className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary">Volver al tema</Link>
      </div>
    );
  const audioOnly = Boolean((a as any).audio_only);
  const content = resolvePractice(c.title, a, data.siblings);
  const game = { words: content.search_words };
  const questions = content.quiz;
  const tasks = content.tasks;
  const materials: string[] = Array.isArray((a as any).quiz?.materials) ? (a as any).quiz.materials : [];
  const steps: string[] = Array.isArray((a as any).quiz?.recipe_steps) ? (a as any).quiz.recipe_steps : Array.isArray((a as any).quiz?.steps) ? (a as any).quiz.steps : [];
  const page = c.page && typeof c.page === "object" && !Array.isArray(c.page) ? c.page as Record<string, unknown> : {};
  const pageCover = typeof page["cover_step3"] === "string" ? page["cover_step3"] : null;

  return (
    <div className="pb-32">
      <div className="relative overflow-hidden bg-sanctuary text-sanctuary-foreground">
        <img src={pageCover || c.cover_url || lessonCover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-sanctuary/80" />
        <div className="relative max-w-3xl mx-auto px-4 md:px-8 pt-6 pb-10">
          <Link to="/visualiza/$categoryId" params={{ categoryId }} className="inline-flex min-h-11 items-center gap-2 text-sanctuary-foreground text-sm"><ArrowLeft className="w-4 h-4" /> {c.title}</Link>
          <div className="text-center mt-6">
            <div className="text-[12px] uppercase text-sanctuary-foreground/80 font-bold">{(c as any).is_custom ? `#${String(a.day_index).padStart(2, "0")} · ${c.title}` : `Día ${a.day_index} de 21`}</div>
            <div className="mx-auto mt-4 h-32 w-32 grid place-items-center rounded-[16px] border border-sanctuary-border bg-sanctuary-panel">
              <SubtopicIcon title={a.title} category={c.title} className="h-full w-full text-6xl" />
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="text-[12px] uppercase text-sanctuary-foreground/80 font-bold">{a.affirmation ? "Afirmación del día" : "Tu práctica de hoy"}</div>
            <p className="font-display font-extrabold text-2xl mt-2 text-sanctuary-foreground leading-tight">{content.affirmation}</p>
            <p className="text-sm text-sanctuary-foreground/80 mt-3">Repite: Mañana <b>3 veces</b> · Tarde <b>6 veces</b> · Noche <b>9 veces</b> — durante 21 días.</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-5">
        
        {!audioOnly && (game?.words?.length ?? 0) >= 3 && <WordSearch words={game?.words ?? []} storageKey={`practice-words-${a.id}`} gemsReward={5} />}
        {!audioOnly && questions.length > 0 && <StageQuiz storageKey={`practice-quiz-${a.id}`} gemsPerCorrect={2} items={questions.map(q => ({ q: q.question, options: q.options, correct: q.correctIndex, tip: q.explanation ?? "" }))} />}
        <Card className="rounded-[1.7rem] p-5 shadow-soft">
          {a.audio_url ? (
            <>
              <audio
                ref={audioRef}
                src={a.audio_url}
                aria-label="Audio de la práctica"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onEnded={() => { setPlaying(false); markPlayed(); }}
              />
              <div className="flex items-center gap-4">
                <Button onClick={togglePlay} size="icon" className="h-14 w-14 rounded-full bg-primary shadow-glow">
                  {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{a.title}</div>
                  <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
                    <span>{fmt(progress)}</span><span>{fmt(duration)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Headphones className="w-10 h-10 mx-auto text-muted-foreground/60" />
               <p className="text-sm text-muted-foreground mt-3">Esta práctica no requiere audio. Continúa con la lección y el ejercicio escrito.</p>
            </div>
          )}
        </Card>

         {materials.length > 0 && <Card className="rounded-[1.7rem] p-5 shadow-soft"><h2 className="font-display font-bold text-lg">Materiales</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{materials.map((m) => <li key={m} className="flex gap-2 text-sm"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"><Check className="h-3 w-3" /></span>{m}</li>)}</ul></Card>}
         {steps.length > 0 && <Card className="rounded-[1.7rem] p-5 shadow-soft"><h2 className="font-display font-bold text-lg">Paso a paso</h2><ol className="mt-3 space-y-3">{steps.map((st, i) => <li key={st} className="flex gap-3 text-sm"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">{i + 1}</span><span className="pt-1">{st}</span></li>)}</ol></Card>}
         {!audioOnly && tasks.length > 0 && <Card className="rounded-[1.7rem] p-5 shadow-soft"><h2 className="font-display font-bold text-lg">Tareas de hoy</h2><ul className="mt-3 space-y-2">{tasks.map((t) => <li key={t} className="flex gap-2 text-sm"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"><Check className="h-3 w-3" /></span>{t}</li>)}</ul></Card>}
         {!audioOnly && (content.lesson || content.exercise || a.pdf_url) && <Card className="rounded-[1.7rem] p-5 md:p-6 shadow-soft space-y-3">
           {content.lesson && <div><h2 className="font-display font-bold text-lg">Lección del día</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{content.lesson}</p></div>}
           {content.exercise && <div><h2 className="font-display font-bold text-lg">Ejercicio o receta</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{content.exercise}</p></div>}
           {a.pdf_url && <a href={a.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-primary underline"><Download className="h-4 w-4" /> Abrir PDF de apoyo</a>}
         </Card>}
         {!audioOnly && <Card className="rounded-[1.7rem] p-5 md:p-6 shadow-soft">
          <div className="text-[11px] uppercase tracking-widest text-primary font-bold">Tu ejercicio Método de Cristo</div>
          <div className="mt-4 space-y-5">
            <Field label="Escribe 3 veces aquello que ya ves realizado en tu vida por fe en tiempo presente (YA TENGO)" value={yaTengo} set={setYaTengo} placeholder={content.affirmation} rows={3} />
            <Field label="Escribe 6 veces la identidad que estás desarrollando para caminar en esa promesa (YO SOY)" value={yoSoy} set={setYoSoy} placeholder={`En «${a.title}», ¿qué actitud responsable deseas practicar?`} rows={5} />
            <Field label="Escribe 9 veces una declaración de gratitud conforme a la voluntad de Dios (GRATITUD)" value={gratitud} set={setGratitud} placeholder={`¿Qué agradeces al trabajar «${a.title}»?`} rows={7} />
            <Field label="Finaliza con una petición sencilla y directa al Espíritu Santo" value={peticion} set={setPeticion} placeholder={`¿Qué ayuda pides a Dios para «${a.title}»?`} rows={2} />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={saveAndComplete} className="flex-1 rounded-full h-12 bg-primary"><Check className="w-4 h-4 mr-2" /> Guardar y marcar completado</Button>
            <Button onClick={downloadPdf} variant="outline" className="rounded-full h-12"><Download className="w-4 h-4 mr-2" /> Descargar PDF imprimible</Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-3">Tu práctica queda guardada en ORÍGEN.</p>
        </Card>}
      </div>
    </div>
  );
}

function Field({ label, value, set, placeholder, rows }: { label: string; value: string; set: (v: string) => void; placeholder: string; rows: number }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Textarea value={value} onChange={(e) => set(e.target.value)} rows={rows} placeholder={placeholder} className="mt-2 rounded-2xl font-mono text-sm" />
    </div>
  );
}

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60); const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}
