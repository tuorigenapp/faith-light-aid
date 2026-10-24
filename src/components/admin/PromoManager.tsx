import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2, Eye, EyeOff, Megaphone, Home, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { confirmDeletion } from "@/lib/deletion-confirmation";

type Placement = "inicio" | "comunidad";
type Promo = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  placement: string;
  days: number;
  shows_per_day: number;
};

const input = "min-h-12 w-full rounded-[10px] border border-border bg-background px-3 text-[14px] outline-none focus:border-primary";

/** Campañas emergentes: una lista para Inicio y otra para Comunidad, con días y veces por día. */
export function PromoManager() {
  const qc = useQueryClient();
  const [placement, setPlacement] = useState<Placement>("inicio");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [days, setDays] = useState("7");
  const [perDay, setPerDay] = useState("1");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promo_campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Promo[];
    },
  });

  const mine = promos.filter((p) => (p.placement || "inicio") === placement);

  async function create() {
    if (!file) return setNote({ text: "Elige la imagen de la campaña.", error: true });
    if (link && !/^https?:\/\//i.test(link)) return setNote({ text: "El enlace debe empezar con https://", error: true });
    setBusy(true);
    setNote(null);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `promos/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("content-covers").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const signed = await supabase.storage.from("content-covers").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (signed.error || !signed.data) throw signed.error ?? new Error("No pudimos preparar la imagen.");
      const d = Math.max(1, Math.min(365, Number(days) || 7));
      const { error } = await supabase.from("promo_campaigns").insert({
        title: title.trim(),
        image_url: signed.data.signedUrl,
        link_url: link.trim() || null,
        placement,
        days: d,
        shows_per_day: Math.max(1, Math.min(5, Number(perDay) || 1)),
        ends_at: new Date(Date.now() + d * 86400000).toISOString(),
        is_active: true,
      });
      if (error) throw error;
      setFile(null); setTitle(""); setLink(""); setDays("7"); setPerDay("1");
      setNote({ text: placement === "inicio" ? "Publicada. Aparece al entrar a la app." : "Publicada. Aparece solo dentro de Comunidad." });
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
    } catch (e) {
      setNote({ text: e instanceof Error ? e.message : "No pudimos guardar la campaña.", error: true });
    }
    setBusy(false);
  }

  async function toggle(p: Promo) {
    await supabase.from("promo_campaigns").update({ is_active: !p.is_active }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["admin-promos"] });
  }
  async function remove(p: Promo) {
    if (!await confirmDeletion("Esta campaña se eliminará.")) return;
    const { error } = await supabase.from("promo_campaigns").delete().eq("id", p.id);
    if (error) return setNote({ text: "No pudimos eliminar la campaña. Intenta de nuevo.", error: true });
    qc.invalidateQueries({ queryKey: ["admin-promos"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {([
          { v: "inicio" as Placement, label: "Inicio", icon: Home },
          { v: "comunidad" as Placement, label: "Comunidad", icon: Users },
        ]).map(({ v, label, icon: Icon }) => (
          <button
            key={v}
            onClick={() => setPlacement(v)}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[12px] border text-[14px] font-bold",
              placement === v ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
            <span className="rounded-full bg-muted px-2 text-[12px]">{promos.filter((p) => (p.placement || "inicio") === v).length}</span>
          </button>
        ))}
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-primary"><Megaphone className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-[18px] font-bold">Nueva campaña en {placement === "inicio" ? "Inicio" : "Comunidad"}</h2>
            <p className="text-[13px] text-muted-foreground">
              {placement === "inicio"
                ? "Se muestra al entrar a la app."
                : "Se muestra solo cuando la persona entra a Comunidad (grupo de WhatsApp, Telegram, descuentos…)."}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-border bg-muted/30 p-4 text-[13px] font-semibold text-muted-foreground">
            {file ? <img src={URL.createObjectURL(file)} alt="" className="max-h-48 rounded-[10px] object-contain" /> : <><ImagePlus className="h-6 w-6" /> Elegir imagen</>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <input className={input} placeholder="Nombre interno (ej. Navidad 2026)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={input} placeholder="Enlace al tocar la imagen (https://…)" value={link} onChange={(e) => setLink(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-semibold text-foreground/80">Cuántos días se muestra
              <input type="number" min={1} max={365} className={cn(input, "mt-1")} value={days} onChange={(e) => setDays(e.target.value)} />
            </label>
            <label className="text-[13px] font-semibold text-foreground/80">Veces por día
              <input type="number" min={1} max={5} className={cn(input, "mt-1")} value={perDay} onChange={(e) => setPerDay(e.target.value)} />
            </label>
          </div>
          <button onClick={create} disabled={busy} className="min-h-[52px] rounded-[12px] bg-primary font-bold text-primary-foreground disabled:opacity-60">
            {busy ? "Publicando…" : "Publicar campaña"}
          </button>
          {note && <p className={cn("text-[13px] font-semibold", note.error ? "text-destructive" : "text-accent-green")}>{note.text}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="h-40 animate-pulse rounded-[16px] bg-muted" />}
        {!isLoading && mine.length === 0 && (
          <p className="text-[14px] text-muted-foreground">
            Aún no hay campañas en {placement === "inicio" ? "Inicio" : "Comunidad"}. La primera que publiques aparecerá aquí.
          </p>
        )}
        {mine.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-[16px] border border-border bg-card">
            <img src={p.image_url} alt={p.title} className={cn("aspect-[4/5] w-full object-cover", !p.is_active && "opacity-50")} />
            <div className="p-3">
              <p className="truncate font-bold">{p.title || "Campaña"}</p>
              <p className="truncate text-[12px] text-muted-foreground">{p.link_url || "Sin enlace"}</p>
              <p className="text-[12px] text-muted-foreground">
                {p.days || 7} días · {p.shows_per_day || 1} vez/día
                {p.ends_at ? ` · hasta ${new Date(p.ends_at).toLocaleDateString("es")}` : ""}
              </p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => toggle(p)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-[10px] bg-primary/10 text-[13px] font-bold text-primary">
                  {p.is_active ? <><EyeOff className="h-4 w-4" /> Pausar</> : <><Eye className="h-4 w-4" /> Activar</>}
                </button>
                <button onClick={() => remove(p)} aria-label="Eliminar" className="grid min-h-11 w-11 place-items-center rounded-[10px] bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
