// OKHSL forward conversion (OKLab/OKLCH -> OKHSL).
// Adapted from Björn Ottosson's OKHSL reference (MIT), as ported in culori.
// Hue is identical to OKLCH hue (degrees); saturation and lightness are 0-1.
// TODO: replace this custom implementation with @colordx/core when it adds OKHSL support.

const K_1 = 0.206;
const K_2 = 0.03;
const K_3 = (1 + K_1) / (1 + K_2);

export interface Okhsl {
  h: number;
  s: number;
  l: number;
}

function toe(x: number): number {
  return 0.5 * (K_3 * x - K_1 + Math.sqrt((K_3 * x - K_1) ** 2 + 4 * K_2 * K_3 * x));
}

function computeMaxSaturation(a: number, b: number): number {
  let k0 = 0;
  let k1 = 0;
  let k2 = 0;
  let k3 = 0;
  let k4 = 0;
  let wl = 0;
  let wm = 0;
  let ws = 0;

  if (-1.88170328 * a - 0.80936493 * b > 1) {
    k0 = 1.19086277;
    k1 = 1.76576728;
    k2 = 0.59662641;
    k3 = 0.75515197;
    k4 = 0.56771245;
    wl = 4.0767416621;
    wm = -3.3077115913;
    ws = 0.2309699292;
  } else if (1.81444104 * a - 1.19445276 * b > 1) {
    k0 = 0.73956515;
    k1 = -0.45954404;
    k2 = 0.08285427;
    k3 = 0.1254107;
    k4 = 0.14503204;
    wl = -1.2684380046;
    wm = 2.6097574011;
    ws = -0.3413193965;
  } else {
    k0 = 1.35733652;
    k1 = -0.00915799;
    k2 = -1.1513021;
    k3 = -0.50559606;
    k4 = 0.00692167;
    wl = -0.0041960863;
    wm = -0.7034186147;
    ws = 1.707614701;
  }

  const s = k0 + k1 * a + k2 * b + k3 * a * a + k4 * a * b;

  const kL = 0.3963377774 * a + 0.2158037573 * b;
  const kM = -0.1055613458 * a - 0.0638541728 * b;
  const kS = -0.0894841775 * a - 1.291485548 * b;

  const l_ = 1 + s * kL;
  const m_ = 1 + s * kM;
  const s_ = 1 + s * kS;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const sm = s_ * s_ * s_;

  const lDs = 3 * kL * l_ * l_;
  const mDs = 3 * kM * m_ * m_;
  const sDs = 3 * kS * s_ * s_;

  const lDs2 = 6 * kL * kL * l_;
  const mDs2 = 6 * kM * kM * m_;
  const sDs2 = 6 * kS * kS * s_;

  const f = wl * l + wm * m + ws * sm;
  const f1 = wl * lDs + wm * mDs + ws * sDs;
  const f2 = wl * lDs2 + wm * mDs2 + ws * sDs2;

  return s - (f * f1) / (f1 * f1 - 0.5 * f * f2);
}

function oklabToLinearSrgb(l: number, a: number, b: number): [number, number, number] {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

function findCusp(a: number, b: number): [number, number] {
  const sCusp = computeMaxSaturation(a, b);
  const [r, g, bl] = oklabToLinearSrgb(1, sCusp * a, sCusp * b);
  const lCusp = Math.cbrt(1 / Math.max(r, g, bl));
  return [lCusp, lCusp * sCusp];
}

function findGamutIntersection(
  a: number,
  b: number,
  l1: number,
  c1: number,
  l0: number,
  cusp: [number, number],
): number {
  let t: number;
  if ((l1 - l0) * cusp[1] - (cusp[0] - l0) * c1 <= 0) {
    t = (cusp[1] * l0) / (c1 * cusp[0] + cusp[1] * (l0 - l1));
  } else {
    t = (cusp[1] * (l0 - 1)) / (c1 * (cusp[0] - 1) + cusp[1] * (l0 - l1));

    const dL = l1 - l0;
    const dC = c1;

    const kL = 0.3963377774 * a + 0.2158037573 * b;
    const kM = -0.1055613458 * a - 0.0638541728 * b;
    const kS = -0.0894841775 * a - 1.291485548 * b;

    const lDt = dL + dC * kL;
    const mDt = dL + dC * kM;
    const sDt = dL + dC * kS;

    const lv = l0 * (1 - t) + t * l1;
    const cv = t * c1;

    const l_ = lv + cv * kL;
    const m_ = lv + cv * kM;
    const s_ = lv + cv * kS;

    const lc = l_ * l_ * l_;
    const mc = m_ * m_ * m_;
    const sc = s_ * s_ * s_;

    const ldt = 3 * lDt * l_ * l_;
    const mdt = 3 * mDt * m_ * m_;
    const sdt = 3 * sDt * s_ * s_;

    const ldt2 = 6 * lDt * lDt * l_;
    const mdt2 = 6 * mDt * mDt * m_;
    const sdt2 = 6 * sDt * sDt * s_;

    const r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc - 1;
    const r1 = 4.0767416621 * ldt - 3.3077115913 * mdt + 0.2309699292 * sdt;
    const r2 = 4.0767416621 * ldt2 - 3.3077115913 * mdt2 + 0.2309699292 * sdt2;

    const uR = r1 / (r1 * r1 - 0.5 * r * r2);
    let tR = -r * uR;

    const g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc - 1;
    const g1 = -1.2684380046 * ldt + 2.6097574011 * mdt - 0.3413193965 * sdt;
    const g2 = -1.2684380046 * ldt2 + 2.6097574011 * mdt2 - 0.3413193965 * sdt2;

    const uG = g1 / (g1 * g1 - 0.5 * g * g2);
    let tG = -g * uG;

    const bl = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc - 1;
    const b1 = -0.0041960863 * ldt - 0.7034186147 * mdt + 1.707614701 * sdt;
    const b2 = -0.0041960863 * ldt2 - 0.7034186147 * mdt2 + 1.707614701 * sdt2;

    const uB = b1 / (b1 * b1 - 0.5 * bl * b2);
    let tB = -bl * uB;

    tR = uR >= 0 ? tR : 1e5;
    tG = uG >= 0 ? tG : 1e5;
    tB = uB >= 0 ? tB : 1e5;

    t += Math.min(tR, Math.min(tG, tB));
  }

  return t;
}

function getSTMid(a: number, b: number): [number, number] {
  const s =
    0.11516993 +
    1 /
      (7.4477897 +
        4.1590124 * b +
        a *
          (-2.19557347 +
            1.75198401 * b +
            a * (-2.13704948 - 10.02301043 * b + a * (-4.24894561 + 5.38770819 * b + 4.69891013 * a))));

  const t =
    0.11239642 +
    1 /
      (1.6132032 -
        0.68124379 * b +
        a *
          (0.40370612 +
            0.90148123 * b +
            a * (-0.27087943 + 0.6122399 * b + a * (0.00299215 - 0.45399568 * b - 0.14661872 * a))));

  return [s, t];
}

function getCs(l: number, a: number, b: number): [number, number, number] {
  const cusp = findCusp(a, b);

  const cMax = findGamutIntersection(a, b, l, 1, l, cusp);

  const stMaxS = cusp[1] / cusp[0];
  const stMaxT = cusp[1] / (1 - cusp[0]);
  const k = cMax / Math.min(l * stMaxS, (1 - l) * stMaxT);

  const [sMid, tMid] = getSTMid(a, b);

  const cA0 = l * sMid;
  const cB0 = (1 - l) * tMid;
  const cMid = 0.9 * k * Math.sqrt(Math.sqrt(1 / (1 / cA0 ** 4 + 1 / cB0 ** 4)));

  const cA = l * 0.4;
  const cB = (1 - l) * 0.8;
  const c0 = Math.sqrt(1 / (1 / cA ** 2 + 1 / cB ** 2));

  return [c0, cMid, cMax];
}

export function oklchToOkhsl(l: number, c: number, hDeg: number): Okhsl {
  if (l >= 1) return { h: 0, s: 0, l: 1 };
  if (l <= 0) return { h: 0, s: 0, l: 0 };

  const hRad = (hDeg * Math.PI) / 180;
  const a = Math.cos(hRad);
  const b = Math.sin(hRad);

  const [c0, cMid, cMax] = getCs(l, a, b);

  const mid = 0.8;
  const midInv = 1.25;

  let s: number;
  if (c < cMid) {
    const k1 = mid * c0;
    const k2 = 1 - k1 / cMid;
    const t = c / (k1 + k2 * c);
    s = t * mid;
  } else {
    const k0 = cMid;
    const k1 = ((1 - mid) * cMid * cMid * midInv * midInv) / c0;
    const k2 = 1 - k1 / (cMax - cMid);
    const t = (c - k0) / (k1 + k2 * (c - k0));
    s = mid + (1 - mid) * t;
  }

  return {
    h: ((hDeg % 360) + 360) % 360,
    s: Math.min(1, Math.max(0, s)),
    l: toe(l),
  };
}
