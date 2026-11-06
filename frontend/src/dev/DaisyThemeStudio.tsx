/**
 * DaisyThemeStudio – a drop-in development-only theme editor for daisyUI v5.
 * React + Vite, Tailwind CSS v4. No additional color-library dependency.
 *
 * Mount only behind import.meta.env.DEV in your app.
 * The editor controls theme variables on <html data-theme="...">.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import tailwindColors from "tailwindcss/colors";

import "./DaisyThemeStudio.css";
import {
  compositeOnWhite,
  formatHex,
  formatHsl,
  formatOklch,
  formatRgb,
  isInSrgb,
  parseColor as parse,
  toOklch,
  wcagContrast,
} from "./color-utils";

export interface DaisyThemeStudioProps {
  /** Additional theme names, e.g. from stylesheets the browser cannot inspect. */
  themes?: readonly string[];
}

type ThemeValues = Record<string, string>;
type StoredEdits = Record<string, Record<string, unknown>>;
type ColorPickerProps = { value: string; onPick: (value: string) => void };
type ColorFormat = "OKLCH" | "HEX" | "HSL" | "RGB";

const COLOR_GROUPS = {
  Surfaces: ["base-100", "base-200", "base-300", "base-content"],
  Brand: [
    "primary",
    "primary-content",
    "secondary",
    "secondary-content",
    "accent",
    "accent-content",
    "neutral",
    "neutral-content",
  ],
  States: [
    "info",
    "info-content",
    "success",
    "success-content",
    "warning",
    "warning-content",
    "error",
    "error-content",
  ],
};
const COLORS = Object.values(COLOR_GROUPS).flat();
const SHAPES = [
  {
    name: "--radius-box",
    title: "Box radius",
    desc: "Cards, dialogs, alerts",
    min: 0,
    max: 3,
    step: 0.05,
    unit: "rem",
  },
  {
    name: "--radius-field",
    title: "Field radius",
    desc: "Buttons, inputs, tabs",
    min: 0,
    max: 3,
    step: 0.05,
    unit: "rem",
  },
  {
    name: "--radius-selector",
    title: "Selector radius",
    desc: "Checkboxes, toggles, badges",
    min: 0,
    max: 3,
    step: 0.05,
    unit: "rem",
  },
  {
    name: "--size-field",
    title: "Field sizing",
    desc: "Base sizing for fields",
    min: 0.15,
    max: 0.5,
    step: 0.00625,
    unit: "rem",
  },
  {
    name: "--size-selector",
    title: "Selector sizing",
    desc: "Base sizing for selectors",
    min: 0.15,
    max: 0.5,
    step: 0.00625,
    unit: "rem",
  },
  {
    name: "--border",
    title: "Border width",
    desc: "Buttons and inputs",
    min: 0,
    max: 5,
    step: 0.25,
    unit: "px",
  },
];
const TOKENS = [
  ...COLORS.map((name) => `--color-${name}`),
  ...SHAPES.map((shape) => shape.name),
  "--depth",
  "--noise",
  "color-scheme",
];
const SHADE_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
const PALETTE_NAMES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
] as const;
const PALETTE_FAMILIES = PALETTE_NAMES.filter(
  (family) => tailwindColors[family]?.[50],
);

export const DAISYUI_BUILTIN_THEMES = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
];
const LS_EDITS = "daisy-theme-studio:edits:v1";
const LS_THEME = "daisy-theme-studio:theme:v1";

function decodeCssName(name: string) {
  return name.replace(/\\([\da-f]{1,6}\s?|[\s\S])/gi, (_, escaped: string) => {
    if (!/^[\da-f]/i.test(escaped)) return escaped;
    const code = parseInt(escaped.trim(), 16);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "\ufffd";
  });
}
function discoverThemes() {
  const names = new Set<string>();
  const visited = new Set<CSSStyleSheet>();
  const visitSheet = (sheet: CSSStyleSheet) => {
    if (visited.has(sheet) || sheet.disabled) return;
    visited.add(sheet);
    // Cross-origin/blocked stylesheets may render but deny CSSOM access.
    try {
      visitRules(sheet.cssRules);
    } catch {
      /* use the themes prop as fallback */
    }
  };
  const visitRules = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (
        rule instanceof CSSStyleRule &&
        TOKENS.some((key) => rule.style.getPropertyValue(key))
      ) {
        const selector =
          /\[\s*data-theme\s*=\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\]\s]+))\s*\]/g;
        for (const match of rule.selectorText.matchAll(selector)) {
          const name = decodeCssName(match[1] ?? match[2] ?? match[3]);
          if (name) names.add(name);
        }
      }
      if (rule instanceof CSSImportRule && rule.styleSheet)
        visitSheet(rule.styleSheet);
      // Includes layers, media queries, supports, and CSS nesting. Read inactive
      // media rules too: both light and dark themes must remain selectable.
      if ("cssRules" in rule) visitRules((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of [
    ...document.styleSheets,
    ...(document.adoptedStyleSheets ?? []),
  ])
    visitSheet(sheet);
  return [...names];
}
function resolveSystemTheme(names: readonly string[]) {
  const root = document.documentElement;
  // Read the underlying CSS independently of saved/host inline overrides.
  // Restore values and priorities synchronously before returning/painting.
  const inline = TOKENS.map((key) => ({
    key,
    value: root.style.getPropertyValue(key),
    priority: root.style.getPropertyPriority(key),
  })).filter(({ value }) => value);
  const probe = document.createElement("div");
  probe.className = "dts-theme-probe";
  probe.style.display = "none";
  try {
    for (const { key } of inline) root.style.removeProperty(key);
    const style = getComputedStyle(root);
    const baseline = TOKENS.map((key) => style.getPropertyValue(key).trim());
    document.body.append(probe);
    const matches = names.filter((name) => {
      probe.dataset.theme = name;
      const preview = getComputedStyle(probe);
      return TOKENS.every(
        (key, i) => preview.getPropertyValue(key).trim() === baseline[i],
      );
    });
    // A custom theme may deliberately copy a built-in preset unchanged.
    const custom = matches.filter(
      (name) => !DAISYUI_BUILTIN_THEMES.includes(name),
    );
    if (custom.length === 1) return custom[0];
    // Multiple identical custom definitions cannot be identified uniquely.
    return matches.length === 1 ? matches[0] : "";
  } finally {
    probe.remove();
    for (const { key, value, priority } of inline)
      root.style.setProperty(key, value, priority);
  }
}
function readStorage(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage disabled */
  }
}
function loadEdits(): StoredEdits {
  const edits = readStorage(LS_EDITS);
  // Storage is untrusted. Activation still applies only managed string overrides.
  if (!edits || typeof edits !== "object" || Array.isArray(edits)) return {};
  const result: StoredEdits = {};
  for (const [theme, value] of Object.entries(
    edits as Record<string, unknown>,
  )) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[theme] = value as Record<string, unknown>;
    }
  }
  return result;
}
function snapshot(): ThemeValues {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    TOKENS.map((name) => [name, style.getPropertyValue(name).trim()]),
  );
}
function activateTheme(
  theme: string,
  clearInline = true,
  discovered: readonly string[] = [],
) {
  const root = document.documentElement;
  if (clearInline) {
    for (const name of TOKENS) root.style.removeProperty(name);
    if (theme) root.dataset.theme = theme;
    else root.removeAttribute("data-theme");
  }
  const systemTheme = theme ? "" : resolveSystemTheme(discovered);
  const storageTheme =
    theme ||
    systemTheme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "@dts-system:dark"
      : "@dts-system:light");
  const edits = loadEdits();
  if (!theme && storageTheme && edits[""]) {
    // Earlier versions shared one CSS-default bucket. Move it to the current
    // resolved theme once, keeping existing named overrides on conflicts.
    edits[storageTheme] = { ...edits[""], ...edits[storageTheme] };
    delete edits[""];
    writeStorage(LS_EDITS, edits);
  }
  const overrides = edits[storageTheme] ?? {};
  for (const name of TOKENS) {
    if (typeof overrides[name] === "string")
      root.style.setProperty(name, overrides[name]);
  }
  return { values: snapshot(), storageTheme, systemTheme };
}
function saveToken(theme: string, name: string, value: string) {
  document.documentElement.style.setProperty(name, value);
  const edits = loadEdits();
  edits[theme] = { ...(edits[theme] ?? {}), [name]: value };
  writeStorage(LS_EDITS, edits);
}
function resetStoredTheme(
  theme: string,
  storageTheme: string,
  discovered: readonly string[],
) {
  const edits = loadEdits();
  delete edits[storageTheme];
  writeStorage(LS_EDITS, edits);
  return activateTheme(theme, true, discovered);
}
function round(value: number, places = 2) {
  return Number(value).toFixed(places);
}
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
function asOklch(value: string) {
  try {
    return toOklch(value) ?? null;
  } catch {
    return null;
  }
}
const cssOklch = formatOklch;
function formatColor(value: string, format: ColorFormat): string {
  if (!parse(value)) return value || "";
  if (format === "HEX") return formatHex(value) ?? "";
  if (format === "OKLCH") return cssOklch(value);
  if (format === "RGB") return formatRgb(value);
  return formatHsl(value);
}
function gamutLabel(value: string) {
  const within = isInSrgb(value);
  return within === null
    ? "Color gamut unavailable"
    : within
      ? "Inside sRGB gamut"
      : "Outside sRGB gamut";
}
function relatedPair(name: string): [string, string] {
  if (name.startsWith("base-"))
    return [name === "base-content" ? "base-100" : name, "base-content"];
  const stem = name.replace(/-content$/, "");
  return [stem, `${stem}-content`];
}
// Translucent semantic backgrounds sit on base-100, itself over white.
function contrastCanvas(values: ThemeValues, background: string) {
  if (background === "base-100") return "#ffffff";
  const base = values["--color-base-100"];
  return compositeOnWhite(base) ?? "#ffffff";
}
function getContrast(name: string, values: ThemeValues) {
  const [background, foreground] = relatedPair(name);
  const bg = values[`--color-${background}`];
  const fg = values[`--color-${foreground}`];
  if (!bg || !fg) return null;
  try {
    const canvas = contrastCanvas(values, background);
    const ratio = wcagContrast(bg, fg, canvas);
    if (ratio === null || !Number.isFinite(ratio)) return null;
    return { ratio, background, foreground, canvas, pass: ratio >= 4.5 };
  } catch {
    return null;
  }
}
function buildThemeCSS(values: ThemeValues, name: string) {
  const cleanName = name.trim().replace(/[^\w-]/g, "-") || "my-theme";
  const scheme = values["color-scheme"] === "dark" ? "dark" : "light";
  return [
    '@plugin "daisyui/theme" {',
    `  name: "${cleanName}";`,
    "  default: false;",
    "  prefersdark: false;",
    `  color-scheme: ${scheme};`,
    "",
    ...COLORS.map(
      (key) =>
        `  --color-${key}: ${values[`--color-${key}`] || "transparent"};`,
    ),
    "",
    ...SHAPES.map(({ name: key }) => `  ${key}: ${values[key] || "0"};`),
    "",
    `  --depth: ${values["--depth"] || "0"};`,
    `  --noise: ${values["--noise"] || "0"};`,
    "}",
  ].join("\n");
}

function ColorRow({
  name,
  value,
  active,
  onClick,
}: {
  name: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`dts-color-row ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="dts-color-dot" style={{ background: value || "#777" }} />
      <span>{name}</span>
    </button>
  );
}

function Palette({ value, onPick }: ColorPickerProps) {
  const current = formatHex(value || "#000000");
  return (
    <div className="dts-palette" aria-label="Tailwind color swatches">
      <div className="dts-palette-row dts-palette-header">
        <span>Shade</span>
        {SHADE_STEPS.map((shade) => (
          <span key={shade}>{shade}</span>
        ))}
      </div>
      {PALETTE_FAMILIES.map((family) => (
        <div className="dts-palette-row" key={family}>
          <span className="dts-family-label">{family}</span>
          {SHADE_STEPS.map((shade) => {
            const swatch = tailwindColors[family][shade];
            const selected = formatHex(swatch) === current;
            return (
              <button
                type="button"
                key={shade}
                aria-label={`${family} ${shade}`}
                title={`${family}-${shade}`}
                aria-pressed={selected}
                className={`dts-palette-swatch ${selected ? "is-active" : ""}`}
                style={{ background: swatch }}
                onPointerDown={(e) => {
                  if (e.button === 0) onPick(cssOklch(swatch));
                }}
                onPointerEnter={(e) => {
                  if (e.buttons & 1) onPick(cssOklch(swatch));
                }}
                onClick={(e) => {
                  if (e.detail === 0) onPick(cssOklch(swatch));
                }}
              />
            );
          })}
        </div>
      ))}
      <p className="dts-helper">
        Click a swatch, or drag across the palette to preview colors live.
      </p>
    </div>
  );
}

function ColorSlider({
  label,
  value,
  min,
  max,
  step,
  gradient,
  onChange,
  numberStep,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  gradient: string;
  onChange: (value: number) => void;
  numberStep?: number;
}) {
  return (
    <label className="dts-slider-line">
      <span className="dts-slider-label">{label}</span>
      <input
        aria-label={`${label} slider`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--dts-gradient": gradient } as CSSProperties}
      />
      <input
        aria-label={`${label} value`}
        className="dts-number"
        type="number"
        min={min}
        max={max}
        step={numberStep ?? step}
        value={value}
        onChange={(e) => {
          if (e.target.value !== "")
            onChange(clamp(Number(e.target.value), min, max));
        }}
      />
    </label>
  );
}

function FinePicker({ value, onPick }: ColorPickerProps) {
  const color = asOklch(value) || { l: 0.65, c: 0.15, h: 265 };
  const l = Math.round(color.l * 1000) / 10;
  const c = Math.round(color.c * 10000) / 10000;
  const h = Math.round((color.h ?? 0) * 10) / 10;
  const [format, setFormat] = useState<ColorFormat>("OKLCH");
  const [draft, setDraft] = useState(() => formatColor(value, "OKLCH"));
  const [invalid, setInvalid] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setDraft(formatColor(value, format));
    setInvalid(false);
    setDirty(false);
  }, [value, format]);

  const gradient = (channel: "light" | "chroma" | "hue") => {
    const stops = Array.from({ length: 16 }, (_, i) => {
      const progress = i / 15;
      if (channel === "light") return cssOklch({ l: progress, c, h });
      if (channel === "chroma")
        return cssOklch({ l: color.l, c: progress * 0.4, h });
      return cssOklch({ l: 0.72, c: 0.17, h: progress * 360 });
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };
  const change = (key: "l" | "c" | "h", next: number) =>
    onPick(cssOklch({ ...color, [key]: next }));
  const commit = () => {
    if (!dirty) return;
    const parsed = parse(draft.trim());
    if (!parsed) {
      setInvalid(true);
      return;
    }
    const next = cssOklch(parsed);
    onPick(next);
    setDraft(formatColor(next, format));
    setDirty(false);
    setInvalid(false);
  };

  return (
    <div className="dts-fine">
      <div className="dts-fine-preview" style={{ background: value }}>
        <span className="dts-preview-label">Current color</span>
      </div>
      <div className="dts-fine-sliders">
        <ColorSlider
          label="Lightness"
          min={0}
          max={100}
          step={0.1}
          value={l}
          gradient={gradient("light")}
          onChange={(v) => change("l", v / 100)}
        />
        <ColorSlider
          label="Chroma"
          min={0}
          max={0.4}
          step={0.001}
          value={c}
          gradient={gradient("chroma")}
          onChange={(v) => change("c", v)}
        />
        <ColorSlider
          label="Hue"
          min={0}
          max={360}
          step={0.5}
          value={h}
          gradient={gradient("hue")}
          onChange={(v) => change("h", v)}
        />
      </div>
      <div className="dts-formatted">
        <select
          aria-label="Color format"
          value={format}
          onChange={(e) => setFormat(e.target.value as ColorFormat)}
        >
          {["OKLCH", "HEX", "HSL", "RGB"].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <input
          aria-label="Editable color value"
          className={invalid ? "is-invalid" : ""}
          value={draft}
          spellCheck="false"
          onChange={(e) => {
            setDraft(e.target.value);
            setDirty(true);
            setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onBlur={commit}
        />
      </div>
      {invalid && (
        <p className="dts-error">
          Invalid CSS color. Try #ff6600 or oklch(70% 0.2 45).
        </p>
      )}
      <span className="dts-gamut">
        {gamutLabel(value)} · CSS retains OKLCH values
      </span>
    </div>
  );
}

function ShapeControls({
  values,
  setToken,
}: {
  values: ThemeValues;
  setToken: (name: string, value: string) => void;
}) {
  return (
    <div className="dts-shapes">
      <h3>Geometry & size</h3>
      <p className="dts-helper">
        These controls affect your actual daisyUI components. Sizes are kept
        near daisyUI defaults.
      </p>
      {SHAPES.map(({ name, title, desc, min, max, step, unit }) => {
        const original = parseFloat(values[name]);
        const current = Number.isFinite(original) ? original : min;
        return (
          <div className="dts-shape" key={name}>
            <div className="dts-shape-heading">
              <span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <code>
                {round(current, 3)}
                {unit}
              </code>
            </div>
            <input
              aria-label={title}
              type="range"
              min={min}
              max={max}
              step={step}
              value={clamp(current, min, max)}
              onChange={(e) => setToken(name, `${e.target.value}${unit}`)}
            />
          </div>
        );
      })}
      <h3 className="dts-subheading">Effects</h3>
      {["--depth", "--noise"].map((name) => (
        <label className="dts-switch-line" key={name}>
          <span>
            <strong>{name === "--depth" ? "Depth" : "Noise"}</strong>
            <small>
              {name === "--depth"
                ? "Raised surfaces and shadows"
                : "Subtle texture effect"}
            </small>
          </span>
          <input
            type="checkbox"
            checked={values[name] === "1"}
            onChange={(e) => setToken(name, e.target.checked ? "1" : "0")}
          />
        </label>
      ))}
      <h3 className="dts-subheading">Browser color scheme</h3>
      <select
        className="dts-full-select"
        value={values["color-scheme"] === "dark" ? "dark" : "light"}
        onChange={(e) => setToken("color-scheme", e.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}

export default function DaisyThemeStudio({ themes }: DaisyThemeStudioProps) {
  // The host page owns startup. An empty name leaves the CSS default in charge.
  // Include a custom root theme even when the host did not list it in `themes`.
  const [initialTheme] = useState(
    () => document.documentElement.dataset.theme || "",
  );
  const [discovered, setDiscovered] = useState(discoverThemes);
  const available = useMemo(
    () => [
      ...new Set([
        ...(themes ?? (discovered.length ? [] : DAISYUI_BUILTIN_THEMES)),
        ...discovered,
      ]),
    ],
    [themes, discovered],
  );
  const supported = [...new Set(["", initialTheme, ...available])];
  const [theme, setTheme] = useState(initialTheme);
  const activeTheme = useRef({
    selection: initialTheme,
    storageTheme: initialTheme,
    initialized: false,
  });
  const [systemTheme, setSystemTheme] = useState("");
  const [values, setValues] = useState<ThemeValues | null>(null);
  const [selected, setSelected] = useState("primary");
  const [mode, setMode] = useState("palette");
  const [page, setPage] = useState("colors");
  const [open, setOpen] = useState(true);
  const [exportName, setExportName] = useState("mytheme");
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    // Preserve the live page on mount, including inline values. This also stays
    // idempotent when StrictMode replays the initial layout effect.
    let activated = activateTheme(
      theme,
      activeTheme.current.selection !== theme,
      available,
    );
    if (
      !theme &&
      activeTheme.current.initialized &&
      activated.storageTheme !== activeTheme.current.storageTheme
    ) {
      activated = activateTheme("", true, available);
    }
    setValues(activated.values);
    setSystemTheme(activated.systemTheme);
    activeTheme.current = {
      selection: theme,
      storageTheme: activated.storageTheme,
      initialized: true,
    };
  }, [theme, available]);
  useEffect(() => {
    // Vite replaces style text during CSS HMR; linked sheets can load later.
    const scan = () => {
      const names = discoverThemes();
      setDiscovered((old) =>
        old.length === names.length && old.every((name, i) => name === names[i])
          ? old
          : names,
      );
    };
    const observer = new MutationObserver(scan);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href", "disabled"],
    });
    document.addEventListener("load", scan, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("load", scan, true);
    };
  }, []);
  useEffect(() => {
    if (theme) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const refresh = () => {
      if (activeTheme.current.selection) return;
      const activated = activateTheme("", true, available);
      activeTheme.current = {
        selection: "",
        storageTheme: activated.storageTheme,
        initialized: true,
      };
      setValues(activated.values);
      setSystemTheme(activated.systemTheme);
      setCopied(false);
    };
    media.addEventListener("change", refresh);
    return () => media.removeEventListener("change", refresh);
  }, [theme, available]);
  const update = (name: string, next: string) => {
    saveToken(activeTheme.current.storageTheme, name, next);
    setValues((old) => (old ? { ...old, [name]: next } : old));
  };
  const switchTheme = (next: string) => {
    if (!supported.includes(next)) return;
    writeStorage(LS_THEME, next);
    setTheme(next);
    setCopied(false);
  };
  const reset = () => {
    const activated = resetStoredTheme(
      theme,
      activeTheme.current.storageTheme,
      available,
    );
    activeTheme.current = {
      selection: theme,
      storageTheme: activated.storageTheme,
      initialized: true,
    };
    setValues(activated.values);
    setSystemTheme(activated.systemTheme);
    setCopied(false);
  };
  const colorValue = values?.[`--color-${selected}`] || "oklch(65% 0.17 265)";
  const contrast = values ? getContrast(selected, values) : null;
  const exportCSS = useMemo(
    () => buildThemeCSS(values ?? {}, exportName),
    [values, exportName],
  );
  const copyCSS = async () => {
    try {
      await navigator.clipboard.writeText(exportCSS);
      setCopied(true);
    } catch {
      codeRef.current?.select();
      setCopied(false);
    }
  };
  const fixForeground = () => {
    if (!values) return;
    const pair = relatedPair(selected);
    const bg = values[`--color-${pair[0]}`];
    const white = "oklch(100% 0 0)";
    const black = "oklch(0% 0 0)";
    const canvas = contrastCanvas(values, pair[0]);
    const whiteRatio = wcagContrast(bg, white, canvas);
    const blackRatio = wcagContrast(bg, black, canvas);
    if (whiteRatio === null || blackRatio === null) return;
    const fg = whiteRatio >= blackRatio ? white : black;
    update(`--color-${pair[1]}`, fg);
  };

  if (!values) return null;
  if (!open)
    return (
      <button
        className="dts-launcher"
        onClick={() => setOpen(true)}
        type="button"
        title="Open daisyUI theme editor"
      >
        ✦ <span>Theme editor</span>
      </button>
    );

  return (
    <aside className="dts-studio" aria-label="daisyUI Live Theme Studio">
      <header className="dts-header">
        <div className="dts-brand">
          <span className="dts-logo">✦</span>
          <div>
            <strong>daisyUI Theme Studio</strong>
            <small>Live editor · development only</small>
          </div>
        </div>
        <button
          type="button"
          className="dts-icon-button"
          onClick={() => setOpen(false)}
          aria-label="Minimize editor"
          title="Minimize"
        >
          —
        </button>
      </header>
      <div className="dts-theme-line">
        <label htmlFor="dts-theme-select">Base theme</label>
        <select
          id="dts-theme-select"
          value={theme}
          onChange={(e) => switchTheme(e.target.value)}
        >
          {supported.map((name) => (
            <option key={name} value={name}>
              {name ||
                (systemTheme
                  ? `System / app default · ${systemTheme}`
                  : "System / app default")}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="dts-quiet-button"
          onClick={reset}
          title="Discard this theme's saved edits"
        >
          Reset
        </button>
      </div>
      <nav className="dts-tabs" aria-label="Theme tools">
        {[
          ["colors", "◉ Colors"],
          ["shape", "◫ Shape & effects"],
          ["export", "↗ Export CSS"],
        ].map(([key, label]) => (
          <button
            type="button"
            key={key}
            onClick={() => setPage(key)}
            className={page === key ? "is-active" : ""}
            aria-current={page === key ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>
      {page === "colors" && (
        <div className="dts-color-layout">
          <div className="dts-token-sidebar">
            {Object.entries(COLOR_GROUPS).map(([group, names]) => (
              <div key={group} className="dts-token-group">
                <span className="dts-group-label">{group}</span>
                {names.map((name) => (
                  <ColorRow
                    key={name}
                    name={name}
                    value={values[`--color-${name}`]}
                    active={selected === name}
                    onClick={() => setSelected(name)}
                  />
                ))}
              </div>
            ))}
          </div>
          <section className="dts-picker-side" aria-label="Color picker">
            <div className="dts-picker-head">
              <div>
                <small>Editing token</small>
                <strong>--color-{selected}</strong>
              </div>
              <span
                className="dts-current-dot"
                style={{ background: colorValue }}
              />
            </div>
            <div className="dts-mode-switch">
              <button
                type="button"
                className={mode === "palette" ? "is-active" : ""}
                onClick={() => setMode("palette")}
              >
                Palette
              </button>
              <button
                type="button"
                className={mode === "fine" ? "is-active" : ""}
                onClick={() => setMode("fine")}
              >
                Fine-tune · OKLCH
              </button>
            </div>
            {mode === "palette" ? (
              <Palette
                value={colorValue}
                onPick={(v) => update(`--color-${selected}`, v)}
              />
            ) : (
              <FinePicker
                key={selected}
                value={colorValue}
                onPick={(v) => update(`--color-${selected}`, v)}
              />
            )}
            <div className="dts-contrast">
              <div
                className="dts-contrast-sample"
                style={{
                  background: contrast
                    ? `linear-gradient(${values[`--color-${contrast.background}`]}, ${values[`--color-${contrast.background}`]}), ${formatRgb(contrast.canvas)}`
                    : colorValue,
                  color: contrast
                    ? values[`--color-${contrast.foreground}`]
                    : "#fff",
                }}
              >
                Aa <span>Example text</span>
              </div>
              <div className="dts-contrast-details">
                <strong>
                  {contrast
                    ? `${round(contrast.ratio, 2)}:1 contrast`
                    : "Contrast unavailable"}
                </strong>
                <small>
                  {contrast
                    ? contrast.pass
                      ? "WCAG AA normal text ✓"
                      : "Below WCAG AA normal text"
                    : "Select a semantic color"}
                </small>
                <button
                  type="button"
                  onClick={fixForeground}
                  disabled={!contrast}
                >
                  Auto text color
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      {page === "shape" && (
        <div className="dts-page-scroll">
          <ShapeControls values={values} setToken={update} />
        </div>
      )}
      {page === "export" && (
        <div className="dts-page-scroll dts-export">
          <h3>Export your finished theme</h3>
          <p className="dts-helper">
            Copy this complete <code>@plugin "daisyui/theme"</code> block into
            your app's Tailwind CSS stylesheet.
          </p>
          <label className="dts-export-name">
            Theme name{" "}
            <input
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              placeholder="mytheme"
            />
          </label>
          <textarea
            ref={codeRef}
            readOnly
            spellCheck={false}
            aria-label="Generated daisyUI theme CSS"
            value={exportCSS}
          />
          <button className="dts-copy-button" type="button" onClick={copyCSS}>
            {copied ? "✓ Copied!" : "Copy complete theme CSS"}
          </button>
          <p className="dts-helper">
            Saved edits stay in localStorage until you reset. Exported CSS is
            the permanent version you commit to your project.
          </p>
        </div>
      )}
      <footer className="dts-footer">
        <span>
          <span className="dts-live" /> LIVE · {COLORS.length} colors · 8 other
          variables
        </span>
        <button type="button" onClick={() => setPage("export")}>
          Export ↗
        </button>
      </footer>
    </aside>
  );
}
