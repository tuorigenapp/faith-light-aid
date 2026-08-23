import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

const SECTION = "pulse_felicidad";
const SNOOZE_KEY = "origen_pulse_next";
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const FACES = [
  { level: 1, emoji: "😣", label: "Muy mal", color: "#E5484D" },
  { level: 2, emoji: "🙁", label: "Regular", color: "#F76808" },
  { level: 3, emoji: "😐", label: "Normal", color: "#E0B25C" },
  { level: 4, emoji: "🙂", label: "Bien", color: "#7C5CFF" },
  { level: 5, emoji: "😄", label: "Muy feliz", color: "#3E9B4F" },
];

/**
 * Encuesta de satisfacción independiente: solo a usuarios con 2+ días en la app,
 * como máximo una vez al mes, sin interrumpir acciones importantes.
 */
export function SatisfactionPulse() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const snooze = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    if (snooze && Date.now() < snooze) return;

    (async () => {
      const [{ data: profile }, { data: last }] = await Promise.all([
        supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
        supabase
          .from("satisfaction_ratings")
          .select("created_at")
          .eq("user_id", user.id)
          .eq("section", SECTION)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;

      const createdAt = profile?.created_at ? Date.parse(profile.created_at) : Date.now();
      if (Date.now() - createdAt < 2 * 24 * 60 * 60 * 1000) return;
      if (last?.created_at && Date.now() - Date.parse(last.created_at) < MONTH_MS) return;

      const t = setTimeout(() => !cancelled && setOpen(true), 25000);
      return () => clearTimeout(t);
    })();

    return () => { cancelled = true; };
  }, [user]);

  function close(days = 30) {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * 86400000));
    setOpen(false);
  }

  async function pick(level: number) {
    if (!user || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from("satisfaction_ratings")
      .insert({ user_id: user.id, section: SECTION, stars: level });
    setSaving(false);
    if (error) {
      toast.error("No pudimos guardar tu respuesta. Intenta más tarde.");
      return;
    }
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + MONTH_MS));
    setThanks(true);
    setTimeout(() => setOpen(false), 2200);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-x-4 bottom-[104px] z-[55] mx-auto w-auto max-w-[400px] rounded-[16px] border border-border/60 bg-white p-5 text-center shadow-elevated animate-in fade-in slide-in-from-bottom-4 sm:left-auto sm:right-6 sm:inset-x-auto sm:w-[360px]">
      {thanks ? (
        <p className="py-4 font-display text-[17px] font-bold text-[#2A1B3D]">
          Gracias por decirnos 🕊️ <br />
          <span className="text-[14px] font-medium text-[#64667A]">Tu respuesta mejora ORÍGEN.</span>
        </p>
      ) : (
        <>
          <button
            onClick={() => close(30)}
            aria-label="Cerrar encuesta"
            className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full text-[#64667A] hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="px-4 font-display text-[17px] font-bold leading-snug text-[#2A1B3D]">
            ¿Qué tan feliz estás usando ORÍGEN?
          </p>
          <div className="mt-4 flex items-end justify-between gap-1">
            {FACES.map((f) => (
              <button
                key={f.level}
                onClick={() => pick(f.level)}
                disabled={saving}
                aria-label={f.label}
                className="grid h-14 w-14 place-items-center rounded-full text-[30px] transition hover:scale-110 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: `${f.color}1A` }}
              >
                {f.emoji}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-[#64667A]">Una sola respuesta, sin comentarios obligatorios.</p>
        </>
      )}
    </div>
  );
}
