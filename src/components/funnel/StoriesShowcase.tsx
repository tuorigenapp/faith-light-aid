import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import p1 from "@/assets/reviews/historia-01.jpg";
import p2 from "@/assets/reviews/historia-02.jpg";
import p3 from "@/assets/reviews/historia-03.jpg";
import p4 from "@/assets/reviews/historia-04.jpg";

const STORIES = [
  { img: p1, name: "Daniela O.", place: "Ciudad de Panamá", tag: "Patrón con mamá", text: "Siempre terminaba gritando como ella. Con el diagnóstico entendí de dónde venía y hoy respiro antes de responder.", day: "Día 18" },
  { img: p2, name: "Roberto S.", place: "San José, CR", tag: "Vacío interior", text: "Tenía un vacío que no sabía explicar. La Palabra del día y el diario me devolvieron la calma de las mañanas.", day: "Día 33" },
  { img: p3, name: "Valeria T.", place: "Caracas, VE", tag: "Empiezo y abandono", text: "Nunca terminaba nada. Cinco minutos al día fue lo único que pude sostener, y ya voy por la etapa 6.", day: "Día 27" },
  { img: p4, name: "Gloria M.", place: "Miami, EE. UU.", tag: "Árbol familiar", text: "Llenar mi árbol me mostró la misma herida en tres generaciones. Ahora la estoy cortando con Dios.", day: "Día 45" },
];

/** Carrusel grande de historias, con avance automático suave. */
export function StoriesShowcase() {
  const [i, setI] = useState(0);
  const s = STORIES[i]!;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % STORIES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const go = (d: number) => setI((n) => (n + d + STORIES.length) % STORIES.length);
  return (
    <section className="mt-12" aria-roledescription="carrusel" aria-label="Historias de ORÍGEN">
      <p className="text-center text-[12px] font-bold uppercase tracking-widest text-primary">Así se vive por dentro</p>
      <h2 className="mt-1 text-center font-display text-[26px] font-extrabold leading-tight sm:text-[32px]">Personas como tú, rompiendo el ciclo</h2>
      <article key={i} className="relative mx-auto mt-5 max-w-2xl overflow-hidden rounded-[24px] bg-card shadow-[0_8px_30px_rgba(30,25,20,.12)] sm:grid sm:grid-cols-[240px_1fr]" style={{ animation: "fade-in .4s ease-out both" }}>
        <img src={s.img} alt={`Retrato de ${s.name}`} loading="lazy" width={816} height={816} className="aspect-[4/3] w-full object-cover sm:aspect-auto sm:h-full" />
        <div className="p-5 sm:p-6">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">{s.tag}</span>
          <div className="mt-3 flex gap-0.5 text-primary" aria-label="5 estrellas">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}</div>
          <Quote className="mt-3 h-6 w-6 text-primary/40" />
          <p className="mt-1 text-[16px] font-medium leading-relaxed">{s.text}</p>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
            <div><p className="text-[14px] font-bold">{s.name}</p><p className="text-[12px] text-muted-foreground">{s.place}</p></div>
            <span className="rounded-[10px] bg-cta-green/10 px-3 py-1.5 text-[12px] font-bold text-cta-green dark:text-success">{s.day} en ORÍGEN</span>
          </div>
        </div>
      </article>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" aria-label="Historia anterior" className="h-11 w-11" onClick={() => go(-1)}><ChevronLeft className="h-5 w-5" /></Button>
        {STORIES.map((x, k) => <button key={x.name} aria-label={`Ver historia de ${x.name}`} onClick={() => setI(k)} className="grid h-11 w-6 place-items-center"><span className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-primary" : "w-1.5 bg-border"}`} /></button>)}
        <Button variant="outline" size="icon" aria-label="Siguiente historia" className="h-11 w-11" onClick={() => go(1)}><ChevronRight className="h-5 w-5" /></Button>
      </div>
    </section>
  );
}
