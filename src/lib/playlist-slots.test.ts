import { describe, expect, it } from "vitest";
import { missingPlaylistDays, PLAYLIST_SLOTS } from "./playlist-slots";

describe("playlist slots", () => {
  it("keeps 21 slots when only one audio exists", () => {
    expect(PLAYLIST_SLOTS).toBe(21);
    expect(missingPlaylistDays([{ day_index: 1 }])).toEqual(Array.from({ length: 20 }, (_, index) => index + 2));
  });
  it("never repeats existing days when audio positions have gaps", () => {
    const missing = missingPlaylistDays([{ day_index: 1 }, { day_index: 3 }, { day_index: 21 }]);
    expect(missing).toEqual([2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });
  it("does not add placeholders or limit playlists beyond 21 audios", () => {
    expect(missingPlaylistDays(Array.from({ length: 30 }, (_, index) => ({ day_index: index + 1 })))).toEqual([]);
  });
});