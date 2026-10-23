import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Download, Printer, Leaf, Lock } from "lucide-react";
import { ConsultaHistorial, type ConsultaHistorialItem } from "@/components/ConsultaHistorial";
import { chargeConsulta, hasHojas, readBalancePoints, wholeHojas } from "@/lib/gems";
import { Button } from "@/components/ui/button";
import { printConsulta } from "@/lib/print-pdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { christianContent } from "@/lib/christian-language";
import { useEffect } from "react";
import i1 from "@/assets/e3d-star.png";
import i2 from "@/assets/e3d-heartgem.png";
import i3 from "@/assets/e3d-clouds.png";
import i4 from "@/assets/e3d-butterfly.png";
import i5 from "@/assets/e3d-cross.png";
import i6 from "@/assets/e3d-heart-purple.png";
import i7 from "@/assets/e3d-book.png";

const ICONS3D = [i1, i2, i3, i4, i5, i6, i7];

function LoadingReading({ name, question }: { name: string; question: string }) {
  const first = name.trim().split(/\s+/)[0] || "";
  const q = question.trim().slice(0, 60);
  const lines = [
    `Conectando con tu nombre${first ? `, ${first}` : ""}…`,
    `Sosteniendo tu pregunta: «${q}${question.length > 60 ? "…" : ""}»`,
    "Escuchando lo que tu historia quiere decirte…",
    "Preparando tu respuesta personal…",
  ];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => Math.min(x + 1, lines.length - 1)), 1300); return () => clearInterval(t); }, [lines.length]);
  return (
    <section className="flex flex-col items-center gap-5 rounded-[16px] border border-border bg-card px-4 py-10 text-center">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="44" className="fill-none stroke-muted" strokeWidth="6" />
          <circle cx="50" cy="50" r="44" className="fill-none stroke-primary transition-all duration-1000" strokeWidth="6" strokeLinecap="round" strokeDasharray="276" strokeDashoffset={276 - (276 * (i + 1)) / lines.length} />
        </svg>
        <img src={i1} alt="" className="absolute inset-0 m-auto h-14 w-14 animate-pulse object-contain" />
      </div>
      <p key={i} className="animate-in fade-in min-h-12 max-w-[320px] text-[16px] font-semibold">{lines[i]}</p>
    </section>
  );
}

export const Route = createFileRoute("/_authenticated/consulta/$slug")({
  head: () => ({
    meta: [
      { title: "Tu respuesta de hoy — ORÍGEN" },
      { name: "description", content: "Recibe una respuesta personalizada del método ORÍGEN a partir de tu nombre, tu fecha de nacimiento y lo que hoy te inquieta." },
      { property: "og:title", content: "Tu respuesta de hoy — ORÍGEN" },
      { property: "og:description", content: "Una respuesta personalizada del método ORÍGEN para lo que hoy te inquieta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultaPage,
});

type Section = { key: string; label: string; hint?: string };
type Consulta = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  intro: string | null;
  cover_url: string | null;
  sections: Section[];
  is_published: boolean;
  cost_hojas: number;
  question_required?: boolean;
};
type ResultRow = { id: string; created_at: string; full_name: string | null; question: string | null; answer: Record<string, string> };

const input = "min-h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[15px] outline-none focus:border-primary";

function StepBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="space-y-3">
      <p className="text-center text-[13px] font-medium text-muted-foreground">Paso {step} de 3</p>
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn("h-1.5 rounded-full transition-all duration-500", s <= step ? "w-14 bg-primary" : "w-8 bg-muted")} />
        ))}
      </div>
    </div>
  );
}

function ConsultaPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Record<string, string> | null>(null);
  const [answerName, setAnswerName] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [points, setPoints] = useState<number | null>(null);

  const { data: consulta, isLoading } = useQuery({
    queryKey: ["consulta", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_consultas")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Consulta) ?? null;
    },
  });

  const { data: history = [], isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ["consulta-history", consulta?.id, user?.id],
    enabled: !!consulta?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_consulta_results")
        .select("id, created_at, full_name, question, answer")
        .eq("consulta_id", consulta!.id)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return ((data ?? []) as unknown as ResultRow[]).map((row) => ({ ...row, answer: christianContent(row.answer) }));
    },
  });

  useEffect(() => {
    if (!user) return;
    readBalancePoints().then(setPoints);
    supabase.from("profiles").select("full_name, display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName((n) => n || data?.full_name || data?.display_name || "");
    });
  }, [user]);

  const cost = consulta?.cost_hojas ?? 1;
  const required = consulta?.question_required !== false;
  const enough = cost === 0 || (points !== null && hasHojas(points, cost));

  async function ask() {
    if (!consulta) return;
    if (!name.trim() || !birthdate || (required && question.trim().length < 5)) {
      setError(required ? "Necesitamos tu nombre completo, tu fecha de nacimiento y lo que quieres saber." : "Necesitamos tu nombre completo y tu fecha de nacimiento.");
      return;
    }
    if (!enough) {
      setError(`Necesitas ${cost} hoja(s) de sanación para ver tu respuesta.`);
      return;
    }
    setError(null);
    setAnswer(null);
    setStep(2);
    const started = Date.now();
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` },
        body: JSON.stringify({ slug, name: name.trim(), birthdate, question: question.trim() }),
      });
      const json = (await res.json()) as Record<string, string> & { error?: string };
      if (!res.ok || json.error) throw new Error(json.error || "No pudimos preparar tu respuesta.");
      const wait = 5000 - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (cost > 0) {
        const charge = await chargeConsulta(consulta.slug, cost);
        setPoints(charge.balance);
      }
      if (user?.id) {
        await supabase.from("custom_consulta_results").insert({
          user_id: user.id,
          consulta_id: consulta.id,
          full_name: name.trim(),
          birthdate,
          question: question.trim(),
          answer: christianContent(json),
        });
        refetchHistory();
      }
      setAnswer(christianContent(json));
      setAnswerName(name.trim());
      setStep(3);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos preparar tu respuesta.");
      setStep(1);
    }
  }

  function titlesOf(ans: Record<string, string>): Record<string, string> {
    try { return ans.__titles ? JSON.parse(ans.__titles) : {}; } catch { return {}; }
  }
  function exportPdf(ans: Record<string, string>, who: string) {
    if (!consulta) return;
    const t = titlesOf(ans);
    printConsulta({ kind: consulta.title, title: ans.__headline || consulta.title, userName: who, userEmail: user?.email, sections: consulta.sections.filter((s) => ans[s.key]).map((s) => ({ title: t[s.key] || s.label, body: ans[s.key] ?? "" })) });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[680px] space-y-3 p-4">
        <div className="h-40 animate-pulse rounded-[16px] bg-muted" />
        <div className="h-12 animate-pulse rounded-[12px] bg-muted" />
        <div className="h-12 animate-pulse rounded-[12px] bg-muted" />
      </div>
    );
  }

  if (!consulta || !consulta.is_published) {
    return (
      <div className="mx-auto max-w-[680px] p-5 text-center">
        <p className="font-display text-[20px] font-bold">Esta sección ya no está disponible</p>
        <p className="mt-2 text-[14px] text-muted-foreground">Vuelve al inicio para ver todo lo que hay hoy en ORÍGEN.</p>
        <Link to="/dashboard" className="mt-4 inline-flex min-h-12 items-center rounded-[12px] bg-primary px-5 font-bold text-primary-foreground">Ir al inicio</Link>
      </div>
    );
  }

  const historyItems: ConsultaHistorialItem[] = history.map((h) => ({
    id: h.id,
    created_at: h.created_at,
    title: h.question?.trim() || `${consulta.title}: ${h.full_name ?? ""}`,
  }));
  const openHistory = (id: string) => {
    const row = history.find((h) => h.id === id);
    if (!row) return;
    setAnswer(row.answer);
    setAnswerName(row.full_name ?? name);
    setStep(3);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-[680px] space-y-5 p-4 pb-10">
      {step !== 2 && (
        <div className="flex items-center justify-between">
          {step === 3 ? (
            <button onClick={() => { setAnswer(null); setQuestion(""); setStep(1); }} aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm"><ArrowLeft className="h-4 w-4" /></button>
          ) : (
            <Link to="/dashboard" aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm"><ArrowLeft className="h-4 w-4" /></Link>
          )}
          <div className="w-11" />
        </div>
      )}
      <StepBar step={step} />

      {step === 1 && (
        <>
          <header className="overflow-hidden rounded-[16px] border border-border bg-card">
            {consulta.cover_url && <img src={consulta.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />}
            <div className="p-4">
              <h1 className="font-display text-[26px] font-bold leading-[1.15]">{consulta.title}</h1>
              {consulta.subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{consulta.subtitle}</p>}
            </div>
          </header>

          <div className="flex items-center gap-3 rounded-[16px] border border-border bg-card p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><Leaf className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">{cost === 0 ? "Esta respuesta es gratis" : `Cuesta ${cost} hoja${cost === 1 ? "" : "s"} de sanación`}</p>
              <p className="text-[13px] text-muted-foreground">Tienes {points === null ? "…" : wholeHojas(points)} hoja(s) disponibles</p>
            </div>
            {!enough && points !== null && (
              <Link to="/comprarmonedas" className="inline-flex min-h-11 items-center rounded-[12px] bg-primary/10 px-3 text-[13px] font-bold text-primary">Recargar</Link>
            )}
          </div>

          <section className="space-y-3 rounded-[16px] border border-border bg-card p-4">
            <label className="block text-[13px] font-semibold text-foreground/80">Tu nombre completo
              <input className={cn(input, "mt-1")} value={name} onChange={(e) => setName(e.target.value)} placeholder="Como aparece en tu documento" />
            </label>
            <label className="block text-[13px] font-semibold text-foreground/80">Tu fecha de nacimiento
              <input type="date" className={cn(input, "mt-1")} value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
            </label>
            <label className="block text-[13px] font-semibold text-foreground/80">¿Qué quieres saber hoy?{!required && <span className="font-normal text-muted-foreground"> (opcional)</span>}
              <textarea className={cn(input, "mt-1 min-h-28 py-2")} maxLength={1000} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Escríbelo con tus palabras, sin apuro." />
              <span className="mt-1 block text-right text-[12px] text-muted-foreground">{question.length}/1000</span>
            </label>
            {error && <p className="text-[13px] font-semibold text-destructive">{error}</p>}
            <button onClick={ask} disabled={points === null && cost > 0} className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[16px] font-bold text-primary-foreground shadow-elev active:scale-[.97] disabled:opacity-60">
              {enough || points === null ? <Sparkles className="h-5 w-5" /> : <Lock className="h-5 w-5" />} Ver mi respuesta{cost > 0 ? ` · ${cost} hoja${cost === 1 ? "" : "s"}` : ""}
            </button>
          </section>

          <ConsultaHistorial
            items={historyItems}
            loading={historyLoading}
            error={historyError ? "No pudimos cargar tu historial. Intenta de nuevo en un momento." : null}
            onOpen={openHistory}
            onDownload={(id) => { const r = history.find((h) => h.id === id); if (r) exportPdf(r.answer, r.full_name ?? name); }}
          />
        </>
      )}

      {step === 2 && <LoadingReading name={name} question={question || consulta.title} />}

      {step === 3 && answer && (
        <section className="space-y-3">
          <div className="rounded-[16px] bg-primary/10 p-5 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-primary">{consulta.title}</p>
            <h2 className="mt-2 font-display text-[26px] font-bold leading-[1.15]">{answer.__headline || consulta.subtitle || consulta.title}</h2>
          </div>
          {consulta.sections.map((s, i) =>
            answer[s.key] ? (
              <article key={s.key} className="animate-in fade-in slide-in-from-bottom-2 rounded-[16px] border border-border bg-card p-4" style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}>
                <div className="flex items-center gap-3">
                  <img src={ICONS3D[i % ICONS3D.length]} alt="" className="h-12 w-12 shrink-0 object-contain" />
                  <p className="font-display text-[17px] font-bold text-primary">{titlesOf(answer)[s.key] || s.label}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.6] text-foreground/90">{answer[s.key]}</p>
              </article>
            ) : null,
          )}
          <div className="relative z-10 grid grid-cols-2 gap-2 pt-2">
            <button type="button" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-border bg-card text-[15px] font-semibold active:scale-[.97]" onClick={() => exportPdf(answer, answerName)}><Download className="h-4 w-4" /> Descargar PDF</button>
            <button type="button" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-border bg-card text-[15px] font-semibold active:scale-[.97]" onClick={() => exportPdf(answer, answerName)}><Printer className="h-4 w-4" /> Imprimir</button>
          </div>
          <button onClick={() => { setAnswer(null); setQuestion(""); setStep(1); }} className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[16px] font-bold text-primary-foreground active:scale-[.97]">
            <Sparkles className="h-5 w-5" /> Hacer otra pregunta
          </button>
        </section>
      )}
    </div>
  );
}
