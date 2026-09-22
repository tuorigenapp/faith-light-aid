import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Loader2, Lock, Sparkles } from "lucide-react";

type Teaser = {
  headline: string;
  visible: string;
  locked: { title: string; body: string }[];
  versiculo: string;
};

/**
 * "Dios te dice hoy" abierto: la persona pone su nombre, su fecha de nacimiento
 * y (si quiere) una pregunta. Recibe lo más importante y el resto queda velado.
 */
export function DiosTeDiceHoy({ ctaTo = "/registro" }: { ctaTo?: "/registro" | "/membresia" }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState<Teaser | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dob) {
      setError("Escribe tu nombre y tu fecha de nacimiento.");
      setState("error");
      return;
    }
    setState("loading");
    setError("");
    try {
      const r = await fetch("/api/public/ministracion-teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), dob, question: question.trim() }),
      });
      const j = (await r.json()) as Teaser & { error?: string };
      if (!r.ok || j.error) {
        setError(j.error ?? "No pudimos recibir tu respuesta ahora. Intenta otra vez.");
        setState("error");
        return;
      }
      setData(j);
      setState("done");
    } catch {
      setError("Revisa tu conexión e intenta otra vez.");
      setState("error");
    }
  }

  function download() {
    if (!data) return;
    const text = `DIOS TE DICE HOY — ORÍGEN
Para: ${name}
Fecha: ${new Date().toLocaleDateString("es-MX")}

${data.headline}

${data.visible}

${data.versiculo}

— El resto de tu ministración (de qué lado viene el patrón, qué pasará en los próximos días y qué debes soltar hoy) se abre al crear tu cuenta en ORÍGEN.`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "dios-te-dice-hoy.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      id="dios-te-dice-hoy"
      className="overflow-hidden rounded-[16px] border border-border bg-card p-5 shadow-soft sm:p-7"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Gratis, ahora mismo
      </span>
      <h2 className="mt-3 font-display text-[26px] font-extrabold leading-tight">
        Dios te dice hoy
      </h2>
      <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
        Tu nombre, tu fecha de nacimiento y, si quieres, una pregunta. Recibes hoy mismo lo más
        importante que se está atendiendo en tu historia.
      </p>

      {state !== "done" && (
        <form onSubmit={submit} className="mt-5 grid gap-3 sm:max-w-md">
          <div>
            <label htmlFor="mh-name" className="text-[12px] font-bold text-foreground/70">
              Tu nombre completo
            </label>
            <input
              id="mh-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="María del Carmen Rivas"
              className="mt-1.5 h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[15px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="mh-dob" className="text-[12px] font-bold text-foreground/70">
              Tu fecha de nacimiento
            </label>
            <input
              id="mh-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[15px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="mh-q" className="text-[12px] font-bold text-foreground/70">
              Tu pregunta (opcional)
            </label>
            <input
              id="mh-q"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="¿Por qué se repite lo mismo en mis relaciones?"
              className="mt-1.5 h-12 w-full rounded-[10px] border-[1.5px] border-border bg-background px-3 text-[15px] outline-none focus:border-primary"
            />
          </div>

          {state === "error" && (
            <p className="text-[13px] font-semibold text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="grid h-14 w-full place-items-center rounded-[12px] text-[16.5px] font-bold text-primary-foreground shadow-glow transition active:scale-[.98] disabled:opacity-70"
            style={{ background: "var(--gradient-primary)" }}
          >
            {state === "loading" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Abriendo tu respuesta…
              </span>
            ) : (
              "Ver mi respuesta de hoy"
            )}
          </button>
          <p className="text-center text-[12px] text-muted-foreground">
            No pedimos tarjeta ni teléfono. Tarda unos segundos.
          </p>
        </form>
      )}

      {state === "done" && data && (
        <div className="mt-5">
          <div className="rounded-[16px] border-2 border-primary bg-background p-5 shadow-elev">
            <h3 className="font-display text-[20px] font-extrabold leading-tight">
              {data.headline}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed">{data.visible}</p>
            {data.versiculo && (
              <p className="scripture mt-4 text-[13.5px] text-muted-foreground">{data.versiculo}</p>
            )}
            <button
              type="button"
              onClick={download}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary/10 px-4 text-[14px] font-bold text-primary"
            >
              <Download className="h-4 w-4" /> Descargar lo que recibí
            </button>
          </div>

          <p className="mt-5 text-[13px] font-bold uppercase tracking-widest text-primary">
            Lo que falta de tu ministración
          </p>
          <div className="mt-3 grid gap-3">
            {(data.locked.length
              ? data.locked
              : [
                  { title: "De qué lado viene el patrón", body: "" },
                  { title: "Qué pasará en los próximos días", body: "" },
                  { title: "Qué debes soltar hoy", body: "" },
                ]
            ).map((l) => (
              <div
                key={l.title}
                className="relative overflow-hidden rounded-[16px] border border-border bg-card p-4"
              >
                <p className="flex items-center gap-2 text-[14.5px] font-bold">
                  <Lock className="h-4 w-4 shrink-0 text-primary" /> {l.title}
                </p>
                <p
                  aria-hidden
                  className="mt-2 select-none text-[13.5px] leading-relaxed text-muted-foreground blur-[6px]"
                >
                  {l.body ||
                    "Esta parte de tu ministración está reservada: nombra la línea familiar exacta de la que viene tu patrón y la instrucción concreta para cerrarlo esta misma semana."}
                </p>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
              </div>
            ))}
          </div>

          <Link
            to={ctaTo}
            className="mt-5 grid h-14 w-full place-items-center rounded-[12px] text-[16.5px] font-bold text-primary-foreground shadow-glow active:scale-[.98]"
            style={{ background: "var(--gradient-primary)" }}
          >
            Abrir mi ministración completa
          </Link>
          <p className="mt-2 text-center text-[12px] text-muted-foreground">
            Creas tu cuenta gratis y disfrutas 7 días de acceso completo.
          </p>
        </div>
      )}
    </section>
  );
}
