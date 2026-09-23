import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/community/media")({ server: { handlers: { GET: async ({ request }) => {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const params = new URL(request.url).searchParams;
  const id = params.get("id"), type = params.get("type"), kind = params.get("kind");
  if (!url || !key || !service || !id || !/^[0-9a-f-]{36}$/i.test(id) || !["post", "reply"].includes(type || "") || !["audio", "image"].includes(kind || "")) return new Response(null, { status: 404 });
  const db = createClient(url, service, { auth: { persistSession: false } });
  // Images/audio are only fetched by authenticated members. No storage path is exposed in the feed or URL.
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return new Response(null, { status: 401 });
  const auth = createClient(url, key, { auth: { persistSession: false } });
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user) return new Response(null, { status: 401 });
  const table = type === "post" ? "community_posts" : "community_replies";
  if (type === "post" && kind === "audio") return new Response(null, { status: 404 });
  const column = kind === "image" ? "image_path" : "audio_path";
  const { data } = await db.from(table).select(column).eq("id", id).maybeSingle();
   const path: unknown = (data as Record<string, unknown> | null)?.[column];
  if (typeof path !== "string") return new Response(null, { status: 404 });
  // All published conversations are open to signed-in members, but abandoned uploads
  // and files from removed posts are not. The storage path is never returned to clients.
  if (type === "reply") {
    const { data: reply } = await db.from("community_replies").select("post_id").eq("id", id).maybeSingle();
    if (!reply?.post_id || !(await db.from("community_posts").select("id").eq("id", reply.post_id).maybeSingle()).data) return new Response(null, { status: 404 });
  }
  const { data: file, error } = await db.storage.from("community-media").download(path);
  if (error || !file) return new Response(null, { status: 404 });
   const extension = typeof path === "string" ? path.split(".").pop()?.toLowerCase() : undefined;
   const contentTypes: Record<string, string> = { webm: "audio/webm", m4a: "audio/mp4", mp3: "audio/mpeg", ogg: "audio/ogg", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
   return new Response(file, { headers: { "Content-Type": contentTypes[extension ?? ""] ?? file.type, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
} } } });