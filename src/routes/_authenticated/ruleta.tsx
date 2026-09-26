import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift, Loader2, Sparkles, History, Trophy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { celebrate } from "@/lib/celebrate";
import { EmptyState } from "@/components/EmptyState";
import { WHEEL_PRIZES, formatRemaining, prizeByKey } from "@/lib/ruleta";
import { getWheelState, spinWheel } from "@/lib/ruleta.functions";
import origenIcon from "@/assets/origen-o-icon.png";

export const Route = createFileRoute("/_authenticated/ruleta")({
  head: () => ({
    meta: [
      { title: "Ruleta de Premios — ORÍGEN" },
      { name: "description", content: "Gira una vez cada 24 horas y gana hojas de sanación y consultas dentro de ORÍGEN." },
      { property: "og:title", content: "Ruleta de Premios — ORÍGEN" },
      { property: "og:description", content: "Gira una vez cada 24 horas y gana hojas de sanación y consultas dentro de ORÍGEN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RuletaPage,
});

const SECTORS = WHEEL_PRIZES.length;
const SECTOR_ANGLE = 360 / SECTORS;
const R = 150;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function sectorPath(i: number) {
  const start = i * SECTOR_ANGLE;
  const end = start + SECTOR_ANGLE;
  const p1 = polar(R, R, R, start);
  const p2 = polar(R, R, R, end);
  return `M ${R} ${R} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${R} ${R} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
}

function RuletaPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const spin = useServerFn(spinWheel);
  const readState = useServerFn(getWheelState);

  const wheelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [result, setResult] = useState<{ key: string } | null>(null);
  const [nextAt, setNextAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [history, setHistory] = useState<{ key: string; label: string; at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const state = await readState();
      setNextAt(state.nextAt);
      setHistory(state.history);
    } catch {
      toast.error("No pudimos leer tu último giro. Recarga la pantalla.");
    } finally {
      setLoading(false);
    }
  }, [readState]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const remaining = Math.max(0, nextAt - now);
  const locked = remaining > 0;

  const lights = useMemo(
    () => Array.from({ length: 24 }, (_, i) => polar(R, R, R + 9, (i * 360) / 24)),
    [],
  );

  function finish(key: string) {
    setSpinning(false);
    setBounce(true);
    setTimeout(() => setBounce(false), 450);
    const prize = prizeByKey(key);
    setResult({ key });
    celebrate(1800);
    toast.success(`¡Ganaste ${prize.label}!`, { description: prize.description });
    void load();
    void qc.invalidateQueries({ queryKey: ["profile"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function handleSpin() {
    if (spinning || locked) return;
    setResult(null);
    setSpinning(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = "/auth";
        return;
      }

      const res = await spin();
      if (!res.ok) {
        if (res.reason === "cooldown") {
          setNextAt(res.nextAt);
          toast("Tu giro de hoy ya fue usado", { description: "Vuelve cuando termine la cuenta." });
        } else {
          toast.error("No pudimos registrar tu giro. Intenta de nuevo.");
        }
        setSpinning(false);
        return;
      }

      const el = wheelRef.current;
      if (!el) { finish(res.prizeKey); return; }

      const center = res.index * SECTOR_ANGLE + SECTOR_ANGLE / 2;
      const turns = 5 + Math.floor(Math.random() * 4); // 5 a 8 vueltas
      const duration = 4 + Math.random() * 3; // 4 a 7 segundos
      const current = rotationRef.current;
      let target = current + turns * 360;
      target += ((360 - ((target + center) % 360)) % 360);
      rotationRef.current = target;

      el.style.transition = "none";
      el.style.transform = `rotate(${current}deg)`;
      void el.offsetWidth; // fuerza reflow para que la animación no se salte
      el.style.transition = `transform ${duration}s cubic-bezier(0.1, 0.9, 0.3, 1)`;
      el.style.transform = `rotate(${target}deg)`;

      let done = false;
      const onEnd = () => {
        if (done) return;
        done = true;
        el.removeEventListener("transitionend", onEnd);
        finish(res.prizeKey);
      };
      el.addEventListener("transitionend", onEnd);
      timeoutRef.current = setTimeout(onEnd, duration * 1000 + 900); // respaldo de seguridad
      setNextAt(res.nextAt);
    } catch {
      toast.error("Algo se interrumpió. Tu giro no se perdió: vuelve a intentar.");
      setSpinning(false);
    }
  }

  const prize = result ? prizeByKey(result.key) : null;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-28 pt-4 sm:px-5">
      <Link to="/comprarmonedas" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Hojas de sanación
      </Link>

      <div className="mt-2 rounded-[16px] border border-border/60 bg-card p-5 text-center shadow-soft">
        <span className="inline-flex items-center gap-2 rounded-[10px] bg-primary/10 px-3 py-2 text-[12px] font-bold uppercase tracking-widest text-primary">
          <Gift className="h-4 w-4" /> Ruleta de Premios
        </span>
        <h1 className="mt-3 font-display text-[28px] font-extrabold leading-tight">Tu regalo del día</h1>
        <p className="mx-auto mt-2 max-w-[38ch] text-[15px] leading-relaxed text-muted-foreground">
          Un giro cada 24 horas. Siempre ganas algo: hojas de sanación o una consulta.
        </p>
      </div>

      {/* Ruleta */}
      <div className="relative mx-auto mt-8 w-[min(92vw,360px)]">
        {/* Puntero */}
        <div
          className={`absolute left-1/2 top-[-14px] z-20 -translate-x-1/2 transition-transform duration-300 ${bounce ? "-translate-y-1.5" : ""}`}
          style={{ filter: "drop-shadow(0 4px 8px rgba(30,25,20,.35))" }}
          aria-hidden
        >
          <svg width="34" height="34" viewBox="0 0 34 34">
            <path d="M17 30 L4 6 A16 16 0 0 1 30 6 Z" fill="#E0B25C" stroke="#8A5B18" strokeWidth="2" />
          </svg>
        </div>

        <div className="relative aspect-square rounded-full" style={{ boxShadow: "0 18px 40px rgba(30,25,20,.28)" }}>
          <div
            ref={wheelRef}
            className="h-full w-full will-change-transform"
            style={{ transform: "rotate(0deg)" }}
          >
            <svg viewBox={`-16 -16 ${R * 2 + 32} ${R * 2 + 32}`} className="h-full w-full">
              <circle cx={R} cy={R} r={R + 12} fill="#E0B25C" />
              <circle cx={R} cy={R} r={R + 4} fill="#8A5B18" opacity="0.35" />
              {lights.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3.6" fill="#FFF6E0" opacity={0.95} />
              ))}
              {WHEEL_PRIZES.map((p, i) => (
                <path key={p.key} d={sectorPath(i)} fill={p.fill} stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
              ))}
              {WHEEL_PRIZES.map((p, i) => {
                const mid = i * SECTOR_ANGLE + SECTOR_ANGLE / 2;
                const pos = polar(R, R, R * 0.62, mid);
                const iconSize = Math.max(17, Math.min(25, 210 / SECTORS));
                const textSize = Math.max(10, Math.min(15, 145 / SECTORS));
                return (
                  <g key={`t-${p.key}`}>
                    <text
                      x={pos.x}
                      y={pos.y - 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={iconSize}
                    >
                      {p.icon}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + iconSize * 0.78}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={textSize}
                      fontWeight="800"
                      fill={p.text}
                    >
                      {p.short}
                    </text>
                  </g>
                );
              })}
              <circle cx={R} cy={R} r="40" fill="#2A1B3D" stroke="#E0B25C" strokeWidth="6" />
            </svg>
          </div>

          {/* Hub central */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <img src={origenIcon} alt="ORÍGEN" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
          </div>
        </div>
      </div>

      {/* Botón */}
      <div className="mx-auto mt-7 w-[min(92vw,420px)]">
        <button
          onClick={handleSpin}
          disabled={spinning || locked || loading}
          className="btn-primary-gradient relative min-h-[56px] w-full overflow-hidden rounded-full text-[17px] font-bold text-white transition active:scale-[.97] disabled:opacity-70"
        >
          {!spinning && !locked && (
            <span aria-hidden className="absolute inset-0 animate-pulse bg-white/10" />
          )}
          <span className="relative inline-flex items-center justify-center gap-2">
            {spinning ? (<><Loader2 className="h-5 w-5 animate-spin" /> Girando…</>) : locked ? (
              `Vuelve en ${formatRemaining(remaining)}`
            ) : (<><Sparkles className="h-5 w-5" /> Girar la ruleta</>)}
          </span>
        </button>
        {locked && (
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            Tu próximo giro se abre solo. El tiempo corre desde tu último giro guardado.
          </p>
        )}
      </div>

      {/* Resultado */}
      {prize && (
        <div className="mx-auto mt-6 w-[min(92vw,420px)] rounded-[16px] border-2 border-primary bg-card p-5 text-center shadow-elevated animate-in fade-in zoom-in-95">
           <div className="text-5xl" aria-hidden>{prize.icon}</div>
           <h2 className="mt-3 font-display text-[22px] font-extrabold">¡Ganaste!</h2>
           <p className="mt-1 text-[16px] font-bold text-primary">{prize.label}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{prize.description}</p>
        </div>
      )}

      {/* Historial */}
      <section className="mx-auto mt-10 w-full max-w-[600px]">
        <h2 className="flex items-center gap-2 font-display text-[19px] font-bold">
          <History className="h-5 w-5 text-primary" /> Tus últimos premios
        </h2>
        <div className="mt-3 space-y-3">
          {history.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Tu primer premio te está esperando"
              body="Gira la ruleta y aquí quedará guardado todo lo que ganes, giro por giro."
              actionLabel={locked ? undefined : "Girar ahora"}
              onAction={locked ? undefined : handleSpin}
            />
          ) : (
            history.map((h, i) => {
              const p = prizeByKey(h.key);
              return (
                <div key={`${h.at}-${i}`} className="flex items-center gap-3 rounded-[16px] border border-border/60 bg-card p-4 shadow-soft">
                   <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary/10 text-2xl">{p.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{h.label}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {new Date(h.at).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
