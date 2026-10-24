import { describe, expect, it } from "vitest";
import { canRecoverMentorConversation, mentorRecoveryDaysLeft, mentorRecoveryDeadline } from "./mentor-trash";

describe("mentor conversation trash", () => {
  const deletedAt = "2026-10-24T07:12:00.000Z";
  it("preserves recovery for exactly 30 days from deletion, not 30 calendar dates", () => {
    expect(mentorRecoveryDeadline(deletedAt)).toBe(Date.parse("2026-11-23T07:12:00.000Z"));
    expect(mentorRecoveryDaysLeft(deletedAt, Date.parse(deletedAt))).toBe(30);
    expect(canRecoverMentorConversation(deletedAt, Date.parse("2026-11-23T07:11:59.999Z"))).toBe(true);
    expect(canRecoverMentorConversation(deletedAt, Date.parse("2026-11-23T07:12:00.000Z"))).toBe(false);
    expect(mentorRecoveryDaysLeft(deletedAt, Date.parse("2026-11-24T07:12:00.000Z"))).toBe(0);
  });
  it("does not offer recovery for an active conversation or an invalid deletion date", () => {
    expect(canRecoverMentorConversation(null, Date.parse(deletedAt))).toBe(false);
    expect(canRecoverMentorConversation("invalid", Date.parse(deletedAt))).toBe(false);
  });
});