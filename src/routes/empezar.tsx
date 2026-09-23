import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import logo from "@/assets/logo-origen.png";

export const Route = createFileRoute("/empezar")({
  head: () => ({ meta: [{ title: "Empieza tu camino — ORÍGEN" }, { name: "description", content: "Conoce tu camino con unas preguntas breves antes de crear tu cuenta." }, { property: "og:title", content: "Empieza tu camino — ORÍGEN" }, { property: "og:description", content: "Elige tu primer paso y descubre un camino de bienestar adaptado a ti." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Empezar,
});

const choices = [
  { title: "¿Qué quieres transformar primero?", key: "deseo", values: ["Sanar heridas emocionales", "Fortalecer mi relación con Dios", "Manifestar abundancia y propósito", "Renovar mi identidad", "Explorar todo"] },
  { title: "¿Qué área necesita más cuidado hoy?", key: "area", values: ["Emocional", "Espiritual", "Mental", "Financiera", "Relaciones", "Propósito"] },
  { title: "¿Cómo prefieres avanzar?", key: "guia", values: ["Con música y afirmaciones", "Con ejercicios prácticos", "Con fe y reflexión"] },
] as const;

function Empezar() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<Record<string, string>>({});
  useEffect(() => { try { const stored = localStorage.getItem("origen_preonboarding"); if (stored) setAnswer(JSON.parse(stored)); } catch { /* no storage */ } }, []);
  function select(key: string, value: string) { const next = { ...answer, [key]: value }; setAnswer(next); try { localStorage.setItem("origen_preonboarding", JSON.stringify(next)); } catch { /* no storage */ } }
  return <main className="min-h-dvh bg-gradient-to-b from-[#eee8ff] via-background to-[#fceafa] px-4 py-6">
    <div className="mx-auto max-w-xl"><div className="flex items-center justify-between"><Link to="/" className="flex items-center gap-2 font-display font-extrabold"><img src={logo} alt="" className="h-10 w-10 object-contain" /> ORÍGEN</Link><span className="text-xs font-bold text-primary">{step + 1} / 4</span></div>
      <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-primary/15"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step + 1) * 25}%` }} /></div>
      <section className="mt-8 rounded-[24px] border border-primary/15 bg-card p-6 shadow-soft sm:p-9">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4" /> Tu camino empieza aquí</span>
        {step < 3 ? <><h1 className="mt-3 font-display text-3xl font-extrabold leading-tight">{choices[step].title}</h1><p className="mt-2 text-sm text-muted-foreground">Elige lo que más se acerque a ti. Podrás cambiarlo después.</p><div className="mt-6 grid gap-3">{choices[step].values.map(value => <button type="button" key={value} onClick={() => select(choices[step].key, value)} className={`flex min-h-16 items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold transition ${answer[choices[step].key] === value ? "border-primary bg-primary/10 text-primary shadow-soft" : "border-border bg-background hover:border-primary/50"}`}>{value}{answer[choices[step].key] === value && <Check className="h-5 w-5" />}</button>)}</div><button disabled={!answer[choices[step].key]} onClick={() => setStep(step + 1)} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-white disabled:opacity-40">Continuar <ArrowRight className="h-4 w-4" /></button></> : <><h1 className="mt-3 font-display text-3xl font-extrabold">Tu camino ya empezó.</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Buscas {answer.deseo?.toLowerCase()}, especialmente en el área {answer.area?.toLowerCase()}. Crea tu cuenta para recibir tus pasos personalizados y guardar tu avance.</p><button onClick={() => navigate({ to: "/registro" })} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-white">Crear mi cuenta gratis <ArrowRight className="h-4 w-4" /></button><p className="mt-3 text-center text-xs text-muted-foreground">No necesitas iniciar sesión para responder estas preguntas.</p></>}
      </section>
      {step > 0 && <button onClick={() => setStep(step - 1)} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Volver</button>}
    </div>
  </main>;
}