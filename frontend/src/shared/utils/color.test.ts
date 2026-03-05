import { describe, it, expect } from "vitest";
import { getContrastColor } from "./color.ts";

describe("getContrastColor", () => {
  it("returns white for dark colors", () => {
    expect(getContrastColor("#000000")).toBe("#ffffff");
    expect(getContrastColor("#333333")).toBe("#ffffff");
    expect(getContrastColor("#0000ff")).toBe("#ffffff");
  });

  it("returns black for light colors", () => {
    expect(getContrastColor("#ffffff")).toBe("#000000");
    expect(getContrastColor("#ffff00")).toBe("#000000");
    expect(getContrastColor("#cccccc")).toBe("#000000");
  });

  it("handles typical tag colors correctly", () => {
    // Red (#ef4444) - luminance 0.299*239 + 0.587*68 + 0.114*68 = 119 / 255 = 0.47 → white
    expect(getContrastColor("#ef4444")).toBe("#ffffff");
    // Blue (#3b82f6) - darker, should return white
    expect(getContrastColor("#3b82f6")).toBe("#ffffff");
    // Yellow (#ffff00) - very light, should return black
    expect(getContrastColor("#ffff00")).toBe("#000000");
  });
});
