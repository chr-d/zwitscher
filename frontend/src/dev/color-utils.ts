/** Dependency-free CSS color editing. Core formats work without a DOM.
 * Oklab matrices: https://bottosson.github.io/posts/oklab/
 * CSS syntax: https://www.w3.org/TR/css-color-4/
 * RGB channels stay unclipped until an sRGB display/contrast value is needed.
 */
export interface RgbColor {
  mode: "rgb";
  r: number;
  g: number;
  b: number;
  alpha: number;
}
export interface OklchColor {
  mode: "oklch";
  l: number;
  c: number;
  h: number;
  alpha: number;
}
export interface HslColor {
  mode: "hsl";
  h: number;
  s: number;
  l: number;
  alpha: number;
}
export type RgbInput = Omit<RgbColor, "mode" | "alpha"> & {
  mode?: "rgb";
  alpha?: number;
};
export type OklchInput = Omit<OklchColor, "mode" | "alpha" | "h"> & {
  mode?: "oklch";
  alpha?: number;
  h?: number;
};
export type ColorInput = string | RgbInput | OklchInput;
export type ParsedColor = RgbColor | OklchColor;

const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const hue = (n: number) => ((n % 360) + 360) % 360;
const num = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const round = (n: number, places = 6) => String(Number(n.toFixed(places)));
const alphaSuffix = (a: number) => (a < 1 ? ` / ${round(a)}` : "");

function number(token: string, percentScale = 1) {
  if (token === "none") return 0;
  const percent = token.endsWith("%");
  const raw = percent ? token.slice(0, -1) : token;
  if (!num.test(raw)) return NaN;
  const n = Number(raw) * (percent ? percentScale / 100 : 1);
  return Number.isFinite(n) ? n : NaN;
}
function angle(token: string) {
  if (token === "none") return 0;
  const match = token.match(/^(.*?)(deg|grad|rad|turn)?$/);
  if (!match) return NaN;
  const n = num.test(match[1]) ? Number(match[1]) : NaN;
  return hue(
    n *
      ((
        { deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 } as Record<
          string,
          number
        >
      )[match[2]] ?? 1),
  );
}

function hslRgb(h: number, s: number, l: number, alpha = 1): RgbColor {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { mode: "rgb", r: channel(0), g: channel(8), b: channel(4), alpha };
}

function parseCore(text: string): ParsedColor | null {
  if (text === "transparent")
    return { mode: "rgb", r: 0, g: 0, b: 0, alpha: 0 };
  if (text === "black" || text === "white") {
    const n = text === "white" ? 1 : 0;
    return { mode: "rgb", r: n, g: n, b: n, alpha: 1 };
  }
  if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(text)) {
    let hex = text.slice(1);
    if (hex.length <= 4) hex = [...hex].map((x) => x + x).join("");
    const bytes = hex.match(/../g)!.map((x) => parseInt(x, 16) / 255);
    return {
      mode: "rgb",
      r: bytes[0],
      g: bytes[1],
      b: bytes[2],
      alpha: bytes[3] ?? 1,
    };
  }
  const match = text.match(/^(rgb|rgba|hsl|hsla|oklch|oklab)\((.*)\)$/);
  if (!match) return null;
  const [, type, body] = match;
  const legacy = body.includes(",");
  if (
    legacy &&
    (!/^(rgb|rgba|hsl|hsla)$/.test(type) ||
      body.includes("/") ||
      /\bnone\b/.test(body))
  )
    return null;
  const parts = legacy
    ? body.split(",").map((x) => x.trim())
    : body.split("/").map((x) => x.trim());
  if (legacy ? parts.length < 3 || parts.length > 4 : parts.length > 2)
    return null;
  const channels = legacy ? parts.slice(0, 3) : parts[0].split(/\s+/);
  if (channels.length !== 3) return null;
  const alphaToken = legacy ? parts[3] : parts[1];
  const alpha = alphaToken === undefined ? 1 : clamp(number(alphaToken));
  if (!Number.isFinite(alpha)) return null;
  let result: ParsedColor;
  if (type.startsWith("rgb")) {
    if (
      legacy &&
      !channels.every((x) => x.endsWith("%") === channels[0].endsWith("%"))
    )
      return null;
    const [r, g, b] = channels.map((x) =>
      clamp(x.endsWith("%") ? number(x) : number(x) / 255),
    );
    result = { mode: "rgb", r, g, b, alpha };
  } else if (type.startsWith("hsl")) {
    if (!channels.slice(1).every((x) => x.endsWith("%") || x === "none"))
      return null;
    result = hslRgb(
      angle(channels[0]),
      clamp(number(channels[1])),
      clamp(number(channels[2])),
      alpha,
    );
  } else {
    const l = clamp(number(channels[0]));
    if (type === "oklch") {
      result = {
        mode: "oklch",
        l,
        c: Math.max(0, number(channels[1], 0.4)),
        h: angle(channels[2]),
        alpha,
      };
    } else {
      const a = number(channels[1], 0.4);
      const b = number(channels[2], 0.4);
      result = {
        mode: "oklch",
        l,
        c: Math.hypot(a, b),
        h: hue((Math.atan2(b, a) * 180) / Math.PI),
        alpha,
      };
    }
  }
  return Object.values(result).every(
    (v) => typeof v !== "number" || Number.isFinite(v),
  )
    ? result
    : null;
}

let context: CanvasRenderingContext2D | null | undefined;
function browserColor(text: string): ParsedColor | null {
  // Context-dependent values aren't stand-alone colors. Never silently turn them black.
  if (
    /\b(?:currentcolor|var|env|inherit|initial|unset|revert|revert-layer|light-dark)\b/i.test(
      text,
    )
  )
    return null;
  if (typeof document === "undefined") return null;
  try {
    context ??= document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    // Invalid fillStyle assignments leave the previous value unchanged. Two sentinels
    // distinguish invalid input from valid colors that happen to equal a sentinel.
    context.fillStyle = "#010203";
    context.fillStyle = text;
    const first = context.fillStyle;
    context.fillStyle = "#040506";
    context.fillStyle = text;
    if (first !== context.fillStyle) return null;
    const core = parseCore(first.toLowerCase());
    if (core) return core;
    context.clearRect(0, 0, 1, 1);
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return { mode: "rgb", r: r / 255, g: g / 255, b: b / 255, alpha: a / 255 };
  } catch {
    return null;
  }
}

export function parseColor(value: unknown): ParsedColor | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim().toLowerCase();
  const core = parseCore(text);
  // Core syntax is deliberately strict; do not ask the browser to repair malformed input.
  return (
    core ??
    (/^(?:#|(?:rgb|rgba|hsl|hsla|oklch|oklab)\()/i.test(text)
      ? null
      : browserColor(text))
  );
}

function colorObject(value: unknown): ParsedColor | null {
  if (typeof value === "string") return parseColor(value);
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const mode = v.mode ?? ("c" in v ? "oklch" : "rgb");
  const alpha = v.alpha ?? 1;
  if (typeof alpha !== "number" || !Number.isFinite(alpha)) return null;
  const finite = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n);
  if (mode === "oklch") {
    const h = v.h ?? 0;
    if (!finite(v.l) || !finite(v.c) || !finite(h)) return null;
    return { ...v, mode, l: v.l, c: v.c, h, alpha: clamp(alpha) };
  }
  if (mode === "rgb" && finite(v.r) && finite(v.g) && finite(v.b)) {
    return { ...v, mode, r: v.r, g: v.g, b: v.b, alpha: clamp(alpha) };
  }
  return null;
}

// Sign-preserving sRGB transfer functions also handle out-of-gamut channels.
const linear = (n: number) =>
  Math.abs(n) <= 0.04045
    ? n / 12.92
    : Math.sign(n) * ((Math.abs(n) + 0.055) / 1.055) ** 2.4;
const encoded = (n: number) =>
  Math.abs(n) <= 0.0031308
    ? 12.92 * n
    : Math.sign(n) * (1.055 * Math.abs(n) ** (1 / 2.4) - 0.055);

export function toRgb(value: ColorInput): RgbColor | null {
  const v = colorObject(value);
  if (!v) return null;
  if (v.mode === "rgb") return v;
  const a = v.c * Math.cos((v.h * Math.PI) / 180);
  const b = v.c * Math.sin((v.h * Math.PI) / 180);
  const l = (v.l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (v.l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (v.l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    mode: "rgb",
    r: encoded(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: encoded(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: encoded(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    alpha: v.alpha,
  };
}

export function toOklch(value: ColorInput): OklchColor | null {
  const v = colorObject(value);
  if (!v) return null;
  if (v.mode === "oklch")
    return { ...v, l: clamp(v.l), c: Math.max(0, v.c), h: hue(v.h) };
  const [r, g, b] = [v.r, v.g, v.b].map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(a, bb);
  return {
    mode: "oklch",
    l: clamp(lightness),
    c: c < 1e-7 ? 0 : c,
    h: c < 1e-7 ? 0 : hue((Math.atan2(bb, a) * 180) / Math.PI),
    alpha: v.alpha,
  };
}

export function toHsl(value: ColorInput): HslColor | null {
  const v = toRgb(value);
  if (!v) return null;
  const [r, g, b] = [v.r, v.g, v.b].map((x) => clamp(x));
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  const l = (max + min) / 2;
  const h = !d
    ? 0
    : hue(
        60 *
          (max === r
            ? (g - b) / d
            : max === g
              ? (b - r) / d + 2
              : (r - g) / d + 4),
      );
  return {
    mode: "hsl",
    h,
    s: !d ? 0 : d / (1 - Math.abs(2 * l - 1)),
    l,
    alpha: v.alpha,
  };
}

export function formatHex(value: ColorInput): string | null {
  const v = toRgb(value);
  if (!v) return null;
  const channels = [v.r, v.g, v.b, ...(v.alpha < 1 ? [v.alpha] : [])];
  return (
    "#" +
    channels
      .map((x) =>
        Math.round(clamp(x) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function formatOklch(value: ColorInput): string {
  const v = toOklch(value);
  return v
    ? `oklch(${round(v.l * 100)}% ${round(v.c, 7)} ${round(v.h)}${alphaSuffix(v.alpha)})`
    : "";
}
export function formatRgb(value: ColorInput): string {
  const v = toRgb(value);
  return v
    ? `rgb(${[v.r, v.g, v.b].map((x) => round(clamp(x) * 255, 3)).join(" ")}${alphaSuffix(v.alpha)})`
    : "";
}
export function formatHsl(value: ColorInput): string {
  const v = toHsl(value);
  return v
    ? `hsl(${round(v.h)} ${round(v.s * 100)}% ${round(v.l * 100)}%${alphaSuffix(v.alpha)})`
    : "";
}
export function isInSrgb(value: ColorInput): boolean | null {
  const v = toRgb(value);
  return v ? [v.r, v.g, v.b].every((x) => x >= -1e-5 && x <= 1.00001) : null;
}

function displayRgb(value: ColorInput): RgbColor | null {
  const v = toRgb(value);
  return v ? { ...v, r: clamp(v.r), g: clamp(v.g), b: clamp(v.b) } : null;
}
function over(fg: RgbColor, bg: Pick<RgbColor, "r" | "g" | "b">): RgbColor {
  const channel = (key: "r" | "g" | "b") =>
    fg[key] * fg.alpha + bg[key] * (1 - fg.alpha);
  return {
    mode: "rgb",
    r: channel("r"),
    g: channel("g"),
    b: channel("b"),
    alpha: 1,
  };
}
const luminance = (v: Pick<RgbColor, "r" | "g" | "b">) =>
  0.2126 * linear(v.r) + 0.7152 * linear(v.g) + 0.0722 * linear(v.b);

export function compositeOnWhite(value: ColorInput): RgbColor | null {
  const v = displayRgb(value);
  return v ? over(v, { r: 1, g: 1, b: 1 }) : null;
}

/** Order matters with alpha: background, foreground, underlying canvas.
 * Uses clipped sRGB for WCAG 2 contrast. Canvas must be opaque (default white).
 */
export function wcagContrast(
  background: ColorInput,
  foreground: ColorInput,
  canvas: ColorInput = "#ffffff",
): number | null {
  const bg = displayRgb(background),
    fg = displayRgb(foreground),
    under = displayRgb(canvas);
  if (!bg || !fg || !under || under.alpha !== 1) return null;
  const paintedBg = over(bg, under);
  const paintedFg = over(fg, paintedBg);
  const a = luminance(paintedBg),
    b = luminance(paintedFg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
