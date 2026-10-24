import { describe, expect, it } from "vitest";
import { isTrustedPushEndpoint } from "./push-endpoint";

describe("trusted push endpoints", () => {
  it("accepts browser push services", () => {
    for (const url of ["https://fcm.googleapis.com/fcm/send/example", "https://updates.push.services.mozilla.com/wpush/v2/example", "https://web.push.apple.com/example", "https://wns2-db5p.notify.windows.com/example"]) {
      expect(isTrustedPushEndpoint(url)).toBe(true);
    }
  });
  it("rejects internal or disguised addresses", () => {
    for (const url of ["http://127.0.0.1/private", "https://localhost/private", "https://169.254.169.254/private", "https://fcm.googleapis.com.attacker.example/push", "https://attacker.example/push", "https://user:pass@fcm.googleapis.com/push", "https://fcm.googleapis.com:8443/push"]) {
      expect(isTrustedPushEndpoint(url)).toBe(false);
    }
  });
});