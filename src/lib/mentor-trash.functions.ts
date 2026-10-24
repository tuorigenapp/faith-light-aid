import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canRecoverMentorConversation } from "./mentor-trash";

const conversationInput = z.object({ id: z.string().uuid() });

export const listMentorConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("list_mentor_conversations");
    if (error) throw new Error("No pudimos cargar tus conversaciones. Revisa tu conexión e intenta de nuevo.");
    return { conversations: data ?? [], serverNow: Date.now() };
  });

export const trashMentorConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => conversationInput.parse(data))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("trash_mentor_conversation", { conversation_id: data.id });
    return { ok: !result.error && result.data === true };
  });

export const restoreMentorConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => conversationInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: conversation, error } = await context.supabase.from("conversations")
      .select("deleted_at").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (error || !conversation || !canRecoverMentorConversation(conversation.deleted_at, Date.now())) {
      return { ok: false, message: "Esta conversación ya no está disponible en la papelera. Actualiza el historial." };
    }
    const result = await context.supabase.rpc("restore_mentor_conversation", { conversation_id: data.id });
    return { ok: !result.error && result.data === true, message: "No pudimos restaurar la conversación. Intenta de nuevo." };
  });

export const deleteMentorConversationForever = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => conversationInput.parse(data))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("delete_mentor_conversation", { conversation_id: data.id });
    return { ok: !result.error && result.data === true };
  });