import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Clock, Lock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { appDayKey } from "@/lib/app-day";
import { buildMensajes, healingIndex, SEEN_KEY, type Mensaje } from "@/lib/mensajes-origen";
import { cn } from "@/lib/utils";
import { ManagedImage } from "@/components/ManagedImage";

export const Route = createFileRoute("/_authenticated/mensajes")({
  head: () => ({
    meta: [
      { title: "Mensajes ORÍGEN — tus guías del día" },
      { name: "description", content: "Cinco guías de ORÍGEN te escriben una vez al día: la Palabra, tu estado emocional, tu práctica, tu crecimiento y el cierre de la noche." },
      { property: "og:title", content: "Mensajes ORÍGEN" },
      { property: "og:description", content: "Un mensaje de cada guía al día, pensado para tu proceso de sanación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MensajesPage,
});

type Checkin = { reference_id: string | null; metadata: { score?: number } | null; activity_date: string };

function MensajesPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [hour, setHour] = useState<number | null>(null);
  const day = appDayKey();
  useEffect(() => { setHour(new Date().getHours()); }, []);

  const name = ((profile?.display_name || profile?.full_name || "") as string).split(" ")[0] ?? "";
  const focus = (profile?.intention as string | null) ?? "";
  const { all, unlocked } = useMemo(() => buildMensajes({ name, focus, dayKey: day, hourNow: hour ?? 0 }), [name, focus, day, hour]);

  const { data: checkins = [], isLoading } = useQuery({
    queryKey: ["mensajes-checkins", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase.from("daily_activity").select("reference_id, metadata, activity_date").eq("user_id", user!.id).eq("activity_type", "mensaje_checkin").gte("activity_date", since);
      return (data ?? []) as Checkin[];
    },
  });

  useEffect(() => {
    if (hour === null) return;
    try { localStorage.setItem(SEEN_KEY(day), JSON.stringify(unlocked.map((m) => m.id))); } catch { /* ignore */ }
    window.dispatchEvent(new Event("mensajes-seen"));
  }, [hour, day, unlocked]);

  const index = healingIndex(checkins.map((c) => c.metadata?.score ?? 0).filter((s) => s > 0));
  const answered = new Map(checkins.filter((c) => c.activity_date === day).map((c) => [c.reference_id, c.metadata?.score]));

  async function answer(m: Mensaje, score: number) {
    if (!user || answered.has(m.id)) return;
    await supabase.from("daily_activity").insert({ user_id: user.id, activity_date: day, activity_type: "mensaje_checkin", reference_id: m.id, metadata: { score } });
    qc.invalidateQueries({ queryKey: ["mensajes-checkins", user.id] });
  }

  const next = all.find((m) => hour !== null && hour < m.hour);

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-6">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">Mensajes ORÍGEN</p>
      <h1 className="mt-1 font-display text-[28px] font-bold leading-tight">Tus guías de hoy</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">{new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })} · un mensaje de cada guía al día.</p>

      <section className="mt-5 flex items-center gap-4 rounded-[16px] bg-card p-4 shadow-[0_1px_3px_rgba(30,25,20,.06)]">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><TrendingUp className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-muted-foreground">Tu índice de sanación (7 días)</p>
          {isLoading ? <div className="mt-1 h-7 w-24 animate-pulse rounded bg-muted" /> : index === null
            ? <p className="text-[15px] font-semibold">Responde a la Dra. Lucía para empezar a medirlo</p>
            : <><p className="font-display text-[26px] font-bold leading-none">{index}%</p><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-gradient-to-r from-impact-low via-impact-mid to-impact-high motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${index}%` }} /></div></>}
        </div>
      </section>

      {hour !== null && unlocked.length === 0 && (
        <div className="mt-6 rounded-[16px] bg-card p-6 text-center shadow-[0_1px_3px_rgba(30,25,20,.06)]">
          <Clock className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 font-display text-[18px] font-semibold">Tu primer mensaje llega a las 6:00 a. m.</p>
          <p className="mt-1 text-[14px] text-muted-foreground">Samuel te traerá la Palabra del día.</p>
        </div>
      )}

      <ol className="mt-6 grid gap-3">
        {[...unlocked].reverse().map((m, i) => (
          <li key={m.id} className="rounded-[16px] bg-card p-4 shadow-[0_1px_3px_rgba(30,25,20,.06)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center gap-3">
              <ManagedImage imageKey={`imagen:mensaje:${m.id.slice(11)}`} src={m.avatar} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 shrink-0 rounded-full bg-primary/10 object-contain motion-safe:animate-[bounce_2.4s_ease-in-out_1]" />
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-tight">{m.assistant}</p>
                <p className="text-[12px] font-medium text-muted-foreground">{m.role} · {String(m.hour).padStart(2, "0")}:00</p>
              </div>
            </div>
            <h2 className="mt-3 text-[17px] font-semibold leading-snug">{m.title}</h2>
            <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{m.body}</p>
            {m.check && (
              <div className="mt-3">
                <p className="text-[13px] font-semibold text-muted-foreground">{m.check.question}</p>
                <div className="mt-2 grid gap-2">
                  {m.check.options.map((o) => {
                    const chosen = answered.get(m.id) === o.score;
                    const done = answered.has(m.id);
                    return (
                      <button key={o.label} disabled={done} onClick={() => answer(m, o.score)} className={cn("flex min-h-12 items-center justify-between rounded-[12px] border-[1.5px] px-4 text-left text-[15px] font-medium transition active:scale-[.97]", chosen ? "border-primary bg-primary/10" : "border-border", done && !chosen && "opacity-50")}>
                        {o.label}{chosen && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                {answered.has(m.id) && <p className="mt-2 text-[13px] font-semibold text-primary">Gracias. Tu respuesta ya suma a tu índice de sanación.</p>}
              </div>
            )}
            {m.link && <Link to={m.link.to} className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-[12px] bg-primary/10 px-4 text-[14px] font-semibold text-primary">{m.link.label} <ArrowRight className="h-4 w-4" /></Link>}
          </li>
        ))}
      </ol>

      {next && (
        <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-dashed border-border p-4">
          <ManagedImage imageKey={`imagen:mensaje:${next.id.slice(11)}`} src={next.avatar} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-contain opacity-70" />
          <p className="flex-1 text-[14px] text-muted-foreground"><span className="font-semibold text-foreground">{next.assistant}</span> te escribe a las {String(next.hour).padStart(2, "0")}:00</p>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <p className="mt-6 text-center text-[12px] text-muted-foreground">Estos mensajes son de acompañamiento; no reemplazan la atención de un profesional de salud.</p>
    </div>
  );
}
