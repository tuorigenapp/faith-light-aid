import { MessageCircle, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { mentorRecoveryDeadline, mentorRecoveryDaysLeft, type MentorConversation } from "@/lib/mentor-trash";

export type MentorHistoryTab = "history" | "trash";

type Props = {
  conversations: MentorConversation[];
  trashed: MentorConversation[];
  tab: MentorHistoryTab;
  onTab: (tab: MentorHistoryTab) => void;
  activeId: string | null;
  onPick: (id: string) => void;
  onTrash: (id: string) => void;
  onRestore: (id: string) => void;
  onDestroy: (id: string) => void;
  pending: boolean;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  now: number;
};

export function MentorConversationHistory(props: Props) {
  const { tab, conversations, trashed, pending } = props;
  const items = tab === "trash" ? trashed : conversations;

  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={value => props.onTab(value === "trash" ? "trash" : "history")}>
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-[10px]">
          <TabsTrigger value="history" className="h-11 gap-2 text-sm"><MessageCircle className="h-4 w-4" />Historial</TabsTrigger>
          <TabsTrigger value="trash" className="h-11 gap-2 text-sm"><Trash2 className="h-4 w-4" />Papelera{trashed.length > 0 ? ` (${trashed.length})` : ""}</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "trash" && <p className="px-2 text-sm text-muted-foreground">Puedes recuperar tus conversaciones y sus mensajes durante 30 días.</p>}
      {props.loading ? (
        <div className="space-y-3" aria-label="Cargando conversaciones">
          {[0, 1, 2].map(i => <div key={i} className="h-20 animate-pulse rounded-[12px] bg-secondary motion-reduce:animate-none" />)}
        </div>
      ) : props.error ? (
        <div className="px-3 py-6 text-center">
          <p className="text-sm">No pudimos cargar tus conversaciones.</p>
          <Button variant="outline" onClick={props.onRetry} className="mt-3 min-h-11">Intentar de nuevo</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="px-3 py-6 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-[12px] bg-primary/10 text-primary">{tab === "trash" ? <Trash2 /> : <MessageCircle />}</span>
          <p className="text-sm font-semibold">{tab === "trash" ? "Papelera limpia" : "Tu historia comienza aquí"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tab === "trash" ? "Las conversaciones que borres del historial aparecerán aquí." : "Tus conversaciones guardadas aparecerán aquí."}</p>
        </div>
      ) : items.map(c => {
        let draft = "";
        try { draft = typeof window !== "undefined" ? localStorage.getItem(`chat-draft-${c.id}`) ?? "" : ""; } catch { /* optional local draft */ }
        const daysLeft = c.deleted_at ? mentorRecoveryDaysLeft(c.deleted_at, props.now) : 0;
        const until = c.deleted_at ? new Date(mentorRecoveryDeadline(c.deleted_at)).toLocaleDateString("es", { day: "numeric", month: "short" }) : "";
        return (
          <div key={c.id} className={cn("rounded-[12px] px-3 py-2", props.activeId === c.id && tab === "history" ? "bg-secondary" : "bg-card/50")}>
            <div className="flex min-h-14 items-center gap-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><MessageCircle className="h-4 w-4" /></span>
              {tab === "history" ? (
                <Button variant="ghost" className="h-auto min-h-11 min-w-0 flex-1 flex-col items-start gap-1 whitespace-normal px-0 text-left hover:bg-transparent" onClick={() => props.onPick(c.id)}>
                  <span className="w-full truncate text-sm font-semibold">{c.title}</span>
                  <span className="w-full truncate text-[12px] font-normal text-muted-foreground">{draft ? <span className="font-semibold text-destructive">Borrador: </span> : null}{draft || new Date(c.updated_at).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </Button>
              ) : (
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{c.title}</p><p className="text-[12px] text-muted-foreground">{daysLeft} {daysLeft === 1 ? "día" : "días"} · Hasta el {until}</p></div>
              )}
              {tab === "history" && <Button variant="ghost" size="icon" disabled={pending} aria-label="Borrar conversación" title="Mover a la papelera" onClick={() => props.onTrash(c.id)} className="h-11 w-11 shrink-0 rounded-full"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>}
            </div>
            {tab === "trash" && <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
              <Button variant="secondary" disabled={pending || daysLeft === 0} onClick={() => props.onRestore(c.id)} className="min-h-11 flex-1 gap-2"><Undo2 className="h-4 w-4" />Restaurar</Button>
              <Button variant="ghost" size="icon" disabled={pending} aria-label="Eliminar para siempre" title="Eliminar para siempre" onClick={() => props.onDestroy(c.id)} className="h-11 w-11 shrink-0 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>}
          </div>
        );
      })}
    </div>
  );
}