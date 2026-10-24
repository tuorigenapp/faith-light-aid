import { useEffect, useState } from "react";
import { appDayKey } from "@/lib/app-day";
import { buildMensajes, SEEN_KEY } from "@/lib/mensajes-origen";

/** Number of today's unlocked Mensajes ORÍGEN the person has not opened yet (red dot). */
export function useMensajesUnread() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const calc = () => {
      const day = appDayKey();
      const { unlocked } = buildMensajes({ name: "", focus: "", dayKey: day, hourNow: new Date().getHours() });
      let seen: string[] = [];
      try { seen = JSON.parse(localStorage.getItem(SEEN_KEY(day)) ?? "[]"); } catch { /* ignore */ }
      setN(unlocked.filter((m) => !seen.includes(m.id)).length);
    };
    calc();
    const t = setInterval(calc, 60_000);
    window.addEventListener("mensajes-seen", calc);
    return () => { clearInterval(t); window.removeEventListener("mensajes-seen", calc); };
  }, []);
  return n;
}
