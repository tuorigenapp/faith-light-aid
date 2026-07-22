import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Lock, Sparkles, Heart, TreeDeciduous, Users, MessageCircle, RefreshCw, Home, BookOpen, PenLine, Headphones, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import step1Asset from "@/assets/patrones-step1.png.asset.json";
import step2Asset from "@/assets/patrones-step2.png.asset.json";
import step3Asset from "@/assets/patrones-step3.png.asset.json";

export const Route = createFileRoute("/_authenticated/patrones")({
  head: () => ({ meta: [{ title: "Explora tus Patrones Familiares — Reconectando" }] }),
  component: PatronesPage,
});

type AIResult = {
  observation: string;
  patterns: string[];
  reflection: string;
  recommendations: string[];
  needs_more?: boolean | string;
};

const ANALYSIS_LINES = [
  "Analizando la información de tu árbol genealógico...",
  "Identificando patrones familiares recurrentes...",
  "Relacionando la información de tu proceso personal...",
  "Preparando una reflexión personalizada...",
  "Finalizando análisis...",
];

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

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile && !name) setName(profile.display_name || profile.full_name || "");
  }, [profile, name]);

  async function beginAnalysis() {
    if (!name.trim()) return toast.error("Escribe tu nombre");
    if (!question.trim() || question.trim().length < 8) return toast.error("Describe brevemente tu consulta");
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
            profile: { display_name: profile?.display_name ?? "", primary_focus: profile?.primary_focus ?? "" },
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
      setResult(j);
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
          <Link to="/arbol" className="w-10 h-10 rounded-full bg-white shadow-soft grid place-items-center">
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
            />
          )}
          {step === 2 && <Step2 line={ANALYSIS_LINES[line]} progress={progress} />}
          {step === 3 && result && (
            <Step3
              result={result}
              onNewConsult={reset}
              onFinish={() => navigate({ to: "/dashboard" })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Step1({
  name, setName, birthdate, setBirthdate, question, setQuestion, onSubmit,
}: {
  name: string; setName: (s: string) => void;
  birthdate: string; setBirthdate: (s: string) => void;
  question: string; setQuestion: (s: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      {/* Hero illustration */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#F5F0FF] to-white shadow-soft">
        <img src={step1Asset.url} alt="Árbol familiar" className="w-full h-auto object-cover" />
      </div>

      <h1 className="text-center font-display font-extrabold text-[28px] leading-tight mt-6 text-[#1B1B27]">
        Explora tus <span className="bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] bg-clip-text text-transparent">Patrones Familiares</span>
      </h1>
      <p className="text-center text-[14px] text-[#64667A] mt-3 leading-relaxed">
        Formula la situación que deseas comprender. Analizaremos únicamente la información registrada durante tu proceso para ofrecerte una reflexión personalizada.
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

      <button
        onClick={onSubmit}
        className="mt-6 w-full h-14 rounded-[18px] bg-gradient-to-r from-[#7C5CFF] via-[#61A8FF] to-[#F58BCB] text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 shadow-soft active:scale-[.98] transition"
      >
        <Sparkles className="w-4 h-4" /> Comenzar análisis <ArrowRight className="w-4 h-4" />
      </button>
      <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#64667A] w-full justify-center">
        <Lock className="w-3.5 h-3.5" /> Tu información es privada y segura.
      </div>
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
        <img src={step2Asset.url} alt="Corazón y árbol" className="w-full h-auto animate-breathe" />
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

function Step3({ result, onNewConsult, onFinish }: { result: AIResult; onNewConsult: () => void; onFinish: () => void }) {
  const patternIcons = [Users, TreeDeciduous, MessageCircle, Heart, RefreshCw];
  const recIcons = [BookOpen, PenLine, Sparkles, Headphones, GraduationCap];

  return (
    <div>
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#F5F0FF] to-white shadow-soft">
        <img src={step3Asset.url} alt="Camino de reflexión" className="w-full h-auto object-cover" />
      </div>

      <h2 className="text-center font-display font-extrabold text-[26px] mt-6 text-[#1B1B27]">Tu Reflexión Personal</h2>
      <div className="mt-1 mx-auto w-12 h-0.5 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB]" />

      {/* Lo que observamos */}
      <SectionCard icon={<Sparkles className="w-4 h-4 text-[#7C5CFF]" />} title="Lo que observamos">
        <p className="text-[14px] text-[#64667A] leading-relaxed">{result.observation}</p>
      </SectionCard>

      {/* Patrones */}
      <SectionCard icon={<TreeDeciduous className="w-4 h-4 text-[#61A8FF]" />} title="Posibles patrones identificados">
        <div className="mt-2 grid grid-cols-2 gap-2">
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
      </SectionCard>

      {/* Reflexión */}
      <SectionCard icon={<Heart className="w-4 h-4 text-[#F58BCB]" />} title="Reflexión personalizada">
        <p className="text-[14px] text-[#64667A] leading-relaxed whitespace-pre-line">{result.reflection}</p>
      </SectionCard>

      {/* Recomendaciones */}
      <SectionCard icon={<BookOpen className="w-4 h-4 text-[#7C5CFF]" />} title="Recursos recomendados">
        <div className="mt-2 grid grid-cols-2 gap-2">
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
      </SectionCard>

      <div className="mt-6 space-y-3">
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
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-[20px] bg-white border border-[#ECEEF5] shadow-soft p-5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F5F0FF] to-[#E6F1FF] grid place-items-center">
          {icon}
        </div>
        <h3 className="font-display font-bold text-[15px] text-[#1B1B27]">{title}</h3>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
