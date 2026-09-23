import { colordx } from "@colordx/core";

export function usesDarkText(background: string): boolean {
  try {
    const bg = colordx(background);
    if (!bg.isValid()) return false;
    return bg.contrast("#000", 6) > bg.contrast("#fff", 6);
  } catch {
    return false;
  }
}
