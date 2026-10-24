/**
 * Web Push (RFC 8291 / aes128gcm) + VAPID firmado con Web Crypto.
 * Sin dependencias de Node: funciona en el runtime de la app.
 */

import { isTrustedPushEndpoint } from "./push-endpoint";

const enc = new TextEncoder();

function b64urlToBytes(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function bytesToB64url(b: Uint8Array): string {
  let s = "";
  for (const byte of b) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

async function vapidHeader(endpoint: string, publicKey: string, privateKey: string, subject: string) {
  const aud = new URL(endpoint).origin;
  const raw = b64urlToBytes(publicKey);
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: bytesToB64url(raw.slice(1, 33)),
    y: bytesToB64url(raw.slice(33, 65)),
    d: privateKey,
    ext: true,
  };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64url(
    enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })),
  );
  const data = enc.encode(`${header}.${payload}`);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, data as BufferSource));
  return `vapid t=${header}.${payload}.${bytesToB64url(sig)}, k=${publicKey}`;
}

async function encryptPayload(p256dh: string, authSecret: string, plaintext: string) {
  const uaPublic = b64urlToBytes(p256dh);
  const auth = b64urlToBytes(authSecret);

  const local = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublic = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic as BufferSource, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256));

  const prk = await hkdf(
    auth,
    shared,
    concat(enc.encode("WebPush: info\0"), uaPublic, localPublic),
    32,
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, prk, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, prk, enc.encode("Content-Encoding: nonce\0"), 12);

  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["encrypt"]);
  const body = concat(enc.encode(plaintext), new Uint8Array([2]));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce as BufferSource }, aesKey, body as BufferSource),
  );

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, new Uint8Array([localPublic.length]), localPublic, cipher);
}

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
};

export type PushMessage = { title: string; body: string; url?: string; tag?: string };

/** Envía una notificación. Devuelve el status HTTP del servicio de push. */
export async function sendPush(sub: PushSubscriptionRow, message: PushMessage): Promise<number> {
  if (!isTrustedPushEndpoint(sub.endpoint)) return 400;
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:supportorigenapp@gmail.com";
  if (!publicKey || !privateKey) throw new Error("VAPID keys missing");
  if (!sub.p256dh || !sub.auth) return 400;

  const url = message.url ?? "/dashboard";
  const title = message.title.startsWith("tuorigen.app")
    ? message.title
    : `tuorigen.app · ${message.title}`;
  const fullPayload = {
    title,
    body: message.body,
    url,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: message.tag ?? `origen-${url}`,
  };

  const payload = await encryptPayload(sub.p256dh, sub.auth, JSON.stringify(fullPayload));
  const res = await fetch(sub.endpoint, {
    method: "POST",
    redirect: "manual",
    headers: {
      Authorization: await vapidHeader(sub.endpoint, publicKey, privateKey, subject),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "normal",
    },
    body: payload as BodyInit,
  });
  return res.status;
}
