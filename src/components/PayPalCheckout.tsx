import { useEffect, useId, useRef, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usd, type HojaPack } from "@/lib/hojas";

const PAYPAL_CLIENT_ID = "BAA7iVjnYhYSc3AxWdL-b-q0nHGdzyKqvSt2n7uYZ3ITozPMfBROd5b_SwOYpzkAofSU5H3ghiQ-Zyxnkg";
const PAYPAL_SCRIPT_ID = "origen-paypal-sdk";

type PayPalActions = {
  order: {
    create: (payload: unknown) => Promise<string>;
    capture: () => Promise<{ id?: string; status?: string }>;
  };
};

type PayPalNamespace = {
  Buttons: (options: {
    style: Record<string, string | boolean>;
    createOrder: (_data: unknown, actions: PayPalActions) => Promise<string>;
    onApprove: (_data: unknown, actions: PayPalActions) => Promise<void>;
    onCancel: () => void;
    onError: () => void;
  }) => { render: (selector: string) => Promise<void>; close?: () => void };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

function loadPayPal() {
  if (window.paypal) return Promise.resolve();
  const current = document.getElementById(PAYPAL_SCRIPT_ID) as HTMLScriptElement | null;
  if (current) {
    return new Promise<void>((resolve, reject) => {
      current.addEventListener("load", () => resolve(), { once: true });
      current.addEventListener("error", () => reject(new Error("paypal_load_failed")), { once: true });
    });
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = PAYPAL_SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=USD&intent=capture&components=buttons&enable-funding=card`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("paypal_load_failed"));
    document.head.appendChild(script);
  });
}

export function PayPalCheckout({ pack, userId, onPaid }: { pack: HojaPack; userId: string; onPaid: (orderId: string) => void }) {
  const reactId = useId().replace(/:/g, "");
  const containerId = `paypal-buttons-${reactId}`;
  const buttonsRef = useRef<{ close?: () => void } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    void loadPayPal()
      .then(async () => {
        if (!active || !window.paypal) return;
        const buttons = window.paypal.Buttons({
          style: { layout: "vertical", shape: "rect", height: "48", label: "paypal", tagline: false },
          createOrder: (_data, actions) =>
            actions.order.create({
              purchase_units: [{
                amount: { currency_code: "USD", value: pack.usd.toFixed(2) },
                description: `${pack.hojas.toLocaleString()} Hojas de Sanación — ORÍGEN`,
                custom_id: `${userId}:${pack.id}`,
              }],
              application_context: { shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" },
            }),
          onApprove: async (_data, actions) => {
            const capture = await actions.order.capture();
            if (!active) return;
            if (capture.status !== "COMPLETED" || !capture.id) {
              setStatus("error");
              return;
            }
            onPaid(capture.id);
          },
          onCancel: () => setStatus("ready"),
          onError: () => setStatus("error"),
        });
        buttonsRef.current = buttons;
        await buttons.render(`#${containerId}`);
        if (active) setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
      buttonsRef.current?.close?.();
    };
  }, [containerId, onPaid, pack, userId]);

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] bg-card p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-secondary text-primary"><CreditCard className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-muted-foreground">Total a pagar</p>
            <p className="font-display text-[22px] font-bold text-foreground">{usd(pack.usd)}</p>
          </div>
        </div>
      </div>

      {status === "loading" && <div className="h-12 w-full animate-pulse rounded-[12px] bg-muted" aria-label="Preparando tu pago seguro" />}
      <div id={containerId} className="min-h-12 w-full" />
      {status === "error" && (
        <div className="rounded-[12px] border border-destructive/30 bg-destructive/10 p-4 text-[14px] text-destructive">
          <p className="font-bold">No pudimos abrir PayPal.</p>
          <p className="mt-1">Revisa tu conexión e inténtalo otra vez. Si ya pagaste, usa “Confirmar pago”.</p>
          <Button type="button" variant="outline" className="mt-3 min-h-11 w-full rounded-[10px]" onClick={() => window.location.reload()}>Intentar otra vez</Button>
        </div>
      )}
      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        PayPal procesa el pago sin compartir tus datos financieros con ORÍGEN. La opción de tarjeta aparece cuando está disponible para tu país.
      </p>
    </div>
  );
}