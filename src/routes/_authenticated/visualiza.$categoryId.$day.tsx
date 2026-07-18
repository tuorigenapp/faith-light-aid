import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Play, Pause, Download, ArrowLeft, Check, Headphones } from "lucide-react";
import { jsPDF } from "jspdf";

export const Route = createFileRoute("/_authenticated/visualiza/$categoryId/$day")({
  head: () => ({ meta: [{ title: "Método de Cristo — Reconectando" }] }),
  component: DayPlayer,
});

function DayPlayer() {
  const { categoryId, day } = useParams({ from: "/_authenticated/visualiza/$categoryId/$day" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [yaTengo, setYaTengo] = useState("");
  const [yoSoy, setYoSoy] = useState("");
  const [gratitud, setGratitud] = useState("");
  const [peticion, setPeticion] = useState("");

  const { data } = useQuery({
    queryKey: ["day-audio", categoryId, day, user?.id],
    queryFn: async () => {
      const [cat, audio] = await Promise.all([
        supabase.from("manifest_categories").select("*").eq("id", categoryId).maybeSingle(),
        supabase.from("manifest_audios").select("*").eq("category_id", categoryId).eq("day_index", Number(day)).maybeSingle(),
      ]);
      const entry = audio.data && user ? await supabase.from("manifest_entries").select("*").eq("user_id", user.id).eq("audio_id", audio.data.id).maybeSingle() : { data: null };
      return { cat: cat.data, audio: audio.data, entry: entry.data };
    },
  });

  useEffect(() => {
    if (!data?.entry) return;
    setYaTengo(data.entry.ya_tengo ?? "");
    setYoSoy(data.entry.yo_soy ?? "");
    setGratitud(data.entry.gratitud ?? "");
    setPeticion(data.entry.peticion ?? "");
  }, [data?.entry]);

  const c = data?.cat;
  const a = data?.audio;

  function togglePlay() {
    if (!audioRef.current || !a?.audio_url) return;
    if (playing) audioRef.current.pause(); else { audioRef.current.play(); markPlayed(); }
    setPlaying(!playing);
  }

  async function markPlayed() {
    if (!user || !a) return;
    await supabase.from("manifest_entries").upsert({ user_id: user.id, audio_id: a.id, played: true }, { onConflict: "user_id,audio_id" });
  }

  async function saveAndComplete() {
    if (!user || !a) return;
    if (!yaTengo.trim() || !yoSoy.trim() || !gratitud.trim() || !peticion.trim()) return toast.error("Completa los 4 campos del método.");
    const { error } = await supabase.from("manifest_entries").upsert({
      user_id: user.id, audio_id: a.id, ya_tengo: yaTengo, yo_soy: yoSoy, gratitud, peticion, played: true, completed: true,
    }, { onConflict: "user_id,audio_id" });
    if (error) return toast.error(error.message);
    toast.success("Ejercicio guardado ✓");
    qc.invalidateQueries();
  }

  function downloadPdf() {
    if (!c || !a) return;
    const doc = new jsPDF({ format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    doc.setFont("times", "italic"); doc.setFontSize(11);
    doc.text(`CATEGORÍA: ${c.title.toUpperCase()}`, w / 2, 20, { align: "center" });
    doc.setFont("times", "bold"); doc.setFontSize(24);
    doc.text("MÉTODO DE CRISTO", w / 2, 32, { align: "center" });
    doc.setFont("helvetica", "italic"); doc.setFontSize(10);
    doc.text(`Hoy es: ___/___/____   ·   Día ${a.day_index}`, w / 2, 42, { align: "center" });

    let y = 55;
    const section = (label: string, box: number) => {
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.setTextColor(30);
      const lines = doc.splitTextToSize(label, w - 30);
      doc.text(lines, 15, y); y += lines.length * 5 + 2;
      doc.setDrawColor(150); doc.setLineWidth(0.3); doc.roundedRect(15, y, w - 30, box, 3, 3);
      y += box + 8;
    };
    section("Escribe 3 veces aquello que ya ves realizado en tu vida por fe en tiempo presente", 28);
    section("Escribe 6 veces la identidad que estás desarrollando para caminar en esa promesa", 45);
    section("Escribe 9 veces una declaración de gratitud conforme a la voluntad de Dios", 60);
    section("Finaliza cada ejercicio escribiendo una petición sencilla y directa", 18);
    doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(120);
    doc.text("Guía del libro: Reconectando el Espíritu con Dios", w / 2, 285, { align: "center" });
    doc.save(`metodo-cristo-${categoryId}-dia${day}.pdf`);
  }

  if (!c || !a) return <div className="p-8">Cargando...</div>;

  return (
    <div className="pb-32">
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${c.color ?? "#7C6AED"}, ${(c.color ?? "#7C6AED")}77 40%, transparent)` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        <div className="relative max-w-3xl mx-auto px-4 md:px-8 pt-6 pb-10">
          <Link to="/visualiza/$categoryId" params={{ categoryId }} className="inline-flex items-center gap-2 text-white/95 text-sm"><ArrowLeft className="w-4 h-4" /> {c.title}</Link>
          <div className="text-center mt-6">
            <div className="text-[11px] uppercase tracking-widest text-white/80 font-bold">Día {a.day_index} de 21</div>
            <div className="mx-auto mt-4 w-56 h-56 md:w-64 md:h-64 rounded-3xl grid place-items-center shadow-glow" style={{ background: c.color ?? "#7C6AED" }}>
              <Headphones className="w-24 h-24 text-white/95 drop-shadow" />
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="text-[11px] uppercase tracking-widest text-primary font-bold">Afirmación del día</div>
            <p className="font-display font-extrabold text-2xl md:text-3xl mt-2 text-foreground leading-tight">"{a.affirmation}"</p>
            <p className="text-sm text-muted-foreground mt-3">Repite: Mañana <b>3 veces</b> · Tarde <b>6 veces</b> · Noche <b>9 veces</b> — durante 21 días.</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-5">
        <Card className="rounded-[1.7rem] p-5 shadow-soft">
          {a.audio_url ? (
            <>
              <audio
                ref={audioRef}
                src={a.audio_url}
                onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onEnded={() => { setPlaying(false); markPlayed(); }}
              />
              <div className="flex items-center gap-4">
                <Button onClick={togglePlay} size="icon" className="h-14 w-14 rounded-full bg-primary shadow-glow">
                  {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{a.title}</div>
                  <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
                    <span>{fmt(progress)}</span><span>{fmt(duration)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Headphones className="w-10 h-10 mx-auto text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground mt-3">🎧 El audio guiado se libera pronto. Mientras tanto, puedes hacer el ejercicio escrito abajo.</p>
            </div>
          )}
        </Card>

        <Card className="rounded-[1.7rem] p-5 md:p-6 shadow-soft">
          <div className="text-[11px] uppercase tracking-widest text-primary font-bold">Tu ejercicio Método de Cristo</div>
          <div className="mt-4 space-y-5">
            <Field label="Escribe 3 veces aquello que ya ves realizado en tu vida por fe en tiempo presente (YA TENGO)" value={yaTengo} set={setYaTengo} placeholder={c.affirmation_ya_tengo} rows={3} />
            <Field label="Escribe 6 veces la identidad que estás desarrollando para caminar en esa promesa (YO SOY)" value={yoSoy} set={setYoSoy} placeholder={c.identity_yo_soy} rows={5} />
            <Field label="Escribe 9 veces una declaración de gratitud conforme a la voluntad de Dios (GRATITUD)" value={gratitud} set={setGratitud} placeholder={c.gratitude_gracias} rows={7} />
            <Field label="Finaliza con una petición sencilla y directa al Espíritu Santo" value={peticion} set={setPeticion} placeholder={c.petition} rows={2} />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={saveAndComplete} className="flex-1 rounded-full h-12 bg-primary"><Check className="w-4 h-4 mr-2" /> Guardar y marcar completado</Button>
            <Button onClick={downloadPdf} variant="outline" className="rounded-full h-12"><Download className="w-4 h-4 mr-2" /> Descargar PDF imprimible</Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-3">El PDF sigue el formato blanco y negro del libro para llenarlo a mano.</p>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, set, placeholder, rows }: { label: string; value: string; set: (v: string) => void; placeholder: string; rows: number }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Textarea value={value} onChange={(e) => set(e.target.value)} rows={rows} placeholder={placeholder} className="mt-2 rounded-2xl font-mono text-sm" />
    </div>
  );
}

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60); const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}
