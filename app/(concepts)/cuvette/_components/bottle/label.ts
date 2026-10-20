import type { BottleLook } from "../../_lib/product-look";
import type { TemplateManifest } from "./manifest";

const FL_OZ = 29.5735;

/**
 * Each line's share of the face to the lens: the glass's two strip reflections sit at its edges, so the print stays
 * well inside them, whatever the name's length.
 */
const SAFE = { name: 0.64, active: 0.62, rule: 0.7, mono: 0.74 };

/** The printable band of the sleeve, as a fraction of its u coordinate. */
export const LABEL_U0 = 0.2;
export const LABEL_SPAN = 0.6;

function family(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

let ready: Promise<void> | null = null;

/** Resolves once both label faces have loaded, so the first label is never set in a fallback font. */
export function fontsReady(): Promise<void> {
  ready ??= (async () => {
    const sans = family("--font-sans", "sans-serif");
    const mono = family("--font-mono", "monospace");
    await Promise.all([
      document.fonts.load(`300 100px ${sans}`),
      document.fonts.load(`450 100px ${sans}`),
      document.fonts.load(`500 100px ${sans}`),
      document.fonts.load(`400 100px ${mono}`),
    ]);
    await document.fonts.ready;
  })();
  return ready;
}

function filledLine(look: BottleLook) {
  const [y, m, d] = look.label.filled.split("-");
  return `LOT ${look.label.lot} · FILLED ${d}.${m}.${y.slice(2)}`;
}

/**
 * Prints a look's label as two spot-colour separations over the printable band of the sleeve: red is the main ink's
 * coverage, green the accent's, on black. Coverage averages exactly into mipmaps; the compositor supplies the inks.
 */
export function drawLabel(look: BottleLook, area: TemplateManifest["label"], width = 4096): HTMLCanvasElement {
  const sans = family("--font-sans", "sans-serif");
  const mono = family("--font-mono", "monospace");
  const l = look.label;
  const height = Math.round((width * area.height) / (area.radius * area.arc * LABEL_SPAN));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  const h = height;
  const mid = width / 2;
  // About half the sleeve faces the lens; everything sits inside that.
  const face = (width * 0.5) / LABEL_SPAN;
  const INK = "#ff0000";
  const ACCENT = "#00ff00";

  type Style = { size: number; weight?: number; font?: string; track?: number; stretch?: CanvasFontStretch };
  const set = ({ size, weight = 400, font = sans, track = 0, stretch = "normal" }: Style) => {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fontStretch = stretch;
    ctx.letterSpacing = `${track * size}px`;
  };
  const text = (value: string, y: number, style: Style) => {
    set(style);
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(value, mid + ((style.track ?? 0) * style.size) / 2, y);
  };
  const fit = (value: string, style: Style, limit: number) => {
    set(style);
    return Math.min(style.size, (style.size * limit) / ctx.measureText(value).width);
  };

  text("CUVETTE", h * 0.13, { size: h * 0.044, weight: 450, track: 0.34, stretch: "expanded" });
  nameLines(l.name).forEach(({ value, y, style }) => text(value, y, style));
  const active = `${l.strength}  ${l.active.toUpperCase()}`;
  text(active, h * 0.47, narrowest(active, { size: h * 0.038, weight: 500, track: 0.12 }, SAFE.active, ["expanded", "normal", "condensed"]));
  ctx.fillStyle = ACCENT;
  ctx.fillRect(mid - face * SAFE.rule / 2, h * 0.53, face * SAFE.rule, Math.max(3, h * 0.0055));
  text(`SERUM · ${l.sizeMl} ML · ${(l.sizeMl / FL_OZ).toFixed(0)} FL OZ`, h * 0.625, { size: h * 0.034, weight: 500, track: 0.14, stretch: "expanded" });
  const spec = `PH ${l.ph} · FRAGRANCE-FREE · PAO ${l.pao}`;
  text(spec, h * 0.715, { size: fit(spec, { size: h * 0.038, font: mono }, face * SAFE.mono), font: mono });
  const filled = filledLine(look);
  text(filled, h * 0.87, { size: fit(filled, { size: h * 0.034, font: mono }, face * SAFE.mono), font: mono });
  text("PORTO, PORTUGAL", h * 0.925, { size: h * 0.034, font: mono });
  return canvas;

  /** The widest setting (stretch, then size) of a line that fits `share` of the face. */
  function narrowest(value: string, style: Style, share: number, stretches: CanvasFontStretch[], least = 0.8): Style {
    let best = style;
    for (const stretch of stretches) {
      const size = fit(value, { ...style, stretch }, face * share);
      best = { ...style, stretch, size };
      if (size >= style.size * least) return best;
    }
    return best;
  }

  /**
   * The product name on one line, narrowing (Mona Sans' width axis) before it shrinks; a long name breaks onto two
   * lines rather than run into the glass's edge reflections.
   */
  function nameLines(name: string): { value: string; y: number; style: Style }[] {
    const style: Style = { size: h * 0.15, weight: 300, track: -0.02 };
    const one = narrowest(name, style, SAFE.name, ["normal", "semi-condensed", "condensed"], 0.72);
    const words = name.split(/\s+/);
    if (one.size >= style.size * 0.72 || words.length < 2) return [{ value: name, y: h * 0.37, style: one }];
    let split = 1;
    for (let i = 2; i < words.length; i++) {
      const gap = (k: number) => Math.abs(words.slice(0, k).join(" ").length - words.slice(k).join(" ").length);
      if (gap(i) < gap(split)) split = i;
    }
    const lines = [words.slice(0, split).join(" "), words.slice(split).join(" ")];
    const two: Style = { ...style, size: h * 0.1, stretch: "semi-condensed" };
    const size = Math.min(...lines.map((line) => fit(line, two, face * SAFE.name)));
    const set2 = { ...two, size };
    return [
      { value: lines[0], y: h * 0.39 - size * 1.02, style: set2 },
      { value: lines[1], y: h * 0.39, style: set2 },
    ];
  }
}
