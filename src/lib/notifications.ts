/** Notificaciones del navegador + recordatorios de inactividad. */
import { supabase } from "@/integrations/supabase/client";

const VAPID = import.meta.env['VITE_VAPID_PUBLIC_KEY'] as string | undefined;

export function pushSupported() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
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

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  if (VAPID) {
    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: json.endpoint!,
          p256dh: json.keys?.p256dh ?? null,
          auth: json.keys?.auth ?? null,
          user_agent: navigator.userAgent,
        },
        { onConflict: "endpoint" },
      );
    } catch (e) {
      console.error("push subscribe", e);
    }
  }

  await supabase.from("notification_prefs").upsert({ user_id: userId, push_enabled: true });
  await reg.showNotification("Notificaciones activadas 🕊️", {
    body: "Te avisaremos de la Palabra del día, tu racha y tus consultas.",
    icon: "/icon-192.png",
  });
  return { ok: true, message: "Notificaciones activadas." };
}

export async function disablePush(userId: string) {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
  } catch (e) {
    console.error(e);
  }
  await supabase.from("notification_prefs").upsert({ user_id: userId, push_enabled: false });
}

export async function setEmailEnabled(userId: string, enabled: boolean) {
  await supabase.from("notification_prefs").upsert({ user_id: userId, email_enabled: enabled });
}

export async function getPrefs(userId: string) {
  const { data } = await supabase
    .from("notification_prefs")
    .select("email_enabled, push_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? { email_enabled: true, push_enabled: false };
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
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (reg) await reg.showNotification(r.title, { body: r.body, icon: "/icon-192.png" });
    else new Notification(r.title, { body: r.body });
  } catch (e) {
    console.error(e);
  }
}
