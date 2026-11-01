import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCoupons, saveCoupons } from "@/lib/marketing.functions";
import { COUPON_PLANS, isValidCouponUrl, type HotmartCoupon } from "@/lib/marketing-render";
import { confirmDeletion } from "@/lib/deletion-confirmation";

const blank = { id: "", text: "", code: "", url: "", plan: "all", active: true };

export const COUPONS_QUERY_KEY = ["admin-hotmart-coupons"];

/** Bandeja de cupones creados en Hotmart: texto, código y enlace por separado. */
export function CouponTray() {
  const qc = useQueryClient();
  const fetchC = useServerFn(getCoupons);
  const saveC = useServerFn(saveCoupons);
  const q = useQuery({ queryKey: COUPONS_QUERY_KEY, queryFn: () => fetchC() });
  const coupons = q.data?.coupons ?? [];
  const [form, setForm] = useState<HotmartCoupon>(blank);
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: (list: HotmartCoupon[]) => saveC({ data: { coupons: list } }),
    onSuccess: (r) => {
      qc.setQueryData(COUPONS_QUERY_KEY, r);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const urlOk = isValidCouponUrl(form.url);
  const canSave = form.text.trim().length >= 2 && form.code.trim().length >= 2 && urlOk;

  function submit() {
    if (!canSave) return;
    const item = { ...form, id: form.id || `c${Date.now().toString(36)}` };
    const list = form.id ? coupons.map((c) => (c.id === form.id ? item : c)) : [...coupons, item];
    save.mutate(list, {
      onSuccess: () => {
        toast.success(form.id ? "Cupón actualizado" : "Cupón agregado");
        setForm(blank);
        setOpen(false);
      },
    });
  }

  async function remove(c: HotmartCoupon) {
    const ok = await confirmDeletion({ title: "¿Eliminar este cupón?", description: `«${c.text}» (${c.code}) dejará de usarse en campañas.` });
    if (!ok) return;
    save.mutate(coupons.filter((x) => x.id !== c.id), { onSuccess: () => toast.success("Cupón eliminado") });
  }

  return (
    <div className="rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary">
          <Ticket className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[17px] font-bold">Bandeja de cupones Hotmart</h2>
          <p className="text-[13px] text-muted-foreground">
            Crea el cupón en Hotmart y pégalo aquí. El asistente y las plantillas de descuento solo usan los cupones activos: si no hay ninguno, no
            prometen descuentos.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {q.isLoading && <div className="h-16 animate-pulse rounded-[12px] bg-muted/60" />}
        {q.isError && <p className="rounded-[10px] bg-destructive/10 p-3 text-[13px] text-destructive">No pudimos cargar los cupones. Recarga la página.</p>}
        {!q.isLoading && !coupons.length && !open && (
          <p className="rounded-[12px] bg-muted/50 p-3 text-[13px] text-muted-foreground">Aún no tienes cupones guardados. Agrega el primero para usarlo en tus campañas.</p>
        )}
        {coupons.map((c) => (
          <div key={c.id} className={cn("flex items-center gap-3 rounded-[12px] border border-border/60 p-3", !c.active && "opacity-60")}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{c.text}</p>
              <p className="text-[12px] text-muted-foreground">
                <span className="rounded-[6px] bg-primary/10 px-1.5 font-mono font-bold text-primary">{c.code}</span> ·{" "}
                {COUPON_PLANS.find((p) => p.key === c.plan)?.label ?? c.plan}
              </p>
              <a href={c.url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[12px] text-primary underline">
                <Link2 className="h-3 w-3 shrink-0" /> Probar enlace
              </a>
            </div>
            <button
              onClick={() => save.mutate(coupons.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)))}
              className={cn("h-9 rounded-[10px] px-3 text-[12px] font-bold", c.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}
            >
              {c.active ? "Activo" : "Pausado"}
            </button>
            <button aria-label="Editar cupón" onClick={() => { setForm(c); setOpen(true); }} className="grid h-11 w-11 place-items-center rounded-[10px] bg-muted/60 text-muted-foreground">
              <Pencil className="h-4 w-4" />
            </button>
            <button aria-label="Eliminar cupón" onClick={() => void remove(c)} className="grid h-11 w-11 place-items-center rounded-[10px] bg-muted/60 text-muted-foreground">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {open ? (
        <div className="mt-3 grid gap-3 rounded-[12px] bg-muted/40 p-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Texto del descuento</span>
            <input value={form.text} maxLength={40} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Ej: 50% OFF en Camino Origen" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Código del cupón</span>
            <input value={form.code} maxLength={20} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })} placeholder="Ej: ORIGEN50" className={cn(inputCls, "font-mono uppercase")} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Enlace de Hotmart con el cupón</span>
            <input value={form.url} maxLength={600} onChange={(e) => setForm({ ...form, url: e.target.value.trim() })} placeholder="https://pay.hotmart.com/..." className={inputCls} />
            {form.url && !urlOk && <span className="mt-1 block text-[12px] text-destructive">El enlace debe empezar con https://</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Disponible para</span>
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className={inputCls}>
              {COUPON_PLANS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setForm(blank); setOpen(false); }} className="h-12 rounded-[12px] bg-card text-[14px] font-semibold text-muted-foreground">
              Cancelar
            </button>
            <button disabled={!canSave || save.isPending} onClick={submit} className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-50">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.id ? "Guardar cambios" : "Guardar cupón"}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setForm(blank); setOpen(true); }} className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-primary/10 text-[14px] font-semibold text-primary">
          <Plus className="h-4 w-4" /> Agregar cupón
        </button>
      )}
    </div>
  );
}

const inputCls =
  "h-12 w-full rounded-[10px] border-[1.5px] border-border bg-card px-3 text-[14px] text-foreground outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20";
