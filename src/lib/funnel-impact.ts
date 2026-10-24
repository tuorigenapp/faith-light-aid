/** Display-only illustration, not a clinical measurement or promised outcome. */
const POSITIVE_IMPACT_VARIATIONS = [72, 78, 83, 88, 94] as const;

export function illustrativeImpactScore(variant: number | null): number {
  if (variant === null || !Number.isInteger(variant)) return POSITIVE_IMPACT_VARIATIONS[0];
  return POSITIVE_IMPACT_VARIATIONS[variant] ?? POSITIVE_IMPACT_VARIATIONS[0];
}