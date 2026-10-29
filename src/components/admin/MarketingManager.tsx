import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Bot,
  Eye,
  FlaskConical,
  Image as ImageIcon,
  Loader2,
  Mail,
  MailOpen,
  MousePointerClick,
  Pause,
  RefreshCw,
  Send,
  Smartphone,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  getAiMarketing,
  pauseCampaign,
  refreshTemplates,
  scheduleTestPush,
  sendCampaignNow,
  sendTestEmail,
  setAiMarketing,
  getAudienceCount,
} from "@/lib/marketing.functions";
import {
  PUSH_ICONS,
  SHORTCODES,
  TEMPLATE_CATEGORIES,
  buildPush,
  buildTemplates,
  renderEmailHtml,
  type EmailTemplate,
  type PushStyle,
  type TemplateCategory,
} from "@/lib/marketing-render";
import { confirmDeletion } from "@/lib/deletion-confirmation";

type Channel = "email" | "push";
type Kind = "marketing" | "remarketing";

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
  status: string;
  scheduled_at: string | null;
  ends_at: string | null;
  sent_count: number;
  click_count: number;
  open_count: number;
  created_at: string;
  last_sent_at: string | null;
  push_style: string;
  push_icon: string | null;
  kind: string;
  ai_generated: boolean;
  discount_label: string | null;
  template_id: string | null;
};

const AUDIENCES: { value: string; label: string; remarketing?: boolean }[] = [
  { value: "all", label: "Todos los registrados" },
  { value: "buyers", label: "Compradores (Camino Origen)" },
  { value: "non_buyers", label: "Plan Explorador (aún no compran)" },
  { value: "active", label: "Activos esta semana" },
  { value: "inactive", label: "Sin entrar en 14 días" },
  { value: "opened", label: "Abrieron una campaña", remarketing: true },
  { value: "not_opened", label: "No abrieron una campaña", remarketing: true },
  { value: "clicked", label: "Hicieron clic en una campaña", remarketing: true },
];

const TEST_EMAIL = "infodenegociorm@gmail.com";

const empty = {
  name: "",
  subject: "",
  headline: "",
  content: "",
  image_url: "",
  button_text: "",
  button_url: "",
  discount_label: "",
  push_style: "text" as PushStyle,
  push_icon: "logo",
  audience_type: "all",
  source_campaign_id: "",
  scheduled_at: "",
  ends_at: "",
  template_id: "",
  accent: "#6d4aff",
};

/** Marketing y remarketing: correo con plantillas, push con 3 estilos, asistente 24/7 y lecturas en vivo. */
export function MarketingManager() {
  const qc = useQueryClient();
  const [channel, setChannel] = useState<Channel>("email");
  const [kind, setKind] = useState<Kind>("marketing");
  const [form, setForm] = useState(empty);
  const [preview, setPreview] = useState<null | { channel: Channel; data: typeof empty }>(null);
  const [testTo, setTestTo] = useState(TEST_EMAIL);

  const fetchAi = useServerFn(getAiMarketing);
  const saveAi = useServerFn(setAiMarketing);
  const refresh = useServerFn(refreshTemplates);
  const sendNow = useServerFn(sendCampaignNow);
  const pause = useServerFn(pauseCampaign);
  const testEmail = useServerFn(sendTestEmail);
  const testPush = useServerFn(scheduleTestPush);
  const count = useServerFn(getAudienceCount);

  const ai = useQuery({ queryKey: ["admin-ai-marketing"], queryFn: () => fetchAi() });
  const templates = useMemo(() => buildTemplates(ai.data?.variants ?? {}), [ai.data?.variants]);

  const campaigns = useQuery({
    queryKey: ["admin-marketing-campaigns"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select(
          "id, name, channel, subject, content, image_url, button_text, button_url, audience_type, status, scheduled_at, ends_at, sent_count, click_count, open_count, created_at, last_sent_at, push_style, push_icon, kind, ai_generated, discount_label, template_id",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });

  const isRemarketingAudience = AUDIENCES.find((a) => a.value === form.audience_type)?.remarketing;
  const audienceQ = useQuery({
    queryKey: ["admin-mkt-count", form.audience_type, form.source_campaign_id],
    enabled: !isRemarketingAudience,
    queryFn: () => count({ data: { audienceType: form.audience_type, listId: null } }),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });

  function payload() {
    return {
      subject: form.subject.trim() || null,
      content: form.headline.trim() && channel === "email" ? form.content : form.content,
      image_url: form.image_url.trim() || null,
      button_text: form.button_text.trim() || null,
      button_url: form.button_url.trim() || null,
      push_style: form.push_style,
      push_icon: form.push_icon,
      discount_label: form.discount_label.trim() || null,
    };
  }

  function validate() {
    if (!form.subject.trim()) throw new Error(channel === "email" ? "Escribe el asunto del correo" : "Escribe el título");
    if (form.content.trim().length < 3) throw new Error("Escribe el mensaje");
    if (channel === "push" && form.push_style === "banner" && !form.image_url.trim()) throw new Error("Pega el enlace de la imagen del banner");
    if (isRemarketingAudience && !form.source_campaign_id) throw new Error("Elige de qué campaña sale el grupo");
  }

  const save = useMutation({
    mutationFn: async (mode: "now" | "schedule") => {
      validate();
      const scheduled = mode === "schedule" && form.scheduled_at ? new Date(form.scheduled_at) : new Date();
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .insert({
          name: form.name.trim() || form.subject.trim().slice(0, 80),
          channel,
          ...payload(),
          content: form.headline.trim() && channel === "email" ? `${form.headline.trim()}\n\n${form.content}` : form.content,
          audience_type: form.audience_type,
          source_campaign_id: form.source_campaign_id || null,
          kind,
          template_id: form.template_id || null,
          status: mode === "now" ? "draft" : "scheduled",
          scheduled_at: scheduled.toISOString(),
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
          created_by: user.user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (mode === "now") return sendNow({ data: { campaignId: data.id } });
      return null;
    },
    onSuccess: (r, mode) => {
      toast.success(mode === "now" ? `Enviada${r ? ` a ${r.sent} ${channel === "email" ? "correos" : "dispositivos"}` : ""}` : "Campaña programada");
      setForm(empty);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "No pudimos guardar la campaña"),
  });

  const testEmailM = useMutation({
    mutationFn: async () => {
      validate();
      return testEmail({ data: { ...payload(), content: withHeadline(form), to: testTo.trim() } });
    },
    onSuccess: () => toast.success(`Prueba enviada a ${testTo}. Revisa también Spam o Promociones.`),
    onError: (e: Error) => toast.error(e.message),
  });

  const testPushM = useMutation({
    mutationFn: async (minutes: number) => {
      validate();
      return testPush({ data: { ...payload(), minutes } });
    },
    onSuccess: (r, minutes) => {
      if (!r.devices) toast.warning("Tu cuenta no tiene un teléfono con avisos activados. Actívalos en Perfil desde el teléfono.");
      else toast.success(minutes ? `Prueba programada para las ${new Date(r.at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}` : "Prueba enviada a tu teléfono");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const aiSave = useMutation({
    mutationFn: (v: { email: boolean; push: boolean; mode: Kind }) => saveAi({ data: v }),
    onSuccess: () => {
      toast.success("Asistente actualizado");
      void qc.invalidateQueries({ queryKey: ["admin-ai-marketing"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refreshM = useMutation({
    mutationFn: (ids: string[]) => refresh({ data: { ids } }),
    onSuccess: (_r, ids) => {
      toast.success(`${ids.length} plantillas renovadas`);
      void qc.invalidateQueries({ queryKey: ["admin-ai-marketing"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function applyTemplate(t: EmailTemplate) {
    setForm((f) => ({
      ...f,
      name: t.title,
      subject: t.subject,
      headline: t.headline,
      content: t.content,
      image_url: t.image_url,
      button_text: t.button_text,
      button_url: t.button_url,
      discount_label: t.discount_label ?? "",
      template_id: t.id,
      accent: t.accent,
    }));
    toast.success("Plantilla cargada: ajusta lo que quieras");
  }

  const settings = ai.data?.settings ?? { email: false, push: false, mode: "marketing" as Kind };
  const list = campaigns.data ?? [];
  const sentCampaigns = list.filter((c) => c.sent_count > 0 || c.status === "sent");

  return (
    <section className="mt-4 grid gap-4">
      {/* Asistente 24/7 */}
      <div className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[17px] font-bold">Asistente de marketing 24/7</h2>
            <p className="text-[13px] text-muted-foreground">
              Encendido, elige plantilla según la fecha y la temporada: 3 correos al día (9 am, 2 pm, 7 pm) y una notificación cada 2 horas
              (8 am a 10 pm). Todo queda en el historial con su vista previa.
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <ToggleRow label="Correos automáticos" on={settings.email} busy={aiSave.isPending} onChange={(v) => aiSave.mutate({ ...settings, email: v })} />
          <ToggleRow label="Push automáticas" on={settings.push} busy={aiSave.isPending} onChange={(v) => aiSave.mutate({ ...settings, push: v })} />
          <div className="flex h-12 items-center gap-1 rounded-[12px] bg-muted/50 p-1">
            {(["marketing", "remarketing"] as Kind[]).map((m) => (
              <button
                key={m}
                onClick={() => aiSave.mutate({ ...settings, mode: m })}
                className={cn("h-10 flex-1 rounded-[10px] text-[13px] font-semibold capitalize", settings.mode === m ? "bg-card text-primary shadow-soft" : "text-muted-foreground")}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selector canal + tipo */}
      <div className="flex flex-wrap gap-2">
        {(["email", "push"] as Channel[]).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={cn("inline-flex h-11 items-center gap-2 rounded-[12px] px-4 text-[14px] font-semibold", channel === c ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}
          >
            {c === "email" ? <Mail className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {c === "email" ? "Correo electrónico" : "Notificaciones push"}
          </button>
        ))}
        <div className="ml-auto flex h-11 items-center gap-1 rounded-[12px] bg-muted/50 p-1">
          {(["marketing", "remarketing"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setKind(k);
                setForm((f) => ({ ...f, audience_type: k === "remarketing" ? "not_opened" : "all" }));
              }}
              className={cn("h-9 rounded-[10px] px-3 text-[13px] font-semibold capitalize", kind === k ? "bg-card text-primary shadow-soft" : "text-muted-foreground")}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {channel === "email" && (
        <TemplateLibrary
          templates={templates}
          kind={kind}
          selected={form.template_id}
          onPick={applyTemplate}
          onRefresh={(ids) => refreshM.mutate(ids)}
          refreshing={refreshM.isPending}
        />
      )}

      {/* Editor */}
      <div className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
        <h3 className="font-display text-[17px] font-bold">
          {channel === "email" ? "Escribir correo" : "Escribir notificación"} · <span className="capitalize text-primary">{kind}</span>
        </h3>
        {channel === "email" && !form.template_id && (
          <p className="mt-1 text-[13px] text-muted-foreground">Sin plantilla: escribe tu mensaje en texto. La imagen es opcional.</p>
        )}

        {channel === "push" && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                ["text", "Solo texto", Bell],
                ["banner", "Con imagen", ImageIcon],
                ["discount", "Descuento", Tag],
              ] as const
            ).map(([v, l, Icon]) => (
              <button
                key={v}
                onClick={() => setForm((f) => ({ ...f, push_style: v, push_icon: v === "discount" ? "descuento" : f.push_icon }))}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 rounded-[12px] border-[1.5px] text-[13px] font-semibold",
                  form.push_style === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" /> {l}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={channel === "email" ? "Asunto del correo" : "Título de la notificación"}>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} maxLength={160} placeholder="Ej: [usuario], tu regalo está listo" />
          </Field>
          <Field label="Nombre interno (opcional)">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} maxLength={120} />
          </Field>
          {channel === "email" && (
            <Field label="Título grande dentro del correo (opcional)">
              <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className={inputCls} maxLength={120} />
            </Field>
          )}
          {(channel === "email" || form.push_style === "banner") && (
            <Field label={channel === "email" ? "Enlace de la imagen (opcional, vertical)" : "Enlace de la imagen del banner (horizontal 2:1)"}>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={inputCls} placeholder="https://..." />
            </Field>
          )}
          {(channel === "email" || form.push_style === "discount") && (
            <Field label="Descuento o cupón (opcional)">
              <input value={form.discount_label} onChange={(e) => setForm({ ...form, discount_label: e.target.value })} className={inputCls} maxLength={60} placeholder="Ej: 50% OFF" />
            </Field>
          )}
        </div>

        <Field label={channel === "email" ? "Texto del correo" : "Texto de la notificación"}>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={channel === "email" ? 7 : 3}
            maxLength={channel === "email" ? 6000 : 240}
            className={cn(inputCls, "h-auto py-3")}
          />
        </Field>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SHORTCODES.map((s) => (
            <button
              key={s.code}
              title={s.desc}
              onClick={() => setForm((f) => ({ ...f, content: `${f.content}${f.content && !/\s$/.test(f.content) ? " " : ""}${s.code}` }))}
              className="h-8 rounded-[10px] bg-primary/10 px-2.5 text-[12px] font-semibold text-primary"
            >
              {s.code}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          [usuario] pone el nombre registrado de cada persona (también en el asunto). Las etiquetas de sección se vuelven botón en el correo.
        </p>

        {channel === "push" && (
          <div className="mt-3">
            <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Ícono grande (el logo de ORÍGEN va siempre al lado)</span>
            <div className="flex flex-wrap gap-2">
              {PUSH_ICONS.map((i) => (
                <button
                  key={i.key}
                  title={i.label}
                  onClick={() => setForm((f) => ({ ...f, push_icon: i.key }))}
                  className={cn("grid h-12 w-12 place-items-center rounded-[12px] border-2 bg-background", form.push_icon === i.key ? "border-primary" : "border-transparent")}
                >
                  <img src={i.src} alt={i.label} className="h-9 w-9 object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={channel === "email" ? "Texto del botón verde" : "—"}>
            {channel === "email" ? (
              <input value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} className={inputCls} maxLength={60} placeholder="Ej: Ver mi descuento" />
            ) : (
              <p className="pt-3 text-[13px] text-muted-foreground">Al tocar la notificación se abre el enlace de la derecha.</p>
            )}
          </Field>
          <Field label="Enlace al tocar (sección de ORÍGEN o URL)">
            <input value={form.button_url} onChange={(e) => setForm({ ...form, button_url: e.target.value })} className={inputCls} placeholder="/membresia" />
          </Field>
          <Field label="A quién le llega">
            <select value={form.audience_type} onChange={(e) => setForm({ ...form, audience_type: e.target.value })} className={inputCls}>
              {AUDIENCES.filter((a) => (kind === "remarketing" ? true : !a.remarketing)).map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          {isRemarketingAudience ? (
            <Field label="De qué campaña sale el grupo">
              <select value={form.source_campaign_id} onChange={(e) => setForm({ ...form, source_campaign_id: e.target.value })} className={inputCls}>
                <option value="">Elige una campaña enviada</option>
                {sentCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.channel === "email" ? "Correo" : "Push"} · {c.name} ({c.open_count} abrieron)
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="flex items-end pb-3 text-[13px] text-muted-foreground">
              {audienceQ.isLoading ? "Calculando…" : audienceQ.data ? `${audienceQ.data.count} personas registradas` : ""}
              {channel === "email" ? " · solo se envía a quien tiene correo" : " · llega a quien activó avisos en su teléfono"}
            </div>
          )}
          <Field label="Inicio (opcional; vacío = ahora)">
            <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Final (opcional)">
            <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className={inputCls} />
          </Field>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button onClick={() => setPreview({ channel, data: form })} className={secondaryBtn}>
            <Eye className="h-4 w-4" /> Vista previa
          </button>
          {channel === "email" ? (
            <div className="flex gap-2">
              <input value={testTo} onChange={(e) => setTestTo(e.target.value)} className={cn(inputCls, "h-12")} aria-label="Correo de prueba" />
              <button onClick={() => testEmailM.mutate()} disabled={testEmailM.isPending} className={cn(secondaryBtn, "shrink-0 px-4")}>
                {testEmailM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} Prueba
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => testPushM.mutate(0)} disabled={testPushM.isPending} className={cn(secondaryBtn, "flex-1")}>
                <Smartphone className="h-4 w-4" /> Probar ya
              </button>
              <button onClick={() => testPushM.mutate(1)} disabled={testPushM.isPending} className={cn(secondaryBtn, "flex-1")}>
                {testPushM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} Prueba en 1 min
              </button>
            </div>
          )}
          <button onClick={() => save.mutate("schedule")} disabled={save.isPending || !form.scheduled_at} className={cn(secondaryBtn, "disabled:opacity-50")}>
            Programar
          </button>
          <button onClick={() => save.mutate("now")} disabled={save.isPending} className={primaryBtn}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar ahora
          </button>
        </div>
      </div>

      <History
        campaigns={list}
        loading={campaigns.isLoading}
        onPreview={(c) => setPreview({ channel: c.channel === "push" ? "push" : "email", data: campaignToForm(c) })}
        onPause={async (id) => {
          await pause({ data: { campaignId: id } });
          invalidate();
        }}
        onDelete={async (c) => {
          if (!(await confirmDeletion({ title: "¿Eliminar esta campaña?", body: c.name }))) return;
          await supabase.from("marketing_events").delete().eq("campaign_id", c.id);
          const { error } = await supabase.from("marketing_campaigns").delete().eq("id", c.id);
          if (error) toast.error("No pudimos eliminarla");
          invalidate();
        }}
      />

      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}

function withHeadline(f: typeof empty) {
  return f.headline.trim() ? `${f.headline.trim()}\n\n${f.content}` : f.content;
}

function campaignToForm(c: Campaign): typeof empty {
  return {
    ...empty,
    name: c.name,
    subject: c.subject ?? "",
    content: c.content,
    image_url: c.image_url ?? "",
    button_text: c.button_text ?? "",
    button_url: c.button_url ?? "",
    discount_label: c.discount_label ?? "",
    push_style: (c.push_style as PushStyle) || "text",
    push_icon: c.push_icon ?? "logo",
  };
}

function TemplateLibrary({
  templates,
  kind,
  selected,
  onPick,
  onRefresh,
  refreshing,
}: {
  templates: EmailTemplate[];
  kind: Kind;
  selected: string;
  onPick: (t: EmailTemplate) => void;
  onRefresh: (ids: string[]) => void;
  refreshing: boolean;
}) {
  const [cat, setCat] = useState<TemplateCategory>(kind === "remarketing" ? "remarketing" : "estaciones");
  const [howMany, setHowMany] = useState(5);
  const items = templates.filter((t) => t.category === cat);
  return (
    <div className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-[17px] font-bold">Plantillas ({templates.length})</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={items.length}
            value={howMany}
            onChange={(e) => setHowMany(Math.max(1, Math.min(items.length, Number(e.target.value) || 1)))}
            className="h-10 w-16 rounded-[10px] border-[1.5px] border-border bg-card px-2 text-center text-[14px]"
            aria-label="Cuántas actualizar"
          />
          <button onClick={() => onRefresh(items.slice(0, howMany).map((t) => t.id))} disabled={refreshing} className={cn(secondaryBtn, "h-10 px-3")}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Actualizar
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn("h-9 shrink-0 rounded-[10px] px-3 text-[13px] font-semibold", cat === c.key ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}
          >
            {c.label} · {c.count}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            className={cn("overflow-hidden rounded-[14px] border-2 bg-background text-left transition active:scale-[.97]", selected === t.id ? "border-primary" : "border-transparent")}
          >
            <div className="relative aspect-[3/4]">
              <img src={t.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-2" style={{ background: `linear-gradient(transparent, ${t.accent})` }}>
                <p className="line-clamp-2 font-display text-[13px] font-bold leading-tight text-primary-foreground">{t.headline}</p>
                {t.discount_label && <span className="mt-1 inline-block rounded-[8px] bg-card px-1.5 text-[11px] font-bold text-foreground">{t.discount_label}</span>}
              </div>
            </div>
            <p className="line-clamp-2 p-2 text-[12px] text-muted-foreground">{t.subject}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function History({
  campaigns,
  loading,
  onPreview,
  onPause,
  onDelete,
}: {
  campaigns: Campaign[];
  loading: boolean;
  onPreview: (c: Campaign) => void;
  onPause: (id: string) => void;
  onDelete: (c: Campaign) => void;
}) {
  const [tab, setTab] = useState<"email" | "push">("email");
  const [kindF, setKindF] = useState<"all" | Kind>("all");
  const rows = campaigns.filter((c) => (tab === "push" ? c.channel === "push" : c.channel !== "push") && (kindF === "all" || c.kind === kindF));
  const aiPush = tab === "push" ? rows.filter((c) => c.ai_generated) : [];
  const manual = tab === "push" ? rows.filter((c) => !c.ai_generated) : rows;
  return (
    <div className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-display text-[17px] font-bold">Historial en vivo</h3>
        {(["email", "push"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("h-9 rounded-[10px] px-3 text-[13px] font-semibold", tab === t ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
            {t === "email" ? "Correos" : "Push"}
          </button>
        ))}
        <select value={kindF} onChange={(e) => setKindF(e.target.value as "all" | Kind)} className="h-9 rounded-[10px] border-[1.5px] border-border bg-card px-2 text-[13px]">
          <option value="all">Todas</option>
          <option value="marketing">Marketing</option>
          <option value="remarketing">Remarketing</option>
        </select>
      </div>

      {loading && <div className="mt-3 h-20 animate-pulse rounded-[12px] bg-muted" />}
      {!loading && rows.length === 0 && (
        <div className="mt-4 grid place-items-center gap-2 py-6 text-center">
          <Send className="h-8 w-8 text-primary" />
          <p className="text-[14px] font-semibold">Tu primera campaña aparecerá aquí</p>
          <p className="text-[13px] text-muted-foreground">Verás cuántas personas la recibieron, la abrieron y tocaron el botón.</p>
        </div>
      )}

      {aiPush.length > 0 && (
        <details className="mt-3 rounded-[12px] bg-muted/40 p-3">
          <summary className="cursor-pointer text-[14px] font-semibold">
            <Bot className="mr-1 inline h-4 w-4 text-primary" /> Push del asistente ({aiPush.length}) ·{" "}
            {aiPush.reduce((n, c) => n + c.open_count, 0)} aperturas
          </summary>
          <ul className="mt-2 divide-y divide-border">
            {aiPush.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2 text-[13px]">
                <img src={PUSH_ICONS.find((i) => i.key === c.push_icon)?.src ?? "/icon-192.png"} alt="" className="h-7 w-7 object-contain" />
                <span className="min-w-0 flex-1 truncate">{c.subject}</span>
                <span className="text-muted-foreground">{fmt(c.last_sent_at ?? c.scheduled_at)}</span>
                <Metric icon={Send} v={c.sent_count} />
                <Metric icon={MailOpen} v={c.open_count} />
              </li>
            ))}
          </ul>
        </details>
      )}

      <ul className="mt-3 grid gap-2">
        {manual.map((c) => (
          <li key={c.id} className="rounded-[12px] border border-border/60 p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">
                  {c.ai_generated && <Bot className="mr-1 inline h-4 w-4 text-primary" />}
                  {c.name}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  <span className="capitalize">{c.kind}</span> · {statusLabel(c.status)} · {fmt(c.last_sent_at ?? c.scheduled_at)}
                </p>
              </div>
              <button onClick={() => onPreview(c)} className={iconBtn} aria-label="Vista previa">
                <Eye className="h-4 w-4" />
              </button>
              {c.status === "scheduled" && (
                <button onClick={() => onPause(c.id)} className={iconBtn} aria-label="Pausar">
                  <Pause className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => onDelete(c)} className={iconBtn} aria-label="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[13px]">
              <Metric icon={Send} v={c.sent_count} label="enviados" />
              <Metric icon={MailOpen} v={c.open_count} label={`abrieron${c.sent_count ? ` (${Math.round((c.open_count / c.sent_count) * 100)}%)` : ""}`} />
              <Metric icon={MousePointerClick} v={c.click_count} label="clics" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewModal({ preview, onClose }: { preview: { channel: Channel; data: typeof empty }; onClose: () => void }) {
  const f = preview.data;
  const name = "Ruth";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-3" onClick={onClose}>
      <div className="relative max-h-[92dvh] w-full max-w-[420px] overflow-auto rounded-[24px] bg-card p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Cerrar" className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-muted">
          <X className="h-5 w-5" />
        </button>
        <p className="mb-2 px-1 text-[12px] font-semibold text-muted-foreground">Vista previa con el nombre de ejemplo «{name}»</p>
        {preview.channel === "email" ? (
          <>
            <p className="mb-2 rounded-[10px] bg-muted px-3 py-2 text-[13px]">
              <b>Asunto:</b> {(f.subject || "").replace(/\[(usuario|nombre)\]/gi, name)}
            </p>
            <iframe
              title="Vista previa del correo"
              className="h-[70dvh] w-full rounded-[14px] border border-border bg-background"
              srcDoc={renderEmailHtml(
                {
                  subject: f.subject,
                  content: f.content,
                  headline: f.headline || null,
                  image_url: f.image_url || null,
                  button_text: f.button_text || null,
                  button_url: f.button_url || null,
                  discount_label: f.discount_label || null,
                  accent: f.accent,
                },
                { name },
              )}
            />
          </>
        ) : (
          <PushPreview f={f} name={name} />
        )}
      </div>
    </div>
  );
}

function PushPreview({ f, name }: { f: typeof empty; name: string }) {
  const p = buildPush(
    { subject: f.subject, content: f.content, button_url: f.button_url || null, image_url: f.image_url || null, push_style: f.push_style, push_icon: f.push_icon, discount_label: f.discount_label || null },
    name,
  );
  return (
    <div className="rounded-[20px] bg-foreground p-3">
      <div className="rounded-[18px] bg-background/10 p-3 text-background">
        <div className="flex gap-3">
          <div className="relative h-12 w-12 shrink-0">
            <img src={p.icon} alt="" className="h-12 w-12 rounded-[10px] object-contain" />
            <img src="/badge-96.png" alt="" className="absolute -bottom-1 -right-1 h-5 w-5 rounded-[4px] bg-muted-foreground p-0.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] opacity-70">ORÍGEN · tuorigen.app · ahora</p>
            <p className="text-[15px] font-semibold leading-tight">{p.title}</p>
            <p className="mt-0.5 text-[14px] leading-snug opacity-80">{p.body}</p>
          </div>
        </div>
        {p.image && <img src={p.image} alt="" className="mt-3 aspect-[2/1] w-full rounded-[14px] object-cover" />}
      </div>
      <p className="mt-2 text-center text-[12px] text-background/70">Al tocar abre: {p.url}</p>
    </div>
  );
}

function ToggleRow({ label, on, busy, onChange }: { label: string; on: boolean; busy: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      disabled={busy}
      role="switch"
      aria-checked={on}
      className={cn("flex h-12 items-center justify-between rounded-[12px] border-[1.5px] px-3 text-[14px] font-semibold", on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}
    >
      {label}
      <span className={cn("relative h-6 w-11 rounded-full transition", on ? "bg-primary" : "bg-muted")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
      </span>
    </button>
  );
}

function Metric({ icon: Icon, v, label }: { icon: typeof Send; v: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" /> <b className="text-foreground">{v}</b> {label}
    </span>
  );
}

function statusLabel(s: string) {
  return ({ draft: "Borrador", scheduled: "Programada", sending: "Enviando", sent: "Enviada", paused: "Pausada" } as Record<string, string>)[s] ?? s;
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const inputCls =
  "h-12 w-full rounded-[10px] border-[1.5px] border-border bg-card px-3 text-[14px] text-foreground outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20";
const secondaryBtn = "inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-primary/10 text-[14px] font-semibold text-primary disabled:opacity-60";
const primaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-bold text-primary-foreground shadow-[0_4px_14px_hsl(var(--primary)/.3)] disabled:opacity-60";
const iconBtn = "grid h-11 w-11 place-items-center rounded-[10px] bg-muted/60 text-muted-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
