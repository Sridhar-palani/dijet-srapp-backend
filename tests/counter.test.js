import { describe, it, expect } from "vitest";
import { nextSequence, Counter } from "../src/utils/counter.js";

describe("nextSequence", () => {
  it("returns 1 on first call", async () => {
    const seq = await nextSequence("grn");
    expect(seq).toBe(1);
  });

  it("increments sequentially", async () => {
    const s1 = await nextSequence("invoice");
    const s2 = await nextSequence("invoice");
    const s3 = await nextSequence("invoice");
    expect(s1).toBe(1);
    expect(s2).toBe(2);
    expect(s3).toBe(3);
  });

  it("maintains separate counters per key", async () => {
    const g1 = await nextSequence("grn");
    const d1 = await nextSequence("dn");
    const g2 = await nextSequence("grn");
    expect(g1).toBe(1);
    expect(d1).toBe(1);
    expect(g2).toBe(2);
  });

  it("produces no duplicates under concurrent calls", async () => {
    const N = 20;
    const results = await Promise.all(
      Array.from({ length: N }, () => nextSequence("concurrent"))
    );
    const unique = new Set(results);
    expect(unique.size).toBe(N);
    expect(Math.min(...results)).toBe(1);
    expect(Math.max(...results)).toBe(N);
  });
});
