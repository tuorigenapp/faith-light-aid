import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Flame, Gem, Trophy, BookHeart, Sparkles, HeartHandshake,
  Layers, ChevronRight, Calendar,
} from "lucide-react";
import { printMinistracion } from "@/lib/print-pdf";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Mi Perfil — ORIGEN" }] }),
  component: Perfil,
});

function Perfil() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ display_name: "", full_name: "", country: "", age: "", bio: "" });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: stats } = useQuery({
    queryKey: ["perfil-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [ex, jr, min, par, pat, act] = await Promise.all([
        supabase.from("exercise_completions").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("ministracion_lecturas").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("pareja_lecturas").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("family_members").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("daily_activity").select("day").eq("user_id", user!.id).order("day", { ascending: false }).limit(30),
      ]);
      return {
        exercises: ex.count ?? 0,
        journals: jr.count ?? 0,
        ministraciones: min.count ?? 0,
        parejas: par.count ?? 0,
        familiares: pat.count ?? 0,
        activeDays: act.data?.length ?? 0,
      };
    },
  });

  const { data: ministraciones } = useQuery({
    queryKey: ["ministracion-hist", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("ministracion_lecturas").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  const { data: parejaHist } = useQuery({
    queryKey: ["pareja-hist", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("pareja_lecturas").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5)).data ?? [],
  });

  const { data: recentJournal } = useQuery({
    queryKey: ["journal-recent", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("journal_entries").select("id,title,content,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(3)).data ?? [],
  });

  useEffect(() => {
    if (profile) setForm({
      display_name: profile.display_name ?? "",
      full_name: profile.full_name ?? "",
      country: profile.country ?? "",
      age: String(profile.age ?? ""),
      bio: profile.bio ?? "",
    });
  }, [profile]);

  const name = profile?.display_name || profile?.full_name || "";
  const initials = useMemo(() => name.split(" ").filter(Boolean).slice(0,2).map(p => p[0]).join("").toUpperCase() || "O", [name]);

  const camino365 = Math.min(365, Math.max(1, stats?.activeDays ?? 1));
  const semana = Math.max(1, Math.ceil(camino365 / 7));

  async function save() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      display_name: form.display_name || null,
      full_name: form.full_name,
      country: form.country || null,
      age: form.age ? Number(form.age) : null,
      bio: form.bio,
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Perfil actualizado ✨");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  function downloadMinistracion(m: any) {
    printMinistracion({
      title: m.headline ?? "Lo que Dios te dijo",
      subtitle: m.question ? `Consulta: ${m.question}` : undefined,
      meta: new Date(m.created_at).toLocaleString("es", { dateStyle: "long", timeStyle: "short" }),
      sections: [
        { emoji: "⚖️", title: "Dictamen de la Corte Celestial", body: m.dictamen ?? "" },
        { emoji: "⏳", title: "Línea de tiempo", body: m.linea_tiempo ?? "" },
        { emoji: "🕊️", title: "Señales de confirmación", body: (Array.isArray(m.senales) ? m.senales : []).map((s: string, i: number) => `${i+1}. ${s}`).join("\n") },
        { emoji: "💫", title: "Ministración para tu vida", body: m.ministracion ?? "" },
        ...(m.rompe_ciclo ? [{ emoji: "⛓️‍💥", title: "Consejo del Cielo: Rompe el ciclo", body: m.rompe_ciclo }] : []),
        ...(m.versiculo ? [{ emoji: "📖", title: "Palabra que respalda el decreto", body: m.versiculo }] : []),
      ],
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-aura-top">
      <div className="mx-auto max-w-2xl px-4 pt-5 pb-24 space-y-4">
        {/* HEADER */}
        <div className="rounded-[24px] p-5 bg-brand-gradient text-white shadow-[0_20px_50px_-20px_rgba(124,92,255,0.6)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur grid place-items-center text-2xl font-bold ring-2 ring-white/40">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-widest opacity-80">Mi camino</div>
              <div className="text-xl font-bold truncate">{name || "Tu nombre"}</div>
              <div className="text-xs opacity-90 mt-0.5">{user?.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5">
            <MiniStat icon={<Calendar className="w-3.5 h-3.5" />} label="Día" value={`${camino365}/365`} />
            <MiniStat icon={<Flame className="w-3.5 h-3.5" />} label="Racha" value={`${profile?.consecutive_days ?? 0}d`} />
            <MiniStat icon={<Gem className="w-3.5 h-3.5" />} label="Gemas" value={profile?.gems ?? 0} />
          </div>
          <div className="mt-3 text-[11px] opacity-90 flex items-center justify-between">
            <span>Semana {semana} de 52</span>
            <span>Nivel: {profile?.spiritual_level ?? "inicial"}</span>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard color="#7C5CFF" icon={<Layers className="w-4 h-4" />} label="Etapa actual" value={`${profile?.current_stage ?? 1} / 8`} to="/etapas" />
          <MetricCard color="#F58BCB" icon={<Sparkles className="w-4 h-4" />} label="Ejercicios" value={stats?.exercises ?? 0} to="/ejercicios" />
          <MetricCard color="#5AA9FF" icon={<BookHeart className="w-4 h-4" />} label="Diario" value={stats?.journals ?? 0} to="/diario" />
          <MetricCard color="#3FBE8F" icon={<Trophy className="w-4 h-4" />} label="Premios" value={profile?.gems ?? 0} to="/premios" />
          <MetricCard color="#F7B955" icon={<HeartHandshake className="w-4 h-4" />} label="Parejas leídas" value={stats?.parejas ?? 0} to="/pareja" />
          <MetricCard color="#E05A6B" icon={<Sparkles className="w-4 h-4" />} label="Ministraciones" value={stats?.ministraciones ?? 0} to="/ministracion" />
        </div>

        {/* MINISTRACIONES HISTORY */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Historial</div>
              <h2 className="font-display font-bold text-lg">Dios te dijo hoy</h2>
            </div>
            <Link to="/ministracion" className="text-xs text-primary font-semibold">Nueva +</Link>
          </div>
          {ministraciones && ministraciones.length > 0 ? (
            <div className="space-y-2">
              {ministraciones.map(m => (
                <div key={m.id} className="rounded-2xl border border-border p-3 bg-white/70">
                  <div className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</div>
                  <div className="font-semibold text-sm leading-snug line-clamp-2 mt-0.5">{m.headline ?? "Ministración"}</div>
                  {m.question && <div className="text-xs text-muted-foreground line-clamp-1 mt-1">Consulta: {m.question}</div>}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => downloadMinistracion(m)} className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold">Descargar PDF</button>
                    <button onClick={async () => {
                      if (!confirm("¿Eliminar esta ministración?")) return;
                      await supabase.from("ministracion_lecturas").delete().eq("id", m.id);
                      qc.invalidateQueries({ queryKey: ["ministracion-hist"] });
                    }} className="text-xs px-3 py-1.5 rounded-full border border-border">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMini label="Aún no has recibido una ministración." cta="Recibir la primera" to="/ministracion" />
          )}
        </Card>

        {/* PAREJA HISTORY */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Historial</div>
              <h2 className="font-display font-bold text-lg">Lecturas de pareja</h2>
            </div>
            <Link to="/pareja" className="text-xs text-primary font-semibold">Nueva +</Link>
          </div>
          {parejaHist && parejaHist.length > 0 ? (
            <div className="space-y-2">
              {parejaHist.map(p => (
                <div key={p.id} className="rounded-2xl border border-border p-3 bg-white/70">
                  <div className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}</div>
                  <div className="font-semibold text-sm mt-0.5">{p.self_name} ✕ {p.partner_name}</div>
                  <div className="text-xs text-primary font-semibold mt-0.5">{p.verdict}</div>
                  {p.summary && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.summary}</div>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyMini label="Aún no analizas una pareja." cta="Analizar mi pareja" to="/pareja" />
          )}
        </Card>

        {/* RECENT JOURNAL */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Últimas entradas</div>
              <h2 className="font-display font-bold text-lg">Diario íntimo</h2>
            </div>
            <Link to="/diario" className="text-xs text-primary font-semibold">Escribir +</Link>
          </div>
          {recentJournal && recentJournal.length > 0 ? (
            <div className="space-y-2">
              {recentJournal.map(j => (
                <div key={j.id} className="rounded-2xl border border-border p-3 bg-white/70">
                  <div className="text-[10px] text-muted-foreground">{new Date(j.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}</div>
                  <div className="font-semibold text-sm mt-0.5 line-clamp-1">{j.title || "Sin título"}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{j.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMini label="Tu diario está vacío." cta="Escribir mi primera entrada" to="/diario" />
          )}
        </Card>

        {/* EDIT FORM */}
        <Card className="p-5">
          <h2 className="font-display font-bold text-lg mb-3">Editar mis datos</h2>
          <div className="space-y-3">
            <div><Label className="text-xs">Cómo quieres que te llamemos</Label>
              <Input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="Tu nombre" className="mt-1 h-11 rounded-[12px]" /></div>
            <div><Label className="text-xs">Nombre completo</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="mt-1 h-11 rounded-[12px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">País</Label>
                <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="mt-1 h-11 rounded-[12px]" /></div>
              <div><Label className="text-xs">Edad</Label>
                <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className="mt-1 h-11 rounded-[12px]" /></div>
            </div>
            <div><Label className="text-xs">Sobre mi camino</Label>
              <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="mt-1 min-h-24 rounded-[12px]" placeholder="Escribe qué buscas sanar..." /></div>
            <div><Label className="text-xs">Correo</Label>
              <Input value={user?.email ?? ""} disabled className="mt-1 h-11 rounded-[12px] opacity-60" /></div>
            <Button onClick={save} className="w-full h-12 rounded-[14px] btn-primary-gradient">Guardar cambios</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/20 backdrop-blur px-3 py-2.5 text-center ring-1 ring-white/30">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider opacity-90">{icon} {label}</div>
      <div className="text-lg font-bold mt-0.5 leading-none">{value}</div>
    </div>
  );
}

function MetricCard({ color, icon, label, value, to }: { color: string; icon: React.ReactNode; label: string; value: React.ReactNode; to: string }) {
  return (
    <Link to={to} className="rounded-2xl p-4 bg-white shadow-soft border border-border hover:shadow-md transition-all active:scale-[.98]">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl grid place-items-center text-white" style={{ background: color }}>{icon}</div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold mt-2 font-display">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </Link>
  );
}

function EmptyMini({ label, cta, to }: { label: string; cta: string; to: string }) {
  return (
    <div className="text-center py-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <Link to={to} className="mt-2 inline-block text-xs font-semibold text-primary">{cta} →</Link>
    </div>
  );
}
