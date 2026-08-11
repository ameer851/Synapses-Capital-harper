// ── squarify tests — PRD B5.3 ─────────────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { squarify } from "../../src/lib/squarify";

const overlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

describe("squarify", () => {
  it("produces 3 non-overlapping rects covering the full bounds", () => {
    const bounds = { x: 0, y: 0, w: 6, h: 4 };
    const rects = squarify(
      [{ label: "A", value: 6 }, { label: "B", value: 6 }, { label: "C", value: 4 }],
      bounds
    );
    expect(rects.length).toBe(3);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        expect(overlap(rects[i], rects[j])).toBe(false);
      }
    }
    // total area == bounds area (6*4 = 24)
    const area = rects.reduce((s, r) => s + r.w * r.h, 0);
    expect(area).toBeCloseTo(24, 5);
  });

  it("sizes rects proportional to value", () => {
    const rects = squarify(
      [{ label: "A", value: 10 }, { label: "B", value: 10 }],
      { x: 0, y: 0, w: 10, h: 10 }
    );
    const a = rects.find((r) => r.label === "A");
    const b = rects.find((r) => r.label === "B");
    expect(a.w * a.h).toBeCloseTo(50, 5);
    expect(b.w * b.h).toBeCloseTo(50, 5);
  });

  it("handles a single item filling the full bounds", () => {
    const rects = squarify([{ label: "A", value: 5 }], { x: 0, y: 0, w: 8, h: 4 });
    expect(rects.length).toBe(1);
    expect(rects[0].w * rects[0].h).toBeCloseTo(32, 5);
  });

  it("returns empty for empty or zero-value input", () => {
    expect(squarify([], { x: 0, y: 0, w: 6, h: 4 })).toEqual([]);
    expect(squarify([{ label: "A", value: 0 }], { x: 0, y: 0, w: 6, h: 4 })).toEqual([]);
  });
});
