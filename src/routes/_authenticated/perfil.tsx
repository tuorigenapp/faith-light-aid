import { NotificacionesCard } from "@/components/NotificacionesCard";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Flame, Gem, Leaf, Trophy, BookHeart, Sparkles, HeartHandshake, Layers, ChevronRight,
  Calendar, ArrowLeft, Check, Shield, Mail, Heart, User as UserIcon, Globe, Cake,
  Dumbbell, Target, Bell, Lock, PenLine, AlertTriangle,
} from "lucide-react";
import { printMinistracion } from "@/lib/print-pdf";
import { PhotoPicker } from "@/components/PhotoPicker";
import { uploadPhoto, removePhoto } from "@/lib/photo";
import { useSignedUrls } from "@/hooks/use-signed-urls";
import { Switch } from "@/components/ui/switch";
import { wholeHojas } from "@/lib/gems";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil y mi panel — ORIGEN" },
      { name: "description", content: "Completa tu perfil en ORIGEN y entra a tu panel: etapas, ejercicios, racha, diario y ministraciones en un solo lugar." },
      { property: "og:title", content: "Mi perfil y mi panel — ORIGEN" },
      { property: "og:description", content: "Tu espacio sagrado dentro de ORIGEN: perfil, progreso y todo tu proceso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

const INTENTIONS = [
  "Sanar mi autoestima y conectar conmigo",
  "Romper patrones familiares que se repiten",
  "Sanar mi relación de pareja",
  "Encontrar mi propósito y dirección",
  "Prosperidad y abundancia",
  "Paz interior y cercanía con Dios",
];

const TOPICS = [
  { id: "sanacion", label: "Sanación personal", icon: Heart, color: "#7C5CFF" },
  { id: "pareja", label: "Relaciones y pareja", icon: HeartHandshake, color: "#F58BCB" },
  { id: "proposito", label: "Propósito y misión", icon: Sparkles, color: "#61A8FF" },
  { id: "emociones", label: "Emociones y mentalidad", icon: BookHeart, color: "#3FBE8F" },
  { id: "espiritualidad", label: "Espiritualidad", icon: Shield, color: "#7C5CFF" },
  { id: "abundancia", label: "Abundancia y prosperidad", icon: Gem, color: "#F7B955" },
];

const COUNTRIES = ["República Dominicana", "México", "Colombia", "Estados Unidos", "España", "Argentina", "Chile", "Perú", "Venezuela", "Ecuador", "Guatemala", "Puerto Rico", "Otro"];

function PerfilPage() {
  const { user } = useAuth();
  const [forceEdit, setForceEdit] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-24 space-y-3">
        <div className="h-40 rounded-[24px] bg-muted animate-pulse" />
        <div className="h-24 rounded-[24px] bg-muted animate-pulse" />
        <div className="h-24 rounded-[24px] bg-muted animate-pulse" />
      </div>
    );
  }

  if (!profile.profile_completed_at) {
    return <ProfileWizard profile={profile} onDone={() => setForceEdit(false)} blockExit />;
  }
  if (forceEdit) {
    return <EditProfileLimited profile={profile} onDone={() => setForceEdit(false)} />;
  }
  return <ProfilePanel profile={profile} onEdit={() => setForceEdit(true)} />;
}

/* ══════════════════ WIZARD 6 PASOS ══════════════════ */

function ProfileWizard({ profile, onDone, blockExit }: { profile: any; onDone: () => void; blockExit?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const clean = (n?: string | null) => (n && n.trim() && !/^invitado_/i.test(n.trim()) ? n.trim() : "");
  const [form, setForm] = useState({
    display_name: clean(profile.display_name) || clean(profile.full_name),
    full_name: clean(profile.full_name),
    country: profile.country ?? "",
    age: profile.age ? String(profile.age) : "",
    bio: profile.bio ?? "",
    intention: profile.intention ?? "",
    interests: (profile.interests as string[]) ?? [],
    content_pref: profile.content_pref ?? "Notificaciones",
    email: (() => { const e = (profile.email ?? user?.email ?? "").trim(); return /invitado|@temp/i.test(e) ? "" : e; })(),
  });

  const sign = useSignedUrls("avatars", [profile.avatar_url]);
  const currentAvatar = localPreview ?? sign(profile.avatar_url) ?? null;
  const total = 6;

  function toggleTopic(id: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(id) ? f.interests.filter((t: string) => t !== id) : [...f.interests, id],
    }));
  }

  const canNext =
    step === 2 ? !!form.display_name.trim() :
    step === 3 ? !!form.intention :
    true;

  async function finish() {
    if (!user) return;
    if (!form.display_name.trim()) { setStep(2); return toast.error("Dinos cómo quieres que te llamemos"); }
    setSaving(true);
    try {
      let avatar_url = profile.avatar_url as string | null;
      if (photoBlob) {
        await removePhoto("avatars", avatar_url);
        avatar_url = await uploadPhoto("avatars", user.id, photoBlob);
      }
      const emailTrim = form.email.trim();
      if (emailTrim && emailTrim !== (user.email ?? "")) {
        const { error: authErr } = await supabase.auth.updateUser({ email: emailTrim });
        if (authErr) throw authErr;
      }
      const { error } = await supabase.from("profiles").update({
        display_name: form.display_name.trim(),
        full_name: form.full_name.trim() || form.display_name.trim(),
        country: form.country || null,
        age: form.age ? Number(form.age) : null,
        bio: form.bio || null,
        intention: form.intention || null,
        interests: form.interests,
        content_pref: form.content_pref,
        avatar_url,
        email: emailTrim || null,
        profile_completed_at: new Date().toISOString(),
      }).eq("id", user.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries();
      toast.success(`¡Listo, ${form.display_name.split(" ")[0]}! Tu perfil está guardado ✨`);
      onDone();
      setStep(1);
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "No pudimos guardar tu perfil");
    } finally {
      setSaving(false);
    }
  }

  const stepInfo: Record<number, { icon: React.ReactNode; title: string; sub: string; bg: string }> = {
    1: { icon: <Heart className="w-6 h-6 text-white" />, title: "¡Hola! 💜", sub: "Este es tu espacio sagrado dentro de ORIGEN.", bg: "#7C5CFF" },
    2: { icon: <UserIcon className="w-6 h-6 text-white" />, title: "Información básica", sub: "Para conocerte mejor.", bg: "#7C5CFF" },
    3: { icon: <Heart className="w-6 h-6 text-white" />, title: "Sobre tu camino", sub: "Tu historia importa.", bg: "#F58BCB" },
    4: { icon: <Sparkles className="w-6 h-6 text-white" />, title: "Preferencias", sub: "Para acompañarte mejor.", bg: "#9B7CFF" },
    5: { icon: <Lock className="w-6 h-6 text-white" />, title: "Seguridad y contacto", sub: "Protege tu cuenta.", bg: "#61A8FF" },
    6: { icon: <Check className="w-6 h-6 text-white" />, title: "¡Todo listo! ✨", sub: "Revisa tu información y confirma tu perfil.", bg: "#7C5CFF" },
  };
  const info = stepInfo[step];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F4F0FF] via-[#FBFAFF] to-[#EEF6FF]">
      <div className="mx-auto max-w-md px-4 pt-4 pb-28">
        {/* progreso */}
        <div className="flex items-center gap-3">
          {blockExit && step === 1 ? (
            <div className="w-10 h-10" />
          ) : (
            <button
              onClick={() => (step === 1 ? onDone() : setStep(step - 1))}
              aria-label="Volver"
              className="w-10 h-10 rounded-full bg-white shadow-soft grid place-items-center active:scale-95 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <div className="text-center text-[12px] font-bold text-muted-foreground mb-1.5">{step}/{total}</div>
            <div className="flex gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-[#7C5CFF]" : "bg-[#7C5CFF]/15"}`} />
              ))}
            </div>
          </div>
          <div className="w-10" />
        </div>

        <div className="mt-6 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto grid place-items-center shadow-soft" style={{ background: info.bg }}>{info.icon}</div>
          <h1 className="font-display font-black text-[22px] mt-3">{info.title}</h1>
          <p className="text-[13px] text-muted-foreground mt-1">{info.sub}</p>
        </div>

        <div className="mt-5 space-y-4">
          {step === 1 && (
            <div className="rounded-[24px] bg-white shadow-soft p-6 text-center space-y-4">
              <div className="flex justify-center">
                <PhotoPicker
                  value={currentAvatar}
                  size={140}
                  label=""
                  onCropped={(blob, url) => { setPhotoBlob(blob); setLocalPreview(url); }}
                  onRemove={async () => {
                    setPhotoBlob(null); setLocalPreview(null);
                    if (profile.avatar_url && user) {
                      await removePhoto("avatars", profile.avatar_url);
                      await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
                      qc.invalidateQueries({ queryKey: ["profile"] });
                      toast.success("Foto eliminada");
                    }
                  }}
                />
              </div>
              <div>
                <div className="font-display font-bold text-[15px]">Agrega tu foto</div>
                <p className="text-[13px] text-muted-foreground mt-1">Esto nos ayuda a personalizar tu experiencia. Podrás recortarla antes de guardarla.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-[24px] bg-white shadow-soft p-5 space-y-4">
              <div>
                <Label className="text-[13px] font-semibold">¿Cómo quieres que te llamemos?</Label>
                <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Tu nombre" className="mt-1.5 h-12 rounded-[12px]" />
                <p className="text-[11px] text-muted-foreground mt-1">Con este nombre te hablaremos en toda la app.</p>
              </div>
              <div>
                <Label className="text-[13px] font-semibold">Nombre completo</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Escribe tu nombre completo" className="mt-1.5 h-12 rounded-[12px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[13px] font-semibold">País</Label>
                  <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                    <SelectTrigger className="mt-1.5 h-12 rounded-[12px]"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[13px] font-semibold">Edad</Label>
                  <Input type="number" inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Edad" className="mt-1.5 h-12 rounded-[12px]" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-[24px] bg-white shadow-soft p-5 space-y-4">
              <div>
                <Label className="text-[13px] font-semibold">¿Qué buscas sanar o transformar?</Label>
                <Textarea
                  value={form.bio} maxLength={300}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Escribe aquí…" className="mt-1.5 min-h-32 rounded-[12px]"
                />
                <div className="text-right text-[11px] text-muted-foreground">{form.bio.length}/300</div>
              </div>
              <div>
                <Label className="text-[13px] font-semibold">¿Cuál es tu intención principal?</Label>
                <Select value={form.intention} onValueChange={(v) => setForm({ ...form, intention: v })}>
                  <SelectTrigger className="mt-1.5 h-12 rounded-[12px]"><SelectValue placeholder="Selecciona tu intención" /></SelectTrigger>
                  <SelectContent>{INTENTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="rounded-2xl bg-[#F1ECFF] p-4 flex gap-3">
                <span className="w-10 h-10 rounded-xl bg-white grid place-items-center shrink-0"><Sparkles className="w-5 h-5 text-[#7C5CFF]" /></span>
                <p className="text-[13px] text-foreground/80 leading-snug">Tu intención es la brújula que guía tu transformación.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="rounded-[24px] bg-white shadow-soft p-5 space-y-4">
              <Label className="text-[13px] font-semibold">¿Qué temas te interesan más?</Label>
              <div className="space-y-2">
                {TOPICS.map(({ id, label, icon: Icon, color }) => {
                  const on = form.interests.includes(id);
                  return (
                    <button
                      key={id} type="button" onClick={() => toggleTopic(id)}
                      className={`w-full h-14 px-3 rounded-[14px] border-2 flex items-center gap-3 transition ${on ? "border-[#7C5CFF] bg-[#7C5CFF]/8" : "border-border bg-white"}`}
                    >
                      <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: `${color}1F` }}>
                        <Icon className="w-4.5 h-4.5" style={{ color }} />
                      </span>
                      <span className="flex-1 text-left text-[14px] font-semibold">{label}</span>
                      <span className={`w-6 h-6 rounded-full grid place-items-center border-2 ${on ? "bg-[#7C5CFF] border-[#7C5CFF]" : "border-border"}`}>
                        {on && <Check className="w-3.5 h-3.5 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div>
                <Label className="text-[13px] font-semibold">¿Cómo prefieres recibir contenido?</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["Notificaciones", "Email", "Ambos"].map((p) => (
                    <button
                      key={p} type="button" onClick={() => setForm({ ...form, content_pref: p })}
                      className={`h-11 rounded-[12px] text-[13px] font-semibold border-2 transition ${form.content_pref === p ? "bg-[#7C5CFF] text-white border-[#7C5CFF]" : "border-border bg-white text-foreground/70"}`}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="rounded-[24px] bg-white shadow-soft p-5 space-y-4">
              <div>
                <Label className="text-[13px] font-semibold">Correo electrónico</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tucorreo@ejemplo.com" className="mt-1.5 h-12 rounded-[12px]" />
                {!form.email && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[#B77B12] font-semibold"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Agrega tu correo real para poder contactarte y proteger tu cuenta.</p>
                )}
              </div>
              <ChangePassword />
              <div className="rounded-2xl bg-[#EAF3FF] p-4 flex gap-3">
                <span className="w-10 h-10 rounded-xl bg-white grid place-items-center shrink-0"><Shield className="w-5 h-5 text-[#61A8FF]" /></span>
                <p className="text-[13px] text-foreground/80 leading-snug">Tu información está segura con nosotros y tu proceso es 100% confidencial.</p>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-white shadow-soft p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-display font-bold text-[15px]">Resumen de tu perfil</div>
                  <button onClick={() => setStep(2)} className="text-[12px] font-bold text-[#7C5CFF]">Editar</button>
                </div>
                <div className="space-y-3">
                  <SummaryRow icon={<UserIcon className="w-4 h-4" />} label="Nombre" value={form.display_name || "—"} />
                  <SummaryRow icon={<Globe className="w-4 h-4" />} label="País" value={form.country || "—"} />
                  <SummaryRow icon={<Cake className="w-4 h-4" />} label="Edad" value={form.age ? `${form.age} años` : "—"} />
                  <SummaryRow icon={<Heart className="w-4 h-4" />} label="Intención" value={form.intention || "—"} />
                  <SummaryRow icon={<Mail className="w-4 h-4" />} label="Correo" value={form.email || "—"} />
                </div>
              </div>
              <div className="rounded-[20px] bg-[#FDEFF7] p-4 flex gap-3">
                <span className="w-10 h-10 rounded-xl bg-white grid place-items-center shrink-0"><Heart className="w-5 h-5 text-[#F58BCB]" /></span>
                <p className="text-[13px] text-[#7C5CFF] leading-snug font-medium">Gracias por confiar en ORIGEN, {form.display_name.split(" ")[0] || "amig@"}. Este es el inicio de tu transformación.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-2">
          {step < total ? (
            <Button
              onClick={() => canNext ? setStep(step + 1) : toast.error("Completa este paso para continuar")}
              className="w-full h-14 rounded-[14px] btn-primary-gradient text-[16px] font-bold"
            >
              Continuar
            </Button>
          ) : (
            <>
              <Button onClick={finish} disabled={saving} className="w-full h-14 rounded-[14px] btn-primary-gradient text-[16px] font-bold">
                {saving ? "Guardando…" : "Confirmar mi perfil"}
              </Button>
              <button onClick={() => setStep(1)} className="w-full text-[13px] font-semibold text-[#7C5CFF] py-2">Volver y editar</button>
            </>
          )}
        </div>

        <div className="mt-6 rounded-[20px] bg-white/70 border border-border p-4 grid gap-3">
          <PrivacyNote icon={<Shield className="w-4 h-4 text-[#7C5CFF]" />} title="Tu privacidad es importante" text="Cuidamos tu información y tu proceso es 100% confidencial." />
          <PrivacyNote icon={<Lock className="w-4 h-4 text-[#61A8FF]" />} title="Información protegida" text="Tus datos están encriptados y seguros." />
          <PrivacyNote icon={<UserIcon className="w-4 h-4 text-[#9B7CFF]" />} title="Tú tienes el control" text="Puedes editar tu información cuando quieras." />
        </div>
      </div>
    </div>
  );
}

function EditProfileLimited({ profile, onDone }: { profile: any; onDone: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const isTemp = (e?: string | null) => !e || /invitado|@temp/i.test(e);
  const [email, setEmail] = useState(isTemp(profile.email ?? user?.email) ? "" : (profile.email ?? user?.email ?? ""));
  const [saving, setSaving] = useState(false);
  const sign = useSignedUrls("avatars", [profile.avatar_url]);
  const currentAvatar = localPreview ?? sign(profile.avatar_url) ?? null;

  const LOCKED_FIELDS: { label: string; value: string }[] = [
    { label: "Nombre para hablarte", value: profile.display_name || "—" },
    { label: "Nombre completo", value: profile.full_name || "—" },
    { label: "País", value: profile.country || "—" },
    { label: "Edad", value: profile.age ? `${profile.age} años` : "—" },
    { label: "Intención principal", value: profile.intention || "—" },
    { label: "¿Qué buscas sanar?", value: profile.bio || "—" },
  ];

  async function save() {
    if (!user) return;
    const emailTrim = email.trim();
    setSaving(true);
    try {
      let avatar_url = profile.avatar_url as string | null;
      if (photoBlob) {
        await removePhoto("avatars", avatar_url);
        avatar_url = await uploadPhoto("avatars", user.id, photoBlob);
      }
      if (emailTrim && emailTrim !== (user.email ?? "")) {
        const { error: authErr } = await supabase.auth.updateUser({ email: emailTrim });
        if (authErr) throw authErr;
      }
      const { error } = await supabase.from("profiles").update({
        avatar_url,
        email: emailTrim || null,
      }).eq("id", user.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries();
      toast.success("Perfil actualizado");
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? "No pudimos guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F4F0FF] via-[#FBFAFF] to-[#EEF6FF]">
      <div className="mx-auto max-w-md px-4 pt-4 pb-28">
        <div className="flex items-center gap-3">
          <button onClick={onDone} aria-label="Volver" className="w-10 h-10 rounded-full bg-white shadow-soft grid place-items-center active:scale-95 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center font-display font-black text-[18px] pr-10">Editar perfil</h1>
        </div>

        <div className="mt-5 rounded-[24px] bg-white shadow-soft p-6 text-center space-y-4">
          <div className="flex justify-center">
            <PhotoPicker
              value={currentAvatar}
              size={120}
              label=""
              onCropped={(blob, url) => { setPhotoBlob(blob); setLocalPreview(url); }}
              onRemove={async () => {
                setPhotoBlob(null); setLocalPreview(null);
                if (profile.avatar_url && user) {
                  await removePhoto("avatars", profile.avatar_url);
                  await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
                  qc.invalidateQueries({ queryKey: ["profile"] });
                  toast.success("Foto eliminada");
                }
              }}
            />
          </div>
          <p className="text-[13px] text-muted-foreground">Foto de perfil</p>
        </div>

        <div className="mt-4 rounded-[24px] bg-white shadow-soft p-5 space-y-4">
          <div>
            <Label className="text-[13px] font-semibold">Correo electrónico</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" className="mt-1.5 h-12 rounded-[12px]" />
            {!email && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[#B77B12] font-semibold"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Agrega tu correo real para poder contactarte.</p>
            )}
          </div>
          <ChangePassword />
        </div>

        <div className="mt-4 rounded-[24px] bg-white shadow-soft p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <div className="font-display font-bold text-[14px]">Datos que no se pueden cambiar</div>
          </div>
          {LOCKED_FIELDS.map((f) => (
            <div key={f.label} className="rounded-[12px] bg-muted/50 border border-border p-3 opacity-70">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.label}</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="text-[13px] font-semibold mt-0.5">{f.value}</div>
              <div className="text-[10.5px] text-muted-foreground mt-1">Este dato no se puede cambiar</div>
            </div>
          ))}
        </div>

        <Button onClick={save} disabled={saving} className="mt-5 w-full h-14 rounded-[14px] btn-primary-gradient text-[16px] font-bold">
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

function ChangePassword() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = pw.length >= 12 ? "Fuerte" : pw.length >= 8 ? "Media" : pw ? "Débil" : "";

  async function save() {
    if (pw.length < 8) return toast.error("Usa al menos 8 caracteres");
    if (pw !== pw2) return toast.error("Las contraseñas no coinciden");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPw(""); setPw2("");
    toast.success("Contraseña actualizada");
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-[13px] font-semibold">Nueva contraseña</Label>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" className="mt-1.5 h-12 rounded-[12px]" />
        {strength && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${strength === "Fuerte" ? "w-full bg-[#3FBE8F]" : strength === "Media" ? "w-2/3 bg-[#F7B955]" : "w-1/3 bg-[#F5566B]"}`} />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">{strength}</span>
          </div>
        )}
      </div>
      <div>
        <Label className="text-[13px] font-semibold">Confirmar contraseña</Label>
        <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" className="mt-1.5 h-12 rounded-[12px]" />
      </div>
      {pw && (
        <Button onClick={save} disabled={busy} variant="outline" className="w-full h-11 rounded-[12px]">
          {busy ? "Actualizando…" : "Actualizar contraseña"}
        </Button>
      )}
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-lg bg-[#F1ECFF] text-[#7C5CFF] grid place-items-center shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-[13px] font-semibold break-words">{value}</div>
      </div>
    </div>
  );
}

function PrivacyNote({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-9 h-9 rounded-xl bg-white shadow-soft grid place-items-center shrink-0">{icon}</span>
      <div>
        <div className="text-[13px] font-bold text-[#7C5CFF]">{title}</div>
        <p className="text-[12px] text-muted-foreground leading-snug">{text}</p>
      </div>
    </div>
  );
}

/* ══════════════════ PANEL DEL USUARIO ══════════════════ */

const MESSAGES = [
  "No necesitas pedir permiso para ser quien Dios te creó. Tu propósito no espera aprobación.",
  "Lo que sanas en ti, deja de heredarse en los tuyos.",
  "Hoy no tienes que poder con todo: solo con el siguiente paso.",
  "Tu historia no te define, tu decisión de sanar sí.",
  "La paz también se practica. Empieza hoy con cinco minutos.",
];

function ProfilePanel({ profile, onEdit }: { profile: any; onEdit: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const sign = useSignedUrls("avatars", [profile.avatar_url]);
  const avatar = sign(profile.avatar_url);
  const realName = [profile.display_name, profile.full_name].find(
    (n: string | null) => n && n.trim() && !/^invitado_/i.test(n.trim()),
  ) as string | undefined;
  const name = (realName || "").split(" ")[0] || "amig@";
  const initials = useMemo(() => (realName || "O").slice(0, 1).toUpperCase(), [realName]);

  const { data: stats } = useQuery({
    queryKey: ["perfil-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [ex, jr, min, par, fam, act] = await Promise.all([
        supabase.from("exercise_completions").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("ministracion_lecturas").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("pareja_lecturas").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("family_members").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("daily_activity").select("activity_date").eq("user_id", user!.id).order("activity_date", { ascending: false }).limit(365),
      ]);
      const days = new Set((act.data ?? []).map((r: any) => r.activity_date));
      return {
        exercises: ex.count ?? 0,
        journals: jr.count ?? 0,
        ministraciones: min.count ?? 0,
        parejas: par.count ?? 0,
        familiares: fam.count ?? 0,
        activeDays: days.size,
      };
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages-list"],
    queryFn: async () => (await supabase.from("stages").select("id, title, subtitle").order("id")).data ?? [],
  });
  const { data: progress = [] } = useQuery({
    queryKey: ["stage-progress", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("stage_progress").select("stage_id, status, completed_at").eq("user_id", user!.id)).data ?? [],
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
  const { data: stageRewards = [] } = useQuery({
    queryKey: ["stage-rewards", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("stage_rewards").select("stage_id, xp, leaves, insignia").eq("user_id", user!.id)).data ?? [],
  });
  const { data: recentJournal } = useQuery({
    queryKey: ["journal-recent", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("journal_entries").select("id,title,content,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(3)).data ?? [],
  });

  const totalStages = Math.max(8, stages.length || 8);
  const currentStage = profile.current_stage ?? 1;
  const completed = progress.filter((p: any) => p.status === "completed").length;
  const pct = Math.round((completed / totalStages) * 100) || Math.round(((currentStage - 1) / totalStages) * 100);
  const message = MESSAGES[new Date().getDate() % MESSAGES.length];
  const totalXp = stageRewards.reduce((a: number, r: any) => a + (r.xp ?? 0), 0);
  const insignias = Array.from(new Set(stageRewards.map((r: any) => r.insignia).filter(Boolean))) as string[];

  function downloadMinistracion(m: any) {
    printMinistracion({
      title: m.headline ?? "Lo que Dios te dijo",
      subtitle: m.question ? `Consulta: ${m.question}` : undefined,
      meta: new Date(m.created_at).toLocaleString("es", { dateStyle: "long", timeStyle: "short" }),
      sections: [
        { emoji: "⚖️", title: "Dictamen de la Corte Celestial", body: m.dictamen ?? "" },
        { emoji: "⏳", title: "Línea de tiempo", body: m.linea_tiempo ?? "" },
        { emoji: "🕊️", title: "Señales de confirmación", body: (Array.isArray(m.senales) ? m.senales : []).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n") },
        { emoji: "💫", title: "Ministración para tu vida", body: m.ministracion ?? "" },
        ...(m.rompe_ciclo ? [{ emoji: "⛓️‍💥", title: "Consejo del Cielo: Rompe el ciclo", body: m.rompe_ciclo }] : []),
        ...(m.versiculo ? [{ emoji: "📖", title: "Palabra que respalda el decreto", body: m.versiculo }] : []),
      ],
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-aura-top">
      <div className="mx-auto max-w-2xl lg:max-w-5xl px-4 pt-5 pb-24 space-y-4">
        {/* HERO */}
        <div className="rounded-[24px] p-5 bg-brand-gradient text-white shadow-[0_20px_50px_-20px_rgba(124,92,255,0.6)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur grid place-items-center overflow-hidden text-2xl font-bold ring-2 ring-white/40 shrink-0">
                {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="min-w-0">
                <div className="text-xl font-display font-black truncate">¡Hola, {name}! 👋</div>
                <div className="text-[12px] opacity-90">Bienvenid@ a tu espacio sagrado</div>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 rounded-full px-2.5 py-1">
                  Nivel: {profile.spiritual_level ?? "inicial"} 🌱
                </div>
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className="text-lg font-black leading-none">{currentStage} / {totalStages}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-85 mt-1">Etapa actual</div>
              <div className="text-2xl font-black mt-1">{pct}%</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat icon={<Calendar className="w-3.5 h-3.5" />} label="Días activos" value={stats?.activeDays ?? 0} />
            <MiniStat icon={<Flame className="w-3.5 h-3.5" />} label="Racha" value={`${profile.consecutive_days ?? 0}d`} />
            <MiniStat icon={<Leaf className="w-3.5 h-3.5" />} label="Hojas" value={wholeHojas(profile.gems)} />
          </div>
          <button onClick={onEdit} className="mt-4 w-full h-11 rounded-[14px] bg-white/20 backdrop-blur text-white font-bold text-[14px] active:scale-[.98] transition">
            Editar mi perfil
          </button>
        </div>

        {/* XP E INSIGNIAS */}
        <Card className="rounded-[20px] p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Mi camino ORIGEN</div>
              <p className="font-display font-black text-[20px] leading-tight mt-1">{totalXp} XP · {insignias.length} insignias</p>
              <p className="text-[12.5px] text-muted-foreground mt-1">Ganados al completar tus etapas.</p>
            </div>
            <span className="shrink-0 w-12 h-12 rounded-[16px] bg-gold/12 grid place-items-center">
              <Trophy className="w-6 h-6 text-gold" />
            </span>
          </div>
          {insignias.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {insignias.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1.5 text-[12px] font-bold text-primary">
                  <Trophy className="w-3.5 h-3.5" /> {b}
                </span>
              ))}
            </div>
          ) : (
            <Link to="/etapas" className="mt-3 block">
              <Button className="h-11 w-full rounded-[12px] text-[14px] font-semibold">Ir a mi camino y ganar mi primera insignia</Button>
            </Link>
          )}
        </Card>

        {/* RESUMEN RÁPIDO */}
        <div>
          <h2 className="font-display font-bold text-[15px] mb-2">Resumen rápido</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickStat color="#7C5CFF" icon={<Layers className="w-4 h-4" />} value={`${currentStage} / ${totalStages}`} label="Etapa actual" />
            <QuickStat color="#F58BCB" icon={<Dumbbell className="w-4 h-4" />} value={stats?.exercises ?? 0} label="Ejercicios" />
            <QuickStat color="#F7B955" icon={<Flame className="w-4 h-4" />} value={`${profile.consecutive_days ?? 0} días`} label="Racha actual" />
            <QuickStat color="#61A8FF" icon={<Sparkles className="w-4 h-4" />} value={stats?.ministraciones ?? 0} label="Ministraciones" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* PROGRESO */}
          <Card className="p-5">
            <div className="text-[13px] font-bold text-primary">Tu progreso</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">Camino de transformación</div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-brand-gradient transition-all duration-700" style={{ width: `${Math.max(4, pct)}%` }} />
              </div>
              <span className="text-[13px] font-black text-primary">{pct}%</span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-2">Sigue así, {name}. Cada paso cuenta.</p>
            <Link to="/etapas" className="mt-4 inline-flex items-center justify-center h-11 px-5 rounded-[12px] btn-primary-gradient text-white font-bold text-[13px]">
              Ver mi camino →
            </Link>
          </Card>

          {/* DIARIO */}
          <Card className="p-5">
            <div className="text-[13px] font-bold text-primary">Diario íntimo</div>
            <div className="font-display font-bold text-[16px] mt-1">Escribe en tu diario íntimo</div>
            <p className="text-[12px] text-muted-foreground mt-1">Conectar contigo es el primer paso.</p>
            {recentJournal && recentJournal.length > 0 ? (
              <div className="space-y-2 mt-3">
                {recentJournal.map((j: any) => (
                  <div key={j.id} className="rounded-2xl border border-border p-3">
                    <div className="text-[10px] text-muted-foreground">{new Date(j.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}</div>
                    <div className="font-semibold text-[13px] mt-0.5 line-clamp-1">{j.title || "Sin título"}</div>
                    <div className="text-[12px] text-muted-foreground line-clamp-2">{j.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground mt-3">Tu diario te espera con la hoja en blanco.</p>
            )}
            <Link to="/diario" className="mt-3 inline-flex items-center gap-1 h-11 px-5 rounded-[12px] border-2 border-primary text-primary font-bold text-[13px]">
              <PenLine className="w-4 h-4" /> Escribir ahora
            </Link>
          </Card>
        </div>

        {/* HISTORIAL DE ETAPAS */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-[16px]">Historial de cada etapa</h2>
            <Link to="/etapas" className="text-[12px] font-bold text-primary">Ver todo</Link>
          </div>
          <div className="space-y-2">
            {(stages.length ? stages : Array.from({ length: 8 }, (_, i) => ({ id: i + 1, title: `Etapa ${i + 1}`, subtitle: "" }))).map((s: any) => {
              const p = progress.find((x: any) => x.stage_id === s.id);
              const state = p?.status === "completed" ? "Completada" : s.id === currentStage ? "En progreso" : "Pendiente";
              const color = state === "Completada" ? "#3FBE8F" : state === "En progreso" ? "#7C5CFF" : "#9AA0AE";
              return (
                <Link key={s.id} to="/etapas" className="flex items-center gap-3 rounded-2xl border border-border p-3 active:scale-[.99] transition">
                  <span className="w-8 h-8 rounded-full grid place-items-center text-white text-[12px] font-black shrink-0" style={{ background: color }}>{s.id}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold truncate">Etapa {s.id}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{s.title}</div>
                  </div>
                  <span className="text-[11px] font-bold shrink-0" style={{ color }}>{state}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        </Card>

        {/* MENSAJE PARA TI HOY */}
        <div className="rounded-[24px] p-6 text-center bg-gradient-to-br from-[#F1ECFF] to-[#FDEFF7] border border-border">
          <div className="text-[13px] font-bold text-primary">Mensaje para ti hoy</div>
          <p className="font-display text-[15px] leading-snug mt-2">"{message}"</p>
          <Heart className="w-6 h-6 text-[#F58BCB] mx-auto mt-3" />
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div>
          <h2 className="font-display font-bold text-[15px] mb-2">Accesos rápidos</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard color="#7C5CFF" icon={<Sparkles className="w-4 h-4" />} label="Ministración" value={stats?.ministraciones ?? 0} to="/ministracion" />
            <MetricCard color="#F58BCB" icon={<Dumbbell className="w-4 h-4" />} label="Ejercicios" value={stats?.exercises ?? 0} to="/ejercicios" />
            <MetricCard color="#5AA9FF" icon={<BookHeart className="w-4 h-4" />} label="Diario" value={stats?.journals ?? 0} to="/diario" />
            <MetricCard color="#3FBE8F" icon={<HeartHandshake className="w-4 h-4" />} label="Lecturas de pareja" value={stats?.parejas ?? 0} to="/pareja" />
            <MetricCard color="#F7B955" icon={<Trophy className="w-4 h-4" />} label="Hojas" value={wholeHojas(profile.gems)} to="/premios" />
            <MetricCard color="#E05A6B" icon={<Target className="w-4 h-4" />} label="Familiares" value={stats?.familiares ?? 0} to="/arbol" />
          </div>
        </div>

        {/* HISTORIAL MINISTRACIONES */}
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
              {ministraciones.map((m: any) => (
                <div key={m.id} className="rounded-2xl border border-border p-3">
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

        {/* HISTORIAL PAREJA */}
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
              {parejaHist.map((p: any) => (
                <div key={p.id} className="rounded-2xl border border-border p-3">
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

        {/* NOTIFICACIONES */}
        <NotificationsBlock />

        <div className="rounded-[20px] border border-border bg-white/70 p-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#F1ECFF] grid place-items-center shrink-0"><Bell className="w-5 h-5 text-[#7C5CFF]" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold">Prefieres recibir contenido por: {profile.content_pref ?? "Notificaciones"}</div>
            <p className="text-[12px] text-muted-foreground">Puedes cambiarlo cuando quieras desde “Editar mi perfil”.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsBlock() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification_prefs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notification_prefs").select("email_enabled, push_enabled").eq("user_id", user!.id).maybeSingle();
      return data ?? { email_enabled: true, push_enabled: true };
    },
  });

  async function update(patch: Partial<{ email_enabled: boolean; push_enabled: boolean }>) {
    if (!user) return;
    const next = { email_enabled: prefs?.email_enabled ?? true, push_enabled: prefs?.push_enabled ?? true, ...patch };
    qc.setQueryData(["notification_prefs", user.id], next);
    const { error } = await supabase.from("notification_prefs").upsert({ user_id: user.id, ...next });
    if (error) toast.error("No pudimos guardar tu preferencia");
    else qc.invalidateQueries({ queryKey: ["notification_prefs"] });
  }

  useEffect(() => {
    if (!user || !prefs?.push_enabled) return;
    const key = `push_lesson_${user.id}_${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(key)) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase
        .from("daily_activity")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("activity_type", "camino_dia")
        .eq("activity_date", today);
      if ((count ?? 0) > 0) {
        localStorage.setItem(key, "1");
        toast("Tu lección de hoy ya está desbloqueada", {
          description: "Continúa tu camino de sanación.",
          action: { label: "Ir a etapas", onClick: () => { window.location.href = "/etapas"; } },
        });
      }
    })();
  }, [user, prefs?.push_enabled]);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-9 h-9 rounded-xl bg-[#F1ECFF] grid place-items-center shrink-0"><Bell className="w-4 h-4 text-[#7C5CFF]" /></span>
        <h2 className="font-display font-bold text-[15px]">Notificaciones</h2>
      </div>
      {isLoading ? (
        <div className="h-16 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-border p-3">
            <div>
              <div className="text-[13px] font-semibold">Correo electrónico</div>
              <div className="text-[11.5px] text-muted-foreground">Recibe novedades y avisos por correo.</div>
            </div>
            <Switch checked={prefs?.email_enabled ?? true} onCheckedChange={(v) => update({ email_enabled: v })} />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border p-3">
            <div>
              <div className="text-[13px] font-semibold">Avisos dentro de la app</div>
              <div className="text-[11.5px] text-muted-foreground">Muestra avisos emergentes cuando algo nuevo se desbloquea.</div>
            </div>
            <Switch checked={prefs?.push_enabled ?? true} onCheckedChange={(v) => update({ push_enabled: v })} />
          </div>
          <NotificacionesCard />
        </div>
      )}
    </Card>

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

function QuickStat({ color, icon, value, label }: { color: string; icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-white border border-border shadow-soft p-4 text-center">
      <div className="w-10 h-10 rounded-xl mx-auto grid place-items-center" style={{ background: `${color}1F`, color }}>{icon}</div>
      <div className="text-xl font-black font-display mt-2">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
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
