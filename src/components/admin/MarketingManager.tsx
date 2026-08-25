import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Image as ImageIcon,
  Link2,
  List,
  Loader2,
  Mail,
  MousePointerClick,
  Pause,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getAudienceCount, sendCampaignNow, scheduleCampaign, pauseCampaign } from "@/lib/marketing.functions";

type Channel = "email" | "push";

type MList = {
  id: string;
  name: string;
  description: string | null;
  filter_type: string;
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  channel: string;
  subject: string | null;
  content: string;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  audience_type: string;
  list_id: string | null;
  status: string;
  scheduled_at: string | null;
  ends_at: string | null;
  sent_count: number;
  click_count: number;
  created_at: string;
  max_per_day: number;
  last_sent_at: string | null;
};

/** Listas predefinidas + libres, con la misma idea que MailerLite. */
const FILTERS: { value: string; label: string; hint: string }[] = [
  { value: "all", label: "Todos los registrados", hint: "Cada persona con cuenta en ORÍGEN" },
  { value: "buyers", label: "Compradores", hint: "Con suscripción activa" },
  { value: "non_buyers", label: "No compradores", hint: "Todavía en plan Explorador" },
  { value: "active", label: "Frecuentan mucho", hint: "Con actividad en los últimos 7 días" },
  { value: "inactive", label: "Frecuentan poco", hint: "Sin actividad en 14 días o más" },
  { value: "custom", label: "Lista propia", hint: "La armas tú a mano" },
];

const SHORTCODES = [
  { code: "[usuario]", desc: "Nombre de la persona" },
  { code: "[hojas]", desc: "Sus hojas de sanación" },
  { code: "[enlace:/etapas]", desc: "Botón a Camino ORÍGEN" },
  { code: "[enlace:/ejercicios]", desc: "Botón a Ejercicios diarios" },
  { code: "[enlace:/visualiza]", desc: "Botón a Visualízalo y Vívelo" },
  { code: "[enlace:/palabra]", desc: "Botón a Palabra de hoy" },
  { code: "[sitio]", desc: "tuorigen.app" },
];

const listSchema = z.object({
  name: z.string().trim().min(3, "Ponle un nombre a la lista").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  filter_type: z.string().trim().min(2),
});

const campaignSchema = z.object({
  name: z.string().trim().min(3, "Ponle un nombre a la campaña").max(120),
  channel: z.enum(["email", "push"]),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  content: z.string().trim().min(5, "Escribe el mensaje").max(6000),
  image_url: z.string().trim().max(800).optional().or(z.literal("")),
  button_text: z.string().trim().max(60).optional().or(z.literal("")),
  button_url: z.string().trim().max(400).optional().or(z.literal("")),
  audience_type: z.string().trim().min(2),
  list_id: z.string().uuid().nullable(),
  scheduled_at: z.string().trim().optional().or(z.literal("")),
  ends_at: z.string().trim().optional().or(z.literal("")),
  max_per_day: z.number().int().min(1).max(24),
});

const emptyCampaign = {
  name: "",
  channel: "email" as Channel,
  subject: "",
  content: "",
  image_url: "",
  button_text: "",
  button_url: "",
  audience_type: "all",
  list_id: "",
  scheduled_at: "",
  ends_at: "",
  max_per_day: 1,
};

/** Email marketing y campañas push: listas, editor con etiquetas, horarios e historial de clics. */
export function MarketingManager() {
  const qc = useQueryClient();
  const audienceCount = useServerFn(getAudienceCount);
  const sendNow = useServerFn(sendCampaignNow);
  const schedule = useServerFn(scheduleCampaign);
  const pause = useServerFn(pauseCampaign);
  const [channel, setChannel] = useState<Channel>("email");
  const [form, setForm] = useState(emptyCampaign);
  const [listForm, setListForm] = useState({ name: "", description: "", filter_type: "all" });
  const [openList, setOpenList] = useState(false);

  const { data: lists } = useQuery({
    queryKey: ["admin-marketing-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_lists")
        .select("id, name, description, filter_type, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MList[];
    },
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin-marketing-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select(
          "id, name, channel, subject, content, image_url, button_text, button_url, audience_type, list_id, status, scheduled_at, ends_at, sent_count, click_count, created_at, max_per_day, last_sent_at",
        )
        .order("created_at", { ascending: false })
        .limit(120);
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });

  const byChannel = useMemo(
    () => (campaigns ?? []).filter((c) => c.channel === channel),
    [campaigns, channel],
  );

  const audienceListId = form.audience_type === "list" && form.list_id ? form.list_id : null;
  const {
    data: audience,
    isLoading: audienceLoading,
    isError: audienceError,
  } = useQuery({
    queryKey: ["admin-marketing-audience-count", form.audience_type, audienceListId],
    queryFn: () => audienceCount({ data: { audienceType: form.audience_type, listId: audienceListId } }),
    enabled: form.audience_type !== "list" || !!audienceListId,
  });

  /** Horas en que la gente abre: se calcula del historial de eventos. */
  const { data: hours } = useQuery({
    queryKey: ["admin-marketing-hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_events")
        .select("event_type, created_at")
        .order("created_at", { ascending: false })
        .limit(4000);
      if (error) throw error;
      const buckets = Array.from({ length: 24 }, () => 0);
      for (const e of data ?? []) {
        if (e.event_type === "click") buckets[new Date(e.created_at).getHours()]! += 1;
      }
      return buckets;
    },
  });

  const saveList = useMutation({
    mutationFn: async () => {
      const parsed = listSchema.safeParse(listForm);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const { error } = await supabase.from("marketing_lists").insert({
        name: parsed.data.name,
        description: parsed.data.description || null,
        filter_type: parsed.data.filter_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lista creada");
      setListForm({ name: "", description: "", filter_type: "all" });
      setOpenList(false);
      void qc.invalidateQueries({ queryKey: ["admin-marketing-lists"] });
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos crear la lista"),
  });

  const removeList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lista eliminada");
      void qc.invalidateQueries({ queryKey: ["admin-marketing-lists"] });
    },
    onError: () => toast.error("No pudimos eliminar la lista"),
  });

  const saveCampaign = useMutation({
    mutationFn: async (status: "draft" | "scheduled") => {
      const parsed = campaignSchema.safeParse({
        ...form,
        channel,
        list_id: form.list_id ? form.list_id : null,
        max_per_day: Number(form.max_per_day) || 1,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const d = parsed.data;
      if (channel === "email" && !d.subject) throw new Error("El correo necesita un asunto");
      const { error } = await supabase.from("marketing_campaigns").insert({
        name: d.name,
        channel,
        subject: d.subject || null,
        content: d.content,
        image_url: d.image_url || null,
        button_text: d.button_text || null,
        button_url: d.button_url || null,
        audience_type: d.audience_type,
        list_id: d.list_id,
        status,
        scheduled_at: d.scheduled_at ? new Date(d.scheduled_at).toISOString() : null,
        ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null,
        max_per_day: d.max_per_day,
      });
      if (error) throw error;
    },
    onSuccess: (_r, status) => {
      toast.success(status === "scheduled" ? "Campaña programada" : "Borrador guardado");
      setForm(emptyCampaign);
      void qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos guardar la campaña"),
  });

  function invalidateCampaigns() {
    void qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
  }

  function handleUnconfigured(r: { emailUnconfigured?: boolean } | undefined) {
    if (r?.emailUnconfigured) {
      toast.warning("Los correos aún no están activados; el push sí se envió.");
    }
  }

  const sendNowMutation = useMutation({
    mutationFn: (campaignId: string) => sendNow({ data: { campaignId } }),
    onSuccess: (r) => {
      toast.success(`Campaña enviada a ${r.audienceSize} personas.`);
      handleUnconfigured(r);
      invalidateCampaigns();
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos enviar la campaña"),
  });

  const scheduleMutation = useMutation({
    mutationFn: (vars: { campaignId: string; scheduledAt: string; endsAt?: string | null; maxPerDay: number }) =>
      schedule({ data: vars }),
    onSuccess: () => {
      toast.success("Campaña programada");
      invalidateCampaigns();
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos programar la campaña"),
  });

  const pauseMutation = useMutation({
    mutationFn: (campaignId: string) => pause({ data: { campaignId } }),
    onSuccess: () => {
      toast.success("Campaña pausada");
      invalidateCampaigns();
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos pausar la campaña"),
  });

  function insertCode(code: string) {
    setForm((f) => ({ ...f, content: `${f.content}${f.content && !f.content.endsWith(" ") ? " " : ""}${code}` }));
  }

  const maxHour = Math.max(1, ...(hours ?? [1]));

  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Barra lateral estilo MailerLite */}
      <aside className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
        <h2 className="inline-flex items-center gap-2 font-display text-[15px] font-bold">
          <Send className="h-4 w-4 text-primary" /> Marketing
        </h2>

        <div className="mt-3 grid gap-1.5">
          {(["email", "push"] as Channel[]).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-[12px] px-3 text-left text-[13px] font-semibold",
                channel === c ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              {c === "email" ? <Mail className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {c === "email" ? "Correo electrónico" : "Notificaciones push"}
            </button>
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground">
              <List className="h-3.5 w-3.5" /> Mis listas
            </span>
            <button
              onClick={() => setOpenList((v) => !v)}
              aria-label="Crear lista"
              className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary/10 text-primary"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {openList && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveList.mutate();
              }}
              className="mt-2 grid gap-2 rounded-[12px] border border-border/60 bg-background p-3"
            >
              <input
                value={listForm.name}
                onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                placeholder="Nombre de la lista"
                className={inputSm}
                maxLength={80}
              />
              <select
                value={listForm.filter_type}
                onChange={(e) => setListForm({ ...listForm, filter_type: e.target.value })}
                className={inputSm}
              >
                {FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {FILTERS.find((f) => f.value === listForm.filter_type)?.hint}
              </p>
              <button
                type="submit"
                disabled={saveList.isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-primary text-[13px] font-bold text-primary-foreground disabled:opacity-60"
              >
                {saveList.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear lista
              </button>
            </form>
          )}

          <ul className="mt-2 space-y-1.5">
            {(lists ?? []).length === 0 && (
              <li className="rounded-[10px] border border-dashed border-border p-3 text-[12px] text-muted-foreground">
                Todavía no tienes listas. Crea la primera: compradores o no compradores.
              </li>
            )}
            {(lists ?? []).map((l) => (
              <li
                key={l.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] border border-border/60 p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-bold">{l.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {FILTERS.find((f) => f.value === l.filter_type)?.label ?? l.filter_type}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar la lista "${l.name}"?`)) removeList.mutate(l.id);
                  }}
                  aria-label={`Eliminar ${l.name}`}
                  className="grid h-9 w-9 place-items-center rounded-[10px] bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Editor */}
        <div className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="font-display text-[16px] font-bold">
            {channel === "email" ? "Nuevo correo para tus usuarias" : "Nueva notificación push"}
          </h3>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {channel === "email"
              ? "Escribe el mensaje, agrega imagen, botón y etiquetas que se personalizan solas."
              : "El texto y la imagen aparecen en la barra de notificaciones del teléfono, con el ícono de ORÍGEN."}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Nombre interno de la campaña">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                maxLength={120}
              />
            </Field>
            {channel === "email" ? (
              <Field label="Asunto del correo">
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={inputCls}
                  maxLength={160}
                />
              </Field>
            ) : (
              <Field label="Título de la notificación">
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="tuorigen.app"
                  className={inputCls}
                  maxLength={80}
                />
              </Field>
            )}

            <Field label="A quién le llega">
              <select
                value={form.audience_type}
                onChange={(e) => setForm({ ...form, audience_type: e.target.value, list_id: "" })}
                className={inputCls}
              >
                {FILTERS.filter((f) => f.value !== "custom").map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
                <option value="list">Una de mis listas</option>
              </select>
            </Field>
            <Field label="Lista (si elegiste una lista)">
              <select
                value={form.list_id}
                onChange={(e) => setForm({ ...form, list_id: e.target.value })}
                disabled={form.audience_type !== "list"}
                className={cn(inputCls, form.audience_type !== "list" && "opacity-60")}
              >
                <option value="">Elige una lista</option>
                {(lists ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2 -mt-1">
              {form.audience_type === "list" && !audienceListId ? (
                <p className="text-[12px] text-muted-foreground">Elige una lista para ver a cuántas personas llegará.</p>
              ) : audienceLoading ? (
                <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
              ) : audienceError ? (
                <p className="text-[12px] text-destructive">No pudimos calcular la audiencia. Intenta de nuevo.</p>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary">
                  <Users className="h-3.5 w-3.5" /> Llegará a {audience?.count ?? 0} personas
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Field label="Mensaje">
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={channel === "email" ? 7 : 4}
                  maxLength={6000}
                  placeholder={
                    channel === "email"
                      ? "Hola [usuario], hoy te espera un paso nuevo en tu camino…"
                      : "[usuario], tu ejercicio de hoy ya está abierto 🍃"
                  }
                  className="w-full rounded-[10px] border-[1.5px] border-border bg-card p-3 text-[14px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                />
              </Field>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SHORTCODES.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => insertCode(s.code)}
                    title={s.desc}
                    className="h-8 rounded-[10px] bg-primary/10 px-2.5 text-[11.5px] font-bold text-primary"
                  >
                    {s.code}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Imagen (enlace)">
              <div className="relative">
                <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://…"
                  className={cn(inputCls, "pl-9")}
                  maxLength={800}
                />
              </div>
            </Field>
            <Field label="Texto del botón">
              <input
                value={form.button_text}
                onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                placeholder="Abrir mi camino"
                className={inputCls}
                maxLength={60}
              />
            </Field>
            <Field label="Enlace del botón">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={form.button_url}
                  onChange={(e) => setForm({ ...form, button_url: e.target.value })}
                  placeholder="/etapas"
                  className={cn(inputCls, "pl-9")}
                  maxLength={400}
                />
              </div>
            </Field>
            <Field label="Máximo de envíos por día">
              <input
                type="number"
                min={1}
                max={24}
                value={form.max_per_day}
                onChange={(e) => setForm({ ...form, max_per_day: Number(e.target.value) || 1 })}
                className={inputCls}
              />
            </Field>
            <Field label="Empieza (fecha y hora)">
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Termina (fecha y hora)">
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className={inputCls}
              />
            </Field>

            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
              <button
                onClick={() => saveCampaign.mutate("draft")}
                disabled={saveCampaign.isPending}
                className="inline-flex h-12 items-center justify-center rounded-[12px] bg-primary/10 text-[14px] font-bold text-primary disabled:opacity-60"
              >
                Guardar borrador
              </button>
              <button
                onClick={() => saveCampaign.mutate("scheduled")}
                disabled={saveCampaign.isPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-primary/80 text-[14px] font-bold text-primary-foreground disabled:opacity-60"
              >
                {saveCampaign.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Programar campaña
              </button>
              <button
                onClick={async () => {
                  const parsed = campaignSchema.safeParse({
                    ...form,
                    channel,
                    list_id: form.list_id ? form.list_id : null,
                    max_per_day: Number(form.max_per_day) || 1,
                  });
                  if (!parsed.success) {
                    toast.error(parsed.error.issues[0]!.message);
                    return;
                  }
                  const d = parsed.data;
                  if (channel === "email" && !d.subject) {
                    toast.error("El correo necesita un asunto");
                    return;
                  }
                  const { data: inserted, error } = await supabase
                    .from("marketing_campaigns")
                    .insert({
                      name: d.name,
                      channel,
                      subject: d.subject || null,
                      content: d.content,
                      image_url: d.image_url || null,
                      button_text: d.button_text || null,
                      button_url: d.button_url || null,
                      audience_type: d.audience_type,
                      list_id: d.list_id,
                      status: "sending",
                      max_per_day: d.max_per_day,
                    })
                    .select("id")
                    .single();
                  if (error || !inserted) {
                    toast.error(error?.message || "No pudimos crear la campaña");
                    return;
                  }
                  invalidateCampaigns();
                  sendNowMutation.mutate(inserted.id, {
                    onSuccess: () => setForm(emptyCampaign),
                  });
                }}
                disabled={saveCampaign.isPending || sendNowMutation.isPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
              >
                {sendNowMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publicar ahora
              </button>
            </div>
          </div>

          {/* Vista previa */}
          <div className="mt-5 rounded-[16px] border border-border/60 bg-background p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Vista previa</p>
            <div className="mt-2 rounded-[12px] border border-border bg-card p-3">
              <p className="text-[12px] font-bold text-primary">tuorigen.app</p>
              <p className="mt-0.5 text-[14px] font-bold">{form.subject || "Sin asunto todavía"}</p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-muted-foreground">
                {form.content.replace("[usuario]", "María").replace("[sitio]", "tuorigen.app") ||
                  "Aquí verás tu mensaje."}
              </p>
              {form.image_url && (
                <img src={form.image_url} alt="" className="mt-2 h-28 w-full rounded-[10px] object-cover" />
              )}
              {form.button_text && (
                <span className="mt-2 inline-flex h-10 items-center rounded-[12px] bg-primary px-4 text-[13px] font-bold text-primary-foreground">
                  {form.button_text}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Horas con más clics */}
        <div className="mt-4 rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="inline-flex items-center gap-2 font-display text-[15px] font-bold">
            <BarChart3 className="h-4 w-4 text-primary" /> Horas en que más te abren
          </h3>
          <div className="mt-3 grid grid-cols-12 items-end gap-1 sm:grid-cols-24">
            {(hours ?? Array.from({ length: 24 }, () => 0)).map((v, h) => (
              <div key={h} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-[4px] bg-primary/70"
                  style={{ height: `${8 + (v / maxHour) * 56}px` }}
                  title={`${h}:00 · ${v} clics`}
                />
                <span className="text-[9px] text-muted-foreground">{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historial */}
        <div className="mt-4 rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="inline-flex items-center gap-2 font-display text-[15px] font-bold">
            <Users className="h-4 w-4 text-primary" /> Historial de campañas
          </h3>
          {isLoading && <div className="mt-3 h-16 animate-pulse rounded-[12px] bg-muted" />}
          {!isLoading && byChannel.length === 0 && (
            <p className="mt-3 rounded-[12px] border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
              Todavía no has creado campañas por {channel === "email" ? "correo" : "push"}. La primera que envíes
              aparecerá aquí con sus clics.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {byChannel.map((c) => {
              const noClick = Math.max(0, c.sent_count - c.click_count);
              return (
                <li key={c.id} className="rounded-[12px] border border-border/60 p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold">{c.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {c.subject || "Sin asunto"} ·{" "}
                        {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString("es") : "sin fecha"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                        c.status === "scheduled" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {c.status === "scheduled" ? "Programada" : c.status === "sent" ? "Enviada" : "Borrador"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11.5px] font-semibold">
                    <span className="rounded-[10px] bg-muted px-2 py-1">Enviados {c.sent_count}</span>
                    <span className="inline-flex items-center gap-1 rounded-[10px] bg-[#3FBE8F]/15 px-2 py-1 text-[#3FBE8F]">
                      <MousePointerClick className="h-3 w-3" /> Clics {c.click_count}
                    </span>
                    <span className="rounded-[10px] bg-muted px-2 py-1">Sin abrir {noClick}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

const inputCls =
  "h-12 w-full rounded-[10px] border-[1.5px] border-border bg-card px-3 text-[14px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20";
const inputSm =
  "h-11 w-full rounded-[10px] border-[1.5px] border-border bg-card px-3 text-[13px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
