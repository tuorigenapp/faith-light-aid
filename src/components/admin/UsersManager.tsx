import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, EyeOff, Eye, Users, Crown } from "lucide-react";
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminSetPlan,
} from "@/lib/admin.functions";
import { adminAdjustHojas, adminDeleteUsers } from "@/lib/content-admin.functions";
import { confirmDeletion } from "@/lib/deletion-confirmation";

const EXCLUDED_KEY = "origen_admin_excluded_users";
const PLAN_LABEL: Record<string, string> = {
  explorador: "Explorador (gratis)",
  puente: "Explorador US$2,99",
  camino: "Camino ORÍGEN (Pro)",
};

function loadExcluded(): string[] {
  try {
    return JSON.parse(localStorage.getItem(EXCLUDED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/** Gestión de personas: alta manual, plan, exclusión de métricas y borrado. */
export function UsersManager() {
  const qc = useQueryClient();
  const listUsers = useServerFn(adminListUsers);
  const createUser = useServerFn(adminCreateUser);
  const setPlan = useServerFn(adminSetPlan);
  const deleteUser = useServerFn(adminDeleteUser);

  const [excluded, setExcluded] = useState<string[]>([]);
  const [showExcluded, setShowExcluded] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [plan, setPlanValue] = useState<"explorador" | "puente" | "camino">("explorador");

  const adjust = useServerFn(adminAdjustHojas);
  const bulkDelete = useServerFn(adminDeleteUsers);
  const [selected, setSelected] = useState<string[]>([]);
  const [planFilter, setPlanFilter] = useState<"todos" | "pago" | "gratis" | "camino" | "puente">("todos");
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("1");
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => setExcluded(loadExcluded()), []);

  async function bulk(kind: "add" | "remove" | "delete") {
    if (selected.length === 0) return;
    const n = Math.abs(parseInt(amount.replace(/\D/g, ""), 10) || 0);
    if (kind !== "delete" && n === 0) return toast.error("Escribe cuántas hojas.");
    if (kind === "delete" && !await confirmDeletion("Las cuentas seleccionadas se eliminarán. No podrás recuperarlas.")) return;
    setBulkBusy(true);
    try {
      if (kind === "delete") {
        const r = await bulkDelete({ data: { userIds: selected } });
        toast.success(`${r.deleted} cuentas eliminadas.`);
      } else {
        const r = await adjust({ data: { userIds: selected, hojas: kind === "add" ? n : -n } });
        toast.success(`${kind === "add" ? "Sumadas" : "Quitadas"} ${n} hojas a ${r.updated} personas.`);
      }
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo completar.");
    }
    setBulkBusy(false);
  }

  const persist = (ids: string[]) => {
    setExcluded(ids);
    localStorage.setItem(EXCLUDED_KEY, JSON.stringify(ids));
  };

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
  });

  const create = useMutation({
    mutationFn: () =>
      createUser({ data: { email: email.trim(), fullName: fullName.trim(), plan } }),
    onSuccess: (r) => {
      toast.success(
        r.invited ? "Acceso enviado por correo." : "La cuenta ya existía: se actualizó su plan.",
      );
      setEmail("");
      setFullName("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-panel"] });
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo crear el acceso."),
  });

  const changePlan = useMutation({
    mutationFn: (v: { userId: string; plan: "explorador" | "puente" | "camino" }) =>
      setPlan({ data: { userId: v.userId, plan: v.plan, months: 12 } }),
    onSuccess: () => {
      toast.success("Plan actualizado.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo cambiar el plan."),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => deleteUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Cuenta eliminada.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo eliminar la cuenta."),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || fullName.trim().length < 2) {
      toast.error("Escribe nombre y correo.");
      return;
    }
    create.mutate();
  }

  const isPaid = (u: { plan: string; planStatus: string }) => u.plan !== "explorador" && u.planStatus === "active";
  const visible = (users ?? [])
    .filter((u) => showExcluded || !excluded.includes(u.id))
    .filter((u) =>
      planFilter === "todos" ? true
      : planFilter === "pago" ? isPaid(u)
      : planFilter === "gratis" ? !isPaid(u)
      : u.plan === planFilter,
    )
    .filter((u) => `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const allSelected = visible.length > 0 && visible.every((u) => selected.includes(u.id));
  const counted = (users ?? []).filter((u) => !excluded.includes(u.id));
  const pro = counted.filter((u) => u.plan === "camino" && u.planStatus === "active").length;
  const active7 = counted.filter(
    (u) => u.lastActivityAt && Date.now() - new Date(u.lastActivityAt).getTime() < 7 * 86400000,
  ).length;

  return (
    <div className="space-y-4">
      {/* Alta manual */}
      <section className="rounded-[16px] border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-[17px] font-bold">
          <UserPlus className="h-4 w-4 text-primary" /> Dar acceso a una persona
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Solo nombre y correo. Le llega su acceso al correo y entra sin contraseña.
        </p>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nombre y apellido"
            className="h-12 rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[15px] outline-none focus:border-primary"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="correo@ejemplo.com"
            className="h-12 rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[15px] outline-none focus:border-primary"
          />
          <select
            value={plan}
            onChange={(e) => setPlanValue(e.target.value as typeof plan)}
            className="h-12 rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[14px] outline-none focus:border-primary"
          >
            <option value="explorador">Explorador (gratis)</option>
            <option value="puente">Explorador US$2,99</option>
            <option value="camino">Camino ORÍGEN (Pro)</option>
          </select>
          <button
            type="submit"
            disabled={create.isPending}
            className="grid h-12 place-items-center rounded-[12px] bg-primary px-5 text-[15px] font-bold text-primary-foreground active:scale-[.98] sm:col-span-3"
          >
            {create.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Crear acceso y enviar correo"
            )}
          </button>
        </form>
      </section>

      {/* Métricas limpias */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Personas contadas", value: String(counted.length), icon: Users },
          { label: "Con plan Pro activo", value: String(pro), icon: Crown },
          { label: "Activas últimos 7 días", value: String(active7), icon: Eye },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-[16px] border border-border bg-card p-4 shadow-soft"
          >
            <k.icon className="h-4 w-4 text-primary" />
            <p className="mt-2 font-display text-[24px] font-extrabold leading-none">{k.value}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <section className="rounded-[16px] border border-border bg-card p-5 shadow-soft">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="min-w-0 font-display text-[17px] font-bold">
            Personas registradas ({visible.length})
          </h2>
          <button
            onClick={() => setShowExcluded((v) => !v)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] bg-secondary px-3 text-[13px] font-semibold"
          >
            {showExcluded ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showExcluded ? "Ocultar excluidas" : `Ver excluidas (${excluded.length})`}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["todos", "Todas"], ["pago", "De pago"], ["gratis", "Gratis"], ["camino", "Camino ORÍGEN"], ["puente", "US$2,99"],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => { setPlanFilter(k); setSelected([]); }}
              className={`h-9 rounded-full px-3 text-[12.5px] font-semibold ${planFilter === k ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {l}
            </button>
          ))}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo"
          className="mt-3 h-11 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[14px] outline-none focus:border-primary" />
        {selected.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[12px] border-2 border-primary/40 bg-primary/5 p-3">
            <span className="text-[13px] font-bold">{selected.length} seleccionadas</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" aria-label="Cantidad de hojas"
              className="h-11 w-20 rounded-[10px] border-[1.5px] border-border bg-background px-2 text-center text-[14px]" />
            <button disabled={bulkBusy} onClick={() => bulk("add")} className="h-11 rounded-[10px] bg-primary px-3 text-[13px] font-bold text-primary-foreground">Sumar hojas</button>
            <button disabled={bulkBusy} onClick={() => bulk("remove")} className="h-11 rounded-[10px] bg-secondary px-3 text-[13px] font-bold">Quitar hojas</button>
            <button disabled={bulkBusy} onClick={() => bulk("delete")} className="h-11 rounded-[10px] bg-destructive/10 px-3 text-[13px] font-bold text-destructive">Eliminar cuentas</button>
            {bulkBusy && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        )}

        {isLoading ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-[12px] bg-secondary" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-4 text-[13.5px] text-muted-foreground">Sin datos de usuarios todavía.</p>
        ) : (
          <div className="mt-4 -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-2">
                    <input type="checkbox" aria-label="Seleccionar todas" checked={allSelected} className="h-5 w-5"
                      onChange={() => setSelected(allSelected ? [] : visible.map((u) => u.id))} />
                  </th>
                  {["Persona", "Plan", "Hojas", "Racha", "Registro", "Métricas", ""].map((h) => (
                    <th key={h} className="pb-2 pr-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => {
                  const isExcluded = excluded.includes(u.id);
                  return (
                    <tr key={u.id} className="border-t border-border/70">
                      <td className="py-3 pr-2">
                        <input type="checkbox" aria-label="Seleccionar" className="h-5 w-5" checked={selected.includes(u.id)}
                          onChange={() => setSelected((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]))} />
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{u.name ?? "Sin datos"}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {u.email ?? "Sin datos"}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          value={u.plan === "camino" || u.plan === "puente" ? u.plan : "explorador"}
                          onChange={(e) =>
                            changePlan.mutate({
                              userId: u.id,
                              plan: e.target.value as "explorador" | "puente" | "camino",
                            })
                          }
                          className="h-10 rounded-[10px] border-[1.5px] border-border bg-background px-2 text-[12.5px]"
                        >
                          {Object.entries(PLAN_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-3 font-semibold">{u.leaves}</td>
                      <td className="py-3 pr-3">{u.streak} días</td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("es")}
                      </td>
                      <td className="py-3 pr-3">
                        <button
                          onClick={() =>
                            persist(
                              isExcluded
                                ? excluded.filter((id) => id !== u.id)
                                : [...excluded, u.id],
                            )
                          }
                          className={`h-10 rounded-full px-3 text-[12px] font-bold ${
                            isExcluded
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {isExcluded ? "Excluida" : "Contada"}
                        </button>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={async () => {
                            if (
                              await confirmDeletion(
                                "Esta cuenta se eliminará. No podrás recuperarla.",
                              )
                            )
                              remove.mutate(u.id);
                          }}
                          aria-label="Eliminar cuenta"
                          className="grid h-11 w-11 place-items-center rounded-[10px] bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
