import { describe, expect, it } from "vitest";
import { confirmDeletion, createDeletionConfirmation, registerDeletionConfirmation } from "./deletion-confirmation";

function setup() {
  const remembered = new Set<string>();
  let scope = "person-a";
  const controller = createDeletionConfirmation({ getScope: () => scope, readPreference: id => remembered.has(id), savePreference: id => { remembered.add(id); } });
  return { controller, remembered, switchUser: (id: string) => { scope = id; } };
}

describe("ORÍGEN deletion confirmation", () => {
  it("does not delete before confirmation, and cancellation does not delete", async () => {
    const { controller } = setup();
    let deleted = false;
    const pending = controller.request("Diario").then(confirmed => { deleted = confirmed; });
    expect(deleted).toBe(false);
    controller.decide(false);
    await pending;
    expect(deleted).toBe(false);
  });
  it("allows deletion when confirmed", async () => {
    const { controller } = setup();
    const pending = controller.request("Diario");
    controller.decide(true);
    expect(await pending).toBe(true);
    expect(controller.getSnapshot()).toBeNull();
  });
  it("No volver a mostrar skips future confirmations only after confirming", async () => {
    const { controller, remembered } = setup();
    const cancelled = controller.request("Diario");
    controller.decide(false, true);
    expect(await cancelled).toBe(false);
    expect(remembered.has("person-a")).toBe(false);
    const confirmed = controller.request("Mentora");
    controller.decide(true, true);
    expect(await confirmed).toBe(true);
    expect(await controller.request("Historial")).toBe(true);
    expect(controller.getSnapshot()).toBeNull();
  });
  it("never shares a person's preference with another account", async () => {
    const { controller, switchUser } = setup();
    const first = controller.request("Diario");
    controller.decide(true, true);
    await first;
    switchUser("person-b");
    const second = controller.request("Diario");
    expect(controller.getSnapshot()?.scope).toBe("person-b");
    controller.decide(false);
    expect(await second).toBe(false);
  });
  it("queues concurrent requests and cancels pending deletions on unmount", async () => {
    const { controller } = setup();
    const first = controller.request("Diario");
    const second = controller.request("Mentora");
    expect(controller.getSnapshot()?.description).toBe("Diario");
    controller.decide(true);
    expect(await first).toBe(true);
    expect(controller.getSnapshot()?.description).toBe("Mentora");
    controller.cancelAll();
    expect(await second).toBe(false);
  });
  it("fails closed when no ORÍGEN confirmation is mounted", async () => {
    expect(await confirmDeletion()).toBe(false);
    const unregister = registerDeletionConfirmation(async () => true);
    expect(await confirmDeletion()).toBe(true);
    unregister();
    expect(await confirmDeletion()).toBe(false);
  });
});