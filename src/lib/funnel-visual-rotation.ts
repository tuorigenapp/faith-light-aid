export const FUNNEL_VARIATION_COUNT = 5;

/** Start with the response topic, then cycle all five visuals without immediate repeats. */
export function nextFunnelVariation(topic: string, previous: number | null): number {
  if (previous !== null && Number.isInteger(previous) && previous >= 0 && previous < FUNNEL_VARIATION_COUNT) {
    return (previous + 1) % FUNNEL_VARIATION_COUNT;
  }
  const hash = [...topic].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return hash % FUNNEL_VARIATION_COUNT;
}