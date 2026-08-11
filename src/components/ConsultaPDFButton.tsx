import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConsultaPDFButton({
  onClick,
  loading,
  disabled,
  label = "Descargar consulta en PDF",
  className,
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "w-full h-12 rounded-[14px] btn-primary-gradient text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {label}
    </button>
  );
}
