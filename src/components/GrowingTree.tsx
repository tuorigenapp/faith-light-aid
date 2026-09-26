import { useEffect, useState } from "react";

const LEAVES = [
  [100, 40], [70, 55], [130, 55], [50, 80], [150, 80], [85, 75], [115, 75], [100, 62],
  [40, 105], [160, 105], [65, 100], [135, 100], [100, 90], [80, 115], [120, 115], [55, 125],
  [145, 125], [100, 112], [30, 90], [170, 90],
];

/** Árbol que pasa de seco a florecido según el avance (0-100). */
export function GrowingTree({ pct }: { pct: number }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setP(Math.max(0, Math.min(100, pct))), 150);
    return () => clearTimeout(t);
  }, [pct]);
  const shown = Math.round((p / 100) * LEAVES.length);
  const flowers = p >= 60 ? Math.round(((p - 60) / 40) * 8) : 0;
  const alive = p / 100;
  return (
    <svg viewBox="0 0 200 220" className="mx-auto h-64 w-64" role="img" aria-label={`Tu árbol está al ${Math.round(p)}%`}>
      <ellipse cx="100" cy="205" rx="70" ry="8" fill="var(--color-muted)" />
      <path
        d="M100 205 C96 175 94 150 100 120 M100 150 C85 135 70 120 55 100 M100 140 C115 125 130 115 148 98 M100 120 C92 100 88 80 80 60 M100 120 C108 100 115 80 122 60 M100 110 L100 45"
        stroke={`color-mix(in oklab, #8A6A4A ${Math.round(alive * 100)}%, #9A9189)`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {LEAVES.slice(0, shown).map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="11"
          fill={`color-mix(in oklab, var(--color-accent-green, #3FBE8F) ${60 + (i % 3) * 15}%, var(--color-primary))`}
          opacity=".9"
          style={{ transformOrigin: `${x}px ${y}px`, animation: `scale-in .5s ease-out ${i * 60}ms both` }}
        />
      ))}
      {LEAVES.slice(0, flowers).map(([x, y], i) => (
        <circle key={`f${i}`} cx={x + 5} cy={y - 4} r="4" fill="#F58BCB" style={{ animation: `fade-in .4s ease-out ${800 + i * 90}ms both` }} />
      ))}
    </svg>
  );
}
