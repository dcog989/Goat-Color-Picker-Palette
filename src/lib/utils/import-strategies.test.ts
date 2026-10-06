import { describe, expect, it } from "vitest";
import { importStrategies, parsePaletteFile, resolveImportStrategy } from "./import-strategies";

describe("DTCG design tokens import", () => {
  it("extracts colors from object, string and inherited-type tokens", () => {
    const tokens = JSON.stringify({
      color: {
        $type: "color",
        "hot-pink": {
          $value: { colorSpace: "srgb", components: [1, 0, 1], alpha: 1, hex: "#ff00ff" },
        },
        translucent: { $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.5 } },
        plain: { $value: "#00ff00" },
        oklch: { $value: { colorSpace: "oklch", components: [0.7016, 0.3225, 328.363] } },
      },
    });

    const colors = importStrategies.dtcg.parse(tokens);

    expect(colors).toContain("#ff00ff");
    expect(colors).toContain("#00ff00");
    expect(colors).toContain("#00000080");
  });

  it("skips aliases and non-color tokens", () => {
    const tokens = JSON.stringify({
      color: {
        alias: { $value: "{color.hot-pink}" },
        spacing: { $value: "16px" },
        real: { $value: "#123456" },
      },
    });

    expect(importStrategies.dtcg.parse(tokens)).toEqual(["#123456"]);
  });

  it("preserves alpha for css-string tokens", () => {
    const tokens = JSON.stringify({ color: { x: { $value: "#00ff0080" } } });

    expect(importStrategies.dtcg.parse(tokens)).toEqual(["#00ff0080"]);
  });

  it("supports every registered color space and normalizes odd components", () => {
    const tokens = JSON.stringify({
      color: {
        linear: { $value: { colorSpace: "srgb-linear", components: [0.5, 0.5, 0.5] } },
        hwb: { $value: { colorSpace: "hwb", components: [0, 0, 0] } },
        lab: { $value: { colorSpace: "lab", components: [50, 0, 0] } },
        lch: { $value: { colorSpace: "lch", components: [50, 0, 0] } },
        oklab: { $value: { colorSpace: "oklab", components: [0.5, 0, 0] } },
        p3: { $value: { colorSpace: "display-p3", components: [1, 0, 0] } },
        a98: { $value: { colorSpace: "a98-rgb", components: [1, 0, 0] } },
        prophoto: { $value: { colorSpace: "prophoto-rgb", components: [1, 0, 0] } },
        rec2020: { $value: { colorSpace: "rec2020", components: [1, 0, 0] } },
        none: { $value: { colorSpace: "oklch", components: ["none", "none", "none"] } },
        empty: { $value: { colorSpace: "srgb", components: [] } },
        nonNumeric: { $value: { colorSpace: "srgb", components: [true, null, "x"] } },
      },
    });

    expect(importStrategies.dtcg.parse(tokens)).toHaveLength(12);
  });

  it("falls back to the hex field for unknown color spaces", () => {
    const tokens = JSON.stringify({
      color: { x: { $value: { colorSpace: "unknown-space", components: [1, 2, 3], hex: "#123456" } } },
    });

    expect(importStrategies.dtcg.parse(tokens)).toEqual(["#123456"]);
  });
});

describe("GIMP GPL import", () => {
  const gpl = [
    "GIMP Palette",
    "Name: Test Palette",
    "Columns: 0",
    "#",
    "255   0   0\tRed",
    "  0 255   0\tGreen",
    "  0   0 255\tBlue",
  ].join("\n");

  it("parses RGB rows into hex colors", () => {
    expect(importStrategies.gpl.parse(gpl)).toEqual(["#ff0000", "#00ff00", "#0000ff"]);
  });

  it("resolves the strategy by extension and content", () => {
    expect(resolveImportStrategy("palette.gpl", "")).toBe(importStrategies.gpl);
    expect(resolveImportStrategy("tokens.json", "{}")).toBe(importStrategies.dtcg);
    expect(resolveImportStrategy("mystery", "GIMP Palette\n255 0 0")).toBe(importStrategies.gpl);
    expect(resolveImportStrategy("mystery", '{"color":{}}')).toBe(importStrategies.dtcg);
    expect(resolveImportStrategy("mystery", "just text")).toBeNull();
  });
});

describe("parsePaletteFile", () => {
  it("throws a readable error for unsupported files", () => {
    expect(() => parsePaletteFile("photo.png", "not a palette")).toThrow(/Unsupported palette file/);
  });

  it("throws when no colors are found", () => {
    expect(() => parsePaletteFile("empty.json", '{"nested":{"value":1}}')).toThrow(/No colors found/);
  });

  it("throws when the matched strategy cannot parse the file", () => {
    expect(() => parsePaletteFile("broken.json", "not valid json")).toThrow(/Could not parse/);
  });
});
