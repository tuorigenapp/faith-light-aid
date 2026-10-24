/** Stable interleaving shows variety without random order or omitted captures. */
export function diversifyScreens<T extends { group?: "camino" | "visualiza" }>(screens: readonly T[]): T[] {
  const tools = screens.filter(screen => !screen.group);
  const caminos = screens.filter(screen => screen.group === "camino");
  const visualiza = screens.filter(screen => screen.group === "visualiza");
  const result: T[] = [];
  let toolIndex = 0;
  let caminoIndex = 0;
  let visualizaIndex = 0;
  while (result.length < screens.length) {
    const firstTool = tools[toolIndex++];
    const camino = caminos[caminoIndex++];
    const visual = visualiza[visualizaIndex++];
    const secondTool = tools[toolIndex++];
    for (const screen of [firstTool, camino, visual, secondTool]) {
      if (screen) result.push(screen);
    }
  }
  return result;
}