import { describe, expect, it } from "vitest";
import { directAudioUrl, validAudioAddress } from "./media-input";

describe("audio input", () => {
  it("accepts direct MP3 links and private signed storage links", () => {
    expect(validAudioAddress("https://example.org/prayer.mp3")).toBe(true);
    expect(validAudioAddress("https://example.org/storage/audio.mp3?token=test")).toBe(true);
  });
  it("rejects executable and non-web addresses", () => {
    expect(validAudioAddress("javascript:alert(1)")).toBe(false);
    expect(validAudioAddress("/not-a-link.mp3")).toBe(false);
  });
  it("converts shared Drive links to the download address", () => {
    expect(directAudioUrl("https://drive.google.com/file/d/1234567890abc/view")).toBe("https://drive.google.com/uc?export=download&id=1234567890abc");
  });
});