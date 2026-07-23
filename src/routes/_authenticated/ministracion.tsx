import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, ArrowRight, Sparkles, BookOpen, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/ministracion-hero.jpg";

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
  "Consultando los decretos divinos...",
  "Abriendo los libros de la Corte Celestial...",
  "Preparando tu ministración...",
];

function MinistracionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", dob: "", question: "" });
  const [line, setLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  async function begin() {
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
      setResult(j);
      setStep(3);
    } catch (e) {
      clearInterval(timer);
      toast.error((e as Error).message);
      setStep(1);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-aura-top">
      <div className="relative z-10 mx-auto max-w-lg px-5 pt-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-white shadow-soft grid place-items-center">
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
            <div className="hero-card p-0 overflow-hidden relative shadow-[0_20px_60px_-15px_rgba(255,255,255,0.9),0_0_0_1px_rgba(255,255,255,0.6)] ring-1 ring-white/70">
              <div className="relative">
                <img src={heroImg} alt="Dios te dice hoy — Corte Celestial" className="w-full h-auto block" />
                <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 40px rgba(255,255,255,0.4)" }} />
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
              <Field label="Nombre">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tu nombre" className="h-12 rounded-[14px] bg-white" />
              </Field>
              <Field label="Fecha de nacimiento">
                <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="h-12 rounded-[14px] bg-white" />
              </Field>
              <Field label="¿Qué deseas preguntarle al Cielo hoy? (Opcional)">
                <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Describe la situación o pregunta que deseas presentar ante la Corte Celestial..."
                  className="min-h-24 rounded-[14px] bg-white resize-none" />
              </Field>
            </div>

            <button onClick={begin}
              className="mt-5 btn-primary-gradient w-full h-14 rounded-[16px] inline-flex items-center justify-center gap-2 text-[15px]">
              <Sparkles className="w-4 h-4" /> Ver qué Dios me dice hoy <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground w-full justify-center">
              <Lock className="w-3 h-3" /> Información privada y encriptada
            </div>
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

            <ResultBlock emoji="⚖️" title="Dictamen de la Corte Celestial" color="violet">
              <p className="whitespace-pre-line">{result.dictamen}</p>
            </ResultBlock>

            <ResultBlock emoji="⏳" title="Línea de tiempo" color="blue">
              <p className="whitespace-pre-line">{result.linea_tiempo}</p>
            </ResultBlock>

            <ResultBlock emoji="🕊️" title="Señales de confirmación" color="pink">
              <ul className="space-y-2">
                {result.senales?.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F58BCB] shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </ResultBlock>

            <ResultBlock emoji="💫" title="Ministración para tu vida" color="gold">
              <p className="whitespace-pre-line font-medium">{result.ministracion}</p>
            </ResultBlock>

            {result.rompe_ciclo && (
              <ResultBlock emoji="⛓️‍💥" title="Consejo del Cielo: Rompe el Ciclo en tu vida" color="coral">
                <p className="text-[11px] uppercase tracking-widest font-bold text-[#E05A6B] mb-2">
                  Deuda generacional que se repite en tu vida
                </p>
                <p className="whitespace-pre-line">{result.rompe_ciclo}</p>
              </ResultBlock>
            )}

            {result.versiculo && (
              <ResultBlock emoji="📖" title="Palabra que respalda el decreto" color="green">
                <p className="text-sm italic leading-relaxed">"{result.versiculo}"</p>
              </ResultBlock>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => { setResult(null); setStep(1); }}
                className="h-12 rounded-[14px] border border-border bg-white font-semibold text-sm">
                Recibir nueva ministración
              </button>
              <button onClick={() => navigate({ to: "/dashboard" })}
                className="h-12 rounded-[14px] btn-primary-gradient text-sm">
                Volver al inicio
              </button>
            </div>
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
} as const;

function ResultBlock({
  emoji, title, children, color,
}: { emoji: string; title: string; children: React.ReactNode; color: keyof typeof COLOR_MAP }) {
  const c = COLOR_MAP[color];
  return (
    <div className={cn("rounded-[20px] border-2 p-5 shadow-soft", c.border, c.bg)}>
      <div className="flex items-center gap-2.5">
        <div className={cn("w-11 h-11 rounded-2xl grid place-items-center text-2xl shadow-soft bg-white")}>
          <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">{emoji}</span>
        </div>
        <div className={cn("text-[11px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full", c.chip)}>
          {title}
        </div>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-foreground/90">{children}</div>
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
