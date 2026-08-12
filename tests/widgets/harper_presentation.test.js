import { describe, expect, it } from "vitest";
import { HARPER_MARKETS, HARPER_PROMPTS, HARPER_RULES } from "../../src/lib/harperPresentation";

describe("Harper presentation data", () => {
  it("keeps the institutional mandate visible in the side rail", () => {
    expect(HARPER_RULES).toContain("R/R >= 1.5");
    expect(HARPER_RULES).toContain("No fabricated fills");
    expect(HARPER_RULES).toHaveLength(7);
  });

  it("offers actionable prompts for the primary Harper workflows", () => {
    const promptText = HARPER_PROMPTS.map((prompt) => prompt.text).join(" ");
    expect(promptText).toContain("Build a thesis");
    expect(promptText).toContain("Screen semiconductors");
    expect(promptText).toContain("Run shadow account");
  });

  it("lists each supported market with a compact settlement context", () => {
    expect(HARPER_MARKETS).toEqual([
      ["NYSE/NAS", "USD", "Primary"],
      ["LSE", "GBP", "Hedge"],
      ["NSE Nigeria", "NGN", "Home"],
      ["Tadawul", "SAR", "Gulf"],
      ["HKEX", "HKD", "Asia"],
    ]);
  });
});
