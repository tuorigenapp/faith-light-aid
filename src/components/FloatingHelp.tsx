import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { HelpCircle, X, MessageCircle, Mail, Compass, Leaf, ChevronDown } from "lucide-react";

const LINKS = [
  { icon: MessageCircle, label: "Hablar con la mentora", to: "/chat" as const },
];

const FAQ = [
  {
    q: "¿Qué es el Método ORÍGEN?",
    a: "Un camino guiado que primero identifica el patrón que se repite en tu historia familiar, después te da la enseñanza y el ejercicio del día, y al final cierra el ciclo con oración y una acción concreta. Un día a la vez, sin atracones.",
  },
  {
    q: "¿Qué son las hojas de sanación y cómo las consigo?",
    a: "Son tu saldo dentro de la app. Se cuentan de una en una (1, 2, 3…) y avanzas hacia la siguiente cada vez que haces algo real: tu etapa del día, un ejercicio, el quiz de la Palabra, los juegos o la ruleta. Al día avanzas como máximo un tercio de una hoja, así que una hoja completa toma al menos 3 días.",
  },
  {
    q: "¿Para qué gasto las hojas?",
    a: "Las hojas sirven para abrir tus consultas: Consulta de pareja, Patrones familiares, Ministración y «Dios te dice hoy» (1 hoja cada una), y para tu día de conversación con la mentora Ruth (1 hoja por día, no por mensaje). También puedes regalarlas a otra persona desde Mi árbol → Transferir Balance, y ver cada movimiento en tu Historial.",
  },
  {
    q: "¿Por qué solo puedo hacer una etapa por día?",
    a: "Porque el cambio real necesita asentarse. Cada etapa se abre al día siguiente para que lo vivas, no para que lo leas de corrido.",
  },
  {
    q: "¿Esto reemplaza a la terapia?",
    a: "No. ORÍGEN es acompañamiento espiritual y de crecimiento personal. Si estás en tratamiento, es un complemento: nunca sustituye la atención profesional.",
  },
  {
    q: "¿Me van a imponer una religión?",
    a: "No. Partimos de la fe cristiana con respeto: te invitamos, no te presionamos. Tú decides qué oración haces y qué escribes en tu diario.",
  },
  {
    q: "¿No tengo tiempo, cuánto me toma al día?",
    a: "Entre 5 y 10 minutos: la Palabra de hoy, tu etapa del día y un ejercicio corto. Todo queda guardado por si lo retomas mañana.",
  },
  {
    q: "¿Ya probé otras apps y libros, en qué es distinto?",
    a: "Aquí no recibes contenido genérico: el diagnóstico y las consultas trabajan sobre tu historia, tu línea paterna o materna y tu situación actual.",
  },
  {
    q: "¿Cómo funciona la Ruleta de Premios?",
    a: "Un giro cada 24 horas y siempre ganas algo: hojas de sanación o una consulta acreditada. El tiempo se cuenta desde tu último giro guardado, aunque salgas de la app.",
  },
  {
    q: "¿Puedo cancelar la membresía cuando quiera?",
    a: "Sí, cuando quieras y desde la sección Membresía. Te avisamos antes de cualquier cobro y conservas lo que ya trabajaste.",
  },
  {
    q: "¿Se borra algo si elimino una entrada del diario?",
    a: "No de inmediato: va a la papelera por 30 días y puedes restaurarla con un clic o eliminarla definitivamente tú.",
  },
];

export function FloatingHelp() {
  const [open, setOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [item, setItem] = useState<number | null>(null);
  const navigate = useNavigate();

  function startTour() {
    localStorage.removeItem("origen_tour_done");
    setOpen(false);
    navigate({ to: "/dashboard" });
  }

  return (
    <>
      {(open || faqOpen) && (
        <div
          className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px]"
          onClick={() => { setOpen(false); setFaqOpen(false); }}
        />
      )}

      {faqOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[82dvh] overflow-y-auto rounded-t-[20px] border-t border-border/60 bg-card p-5 shadow-elevated animate-in slide-in-from-bottom sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[420px] sm:rounded-[16px] sm:border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[20px] font-bold leading-tight">Preguntas frecuentes</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">Lo que más nos preguntan sobre ORÍGEN.</p>
            </div>
            <button onClick={() => setFaqOpen(false)} aria-label="Cerrar preguntas" className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-secondary">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {FAQ.map((f, i) => (
              <div key={f.q} className="rounded-[12px] border border-border/60 bg-background">
                <button
                  onClick={() => setItem(item === i ? null : i)}
                  className="flex min-h-11 w-full items-center gap-3 p-3 text-left text-[14px] font-semibold"
                >
                  <span className="flex-1">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-primary transition-transform ${item === i ? "rotate-180" : ""}`} />
                </button>
                {item === i && (
                  <p className="px-3 pb-3 text-[13.5px] leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-top-1">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>

          <a
            href="mailto:supportorigenapp@gmail.com"
            className="mt-4 flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            <Mail className="h-4 w-4" /> No encontré mi respuesta, escribir a soporte
          </a>
        </div>
      )}

      <div className="fixed bottom-[92px] left-4 z-50">
        {open && (
          <div className="mb-3 w-[248px] rounded-[16px] border border-border/60 bg-card p-3 shadow-elevated animate-in fade-in slide-in-from-bottom-2">
            <p className="px-1 pb-2 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
              ¿Te ayudo con algo?
            </p>
            <div className="space-y-1">
              <button
                onClick={() => { setOpen(false); setFaqOpen(true); setItem(0); }}
                className="flex w-full min-h-11 items-center gap-3 rounded-[10px] px-2 text-left text-sm font-medium hover:bg-secondary"
              >
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary/10 text-primary">
                  <HelpCircle className="h-4 w-4" />
                </span>
                Preguntas frecuentes
              </button>
              <button
                onClick={startTour}
                className="flex w-full min-h-11 items-center gap-3 rounded-[10px] px-2 text-left text-sm font-medium hover:bg-secondary"
              >
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary/10 text-primary">
                  <Compass className="h-4 w-4" />
                </span>
                Ver el tour de la app
              </button>
              {LINKS.map((it) => (
                <Link
                  key={it.label}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-[10px] px-2 text-sm font-medium hover:bg-secondary"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary/10 text-primary">
                    <it.icon className="h-4 w-4" />
                  </span>
                  {it.label}
                </Link>
              ))}

              <button
                onClick={() => { setOpen(false); setFaqOpen(true); setItem(1); }}
                className="flex w-full min-h-11 items-center gap-3 rounded-[10px] px-2 text-left text-sm font-medium hover:bg-secondary"
              >
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary/10 text-primary">
                  <Leaf className="h-4 w-4" />
                </span>
                Para qué sirven las hojas
              </button>
              <a
                href="mailto:supportorigenapp@gmail.com"
                className="flex min-h-11 items-center gap-3 rounded-[10px] px-2 text-sm font-medium hover:bg-secondary"
              >
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </span>
                Escribir a soporte
              </a>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Cerrar ayuda" : "Abrir ayuda"}
          className="grid h-12 w-12 place-items-center rounded-full bg-card text-primary shadow-elevated border border-border/60 active:scale-[.97] transition"
        >
          {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
}
