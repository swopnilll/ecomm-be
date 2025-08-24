import { describe, expect, it } from "vitest";
import { calculateItemSubtotal } from "#utils/helper.js";

describe("calculateItemSubtotal utility", () => {
  it("should correctly calculate the subtotal for integer prices", () => {
    expect(calculateItemSubtotal(2, 10)).toBe(20);
  });

  it("should correctly calculate the subtotal for decimal prices and round to two decimal places", () => {
    expect(calculateItemSubtotal(3, 1.25)).toBe(3.75);
    expect(calculateItemSubtotal(10, 0.15)).toBe(1.5);
    // Test for floating-point precision
    expect(calculateItemSubtotal(3, 0.33)).toBe(0.99);
  });
});
