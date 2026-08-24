export function SeguimientoSkeleton() {
  return (
    <div className="app-card p-5 md:p-6 shadow-soft animate-pulse">
      <div className="h-4 w-40 rounded-full bg-muted" />
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted h-20" />
        ))}
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-muted" />
    </div>
  );
}

export function ProgramCardSkeleton() {
  return (
    <div className="app-card overflow-hidden h-full flex flex-col shadow-soft animate-pulse">
      <div className="aspect-square w-full bg-muted" />
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="h-3 w-24 rounded-full bg-muted" />
        <div className="h-5 w-3/4 rounded-full bg-muted" />
        <div className="h-3 w-full rounded-full bg-muted" />
        <div className="h-3 w-2/3 rounded-full bg-muted" />
        <div className="mt-auto h-11 rounded-[12px] bg-muted" />
      </div>
    </div>
  );
}
