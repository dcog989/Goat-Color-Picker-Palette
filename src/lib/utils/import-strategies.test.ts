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
  });
});

describe("parsePaletteFile", () => {
  it("throws a readable error for unsupported files", () => {
    expect(() => parsePaletteFile("photo.png", "not a palette")).toThrow(/Unsupported palette file/);
  });

  it("throws when no colors are found", () => {
    expect(() => parsePaletteFile("empty.json", '{"nested":{"value":1}}')).toThrow(/No colors found/);
  });
});
