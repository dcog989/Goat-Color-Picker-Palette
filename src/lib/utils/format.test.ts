import { colordx, getFormat } from "@colordx/core";
import { describe, expect, it } from "vitest";
import { formatColor, safeColor } from "./formatters";

describe("colordx formatting", () => {
  describe("toOklchString", () => {
    it("should format OKLCH color string", () => {
      const c = colordx({ l: 0.5, c: 0.2, h: 270 });
      expect(c.toOklchString()).toMatch(/^oklch\(0\.5 0\.2 27\d+\.?\d*\)$/);
    });

    it("should include alpha channel when less than 1", () => {
      const c = colordx({ l: 0.5, c: 0.2, h: 270, alpha: 0.5 });
      expect(c.toOklchString()).toMatch(/oklch\(0\.5 0\.2 27\d+\.?\d* \/ 0\.5\)/);
    });
  });

  describe("toRgbString", () => {
    it("should format RGB color string", () => {
      expect(colordx("#ff8040").toRgbString()).toBe("rgb(255 128 64)");
    });
  });

  describe("toHslString", () => {
    it("should format HSL color string", () => {
      const hsl = colordx({ h: 180, s: 50, l: 50 }).toHslString();
      expect(hsl).toMatch(/hsl\(180 50% 50%\)/);
    });
  });

  describe("getFormat", () => {
    it("should detect valid color formats", () => {
      expect(getFormat("#ff0000")).toBe("hex");
      expect(getFormat("rgb(255 0 0)")).toBe("rgb");
      expect(getFormat("hsl(0 100% 50%)")).toBe("hsl");
      expect(getFormat("not-a-color")).toBeUndefined();
    });
  });
});

describe("safeColor", () => {
  it("parses recognized color strings", () => {
    expect(safeColor("#ff0000")?.toHex()).toBe("#ff0000");
    expect(safeColor("rgb(255 128 64)")?.toHex()).toBe("#ff8040");
  });

  it("returns null for unrecognized input", () => {
    expect(safeColor("not-a-color")).toBeNull();
    expect(safeColor("")).toBeNull();
  });
});

describe("formatColor", () => {
  it("formats a color into each export format", () => {
    expect(formatColor("#ff8040", "hex")).toBe("#ff8040");
    expect(formatColor("#ff8040", "rgb")).toBe("rgb(255 128 64)");
    expect(formatColor("#ff8040", "hsl")).toMatch(/^hsl\(/);
    expect(formatColor("#ff8040", "oklch")).toMatch(/^oklch\(/);
  });

  it("returns the original string when it cannot be parsed", () => {
    expect(formatColor("not-a-color", "hex")).toBe("not-a-color");
  });
});
