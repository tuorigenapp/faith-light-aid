import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printConsulta } from "@/lib/print-pdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

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
};

const input = "min-h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[15px] outline-none focus:border-primary";

function ConsultaPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Record<string, string> | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: consulta, isLoading } = useQuery({
    queryKey: ["consulta", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_consultas")
        .select("id, slug, title, subtitle, intro, cover_url, sections, is_published")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Consulta) ?? null;
    },
  });

  async function ask() {
    if (!name.trim() || !birthdate || question.trim().length < 5) {
      setError("Necesitamos tu nombre completo, tu fecha de nacimiento y lo que quieres saber.");
      return;
    }
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` },
        body: JSON.stringify({ slug, name: name.trim(), birthdate, question: question.trim() }),
      });
      const json = (await res.json()) as Record<string, string> & { error?: string };
      if (!res.ok || json.error) throw new Error(json.error || "No pudimos preparar tu respuesta.");
      setAnswer(json);
      setStep(3);
      if (user?.id && consulta?.id) {
        await supabase.from("custom_consulta_results").insert({
          user_id: user.id,
          consulta_id: consulta.id,
          full_name: name.trim(),
          birthdate,
          question: question.trim(),
          answer: json,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos preparar tu respuesta.");
    }
    setBusy(false);
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

  return (
    <div className="mx-auto max-w-[680px] space-y-4 p-4 pb-10">
      <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-[14px] font-bold text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <header className="overflow-hidden rounded-[16px] border border-border bg-card">
        {consulta.cover_url && <img src={consulta.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />}
        <div className="p-4">
          <h1 className="font-display text-[26px] font-bold leading-[1.15]">{consulta.title}</h1>
          {consulta.subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{consulta.subtitle}</p>}
          {consulta.intro && <p className="mt-3 text-[15px] leading-[1.5] text-foreground/85">{consulta.intro}</p>}
        </div>
      </header>

      {step !== 3 && !busy && <section className="space-y-3 rounded-[16px] border border-border bg-card p-4">
        <label className="block text-[13px] font-semibold text-foreground/80">Tu nombre completo
          <input className={cn(input, "mt-1")} value={name} onChange={(e) => setName(e.target.value)} placeholder="Como aparece en tu documento" />
        </label>
        <label className="block text-[13px] font-semibold text-foreground/80">Tu fecha de nacimiento
          <input type="date" className={cn(input, "mt-1")} value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
        </label>
        <label className="block text-[13px] font-semibold text-foreground/80">¿Qué quieres saber hoy?
          <textarea
            className={cn(input, "mt-1 min-h-28 py-2")}
            maxLength={1000}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Escríbelo con tus palabras, sin apuro."
          />
          <span className="mt-1 block text-right text-[12px] text-muted-foreground">{question.length}/1000</span>
        </label>
        {error && <p className="text-[13px] font-semibold text-destructive">{error}</p>}
        <button onClick={ask} disabled={busy} className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[16px] font-bold text-primary-foreground shadow-elev active:scale-[.97] disabled:opacity-60">
          <Sparkles className="h-5 w-5" /> Ver mi respuesta
        </button>
      </section>}

      {busy && <LoadingReading name={name} question={question} />}

      {answer && !busy && (
        <section className="space-y-3">
          <h2 className="font-display text-[22px] font-bold">Tu respuesta personal</h2>
          <div className="flex flex-wrap gap-2">{[["Descargar PDF", Download], ["Imprimir", Printer]].map(([label, Icon]) => { const ExportIcon = Icon as typeof Download; return <Button key={String(label)} variant="outline" onClick={() => printConsulta({ kind: "Respuesta personal", title: consulta.title, userName: name, userEmail: user?.email, sections: consulta.sections.map(s => ({ title: s.label, body: answer[s.key] ?? "" })) })}><ExportIcon className="h-4 w-4" /> {String(label)}</Button>; })}<Button variant="secondary" onClick={() => { setAnswer(null); setQuestion(""); setStep(2); }}>Nueva pregunta</Button></div>
          {consulta.sections.map((s, i) =>
            answer[s.key] ? (
              <article key={s.key} className="animate-in fade-in slide-in-from-bottom-2 rounded-[16px] border border-border bg-card p-4" style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}>
                <div className="flex items-center gap-3">
                  <img src={ICONS3D[i % ICONS3D.length]} alt="" className="h-12 w-12 shrink-0 object-contain" />
                  <p className="font-display text-[17px] font-bold text-primary">{s.label}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.6] text-foreground/90">{answer[s.key]}</p>
              </article>
            ) : null,
          )}
        </section>
      )}
    </div>
  );
}
