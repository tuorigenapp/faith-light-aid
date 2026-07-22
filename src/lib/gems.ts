import { supabase } from "@/integrations/supabase/client";

export async function awardGems(amount: number, reason: string, meta?: Record<string, unknown>) {
  const { data, error } = await supabase.rpc("award_gems", {
    _amount: amount,
    _reason: reason,
    _meta: (meta ?? null) as never,
  });
  if (error) {
    console.error("[gems] award failed", error);
    return null;
  }
  return data as number;
}

export const GEM_REWARDS = {
  onboardingStep: 100,
  familyMember: 250,
  exerciseCompleted: 50,
  stageCompleted: 500,
  dailyDevotional: 30,
  manifestDay: 40,
} as const;

export const REWARDS = [
  {
    id: "call30",
    cost: 5000,
    title: "Llamada de 30 minutos",
    desc: "Sesión personal con un profesional.",
    tier: 3,
  },
  {
    id: "wa1w",
    cost: 10000,
    title: "1 semana de soporte por WhatsApp",
    desc: "Acompañamiento diario por 7 días.",
    tier: 2,
  },
  {
    id: "wa1m",
    cost: 20000,
    title: "1 mes de soporte interactivo",
    desc: "Acompañamiento profesional continuo.",
    tier: 1,
  },
];
