/** Acepta la clave del entorno o la clave privada del programador de envíos. */
export async function authorizedCaller(request: Request, secret: string | undefined) {
  if (secret && request.headers.get("x-push-secret") === secret) return true;
  const token = request.headers.get("x-cron-token");
  if (!token) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("cron_tokens" as never).select("token").eq("name", "scheduler").maybeSingle();
  return !!data && (data as { token: string }).token === token;
}
