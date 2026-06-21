import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Reconectando" }] }),
  component: Perfil,
});

function Perfil() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: "", country: "", age: "", bio: "" });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", country: profile.country ?? "", age: String(profile.age ?? ""), bio: profile.bio ?? "" });
  }, [profile]);

  async function save() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, country: form.country || null, age: form.age ? Number(form.age) : null, bio: form.bio,
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Perfil actualizado");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl">Mi perfil</h1>
      <Card className="p-7 mt-6 space-y-4">
        <div><Label>Correo</Label><Input value={user?.email ?? ""} disabled /></div>
        <div><Label>Nombre completo</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>País</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
          <div><Label>Edad</Label><Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
        </div>
        <div><Label>Biografía espiritual</Label><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="min-h-28" placeholder="Cuéntanos un poco de tu camino..." /></div>
        <div className="flex justify-end"><Button onClick={save} className="bg-gold text-gold-foreground hover:bg-gold/90">Guardar cambios</Button></div>
      </Card>

      <Card className="p-7 mt-4">
        <h2 className="font-display text-lg">Tu camino</h2>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <Stat label="Etapa actual" value={profile?.current_stage ?? 1} />
          <Stat label="Días seguidos" value={profile?.consecutive_days ?? 0} />
          <Stat label="Nivel" value={profile?.spiritual_level ?? "—"} />
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="font-display text-2xl text-primary">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
