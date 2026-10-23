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
import { ArrowLeft, ArrowRight, HeartHandshake, Lock, Sparkles, Compass, Route as RouteIcon, Leaf } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import parejaHero from "@/assets/pareja-hero.jpg";
import e3dCouple from "@/assets/e3d-couple.png";
import e3dBrain from "@/assets/e3d-brain.png";
import e3dStar from "@/assets/e3d-star.png";
import e3dHeartgem from "@/assets/e3d-heartgem.png";

export const Route = createFileRoute("/_authenticated/pareja")({
  head: () => ({ meta: [
    { title: "Comprende tu relación — ORÍGEN" },
    { name: "description", content: "Reflexiona sobre tu relación, tus límites y tus necesidades con acompañamiento cristiano de ORÍGEN." },
    { property: "og:title", content: "Comprende tu relación — ORÍGEN" },
    { property: "og:description", content: "Una reflexión sobre respeto, comunicación y cuidado en tu relación." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ParejaPage,
});

type Result = {
  verdict: "proposito" | "deuda" | "leccion";
  verdict_title: string;
  summary: string;
  pattern: string;
  advice: string;
  next_step: string;
};

type ParejaRow = {
  id: string;
  created_at: string;
  self_name: string | null;
  partner_name: string | null;
  self_dob: string | null;
  partner_dob: string | null;
  question: string | null;
  verdict: string | null;
  verdict_title?: string | null;
  summary: string | null;
  pattern: string | null;
  advice: string | null;
  next_step: string | null;
};

const LOADING_LINES = [
  "Revisando la información que compartiste...",
  "Observando el patrón de esta unión...",
  "Reflexionando sobre tus vínculos desde la fe...",
  "Preparando la reflexión de Ruth Esther...",
];

const CONSULTA_COST_HOJAS = 1;

function ParejaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ self_name: "", self_dob: "", partner_name: "", partner_dob: "", question: "" });
  const [line, setLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [gems, setGems] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>("Explorador");
  const [userMeta, setUserMeta] = useState<{ name: string; email: string }>({ name: "", email: "" });
  const [history, setHistory] = useState<ParejaRow[]>([]);
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
      await loadHistory();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadHistory() {
    if (!user) return;
    setHistoryLoading(true);
    setHistoryError(null);
    const { data, error } = await supabase
      .from("pareja_lecturas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) setHistoryError("No pudimos cargar tu historial de consultas.");
    setHistory(((data as unknown as ParejaRow[]) ?? []).map((row) => ({ ...row, verdict_title: christianContent(row.verdict_title), summary: christianContent(row.summary), pattern: christianContent(row.pattern), advice: christianContent(row.advice), next_step: christianContent(row.next_step) })));
    setHistoryLoading(false);
  }

  const hasEnoughGems = gems === null || hasHojas(gems, CONSULTA_COST_HOJAS);

  async function begin() {
    if (!form.self_name.trim() || !form.partner_name.trim()) return toast.error("Escribe ambos nombres");
    if (!form.self_dob || !form.partner_dob) return toast.error("Necesito ambas fechas de nacimiento");
    {
      const points = await readBalancePoints();
      setGems(points);
      if (!hasHojas(points, CONSULTA_COST_HOJAS)) {
        return toast.error(`Necesitas ${CONSULTA_COST_HOJAS} hoja para esta consulta. Tienes ${wholeHojas(points)}.`);
      }
    }
    setStep(2); setLine(0); setProgress(0);

    const timer = setInterval(() => {
      setProgress((p) => Math.min(95, p + 5));
      setLine((l) => (l + 1) % LOADING_LINES.length);
    }, 900);

    try {
      const [r] = await Promise.all([
        fetch("/api/pareja", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }),
        new Promise((res) => setTimeout(res, 7000)),
      ]);
      clearInterval(timer);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Error");
      setProgress(100);
      setResult(christianContent(j));
      if (user) {
        await supabase.from("pareja_lecturas").insert({
          user_id: user.id,
          ...form,
          verdict: j.verdict,
          summary: j.summary,
          pattern: j.pattern,
          advice: j.advice,
          next_step: j.next_step,
        });
        const charge = await chargeConsulta("pareja", CONSULTA_COST_HOJAS);
        setGems(charge.balance);
        await loadHistory();
      }
      setStep(3);
    } catch (e) {
      clearInterval(timer);
      toast.error((e as Error).message);
      setStep(1);
    }
  }

  function downloadResultPdf(r: Result | ParejaRow, subtitle?: string) {
    const verdictLabel =
      r.verdict === "proposito" ? "Propósito de alma" : r.verdict === "deuda" ? "Deuda ancestral" : "Lección de alma";
    printConsulta({
      kind: "Consulta de Pareja",
      title: ("verdict_title" in r && r.verdict_title) || verdictLabel,
      subtitle,
      userName: userMeta.name,
      userEmail: userMeta.email,
      plan,
      sections: [
        { icon: "💞", title: "Veredicto", body: verdictLabel },
        { icon: "🧭", title: "Patrón observado", body: r.pattern ?? "" },
        { icon: "✨", title: "Consejo de Ruth Esther", body: r.advice ?? "" },
        { icon: "🌿", title: "Tu próximo paso", body: r.next_step ?? "" },
      ],
    });
  }

  async function downloadHistoryItem(id: string) {
    setPdfLoading(true);
    try {
      const row = history.find((h) => h.id === id);
      if (!row) return;
      downloadResultPdf(row, row.question ? `Consulta: ${row.question}` : undefined);
    } finally {
      setPdfLoading(false);
    }
  }

  const historyItems: ConsultaHistorialItem[] = history.map((h) => ({
    id: h.id,
    created_at: h.created_at,
    title: h.question?.trim() ? h.question : `Consulta de pareja: ${h.self_name ?? ""} y ${h.partner_name ?? ""}`,
  }));

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-aura-top">
      <div className="relative z-10 mx-auto max-w-lg px-5 pt-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-card shadow-soft grid place-items-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-[13px] font-medium text-muted-foreground">Paso {step} de 3</div>
          <div className="w-10" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("h-1.5 rounded-full transition-all",
              s <= step ? "w-14 bg-brand-gradient" : "w-8 bg-border")} />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-6 duration-300">
            <img
              src={parejaHero}
              alt="Consulta de pareja — ORIGEN"
              width={1280}
              height={720}
              loading="lazy"
              className="w-full h-auto rounded-[16px] mb-4"
            />
            <div className="hero-card text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-glow">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h1 className="font-display font-extrabold text-foreground text-[26px] leading-tight mt-4">
                Comprende tu <span className="text-primary">relación</span> desde el respeto y la <span className="text-primary">fe</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Reflexiona con el método ORÍGEN sobre tu comunicación, tus necesidades y los límites que deseas cuidar.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <Field label="Tu nombre">
                <Input value={form.self_name} onChange={(e) => setForm({ ...form, self_name: e.target.value })}
                  placeholder="Escribe tu nombre" className="h-12 rounded-[14px] bg-card" />
              </Field>
              <Field label="Tu fecha de nacimiento">
                <Input type="date" value={form.self_dob} onChange={(e) => setForm({ ...form, self_dob: e.target.value })}
                  className="h-12 rounded-[14px] bg-card" />
              </Field>
              <Field label="Nombre de tu pareja">
                <Input value={form.partner_name} onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                  placeholder="Su nombre" className="h-12 rounded-[14px] bg-card" />
              </Field>
              <Field label="Fecha de nacimiento de tu pareja">
                <Input type="date" value={form.partner_dob} onChange={(e) => setForm({ ...form, partner_dob: e.target.value })}
                  className="h-12 rounded-[14px] bg-card" />
              </Field>
              <Field label="¿Qué necesitas comprender? (opcional)">
                <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Ej: ¿Es una relación que debo cuidar o soltar?"
                  className="min-h-24 rounded-[14px] bg-card resize-none" />
              </Field>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[14px] bg-brand-soft px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-primary">
                <Leaf className="w-4 h-4" /> Costo de esta consulta
              </div>
              <div className="text-[13px] font-bold text-primary">{CONSULTA_COST_HOJAS} hoja de sanación</div>
            </div>
            {!hasEnoughGems && gems !== null && (
              <p className="mt-2 text-[12px] text-destructive text-center">
                Tienes {wholeHojas(gems)} hojas y esta consulta cuesta {CONSULTA_COST_HOJAS}. Sigue avanzando en tu camino para ganar más.
              </p>
            )}

            <button onClick={begin} disabled={!hasEnoughGems}
              className="mt-5 btn-primary-gradient w-full h-14 rounded-[16px] inline-flex items-center justify-center gap-2 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed">
              <Sparkles className="w-4 h-4" /> Analizar mi pareja <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground w-full justify-center">
              <Lock className="w-3 h-3" /> Información privada y encriptada
            </div>

            <ConsultaHistorial
              className="mt-8"
              items={historyItems}
              loading={historyLoading}
              error={historyError}
              onDownload={downloadHistoryItem}
            />
          </div>
        )}

        {step === 2 && (
          <div className="text-center pt-4 animate-in fade-in">
            <div className="relative mx-auto w-40 h-40 grid place-items-center">
              <div className="absolute inset-0 rounded-full bg-brand-gradient opacity-20 animate-ping" />
              <div className="absolute inset-3 rounded-full bg-brand-gradient opacity-25 animate-pulse" />
              <div className="relative text-6xl animate-breathe">💞</div>
            </div>
            <p className="mt-6 font-display font-bold text-lg">{LOADING_LINES[line]}</p>
            <div className="mt-4 mx-auto max-w-xs h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-brand-gradient transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Ruth Esther está preparando tu consulta...</p>
          </div>
        )}

        {step === 3 && result && (
          <div className="animate-in fade-in slide-in-from-right-6 duration-300 space-y-4">
            <div className="hero-card text-center">
              <div className={cn(
                "inline-block text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded-full",
                result.verdict === "proposito" && "bg-success/15 text-success",
                result.verdict === "deuda" && "bg-[#F58BCB]/15 text-[#F58BCB]",
                result.verdict === "leccion" && "bg-primary/15 text-primary",
              )}>
                {result.verdict === "proposito" && "Propósito de alma"}
                {result.verdict === "deuda" && "Deuda ancestral"}
                {result.verdict === "leccion" && "Lección de alma"}
              </div>
              <h2 className="mt-3 font-display font-extrabold text-[24px] leading-tight">
                {result.verdict_title}
              </h2>
              <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{result.summary}</p>
            </div>

            <ResultCard image={e3dBrain} title="Patrón observado">
              <p>{result.pattern}</p>
            </ResultCard>
            <ResultCard image={e3dStar} title="Consejo de Ruth Esther">
              <p>{result.advice}</p>
            </ResultCard>
            <ResultCard image={e3dHeartgem} title="Tu próximo paso" tint>
              <p className="font-medium">{result.next_step}</p>
            </ResultCard>

            <ConsultaPDFButton loading={pdfLoading} onClick={() => downloadResultPdf(result, form.question || undefined)} />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => { setResult(null); setStep(1); }}
                className="h-12 rounded-[14px] border border-border bg-card font-semibold text-sm">
                Nueva consulta
              </button>
              <button onClick={() => navigate({ to: "/dashboard" })}
                className="h-12 rounded-[14px] btn-primary-gradient text-sm">
                Volver al inicio
              </button>
            </div>

            <ConsultaHistorial
              className="mt-4"
              items={historyItems}
              loading={historyLoading}
              error={historyError}
              onDownload={downloadHistoryItem}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  image, title, children, tint,
}: { image: string; title: string; children: React.ReactNode; tint?: boolean }) {
  return (
    <div className={cn("app-card p-5 border-2 border-border", tint && "bg-brand-soft")}>
      <div className="flex items-center gap-2.5">
        <img src={image} className="w-10 h-10" alt="" />
        <div className="text-[11px] uppercase tracking-widest font-bold text-primary flex items-center gap-1.5">
          {title}
        </div>
      </div>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-semibold text-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
