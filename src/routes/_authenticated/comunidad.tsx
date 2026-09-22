import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { Loader2, MessageCircle, Send, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comunidad")({
  head: () => ({
    meta: [
      { title: "Comunidad ORÍGEN — preguntas y respuestas entre nosotros" },
      {
        name: "description",
        content:
          "Haz tu pregunta y responde a quien va un paso atrás. Abierto para todos, sin importar tu plan.",
      },
      { property: "og:title", content: "Comunidad ORÍGEN" },
      {
        property: "og:description",
        content: "Preguntas, respuestas y reacciones entre personas que están sanando su historia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Comunidad,
});

const TOPICS = [
  { key: "general", label: "General", emoji: "💬" },
  { key: "familia", label: "Familia", emoji: "🏠" },
  { key: "pareja", label: "Pareja", emoji: "💜" },
  { key: "ansiedad", label: "Ansiedad", emoji: "🌿" },
  { key: "fe", label: "Fe", emoji: "✝️" },
  { key: "logros", label: "Logros", emoji: "🌟" },
];

const EMOJIS = ["🙏", "💜", "🌿", "🔥", "🤝", "😭"];

type Post = {
  id: string;
  user_id: string;
  author_name: string;
  topic: string;
  title: string;
  body: string;
  created_at: string;
};
type Reply = {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
};
type Reaction = { id: string; user_id: string; target_type: string; target_id: string; emoji: string };

function Comunidad() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [topic, setTopic] = useState("todos");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [newTopic, setNewTopic] = useState("general");
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const authorName =
    profile?.display_name?.trim() ||
    profile?.full_name?.trim()?.split(" ")[0] ||
    "Alguien del camino";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["comunidad"],
    queryFn: async () => {
      const [posts, replies, reactions] = await Promise.all([
        supabase
          .from("community_posts")
          .select("id, user_id, author_name, topic, title, body, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("community_replies")
          .select("id, post_id, user_id, author_name, body, created_at")
          .order("created_at", { ascending: true })
          .limit(1000),
        supabase
          .from("community_reactions")
          .select("id, user_id, target_type, target_id, emoji")
          .limit(4000),
      ]);
      if (posts.error) throw posts.error;
      return {
        posts: (posts.data ?? []) as Post[],
        replies: (replies.data ?? []) as Reply[],
        reactions: (reactions.data ?? []) as Reaction[],
      };
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["comunidad"] });

  const createPost = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Inicia sesión para publicar.");
      if (title.trim().length < 6) throw new Error("Escribe una pregunta un poco más clara.");
      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        author_name: authorName,
        topic: newTopic,
        title: title.trim(),
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tu pregunta ya está en la comunidad.");
      setTitle("");
      setBody("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createReply = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Inicia sesión para responder.");
      const text = (replyText[postId] ?? "").trim();
      if (text.length < 2) throw new Error("Escribe tu respuesta.");
      const { error } = await supabase.from("community_replies").insert({
        post_id: postId,
        user_id: user.id,
        author_name: authorName,
        body: text,
      });
      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      setReplyText((r) => ({ ...r, [postId]: "" }));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const react = useMutation({
    mutationFn: async (v: { type: "post" | "reply"; id: string; emoji: string; mine?: string }) => {
      if (!user) throw new Error("Inicia sesión para reaccionar.");
      if (v.mine) {
        const { error } = await supabase.from("community_reactions").delete().eq("id", v.mine);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("community_reactions").insert({
        user_id: user.id,
        target_type: v.type,
        target_id: v.id,
        emoji: v.emoji,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const removePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("community_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tu pregunta se borró.");
      invalidate();
    },
    onError: () => toast.error("No pudimos borrarla. Intenta otra vez."),
  });

  const repliesByPost = useMemo(() => {
    const m = new Map<string, Reply[]>();
    for (const r of data?.replies ?? []) {
      const list = m.get(r.post_id) ?? [];
      list.push(r);
      m.set(r.post_id, list);
    }
    return m;
  }, [data]);

  const posts = (data?.posts ?? []).filter((p) => topic === "todos" || p.topic === topic);

  function reactionsFor(type: "post" | "reply", id: string) {
    const list = (data?.reactions ?? []).filter((r) => r.target_type === type && r.target_id === id);
    return EMOJIS.map((emoji) => {
      const these = list.filter((r) => r.emoji === emoji);
      return {
        emoji,
        count: these.length,
        mine: these.find((r) => r.user_id === user?.id)?.id,
      };
    });
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 pb-28 md:px-8 md:py-10">
      <section className="relative overflow-hidden rounded-[16px] p-6 text-primary-foreground shadow-glow md:p-8">
        <div className="absolute inset-0" style={{ background: "var(--gradient-primary)" }} />
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-bold">
            <Users className="h-3.5 w-3.5" /> Abierto para todos, sin plan
          </span>
          <h1 className="mt-3 font-display text-[28px] font-extrabold leading-tight md:text-[36px]">
            Comunidad ORÍGEN
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-primary-foreground/90">
            Pregunta lo que te pesa y responde a quien va un paso atrás. Aquí nadie sana solo.
          </p>
        </div>
      </section>

      {/* Nueva pregunta */}
      <section className="mt-5 rounded-[16px] border border-border bg-card p-4 shadow-soft md:p-5">
        <p className="font-display text-[17px] font-bold">Haz tu pregunta</p>
        <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TOPICS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setNewTopic(t.key)}
              className={cn(
                "h-9 shrink-0 rounded-[10px] border px-3 text-[13px] font-bold transition",
                newTopic === t.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground/70",
              )}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Cómo pongo un límite sin sentirme culpable?"
          className="mt-3 h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[15px] outline-none focus:border-primary"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Cuenta lo que está pasando (opcional)."
          className="mt-2 w-full rounded-[10px] border-[1.5px] border-border bg-background p-3 text-[15px] outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => createPost.mutate()}
          disabled={createPost.isPending}
          className="mt-3 grid h-12 w-full place-items-center rounded-[12px] bg-primary text-[15.5px] font-bold text-primary-foreground active:scale-[.98] disabled:opacity-60 sm:w-auto sm:px-6"
        >
          {createPost.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publicar mi pregunta"}
        </button>
      </section>

      {/* Filtros */}
      <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ key: "todos", label: "Todas", emoji: "✨" }, ...TOPICS].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTopic(t.key)}
            className={cn(
              "h-9 shrink-0 rounded-[10px] border px-4 text-[13px] font-bold transition",
              topic === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/70",
            )}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mt-4 space-y-3">
        {isLoading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[16px] bg-secondary" />
          ))}

        {isError && (
          <div className="rounded-[16px] border border-border bg-card p-6 text-center">
            <p className="text-[14px] font-semibold">No pudimos cargar la comunidad.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 h-11 rounded-[10px] bg-primary px-5 text-[14px] font-bold text-primary-foreground"
            >
              Intentar otra vez
            </button>
          </div>
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <div className="rounded-[16px] border border-border bg-card p-8 text-center shadow-soft">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-[12px] bg-primary/10 text-primary">
              <MessageCircle className="h-6 w-6" />
            </span>
            <p className="mt-3 font-display text-[18px] font-bold">Sé la primera voz de hoy</p>
            <p className="mx-auto mt-1 max-w-sm text-[13.5px] text-muted-foreground">
              Escribe arriba lo que estás viviendo. Otra persona que pasó por lo mismo te responde.
            </p>
          </div>
        )}

        {posts.map((p) => {
          const replies = repliesByPost.get(p.id) ?? [];
          const open = openPost === p.id;
          const t = TOPICS.find((x) => x.key === p.topic);
          return (
            <article key={p.id} className="rounded-[16px] border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11.5px] font-bold uppercase tracking-wide text-primary">
                    {t?.emoji} {t?.label ?? "General"} · {p.author_name}
                  </p>
                  <h2 className="mt-1 font-display text-[17px] font-bold leading-snug">{p.title}</h2>
                  {p.body && (
                    <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                      {p.body}
                    </p>
                  )}
                </div>
                {p.user_id === user?.id && (
                  <button
                    type="button"
                    onClick={() => removePost.mutate(p.id)}
                    aria-label="Borrar mi pregunta"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border border-border text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <ReactionRow
                items={reactionsFor("post", p.id)}
                onPick={(emoji, mine) => react.mutate({ type: "post", id: p.id, emoji, mine })}
              />

              <button
                type="button"
                onClick={() => setOpenPost(open ? null : p.id)}
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-[10px] bg-secondary/70 px-3 text-[13.5px] font-bold"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
                {replies.length === 0
                  ? "Responder"
                  : `${replies.length} ${replies.length === 1 ? "respuesta" : "respuestas"}`}
              </button>

              {open && (
                <div className="mt-3 space-y-2 border-t border-border/70 pt-3">
                  {replies.map((r) => (
                    <div key={r.id} className="rounded-[10px] bg-secondary/50 p-3">
                      <p className="text-[11.5px] font-bold text-primary">{r.author_name}</p>
                      <p className="mt-1 text-[14px] leading-relaxed">{r.body}</p>
                      <ReactionRow
                        small
                        items={reactionsFor("reply", r.id)}
                        onPick={(emoji, mine) =>
                          react.mutate({ type: "reply", id: r.id, emoji, mine })
                        }
                      />
                    </div>
                  ))}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={replyText[p.id] ?? ""}
                      onChange={(e) => setReplyText((s) => ({ ...s, [p.id]: e.target.value }))}
                      rows={2}
                      placeholder="Cuéntale qué te funcionó a ti."
                      className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-border bg-background p-3 text-[14.5px] outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => createReply.mutate(p.id)}
                      aria-label="Enviar respuesta"
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-primary text-primary-foreground active:scale-[.97]"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ReactionRow({
  items,
  onPick,
  small,
}: {
  items: { emoji: string; count: number; mine?: string }[];
  onPick: (emoji: string, mine?: string) => void;
  small?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", small ? "mt-2" : "mt-3")}>
      {items.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onPick(r.emoji, r.mine)}
          className={cn(
            "flex min-h-[34px] items-center gap-1 rounded-full border px-2.5 text-[13px] font-bold transition active:scale-[.97]",
            r.mine ? "border-primary bg-primary/10 text-primary" : "border-border bg-background",
          )}
        >
          <span aria-hidden>{r.emoji}</span>
          {r.count > 0 && <span>{r.count}</span>}
        </button>
      ))}
    </div>
  );
}
