/** Notificaciones del navegador + recordatorios de inactividad. */
import { supabase } from "@/integrations/supabase/client";

let vapidCache: string | null | undefined;

/** La llave pública de push se sirve desde el servidor (dato público). */
async function getVapidKey(): Promise<string | null> {
  if (vapidCache) return vapidCache;
  try {
    const res = await fetch("/api/public/vapid-key");
    if (!res.ok) return null;
    const json = (await res.json()) as { key: string | null };
    vapidCache = json.key ?? null;
  } catch {
    vapidCache = null;
  }
  return vapidCache;
}

export function pushSupported() {
  return typeof window !== "undefined" && window.isSecureContext && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function enablePush(userId: string): Promise<{ ok: boolean; message: string }> {
  if (!pushSupported()) return { ok: false, message: "Tu navegador no permite notificaciones." };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, message: "No diste permiso para notificaciones." };

  try {
    const VAPID = await getVapidKey();
    if (!VAPID) return { ok: false, message: "No pudimos configurar los avisos externos. Intenta de nuevo más tarde." };
    await navigator.serviceWorker.register("/sw.js");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription() ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return { ok: false, message: "No pudimos registrar este dispositivo. Vuelve a activar los avisos." };
      const { error: subscriptionError } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: "endpoint" },
      );
      if (subscriptionError) return { ok: false, message: "El permiso está concedido, pero no pudimos guardar el dispositivo. Intenta activarlo otra vez." };
  const { error: prefsError } = await supabase.from("notification_prefs").upsert({ user_id: userId, push_enabled: true });
  if (prefsError) return { ok: false, message: "No pudimos guardar la activación. Intenta de nuevo." };
  const enabledOptions: NotificationOptions = {
    body: "Te avisaremos de la Palabra del día, tu racha y tus consultas.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "origen-push-enabled",
    data: { url: "/dashboard" },
  };
  // @ts-expect-error renotify no está tipado en NotificationOptions estándar del DOM
  enabledOptions.renotify = false;
  await reg.showNotification("ORÍGEN · Avisos externos activados", enabledOptions).catch(() => undefined);
  return { ok: true, message: "Este dispositivo quedó registrado para recibir avisos fuera de ORÍGEN." };
  } catch {
    return { ok: false, message: "No pudimos activar los avisos externos. Abre ORÍGEN en tu navegador; en iPhone, agrégala primero a la pantalla de inicio." };
  }
}

export async function disablePush(userId: string) {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      if (error) throw error;
      await sub.unsubscribe();
    }
  } catch (e) {
    throw new Error("No pudimos desactivar este dispositivo. Intenta de nuevo.");
  }
  const { error } = await supabase.from("notification_prefs").upsert({ user_id: userId, push_enabled: false });
  if (error) throw new Error("No pudimos guardar la desactivación de avisos.");
}

export async function setEmailEnabled(userId: string, enabled: boolean) {
  const { error } = await supabase.from("notification_prefs").upsert({ user_id: userId, email_enabled: enabled });
  if (error) throw new Error("No pudimos guardar la preferencia de correos.");
}

export async function getPrefs(userId: string) {
  const { data, error } = await supabase
    .from("notification_prefs")
    .select("email_enabled, push_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("No pudimos leer tus preferencias de avisos.");
  return data ?? { email_enabled: true, push_enabled: false };
}

export async function hasPushSubscription(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  try { const reg = await navigator.serviceWorker.getRegistration("/sw.js"); return Boolean(await reg?.pushManager.getSubscription()); }
  catch { return false; }
}

/* ---------- Recordatorios locales ---------- */

const LAST_SEEN = "origen_last_seen";
const LAST_REMINDER = "origen_last_reminder";

export type LocalReminder = { title: string; body: string; kind: "palabra" | "racha" | "inactividad" };

/** Marca la visita de hoy y devuelve un recordatorio si corresponde. */
export function checkLocalReminder(): LocalReminder | null {
  if (typeof window === "undefined") return null;
  const today = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem(LAST_SEEN);
  localStorage.setItem(LAST_SEEN, today);
  if (localStorage.getItem(LAST_REMINDER) === today) return null;
  localStorage.setItem(LAST_REMINDER, today);

  if (!last) return null;
  const days = Math.round((Date.parse(today) - Date.parse(last)) / 86400000);
  if (days >= 3)
    return {
      kind: "inactividad",
      title: "Te extrañamos en ORÍGEN",
      body: `Pasaron ${days} días. Tu camino sigue esperándote justo donde lo dejaste.`,
    };
  if (days >= 1)
    return {
      kind: "palabra",
      title: "Tu Palabra de hoy ya está lista",
      body: "Dos minutos hoy sostienen tu racha y tu paz.",
    };
  return null;
}

export async function showLocalNotification(r: LocalReminder) {
  if (permissionState() !== "granted") return;
  try {
    const title = `tuorigen.app · ${r.title}`;
    const options: NotificationOptions = {
      body: r.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `origen-local-${r.kind}`,
      data: { url: "/dashboard" },
    };
    // @ts-expect-error renotify no está tipado en NotificationOptions estándar del DOM
    options.renotify = false;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (reg) await reg.showNotification(title, options);
    else new Notification(title, options);
  } catch (e) {
    console.error(e);
  }
}
