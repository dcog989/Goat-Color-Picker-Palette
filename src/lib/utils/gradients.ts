import { colordx } from "@colordx/core";

const OKHSL_HUE_STOPS = 24;
const OKHSL_CHANNEL_STOPS = 12;

export function getGradient(channel: string, rgb: { r: number; g: number; b: number }) {
  switch (channel) {
    case "l":
      return { gradientClass: "gradient-oklch-l" };
    case "c":
      return { gradientClass: "gradient-oklch-c" };
    case "h":
      return { gradientClass: "gradient-oklch-h" };
  }

  switch (channel) {
    case "r":
      return { gradientStyle: "linear-gradient(to right, rgb(0,0,0), rgb(255,0,0))" };
    case "g":
      return { gradientStyle: "linear-gradient(to right, rgb(0,0,0), rgb(0,255,0))" };
    case "b":
      return { gradientStyle: "linear-gradient(to right, rgb(0,0,0), rgb(0,0,255))" };
    case "alpha":
      return {
        gradientStyle: `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b},0), rgba(${rgb.r},${rgb.g},${rgb.b},1))`,
      };
    default:
      return {};
  }
}

export function okhslGradient(channel: "h" | "s" | "l", base: { h: number; s: number; l: number }) {
  const count = channel === "h" ? OKHSL_HUE_STOPS : OKHSL_CHANNEL_STOPS;
  const stops: string[] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const { h, s, l } =
      channel === "h"
        ? { h: t * 360, s: base.s, l: base.l }
        : channel === "s"
          ? { h: base.h, s: t * 100, l: base.l }
          : { h: base.h, s: base.s, l: t * 100 };
    const { r, g, b } = colordx({ h, s, l, colorSpace: "okhsl" }).toRgb();
    stops.push(`rgb(${r} ${g} ${b}) ${(t * 100).toFixed(2)}%`);
  }

  return { gradientStyle: `linear-gradient(to right, ${stops.join(", ")})` };
}
