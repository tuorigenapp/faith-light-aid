import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Loader2, Mail, ShieldCheck } from "lucide-react";
import {
  adminBackupHistory,
  adminConfirmBackup,
  adminRequestBackup,
} from "@/lib/admin-insights.functions";

/** Copia de seguridad protegida con código enviado al correo del administrador. */
export function BackupManager() {
  const qc = useQueryClient();
  const request = useServerFn(adminRequestBackup);
  const confirm = useServerFn(adminConfirmBackup);
  const history = useServerFn(adminBackupHistory);

  const [code, setCode] = useState("");
  const [awaiting, setAwaiting] = useState(false);

  const { data: rows } = useQuery({
    queryKey: ["admin-backups"],
    queryFn: () => history(),
  });

  const ask = useMutation({
    mutationFn: () => request({}),
    onSuccess: (r) => {
      setAwaiting(true);
      if (r.unconfigured) toast.error("Falta configurar el correo del sistema.");
      else if (r.sent) toast.success("Te enviamos el código a tu correo.");
      else toast.error("No pudimos enviar el correo. Intenta de nuevo.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const download = useMutation({
    mutationFn: () => confirm({ data: { code: code.trim() } }),
    onSuccess: (r) => {
      const blob = new Blob([r.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `origen-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setCode("");
      setAwaiting(false);
      toast.success("Copia descargada.");
      qc.invalidateQueries({ queryKey: ["admin-backups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <h2 className="font-display text-[17px] font-bold">Copia de seguridad</h2>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Descarga todo el contenido de la app (libros, audios, etapas, ejercicios, palabras y quiz)
          en un solo archivo. Por seguridad te enviamos un código de 6 dígitos a tu correo antes de
          generarla.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => ask.mutate()}
            disabled={ask.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground disabled:opacity-60"
          >
            {ask.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Enviarme el código
          </button>

          {awaiting && (
            <>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                className="w-32 rounded-full border border-border/60 bg-background px-4 py-2.5 text-center text-[15px] tracking-[6px] outline-none"
              />
              <button
                type="button"
                onClick={() => download.mutate()}
                disabled={code.length !== 6 || download.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-5 py-2.5 text-[14px] font-semibold disabled:opacity-50"
              >
                {download.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Descargar copia
              </button>
            </>
          )}
        </div>
      </section>

      <section className="rounded-[16px] border border-border/60 bg-card p-5 shadow-soft">
        <h2 className="font-display text-[17px] font-bold">Historial</h2>
        {!rows || rows.length === 0 ? (
          <p className="mt-3 rounded-[12px] bg-muted/40 p-4 text-[13px] text-muted-foreground">
            Todavía no has generado ninguna copia.
          </p>
        ) : (
          <ul className="mt-3 space-y-1">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-[10px] bg-muted/40 px-3 py-2 text-[13px]"
              >
                <span>{new Date(r.created_at).toLocaleString("es")}</span>
                <span className="text-muted-foreground">
                  {r.size_bytes ? `${Math.round(r.size_bytes / 1024)} KB` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
