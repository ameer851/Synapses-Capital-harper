// ── TV symbol mapper tests — PRD B5.3 ─────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { toTVSymbol } from "../../src/components/widgets/TVChart";

describe("toTVSymbol", () => {
  it("maps crypto BTC/USDT:BINANCE → BINANCE:BTCUSDT", () => {
    expect(toTVSymbol("BTC/USDT:BINANCE")).toBe("BINANCE:BTCUSDT");
  });

  it("maps NSE ticker DANGCEM:NSE → NSE:DANGCEM", () => {
    expect(toTVSymbol("DANGCEM:NSE")).toBe("NSE:DANGCEM");
  });

  it("maps US equity to NASDAQ by default", () => {
    expect(toTVSymbol("NVDA")).toBe("NASDAQ:NVDA");
  });

  it("falls back to BINANCE for bare crypto pair", () => {
    expect(toTVSymbol("ETH/USDT", "BINANCE")).toBe("BINANCE:ETHUSDT");
  });
});
