export function getGradient(channel: string, rgb: { r: number; g: number; b: number }) {
  switch (channel) {
    case 'l':
      return { gradientClass: 'gradient-oklch-l' };
    case 'c':
      return { gradientClass: 'gradient-oklch-c' };
    case 'h':
      return { gradientClass: 'gradient-oklch-h' };
    case 'hsl-h':
      return { gradientClass: 'gradient-hsl-h' };
    case 'hsl-s':
      return { gradientClass: 'gradient-hsl-s' };
    case 'hsl-l':
      return { gradientClass: 'gradient-hsl-l' };
  }

  switch (channel) {
    case 'r':
      return { gradientStyle: 'linear-gradient(to right, rgb(0,0,0), rgb(255,0,0))' };
    case 'g':
      return { gradientStyle: 'linear-gradient(to right, rgb(0,0,0), rgb(0,255,0))' };
    case 'b':
      return { gradientStyle: 'linear-gradient(to right, rgb(0,0,0), rgb(0,0,255))' };
    case 'alpha':
      return {
        gradientStyle: `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b},0), rgba(${rgb.r},${rgb.g},${rgb.b},1))`,
      };
    default:
      return {};
  }
}
