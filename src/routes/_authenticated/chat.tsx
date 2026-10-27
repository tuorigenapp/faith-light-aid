import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, MessageCircle, HeartHandshake, Lock, Clock, Leaf, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getUserPlan, getDailyUsage, PLAN_LIMITS } from "@/lib/plan";
import { formatHojas, spendDailyAccess } from "@/lib/gems";
import { Link } from "@tanstack/react-router";
import { msUntilAppDayReset, formatCountdown } from "@/lib/app-day";
import { confirmDeletion } from "@/lib/deletion-confirmation";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { MentorConversationHistory, type MentorHistoryTab } from "@/components/MentorConversationHistory";
import { listMentorConversations, trashMentorConversation, restoreMentorConversation, deleteMentorConversationForever } from "@/lib/mentor-trash.functions";
import { canRecoverMentorConversation } from "@/lib/mentor-trash";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [
    { title: "Conversa con Ruth Esther — ORÍGEN" },
    { name: "description", content: "Conversa con tu mentora espiritual de ORÍGEN, vuelve a tu historial y recupera conversaciones desde la papelera durante 30 días." },
    { property: "og:image", content: "https://tuorigen.app/og/chat.jpg" }, { name: "twitter:image", content: "https://tuorigen.app/og/chat.jpg" }, { property: "og:title", content: "Conversa con Ruth Esther — ORÍGEN" },
    { property: "og:description", content: "Acompañamiento espiritual cristiano con historial privado y papelera recuperable durante 30 días." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ChatPage,
});

function useCountdownToMidnight() {
  const [remaining, setRemaining] = useState(() => msUntilAppDayReset());
  useEffect(() => {
    const t = setInterval(() => setRemaining(msUntilAppDayReset()), 1000);
    return () => clearInterval(t);
  }, []);
  return formatCountdown(remaining);
}

function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState<MentorHistoryTab>("history");
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const listConversations = useServerFn(listMentorConversations);
  const trashConversation = useServerFn(trashMentorConversation);
  const restoreConversation = useServerFn(restoreMentorConversation);
  const destroyConversation = useServerFn(deleteMentorConversationForever);

  const conversationQuery = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: () => listConversations(),
    refetchInterval: 60_000,
  });
  const allConversations = conversationQuery.data?.conversations ?? [];
  const serverNow = conversationQuery.data
    ? conversationQuery.data.serverNow + Math.max(0, now - conversationQuery.dataUpdatedAt)
    : now;
  const conversations = allConversations.filter(c => c.deleted_at === null);
  const trashed = allConversations.filter(c => canRecoverMentorConversation(c.deleted_at, serverNow))
    .sort((a, b) => Date.parse(b.deleted_at ?? "") - Date.parse(a.deleted_at ?? ""));
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const { data: gate } = useQuery({
    queryKey: ["chat-gate", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const plan = await getUserPlan(user.id);
      const used = await getDailyUsage(user.id, "chat_message");
      const limit = PLAN_LIMITS[plan].chat_message_per_day;
      return { plan, used, limit, remaining: limit === Infinity ? Infinity : Math.max(0, limit - used) };
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-hojas-chat", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      return (await supabase.from("profiles").select("gems").eq("id", user.id).maybeSingle()).data;
    },
  });

  useEffect(() => {
    if (conversationQuery.data && (!activeId || !conversations.some(c => c.id === activeId))) {
      setActiveId(conversations[0]?.id ?? null);
    }
  }, [conversationQuery.data, activeId]);

  async function newConversation() {
    if (!user) return;
    const { data, error } = await supabase.from("conversations").insert({ user_id: user.id, title: "Nueva conversación" }).select().single();
    if (error) return toast.error("No pudimos crear la conversación. Intenta de nuevo.");
    await qc.invalidateQueries({ queryKey: ["conversations", user.id] });
    setActiveId(data.id);
    setHistoryTab("history");
  }

  async function deleteConversation(id: string) {
    if (pending || !await confirmDeletion("Esta conversación irá a la papelera con todos sus mensajes. Puedes restaurarla durante 30 días.")) return;
    setPending(true);
    try {
      const result = await trashConversation({ data: { id } });
      if (!result.ok) return toast.error("No pudimos mover la conversación a la papelera. Intenta de nuevo.");
      if (activeId === id) setActiveId(null);
      await refreshHistory(id);
      toast.success("Conversación movida a la papelera", { description: "Puedes restaurarla durante 30 días." });
    } catch { toast.error("No pudimos mover la conversación a la papelera. Revisa tu conexión."); }
    finally { setPending(false); }
  }

  async function refreshHistory(id: string) {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["conversations", user?.id] }),
      qc.invalidateQueries({ queryKey: ["messages", id] }),
      qc.invalidateQueries({ queryKey: ["historial-general"] }),
    ]);
  }

  async function restore(id: string) {
    if (pending) return;
    setPending(true);
    try {
      const result = await restoreConversation({ data: { id } });
      if (!result.ok) { await refreshHistory(id); return toast.error(result.message); }
      await refreshHistory(id);
      setHistoryTab("history");
      setActiveId(id);
      setShowHistory(false);
      toast.success("Conversación restaurada", { description: "Tus mensajes siguen aquí." });
    } catch { toast.error("No pudimos restaurar la conversación. Revisa tu conexión e intenta de nuevo."); }
    finally { setPending(false); }
  }

  async function destroy(id: string) {
    if (pending || !await confirmDeletion("Esta conversación y todos sus mensajes se eliminarán para siempre. No podrás recuperarlos.")) return;
    setPending(true);
    try {
      const result = await destroyConversation({ data: { id } });
      if (!result.ok) return toast.error("No pudimos eliminar la conversación. Intenta de nuevo.");
      try { localStorage.removeItem(`chat-draft-${id}`); } catch { /* optional draft */ }
      await refreshHistory(id);
      toast.success("Conversación eliminada para siempre");
    } catch { toast.error("No pudimos eliminar la conversación. Revisa tu conexión."); }
    finally { setPending(false); }
  }

  const history = (mobile: boolean) => <MentorConversationHistory
    conversations={conversations} trashed={trashed} tab={historyTab} onTab={setHistoryTab}
    activeId={activeId} onPick={id => { setActiveId(id); if (mobile) setShowHistory(false); }}
    onTrash={deleteConversation} onRestore={restore} onDestroy={destroy} pending={pending}
    loading={conversationQuery.isLoading} error={conversationQuery.isError}
    onRetry={() => { void conversationQuery.refetch(); }} now={serverNow}
  />;

  const locked = !!gate && gate.remaining === 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen bg-aura-top">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-border flex-col bg-card/70 backdrop-blur">
        <div className="p-4 border-b border-border">
          <button onClick={newConversation} className="w-full h-11 rounded-[12px] btn-primary-gradient inline-flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />Nueva conversación
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {history(false)}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Ruth Esther header */}
        <div className="border-b border-border bg-card/70 backdrop-blur px-4 py-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-gradient shadow-glow grid place-items-center text-white">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-[15px] leading-none">Ruth Esther</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Mentora · método ORIGEN</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-brand-soft px-2.5 py-1 rounded-full">
              <Leaf className="w-3.5 h-3.5" />{formatHojas(profile?.gems)}
            </span>
            <Button variant="secondary" onClick={() => setShowHistory(true)} className="lg:hidden inline-flex min-h-11 items-center gap-1 rounded-[12px] px-3 text-xs font-bold">
              <MessageCircle className="w-4 h-4" />Historial{conversations?.length ? ` (${conversations.length})` : ""}
            </Button>
            <Button variant="ghost" size="icon" onClick={newConversation} aria-label="Nueva conversación" title="Nueva conversación" className="lg:hidden h-11 w-11 shrink-0 rounded-[12px] text-primary">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {activeId && conversations.some(c => c.id === activeId) ? (
          <ChatWindow
            key={activeId}
            conversationId={activeId}
            locked={locked}
            gateLimit={gate?.limit as number | undefined}
            gateUsed={gate?.used}
            onSent={() => qc.invalidateQueries({ queryKey: ["chat-gate"] })}
            onSpend={() => qc.invalidateQueries({ queryKey: ["profile-hojas-chat"] })}
          />
        ) : (
          <div className="flex-1 grid place-items-center p-6 text-center">
            <div>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-glow">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h2 className="font-display font-bold text-xl mt-4">Cuéntame qué llevas hoy</h2>
              <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                Estoy aquí para escucharte con calma. Cuando quieras, empezamos.
              </p>
              <button onClick={newConversation} className="mt-5 btn-primary-gradient h-12 px-6 rounded-[14px] inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />Comenzar conversación
              </button>
            </div>
          </div>
        )}
      </main>
      {showHistory && (
        <div className="fixed inset-0 z-[60] bg-foreground/40 lg:hidden" onClick={() => setShowHistory(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-[20px] bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[18px] font-bold">Tus conversaciones</h2>
              <div className="flex gap-2">
                <Button onClick={() => { setShowHistory(false); newConversation(); }} className="min-h-11 gap-1 rounded-[12px] text-[13px]"><Plus className="w-4 h-4" />Nueva</Button>
                <Button variant="ghost" size="icon" aria-label="Cerrar historial" onClick={() => setShowHistory(false)} className="h-11 w-11"><X className="h-4 w-4" /></Button>
              </div>
            </div>
            {history(true)}
          </div>
        </div>
      )}
    </div>
  );
}

function LockedComposer({ limit }: { limit?: number }) {
  const countdown = useCountdownToMidnight();
  return (
    <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/70 flex flex-col items-center justify-center px-4 py-3 pointer-events-none">
      <div className="app-card p-4 max-w-sm w-full text-center pointer-events-auto">
        <div className="mx-auto w-11 h-11 rounded-2xl bg-secondary grid place-items-center text-primary">
          <Clock className="w-5 h-5" />
        </div>
        <p className="font-display font-bold text-sm mt-2">Ya usaste tu {limit ?? 1} conversación de hoy</p>
        <p className="text-xs text-muted-foreground mt-1">
          En el plan Explorador el chat se renueva cada día a las 12:00 PM. Vuelve en:
        </p>
        <p className="font-mono font-bold text-lg text-primary mt-1 tabular-nums">{countdown}</p>
        <Link to="/membresia" className="mt-3 btn-primary-gradient w-full h-11 rounded-[12px] inline-flex items-center justify-center gap-2 text-sm">
          <Lock className="w-3.5 h-3.5" />Desbloquear con Camino Origen
        </Link>
      </div>
    </div>
  );
}

function ChatWindow({
  conversationId, locked, gateLimit, onSent, onSpend,
}: {
  conversationId: string;
  locked: boolean;
  gateLimit?: number;
  gateUsed?: number;
  onSent: () => void;
  onSpend: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages, isLoading: loadingHistory } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at");
      return (data ?? []).map((m): UIMessage => ({
        id: m.id,
        role: (m.role === "assistant" || m.role === "system" || m.role === "user") ? m.role : "user",
        parts: (typeof m.content === "string"
          ? [{ type: "text", text: m.content }]
          : Array.isArray(m.content) ? (m.content as unknown as UIMessage["parts"]) : [{ type: "text", text: String(m.content ?? "") }]),
      }));
    },
  });

  const { messages, sendMessage, status, setMessages } = useChat({
    id: conversationId,
    messages: initialMessages ?? [],
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: async ({ message }) => {
      if (!user) return;
      await supabase.from("messages").insert({
        conversation_id: conversationId, user_id: user.id,
        role: "assistant", content: message.parts as never,
      });
      // Cobra 1 hoja por el DÍA de acceso al chat (no por respuesta).
      await spendDailyAccess("chat", 1, { conversation_id: conversationId });
      onSpend();
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
    onError: async (e) => {
      toast.error("No pude responderte ahora. Tu mensaje quedó guardado.");
      const text = e.message.includes("402")
        ? "Perdona, en este momento no puedo responderte. Tu mensaje quedó guardado, vuelve en un rato."
        : "No pude responderte ahora. Tu mensaje quedó guardado; intentemos de nuevo en unos minutos.";
      const fallback: UIMessage = { id: crypto.randomUUID(), role: "assistant", parts: [{ type: "text", text }] };
      setMessages((prev) => [...prev, fallback]);
      if (user) {
        await supabase.from("messages").insert({ conversation_id: conversationId, user_id: user.id, role: "assistant", content: fallback.parts as never });
      }
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  useEffect(() => { if (initialMessages) setMessages(initialMessages); }, [conversationId, initialMessages, setMessages]);
  useEffect(() => { inputRef.current?.focus(); }, [conversationId, status]);
  useEffect(() => { try { setInput(localStorage.getItem(`chat-draft-${conversationId}`) ?? ""); } catch { /* ignore */ } }, [conversationId]);
  useEffect(() => { try { if (input) localStorage.setItem(`chat-draft-${conversationId}`, input); } catch { /* ignore */ } }, [input, conversationId]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function handleSend() {
    if (!input.trim() || !user || locked) return;
    const text = input.trim();
    setInput("");
    try { localStorage.removeItem(`chat-draft-${conversationId}`); } catch { /* ignore */ }
    await supabase.from("messages").insert({
      conversation_id: conversationId, user_id: user.id,
      role: "user", content: [{ type: "text", text }] as never,
    });
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      activity_type: "chat_message",
      activity_date: new Date().toISOString().slice(0, 10),
      reference_id: conversationId,
      metadata: {} as never,
    });
    if (messages.length === 0) {
      await supabase.from("conversations").update({ title: text.slice(0, 50), updated_at: new Date().toISOString() }).eq("id", conversationId);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } else {
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    }
    sendMessage({ text });
    onSent();
  }

  const loading = status === "submitted" || status === "streaming";

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-4">
          {loadingHistory && (
            <div className="space-y-3 animate-pulse">
              <div className="h-16 rounded-2xl bg-secondary/60 w-2/3" />
              <div className="h-12 rounded-2xl bg-secondary/40 w-1/2 ml-auto" />
            </div>
          )}
          {!loadingHistory && messages.length === 0 && (
            <div className="app-card p-5 bg-brand-soft">
              <div className="flex items-start gap-3">
                <HeartHandshake className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-display font-bold text-[15px]">Estoy aquí, contigo.</p>
                  <p className="text-sm text-muted-foreground mt-1">Cuéntame lo que sientes, lo que te preocupa, lo que buscas romper. Sin juicio, sin prisa.</p>
                </div>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
              <div className={cn("shrink-0 w-8 h-8 rounded-full grid place-items-center text-xs font-bold shadow-soft",
                m.role === "user" ? "bg-secondary text-primary" : "bg-brand-gradient text-white"
              )}>
                {m.role === "user" ? "Tú" : "R"}
              </div>
              <div className={cn("rounded-2xl px-4 py-3 max-w-[82%] text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-md"
                  : "bg-card border border-border rounded-tl-md shadow-soft"
              )}>
                {m.parts.map((p, i) => p.type === "text" ? <span key={i} className="whitespace-pre-wrap">{p.text}</span> : null)}
                {m.role === "assistant" && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground/70 flex items-center gap-1">
                    <Leaf className="w-3 h-3" />1 hoja de sanación
                  </p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="shrink-0 w-8 h-8 rounded-full bg-brand-gradient grid place-items-center text-white text-xs font-bold">R</div>
              <div className="rounded-2xl px-4 py-3 bg-card border border-border text-sm text-muted-foreground italic">Escribiendo...</div>
            </div>
          )}
        </div>
      </div>
      <div className="relative border-t border-border bg-card/85 backdrop-blur p-3">
        {locked && <LockedComposer limit={gateLimit} />}
        <div className={cn("max-w-2xl mx-auto flex gap-2 items-end", locked && "pointer-events-none opacity-40 blur-[1px]")}>
          <Textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Comparte lo que sientes hoy..."
            className="min-h-12 max-h-40 resize-none rounded-[14px] bg-secondary/40 border-border" disabled={loading || locked} />
          <button onClick={handleSend} disabled={loading || locked || !input.trim()}
            className="h-12 w-12 rounded-[14px] btn-primary-gradient grid place-items-center disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className={cn("text-[10px] text-muted-foreground mt-2 text-center max-w-2xl mx-auto", locked && "opacity-40 blur-[1px]")}>
          Esta conversación no reemplaza apoyo psicológico profesional cuando lo necesites.
        </p>
      </div>
    </>
  );
}
