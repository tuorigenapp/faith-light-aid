import { EXPLORE_ITEMS, exploreKey } from "@/lib/explore-content";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCreateCamino,
  adminListCaminos,
  adminSetOverride,
  adminUpdateCamino,
} from "@/lib/content-admin.functions";
import { CAMINOS } from "@/lib/caminos";
import { GAMES } from "@/components/games/DailyGames";
import { cn } from "@/lib/utils";

type Notify = (n: { text: string; error?: boolean } | null) => void;

const input =
  "w-full min-h-12 rounded-[10px] border-2 border-border bg-card px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-[#7C5CFF] focus:outline-none";

function useOverrides() {
  return useQuery({
    queryKey: ["content-overrides"],
    queryFn: async () => {
      const { data } = await supabase.from("content_overrides").select("key, title, cover_url, is_hidden");
      return new Map((data ?? []).map((o) => [o.key, o]));
    },
  });
}

/** Caminos ORÍGEN: los existentes (ocultar/portada) y nuevos creados por la IA. */
export function CaminosStudio({ onNote }: { onNote: Notify }) {
  const qc = useQueryClient();
  const list = useServerFn(adminListCaminos);
  const create = useServerFn(adminCreateCamino);
  const update = useServerFn(adminUpdateCamino);
  const setOv = useServerFn(adminSetOverride);
  const { data: custom = [] } = useQuery({ queryKey: ["studio-caminos"], queryFn: () => list(), refetchInterval: 20_000 });
  const { data: ov } = useOverrides();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(id);
    try {
      await fn();
      onNote({ text: ok });
      qc.invalidateQueries({ queryKey: ["studio-caminos"] });
      qc.invalidateQueries({ queryKey: ["content-overrides"] });
      qc.invalidateQueries({ queryKey: ["custom-caminos"] });
    } catch (e) {
      onNote({ text: e instanceof Error ? e.message : "No pudimos guardar.", error: true });
    }
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-[16px] border border-border bg-card p-5">
        <h3 className="font-display text-[17px] font-bold">Crear camino nuevo con IA</h3>
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título: Sanar la herida de abandono" />
        <textarea className={cn(input, "min-h-24 py-2")} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nota para la IA: a quién va dirigido y qué debe lograr" />
        <input className={input} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Portada por enlace (vacío = la IA la crea)" />
        <button
          disabled={busy === "new"}
          onClick={() => {
            if (title.trim().length < 3) return onNote({ text: "Escribe un título más largo.", error: true });
            run("new", async () => {
              await create({ data: { title: title.trim(), notes, coverUrl: cover.trim() } });
              setTitle(""); setNotes(""); setCover("");
            }, "Camino creado con 20 etapas y 8 lecciones por etapa, afirmaciones, sopa de letras y preguntas. Queda oculto hasta que lo hagas visible.");
          }}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#7C5CFF] text-[15px] font-bold text-white disabled:opacity-60"
        >
          {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear camino con IA
        </button>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5">
        <h3 className="font-display text-[17px] font-bold">Todos los caminos</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAMINOS.map((c) => {
            const o = ov?.get(`camino:${c.id}`);
            return (
              <CoverCard
                key={c.id}
                title={o?.title || c.title}
                image={o?.cover_url || c.banner}
                visible={!o?.is_hidden}
                busy={busy === c.id}
                coverValue={o?.cover_url ?? ""}
                onToggle={() => run(c.id, () => setOv({ data: { key: `camino:${c.id}`, scope: "camino", isHidden: !o?.is_hidden } }), "Visibilidad actualizada.")}
                onSaveCover={(url) => run(c.id, () => setOv({ data: { key: `camino:${c.id}`, scope: "camino", coverUrl: url } }), "Portada guardada.")}
              />
            );
          })}
          {custom.map((c) => (
            <CoverCard
              key={c.id}
              title={c.title}
              image={c.cover_url}
              visible={c.is_published}
              busy={busy === c.id}
              coverValue={c.cover_url ?? ""}
              onToggle={() => run(c.id, () => update({ data: { id: c.id, isPublished: !c.is_published } }), "Visibilidad actualizada.")}
              onSaveCover={(url) => run(c.id, () => update({ data: { id: c.id, coverUrl: url } }), "Portada guardada.")}
              onDelete={() => window.confirm(`¿Eliminar "${c.title}"?`) && run(c.id, () => update({ data: { id: c.id, remove: true } }), "Camino eliminado.")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Portadas por enlace de /categorias y de los 10 juegos. */
export function CoversStudio({ onNote }: { onNote: Notify }) {
  const qc = useQueryClient();
  const setOv = useServerFn(adminSetOverride);
  const { data: ov } = useOverrides();
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function save(key: string, scope: "camino" | "juego" | "explorar", patch: { coverUrl?: string; isHidden?: boolean }) {
    setBusy(key);
    try {
      await setOv({ data: { key, scope, ...patch } });
      onNote({ text: "Guardado. Ya se ve en la app." });
      qc.invalidateQueries({ queryKey: ["content-overrides"] });
    } catch (e) {
      onNote({ text: e instanceof Error ? e.message : "No pudimos guardar.", error: true });
    }
    setBusy(null);
  }

  const items = [
    ...CAMINOS.map((c) => ({ key: `camino:${c.id}`, scope: "camino" as const, title: `Categoría · ${c.title}`, image: c.banner as string | null })),
    ...GAMES.map((g) => ({ key: `juego:${g.id}`, scope: "juego" as const, title: `Juego · ${g.title}`, image: null as string | null })),
    ...EXPLORE_ITEMS.map((e) => ({ key: exploreKey(e.title), scope: "explorar" as const, title: `Explorar · ${e.title}`, image: e.image as string | null })),
  ].filter((i) => i.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="rounded-[16px] border border-border bg-card p-5">
      <div className="flex items-center gap-2 rounded-[10px] border border-border bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre" className="min-h-11 w-full bg-transparent text-[14px] outline-none" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => {
          const o = ov?.get(i.key);
          return (
            <CoverCard
              key={i.key}
              title={i.title}
              image={o?.cover_url || i.image}
              visible={!o?.is_hidden}
              busy={busy === i.key}
              coverValue={o?.cover_url ?? ""}
              onToggle={() => save(i.key, i.scope, { isHidden: !o?.is_hidden })}
              onSaveCover={(url) => save(i.key, i.scope, { coverUrl: url })}
            />
          );
        })}
      </div>
    </div>
  );
}

function CoverCard({ title, image, visible, busy, coverValue, onToggle, onSaveCover, onDelete }: {
  title: string; image: string | null; visible: boolean; busy: boolean; coverValue: string;
  onToggle: () => void; onSaveCover: (url: string) => void; onDelete?: () => void;
}) {
  const [url, setUrl] = useState(coverValue);
  return (
    <article className="overflow-hidden rounded-[14px] border border-border bg-muted/30">
      {image ? (
        <img src={image} alt={title} className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="grid aspect-[16/9] place-items-center bg-muted text-[12px] text-foreground/50">Sin portada</div>
      )}
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13.5px] font-bold leading-tight">{title}</p>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", visible ? "bg-[#3FBE8F]/20 text-[#1B6B4F]" : "bg-muted text-foreground/60")}>
            {visible ? "Visible" : "Oculto"}
          </span>
        </div>
        <input className={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enlace de la portada https://…" />
        <div className="flex gap-2">
          {busy ? (
            <Loader2 className="m-3 h-4 w-4 animate-spin" />
          ) : (
            <>
              <button onClick={() => onSaveCover(url.trim())} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#7C5CFF] text-[13px] font-bold text-white">
                <Save className="h-4 w-4" /> Guardar portada
              </button>
              <button aria-label={visible ? "Ocultar" : "Hacer visible"} onClick={onToggle} className="grid h-11 w-11 place-items-center rounded-[10px] border border-border bg-card">
                {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              {onDelete && (
                <button aria-label="Eliminar" onClick={onDelete} className="grid h-11 w-11 place-items-center rounded-[10px] border border-border bg-card text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
