import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2, Eye, EyeOff, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Promo = { id: string; title: string; image_url: string; link_url: string | null; is_active: boolean; starts_at: string | null; ends_at: string | null; created_at: string };

const input = "min-h-12 w-full rounded-[10px] border border-border bg-background px-3 text-[14px] outline-none focus:border-primary";

/** Campañas emergentes: imagen clicable con enlace que aparece al entrar a la app. */
export function PromoManager() {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [ends, setEnds] = useState("");
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
      const { error } = await supabase.from("promo_campaigns").insert({
        title: title.trim(),
        image_url: signed.data.signedUrl,
        link_url: link.trim() || null,
        ends_at: ends ? new Date(`${ends}T23:59:59`).toISOString() : null,
        is_active: true,
      });
      if (error) throw error;
      setFile(null); setTitle(""); setLink(""); setEnds("");
      setNote({ text: "Campaña publicada. Aparece al entrar a la app." });
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
    if (!confirm("¿Eliminar esta campaña?")) return;
    await supabase.from("promo_campaigns").delete().eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["admin-promos"] });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[16px] border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-primary"><Megaphone className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-[18px] font-bold">Nueva campaña emergente</h2>
            <p className="text-[13px] text-muted-foreground">Sube una imagen y el enlace (grupo de WhatsApp, oferta de Navidad…). Se muestra una vez por día a cada persona.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-border bg-muted/30 p-4 text-[13px] font-semibold text-muted-foreground">
            {file ? <img src={URL.createObjectURL(file)} alt="" className="max-h-48 rounded-[10px] object-contain" /> : <><ImagePlus className="h-6 w-6" /> Elegir imagen</>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <input className={input} placeholder="Nombre interno (ej. Navidad 2026)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={input} placeholder="Enlace al tocar la imagen (https://…)" value={link} onChange={(e) => setLink(e.target.value)} />
          <label className="text-[13px] font-semibold text-foreground/80">Se deja de mostrar el (opcional)
            <input type="date" className={cn(input, "mt-1")} value={ends} onChange={(e) => setEnds(e.target.value)} />
          </label>
          <button onClick={create} disabled={busy} className="min-h-[52px] rounded-[12px] bg-primary font-bold text-primary-foreground disabled:opacity-60">
            {busy ? "Publicando…" : "Publicar campaña"}
          </button>
          {note && <p className={cn("text-[13px] font-semibold", note.error ? "text-destructive" : "text-accent-green")}>{note.text}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="h-40 animate-pulse rounded-[16px] bg-muted" />}
        {!isLoading && promos.length === 0 && <p className="text-[14px] text-muted-foreground">Aún no hay campañas. La primera que publiques aparecerá aquí.</p>}
        {promos.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-[16px] border border-border bg-card">
            <img src={p.image_url} alt={p.title} className={cn("aspect-[4/5] w-full object-cover", !p.is_active && "opacity-50")} />
            <div className="p-3">
              <p className="truncate font-bold">{p.title || "Campaña"}</p>
              <p className="truncate text-[12px] text-muted-foreground">{p.link_url || "Sin enlace"}</p>
              <p className="text-[12px] text-muted-foreground">{p.ends_at ? `Hasta ${new Date(p.ends_at).toLocaleDateString("es")}` : "Sin fecha final"}</p>
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
