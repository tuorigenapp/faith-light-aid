import svgRaw from "@/assets/formas-de-pago.svg?raw";

/** Métodos de pago disponibles (SVG oficial de la pasarela). */
export function PaymentMethods({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Formas de pago</p>
      <div
        className="mt-2 w-full [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-[420px]"
        aria-label="Tarjetas de crédito, débito y pago seguro"
        dangerouslySetInnerHTML={{ __html: svgRaw }}
      />
    </div>
  );
}
