export const MENTOR_TRASH_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type MentorConversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function mentorRecoveryDeadline(deletedAt: string): number {
  return Date.parse(deletedAt) + MENTOR_TRASH_DAYS * DAY_MS;
}

export function canRecoverMentorConversation(deletedAt: string | null, now: number): boolean {
  if (!deletedAt) return false;
  const deadline = mentorRecoveryDeadline(deletedAt);
  return Number.isFinite(deadline) && now < deadline;
}

export function mentorRecoveryDaysLeft(deletedAt: string, now: number): number {
  if (!canRecoverMentorConversation(deletedAt, now)) return 0;
  return Math.ceil((mentorRecoveryDeadline(deletedAt) - now) / DAY_MS);
}