import type { ReactNode } from "react";

/** Muestra los elementos siempre en grupos de 3 por pantalla y se desliza para ver más. */
export function ThreeSlider<T>({ items, render, keyOf }: { items: T[]; render: (item: T, i: number) => ReactNode; keyOf: (item: T) => string }) {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += 3) groups.push(items.slice(i, i + 3));
  return (
    <>
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        <ul className="flex gap-4">
          {groups.map((g, gi) => (
            <li key={gi} className="w-[calc(100vw-3rem)] max-w-[480px] lg:w-[420px] shrink-0 snap-center space-y-3">
              {g.map((it, i) => (
                <div key={keyOf(it)} style={{ animation: `fade-in .4s ease-out ${(gi * 3 + i) * 60}ms both` }}>
                  {render(it, gi * 3 + i)}
                </div>
              ))}
            </li>
          ))}
        </ul>
      </div>
      {groups.length > 1 && (
        <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Desliza para ver más</p>
      )}
    </>
  );
}
