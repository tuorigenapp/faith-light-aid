import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Headphones, GraduationCap, Video, Sparkles, FileDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca — Reconectando" }] }),
  component: Biblioteca,
});

const ICONS: Record<string, any> = { ebook: BookOpen, audio: Headphones, curso: GraduationCap, seminario: Video, devocional: Sparkles, recurso: FileDown };
const PLAN_LABEL: Record<string, string> = { free: "Gratis", inicial: "Inicial", basico: "Básico", avanzado: "Avanzado", anual: "Anual" };

function Biblioteca() {
  const { data } = useQuery({
    queryKey: ["library"],
    queryFn: async () => (await supabase.from("library_items").select("*").order("kind")).data ?? [],
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl">Biblioteca Digital</h1>
      <p className="text-muted-foreground mt-2 text-sm">Ebooks, audios, cursos, seminarios y devocionales.</p>
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        {(data ?? []).map((it: any) => {
          const Icon = ICONS[it.kind] ?? BookOpen;
          return (
            <Card key={it.id} className="p-6">
              <div className="w-12 h-12 rounded-xl bg-divine grid place-items-center text-white"><Icon className="w-5 h-5" /></div>
              <div className="text-[10px] uppercase tracking-widest text-gold mt-4">{it.category}</div>
              <h3 className="font-display text-lg mt-1">{it.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{it.description}</p>
              <Badge variant={it.required_plan === "free" ? "secondary" : "default"} className="mt-4">{PLAN_LABEL[it.required_plan]}</Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
