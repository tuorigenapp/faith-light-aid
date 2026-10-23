import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { christianContent } from "@/lib/christian-language";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, ArrowRight, Sparkles, Lock, Leaf,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ministracionHero from "@/assets/ministracion-palabra-cielo.jpg";
import e3dCross from "@/assets/e3d-cross.png";
import e3dStar from "@/assets/e3d-star.png";
import e3dHeartgem from "@/assets/e3d-heartgem.png";
import e3dCoin from "@/assets/e3d-coin.png";
import e3dBrain from "@/assets/e3d-brain.png";
import e3dCouple from "@/assets/e3d-couple.png";
import { getUserPlan } from "@/lib/plan";
import { chargeConsulta, hasHojas, readBalancePoints, wholeHojas } from "@/lib/gems";
import { printConsulta } from "@/lib/print-pdf";
import { ConsultaHistorial, type ConsultaHistorialItem } from "@/components/ConsultaHistorial";
import { ConsultaPDFButton } from "@/components/ConsultaPDFButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { printMinistracion } from "@/lib/print-pdf";

export const Route = createFileRoute("/_authenticated/ministracion")({
  head: () => ({ meta: [{ title: "Lo que Dios quiere decirte hoy — ORIGEN" }] }),
  component: MinistracionPage,
});

type Result = {
  headline: string;
  dictamen: string;
  linea_tiempo: string;
  senales: string[];
  ministracion: string;
  versiculo: string;
  rompe_ciclo: string;
};

const LOADING_LINES = [
  "Recibiendo tu información...",
  "Aplicando el Método ORIGEN...",
  "Preparando una reflexión de fe cristiana...",
  "Organizando pasos para acompañarte...",
  "Preparando tu ministración...",
];

const CONSULTA_COST_HOJAS = 1;

type MinistracionRow = {
  id: string; created_at: string; name: string | null; question: string | null;
  headline: string | null; dictamen: string | null; linea_tiempo: string | null;
  senales: string[] | null; ministracion: string | null; versiculo: string | null; rompe_ciclo: string | null;
};

function MinistracionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", dob: "", question: "" });
  const [errors, setErrors] = useState<{ name?: string; dob?: string }>({});
  const [line, setLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [gems, setGems] = useState<number | null>(null);
  const [plan, setPlan] = useState("Explorador");
  const [userMeta, setUserMeta] = useState({ name: "", email: "" });
  const [history, setHistory] = useState<MinistracionRow[]>([]);
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
      .from("ministracion_lecturas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) setHistoryError("No pudimos cargar tu historial de consultas.");
    setHistory(((data as unknown as MinistracionRow[]) ?? []).map((row) => ({ ...row, headline: christianContent(row.headline), dictamen: christianContent(row.dictamen), linea_tiempo: christianContent(row.linea_tiempo), senales: christianContent(row.senales), ministracion: christianContent(row.ministracion), versiculo: christianContent(row.versiculo), rompe_ciclo: christianContent(row.rompe_ciclo) })));
    setHistoryLoading(false);
  }

  const hasEnoughGems = gems === null || hasHojas(gems, CONSULTA_COST_HOJAS);

  function validate() {
    const e: { name?: string; dob?: string } = {};
    if (!form.name.trim()) e.name = "Escribe tu nombre completo.";
    if (!form.dob) e.dob = "Selecciona tu fecha de nacimiento.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function begin() {
    if (!validate()) return toast.error("Completa tu nombre y fecha de nacimiento para continuar.");
    {
      const points = await readBalancePoints();
      setGems(points);
      if (!hasHojas(points, CONSULTA_COST_HOJAS)) {
        return toast.error(`Necesitas ${CONSULTA_COST_HOJAS} hoja para esta consulta. Tienes ${wholeHojas(points)}.`);
      }
    }
    setStep(2); setLine(0); setProgress(0);

    const timer = setInterval(() => {
      setProgress((p) => Math.min(95, p + 4));
      setLine((l) => (l + 1) % LOADING_LINES.length);
    }, 900);

    try {
      const [r] = await Promise.all([
        fetch("/api/ministracion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }),
        new Promise((res) => setTimeout(res, 6500)),
      ]);
      clearInterval(timer);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Error");
      setProgress(100);
      setResult(christianContent(j));
      setStep(3);
      if (user) {
        await supabase.from("ministracion_lecturas").insert({
          user_id: user.id,
          name: form.name || null,
          dob: form.dob || null,
          question: form.question || null,
          headline: j.headline ?? null,
          dictamen: j.dictamen ?? null,
          linea_tiempo: j.linea_tiempo ?? null,
          senales: j.senales ?? null,
          ministracion: j.ministracion ?? null,
          versiculo: j.versiculo ?? null,
          rompe_ciclo: j.rompe_ciclo ?? null,
        });
        const charge = await chargeConsulta("ministracion", CONSULTA_COST_HOJAS);
        setGems(charge.balance);
        await loadHistory();
      }
    } catch (e) {
      clearInterval(timer);
      toast.error((e as Error).message);
      setStep(1);
    }
  }

  function downloadPdf() {
    if (!result) return;
    setPdfLoading(true);
    try {
      printConsulta({
        kind: "Consulta de Ministración",
        title: result.headline,
        subtitle: form.question ? `Consulta: ${form.question}` : undefined,
        userName: userMeta.name,
        userEmail: userMeta.email,
        plan,
        sections: [
          { icon: "⚖️", title: "Dictamen de la Corte Celestial", body: result.dictamen },
          { icon: "⏳", title: "Línea de tiempo", body: result.linea_tiempo },
          { icon: "🕊️", title: "Señales de confirmación", body: (result.senales ?? []).map((s, i) => `${i+1}. ${s}`).join("\n") },
          { icon: "💫", title: "Ministración para tu vida", body: result.ministracion },
          ...(result.rompe_ciclo ? [{ icon: "⛓️", title: "Consejo del Cielo: Rompe el ciclo", body: result.rompe_ciclo }] : []),
          ...(result.versiculo ? [{ icon: "📖", title: "Palabra que respalda el decreto", body: result.versiculo }] : []),
        ],
      });
    } finally {
      setPdfLoading(false);
    }
  }

  function downloadHistoryItem(id: string) {
    const row = history.find((h) => h.id === id);
    if (!row) return;
    printConsulta({
      kind: "Consulta de Ministración",
      title: row.headline ?? "Consulta de Ministración",
      subtitle: row.question ? `Consulta: ${row.question}` : undefined,
      userName: userMeta.name,
      userEmail: userMeta.email,
      plan,
      sections: [
        { icon: "⚖️", title: "Dictamen de la Corte Celestial", body: row.dictamen ?? "" },
        { icon: "⏳", title: "Línea de tiempo", body: row.linea_tiempo ?? "" },
        { icon: "🕊️", title: "Señales de confirmación", body: (row.senales ?? []).map((s, i) => `${i+1}. ${s}`).join("\n") },
        { icon: "💫", title: "Ministración para tu vida", body: row.ministracion ?? "" },
        ...(row.rompe_ciclo ? [{ icon: "⛓️", title: "Consejo del Cielo: Rompe el ciclo", body: row.rompe_ciclo }] : []),
        ...(row.versiculo ? [{ icon: "📖", title: "Palabra que respalda el decreto", body: row.versiculo }] : []),
      ],
    });
  }

  const historyItems: ConsultaHistorialItem[] = history.map((h) => ({
    id: h.id,
    created_at: h.created_at,
    title: h.question?.trim() ? h.question : (h.headline ?? "Consulta de ministración"),
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
            <div className="hero-card p-0 overflow-hidden relative shadow-elev ring-1 ring-border">
              <div className="relative">
                <img src={ministracionHero} alt="Manos abiertas recibiendo una palabra del cielo" width={1280} height={896} loading="lazy" className="w-full h-auto rounded-[16px] block border-2 border-gold/40 shadow-soft" />
                <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 40px rgba(255,255,255,0.12)" }} />
              </div>
              <div className="p-5 text-center">
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-primary bg-brand-soft px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" /> Ministración diaria
                </div>
                <h1 className="font-display font-extrabold text-[26px] leading-tight mt-3">
                  Recibe tu <span className="text-gradient-brand">Ministración del Cielo</span>
                </h1>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Field label="Nombre completo" error={errors.name}>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tu nombre completo" className="h-12 rounded-[14px] bg-card" />
              </Field>
              <Field label="Fecha de nacimiento" error={errors.dob}>
                <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="h-12 rounded-[14px] bg-card" />
              </Field>
              <Field label="¿Qué deseas preguntarle al Cielo hoy? (Opcional)">
                <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Describe la situación o pregunta que deseas presentar ante la Corte Celestial..."
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

            <button onClick={begin} disabled={!form.name.trim() || !form.dob || !hasEnoughGems}
              className="mt-5 btn-primary-gradient w-full h-14 rounded-[16px] inline-flex items-center justify-center gap-2 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed">
              <Sparkles className="w-4 h-4" /> Ver qué Dios me dice hoy <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground w-full justify-center">
              <Lock className="w-3 h-3" /> Información privada y encriptada
            </div>

            <ConsultaHistorial className="mt-8" items={historyItems} loading={historyLoading} error={historyError} onDownload={downloadHistoryItem} />
          </div>
        )}

        {step === 2 && (
          <div className="text-center pt-4 animate-in fade-in">
            <div className="relative mx-auto w-44 h-44 grid place-items-center">
              <div className="absolute inset-0 rounded-full bg-brand-gradient opacity-20 animate-ping" />
              <div className="absolute inset-3 rounded-full bg-brand-gradient opacity-25 animate-pulse" />
              <div className="relative text-7xl animate-breathe">⚖️</div>
            </div>
            <p className="mt-6 font-display font-bold text-lg">Analizando tu consulta...</p>
            <div className="mt-5 mx-auto max-w-xs space-y-1.5 text-left">
              {LOADING_LINES.map((l, i) => (
                <div key={i} className={cn(
                  "text-[13px] flex items-center gap-2 transition-opacity",
                  i <= line ? "text-foreground opacity-100" : "text-muted-foreground opacity-40",
                )}>
                  <span className={cn(
                    "w-4 h-4 rounded-full grid place-items-center text-[10px] text-white",
                    i <= line ? "bg-brand-gradient" : "bg-border",
                  )}>✓</span>
                  {l}
                </div>
              ))}
            </div>
            <div className="mt-5 mx-auto max-w-xs h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-brand-gradient transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className="animate-in fade-in slide-in-from-right-6 duration-300 space-y-4">
            <div className="hero-card text-center">
              <div className="inline-block text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-primary/15 text-primary">
                Lo que Dios quiere decirte hoy
              </div>
              <h2 className="mt-3 font-display font-extrabold text-[24px] leading-tight">
                {result.headline}
              </h2>
            </div>

            <ResultBlock image={e3dCross} title="Dictamen de la Corte Celestial" color="violet">
              <p className="whitespace-pre-line">{result.dictamen}</p>
            </ResultBlock>

            <ResultBlock image={e3dStar} title="Línea de tiempo" color="blue">
              <p className="whitespace-pre-line">{result.linea_tiempo}</p>
            </ResultBlock>

            <ResultBlock image={e3dHeartgem} title="Señales de confirmación" color="pink">
              <ul className="space-y-2">
                {result.senales?.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F58BCB] shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </ResultBlock>

            <ResultBlock image={e3dCoin} title="Ministración para tu vida" color="gold">
              <p className="whitespace-pre-line font-medium">{result.ministracion}</p>
            </ResultBlock>

            {result.rompe_ciclo && (
              <ResultBlock image={e3dBrain} title="Consejo del Cielo: Rompe el Ciclo en tu vida" color="coral">
                <p className="text-[11px] uppercase tracking-widest font-bold text-[#E05A6B] mb-2">
                  Deuda generacional que se repite en tu vida
                </p>
                <p className="whitespace-pre-line">{result.rompe_ciclo}</p>
              </ResultBlock>
            )}

            {result.versiculo && (
              <ResultBlock image={e3dCouple} title="Palabra que respalda el decreto" color="green">
                <p className="text-sm italic leading-relaxed">"{result.versiculo}"</p>
              </ResultBlock>
            )}

            <ConsultaPDFButton loading={pdfLoading} onClick={downloadPdf} label="Descargar consulta en PDF" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => { setResult(null); setStep(1); }}
                className="h-12 rounded-[14px] border border-border bg-card font-semibold text-sm">
                Nueva consulta
              </button>
              <button onClick={() => navigate({ to: "/perfil" })}
                className="h-12 rounded-[14px] border border-border bg-card font-semibold text-sm">
                Ver mi historial
              </button>
            </div>

            <ConsultaHistorial className="mt-2" items={historyItems} loading={historyLoading} error={historyError} onDownload={downloadHistoryItem} />
          </div>
        )}
      </div>
    </div>
  );
}

const COLOR_MAP = {
  violet: { border: "border-[#7C5CFF]", bg: "bg-[#7C5CFF]/8", chip: "bg-[#7C5CFF]/15 text-[#7C5CFF]" },
  blue:   { border: "border-[#5AA9FF]", bg: "bg-[#5AA9FF]/8", chip: "bg-[#5AA9FF]/15 text-[#5AA9FF]" },
  pink:   { border: "border-[#F58BCB]", bg: "bg-[#F58BCB]/8", chip: "bg-[#F58BCB]/15 text-[#F58BCB]" },
  gold:   { border: "border-[#F7B955]", bg: "bg-[#F7B955]/10", chip: "bg-[#F7B955]/20 text-[#B8862E]" },
  green:  { border: "border-[#3FBE8F]", bg: "bg-[#3FBE8F]/8", chip: "bg-[#3FBE8F]/15 text-[#3FBE8F]" },
  coral:  { border: "border-[#E05A6B]", bg: "bg-[#E05A6B]/8", chip: "bg-[#E05A6B]/15 text-[#E05A6B]" },
} as const;

function ResultBlock({
  image, title, children, color,
}: { image: string; title: string; children: React.ReactNode; color: keyof typeof COLOR_MAP }) {
  const c = COLOR_MAP[color];
  return (
    <div className={cn("rounded-[20px] border-2 p-5 shadow-soft", c.border, c.bg)}>
      <div className="flex items-center gap-2.5">
        <div className={cn("w-11 h-11 rounded-2xl grid place-items-center shadow-soft bg-card")}>
          <img src={image} className="w-10 h-10" alt="" />
        </div>
        <div className={cn("text-[11px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full", c.chip)}>
          {title}
        </div>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="text-[13px] font-semibold text-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-[11.5px] text-destructive">{error}</p>}
    </div>
  );
}
