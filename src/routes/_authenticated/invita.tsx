import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, Gift, HeartHandshake, MessageCircle, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/invita")({
  head: () => ({ meta: [{ title: "Invita y gana — ORIGEN" }] }),
  component: InvitaPage,
});

function InvitaPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile-invite", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("referral_code, display_name, full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: myRefs = [] } = useQuery({
    queryKey: ["referrals", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("referrals").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const code = profile?.referral_code ?? "";
  const link = typeof window !== "undefined" ? `${window.location.origin}/?ref=${code}` : `/?ref=${code}`;
  const name = (profile?.display_name || profile?.full_name || "").split(" ")[0];
  const message = `Hola 💜 Estoy en ORIGEN, una app que me ha ayudado a entender los patrones de mi familia y sanar de raíz. Si estás pasando por algo parecido, creo que te va a servir. Empieza con mi enlace: ${link}`;

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: "ORIGEN", text: message, url: link }).catch(() => {});
    } else {
      copy(message, "Mensaje");
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-aura-top">
      <div className="max-w-lg mx-auto px-5 pt-6 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-white shadow-soft grid place-items-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display font-bold text-[22px]">Invita y gana</h1>
        </div>

        <div className="hero-card text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-glow">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-[22px] leading-tight mt-4">
            Alguien que amas <span className="text-gradient-brand">te necesita</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            {name ? `${name}, ` : ""}si conoces a alguien atravesando lo mismo que tú viviste, tu recomendación puede cambiarle la vida. Y por cada persona que empieza su Camino ORIGEN contigo, recibes <b className="text-primary">20% del primer mes</b>.
          </p>
        </div>

        <div className="app-card p-5 mt-4">
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Tu código único
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-14 rounded-[14px] bg-secondary grid place-items-center font-display font-black text-2xl tracking-widest text-primary">
              {code || "•••••"}
            </div>
            <button onClick={() => copy(code, "Código")} className="h-14 w-14 rounded-[14px] bg-white border border-border grid place-items-center">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Tu enlace</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-11 rounded-[12px] bg-secondary/60 px-3 text-xs grid items-center truncate">{link}</div>
              <button onClick={() => copy(link, "Enlace")} className="h-11 w-11 rounded-[12px] bg-white border border-border grid place-items-center">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="app-card p-5 mt-4">
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary">Mensaje sugerido</div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90 bg-secondary/50 rounded-[12px] p-3">{message}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-[14px] bg-[#25D366] text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <button onClick={share} className="h-12 rounded-[14px] btn-primary-gradient inline-flex items-center justify-center gap-2 text-sm">
              <Share2 className="w-4 h-4" /> Compartir
            </button>
          </div>
        </div>

        <div className="app-card p-5 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-widest font-bold text-primary flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" /> Tus invitados
            </div>
            <span className="text-xs text-muted-foreground">{myRefs.length}</span>
          </div>
          {myRefs.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">Cuando alguien empiece con tu código lo verás aquí. Sin presión: solo comparte con quien de verdad lo necesite.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {myRefs.map((r: { id: string; invited_email: string | null; status: string; reward_gems: number }) => (
                <li key={r.id} className="flex items-center justify-between rounded-[12px] bg-secondary/40 px-3 py-2">
                  <span className="text-sm truncate">{r.invited_email ?? "Nuevo invitado"}</span>
                  <span className="text-xs font-bold text-primary">{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
