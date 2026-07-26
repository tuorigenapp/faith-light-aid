import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Info, Trophy, Sparkles, User as UserIcon, ChevronRight } from "lucide-react";
import { awardGems, GEM_REWARDS } from "@/lib/gems";
import { toast } from "sonner";
import { PhotoPicker } from "@/components/PhotoPicker";
import { uploadPhoto } from "@/lib/photo";
import { useSignedUrls } from "@/hooks/use-signed-urls";
import arbolGemas from "@/assets/arbol-gemas.png.asset.json";
import arbolMini from "@/assets/arbol-mini.png.asset.json";


export const Route = createFileRoute("/_authenticated/arbol")({
  head: () => ({ meta: [{ title: "Mi Árbol Genealógico — ORIGEN" }] }),
  component: TreePage,
});

type View = "home" | "tree" | "add";

const RELATIONSHIPS_MATERNO = ["Madre", "Abuela materna", "Abuelo materno", "Bisabuela materna", "Bisabuelo materno", "Tía materna", "Tío materno", "Hermana", "Hermano", "Hija", "Hijo", "Otra"];
const RELATIONSHIPS_PATERNO = ["Padre", "Abuela paterna", "Abuelo paterno", "Bisabuela paterna", "Bisabuelo paterno", "Tía paterna", "Tío paterno", "Hermana", "Hermano", "Hija", "Hijo", "Otro"];

function TreePage() {
  const [view, setView] = useState<View>("home");
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile-arbol", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, full_name, gems, avatar_url").eq("id", user!.id).maybeSingle();
      return data;
    },
    refetchInterval: 20000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["family_members", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("family_members").select("id, full_name, relationship, lineage, photo_url").eq("user_id", user!.id).order("created_at");
      return data ?? [];
    },
  });

  const displayName = (profile?.display_name || profile?.full_name || "Amigo").split(" ")[0];
  const gems = profile?.gems ?? 0;
  const signFamily = useSignedUrls("family-photos", members.map((m) => m.photo_url));
  const signAvatar = useSignedUrls("avatars", [profile?.avatar_url]);
  const avatarUrl = signAvatar(profile?.avatar_url) ?? null;
  const membersSigned = members.map((m) => ({ ...m, photo_url: signFamily(m.photo_url) ?? null }));

  if (view === "add") return <AddFamilyView onBack={() => setView("tree")} />;
  if (view === "tree") return <TreeDetailView onBack={() => setView("home")} onAdd={() => setView("add")} members={membersSigned} gems={gems} displayName={displayName} avatar={avatarUrl} />;

  return <HomeView displayName={displayName} avatar={avatarUrl} gems={gems} onOpenTree={() => setView("tree")} />;

}

/* ═══════════════════════ VIEW 1 · HOME (imagen #1) ═══════════════════════ */

function HomeView({ displayName, avatar, gems, onOpenTree }: { displayName: string; avatar: string | null; gems: number; onOpenTree: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F1ECFF] via-[#FBFAFF] to-[#E8F4FF]">
      <div className="max-w-md mx-auto px-4 pt-4 pb-32 space-y-4">
        {/* Header card — user + gems */}
        <div className="rounded-[24px] bg-white border-[3px] border-[#3FBE8F] shadow-soft p-3 flex items-center gap-3">
          <div className="relative shrink-0">
            {avatar ? (
              <img src={avatar} alt="" className="w-14 h-14 rounded-full object-cover ring-4 ring-[#3FBE8F]/25" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-gradient text-white grid place-items-center font-display font-bold text-lg ring-4 ring-[#3FBE8F]/25">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[15px] leading-tight">Hola, {displayName}</div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-primary">
              <span className="text-[22px] leading-none">💎</span>
              <span className="font-display font-black text-[22px] leading-none">{gems.toLocaleString()}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Gemas de Sanación</div>
          </div>
          <Link to="/premios" className="relative w-11 h-11 rounded-full bg-[#F1ECFF] grid place-items-center text-primary" aria-label="Notificaciones">
            <span className="text-xl">🔔</span>
            <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F5566B] text-white text-[10px] font-black grid place-items-center border-2 border-white">3</span>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center pt-2">
          <h1 className="font-display font-black text-[26px] leading-tight text-foreground">Tu Árbol Genealógico</h1>
          <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-[300px] mx-auto">
            Cada familiar agregado fortalece tu sanación y rompe cadenas generacionales.
          </p>
        </div>

        {/* Tree PNG */}
        <button onClick={onOpenTree} className="block w-full mt-2 focus:outline-none active:scale-[0.98] transition-transform" aria-label="Ver mi árbol">
          <div className="relative aspect-[3/4] w-full max-w-[340px] mx-auto">
            <div className="absolute inset-x-0 bottom-6 h-24 bg-[#3FBE8F]/25 blur-3xl rounded-full" />
            <img src={arbolGemas.url} alt="Árbol Genealógico con Gemas" className="relative w-full h-full object-contain animate-[float_6s_ease-in-out_infinite]" />
          </div>
        </button>

        {/* Main CTA */}
        <button
          onClick={onOpenTree}
          className="w-full h-14 rounded-[18px] bg-gradient-to-b from-[#4CD394] to-[#2FA574] text-white font-display font-black text-[17px] shadow-[0_8px_24px_rgba(63,190,143,0.4)] active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-2"
        >
          <span className="text-xl">🌳</span> Ver mi árbol
        </button>

        {/* Secondary actions */}
        <Link
          to="/premios"
          className="w-full h-14 rounded-[18px] bg-white border-2 border-[#F1ECFF] font-display font-black text-[15px] shadow-soft active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-2"
        >
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F7B955] to-[#E89A2E] grid place-items-center text-white text-sm">🏅</span>
          Canjear Puntos Acumulados
        </Link>
        <Link
          to="/premios"
          className="w-full h-14 rounded-[18px] bg-white border-2 border-[#F1ECFF] font-display font-black text-[15px] shadow-soft active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-2"
        >
          Premios <Trophy className="w-4 h-4 text-[#F7B955]" />
        </Link>

        {/* Patrones nudge */}
        <Link
          to="/patrones"
          className="mt-2 block rounded-[18px] p-4 bg-gradient-to-r from-[#7C5CFF] to-[#F58BCB] text-white shadow-glow active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 grid place-items-center backdrop-blur">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-90">Nuevo</div>
              <div className="font-display font-black text-[15px] leading-tight">Analiza tus patrones familiares</div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </Link>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}

/* ═══════════════════════ VIEW 2 · TREE DETAIL (imagen #2) ═══════════════════════ */

type Member = { id: string; full_name: string; relationship: string; lineage: string; photo_url?: string | null };

function TreeDetailView({
  onBack, onAdd, members, gems, displayName, avatar,
}: { onBack: () => void; onAdd: () => void; members: Member[]; gems: number; displayName: string; avatar: string | null }) {
  const materno = members.filter((m) => m.lineage === "materno");
  const paterno = members.filter((m) => m.lineage === "paterno");
  const gemsFromMembers = members.length * GEM_REWARDS.familyMember;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F1ECFF] via-[#FBFAFF] to-[#E8F4FF]">
      <div className="max-w-md mx-auto px-4 pt-4 pb-32">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={onBack} aria-label="Volver" className="w-10 h-10 rounded-full bg-white shadow-soft grid place-items-center active:scale-95 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-black text-[18px]">Mi Árbol Genealógico</h1>
          <button aria-label="Información" className="w-10 h-10 rounded-full bg-white shadow-soft grid place-items-center text-primary">
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Stats banner */}
        <div className="mt-4 rounded-[20px] bg-gradient-to-br from-[#1B1930] via-[#2B2450] to-[#1B1930] text-white p-4 shadow-elev flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[11px] text-white/70 font-semibold">Familiares agregados</div>
            <div className="mt-1 font-display font-black text-[26px] leading-none">
              {members.length} <span className="text-white/50 font-bold text-[16px]">/ 50</span>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur rounded-2xl px-3 py-1.5">
              <span className="text-lg">💎</span>
              <span className="font-display font-black text-lg leading-none">+{gemsFromMembers.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-white/70 font-semibold mt-1">Gemas obtenidas</div>
          </div>
        </div>

        {/* Tree diagram */}
        <div className="mt-8 relative">
          {/* YO node */}
          <div className="flex flex-col items-center relative">
            <PersonNode color="#3FBE8F" avatar={avatar} label="Yo" name={displayName} initial={displayName.slice(0, 1).toUpperCase()} />
            {/* Vertical trunk down */}
            <div className="w-0.5 h-8 bg-gradient-to-b from-[#3FBE8F] to-[#7C5CFF]/40" />
            {/* Horizontal branch */}
            <div className="relative w-[70%] max-w-[280px]">
              <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-[#F58BCB] via-[#7C5CFF]/40 to-[#5AA9FF]" />
              <div className="absolute left-[calc(25%-1px)] top-0 h-8 w-0.5 bg-[#F58BCB]" />
              <div className="absolute right-[calc(25%-1px)] top-0 h-8 w-0.5 bg-[#5AA9FF]" />
            </div>
          </div>

          {/* Two lineage columns */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <LineageColumn
              title="Linaje Materno"
              titleColor="text-[#D14E9E]"
              nodeColor="#F58BCB"
              lineColor="#F58BCB"
              members={materno}
              onAdd={onAdd}
            />
            <LineageColumn
              title="Linaje Paterno"
              titleColor="text-[#4A90E2]"
              nodeColor="#5AA9FF"
              lineColor="#5AA9FF"
              members={paterno}
              onAdd={onAdd}
            />
          </div>
        </div>

        {/* Add button (sticky bottom) */}
        <div className="fixed bottom-0 inset-x-0 z-30 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+80px)] bg-gradient-to-t from-[#F1ECFF] via-[#F1ECFF] to-transparent">
          <div className="max-w-md mx-auto">
            <button
              onClick={onAdd}
              className="w-full h-14 rounded-[18px] bg-gradient-to-b from-[#4CD394] to-[#2FA574] text-white font-display font-black text-[16px] shadow-[0_8px_24px_rgba(63,190,143,0.45)] active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Agregar Familiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonNode({ color, avatar, label, name, initial }: { color: string; avatar?: string | null; label: string; name?: string; initial: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className="w-16 h-16 rounded-full grid place-items-center text-white shadow-soft"
          style={{ background: `radial-gradient(circle at 30% 30%, ${color}, ${color}CC)`, border: `3px solid ${color}` }}
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <UserIcon className="w-8 h-8" fill="currentColor" />
          )}
        </div>
      </div>
      <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-white shadow-soft text-[11px] font-black" style={{ color }}>
        {label}
      </div>
      {name && <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[80px]">{name}</div>}
    </div>
  );
}

function LineageColumn({
  title, titleColor, nodeColor, lineColor, members, onAdd,
}: { title: string; titleColor: string; nodeColor: string; lineColor: string; members: Member[]; onAdd: () => void }) {
  // Show first 2 members in row + 1 below, else empty placeholders
  const slot1 = members[0];
  const slot2 = members[1];
  const slot3 = members[2];

  return (
    <div className="flex flex-col items-center relative">
      <PersonNode color={nodeColor} label={title.split(" ")[1]} initial={title.slice(0, 1)} />
      <div className={`text-[11px] font-black mt-1 text-center leading-tight ${titleColor}`}>{title}</div>

      {/* Connectors down */}
      <div className="w-0.5 h-6 mt-1" style={{ background: lineColor }} />

      {/* Row of 2 slots */}
      <div className="relative w-full flex justify-center">
        <div className="absolute top-0 left-[20%] right-[20%] h-0.5" style={{ background: lineColor }} />
        <div className="absolute top-0 left-[20%] w-0.5 h-4" style={{ background: lineColor }} />
        <div className="absolute top-0 right-[20%] w-0.5 h-4" style={{ background: lineColor }} />
        <div className="grid grid-cols-2 gap-2 pt-4 w-full">
          <SlotOrPerson member={slot1} color={nodeColor} onAdd={onAdd} />
          <SlotOrPerson member={slot2} color={nodeColor} onAdd={onAdd} />
        </div>
      </div>

      {/* One deeper */}
      <div className="w-0.5 h-6" style={{ background: lineColor }} />
      <SlotOrPerson member={slot3} color={nodeColor} onAdd={onAdd} />

      {/* Extra members chip if more */}
      {members.length > 3 && (
        <div className="mt-3 text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: `${nodeColor}22`, color: nodeColor }}>
          +{members.length - 3} más
        </div>
      )}
    </div>
  );
}

function SlotOrPerson({ member, color, onAdd }: { member?: Member; color: string; onAdd: () => void }) {
  if (member) {
    return (
      <div className="flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-full grid place-items-center overflow-hidden text-white font-black text-sm shadow-soft"
          style={{ background: `radial-gradient(circle at 30% 30%, ${color}, ${color}CC)`, border: `2.5px solid ${color}` }}
        >
          {member.photo_url ? (
            <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
          ) : (
            member.full_name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="text-[9px] font-bold text-foreground mt-1 truncate max-w-[72px] text-center leading-tight">{member.full_name.split(" ")[0]}</div>
        <div className="text-[8px] text-muted-foreground truncate max-w-[72px] text-center">{member.relationship}</div>
      </div>
    );
  }
  return (
    <button
      onClick={onAdd}
      aria-label="Agregar familiar"
      className="w-12 h-12 rounded-full grid place-items-center active:scale-90 transition"
      style={{ background: `${color}22`, border: `2.5px dashed ${color}` }}
    >
      <Plus className="w-5 h-5" style={{ color }} />
    </button>
  );
}

/* ═══════════════════════ VIEW 3 · ADD (imagen #3) ═══════════════════════ */

function AddFamilyView({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    relationship: "",
    materno: "",
    paterno: "",
  });

  const lineage = form.materno ? "materno" : form.paterno ? "paterno" : "";
  const relationshipList = lineage === "materno" ? RELATIONSHIPS_MATERNO : lineage === "paterno" ? RELATIONSHIPS_PATERNO : [];

  const canSave = !!form.full_name.trim() && !!form.relationship && !!lineage;

  async function save() {
    if (!user || !canSave) return toast.error("Completa todos los campos");
    setSaving(true);
    let photo_url: string | null = null;
    try {
      if (photoBlob) {
        setUploading(true);
        photo_url = await uploadPhoto("family-photos", user.id, photoBlob);
        setUploading(false);
      }
      const { error } = await supabase.from("family_members").insert({
        user_id: user.id,
        full_name: form.full_name.trim(),
        relationship: form.relationship,
        lineage,
        photo_url,
      });
      if (error) throw error;
      await awardGems(GEM_REWARDS.familyMember, `Nuevo familiar: ${form.full_name}`);
      qc.invalidateQueries({ queryKey: ["family_members"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["profile-arbol"] });
      qc.invalidateQueries({ queryKey: ["profile-gems"] });
      toast.success(`+${GEM_REWARDS.familyMember} 💎 Gemas de Sanación`);
      onBack();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F1ECFF] via-[#FBFAFF] to-[#E8F4FF]">
      <div className="max-w-md mx-auto px-4 pt-4 pb-40">
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="Volver" className="w-10 h-10 rounded-full bg-white shadow-soft grid place-items-center active:scale-95 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center font-display font-black text-[18px] pr-10">Agregar Familiar</h1>
        </div>

        {/* Hero mini tree */}
        <div className="mt-3 relative aspect-square w-[220px] mx-auto">
          <div className="absolute inset-x-6 bottom-6 h-16 bg-[#7C5CFF]/25 blur-3xl rounded-full" />
          <img src={arbolMini.url} alt="Árbol" className="relative w-full h-full object-contain animate-[floatMini_5s_ease-in-out_infinite]" />
        </div>
        <p className="text-center font-display font-black text-[20px] leading-tight -mt-2">
          Cada familiar cuenta<br />para tu sanación
        </p>

        {/* Form card */}
        <div className="mt-5 rounded-[24px] bg-white shadow-soft p-5 space-y-5">
          {/* Foto */}
          <div>
            <label className="flex items-center gap-2 font-display font-bold text-[14px] mb-2">
              <span className="w-6 h-6 rounded-full bg-[#1B1930] text-white grid place-items-center text-[10px]">📷</span>
              Foto del familiar <span className="text-muted-foreground font-normal text-[12px]">(opcional)</span>
            </label>
            <PhotoPicker
              value={photoPreview}
              size={80}
              shape="rounded"
              label="Agrega una foto para reconocer a tu familiar en el árbol. Podrás recortarla."
              onCropped={(blob, url) => { setPhotoBlob(blob); setPhotoPreview(url); }}
              onRemove={() => { setPhotoBlob(null); setPhotoPreview(null); }}
            />
          </div>


          {/* Nombre */}
          <div>
            <label className="flex items-center gap-2 font-display font-bold text-[14px] mb-2">
              <span className="w-6 h-6 rounded-full bg-[#1B1930] text-white grid place-items-center text-[10px]">
                <UserIcon className="w-3.5 h-3.5" />
              </span>
              Nombre completo <span className="text-[#F5566B]">*</span>
            </label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Ingresa el nombre"
              className="h-12 rounded-[14px] bg-white border-2 border-[#F1ECFF] text-[15px] px-4"
            />
          </div>

          {/* Parentesco */}
          <div>
            <label className="flex items-center gap-2 font-display font-bold text-[14px] mb-2">
              <span className="w-6 h-6 rounded-full bg-[#1B1930] text-white grid place-items-center text-[10px]">👥</span>
              Parentesco <span className="text-[#F5566B]">*</span>
            </label>
            <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v })} disabled={!lineage}>
              <SelectTrigger className="h-12 rounded-[14px] bg-white border-2 border-[#F1ECFF] text-[15px] px-4">
                <SelectValue placeholder={lineage ? "Ej: Madre, Padre, Abuela…" : "Elige primero el linaje"} />
              </SelectTrigger>
              <SelectContent>
                {relationshipList.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Linaje materno */}
          <div>
            <label className="flex items-center gap-2 font-display font-bold text-[14px] mb-2">
              <span className="w-6 h-6 rounded-full bg-[#F58BCB]/25 text-[#D14E9E] grid place-items-center text-sm font-black">♀</span>
              Linaje materno <span className="text-muted-foreground font-normal text-[12px]">(parte de madre)</span> <span className="text-[#F5566B]">*</span>
            </label>
            <Select
              value={form.materno}
              onValueChange={(v) => setForm({ ...form, materno: v, paterno: "", relationship: "" })}
            >
              <SelectTrigger className="h-12 rounded-[14px] bg-white border-2 border-[#F1ECFF] text-[15px] px-4">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="si">Sí, es de linaje materno</SelectItem>
                <SelectItem value="no">No aplica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Linaje paterno */}
          <div>
            <label className="flex items-center gap-2 font-display font-bold text-[14px] mb-2">
              <span className="w-6 h-6 rounded-full bg-[#5AA9FF]/25 text-[#4A90E2] grid place-items-center text-sm font-black">♂</span>
              Linaje paterno <span className="text-muted-foreground font-normal text-[12px]">(parte de padre)</span> <span className="text-[#F5566B]">*</span>
            </label>
            <Select
              value={form.paterno}
              onValueChange={(v) => setForm({ ...form, paterno: v, materno: "", relationship: "" })}
            >
              <SelectTrigger className="h-12 rounded-[14px] bg-white border-2 border-[#F1ECFF] text-[15px] px-4">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="si">Sí, es de linaje paterno</SelectItem>
                <SelectItem value="no">No aplica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 rounded-[16px] bg-[#F1ECFF] p-3 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#7C5CFF] text-white grid place-items-center shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <p className="text-[13px] text-foreground/80 leading-snug">
            Todos los campos son obligatorios para continuar.
          </p>
        </div>
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 inset-x-0 z-30 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+80px)] bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={save}
            disabled={!canSave || saving}
            className="w-full h-14 rounded-[18px] bg-gradient-to-b from-[#4CD394] to-[#2FA574] text-white font-display font-black text-[16px] shadow-[0_8px_24px_rgba(63,190,143,0.45)] disabled:opacity-50"
          >
            {uploading ? "Subiendo foto…" : saving ? "Guardando…" : `Guardar Familiar  (+${GEM_REWARDS.familyMember} 💎)`}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes floatMini { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}

// keep import used
export const _link = Link;
