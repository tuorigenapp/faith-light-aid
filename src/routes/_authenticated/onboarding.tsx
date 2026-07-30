import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Loader2, Lock, User as UserIcon, Heart, DollarSign, Brain, Sprout, Mountain, HandHeart, Check } from "lucide-react";
import { awardGems, GEM_REWARDS } from "@/lib/gems";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

import logo from "@/assets/logo-origen.png.asset.json";
import portal from "@/assets/onb-portal.png";
import eCross from "@/assets/e3d-cross.png.asset.json";
import eBrain from "@/assets/e3d-brain.png.asset.json";
import eHeartGem from "@/assets/e3d-heartgem.png.asset.json";
import eCoin from "@/assets/e3d-coin.png.asset.json";
import eStar from "@/assets/e3d-star.png.asset.json";
import eCouple from "@/assets/e3d-couple.png.asset.json";
import eHeartPurple from "@/assets/e3d-heart-purple.png";
import eButterfly from "@/assets/e3d-butterfly.png";
import eClouds from "@/assets/e3d-clouds.png";
import eHeadphones from "@/assets/e3d-headphones.png";
import ePractice from "@/assets/e3d-practice.png";
import eBook from "@/assets/e3d-book.png";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Bienvenido — ORIGEN" }] }),
  component: Onboarding,
});

type Impact = { relaciones: string; prosperidad: string; emociones: string };
type Strengths = { adaptarte: string; resistir: string; ayudar: string };
type AIResult = {
  pattern_name: string;
  pattern_summary: string;
  impact: Impact;
  strengths: Strengths;
  primary_focus: string;
  recommended_categories: string[];
  closure_reflection: string;
  welcome_message: string;
  needs_more: false | string;
};

const TOTAL_STEPS = 9;

const DESEOS = [
  { id: "sanar", label: "Sanar heridas emocionales", img: eHeartPurple },
  { id: "dios", label: "Fortalecer mi relación con Dios", img: eCross.url },
  { id: "abundancia", label: "Manifestar abundancia y propósito", img: eStar.url },
  { id: "identidad", label: "Renovar mi identidad", img: eButterfly },
  { id: "todas", label: "Todas las anteriores", img: eClouds },
];

const AREAS = [
  { id: "emocional", label: "Emocional", img: eHeartGem.url },
  { id: "espiritual", label: "Espiritual", img: eCross.url },
  { id: "mental", label: "Mental", img: eBrain.url },
  { id: "financiera", label: "Financiera", img: eCoin.url },
  { id: "relaciones", label: "Relaciones", img: eCouple.url },
  { id: "proposito", label: "Propósito", img: eStar.url },
];

const DETONANTES = [
  "Miedos e inseguridades",
  "Heridas del pasado",
  "Falta de disciplina",
  "Pensamientos negativos",
  "No tengo claridad",
];

const GUIAS = [
  { id: "musica", label: "Con música, audios y afirmaciones", img: eHeadphones },
  { id: "practica", label: "Con ejercicios prácticos y desafíos", img: ePractice },
  { id: "fe", label: "Con enseñanzas, fe y reflexión", img: eBook },
];

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);

  const [name, setName] = useState("");
  const [deseo, setDeseo] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [raices, setRaices] = useState("");
  const [detonantes, setDetonantes] = useState<string[]>([]);
  const [recuerdos, setRecuerdos] = useState("");
  const [guia, setGuia] = useState("");

  const [processing, setProcessing] = useState(false);
  const [ai, setAi] = useState<AIResult | null>(null);
  const [analysisLine, setAnalysisLine] = useState(0);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: intake }, { data: profile }] = await Promise.all([
        supabase.from("intake_sessions").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name, display_name").eq("id", user.id).maybeSingle(),
      ]);
      if (intake?.status === "completed") {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      const g = (intake?.genealogy as Record<string, unknown>) ?? {};
      const c = (intake?.childhood as Record<string, unknown>) ?? {};
      setRaices((g.raices as string) ?? "");
      setRecuerdos((c.recuerdos as string) ?? "");
      setDeseo((g.deseo as string) ?? "");
      setAreas((g.areas as string[]) ?? []);
      setDetonantes((c.detonantes as string[]) ?? []);
      setGuia((c.guia as string) ?? "");
      const raw = profile?.display_name || profile?.full_name || "";
      setName(raw.startsWith("invitado_") ? "" : raw);
      setLoading(false);
    })();
  }, [user, navigate]);

  const lines = [
    "Leyendo tus respuestas…",
    "Encontrando patrones…",
    "Conectando tu experiencia…",
    "Analizando emociones…",
    "Detectando fortalezas…",
    "Preparando tu plan ORIGEN personalizado…",
  ];

  useEffect(() => {
    if (step !== 9 || !processing) return;
    setAnalysisLine(0);
    const id = setInterval(() => setAnalysisLine((n) => Math.min(n + 1, lines.length - 1)), 1100);
    return () => clearInterval(id);
  }, [step, processing, lines.length]);

  async function persist(extra: Record<string, unknown> = {}) {
    if (!user) return;
    await supabase.from("intake_sessions").upsert({
      user_id: user.id,
      stage: step,
      genealogy: { raices, deseo, areas },
      childhood: { recuerdos, detonantes, guia },
      ...extra,
    }, { onConflict: "user_id" });
  }

  function next(to: number) { setDir(1); setStep(to); }
  function back(to: number) { setDir(-1); setStep(to); }

  async function goNext() {
    if (step === 1) { next(2); return; }
    if (step === 2) {
      if (!name.trim()) return toast.error("Escribe cómo quieres que te llamemos");
      await supabase.from("profiles").update({ display_name: name.trim(), full_name: name.trim() }).eq("id", user!.id);
      await awardGems(GEM_REWARDS.onboardingStep, "Paso 1 completado");
      next(3);
    } else if (step === 3) {
      if (!deseo) return toast.error("Elige una opción para continuar");
      await persist(); next(4);
    } else if (step === 4) {
      if (!areas.length) return toast.error("Elige al menos un área");
      await persist(); await awardGems(GEM_REWARDS.onboardingStep, "Áreas elegidas"); next(5);
    } else if (step === 5) {
      if (raices.trim().length < 8) return toast.error("Cuéntanos con al menos una frase");
      await persist(); await awardGems(GEM_REWARDS.onboardingStep, "Tus raíces"); next(6);
    } else if (step === 6) {
      if (!detonantes.length) return toast.error("Elige al menos una opción");
      await persist(); next(7);
    } else if (step === 7) {
      if (recuerdos.trim().length < 8) return toast.error("Cuéntanos con al menos una frase");
      await persist(); await awardGems(GEM_REWARDS.onboardingStep, "Tus recuerdos"); next(8);
    } else if (step === 8) {
      if (!guia) return toast.error("Elige cómo quieres que te guiemos");
      await persist();
      next(9);
      await runAnalysis();
    } else if (step === 10) {
      next(11);
    } else if (step === 11) {
      await complete();
    }
  }

  async function runAnalysis() {
    setProcessing(true);
    try {
      const raicesFull = [
        raices,
        deseo ? `Mayor deseo ahora: ${DESEOS.find((d) => d.id === deseo)?.label}` : "",
        areas.length ? `Áreas a transformar: ${areas.map((a) => AREAS.find((x) => x.id === a)?.label).join(", ")}` : "",
      ].filter(Boolean).join("\n");
      const recuerdosFull = [
        recuerdos,
        detonantes.length ? `Lo que la detiene hoy: ${detonantes.join(", ")}` : "",
        guia ? `Prefiere ser guiada: ${GUIAS.find((g) => g.id === guia)?.label}` : "",
      ].filter(Boolean).join("\n");

      const r = await fetch("/api/intake-closure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, genealogy: { raices: raicesFull }, childhood: { recuerdos: recuerdosFull } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Error");
      await new Promise((res) => setTimeout(res, 3800));
      setShowLogo(true);
      await new Promise((res) => setTimeout(res, 2200));
      setAi(j);
      await persist({ ai_plan: j, ai_summary: j.pattern_summary, primary_focus: j.primary_focus });
      setShowLogo(false);
      next(10);
    } catch (e) {
      toast.error((e as Error).message);
      setShowLogo(false);
      back(8);
    } finally {
      setProcessing(false);
    }
  }

  async function complete() {
    if (!user || !ai) return;
    await persist({ status: "completed", closure_completed_at: new Date().toISOString(), ai_plan: ai });
    await awardGems(500, "Onboarding completo");
    await qc.invalidateQueries({ queryKey: ["intake-status"] });
    await qc.refetchQueries({ queryKey: ["intake-status"] });
    toast.success(`¡Bienvenido${name ? ", " + name : ""}!`);
    navigate({ to: "/dashboard", replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showLogo) return <LogoReveal />;

  return (
    <div className="relative min-h-dvh overflow-hidden"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #F3ECFF 0%, #FBFAFF 55%, #FDEEF7 100%)" }}>
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(124,92,255,0.16), transparent 65%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 w-[36rem] h-[36rem] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(245,139,203,0.14), transparent 65%)" }} />

      <SocialProof />

      <div className="relative z-10 mx-auto w-full max-w-[420px] px-5 pt-8 pb-14 min-h-dvh flex flex-col">
        {step > 1 && step < 9 && (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              {step > 2 ? (
                <button onClick={() => back(step - 1)} aria-label="Atrás"
                  className="w-9 h-9 rounded-full bg-white shadow-soft grid place-items-center text-[#64667A] active:scale-95 transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : <div className="w-9 h-9" />}
              <div className="flex-1 h-2 rounded-full bg-[#ECEEF5] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${Math.round((step / TOTAL_STEPS) * 100)}%` }} />
              </div>
              <span className="text-[12px] font-semibold text-[#64667A] tabular-nums">{step}/{TOTAL_STEPS}</span>
            </div>
          </div>
        )}

        <div className="flex-1 flex items-start justify-center">
          <div key={step}
            className={cn("w-full", dir === 1
              ? "animate-in fade-in slide-in-from-right-6 duration-300"
              : "animate-in fade-in slide-in-from-left-6 duration-300")}>
            {step === 1 && <ScreenIntro onNext={goNext} />}
            {step === 2 && <ScreenName name={name} setName={setName} onNext={goNext} />}
            {step === 3 && <ScreenChoice
              eyebrow="Tu deseo"
              title="¿Cuál es tu mayor deseo ahora mismo?"
              options={DESEOS}
              value={deseo}
              onSelect={(id) => { setDeseo(id); setTimeout(goNext, 300); }}
            />}
            {step === 4 && <ScreenAreas areas={areas} setAreas={setAreas} onNext={goNext} />}
            {step === 5 && <ScreenRaices value={raices} setValue={setRaices} onNext={goNext} />}
            {step === 6 && <ScreenMulti
              eyebrow="Tus detonantes"
              title="¿Qué te está deteniendo hoy?"
              hint="Puedes elegir varias."
              options={DETONANTES}
              values={detonantes}
              setValues={setDetonantes}
              onNext={goNext}
            />}
            {step === 7 && <ScreenRecuerdos value={recuerdos} setValue={setRecuerdos} onNext={goNext} />}
            {step === 8 && <ScreenChoice
              eyebrow="Tu estilo"
              title="¿Cómo prefieres que te guiemos?"
              options={GUIAS}
              value={guia}
              onSelect={(id) => { setGuia(id); setTimeout(goNext, 300); }}
            />}
            {step === 9 && <ScreenLoading line={lines[analysisLine]} progress={Math.round(((analysisLine + 1) / lines.length) * 100)} />}
            {step === 10 && ai && <Screen5 ai={ai} onNext={goNext} />}
            {step === 11 && ai && <Screen6 ai={ai} onNext={goNext} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────── Shared building blocks ────────── */

function Emoji({ src, size = 64, className = "" }: { src: string; size?: number; className?: string }) {
  return (
    <img src={src} alt="" aria-hidden loading="lazy" width={size} height={size}
      className={cn("object-contain drop-shadow-[0_10px_22px_rgba(124,92,255,0.25)]", className)}
      style={{ width: size, height: size }} />
  );
}

function ScreenCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[2rem] bg-white/90 backdrop-blur shadow-soft p-6 animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full h-14 rounded-[18px] btn-primary-gradient font-semibold text-[16px] tracking-tight text-white inline-flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[.98] transition">
      {children}
    </button>
  );
}

function PrivacyNote() {
  return (
    <div className="inline-flex items-center gap-1.5 text-[12px] text-[#64667A]">
      <Lock className="w-3.5 h-3.5" /> Solo tú podrás leer esto.
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-[11px] tracking-[0.18em] font-bold text-[#7C5CFF] uppercase">{children}</p>;
}

/* ────────── Social proof ────────── */

type Network = "tiktok" | "instagram" | "facebook";
const NET_ICON: Record<Network, string> = {
  tiktok: icTiktok.url,
  instagram: icInstagram.url,
  facebook: icFacebook.url,
};
const NET_LABEL: Record<Network, string> = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook" };

const SIGNUPS: { name: string; place: string; net: Network }[] = [
  { name: "Camila R.", place: "Colombia 🇨🇴", net: "tiktok" },
  { name: "Miguel A.", place: "México 🇲🇽", net: "facebook" },
  { name: "Rocío G.", place: "España 🇪🇸", net: "instagram" },
  { name: "Josué M.", place: "Perú 🇵🇪", net: "tiktok" },
  { name: "Daniela P.", place: "Ecuador 🇪🇨", net: "instagram" },
  { name: "Luis F.", place: "Guatemala 🇬🇹", net: "facebook" },
  { name: "Ana V.", place: "Argentina 🇦🇷", net: "tiktok" },
];

const REVIEWS: { name: string; place: string; net: Network; text: string }[] = [
  { name: "Karla S.", place: "Chile 🇨🇱", net: "instagram", text: "Entendí en 3 minutos lo que llevaba años repitiendo." },
  { name: "Andrés T.", place: "México 🇲🇽", net: "tiktok", text: "Sentí paz por primera vez en mucho tiempo." },
  { name: "Paola N.", place: "Colombia 🇨🇴", net: "facebook", text: "No es religión impuesta, es acompañamiento real." },
  { name: "Ruth E.", place: "Perú 🇵🇪", net: "instagram", text: "Por fin vi de dónde venía el patrón de mi familia." },
];

function Avatar({ name, net }: { name: string; net: Network }) {
  return (
    <div className="relative shrink-0">
      <div className="w-11 h-11 rounded-full grid place-items-center text-white font-display font-black text-[15px]"
        style={{ background: "linear-gradient(135deg,#8F6BFF 0%,#F58BCB 100%)" }}>
        {name.slice(0, 1)}
      </div>
      <img src={NET_ICON[net]} alt="" aria-hidden width={64} height={64}
        className="absolute -bottom-1 -right-1 w-5 h-5 object-contain drop-shadow" />
    </div>
  );
}

function SocialProof() {
  const [item, setItem] = useState<{ kind: "signup" | "review"; name: string; place: string; net: Network; text: string } | null>(null);

  useEffect(() => {
    let i = 0;
    let hide: ReturnType<typeof setTimeout>;
    const show = () => {
      if (i % 2 === 0) {
        const s = SIGNUPS[(i / 2 | 0) % SIGNUPS.length];
        setItem({ kind: "signup", ...s, text: `se acaba de registrar en ORIGEN a través de ${NET_LABEL[s.net]}` });
      } else {
        const r = REVIEWS[((i - 1) / 2 | 0) % REVIEWS.length];
        setItem({ kind: "review", ...r });
      }
      hide = setTimeout(() => setItem(null), 5200);
      i++;
    };
    const first = setTimeout(show, 2500);
    const id = setInterval(show, 11000);
    return () => { clearTimeout(first); clearTimeout(hide); clearInterval(id); };
  }, []);

  if (!item) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,380px)] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-[16px] bg-white/95 backdrop-blur border border-[#1B1B27]/[0.08] shadow-[0_8px_30px_rgba(30,25,20,0.12)] px-4 py-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Avatar name={item.name} net={item.net} />
        <div className="min-w-0">
          {item.kind === "signup" ? (
            <>
              <p className="text-[12.5px] leading-snug text-[#1B1B27]">
                <span className="font-bold">{item.name}</span> {item.text}
              </p>
              <p className="text-[11px] text-[#64667A] mt-0.5">{item.place} · hace un momento</p>
            </>
          ) : (
            <>
              <p className="text-[12.5px] leading-snug text-[#1B1B27] italic">“{item.text}”</p>
              <p className="text-[11px] text-[#64667A] mt-0.5">
                <span className="font-semibold">{item.name}</span> · {item.place} · <span className="text-[#F7B955]">★★★★★</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/* ────────── Screens 1-9 ────────── */

function ScreenIntro({ onNext }: { onNext: () => void }) {
  return (
    <div className="pt-2">
      <Eyebrow>Esto no es casualidad</Eyebrow>
      <h1 className="mt-3 text-center font-display font-extrabold text-[32px] leading-[1.12] text-[#1B1B27]">
        Bienvenida a tu<br />transformación
      </h1>
      <div className="mt-5 rounded-[28px] overflow-hidden shadow-soft">
        <img src={portal} alt="Portal de luz con una paloma volando hacia él" width={768} height={1024}
          className="w-full h-[220px] object-cover" />
      </div>
      <p className="mt-5 text-center text-[15px] leading-relaxed text-[#64667A]">
        ORIGEN fue creado para ayudarte a sanar, renovar tu identidad, fortalecer tu relación con Dios
        y manifestar una vida con propósito.
      </p>
      <div className="mt-5 rounded-[22px] bg-white/90 backdrop-blur shadow-soft p-5 flex items-center gap-4">
        <Emoji src={eHeartPurple} size={54} />
        <p className="text-[14px] leading-snug text-[#1B1B27] font-medium">
          Miles de personas ya están viviendo su mejor versión. <span className="text-[#7C5CFF]">¿Lista para comenzar?</span>
        </p>
      </div>
      <div className="mt-6">
        <PrimaryButton onClick={onNext}>Sí, quiero comenzar <ArrowRight className="w-4 h-4" /></PrimaryButton>
      </div>
      <p className="mt-3 text-center text-[12px] text-[#64667A]">Menos de 3 minutos · Sin respuestas correctas</p>
    </div>
  );
}

function ScreenName({ name, setName, onNext }: { name: string; setName: (s: string) => void; onNext: () => void }) {
  return (
    <ScreenCard>
      <div className="grid place-items-center">
        <div className="relative w-28 h-28 grid place-items-center">
          <div aria-hidden className="absolute inset-0 rounded-full blur-2xl animate-glow"
            style={{ background: "radial-gradient(circle, rgba(245,139,203,0.38), transparent 65%)" }} />
          <Emoji src={eHeartGem.url} size={92} className="relative animate-breathe" />
        </div>
      </div>
      <h1 className="text-center font-display font-extrabold text-[30px] leading-[1.12] mt-4 text-[#1B1B27]">
        Bienvenido <span className="text-[#F58BCB]">♡</span>
      </h1>
      <p className="text-center text-[15px] text-[#64667A] mt-3 leading-relaxed">
        Este recorrido dura menos de 3 minutos.<br />Cada respuesta nos ayuda a comprender tu historia.
      </p>
      <p className="text-center text-[13px] text-[#7C5CFF] font-medium mt-2">No existen respuestas correctas.</p>

      <div className="mt-6 rounded-[18px] border border-[#ECEEF5] bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-[#7C5CFF]">
          <UserIcon className="w-4 h-4" />
          <span className="text-[13px] font-semibold text-[#1B1B27]">¿Cómo quieres que te llamemos?</span>
        </div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Escribe tu nombre"
          className="mt-1 h-11 border-0 shadow-none bg-transparent px-0 text-[16px] focus-visible:ring-0" />
      </div>

      <div className="mt-6">
        <PrimaryButton onClick={onNext}>Continuar <ArrowRight className="w-4 h-4" /></PrimaryButton>
      </div>
    </ScreenCard>
  );
}

function ScreenChoice({ eyebrow, title, options, value, onSelect }: {
  eyebrow: string; title: string;
  options: { id: string; label: string; img: string }[];
  value: string; onSelect: (id: string) => void;
}) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-center font-display font-extrabold text-[26px] leading-[1.15] text-[#1B1B27]">{title}</h2>
      <div className="mt-6 space-y-3">
        {options.map((o, i) => {
          const active = value === o.id;
          return (
            <button key={o.id} onClick={() => onSelect(o.id)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={cn(
                "w-full min-h-[64px] rounded-[20px] bg-white px-4 py-3 flex items-center gap-3 text-left transition active:scale-[.98] animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both",
                active ? "border-2 border-[#7C5CFF] shadow-[0_4px_14px_rgba(124,92,255,0.25)]" : "border border-[#ECEEF5] shadow-[0_1px_3px_rgba(30,25,20,0.06)]"
              )}>
              <Emoji src={o.img} size={44} />
              <span className="flex-1 text-[15px] font-semibold text-[#1B1B27] leading-snug">{o.label}</span>
              <span className={cn("w-6 h-6 rounded-full grid place-items-center shrink-0",
                active ? "bg-[#7C5CFF] text-white" : "border border-[#E3E5EF]")}>
                {active && <Check className="w-3.5 h-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScreenAreas({ areas, setAreas, onNext }: { areas: string[]; setAreas: (a: string[]) => void; onNext: () => void }) {
  const toggle = (id: string) => setAreas(areas.includes(id) ? areas.filter((a) => a !== id) : [...areas, id]);
  return (
    <div>
      <Eyebrow>Tus áreas</Eyebrow>
      <h2 className="mt-3 text-center font-display font-extrabold text-[26px] leading-[1.15] text-[#1B1B27]">
        ¿Qué área de tu vida quieres transformar primero?
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {AREAS.map((a, i) => {
          const active = areas.includes(a.id);
          return (
            <button key={a.id} onClick={() => toggle(a.id)} style={{ animationDelay: `${i * 60}ms` }}
              className={cn(
                "rounded-[20px] bg-white p-4 grid place-items-center gap-2 min-h-[124px] transition active:scale-[.98] animate-in fade-in zoom-in-95 duration-300 fill-mode-both",
                active ? "border-2 border-[#7C5CFF] shadow-[0_4px_14px_rgba(124,92,255,0.25)]" : "border border-[#ECEEF5] shadow-[0_1px_3px_rgba(30,25,20,0.06)]"
              )}>
              <Emoji src={a.img} size={52} />
              <span className="text-[14px] font-semibold text-[#1B1B27]">{a.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-[18px] bg-[#F1EDFF] px-4 py-3 text-center text-[13px] font-medium text-[#7C5CFF]">
        ¡Trabajaremos todas estas áreas contigo!
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext} disabled={!areas.length}>Continuar <ArrowRight className="w-4 h-4" /></PrimaryButton>
      </div>
    </div>
  );
}

function ScreenMulti({ eyebrow, title, hint, options, values, setValues, onNext }: {
  eyebrow: string; title: string; hint: string; options: string[];
  values: string[]; setValues: (v: string[]) => void; onNext: () => void;
}) {
  const toggle = (o: string) => setValues(values.includes(o) ? values.filter((v) => v !== o) : [...values, o]);
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-center font-display font-extrabold text-[26px] leading-[1.15] text-[#1B1B27]">{title}</h2>
      <p className="mt-2 text-center text-[13px] text-[#64667A]">{hint}</p>
      <div className="mt-6 space-y-3">
        {options.map((o, i) => {
          const active = values.includes(o);
          return (
            <button key={o} onClick={() => toggle(o)} style={{ animationDelay: `${i * 60}ms` }}
              className={cn(
                "w-full min-h-[56px] rounded-[18px] bg-white px-4 py-3 flex items-center gap-3 text-left transition active:scale-[.98] animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both",
                active ? "border-2 border-[#7C5CFF] shadow-[0_4px_14px_rgba(124,92,255,0.25)]" : "border border-[#ECEEF5] shadow-[0_1px_3px_rgba(30,25,20,0.06)]"
              )}>
              <span className={cn("w-7 h-7 rounded-full grid place-items-center shrink-0",
                active ? "bg-[#7C5CFF] text-white" : "bg-[#F1EDFF] text-[#7C5CFF]")}>
                <Check className="w-4 h-4" />
              </span>
              <span className="flex-1 text-[15px] font-semibold text-[#1B1B27] leading-snug">{o}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <PrimaryButton onClick={onNext} disabled={!values.length}>Continuar <ArrowRight className="w-4 h-4" /></PrimaryButton>
      </div>
    </div>
  );
}

function ScreenRaices({ value, setValue, onNext }: { value: string; setValue: (s: string) => void; onNext: () => void }) {
  return (
    <ScreenCard>
      <div className="grid place-items-center">
        <Emoji src={eCouple.url} size={86} className="animate-breathe" />
      </div>
      <h2 className="text-center font-display font-extrabold text-[26px] mt-4 text-[#1B1B27]">Tus raíces 🌿</h2>
      <p className="text-center text-[14px] text-[#64667A] mt-2 leading-relaxed">
        Las historias familiares influyen en cómo vivimos hoy.
      </p>
      <p className="text-center font-display font-semibold text-[16px] mt-4 text-[#1B1B27]">
        ¿Qué patrones has observado repetirse en tu familia o linaje?
      </p>
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Escribe con libertad…"
        className="mt-4 min-h-32 rounded-[18px] border-[#ECEEF5] bg-white text-[15px] resize-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/25 focus-visible:border-[#7C5CFF]" />
      <div className="mt-3"><PrivacyNote /></div>
      <div className="mt-4">
        <PrimaryButton onClick={onNext}>Continuar <ArrowRight className="w-4 h-4" /></PrimaryButton>
      </div>
    </ScreenCard>
  );
}

function ScreenRecuerdos({ value, setValue, onNext }: { value: string; setValue: (s: string) => void; onNext: () => void }) {
  return (
    <ScreenCard>
      <div className="grid place-items-center">
        <Emoji src={eClouds} size={86} className="animate-breathe" />
      </div>
      <h2 className="text-center font-display font-extrabold text-[26px] mt-4 text-[#1B1B27]">
        Tus primeros recuerdos <span className="text-[#F58BCB]">♡</span>
      </h2>
      <p className="text-center text-[14px] text-[#64667A] mt-2 leading-relaxed">
        A veces un recuerdo explica más que cientos de palabras.
      </p>
      <p className="text-center font-display font-semibold text-[16px] mt-4 text-[#1B1B27]">
        ¿Qué experiencia marcó tu infancia de manera profunda?
      </p>
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Escribe con libertad…"
        className="mt-4 min-h-32 rounded-[18px] border-[#ECEEF5] bg-white text-[15px] resize-none focus-visible:ring-2 focus-visible:ring-[#7C5CFF]/25 focus-visible:border-[#7C5CFF]" />
      <div className="mt-3"><PrivacyNote /></div>
      <div className="mt-4">
        <PrimaryButton onClick={onNext}>Continuar <ArrowRight className="w-4 h-4" /></PrimaryButton>
      </div>
    </ScreenCard>
  );
}

function ScreenLoading({ line, progress }: { line: string; progress: number }) {
  return (
    <div className="pt-10 text-center">
      <div className="relative mx-auto w-44 h-44 grid place-items-center">
        <div aria-hidden className="absolute inset-0 rounded-full blur-3xl animate-glow"
          style={{ background: "radial-gradient(circle, rgba(124,92,255,0.35), rgba(245,139,203,0.25) 40%, transparent 70%)" }} />
        <img src={portal} alt="" aria-hidden width={768} height={1024}
          className="relative w-36 h-36 object-cover rounded-full shadow-soft animate-breathe" />
      </div>
      <h2 className="mt-7 font-display font-extrabold text-[26px] text-[#1B1B27]">Preparando tu transformación…</h2>
      <div className="mt-5 mx-auto w-[220px] h-2 rounded-full bg-[#ECEEF5] overflow-hidden">
        <div className="h-full rounded-full bg-gradient-primary transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-5 h-6">
        <p key={line} className="text-[14px] text-[#64667A] animate-in fade-in slide-in-from-bottom-2 duration-500">{line}</p>
      </div>
    </div>
  );
}

function LogoReveal() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(120% 100% at 50% 0%, #EFE7FF 0%, #FBFAFF 55%, #FDEEF7 100%)" }}>
      <div className="relative flex items-center justify-center">
        <span className="splash-ring" />
        <span className="splash-ring" style={{ animationDelay: "0.6s" }} />
        <span className="splash-ring" style={{ animationDelay: "1.2s" }} />
        <img src={logo.url} alt="ORIGEN" width={200} height={200}
          className="relative z-10 w-[200px] h-[200px] object-contain drop-shadow-[0_20px_60px_rgba(124,92,255,0.35)] splash-breathe" />
      </div>
      <div className="mt-8 text-center px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#1B1930]">ORIGEN</h1>
        <p className="mt-2 text-sm text-[#6B6A85] font-medium">Transforma tu alma, vive tu propósito</p>
      </div>
    </div>
  );
}

/* ────────── Screens 10 & 11 (resultados IA — no modificar el flujo) ────────── */

function Screen5({ ai, onNext }: { ai: AIResult; onNext: () => void }) {
  return (
    <div>
      <p className="text-center text-[12px] tracking-widest font-semibold text-[#7C5CFF] uppercase mt-2">
        Tu patrón principal ✨
      </p>
      <h2 className="text-center font-display font-extrabold text-[30px] mt-3 text-gradient-emotional">
        {ai.pattern_name}
      </h2>

      <div className="mt-6 rounded-[24px] bg-[#F7F8FD] p-5">
        <p className="text-[14px] leading-relaxed text-[#1B1B27]">
          <span className="text-[#7C5CFF] font-bold">“</span>
          {ai.pattern_summary}
          <span className="text-[#7C5CFF] font-bold">”</span>
        </p>
      </div>

      <p className="mt-7 font-display font-semibold text-[15px] text-[#1B1B27]">Cómo afecta hoy</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <ImpactCard icon={<Heart className="w-5 h-5" />} tint="pink" title="Relaciones" text={ai.impact.relaciones} />
        <ImpactCard icon={<DollarSign className="w-5 h-5" />} tint="purple" title="Prosperidad" text={ai.impact.prosperidad} />
        <ImpactCard icon={<Brain className="w-5 h-5" />} tint="blue" title="Emociones" text={ai.impact.emociones} />
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onNext}>Continuar <ArrowRight className="w-4 h-4" /></PrimaryButton>
      </div>
    </div>
  );
}

function ImpactCard({ icon, tint, title, text }: { icon: React.ReactNode; tint: "pink" | "purple" | "blue"; title: string; text: string }) {
  const color = tint === "pink" ? "#F58BCB" : tint === "blue" ? "#61A8FF" : "#7C5CFF";
  const bg = tint === "pink" ? "#FFF1F8" : tint === "blue" ? "#EEF5FF" : "#F1EDFF";
  return (
    <div className="rounded-[20px] bg-white border border-[#ECEEF5] p-3.5 text-center">
      <div className="mx-auto w-10 h-10 rounded-2xl grid place-items-center" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="mt-2 text-[12px] font-semibold" style={{ color }}>{title}</div>
      <p className="mt-1 text-[11px] leading-snug text-[#64667A]">{text}</p>
    </div>
  );
}

function Screen6({ ai, onNext }: { ai: AIResult; onNext: () => void }) {
  return (
    <div>
      <p className="text-[12px] tracking-widest font-semibold text-[#43C78E] uppercase">Lo positivo ♡</p>
      <h2 className="font-display font-extrabold text-[26px] mt-2 text-[#1B1B27]">
        Toda herida también desarrolla fortalezas.
      </h2>
      <p className="text-[14px] text-[#64667A] mt-2">Has aprendido a…</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StrengthCard icon={<Sprout className="w-5 h-5" />} tint="blue" title="Adaptarte" text={ai.strengths.adaptarte} />
        <StrengthCard icon={<Mountain className="w-5 h-5" />} tint="purple" title="Resistir" text={ai.strengths.resistir} />
        <StrengthCard icon={<HandHeart className="w-5 h-5" />} tint="pink" title="Ayudar a otros" text={ai.strengths.ayudar} />
      </div>

      <div className="mt-8 rounded-[24px] bg-[#F7F8FD] p-6">
        <p className="text-[12px] tracking-widest font-semibold text-[#7C5CFF] uppercase">Tu camino ✨</p>
        <h3 className="mt-2 font-display font-bold text-[20px] text-[#1B1B27]">Aquí empieza el verdadero cambio.</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-[#64667A]">
          No prometemos milagros. Te acompañaremos con herramientas prácticas para ayudarte a comprender tu historia,
          fortalecer tu bienestar emocional y avanzar paso a paso hacia una vida con mayor claridad y equilibrio.
        </p>
        <p className="mt-4 text-[13px] italic text-[#7C5CFF]">{ai.welcome_message}</p>
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onNext}>Comenzar mi transformación ✨</PrimaryButton>
      </div>
    </div>
  );
}

function StrengthCard({ icon, tint, title, text }: { icon: React.ReactNode; tint: "pink" | "purple" | "blue"; title: string; text: string }) {
  const color = tint === "pink" ? "#F58BCB" : tint === "blue" ? "#61A8FF" : "#7C5CFF";
  const bg = tint === "pink" ? "#FFF1F8" : tint === "blue" ? "#EEF5FF" : "#F1EDFF";
  return (
    <div className="rounded-[20px] bg-white border border-[#ECEEF5] p-3.5 text-center">
      <div className="mx-auto w-10 h-10 rounded-2xl grid place-items-center" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="mt-2 text-[12px] font-semibold text-[#1B1B27]">{title}</div>
      <p className="mt-1 text-[11px] leading-snug text-[#64667A]">{text}</p>
    </div>
  );
}
