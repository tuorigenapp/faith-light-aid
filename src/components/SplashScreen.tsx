import { useEffect, useState } from "react";
import logo from "@/assets/logo-origen.png.asset.json";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("origen_splash_seen") === "1") return;
      sessionStorage.setItem("origen_splash_seen", "1");
    } catch {}
    setHidden(false);
    setMounted(true);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 900 : 2000;
    const t1 = setTimeout(() => setLeaving(true), duration);
    const t2 = setTimeout(() => setHidden(true), duration + 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (hidden) return null;

  return (
    <div
      onClick={() => { setLeaving(true); setTimeout(() => setHidden(true), 500); }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${leaving ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, #EFE7FF 0%, #FBFAFF 55%, #FDEEF7 100%)",
      }}
      aria-hidden={leaving}
    >
      <div className="relative flex items-center justify-center">
        {/* Pulsating rings */}
        <span className="splash-ring" style={{ animationDelay: "0s" }} />
        <span className="splash-ring" style={{ animationDelay: "0.6s" }} />
        <span className="splash-ring" style={{ animationDelay: "1.2s" }} />
        {/* Logo */}
        <img
          src={logo.url}
          alt="ORIGEN"
          width={200}
          height={200}
          className={`relative z-10 w-[200px] h-[200px] object-contain drop-shadow-[0_20px_60px_rgba(124,92,255,0.35)] ${mounted ? "splash-breathe" : ""}`}
        />
      </div>
      <div className="mt-8 text-center px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#1B1930]">ORIGEN</h1>
        <p className="mt-2 text-sm text-[#6B6A85] font-medium">
          Transforma tu alma, vive tu propósito
        </p>
      </div>
    </div>
  );
}
