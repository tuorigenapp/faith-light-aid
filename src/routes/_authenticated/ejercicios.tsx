import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Clock, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ejercicios")({
  head: () => ({ meta: [{ title: "Ejercicios — Reconectando" }] }),
  component: Ejercicios,
});

const CATS = ["todos", "perdon", "gratitud", "sanidad", "identidad", "fe", "familiar", "pensamientos", "biblia"];

function Ejercicios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cat, setCat] = useState("todos");
  const [active, setActive] = useState<any | null>(null);

  const { data } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data } = await supabase.from("exercises").select("*").order("category");
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter(e => cat === "todos" || e.category === cat);

  async function complete() {
    if (!user || !active) return;
    await supabase.from("exercise_completions").insert({ user_id: user.id, exercise_id: active.id });
    toast.success("Ejercicio completado");
    setActive(null);
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl">Biblioteca de Ejercicios</h1>
      <p className="text-muted-foreground mt-2 text-sm">Prácticas espirituales guiadas para cada área de tu vida.</p>

      <Tabs value={cat} onValueChange={setCat} className="mt-6">
        <TabsList className="flex-wrap h-auto">
          {CATS.map(c => <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {filtered.map((e: any) => (
          <Card key={e.id} className="p-6 hover:border-gold transition-colors cursor-pointer" onClick={() => setActive(e)}>
            <div className="text-[10px] uppercase tracking-widest text-gold">{e.category}</div>
            <h3 className="font-display text-lg mt-1">{e.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{e.description}</p>
            <div className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5"><Clock className="w-3 h-3" />{e.duration_minutes} min</div>
          </Card>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={() => setActive(null)}>
          <Card className="max-w-lg w-full p-7" onClick={e => e.stopPropagation()}>
            <div className="text-[10px] uppercase tracking-widest text-gold">{active.category}</div>
            <h2 className="font-display text-2xl mt-1">{active.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{active.description}</p>
            <p className="scripture mt-3 text-sm">"{active.scripture}"</p>
            <ol className="mt-5 space-y-2.5 text-sm">
              {(active.steps as string[]).map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-medium">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="flex gap-2 mt-7">
              <Button variant="ghost" onClick={() => setActive(null)} className="flex-1">Cerrar</Button>
              <Button onClick={complete} className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90"><Check className="w-4 h-4 mr-2" />Completado</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
