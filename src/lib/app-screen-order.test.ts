import { describe, expect, it } from "vitest";
import { diversifyScreens } from "./app-screen-order";

describe("capture variety", () => {
  it("interleaves tools, caminos and Visualiza while preserving each group", () => {
    const tools = Array.from({ length: 20 }, (_, id) => ({ id: `t${id}` }));
    const caminos = Array.from({ length: 10 }, (_, id) => ({ id: `c${id}`, group: "camino" as const }));
    const visualiza = Array.from({ length: 8 }, (_, id) => ({ id: `v${id}`, group: "visualiza" as const }));
    const screens = [...tools, ...caminos, ...visualiza];
    const result = diversifyScreens(screens);
    expect(result.slice(0, 8).map(screen => screen.id)).toEqual(["t0", "c0", "v0", "t1", "t2", "c1", "v1", "t3"]);
    expect(result.filter(screen => screen.group === "camino")).toEqual(caminos);
    expect(result.filter(screen => screen.group === "visualiza")).toEqual(visualiza);
    expect(result).toHaveLength(38);
    expect(new Set(result.map(screen => screen.id)).size).toBe(38);
  });

  it("retains all captures when one group is absent", () => {
    expect(diversifyScreens([])).toEqual([]);
    const screens = [{ id: "c1", group: "camino" as const }, { id: "c2", group: "camino" as const }];
    expect(diversifyScreens(screens)).toEqual(screens);
  });
});