import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import logo from "@/assets/logo-origen.png";
import mockup from "@/assets/origen-mockup.png.asset.json";
import eHeartPurple from "@/assets/e3d-heart-purple.png";
import eCross from "@/assets/e3d-cross.png";
import eStar from "@/assets/e3d-star.png";
import ePractice from "@/assets/e3d-practice.png";
import eHeadphones from "@/assets/e3d-headphones.png";
import eBrain from "@/assets/e3d-brain.png";
import lpIdentificacion from "@/assets/lp-identificacion.png.asset.json";
import lpObtienes from "@/assets/lp-obtienes.png.asset.json";
import lpIncluye from "@/assets/lp-incluye.png.asset.json";
import lpEspiritual from "@/assets/lp-espiritual.png.asset.json";
import lpRecibes from "@/assets/lp-recibes.png.asset.json";
import { PaymentMethods } from "@/components/PaymentMethods";
import { ReviewsSlider } from "@/components/ReviewsSlider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Camino ORÍGEN — rompe el patrón que se repite en tu historia" },
      {
        name: "description",
        content:
          "Descubre en 3 minutos si tu patrón viene por línea paterna o materna y recibe tu camino diario de sanación. 7 días de prueba, cancelas cuando quieras.",
      },
      { property: "og:title", content: "Camino ORÍGEN — rompe el patrón que se repite" },
      {
        property: "og:description",
        content:
          "Diagnóstico de tu patrón familiar, mentora diaria y caminos de 365 días. Empieza gratis hoy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const PAINS = [
  { emoji: eHeartPurple, text: "“Repito los mismos errores y ya no sé cómo pararlo.”" },
  { emoji: eCross, text: "“Siento un vacío que no puedo explicar con palabras.”" },
  { emoji: eStar, text: "“Empiezo con todo y a los tres días lo abandono.”" },
];

const STEPS = [
  {
    emoji: eBrain,
    title: "1. Diagnóstico de tu raíz",
    body: "Respondes 7 preguntas y sabes qué se repite, desde cuándo y si viene por tu línea paterna o materna.",
  },
  {
    emoji: ePractice,
    title: "2. Tu camino diario",
    body: "Un solo paso al día de 5 a 10 minutos: ejercicio, palabra, reflexión y una tarea concreta.",
  },
  {
    emoji: eHeadphones,
    title: "3. Lo vives, no solo lo lees",
    body: "Audios de manifestación guiada, mentora que conoce tu historia y consultas con informe en PDF.",
  },
];

const INCLUDE = [
  "Diagnóstico completo de tu patrón familiar (línea paterna o materna)",
  "Camino ORÍGEN día por día, con tu progreso guardado",
  "Mentora disponible todos los días desde tu historia real",
  "Consultas con PDF: Pareja, Patrones familiares y «Dios te dice hoy»",
  "Palabra de hoy con enseñanza, quiz e imagen para compartir",
  "Biblioteca con 82 libros y playlists de manifestación guiada",
  "Árbol de sanación, hojas, ruleta y premios por constancia",
];

const FAQ = [
  {
    q: "Ya probé terapia, libros y otras apps. ¿Por qué esto sería distinto?",
    a: "Porque no partimos de contenido general: partimos de tu historia y de tu línea familiar. El diagnóstico y las consultas responden a tu caso concreto, no a un promedio.",
  },
  {
    q: "No tengo tiempo.",
    a: "De 5 a 10 minutos al día. Una etapa por día, a propósito: el cambio necesita asentarse, no acumularse.",
  },
  {
    q: "No quiero que me impongan una religión.",
    a: "Partimos de la fe cristiana con respeto absoluto. Te invitamos, nunca te presionamos. Tú eliges qué oras y qué escribes.",
  },
  {
    q: "¿Cuánto cuesta y cuándo me cobran?",
    a: "Tienes 7 días de prueba. Si sigues, el plan mensual es 14,99 USD y el anual sale en 5,99 USD al mes. Te avisamos antes de cualquier cobro y cancelas desde la app.",
  },
  {
    q: "¿Y si no es para mí?",
    a: "Cancelas cuando quieras dentro de los 7 días y no se cobra nada. Sin llamadas, sin formularios raros.",
  },
];

function Landing() {
  const [faq, setFaq] = useState<number | null>(0);
  const [left, setLeft] = useState(15 * 60);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 560);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  const chargeDate = new Date(Date.now() + 7 * 86400000).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-dvh bg-background pb-28">
      {/* Barra superior */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-[1100px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={logo}
              alt="ORÍGEN"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="truncate font-display text-[15px] font-extrabold tracking-tight">
              ORÍGEN
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/registro"
              className="grid h-10 place-items-center rounded-[10px] px-3 text-[13px] font-semibold text-foreground/75"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="grid h-10 place-items-center rounded-[12px] bg-primary px-4 text-[13px] font-bold text-primary-foreground shadow-glow"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-4">
        {/* HERO */}
        <section
          className="relative -mx-4 overflow-hidden px-4 pb-8 pt-7"
          style={{
            background: "radial-gradient(120% 90% at 50% 0%, #EFE7FF 0%, var(--background) 62%)",
          }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> 7 días de prueba · sin tarjeta para empezar
          </div>
          <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1] sm:text-[40px]">
            Descubre en 3 minutos el patrón que se repite en tu historia — y empieza a cerrarlo hoy
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            No es otra app de frases. Es un diagnóstico de tu línea familiar y un paso concreto cada
            día para que lo que heredaste no siga decidiendo por ti.
          </p>

          <img
            src={mockup.url}
            alt="Todo lo que incluye el Camino ORÍGEN: app, audios guiados, biblioteca y ejercicios"
            width={1400}
            height={1000}
            className="mt-6 w-full"
          />

          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { icon: Users, label: "+18.400 personas" },
              { icon: Star, label: "4,8 de 5" },
              { icon: Lock, label: "Pago seguro" },
            ].map((b) => (
              <div
                key={b.label}
                className="rounded-[12px] border border-border bg-card px-2 py-2.5 text-center"
              >
                <b.icon className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 text-[11.5px] font-bold leading-tight">{b.label}</p>
              </div>
            ))}
          </div>

          <Link
            to="/registro"
            className="mt-5 grid h-14 w-full place-items-center rounded-[12px] text-[16.5px] font-bold text-primary-foreground shadow-glow active:scale-[.98]"
            style={{ background: "var(--gradient-primary)" }}
          >
            Empezar mis 7 días gratis
          </Link>
          <p className="mt-2 text-center text-[12px] text-muted-foreground">
            Primer cobro el {chargeDate}. Te avisamos antes y cancelas en un toque.
          </p>
        </section>

        {/* PROBLEMA */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-extrabold leading-tight">
            ¿Te suena alguna de estas frases?
          </h2>
          <div className="mt-4 space-y-3">
            {PAINS.map((p) => (
              <div
                key={p.text}
                className="flex items-start gap-3 rounded-[16px] border border-border bg-card p-4"
              >
                <img
                  src={p.emoji}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 object-contain"
                />
                <p className="min-w-0 text-[15px] font-medium leading-snug">{p.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
            Eso no es falta de voluntad. Es un patrón que aprendiste antes de poder elegirlo — y
            mientras no se nombra, se hereda.
          </p>
        </section>

        {/* MECANISMO */}
        <section className="mt-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            El método ORÍGEN
          </p>
          <h2 className="mt-1 font-display text-[26px] font-extrabold leading-tight">
            Tres pasos, cinco minutos al día
          </h2>
          <div className="hairline-brand mt-3" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.title}
                className="rounded-[16px] border border-border bg-card p-5 shadow-soft"
              >
                <img
                  src={s.emoji}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                />
                <h3 className="mt-3 font-display text-[17px] font-bold leading-tight">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* IDENTIFICACIÓN */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-extrabold leading-tight">
            Si te identificas con una sola de estas situaciones, esto es para ti
          </h2>
          <img
            src={lpIdentificacion.url}
            alt="Siete situaciones emocionales comunes: repetir patrones, cansancio, relaciones que duelen, culpa heredada"
            width={1080}
            height={1350}
            loading="lazy"
            className="mt-4 w-full rounded-[16px]"
          />
        </section>

        {/* TODO EN UN SOLO LUGAR */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-extrabold leading-tight">
            Todo en un solo lugar
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
            Lo abres en el celular, en la tablet o en la computadora. Tu progreso viaja contigo.
          </p>
          <img
            src={lpObtienes.url}
            alt="La app ORÍGEN en computadora, celular, tablet y reloj, con diario y audios guiados"
            width={1080}
            height={1080}
            loading="lazy"
            className="mt-4 w-full rounded-[16px]"
          />
        </section>

        {/* LO QUE ENCONTRARÁS DENTRO */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-extrabold leading-tight">
            Todo lo que incluye tu membresía
          </h2>
          <img
            src={lpIncluye.url}
            alt="Lista de doce beneficios incluidos en la membresía ORÍGEN"
            width={1080}
            height={1350}
            loading="lazy"
            className="mt-4 w-full rounded-[16px]"
          />
        </section>

        {/* EXPERIENCIA ESPIRITUAL / ANTES Y DESPUÉS */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-extrabold leading-tight">
            Lo que lograrás dentro de ORÍGEN
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
            No es información nueva: es un cambio real en cómo respondes a lo de siempre.
          </p>
          <img
            src={lpEspiritual.url}
            alt="Comparación antes y después: de repetir el patrón a vivir con paz, propósito y libertad"
            width={1080}
            height={1350}
            loading="lazy"
            className="mt-4 w-full rounded-[16px]"
          />
        </section>

        {/* TODO LO QUE RECIBES */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-extrabold leading-tight">
            Todo lo que recibes hoy
          </h2>
          <img
            src={lpRecibes.url}
            alt="Paquete completo ORÍGEN: acceso en todos tus dispositivos, audios, diario y soporte por WhatsApp"
            width={1080}
            height={1080}
            loading="lazy"
            className="mt-4 w-full rounded-[16px]"
          />
        </section>

        {/* DIFERENCIACIÓN */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-extrabold leading-tight">
            Por qué ORÍGEN no se parece a lo que ya probaste
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              [
                "Otras apps te dan frases",
                "ORÍGEN te dice qué se repite en tu línea familiar y por dónde entró",
              ],
              [
                "Los cursos te dejan solo",
                "Aquí tienes una mentora que recuerda tu historia todos los días",
              ],
              [
                "Los libros informan",
                "Aquí haces un ejercicio concreto de 5 a 10 minutos cada día",
              ],
              [
                "Los retos duran una semana",
                "Tu camino tiene 365 días y tu progreso queda guardado",
              ],
            ].map(([antes, despues]) => (
              <div
                key={antes}
                className="rounded-[16px] border border-border bg-card p-4 shadow-soft"
              >
                <p className="text-[13px] font-semibold leading-snug text-muted-foreground line-through decoration-1">
                  {antes}
                </p>
                <p className="mt-2 flex items-start gap-2.5 text-[14px] font-semibold leading-snug">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">{despues}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* OFERTA / MINI CHECKOUT */}

        <section id="oferta" className="mt-12">
          <div className="rounded-[16px] border-2 border-primary bg-card p-5 shadow-elev">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <p className="min-w-0 font-display text-[19px] font-extrabold leading-tight">
                Todo incluido, un solo acceso
              </p>
              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-bold text-primary">
                6 meses gratis al año
              </span>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-[40px] font-extrabold leading-none">$5.99</span>
              <span className="pb-1 text-[13px] font-semibold text-muted-foreground">
                USD / mes en el plan anual
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              O 14,99 USD al mes. Empiezas con 7 días gratis en cualquiera de los dos.
            </p>

            <ul className="mt-4 space-y-2">
              {INCLUDE.map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 text-[14px] leading-snug">{i}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-2 rounded-[12px] bg-secondary/70 px-3 py-2.5">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <p className="min-w-0 text-[12.5px] font-semibold">
                Este precio de lanzamiento se mantiene {mm}:{ss}
              </p>
            </div>

            <Link
              to="/registro"
              className="mt-4 grid h-14 w-full place-items-center rounded-[12px] text-[16.5px] font-bold text-primary-foreground shadow-glow active:scale-[.98]"
              style={{ background: "var(--gradient-primary)" }}
            >
              Empezar mis 7 días gratis
            </Link>
            <p className="mt-2 text-center text-[12px] text-muted-foreground">
              Cancelas cuando quieras · te avisamos antes del cobro · pago protegido
            </p>

            <PaymentMethods className="mt-5" />
          </div>
        </section>

        {/* GARANTÍA */}
        <section className="mt-12 flex items-start gap-3 rounded-[16px] border border-border bg-card p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-[17px] font-bold">
              Prueba tranquilo: 7 días completos
            </h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
              Entra, haz tu diagnóstico, vive tus primeros días. Si no sientes que algo se movió,
              cancelas antes del séptimo día y no se cobra nada.
            </p>
          </div>
        </section>

        <ReviewsSlider />

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="font-display text-[26px] font-extrabold leading-tight">
            Antes de empezar, quizá te preguntas…
          </h2>
          <div className="mt-4 space-y-2">
            {FAQ.map((f, i) => (
              <div
                key={f.q}
                className="overflow-hidden rounded-[16px] border border-border bg-card"
              >
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  className="grid min-h-[52px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="min-w-0 text-[14.5px] font-semibold leading-snug">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${faq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {faq === i && (
                  <p className="px-4 pb-4 text-[13.5px] leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section
          className="mt-12 rounded-[16px] p-6 text-center"
          style={{ background: "var(--gradient-brand-soft)" }}
        >
          <h2 className="font-display text-[26px] font-extrabold leading-tight">
            Lo que no se sana, se hereda. Hoy puedes cortar la cadena.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-[14.5px] leading-relaxed text-muted-foreground">
            Tres minutos para saber de dónde viene. El resto de tu vida para vivir distinto.
          </p>
          <Link
            to="/registro"
            className="mt-5 grid h-14 w-full place-items-center rounded-[12px] text-[16.5px] font-bold text-primary-foreground shadow-glow active:scale-[.98]"
            style={{ background: "var(--gradient-primary)" }}
          >
            Hacer mi diagnóstico gratis <ArrowRight className="ml-2 inline h-4 w-4" />
          </Link>
          <p className="mx-auto mt-4 max-w-lg text-left text-[12.5px] leading-relaxed text-muted-foreground">
            <strong>P.D.</strong> Si llegaste hasta aquí es porque algo dentro ya sabe qué se
            repite. No necesitas otro libro: necesitas empezar.
          </p>
        </section>

        {/* FOOTER */}
        <footer className="mt-12 border-t border-border pt-6 text-[12.5px] text-muted-foreground">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="/terminos" className="underline-offset-2 hover:underline">
              Términos
            </a>
            <a href="/privacidad" className="underline-offset-2 hover:underline">
              Privacidad
            </a>
            <a href="/reembolsos" className="underline-offset-2 hover:underline">
              Reembolsos
            </a>
            <a href="/disclaimer-ia" className="underline-offset-2 hover:underline">
              Uso de IA
            </a>
          </div>
          <p className="mt-3">Soporte: infodenegociorm@gmail.com</p>
          <p className="mt-1">
            © {new Date().getFullYear()} ORÍGEN. Acompañamiento espiritual, no sustituye atención
            médica o psicológica.
          </p>
        </footer>
      </div>

      {/* CTA fija móvil */}
      {sticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <Link
            to="/registro"
            className="grid h-14 w-full place-items-center rounded-[12px] text-[16px] font-bold text-primary-foreground shadow-glow active:scale-[.98]"
            style={{ background: "var(--gradient-primary)" }}
          >
            Empezar mis 7 días gratis
          </Link>
        </div>
      )}
    </main>
  );
}
