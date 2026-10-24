import { ManagedImage } from "@/components/ManagedImage";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { christianContent } from "@/lib/christian-language";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { getUserPlan } from "@/lib/plan";
import { chargeConsulta, hasHojas, readBalancePoints, wholeHojas } from "@/lib/gems";
import { printConsulta } from "@/lib/print-pdf";
import { ConsultaHistorial, type ConsultaHistorialItem } from "@/components/ConsultaHistorial";
import { ConsultaPDFButton } from "@/components/ConsultaPDFButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Lock, Sparkles, Heart, TreeDeciduous, Users, MessageCircle, RefreshCw, Home, BookOpen, PenLine, Headphones, GraduationCap, Leaf } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import step1Asset from "@/assets/patrones-step1.png";
import step2Asset from "@/assets/patrones-step2.png";
import e3dBrain from "@/assets/e3d-brain.png";
import e3dStar from "@/assets/e3d-star.png";
import e3dHeartgem from "@/assets/e3d-heartgem.png";
import e3dCross from "@/assets/e3d-cross.png";

export const Route = createFileRoute("/_authenticated/patrones")({
  head: () => ({ meta: [
    { title: "Explora tus patrones familiares — ORÍGEN" },
    { name: "description", content: "Explora dinámicas familiares y pasos de cuidado emocional desde la fe cristiana con ORÍGEN." },
    { property: "og:title", content: "Explora tus patrones familiares — ORÍGEN" },
    { property: "og:description", content: "Comprende lo que se repite y encuentra pasos para cuidar tus vínculos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PatronesPage,
});

type AIResult = {
  observation: string;
  patterns: string[];
  reflection: string;
  recommendations: string[];
  needs_more?: boolean | string;
};

type PatronesRow = {
  id: string;
  created_at: string;
  name: string | null;
  birthdate: string | null;
  question: string | null;
  observation: string | null;
  patterns: unknown;
  reflection: string | null;
  recommendations: unknown;
};

const ANALYSIS_LINES = [
  "Analizando la información de tu árbol genealógico...",
  "Identificando patrones familiares recurrentes...",
  "Relacionando la información de tu proceso personal...",
  "Preparando una reflexión personalizada...",
  "Finalizando análisis...",
];

const CONSULTA_COST_HOJAS = 1;

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [];
}

function PatronesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [question, setQuestion] = useState("");
  const [progress, setProgress] = useState(0);
  const [line, setLine] = useState(0);
  const [result, setResult] = useState<AIResult | null>(null);
  const [gems, setGems] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>("Explorador");
  const [userMeta, setUserMeta] = useState<{ name: string; email: string }>({ name: "", email: "" });
  const [history, setHistory] = useState<PatronesRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, tier] = await Promise.all([
        supabase.from("profiles").select("gems, display_name, full_name, email").eq("id", user.id).maybeSingle(),
        getUserPlan(user.id),
      ]);
      setGems(profile?.gems ?? 0);
      setPlan(tier === "camino" ? "Camino Origen" : "Explorador");
      setUserMeta({ name: profile?.display_name || profile?.full_name || "", email: profile?.email || user.email || "" });
      if (!name) setName(profile?.display_name || profile?.full_name || "");
      await loadHistory();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadHistory() {
    if (!user) return;
    setHistoryLoading(true);
    setHistoryError(null);
    const { data, error } = await supabase
      .from("patrones_consultas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) setHistoryError("No pudimos cargar tu historial de consultas.");
    setHistory(((data as unknown as PatronesRow[]) ?? []).map((row) => ({ ...row, observation: christianContent(row.observation), patterns: christianContent(row.patterns), reflection: christianContent(row.reflection), recommendations: christianContent(row.recommendations) })));
    setHistoryLoading(false);
  }

  const hasEnoughGems = gems === null || hasHojas(gems, CONSULTA_COST_HOJAS);

  async function beginAnalysis() {
    if (!name.trim()) return toast.error("Escribe tu nombre");
    if (!question.trim() || question.trim().length < 8) return toast.error("Describe brevemente tu consulta");
    {
      const points = await readBalancePoints();
      setGems(points);
      if (!hasHojas(points, CONSULTA_COST_HOJAS)) {
        return toast.error(`Necesitas ${CONSULTA_COST_HOJAS} hoja para esta consulta. Tienes ${wholeHojas(points)}.`);
      }
    }
    setDir(1);
    setStep(2);
    setProgress(0);
    setLine(0);

    const [{ data: intake }, { data: family }] = await Promise.all([
      supabase.from("intake_sessions").select("genealogy, childhood, ai_plan").eq("user_id", user!.id).maybeSingle(),
      supabase.from("family_members").select("full_name, relationship, lineage").eq("user_id", user!.id),
    ]);

    const startedAt = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(95, Math.round((elapsed / 9000) * 100)));
      setLine((l) => Math.min(l + 1, ANALYSIS_LINES.length - 1));
    }, 1600);

    try {
      const [r] = await Promise.all([
        fetch("/api/patrones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            birthdate,
            question: question.trim(),
            profile: { display_name: userMeta.name },
            intake,
            family: family ?? [],
          }),
        }),
        new Promise((res) => setTimeout(res, 8000)),
      ]);
      clearInterval(progressTimer);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Error");
      setProgress(100);
      setResult(christianContent(j));
      if (user) {
        await supabase.from("patrones_consultas").insert({
          user_id: user.id,
          name: name.trim(),
          birthdate: birthdate || null,
          question: question.trim(),
          observation: j.observation,
          patterns: j.patterns,
          reflection: j.reflection,
          recommendations: j.recommendations,
        });
        const charge = await chargeConsulta("patrones", CONSULTA_COST_HOJAS);
        setGems(charge.balance);
        await loadHistory();
      }
      setDir(1);
      setStep(3);
    } catch (e) {
      clearInterval(progressTimer);
      toast.error((e as Error).message);
      setDir(-1);
      setStep(1);
    }
  }

  function reset() {
    setResult(null);
    setQuestion("");
    setDir(-1);
    setStep(1);
  }

  function downloadResultPdf(r: AIResult, subtitle?: string) {
    printConsulta({
      kind: "Consulta de Patrones Familiares",
      title: "Tu Reflexión Personal",
      subtitle,
      userName: userMeta.name,
      userEmail: userMeta.email,
      plan,
      sections: [
        { icon: "✨", title: "Lo que observamos", body: r.observation ?? "" },
        { icon: "🌳", title: "Posibles patrones identificados", body: (r.patterns ?? []).map((p) => `• ${p}`).join("\n") },
        { icon: "💞", title: "Reflexión personalizada", body: r.reflection ?? "" },
        { icon: "📖", title: "Recursos recomendados", body: (r.recommendations ?? []).map((x) => `• ${x}`).join("\n") },
      ],
    });
  }

  async function downloadHistoryItem(id: string) {
    setPdfLoading(true);
    try {
      const row = history.find((h) => h.id === id);
      if (!row) return;
      downloadResultPdf(
        {
          observation: row.observation ?? "",
          patterns: toStringArray(row.patterns),
          reflection: row.reflection ?? "",
          recommendations: toStringArray(row.recommendations),
        },
        row.question ? `Consulta: ${row.question}` : undefined,
      );
    } finally {
      setPdfLoading(false);
    }
  }

  const historyItems: ConsultaHistorialItem[] = history.map((h) => ({
    id: h.id,
    created_at: h.created_at,
    title: h.question?.trim() ? h.question : `Consulta de patrones: ${h.name ?? ""}`,
  }));

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Ambient lights */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 w-[30rem] h-[30rem] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(124,92,255,0.16), transparent 65%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(245,139,203,0.14), transparent 65%)" }} />
      <div aria-hidden className="pointer-events-none absolute top-1/3 right-1/4 w-[20rem] h-[20rem] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(97,168,255,0.10), transparent 65%)" }} />

      <div className="relative z-10 mx-auto max-w-lg px-5 pt-6 pb-16">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" aria-label="Volver al inicio" className="w-11 h-11 rounded-full bg-white shadow-soft grid place-items-center">
            <ArrowLeft className="w-4 h-4 text-[#1B1B27]" />
          </Link>
          <div className="text-[13px] font-medium text-[#64667A]">Paso {step} de 3</div>
          <div className="w-10" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              s <= step ? "w-14 bg-gradient-to-r from-[#7C5CFF] via-[#61A8FF] to-[#F58BCB]" : "w-8 bg-[#ECEEF5]"
            )} />
          ))}
        </div>

        <div key={step} className={cn("w-full", dir === 1 ? "animate-in fade-in slide-in-from-right-6 duration-300" : "animate-in fade-in slide-in-from-left-6 duration-300")}>
          {step === 1 && (
            <Step1
              name={name} setName={setName}
              birthdate={birthdate} setBirthdate={setBirthdate}
              question={question} setQuestion={setQuestion}
              onSubmit={beginAnalysis}
              gems={gems}
              hasEnoughGems={hasEnoughGems}
              historyItems={historyItems}
              historyLoading={historyLoading}
              historyError={historyError}
              onDownload={downloadHistoryItem}
            />
          )}
          {step === 2 && <Step2 line={ANALYSIS_LINES[line]} progress={progress} />}
          {step === 3 && result && (
            <Step3
              result={result}
              subtitle={question || undefined}
              pdfLoading={pdfLoading}
              onDownload={() => downloadResultPdf(result, question || undefined)}
              onNewConsult={reset}
              onFinish={() => navigate({ to: "/dashboard" })}
              historyItems={historyItems}
              historyLoading={historyLoading}
              historyError={historyError}
              onHistoryDownload={downloadHistoryItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Step1({
  name, setName, birthdate, setBirthdate, question, setQuestion, onSubmit, gems, hasEnoughGems,
  historyItems, historyLoading, historyError, onDownload,
}: {
  name: string; setName: (s: string) => void;
  birthdate: string; setBirthdate: (s: string) => void;
  question: string; setQuestion: (s: string) => void;
  onSubmit: () => void;
  gems: number | null;
  hasEnoughGems: boolean;
  historyItems: ConsultaHistorialItem[];
  historyLoading: boolean;
  historyError: string | null;
  onDownload: (id: string) => void;
}) {
  return (
    <div>
      {/* Hero illustration */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#F5F0FF] to-white shadow-soft">
        <ManagedImage imageKey="imagen:consulta:patrones" src={step1Asset} alt="Consulta de patrones familiares — ORIGEN" className="w-full h-auto object-cover" />
      </div>

      <h1 className="text-center font-display font-extrabold text-[28px] leading-tight mt-6 text-[#1B1B27]">
        Explora tus <span className="bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] bg-clip-text text-transparent">Patrones Familiares</span>
      </h1>
      <p className="text-center text-[14px] text-[#64667A] mt-3 leading-relaxed">
        Formula la situación que deseas comprender. Analizaremos únicamente la información registrada durante tu proceso para ofrecerte una nueva consulta personalizada.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Escribe tu nombre"
            className="h-12 rounded-[16px] border-[#ECEEF5] bg-white text-[15px] focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/25 focus-visible:border-[#7C5CFF]" />
        </Field>
        <Field label="Fecha de nacimiento">
          <Input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)}
            className="h-12 rounded-[16px] border-[#ECEEF5] bg-white text-[15px] focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/25 focus-visible:border-[#7C5CFF]" />
        </Field>
        <Field label="¿Qué situación deseas comprender?">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={"Ejemplos:\n• ¿Por qué siempre repito este patrón?\n• ¿Qué podría estar influyendo en mis relaciones?\n• ¿Qué necesito comprender de mi historia familiar?"}
            className="min-h-32 rounded-[16px] border-[#ECEEF5] bg-white text-[14px] resize-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/25 focus-visible:border-[#7C5CFF]"
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[14px] bg-[#F5F0FF] px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#7C5CFF]">
          <Leaf className="w-4 h-4" /> Costo de esta consulta
        </div>
        <div className="text-[13px] font-bold text-[#7C5CFF]">{CONSULTA_COST_HOJAS} hoja de sanación</div>
      </div>
      {!hasEnoughGems && gems !== null && (
        <p className="mt-2 text-[12px] text-destructive text-center">
          Tienes {wholeHojas(gems)} hojas y esta consulta cuesta {CONSULTA_COST_HOJAS}. Sigue avanzando en tu camino para ganar más.
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={!hasEnoughGems}
        className="mt-6 w-full h-14 rounded-[18px] bg-gradient-to-r from-[#7C5CFF] via-[#61A8FF] to-[#F58BCB] text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 shadow-soft active:scale-[.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-4 h-4" /> Analizar mi patrón <ArrowRight className="w-4 h-4" />
      </button>
      <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#64667A] w-full justify-center">
        <Lock className="w-3.5 h-3.5" /> Tu información es privada y segura.
      </div>

      <ConsultaHistorial
        className="mt-8"
        items={historyItems}
        loading={historyLoading}
        error={historyError}
        onDownload={onDownload}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-semibold text-[#1B1B27]">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Step2({ line, progress }: { line: string; progress: number }) {
  return (
    <div className="text-center pt-2">
      <div className="relative mx-auto w-full max-w-[280px]">
        <ManagedImage imageKey="imagen:consulta:patrones-preparacion" src={step2Asset} alt="Corazón y árbol" className="w-full h-auto animate-breathe" />
        <div aria-hidden className="absolute inset-0 rounded-full blur-3xl -z-10"
          style={{ background: "radial-gradient(circle at 50% 60%, rgba(245,139,203,0.35), transparent 65%)" }} />
      </div>
      <h2 className="mt-6 font-display font-extrabold text-[24px] text-[#1B1B27]">Analizando tu información…</h2>

      <div className="mt-6 mx-auto max-w-sm rounded-[18px] bg-white/70 border border-[#ECEEF5] shadow-soft px-4 py-3">
        <p key={line} className="text-[14px] text-[#64667A] animate-in fade-in slide-in-from-bottom-2 duration-500 inline-flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#F58BCB] fill-[#F58BCB] animate-pulse" /> {line}
        </p>
      </div>

      <div className="mt-8 mx-auto max-w-sm h-2 rounded-full bg-[#ECEEF5] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#7C5CFF] via-[#61A8FF] to-[#F58BCB] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 text-[12px] text-[#64667A]">{progress}%</div>
    </div>
  );
}

function Step3({
  result, subtitle, pdfLoading, onDownload, onNewConsult, onFinish,
  historyItems, historyLoading, historyError, onHistoryDownload,
}: {
  result: AIResult;
  subtitle?: string;
  pdfLoading: boolean;
  onDownload: () => void;
  onNewConsult: () => void;
  onFinish: () => void;
  historyItems: ConsultaHistorialItem[];
  historyLoading: boolean;
  historyError: string | null;
  onHistoryDownload: (id: string) => void;
}) {
  const patternIcons = [Users, TreeDeciduous, MessageCircle, Heart, RefreshCw];
  const recIcons = [BookOpen, PenLine, Sparkles, Headphones, GraduationCap];

  return (
    <div>
      <h2 className="text-center font-display font-extrabold text-[26px] mt-2 text-[#1B1B27]">Tu Reflexión Personal</h2>
      <div className="mt-1 mx-auto w-12 h-0.5 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB]" />

      {/* Lo que observamos */}
      <ResultCard image={e3dBrain} title="Lo que observamos">
        <p>{result.observation}</p>
      </ResultCard>

      {/* Patrones */}
      <div className="mt-4 rounded-[20px] bg-white border-2 border-[#ECEEF5] shadow-soft p-5">
        <div className="flex items-center gap-2.5">
          <img src={e3dCross} className="w-10 h-10" alt="" />
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Posibles patrones identificados</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {result.patterns.map((p, i) => {
            const Icon = patternIcons[i % patternIcons.length];
            return (
              <div key={i} className="rounded-[14px] bg-white border border-[#ECEEF5] p-3 flex flex-col items-center gap-1.5 text-center shadow-[0_2px_10px_rgba(22,25,45,0.03)]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F5F0FF] to-[#E6F1FF] grid place-items-center">
                  <Icon className="w-4 h-4 text-[#7C5CFF]" />
                </div>
                <div className="text-[12px] font-semibold text-[#1B1B27] leading-tight">{p}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reflexión */}
      <ResultCard image={e3dHeartgem} title="Reflexión personalizada" tint>
        <p className="whitespace-pre-line">{result.reflection}</p>
      </ResultCard>

      {/* Recomendaciones */}
      <div className="mt-4 rounded-[20px] bg-white border-2 border-[#ECEEF5] shadow-soft p-5">
        <div className="flex items-center gap-2.5">
          <img src={e3dStar} className="w-10 h-10" alt="" />
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Recursos recomendados</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {result.recommendations.map((r, i) => {
            const Icon = recIcons[i % recIcons.length];
            return (
              <div key={i} className="rounded-[14px] bg-white border border-[#ECEEF5] p-3 flex items-start gap-2 shadow-[0_2px_10px_rgba(22,25,45,0.03)]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F5F0FF] to-[#FFE9F5] grid place-items-center shrink-0">
                  <Icon className="w-4 h-4 text-[#F58BCB]" />
                </div>
                <div className="text-[12px] text-[#1B1B27] leading-snug">{r}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <ConsultaPDFButton loading={pdfLoading} onClick={onDownload} />
        <button
          onClick={onNewConsult}
          className="w-full h-14 rounded-[18px] bg-gradient-to-r from-[#7C5CFF] via-[#61A8FF] to-[#F58BCB] text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 shadow-soft active:scale-[.98] transition"
        >
          <RefreshCw className="w-4 h-4" /> Nueva consulta
        </button>
        <button
          onClick={onFinish}
          className="w-full h-14 rounded-[18px] bg-white border-2 border-[#ECEEF5] text-[#1B1B27] font-semibold text-[15px] inline-flex items-center justify-center gap-2 active:scale-[.98] transition"
        >
          <Home className="w-4 h-4" /> Finalizar
        </button>
      </div>

      <ConsultaHistorial
        className="mt-6"
        items={historyItems}
        loading={historyLoading}
        error={historyError}
        onDownload={onHistoryDownload}
      />
    </div>
  );
}

function ResultCard({
  image, title, children, tint,
}: { image: string; title: string; children: React.ReactNode; tint?: boolean }) {
  return (
    <div className={cn("mt-4 rounded-[20px] bg-white border-2 border-[#ECEEF5] shadow-soft p-5", tint && "bg-[#F5F0FF]")}>
      <div className="flex items-center gap-2.5">
        <img src={image} className="w-10 h-10" alt="" />
        <div className="text-[11px] uppercase tracking-widest font-bold text-primary">{title}</div>
      </div>
      <div className="mt-2 text-[14px] text-[#64667A] leading-relaxed">{children}</div>
    </div>
  );
}
