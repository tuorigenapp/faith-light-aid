import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BadgeCheck, Infinity as InfinityIcon, Repeat, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import afiliacion from "@/assets/home/afiliacion.jpg";

export const Route = createFileRoute("/_authenticated/invita")({
  head: () => ({
    meta: [
      { title: "Programa de afiliados — ORÍGEN" },
      { name: "description", content: "Afíliate a ORÍGEN en Hotmart y gana comisiones recomendando el Camino ORÍGEN." },
      { property: "og:image", content: "https://tuorigen.app/og/invita.jpg" }, { name: "twitter:image", content: "https://tuorigen.app/og/invita.jpg" }, { property: "og:title", content: "Programa de afiliados — ORÍGEN" },
      { property: "og:description", content: "Comisiones por cada venta y renovación, gestionadas por Hotmart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvitaPage,
});

const HOTMART_URL = "https://affiliate.hotmart.com/affiliate-recruiting/view/4091O107110607";

const BENEFITS = [
  { Icon: Sparkles, t: "50% de comisión", d: "en la primera venta hecha con tu enlace de Hotmart." },
  { Icon: Repeat, t: "10% recurrente", d: "en cada renovación mientras la suscripción siga activa." },
  { Icon: InfinityIcon, t: "Cookie permanente", d: "comisión por último clic, sin fecha de vencimiento." },
  { Icon: Smartphone, t: "Producto digital", d: "fácil de recomendar en redes, YouTube, TikTok o blogs." },
];

const RULES = [
  "Promoción ética y transparente, respetando las políticas de Hotmart.",
  "Prohibido prometer resultados espirituales, médicos, financieros o personales.",
  "Nada de spam, mensajes masivos ni publicidad engañosa.",
  "No uses la marca ORÍGEN en anuncios pagados por nombre sin autorización.",
  "Los pagos y comisiones los gestiona y paga directamente Hotmart.",
];

function InvitaPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-aura-top">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-16 space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" aria-label="Volver" className="w-11 h-11 rounded-full bg-card shadow-soft grid place-items-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display font-bold text-[20px]">Programa de afiliados</h1>
        </div>

        <section className="relative min-h-[240px] rounded-[22px] overflow-hidden shadow-[0_8px_30px_rgba(69,37,142,.15)]">
          <img src={afiliacion} alt="" width={1536} height={768} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2a1760]/95 via-[#2a1760]/70 to-transparent" />
          <div className="relative p-5 max-w-[72%] text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/85">Oficial en Hotmart</span>
            <h2 className="mt-1 font-display font-extrabold text-[26px] leading-tight">Recomienda ORÍGEN y gana por cada venta</h2>
            <p className="mt-2 text-[13px] text-white/85">Hasta 40,29 US$ por venta, pagados por Hotmart.</p>
          </div>
        </section>

        <section className="app-card p-5">
          <h3 className="font-display font-bold text-[17px]">Lo que recibes</h3>
          <div className="mt-3 space-y-2.5">
            {BENEFITS.map(({ Icon, t, d }) => (
              <div key={t} className="flex items-start gap-3 rounded-[12px] bg-secondary/60 p-3">
                <span className="w-10 h-10 shrink-0 rounded-[10px] bg-primary/12 text-primary grid place-items-center"><Icon className="w-5 h-5" /></span>
                <div className="min-w-0">
                  <div className="font-semibold text-[14px] text-foreground">{t}</div>
                  <p className="text-[13px] text-muted-foreground leading-snug">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="app-card p-5">
          <h3 className="font-display font-bold text-[17px] inline-flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Reglas del programa</h3>
          <ul className="mt-3 space-y-2">
            {RULES.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13.5px] text-foreground/85 leading-snug">
                <BadgeCheck className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> {r}
              </li>
            ))}
          </ul>
        </section>

        <a href={HOTMART_URL} target="_blank" rel="noopener noreferrer"
          className="flex h-[54px] items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7950F5] to-[#F4A1D1] text-[16px] font-semibold text-white shadow-[0_4px_14px_rgba(121,80,245,.3)] active:scale-[.97] transition">
          Suscribirme como afiliado en Hotmart <ArrowRight className="w-4 h-4" />
        </a>
        <p className="text-center text-[12px] text-muted-foreground">Se abre la página oficial de Hotmart para registrarte.</p>
      </div>
    </div>
  );
}
