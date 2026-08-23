import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, EyeOff, Eye, Users, Crown, Search, Shield, Megaphone, LifeBuoy } from "lucide-react";
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminSetPlan,
  adminSetRole,
  adminSetExcluded,
} from "@/lib/admin.functions";

type TeamRole = "admin" | "marketing" | "soporte";

const TEAM: { role: TeamRole; label: string; icon: typeof Shield }[] = [
  { role: "admin", label: "Admin", icon: Shield },
  { role: "marketing", label: "Marketing", icon: Megaphone },
  { role: "soporte", label: "Soporte", icon: LifeBuoy },
];

const PLAN_LABEL: Record<string, string> = {
  explorador: "Explorador (gratis)",
  puente: "Explorador US$2,99",
  camino: "Camino ORÍGEN (Pro)",
};

/** Gestión de personas: alta manual, plan, exclusión de métricas y borrado. */
export function UsersManager() {
  const qc = useQueryClient();
  const listUsers = useServerFn(adminListUsers);
  const createUser = useServerFn(adminCreateUser);
  const setPlan = useServerFn(adminSetPlan);
  const deleteUser = useServerFn(adminDeleteUser);

  const setRole = useServerFn(adminSetRole);
  const setExcludedFn = useServerFn(adminSetExcluded);
  const [showExcluded, setShowExcluded] = useState(false);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [plan, setPlanValue] = useState<"explorador" | "puente" | "camino">("explorador");

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

  const toggleRole = useMutation({
    mutationFn: (v: { userId: string; role: TeamRole; grant: boolean }) => setRole({ data: v }),
    onSuccess: () => {
      toast.success("Permisos del equipo actualizados.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo cambiar el permiso."),
  });

  const toggleExcluded = useMutation({
    mutationFn: (v: { userId: string; excluded: boolean }) => setExcludedFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-sales"] });
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo actualizar la métrica."),
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

  const q = search.trim().toLowerCase();
  const visible = (users ?? [])
    .filter((u) => showExcluded || !u.excluded)
    .filter((u) => !q || `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(q));
  const counted = (users ?? []).filter((u) => !u.excluded);
  const excludedCount = (users ?? []).filter((u) => u.excluded).length;
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
            {showExcluded ? "Ocultar excluidas" : `Ver excluidas (${excludedCount})`}
          </button>
        </div>

        <label className="mt-3 flex h-12 items-center gap-2 rounded-[10px] border-[1.5px] border-border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo"
            className="h-full w-full bg-transparent text-[14px] outline-none"
          />
        </label>

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
                  {["Persona", "Plan", "Equipo", "Hojas", "Racha", "Registro", "Métricas", ""].map((h) => (
                    <th key={h} className="pb-2 pr-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => {
                  const isExcluded = u.excluded;
                  return (
                    <tr key={u.id} className="border-t border-border/70">
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
                      <td className="py-3 pr-3">
                        <div className="flex gap-1">
                          {TEAM.map((t) => {
                            const on = u.roles.includes(t.role);
                            return (
                              <button
                                key={t.role}
                                onClick={() =>
                                  toggleRole.mutate({ userId: u.id, role: t.role, grant: !on })
                                }
                                title={`${on ? "Quitar" : "Dar"} permiso de ${t.label}`}
                                aria-label={`${on ? "Quitar" : "Dar"} permiso de ${t.label} a ${u.name ?? u.email}`}
                                className={`grid h-10 w-10 place-items-center rounded-[10px] ${
                                  on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                <t.icon className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-semibold">{u.leaves}</td>
                      <td className="py-3 pr-3">{u.streak} días</td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("es")}
                      </td>
                      <td className="py-3 pr-3">
                        <button
                          onClick={() =>
                            toggleExcluded.mutate({ userId: u.id, excluded: !isExcluded })
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
                          onClick={() => {
                            if (
                              confirm(
                                `¿Eliminar la cuenta de ${u.email ?? u.name}? No se puede deshacer.`,
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
