import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Library, Loader2, Music, Pencil, Search, Sparkles } from "lucide-react";
import {
  adminContentTree,
  adminRenameContent,
  adminTogglePublished,
} from "@/lib/admin-insights.functions";

type Tab = "visualiza" | "biblioteca" | "etapas" | "ejercicios" | "palabra";

const TABS: { key: Tab; label: string }[] = [
  { key: "visualiza", label: "Visualiza" },
  { key: "biblioteca", label: "Biblioteca" },
  { key: "etapas", label: "Etapas" },
  { key: "ejercicios", label: "Ejercicios" },
  { key: "palabra", label: "Palabra del día" },
];

/** Explorador de todo el contenido con búsqueda, publicar/ocultar y renombrar. */
export function ContentManager() {
  const qc = useQueryClient();
  const tree = useServerFn(adminContentTree);
  const toggle = useServerFn(adminTogglePublished);
  const rename = useServerFn(adminRenameContent);

  const [tab, setTab] = useState<Tab>("visualiza");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ table: string; id: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-content"], queryFn: () => tree() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-content"] });

  const togglePub = useMutation({
    mutationFn: (v: { table: "manifest_categories" | "manifest_audios"; id: string; isPublished: boolean }) =>
      toggle({ data: v }),
    onSuccess: () => {
      toast.success("Visibilidad actualizada.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doRename = useMutation({
    mutationFn: (v: { table: string; id: string; title: string }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rename({ data: v as any }),
    onSuccess: () => {
      toast.success("Título actualizado.");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filter = (text: string) => text.toLowerCase().includes(q.trim().toLowerCase());

  const audiosByCat = useMemo(() => {
    const map = new Map<string, { id: string; title: string; day_index: number; is_published: boolean }[]>();
    for (const a of data?.audios ?? []) {
      const list = map.get(a.category_id) ?? [];
      list.push({
        id: a.id,
        title: a.title,
        day_index: a.day_index ?? 0,
        is_published: Boolean(a.is_published),
      });
      map.set(a.category_id, list);
    }
    return map;
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center rounded-[16px] border border-border/60 bg-card py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "border border-border/60 bg-card text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-[12px] border border-border/60 bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar en el contenido…"
          className="w-full bg-transparent text-[14px] outline-none"
        />
      </div>

      {tab === "visualiza" && (
        <div className="space-y-3">
          {data.categories
            .filter((c) => filter(c.title))
            .map((c) => {
              const audios = audiosByCat.get(c.id) ?? [];
              return (
                <section
                  key={c.id}
                  className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" />
                      {editing?.id === c.id ? (
                        <InlineEdit
                          value={editing.title}
                          onChange={(v) => setEditing({ ...editing, title: v })}
                          onSave={() =>
                            doRename.mutate({
                              table: "manifest_categories",
                              id: c.id,
                              title: editing.title,
                            })
                          }
                        />
                      ) : (
                        <p className="font-semibold">{c.title}</p>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {c.group_key}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-muted-foreground">{audios.length} audios</span>
                      <IconBtn
                        onClick={() => setEditing({ table: "manifest_categories", id: c.id, title: c.title })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn
                        onClick={() =>
                          togglePub.mutate({
                            table: "manifest_categories",
                            id: c.id,
                            isPublished: !c.is_published,
                          })
                        }
                      >
                        {c.is_published ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </IconBtn>
                    </div>
                  </div>

                  {audios.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {audios
                        .sort((a, b) => a.day_index - b.day_index)
                        .map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center justify-between rounded-[10px] bg-muted/40 px-3 py-2 text-[13px]"
                          >
                            <span className="truncate">
                              Día {a.day_index} · {a.title}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                togglePub.mutate({
                                  table: "manifest_audios",
                                  id: a.id,
                                  isPublished: !a.is_published,
                                })
                              }
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {a.is_published ? (
                                <Eye className="h-3.5 w-3.5" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </section>
              );
            })}
        </div>
      )}

      {tab === "biblioteca" && (
        <SimpleList
          icon={Library}
          rows={data.books
            .filter((b) => filter(b.title))
            .map((b) => ({ id: b.id, title: b.title, meta: `${b.category} · ${b.required_plan}` }))}
          onRename={(id, title) => doRename.mutate({ table: "library_items", id, title })}
        />
      )}

      {tab === "etapas" && (
        <SimpleList
          icon={Sparkles}
          rows={data.stages.map((s) => ({ id: String(s.id), title: s.title, meta: `Etapa ${s.id}` }))}
          onRename={(id, title) => doRename.mutate({ table: "stages", id, title })}
        />
      )}

      {tab === "ejercicios" && (
        <SimpleList
          icon={Sparkles}
          rows={data.exercises
            .filter((e) => filter(e.title))
            .map((e) => ({ id: e.id, title: e.title, meta: e.category }))}
          onRename={(id, title) => doRename.mutate({ table: "exercises", id, title })}
        />
      )}

      {tab === "palabra" && (
        <section className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
          <p className="text-[13px] text-muted-foreground">
            {data.devotionals.length} palabras cargadas para el año.
          </p>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {data.devotionals
              .filter((d) => filter(d.word))
              .slice(0, 120)
              .map((d) => (
                <li
                  key={d.id}
                  className="rounded-[10px] bg-muted/40 px-3 py-2 text-[13px]"
                >
                  Día {d.day_of_year} · {d.word}
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SimpleList({
  icon: Icon,
  rows,
  onRename,
}: {
  icon: typeof Library;
  rows: { id: string; title: string; meta: string }[];
  onRename: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  return (
    <section className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
      <ul className="space-y-1">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-[10px] bg-muted/40 px-3 py-2 text-[13px]"
          >
            {editing?.id === r.id ? (
              <InlineEdit
                value={editing.title}
                onChange={(v) => setEditing({ ...editing, title: v })}
                onSave={() => {
                  onRename(r.id, editing.title);
                  setEditing(null);
                }}
              />
            ) : (
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{r.title}</span>
              </span>
            )}
            <span className="flex items-center gap-2">
              <span className="hidden text-[11px] text-muted-foreground sm:inline">{r.meta}</span>
              <IconBtn onClick={() => setEditing({ id: r.id, title: r.title })}>
                <Pencil className="h-3.5 w-3.5" />
              </IconBtn>
            </span>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="text-[13px] text-muted-foreground">Sin resultados para tu búsqueda.</p>
      )}
    </section>
  );
}

function InlineEdit({
  value,
  onChange,
  onSave,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSave()}
        className="min-w-0 flex-1 rounded-[8px] border border-border/60 bg-background px-2 py-1 text-[13px] outline-none"
      />
      <IconBtn onClick={onSave}>
        <Check className="h-3.5 w-3.5" />
      </IconBtn>
    </span>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-[8px] border border-border/60 bg-background text-muted-foreground transition hover:text-foreground"
    >
      {children}
    </button>
  );
}
