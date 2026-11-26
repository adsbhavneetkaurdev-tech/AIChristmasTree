import type { OrnamentColor } from "./palette";

export type RGB = [number, number, number];

export interface GiftPaper {
  paper: [string, string, string]; // light, base, dark
  ribbon: string;
  ribbonDark: string;
}

/**
 * Everything colour-related, for both the canvas engine and the web pages.
 * Presets: classic (red/gold), elegant (gold/white), winter (silver/ice blue),
 * or "custom" built from a few hex colours.
 */
export interface Theme {
  name: string;
  // Page / UI colours
  accent: string; // headings, names, hairlines (gold in Classic)
  accentBright: string;
  accentDark: string;
  text: string; // primary text (ivory)
  champagne: string; // secondary text / soft surfaces
  secondary: string; // the second brand colour (red in Classic)
  bg950: string;
  bg900: string;
  bg800: string;
  bg700: string;
  // Canvas scene
  sky: [string, string, string];
  halo: RGB;
  warm: RGB; // glow of the tree, floor, star rays
  bokeh: RGB[];
  lights: { rgb: RGB; weight: number }[];
  ornaments: OrnamentColor[];
  star: [string, string, string]; // facet light, mid, dark
  gifts: GiftPaper[];
}

// ─── helpers ───
export function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (!/^[0-9a-f]{6}$/i.test(h.slice(0, 6)) || Number.isNaN(n)) return [226, 184, 102];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: RGB) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a), y = hexToRgb(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}
function ornament(key: string, base: string, weight: number): OrnamentColor {
  return { key, base, light: mix(base, "#ffffff", 0.6), dark: mix(base, "#000000", 0.62), glow: hexToRgb(mix(base, "#ffffff", 0.45)), weight };
}

// Shared ornament colours
const O = {
  gold: { key: "gold", base: "#d9a94e", light: "#fff0c4", dark: "#6e4810", glow: [255, 204, 120] as RGB },
  champagne: { key: "champagne", base: "#e9d3a0", light: "#fffaf0", dark: "#8a7044", glow: [255, 232, 186] as RGB },
  ivory: { key: "ivory", base: "#efe9dc", light: "#ffffff", dark: "#8f8a80", glow: [255, 246, 228] as RGB },
  red: { key: "red", base: "#9e2731", light: "#ec8d93", dark: "#3c070d", glow: [255, 120, 110] as RGB },
  frost: { key: "frost", base: "#c4d8cf", light: "#ffffff", dark: "#4d6a5e", glow: [220, 245, 235] as RGB },
  rosegold: { key: "rosegold", base: "#cf9474", light: "#ffe2cf", dark: "#653420", glow: [255, 190, 160] as RGB },
  ice: { key: "ice", base: "#8fbfe0", light: "#eaf6ff", dark: "#2c5675", glow: [190, 225, 255] as RGB },
  silver: { key: "silver", base: "#c9ced6", light: "#ffffff", dark: "#5d6570", glow: [230, 238, 250] as RGB },
};
const w = (c: Omit<OrnamentColor, "weight">, weight: number): OrnamentColor => ({ ...c, weight });

const WARM_LIGHTS = [
  { rgb: [255, 206, 130] as RGB, weight: 62 },
  { rgb: [255, 244, 222] as RGB, weight: 22 },
  { rgb: [255, 186, 92] as RGB, weight: 12 },
  { rgb: [255, 110, 100] as RGB, weight: 4 },
];

export const THEME_PRESETS: Record<"classic" | "elegant" | "winter", Theme> = {
  classic: {
    name: "classic",
    accent: "#e2b866", accentBright: "#f3d48b", accentDark: "#c99a45",
    text: "#fbf6ea", champagne: "#f4e4bc", secondary: "#a8303a",
    bg950: "#030b08", bg900: "#06140f", bg800: "#0b231a", bg700: "#123526",
    sky: ["#020806", "#04110c", "#071a12"], halo: [40, 96, 70], warm: [255, 196, 120],
    bokeh: [[226, 184, 102], [244, 228, 188], [190, 70, 70]],
    lights: WARM_LIGHTS,
    ornaments: [w(O.gold, 32), w(O.red, 28), w(O.champagne, 16), w(O.ivory, 12), w(O.rosegold, 7), w(O.frost, 5)],
    star: ["#fff3cf", "#f0c66e", "#a8762a"],
    gifts: [
      { paper: ["#b8404a", "#8e1f2a", "#561018"], ribbon: "#f0cf86", ribbonDark: "#a87d32" },
      { paper: ["#2f7356", "#1d4d3a", "#0d281d"], ribbon: "#f4e4bc", ribbonDark: "#b3a070" },
      { paper: ["#fbf5e6", "#ebdfc1", "#b9a780"], ribbon: "#a8303a", ribbonDark: "#681520" },
      { paper: ["#ecc87a", "#c9993f", "#7f5a1c"], ribbon: "#fbf6ea", ribbonDark: "#c8bb9c" },
      { paper: ["#8a3446", "#5a1a28", "#320b15"], ribbon: "#e2b866", ribbonDark: "#93692a" },
      { paper: ["#2a5c48", "#173f30", "#0a2219"], ribbon: "#c44a52", ribbonDark: "#7a1c24" },
    ],
  },
  elegant: {
    name: "elegant",
    accent: "#e6cc93", accentBright: "#f7e6bd", accentDark: "#b8975a",
    text: "#fffdf8", champagne: "#f1e8d6", secondary: "#f7f3ea",
    bg950: "#040505", bg900: "#0a0c0b", bg800: "#141816", bg700: "#1f2522",
    sky: ["#030403", "#070908", "#0d110f"], halo: [70, 78, 64], warm: [255, 220, 170],
    bokeh: [[230, 205, 150], [255, 250, 240], [240, 225, 190]],
    lights: [
      { rgb: [255, 244, 222], weight: 50 },
      { rgb: [255, 214, 150], weight: 40 },
      { rgb: [255, 196, 120], weight: 10 },
    ],
    ornaments: [w(O.gold, 34), w(O.champagne, 26), w(O.ivory, 26), w(O.frost, 7), w(O.rosegold, 7)],
    star: ["#fffaf0", "#ecd59e", "#a98a4c"],
    gifts: [
      { paper: ["#fbf7ee", "#efe6d2", "#bdb196"], ribbon: "#d6b46a", ribbonDark: "#93733a" },
      { paper: ["#f0d38f", "#cfa75a", "#86662c"], ribbon: "#fffdf8", ribbonDark: "#d4cbb8" },
      { paper: ["#4a4a46", "#2a2a28", "#121211"], ribbon: "#e6cc93", ribbonDark: "#9d7f45" },
      { paper: ["#f6ecd8", "#e4d3b0", "#a8936a"], ribbon: "#ffffff", ribbonDark: "#cfc6b3" },
      { paper: ["#ffffff", "#f1ede4", "#c2bcae"], ribbon: "#cfa75a", ribbonDark: "#86662c" },
      { paper: ["#e9dcc0", "#cdb98f", "#8a7650"], ribbon: "#2a2a28", ribbonDark: "#000000" },
    ],
  },
  winter: {
    name: "winter",
    accent: "#cfe3f2", accentBright: "#eef7ff", accentDark: "#8fb3cf",
    text: "#f4f9ff", champagne: "#dbe7f0", secondary: "#9cc7e6",
    bg950: "#02060c", bg900: "#06101c", bg800: "#0b1a2b", bg700: "#12263b",
    sky: ["#02050a", "#050d18", "#081626"], halo: [50, 90, 130], warm: [200, 225, 255],
    bokeh: [[180, 215, 245], [240, 248, 255], [150, 190, 230]],
    lights: [
      { rgb: [235, 245, 255], weight: 55 },
      { rgb: [170, 215, 255], weight: 30 },
      { rgb: [255, 236, 200], weight: 15 },
    ],
    ornaments: [w(O.silver, 28), w(O.ice, 28), w(O.frost, 18), w(O.ivory, 18), w(O.champagne, 8)],
    star: ["#ffffff", "#d6e4f0", "#7f97ad"],
    gifts: [
      { paper: ["#e9f0f6", "#cfd9e2", "#8a98a6"], ribbon: "#8fbfe0", ribbonDark: "#3f6f92" },
      { paper: ["#7fb2d8", "#4f86b3", "#22476a"], ribbon: "#f4f9ff", ribbonDark: "#b9c9d8" },
      { paper: ["#ffffff", "#eef3f8", "#b6c3cf"], ribbon: "#c9ced6", ribbonDark: "#7c8591" },
      { paper: ["#2f4d6e", "#1b3350", "#0b1829"], ribbon: "#cfe3f2", ribbonDark: "#7f9fb8" },
      { paper: ["#d4dbe3", "#aeb7c2", "#626c78"], ribbon: "#9cc7e6", ribbonDark: "#4a7fa6" },
      { paper: ["#b9dcf2", "#8fbfe0", "#3d6f94"], ribbon: "#ffffff", ribbonDark: "#c3d2df" },
    ],
  },
};

export interface CustomColors {
  accent?: string;
  secondary?: string;
  background?: string;
  text?: string;
}

/** Build a full theme from a few brand colours, starting from Classic. */
export function customTheme(c: CustomColors): Theme {
  const base = THEME_PRESETS.classic;
  const accent = c.accent || base.accent;
  const secondary = c.secondary || base.secondary;
  const bg = c.background || base.bg900;
  const text = c.text || base.text;
  return {
    ...base,
    name: "custom",
    accent,
    accentBright: mix(accent, "#ffffff", 0.35),
    accentDark: mix(accent, "#000000", 0.22),
    text,
    champagne: mix(text, accent, 0.25),
    secondary,
    bg950: mix(bg, "#000000", 0.45),
    bg900: bg,
    bg800: mix(bg, "#ffffff", 0.06),
    bg700: mix(bg, "#ffffff", 0.12),
    sky: [mix(bg, "#000000", 0.6), mix(bg, "#000000", 0.3), bg],
    halo: hexToRgb(mix(bg, "#ffffff", 0.22)),
    warm: hexToRgb(mix(accent, "#ffffff", 0.4)),
    bokeh: [hexToRgb(accent), hexToRgb(text), hexToRgb(secondary)],
    ornaments: [
      ornament("accent", accent, 34),
      ornament("secondary", secondary, 30),
      w(O.ivory, 18),
      w(O.champagne, 12),
      w(O.frost, 6),
    ],
    star: [mix(accent, "#ffffff", 0.7), accent, mix(accent, "#000000", 0.4)],
    gifts: [
      { paper: [mix(secondary, "#ffffff", 0.25), secondary, mix(secondary, "#000000", 0.45)], ribbon: accent, ribbonDark: mix(accent, "#000000", 0.35) },
      { paper: [mix(accent, "#ffffff", 0.3), accent, mix(accent, "#000000", 0.45)], ribbon: text, ribbonDark: mix(text, "#000000", 0.25) },
      { paper: [text, mix(text, "#000000", 0.08), mix(text, "#000000", 0.3)], ribbon: secondary, ribbonDark: mix(secondary, "#000000", 0.4) },
      { paper: [mix(bg, "#ffffff", 0.35), mix(bg, "#ffffff", 0.18), mix(bg, "#000000", 0.2)], ribbon: accent, ribbonDark: mix(accent, "#000000", 0.35) },
      { paper: [mix(secondary, "#000000", 0.1), mix(secondary, "#000000", 0.3), mix(secondary, "#000000", 0.6)], ribbon: text, ribbonDark: mix(text, "#000000", 0.25) },
      { paper: [mix(accent, "#ffffff", 0.5), mix(accent, "#ffffff", 0.2), mix(accent, "#000000", 0.3)], ribbon: secondary, ribbonDark: mix(secondary, "#000000", 0.4) },
    ],
  };
}

export function resolveTheme(preset: string | undefined, custom?: CustomColors): Theme {
  if (preset === "custom") return customTheme(custom ?? {});
  if (preset === "elegant" || preset === "winter" || preset === "classic") return THEME_PRESETS[preset];
  return THEME_PRESETS.classic;
}

export const rgbStr = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
export const hexA = (hex: string, a: number) => rgbStr(hexToRgb(hex), a);
