import { describe, expect, it } from "vitest";
import { type ColorSource, strategies } from "./strategies";

const source = (colors: string[], name = "Test"): ColorSource => ({
  colors: colors.map((css) => ({ css })),
  isSingle: colors.length === 1,
  name,
});

describe("DTCG export", () => {
  it("emits an sRGB color token with hex fallback", () => {
    const parsed = JSON.parse(strategies.dtcg.format(source(["#ff00ff"]), "hex"));

    expect(parsed.color.test.$type).toBe("color");
    expect(parsed.color.test.$value.colorSpace).toBe("srgb");
    expect(parsed.color.test.$value.components).toEqual([1, 0, 1]);
    expect(parsed.color.test.$value.hex).toBe("#ff00ff");
  });

  it("emits OKLCH tokens when requested", () => {
    const parsed = JSON.parse(strategies.dtcg.format(source(["#ff00ff"]), "oklch"));

    expect(parsed.color.test.$value.colorSpace).toBe("oklch");
    expect(parsed.color.test.$value.hex).toBe("#ff00ff");
  });
});

describe("GIMP GPL export", () => {
  it("emits a valid palette header and RGB rows", () => {
    const lines = strategies.gpl.format(source(["#ff0000", "#00ff00"]), "hex").split("\n");

    expect(lines[0]).toBe("GIMP Palette");
    expect(lines[1]).toBe("Name: Color Picker Palette");
    expect(lines[4]).toMatch(/^\s*255\s+0\s+0\s+color-1$/);
    expect(lines[5]).toMatch(/^\s*0\s+255\s+0\s+color-2$/);
  });
});
