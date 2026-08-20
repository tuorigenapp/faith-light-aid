import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[16px] border border-border/60 bg-card p-8 text-center shadow-soft">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-[12px] bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-[17px] font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">{body}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary-gradient mt-5 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold active:scale-[.97] transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
