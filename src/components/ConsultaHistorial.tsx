import { Clock, FileDown, Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConsultaHistorialItem = {
  id: string;
  created_at: string;
  title: string;
};

export function ConsultaHistorial({
  items,
  loading,
  error,
  onOpen,
  onDownload,
  emptyText = "Aún no tienes consultas registradas. Tu historial aparecerá aquí.",
  className,
}: {
  items: ConsultaHistorialItem[];
  loading?: boolean;
  error?: string | null;
  onOpen?: (id: string) => void;
  onDownload?: (id: string) => void;
  emptyText?: string;
  className?: string;
}) {
  return (
    <div className={cn("app-card p-5", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-[15px]">Historial de consultas</h3>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-5 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando tu historial...
        </div>
      )}

      {!loading && error && (
        <div className="text-sm text-destructive py-3 text-center">{error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
          <Inbox className="w-6 h-6" />
          <p className="text-sm">{emptyText}</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="divide-y divide-border/70">
          {items.map((it) => (
            <li key={it.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{it.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(it.created_at).toLocaleDateString("es", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpen && (
                  <button
                    onClick={() => onOpen(it.id)}
                    className="h-9 px-3 rounded-[10px] border border-border bg-card text-xs font-semibold"
                  >
                    Abrir
                  </button>
                )}
                {onDownload && (
                  <button
                    onClick={() => onDownload(it.id)}
                    aria-label="Descargar PDF"
                    className="h-9 w-9 rounded-[10px] border border-border bg-card grid place-items-center"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
