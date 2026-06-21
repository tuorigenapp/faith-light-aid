import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Users, MessageCircle, BookHeart, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Reconectando" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: Admin,
});

function Admin() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, msgs, journal, subs] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("plan"),
      ]);
      const planCounts: Record<string, number> = {};
      (subs.data ?? []).forEach((s: any) => { planCounts[s.plan] = (planCounts[s.plan] ?? 0) + 1; });
      return { users: users.count ?? 0, msgs: msgs.count ?? 0, journal: journal.count ?? 0, planCounts };
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl">Panel administrador</h1>
      <p className="text-muted-foreground text-sm mt-2">Estadísticas y gestión de la plataforma.</p>

      <div className="mt-8 grid md:grid-cols-4 gap-4">
        <Stat icon={<Users className="w-5 h-5" />} label="Usuarios" value={data?.users ?? 0} />
        <Stat icon={<MessageCircle className="w-5 h-5" />} label="Mensajes IA" value={data?.msgs ?? 0} />
        <Stat icon={<BookHeart className="w-5 h-5" />} label="Entradas diario" value={data?.journal ?? 0} />
        <Stat icon={<CreditCard className="w-5 h-5" />} label="Suscripciones" value={Object.values(data?.planCounts ?? {}).reduce((a, b) => a + b, 0)} />
      </div>

      <Card className="p-6 mt-8">
        <h2 className="font-display text-lg">Últimos usuarios</h2>
        <div className="mt-4 divide-y divide-border">
          {(recentUsers ?? []).map((u: any) => (
            <div key={u.id} className="py-3 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{u.full_name ?? "—"}</div>
                <div className="text-muted-foreground text-xs">{u.email} · {u.country ?? "—"}</div>
              </div>
              <div className="text-xs text-muted-foreground">Etapa {u.current_stage}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="p-6">
      <div className="w-10 h-10 rounded-lg bg-primary/5 grid place-items-center text-primary">{icon}</div>
      <div className="font-display text-3xl mt-3">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </Card>
  );
}
