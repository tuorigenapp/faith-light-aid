import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export function SatisfactionRating({ section, question = "¿Qué tanto te sirvió esto?" }: { section: string; question?: string }) {
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function send(value: number) {
    if (!user) return;
    setStars(value);
    if (value >= 4) await save(value, "");
  }

  async function save(value: number, text: string) {
    if (!user || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from("satisfaction_ratings")
      .insert({ user_id: user.id, section, stars: value, comment: text || null });
    setSaving(false);
    if (error) return toast.error("No pudimos guardar tu opinión. Intenta de nuevo.");
    setSent(true);
    toast.success("Gracias por decirnos", { description: "Tu opinión mejora ORÍGEN." });
  }

  if (sent) {
    return (
      <div className="rounded-[16px] border border-border/60 bg-card p-4 text-center text-sm text-muted-foreground">
        Gracias. Leemos cada respuesta. 🕊️
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
      <p className="text-sm font-semibold">{question}</p>
      <div className="mt-3 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            aria-label={`${n} estrellas`}
            onClick={() => send(n)}
            className="grid h-11 w-11 place-items-center active:scale-[.97] transition"
          >
            <Star className={`h-6 w-6 ${n <= stars ? "fill-primary text-primary" : "text-muted-foreground/50"}`} />
          </button>
        ))}
      </div>
      {stars > 0 && stars < 4 && (
        <div className="mt-3 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué te faltó? Cuéntanos en una línea."
            className="min-h-20 w-full rounded-[10px] border-[1.5px] border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
          />
          <button
            onClick={() => save(stars, comment)}
            disabled={saving}
            className="btn-primary-gradient min-h-11 w-full rounded-full text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Enviando…" : "Enviar mi opinión"}
          </button>
        </div>
      )}
    </div>
  );
}
