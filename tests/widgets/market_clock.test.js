// ── MarketClock tests — PRD B5.3 ──────────────────────────────────────────────
// Verifies open/closed/pre/post for the 5 markets at known UTC times.
import { describe, it, expect } from "vitest";
import { marketStateForTesting } from "../../src/lib/marketClockCore";

describe("market clock states", () => {
  it("NYSE is open during US morning trading hours", () => {
    // 2026-08-10 is a Monday; 15:00 New York = 19:00 UTC
    const s = marketStateForTesting("America/New_York", "09:30", "16:00", "2026-08-10T19:00:00Z");
    expect(s.label).toBe("OPEN");
  });

  it("LSE is closed on Saturday", () => {
    // 2026-08-08 is a Saturday
    const s = marketStateForTesting("Europe/London", "08:00", "16:30", "2026-08-08T12:00:00Z");
    expect(s.label).toBe("CLOSED");
    expect(s.note).toContain("weekend");
  });

  it("NSE Nigeria opens at 10:00 WAT (09:00 UTC), PRE before then", () => {
    // 07:00 UTC Monday = 08:00 WAT, before 10:00 WAT open
    const s = marketStateForTesting("Africa/Lagos", "10:00", "14:30", "2026-08-10T07:00:00Z");
    expect(s.label).toBe("PRE");
  });

  it("Tadawul is POST after 15:00 Riyadh (12:00 UTC)", () => {
    const s = marketStateForTesting("Asia/Riyadh", "10:00", "15:00", "2026-08-10T13:00:00Z");
    expect(s.label).toBe("POST");
  });

  it("HKEX is OPEN during Asian hours", () => {
    // 02:00 UTC Monday = 10:00 HK time
    const s = marketStateForTesting("Asia/Hong_Kong", "09:30", "16:00", "2026-08-10T02:00:00Z");
    expect(s.label).toBe("OPEN");
  });

  it("all five markets return a valid state", () => {
    const markets = [
      ["America/New_York", "09:30", "16:00"],
      ["Europe/London", "08:00", "16:30"],
      ["Africa/Lagos", "10:00", "14:30"],
      ["Asia/Riyadh", "10:00", "15:00"],
      ["Asia/Hong_Kong", "09:30", "16:00"],
    ];
    for (const [tz, o, c] of markets) {
      const s = marketStateForTesting(tz, o, c, "2026-08-10T12:00:00Z");
      expect(["OPEN", "CLOSED", "PRE", "POST"]).toContain(s.label);
    }
  });
});
