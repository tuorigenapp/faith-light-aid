/** Preserve every published track; only fill unassigned days in the initial 21 slots. */
export const PLAYLIST_SLOTS = 21;

export function missingPlaylistDays(tracks: readonly { day_index: number }[]): number[] {
  const occupied = new Set(tracks.map((track) => track.day_index));
  return Array.from({ length: PLAYLIST_SLOTS }, (_, index) => index + 1).filter((day) => !occupied.has(day));
}