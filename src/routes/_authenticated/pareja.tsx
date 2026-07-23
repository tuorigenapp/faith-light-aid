import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, HeartHandshake, Lock, Sparkles, Compass, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pareja")({
  head: () => ({ meta: [{ title: "¿Deuda ancestral o propósito? — ORIGEN" }] }),
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

const LOADING_LINES = [
  "Sintonizando con la información entregada...",
  "Observando el patrón de esta unión...",
  "Escuchando lo que el linaje revela...",
  "Preparando la reflexión de Ruth Esther...",
];

function ParejaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ self_name: "", self_dob: "", partner_name: "", partner_dob: "", question: "" });
  const [line, setLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  async function begin() {
    if (!form.self_name.trim() || !form.partner_name.trim()) return toast.error("Escribe ambos nombres");
    if (!form.self_dob || !form.partner_dob) return toast.error("Necesito ambas fechas de nacimiento");
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
      setResult(j);
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
      }
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
            <div className="hero-card text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-glow">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h1 className="font-display font-extrabold text-[26px] leading-tight mt-4">
                ¿Tu pareja es <span className="text-gradient-brand">deuda ancestral</span> o <span className="text-gradient-brand">propósito</span>?
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Ruth Esther analiza esta unión desde el método ORIGEN. Descubre qué viene a enseñarte esta persona.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <Field label="Tu nombre">
                <Input value={form.self_name} onChange={(e) => setForm({ ...form, self_name: e.target.value })}
                  placeholder="Escribe tu nombre" className="h-12 rounded-[14px] bg-white" />
              </Field>
              <Field label="Tu fecha de nacimiento">
                <Input type="date" value={form.self_dob} onChange={(e) => setForm({ ...form, self_dob: e.target.value })}
                  className="h-12 rounded-[14px] bg-white" />
              </Field>
              <Field label="Nombre de tu pareja">
                <Input value={form.partner_name} onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                  placeholder="Su nombre" className="h-12 rounded-[14px] bg-white" />
              </Field>
              <Field label="Fecha de nacimiento de tu pareja">
                <Input type="date" value={form.partner_dob} onChange={(e) => setForm({ ...form, partner_dob: e.target.value })}
                  className="h-12 rounded-[14px] bg-white" />
              </Field>
              <Field label="¿Qué necesitas comprender? (opcional)">
                <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Ej: ¿Es una relación que debo cuidar o soltar?"
                  className="min-h-24 rounded-[14px] bg-white resize-none" />
              </Field>
            </div>

            <button onClick={begin}
              className="mt-5 btn-primary-gradient w-full h-14 rounded-[16px] inline-flex items-center justify-center gap-2 text-[15px]">
              <Sparkles className="w-4 h-4" /> Analizar mi pareja <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground w-full justify-center">
              <Lock className="w-3 h-3" /> Información privada y encriptada
            </div>
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
            <p className="text-xs text-muted-foreground mt-3">Ruth Esther está preparando tu lectura...</p>
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

            <div className="app-card p-5">
              <div className="text-[11px] uppercase tracking-widest font-bold text-primary flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> Patrón observado</div>
              <p className="mt-2 text-sm leading-relaxed">{result.pattern}</p>
            </div>
            <div className="app-card p-5">
              <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Consejo de Ruth Esther</div>
              <p className="mt-2 text-sm leading-relaxed">{result.advice}</p>
            </div>
            <div className="app-card p-5 bg-brand-soft">
              <div className="text-[11px] uppercase tracking-widest font-bold text-primary flex items-center gap-1.5"><RouteIcon className="w-3.5 h-3.5" /> Tu próximo paso</div>
              <p className="mt-2 text-sm font-medium leading-relaxed">{result.next_step}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => { setResult(null); setStep(1); }}
                className="h-12 rounded-[14px] border border-border bg-white font-semibold text-sm">
                Nueva lectura
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-semibold text-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
