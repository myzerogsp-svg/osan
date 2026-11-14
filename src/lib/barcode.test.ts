import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { code128Bars } from "./barcode.ts";

describe("code128Bars", () => {
  it("builds a scannable pattern for a product code", () => {
    const bars = code128Bars("8801234567890");
    assert.ok(bars);
    assert.equal(
      bars.reduce((sum, width) => sum + width, 0),
      11 * (1 + 13 + 1) + 13,
    );
  });

  it("rejects empty and non-ascii codes", () => {
    assert.equal(code128Bars(""), null);
    assert.equal(code128Bars("상품"), null);
  });
});
