import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronDown, Clock, Lock, ShieldCheck, Star, X } from "lucide-react";
import eHeartPurple from "@/assets/e3d-heart-purple.png";
import eCross from "@/assets/e3d-cross.png";
import eStar from "@/assets/e3d-star.png";
import eCoin from "@/assets/e3d-coin.png";
import bookMockup from "@/assets/libro-oficial-mockup.png";
import { BOOK_AMAZON_URL, BOOK_TITLE, BOOK_AUTHOR } from "@/lib/pdf-brand";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({
    meta: [
      { title: "Camino ORÍGEN — rompe el patrón que se repite | 7 días de prueba" },
      {
        name: "description",
        content:
          "Acceso completo al Camino ORÍGEN: diagnóstico de tu patrón familiar, mentora, caminos de 365 días y consultas. 7 días de prueba y cancelas cuando quieras.",
      },
      { property: "og:title", content: "Camino ORÍGEN — rompe el patrón que se repite" },
      { property: "og:description", content: "7 días de prueba. Entiende de dónde viene lo que se repite y cierra el ciclo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const MONTHLY = "https://pay.hotmart.com/U107110586N?off=h24bbhc6";
const ANNUAL = "https://pay.hotmart.com/U107110586N?off=oi4xqwda";

const PAINS = [
  { emoji: eHeartPurple, text: "“Repito los mismos errores y no sé por qué.”" },
  { emoji: eCross, text: "“Siento un vacío que no puedo explicar con palabras.”" },
  { emoji: eStar, text: "“Empiezo con todo y a los tres días lo abandono.”" },
];

const INCLUDE = [
  "Diagnóstico de tu patrón: te dice si viene por tu línea paterna o materna",
  "Mentora disponible todos los días, desde tu historia real",
  "Caminos de 365 días: niño interior, identidad, magnetismo, propósito",
  "Consultas con PDF: Pareja, Patrones familiares y «Dios te dice hoy»",
  "Palabra de hoy con enseñanza, quiz e imagen para compartir",
  "Biblioteca con 82 libros y playlists de reflexión guiada",
];

const FAQ = [
  { q: "Ya probé terapia, libros y otras apps.", a: "Aquí no recibes contenido genérico: trabajamos sobre tu historia y tu línea familiar. El diagnóstico y las consultas responden a tu caso, no a un promedio." },
  { q: "No tengo tiempo.", a: "De 5 a 10 minutos al día. Una etapa por día, a propósito: el cambio necesita asentarse, no acumularse." },
  { q: "No quiero que me impongan una religión.", a: "Partimos de la fe cristiana con respeto absoluto. Te invitamos, nunca te presionamos. Tú eliges qué oras y qué escribes." },
  { q: "¿Y si no es para mí?", a: "Tienes 7 días de prueba y cancelas cuando quieras desde la app. Te avisamos antes de cualquier cobro." },
  { q: "¿Por qué el anual es tan barato?", a: "Porque el proceso real toma meses y preferimos acompañarte todo el año. Pagando anual son 7,49 USD/mes en lugar de 14,99 USD." },
];

function Checkout() {
  const [plan, setPlan] = useState<"annual" | "monthly">("annual");
  const [faq, setFaq] = useState<number | null>(0);
  const [left, setLeft] = useState(15 * 60);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const url = plan === "annual" ? ANNUAL : MONTHLY;

  const firstCharge = new Date(Date.now() + 7 * 86400000).toLocaleDateString("es-MX", { day: "numeric", month: "long" });

  return (
    <div className="min-h-dvh bg-[#0C0614] text-white">
      <div className="mx-auto w-full max-w-[1100px] px-5 pb-32 pt-6 lg:px-8">
        {/* Hero */}
        <div className="mx-auto max-w-[560px] text-center">
          <span className="inline-flex items-center gap-2 rounded-[10px] bg-[#7C2DBF] px-4 py-2.5 text-[12.5px] font-black uppercase tracking-[0.06em]">
            <Star className="h-3.5 w-3.5" fill="currentColor" /> Best seller · Método ORÍGEN
          </span>
          <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1] sm:text-[40px]">
            Deja de repetir la historia{" "}
            <span className="text-[#E0B25C]">que no elegiste</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[42ch] text-[16px] leading-relaxed text-white/70">
            Entiende de dónde viene el patrón, ciérralo con acompañamiento diario y vive en paz. Empieza hoy con 7 días de prueba.
          </p>
        </div>

        {/* Dolores */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {PAINS.map((p) => (
            <div key={p.text} className="rounded-[16px] border border-white/10 bg-white/[0.07] p-5">
              <img src={p.emoji} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
              <p className="mt-3 text-[14.5px] font-medium leading-snug text-white/85">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-[52ch] text-center text-[15px] leading-relaxed text-white/70">
          No te falta fuerza de voluntad. Te falta ver el origen. Eso es lo primero que hacemos contigo.
        </p>

        {/* Qué incluye */}
        <div className="mt-8 rounded-[16px] border border-white/10 bg-white/[0.07] p-5 sm:p-6">
          <h2 className="font-display text-[22px] font-bold">Lo que se abre hoy mismo</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {INCLUDE.map((i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#E0B25C]/15">
                  <Check className="h-3.5 w-3.5 text-[#E0B25C]" />
                </span>
                <span className="text-[14.5px] leading-snug text-white/85">{i}</span>
              </li>
            ))}
          </ul>
        </div>

        <section className="mt-8 grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4 rounded-[16px] bg-card p-5 text-card-foreground">
          <img src={bookMockup} alt={BOOK_TITLE} loading="lazy" className="h-auto w-24" />
          <div><h2 className="font-display text-[19px] font-bold leading-tight">{BOOK_TITLE}</h2><p className="mt-2 text-sm text-muted-foreground">De {BOOK_AUTHOR}. Ebook incluido con Camino ORÍGEN.</p><a href={BOOK_AMAZON_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-primary">Edición física en Amazon <ArrowRight className="h-4 w-4" /></a></div>
        </section>
        {/* Oferta */}
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-[#E0B25C]">
            <Clock className="h-4 w-4" /> Este precio de lanzamiento se guarda por {mm}:{ss}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setPlan("annual")}
              className={`relative rounded-[16px] p-5 text-left transition ${plan === "annual" ? "border-2 border-[#E0B25C] bg-white/[0.1]" : "border border-white/12 bg-white/[0.05]"}`}
            >
              <span className="absolute -top-3 left-5 rounded-full bg-[#E0B25C] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#0C0614]">
                6 meses gratis
              </span>
              <p className="text-[12px] font-bold uppercase tracking-widest text-white/60">Anual</p>
              <p className="mt-2 font-display text-[30px] font-extrabold leading-none">7,49 USD<span className="text-[15px] font-bold text-white/60">/mes</span></p>
              <p className="mt-1 text-[13px] text-white/55 line-through">14,99 USD/mes</p>
              <p className="mt-2 text-[13px] text-white/70">89,99 USD al año · 7 días de prueba</p>
            </button>

            <button
              onClick={() => setPlan("monthly")}
              className={`rounded-[16px] p-5 text-left transition ${plan === "monthly" ? "border-2 border-[#E0B25C] bg-white/[0.1]" : "border border-white/12 bg-white/[0.05]"}`}
            >
              <p className="text-[12px] font-bold uppercase tracking-widest text-white/60">Mensual</p>
              <p className="mt-2 font-display text-[30px] font-extrabold leading-none">14,99 USD<span className="text-[15px] font-bold text-white/60">/mes</span></p>
              <p className="mt-1 text-[13px] text-white/55">sin compromiso largo</p>
              <p className="mt-2 text-[13px] text-white/70">Mismo acceso, mes a mes</p>
            </button>
          </div>

          <a
            href={url}
            className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#9C86FF] to-[#7C5CFF] text-[17px] font-semibold text-white shadow-[0_4px_14px_rgba(124,92,255,0.35)] transition active:scale-[.97]"
          >
            Empezar mis 7 días gratis <ArrowRight className="h-4 w-4" />
          </a>

          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { icon: X, t: "Cancelas cuando quieras" },
              { icon: ShieldCheck, t: `Primer cobro el ${firstCharge}` },
              { icon: Lock, t: "Pago seguro por Hotmart" },
            ].map((b) => (
              <li key={b.t} className="flex items-center gap-2 text-[13px] text-white/70">
                <b.icon className="h-4 w-4 shrink-0 text-[#E0B25C]" /> {b.t}
              </li>
            ))}
          </ul>
        </div>

        {/* Garantía */}
        <div className="mt-8 rounded-[16px] border border-white/10 bg-white/[0.07] p-5 sm:flex sm:items-center sm:gap-5">
          <img src={eCoin} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
          <div className="mt-3 sm:mt-0">
            <h2 className="font-display text-[20px] font-bold">Si en 7 días no ves nada distinto, no pagas</h2>
            <p className="mt-1 text-[14.5px] leading-relaxed text-white/70">
              Pruebas todo el acceso. Si no es para ti, cancelas desde la app antes del primer cobro y quedamos en paz.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8">
          <h2 className="text-center font-display text-[22px] font-bold">Lo que quizá estás pensando</h2>
          <div className="mt-4 space-y-2">
            {FAQ.map((f, i) => (
              <div key={f.q} className="rounded-[12px] border border-white/10 bg-white/[0.05]">
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  className="flex min-h-11 w-full items-center gap-3 p-4 text-left text-[14.5px] font-semibold"
                >
                  <span className="flex-1">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[#E0B25C] transition-transform ${faq === i ? "rotate-180" : ""}`} />
                </button>
                {faq === i && <p className="px-4 pb-4 text-[14px] leading-relaxed text-white/70">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Cierre */}
        <div className="mt-10 text-center">
          <h2 className="mx-auto max-w-[30ch] font-display text-[26px] font-extrabold leading-tight">
            Tu descendencia va a notar lo que decidas hoy
          </h2>
          <a
            href={url}
            className="mt-5 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#9C86FF] to-[#7C5CFF] px-8 text-[17px] font-semibold shadow-[0_4px_14px_rgba(124,92,255,0.35)] transition active:scale-[.97] sm:w-auto"
          >
            Empezar mis 7 días gratis <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mx-auto mt-4 max-w-[46ch] text-[13.5px] leading-relaxed text-white/55">
            P.D. El patrón no se cansa de repetirse solo. Un año de acompañamiento cuesta menos que una sesión suelta —y no te deja a medias.
          </p>
        </div>
      </div>

      {/* CTA fija móvil */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0C0614]/95 p-4 backdrop-blur sm:hidden" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
        <a
          href={url}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#9C86FF] to-[#7C5CFF] text-[16px] font-semibold"
        >
          Empezar mis 7 días gratis <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
