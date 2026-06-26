import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, Trash2, MessageCircle, Sparkles, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Consultor IA — Reconectando" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: conversations } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("conversations").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    if (!activeId && conversations && conversations.length > 0) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  async function newConversation() {
    if (!user) return;
    const { data, error } = await supabase.from("conversations").insert({ user_id: user.id, title: "Nueva conversación" }).select().single();
    if (error) return toast.error(error.message);
    setActiveId(data.id);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }

  async function deleteConversation(id: string) {
    await supabase.from("conversations").delete().eq("id", id);
    if (activeId === id) setActiveId(null);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-screen">
      <aside className="hidden lg:flex w-72 border-r border-border flex-col bg-card">
        <div className="p-4 border-b border-border">
          <Button onClick={newConversation} className="w-full bg-gold text-gold-foreground hover:bg-gold/90"><Plus className="w-4 h-4 mr-2" />Nueva conversación</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {(conversations ?? []).map(c => (
            <div key={c.id} className={cn("group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-1", activeId === c.id ? "bg-accent" : "hover:bg-accent/50")}
              onClick={() => setActiveId(c.id)}>
              <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm truncate">{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} className="opacity-0 group-hover:opacity-100">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
          {conversations && conversations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-8 px-4">Empieza una conversación con el Consultor Espiritual.</p>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {activeId ? (
          <ChatWindow key={activeId} conversationId={activeId} />
        ) : (
          <div className="flex-1 grid place-items-center p-8 text-center">
            <div>
              <div className="w-16 h-16 rounded-full bg-divine grid place-items-center text-white mx-auto"><Sparkles className="w-7 h-7" /></div>
              <h2 className="font-display text-2xl mt-4">Asistente de Restauración Espiritual</h2>
              <p className="text-muted-foreground mt-2 max-w-md">Empieza una nueva conversación. Te escucho sin juzgar, con compasión y palabra.</p>
              <Button onClick={newConversation} className="mt-6 bg-gold text-gold-foreground hover:bg-gold/90"><Plus className="w-4 h-4 mr-2" />Nueva conversación</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ChatWindow({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at");
      return (data ?? []).map((m: any): UIMessage => ({
        id: m.id, role: m.role,
        parts: typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content,
      }));
    },
  });

  const { messages, sendMessage, status, setMessages } = useChat({
    id: conversationId,
    messages: initialMessages ?? [],
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: async ({ message }) => {
      if (!user) return;
      // Persist assistant message
      await supabase.from("messages").insert({
        conversation_id: conversationId, user_id: user.id,
        role: "assistant", content: message.parts as any,
      });
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
    onError: async (e) => {
      const text = e.message.includes("402")
        ? "El consultor IA no puede responder ahora porque los créditos del servicio están agotados. Tu mensaje quedó guardado; recarga créditos de IA para activar respuestas reales."
        : "No pude responder ahora. Tu mensaje quedó guardado; intenta nuevamente en unos minutos.";
      const fallback: UIMessage = { id: crypto.randomUUID(), role: "assistant", parts: [{ type: "text", text }] };
      setMessages((prev) => [...prev, fallback]);
      if (user) {
        await supabase.from("messages").insert({ conversation_id: conversationId, user_id: user.id, role: "assistant", content: fallback.parts as any });
      }
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      toast.error(text);
    },
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [conversationId, initialMessages, setMessages]);

  useEffect(() => { inputRef.current?.focus(); }, [conversationId, status]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function handleSend() {
    if (!input.trim() || !user) return;
    const text = input.trim();
    setInput("");
    // Persist user message
    await supabase.from("messages").insert({
      conversation_id: conversationId, user_id: user.id,
      role: "user", content: [{ type: "text", text }],
    });
    // Update conversation title if first message
    if (messages.length === 0) {
      await supabase.from("conversations").update({ title: text.slice(0, 50), updated_at: new Date().toISOString() }).eq("id", conversationId);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } else {
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    }
    sendMessage({ text });
  }

  const loading = status === "submitted" || status === "streaming";

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <Card className="p-6 bg-gold/5 border-gold/30 rounded-[1.7rem]">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="font-display text-base">Estoy aquí para escucharte.</p>
                  <p className="text-sm text-muted-foreground mt-1">Comparte lo que sientes, lo que te preocupa o lo que buscas. No estás solo(a).</p>
                </div>
              </div>
            </Card>
          )}
          {messages.length === 0 && (
            <Card className="p-5 rounded-[1.7rem] border-primary/20 bg-primary/5">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground leading-relaxed">
                  Si el consultor no responde, puede ser por falta temporal de créditos de IA. Tu mensaje queda guardado y podrás continuar cuando el servicio vuelva a estar activo.
                </div>
              </div>
            </Card>
          )}
          {messages.map(m => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn("shrink-0 w-8 h-8 rounded-full grid place-items-center text-xs font-medium",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-divine text-white"
              )}>
                {m.role === "user" ? "Tú" : "✦"}
              </div>
              <div className={cn("rounded-2xl px-4 py-3 max-w-[85%]",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
              )}>
                {m.parts.map((p, i) => p.type === "text" ? <span key={i} className="whitespace-pre-wrap text-sm leading-relaxed">{p.text}</span> : null)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-divine grid place-items-center text-white text-xs">✦</div>
              <div className="rounded-2xl px-4 py-3 bg-card border border-border text-sm text-muted-foreground italic">Reflexionando...</div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <Textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Comparte lo que sientes hoy..." className="min-h-12 max-h-40 resize-none" disabled={loading} />
            <Button onClick={handleSend} disabled={loading || !input.trim()} className="bg-gold text-gold-foreground hover:bg-gold/90 h-12">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">Esta herramienta no reemplaza ayuda psicológica, psiquiátrica o médica profesional.</p>
        </div>
      </div>
    </>
  );
}
