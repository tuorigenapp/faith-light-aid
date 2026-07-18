import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Headphones, Play, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/visualiza")({
  head: () => ({ meta: [{ title: "Visualízalo y Vívelo — Reconectando" }] }),
  component: Visualiza,
});

function Visualiza() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["manifest-cats", user?.id],
    queryFn: async () => {
      const [cats, entries, intake] = await Promise.all([
        supabase.from("manifest_categories").select("*").order("sort_order"),
        user ? supabase.from("manifest_entries").select("audio_id, completed, audio:manifest_audios(category_id)").eq("user_id", user.id) : Promise.resolve({ data: [] as any[] }),
        user ? supabase.from("intake_sessions").select("ai_plan").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null as any }),
      ]);
      return { cats: cats.data ?? [], entries: entries.data ?? [], recommended: (intake.data?.ai_plan?.recommended_categories ?? []) as string[] };
    },
  });

  const doneByCat = new Map<string, number>();
  for (const e of data?.entries ?? []) if (e.completed) {
    const cid = (e as any).audio?.category_id; if (!cid) continue;
    doneByCat.set(cid, (doneByCat.get(cid) ?? 0) + 1);
  }

  return (
    <div className="px-4 py-6 md:p-10 max-w-6xl mx-auto pb-24">
      <section className="relative overflow-hidden rounded-[2rem] p-6 md:p-10 bg-gradient-to-br from-primary via-primary/80 to-gold text-primary-foreground shadow-glow">
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 backdrop-blur px-3 py-1 text-xs font-bold"><Sparkles className="w-3.5 h-3.5" /> Nueva fase · Método de Cristo 3-6-9</div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl mt-4">Visualízalo y Vívelo</h1>
          <p className="mt-3 text-primary-foreground/85 max-w-2xl">Playlist guiada de manifestación cristiana. Elige el área que quieres que Dios transforme. Cada día escuchas un audio, repites la afirmación y completas tu ejercicio 3-6-9.</p>
          <p className="scripture mt-4 text-sm text-primary-foreground/80">"Dios habla · Yo creo · Yo obedezco · El Espíritu Santo guía y materializa."</p>
        </div>
      </section>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data?.cats ?? []).map((c: any) => {
          const done = doneByCat.get(c.id) ?? 0;
          const rec = (data?.recommended ?? []).includes(c.id);
          return (
            <Link key={c.id} to="/visualiza/$categoryId" params={{ categoryId: c.id }}>
              <Card className="overflow-hidden rounded-[1.7rem] shadow-soft hover:shadow-glow transition-all group h-full">
                <div className="relative h-40 grid place-items-center" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}bb)` }}>
                  <Headphones className="w-14 h-14 text-white/95 drop-shadow-lg" />
                  {rec && <div className="absolute top-3 left-3 rounded-full bg-white text-foreground px-2.5 py-1 text-[10px] font-bold flex items-center gap-1"><Sparkles className="w-3 h-3 text-gold" /> Para ti</div>}
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/45 backdrop-blur text-white px-3 py-1 text-xs font-bold">{done}/21</div>
                </div>
                <div className="p-5">
                  <div className="font-display font-bold text-xl">{c.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{c.subtitle}</p>
                  <p className="scripture text-xs text-muted-foreground/80 mt-3 line-clamp-2">"{c.affirmation_ya_tengo}"</p>
                  <div className="mt-4 flex items-center justify-between text-primary text-sm font-bold">
                    <span className="inline-flex items-center gap-2"><Play className="w-4 h-4" /> Empezar playlist</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
