import { literalBackgrounds, literalText } from '../../core/theme/cssVariableTheme';
import type { PlocksTheme } from '../../core/theme/types';
import type { KnobAppearance, KnobArcConfig, KnobValueLabelPosition, KnobVariant } from './types';

/**
 * Visual variants change the knob's *form* — body shape and finish, stroke weights, caps,
 * which indicator carries the value. They deliberately do not invent their own palettes:
 * interface variants take the theme's semantic roles and the accent, and hardware variants
 * use fixed physical materials (see `MATERIALS`) while the accent still lights their LEDs,
 * scales and caps.
 *
 * Every value here is a default. The preset is merged *under* the caller's `appearance`,
 * so any single property can still be overridden without opting out of the variant.
 */
export type KnobVariantContext = {
  theme: PlocksTheme;
  /** Resolved diameter in pixels — every metric below scales off it. */
  size: number;
  /** The already-resolved highlight color for this knob. */
  accentColor: string;
  disabled: boolean;
  /** Whether the knob has `marks` — selector-style presets tick those instead of a scale. */
  hasMarks?: boolean;
};

const scale = (size: number, ratio: number, min: number) => Math.max(min, Math.round(size * ratio));

/**
 * The neutral chrome the presets draw with — semantic roles, read as literals
 * because they end up as SVG strokes (on web the tokens are `var()` references).
 */
const chrome = (theme: PlocksTheme) => {
  const text = literalText(theme);
  const lines = literalBackgrounds(theme);
  return {
    track: lines.borderStrong ?? lines.border,
    strongLine: text.disabled,
    muted: text.muted,
    body: text.secondary,
    surface: theme.backgrounds.surface,
  };
};

/**
 * Physical materials for the hardware presets. A real knob is the same plastic or metal
 * whatever the app's color scheme, so these are fixed rather than read from the theme —
 * the theme's gray ramp *reverses* in dark mode, which would turn black bakelite white.
 * Shading, rims and drop shadows keep them legible on either background; the brand still
 * comes through the accent on LEDs, scales and caps.
 */
const MATERIALS = {
  /** Black bakelite / rubber. */
  black: '#1C1C1E',
  /** Charcoal plastic. */
  charcoal: '#3A3A3C',
  /** A slightly lifted charcoal, for caps and skirts on charcoal bodies. */
  graphite: '#48484A',
  /** Rims and edge lines on dark parts. */
  rim: '#6D6D70',
  /** Machined aluminum. */
  aluminum: '#C7C7CC',
  /** Polished inserts. */
  silver: '#E5E5EA',
  /** Silkscreen and indicator white. */
  white: '#FFFFFF',
} as const;

/** A grounded drop shadow that scales with the knob. */
const dropShadow = (size: number, strength = 0.35) => ({
  color: '#000000',
  offsetY: scale(size, 0.02, 1),
  blur: scale(size, 0.05, 3),
  opacity: strength,
});

/** Below this diameter a printed number scale crowds into a smear, so presets drop it. */
const SCALE_LABEL_MIN_SIZE = 110;

/** Segments in the `digital` collar — a 7-bit ladder, dense enough to read as continuous. */
const DIGITAL_SEGMENT_COUNT = 128;

/**
 * The sweep each variant turns through. Hardware pots stop short of a full turn, so most
 * presets use the classic 7-to-5-o'clock 270°; gauges open wider at the bottom; the stock
 * dial and the endless encoder keep the full circle. Kept separate from the builders
 * because the arc is needed before the theme-dependent appearance is resolved.
 */
const POT_ARC: KnobArcConfig = { startAngle: -135, sweepAngle: 270 };
const VARIANT_ARCS: Partial<Record<KnobVariant, KnobArcConfig>> = {
  minimal: POT_ARC,
  outline: POT_ARC,
  material: POT_ARC,
  studio: POT_ARC,
  neumorphic: POT_ARC,
  digital: POT_ARC,
  segmented: POT_ARC,
  'led-ring': POT_ARC,
  gauge: { startAngle: -120, sweepAngle: 240 },
  retro: POT_ARC,
  knurled: POT_ARC,
  'soft-touch': POT_ARC,
  chickenhead: { startAngle: -120, sweepAngle: 240 },
  skirted: { startAngle: -150, sweepAngle: 300 },
  fluted: POT_ARC,
};

/** The arc a variant turns through, or `undefined` for the full-circle default. */
export const getKnobVariantArc = (variant: KnobVariant | undefined): KnobArcConfig | undefined =>
  variant ? VARIANT_ARCS[variant] : undefined;

/**
 * Variants whose body would sit under a centered readout — a physical knob face, or a
 * needle hub — default the value label to below the knob instead.
 */
const OFF_BODY_LABEL: KnobVariant[] = [
  'led-ring',
  'gauge',
  'retro',
  'knurled',
  'encoder',
  'soft-touch',
  'chickenhead',
  'skirted',
  'fluted',
];

/** Where a variant places the value label by default, or `undefined` for the center. */
export const getKnobVariantLabelPosition = (
  variant: KnobVariant | undefined
): KnobValueLabelPosition | undefined =>
  variant && OFF_BODY_LABEL.includes(variant) ? 'bottom' : undefined;

type KnobVariantBuilder = (context: KnobVariantContext) => KnobAppearance;

/** The body radius a preset's `radiusOffset` produces, for placing arms and dimples on it. */
const bodyRadiusFor = (size: number, radiusOffset: number) => size / 2 + radiusOffset;

const VARIANT_BUILDERS: Record<Exclude<KnobVariant, 'default'>, KnobVariantBuilder> = {
  /**
   * Hairline everything, for dense panels and toolbars. No body, no arm — just a thin
   * track, the filled arc, and a small dot.
   */
  minimal: ({ theme, size, accentColor }) => ({
    body: false,
    ring: {
      thickness: scale(size, 0.022, 2),
      color: chrome(theme).track,
      trailColor: chrome(theme).track,
      cap: 'round',
    },
    progress: { mode: 'contiguous', color: accentColor, roundedCaps: true },
    thumb: { size: scale(size, 0.085, 8), color: accentColor },
    pointer: false,
  }),

  /** Wireframe: an empty bordered body, a hairline arc, and an arm reaching to the rim. */
  outline: ({ theme, size, accentColor }) => {
    const radiusOffset = -scale(size, 0.12, 6);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    const hairline = Math.max(1, Math.round(size * 0.01));
    return {
      body: {
        color: 'transparent',
        borderWidth: hairline,
        borderColor: chrome(theme).muted,
        radiusOffset,
      },
      ring: {
        thickness: hairline,
        color: chrome(theme).track,
        trailColor: chrome(theme).track,
        backgroundColor: 'transparent',
      },
      progress: { mode: 'contiguous', color: accentColor, thickness: hairline * 2, roundedCaps: true },
      thumb: false,
      pointer: {
        shape: 'line',
        inset: bodyRadius * 0.4,
        length: bodyRadius,
        width: hairline * 2,
        color: accentColor,
      },
    };
  },

  /** A circular slider: a thick soft track, a rounded arc, and a handle riding on it. */
  material: ({ theme, size, accentColor }) => {
    const thickness = scale(size, 0.09, 6);
    return {
      body: false,
      ring: {
        thickness,
        color: chrome(theme).track,
        trailColor: chrome(theme).track,
        backgroundColor: 'transparent',
        cap: 'round',
      },
      progress: { mode: 'contiguous', color: accentColor, roundedCaps: true },
      thumb: {
        size: Math.round(thickness * 1.5),
        color: chrome(theme).surface,
        strokeWidth: Math.max(2, Math.round(thickness * 0.3)),
        strokeColor: accentColor,
        activeScale: 1.15,
      },
      pointer: false,
    };
  },

  /**
   * The plugin-rack look: a chunky track, a bright filled arc, and a rim dot outlined
   * against the surface so it stays legible on top of the arc.
   */
  studio: ({ theme, size, accentColor }) => ({
    body: { color: 'transparent' },
    ring: {
      thickness: scale(size, 0.075, 5),
      color: chrome(theme).track,
      trailColor: chrome(theme).track,
      cap: 'round',
    },
    progress: { mode: 'contiguous', color: accentColor, roundedCaps: true },
    thumb: {
      size: scale(size, 0.11, 9),
      color: accentColor,
      strokeWidth: 2,
      strokeColor: theme.backgrounds.surface,
    },
    // Clear of the centered readout; reaches out to the rim dot.
    pointer: { inset: size * 0.2, width: scale(size, 0.018, 2), color: accentColor },
  }),

  /**
   * Soft UI: a disc of the surface color lifted off the page by a dark shadow below-right
   * and a light one above-left, inside a slim inset track.
   */
  neumorphic: ({ theme, size, accentColor }) => {
    const radiusOffset = -scale(size, 0.16, 10);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    const isDark = theme.colorScheme === 'dark';
    const lift = scale(size, 0.03, 2);
    const blur = scale(size, 0.07, 4);
    return {
      body: {
        color: chrome(theme).surface,
        shading: 'matte',
        radiusOffset,
        shadow: [
          { color: '#000000', offsetX: lift, offsetY: lift, blur, opacity: isDark ? 0.6 : 0.22 },
          { color: '#ffffff', offsetX: -lift, offsetY: -lift, blur, opacity: isDark ? 0.08 : 0.9 },
        ],
      },
      ring: {
        thickness: scale(size, 0.035, 3),
        color: chrome(theme).track,
        trailColor: chrome(theme).track,
        backgroundColor: 'transparent',
      },
      progress: { mode: 'contiguous', color: accentColor, roundedCaps: true },
      thumb: false,
      pointer: {
        shape: 'dot',
        length: bodyRadius * 0.72,
        width: scale(size, 0.06, 5),
        color: accentColor,
      },
    };
  },

  /**
   * A step-based gear readout: a collar of individually lit segments inside the ring that
   * fills as the value climbs, plus butt caps and a square glowing marker. The segment count
   * is fixed rather than derived from `step`, so the collar reads the same whether the knob
   * runs 0–1 or 0–360.
   */
  digital: ({ theme, size, accentColor, disabled }) => ({
    body: { color: 'transparent' },
    ring: {
      thickness: scale(size, 0.06, 4),
      color: chrome(theme).track,
      trailColor: chrome(theme).track,
      cap: 'butt',
    },
    progress: { mode: 'contiguous', color: accentColor, roundedCaps: false },
    ticks: {
      source: 'count',
      count: DIGITAL_SEGMENT_COUNT,
      shape: 'line',
      position: 'inner',
      // Sits just inside the ring, with a gap so the lit segments read as their own collar
      // rather than as fringe on the track.
      radiusOffset: -scale(size, 0.035, 3),
      length: scale(size, 0.05, 4),
      width: 1,
      color: accentColor,
      inactiveColor: chrome(theme).track,
      // Lights everything up to the value, the way a meter fills.
      activeMode: 'fill',
    },
    thumb: {
      shape: 'square',
      size: scale(size, 0.13, 10),
      color: accentColor,
      glow: disabled ? undefined : { color: accentColor, intensity: 0.55, blur: scale(size, 0.3, 12) },
    },
    // Starts clear of the centered readout and stops short of the collar, so the arm points
    // at the value without striking through the number.
    pointer: {
      inset: size * 0.2,
      length: size * 0.33,
      width: scale(size, 0.022, 2),
      cap: 'butt',
      color: accentColor,
    },
  }),

  /** A dozen hard-edged blocks around the dial that fill with the value, like a DAW meter. */
  segmented: ({ theme, size, accentColor }) => ({
    body: false,
    ring: { visible: false, thickness: scale(size, 0.1, 7) },
    progress: false,
    thumb: false,
    pointer: false,
    ticks: {
      source: 'count',
      count: 12,
      shape: 'line',
      position: 'center',
      length: scale(size, 0.09, 6),
      width: scale(size, 0.11, 6),
      cap: 'butt',
      color: accentColor,
      inactiveColor: chrome(theme).track,
      activeMode: 'fill',
    },
  }),

  /**
   * A MIDI-controller encoder: a dark domed cap ringed by glowing LEDs that light up to the
   * value, with a white line on the cap.
   */
  'led-ring': ({ theme, size, accentColor }) => {
    const m = MATERIALS;
    const radiusOffset = -scale(size, 0.17, 10);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    return {
      body: {
        color: m.charcoal,
        shading: 'dome',
        borderWidth: 1,
        borderColor: m.rim,
        radiusOffset,
        shadow: dropShadow(size),
      },
      ring: { visible: false, thickness: scale(size, 0.07, 5) },
      progress: false,
      thumb: false,
      ticks: {
        source: 'count',
        count: 15,
        shape: 'dot',
        position: 'center',
        width: scale(size, 0.05, 4),
        color: accentColor,
        inactiveColor: chrome(theme).track,
        activeMode: 'fill',
        glow: { intensity: 0.9, blur: scale(size, 0.07, 4) },
      },
      pointer: {
        shape: 'line',
        inset: bodyRadius * 0.45,
        length: bodyRadius * 0.88,
        width: scale(size, 0.025, 2),
        color: m.white,
      },
    };
  },

  /** A 240° instrument dial: a printed scale, a fine arc, and a tapered needle on a hub. */
  gauge: ({ theme, size, accentColor }) => {
    const c = chrome(theme);
    const ringThickness = scale(size, 0.02, 2);
    const ringRadius = size / 2 - ringThickness / 2;
    return {
      body: { color: c.surface, borderWidth: 1, borderColor: c.track, radiusOffset: 0 },
      ring: {
        thickness: ringThickness,
        color: c.track,
        trailColor: c.track,
        backgroundColor: 'transparent',
        radiusOffset: -scale(size, 0.06, 4),
        cap: 'butt',
      },
      progress: { mode: 'contiguous', color: accentColor, roundedCaps: false },
      thumb: false,
      ticks: [
        {
          source: 'count',
          count: 51,
          shape: 'line',
          position: 'inner',
          length: scale(size, 0.035, 3),
          width: 1,
          color: c.muted,
          inactiveColor: c.muted,
        },
        {
          source: 'count',
          count: 11,
          shape: 'line',
          position: 'inner',
          length: scale(size, 0.07, 5),
          width: Math.max(2, Math.round(size * 0.012)),
          color: c.body,
          inactiveColor: c.body,
          label: size >= SCALE_LABEL_MIN_SIZE
            ? { show: true, position: 'inner', offset: -scale(size, 0.13, 10), style: { color: c.muted } }
            : undefined,
        },
      ],
      pointer: {
        shape: 'needle',
        length: ringRadius * 0.78,
        width: scale(size, 0.025, 2),
        color: accentColor,
        counterweight: { size: scale(size, 0.1, 8), color: c.body },
      },
    };
  },

  /**
   * Skeuomorphic hardware: a domed charcoal body with a lit rim, a stubby white arm out from
   * a dished center cap, and silkscreened mark ticks around the outside.
   */
  retro: ({ theme, size, accentColor }) => {
    const m = MATERIALS;
    const radiusOffset = -scale(size, 0.1, 6);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    return {
      body: {
        color: m.charcoal,
        shading: 'dome',
        borderWidth: Math.max(2, Math.round(size * 0.015)),
        borderColor: m.rim,
        radiusOffset,
        cap: { ratio: 0.32, color: m.graphite, shading: 'concave' },
        shadow: dropShadow(size),
      },
      ring: {
        thickness: scale(size, 0.03, 2),
        color: chrome(theme).muted,
        trailColor: chrome(theme).strongLine,
        backgroundColor: 'transparent',
        cap: 'round',
      },
      progress: false,
      thumb: false,
      pointer: {
        shape: 'line',
        inset: bodyRadius * 0.38,
        length: bodyRadius * 0.86,
        width: scale(size, 0.035, 3),
        color: m.white,
        cap: 'round',
      },
      ticks: {
        source: 'marks',
        shape: 'line',
        position: 'outer',
        length: scale(size, 0.055, 5),
        width: 2,
        radiusOffset: scale(size, 0.02, 2),
        color: accentColor,
        inactiveColor: chrome(theme).muted,
        activeMode: 'nearest',
      },
    };
  },

  /**
   * A machined-aluminum pedal knob: a metal skirt cut with a fine knurl that turns with
   * the value, a spun-aluminum face, and an engraved notch — inside a printed 0–10 scale.
   */
  knurled: ({ theme, size, accentColor }) => {
    const m = MATERIALS;
    const radiusOffset = -scale(size, 0.09, 6);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    return {
      body: {
        color: m.aluminum,
        shading: 'metal',
        radiusOffset,
        borderWidth: 1,
        borderColor: m.rim,
        grip: { style: 'knurl', count: 72, depth: 0.16, width: 1, color: '#000000', opacity: 0.4 },
        cap: { ratio: 0.8, color: m.silver, shading: 'brushed', borderWidth: 1, borderColor: m.rim },
        shadow: dropShadow(size),
      },
      ring: { visible: false, thickness: scale(size, 0.06, 4) },
      progress: false,
      thumb: false,
      ticks: {
        source: 'count',
        count: 11,
        shape: 'line',
        position: 'center',
        length: scale(size, 0.035, 3),
        width: Math.max(1.5, size * 0.01),
        color: accentColor,
        inactiveColor: chrome(theme).muted,
      },
      pointer: {
        shape: 'notch',
        inset: bodyRadius * 0.2,
        length: bodyRadius * 0.76,
        width: scale(size, 0.025, 2),
        color: m.charcoal,
        cap: 'butt',
      },
    };
  },

  /**
   * An endless rotary encoder: a ridged charcoal grip that visibly turns, a domed cap with a
   * finger dimple, and a ring of position LEDs that lights wherever it points.
   */
  encoder: ({ theme, size, accentColor }) => {
    const m = MATERIALS;
    const radiusOffset = -scale(size, 0.11, 7);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    return {
      body: {
        color: m.charcoal,
        shading: 'matte',
        radiusOffset,
        grip: { style: 'ridge', count: 30, depth: 0.14, width: scale(size, 0.014, 2), color: '#000000', opacity: 0.55 },
        cap: { ratio: 0.82, color: m.graphite, shading: 'dome', borderWidth: 1, borderColor: m.charcoal },
        shadow: dropShadow(size),
      },
      ring: { visible: false, thickness: scale(size, 0.06, 4) },
      progress: false,
      thumb: false,
      ticks: {
        source: 'count',
        count: 32,
        shape: 'dot',
        position: 'center',
        width: scale(size, 0.025, 3),
        color: accentColor,
        inactiveColor: chrome(theme).track,
        activeMode: 'nearest',
        glow: { intensity: 0.9, blur: scale(size, 0.05, 3) },
      },
      pointer: {
        shape: 'dimple',
        length: bodyRadius * 0.55,
        width: scale(size, 0.13, 8),
        color: m.charcoal,
      },
    };
  },

  /**
   * A rubberized synth knob: matte black with a finely ribbed edge, a slightly lifted top,
   * and a crisp white line, inside a silkscreened scale.
   */
  'soft-touch': ({ theme, size, accentColor }) => {
    const m = MATERIALS;
    const radiusOffset = -scale(size, 0.09, 6);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    return {
      body: {
        color: m.black,
        shading: 'matte',
        radiusOffset,
        grip: { style: 'ridge', count: 48, depth: 0.1, width: scale(size, 0.008, 1), color: '#ffffff', opacity: 0.1 },
        cap: { ratio: 0.86, color: m.charcoal, shading: 'matte' },
        shadow: dropShadow(size, 0.4),
      },
      ring: { visible: false, thickness: scale(size, 0.06, 4) },
      progress: false,
      thumb: false,
      ticks: {
        source: 'count',
        count: 11,
        shape: 'dot',
        position: 'center',
        width: scale(size, 0.022, 3),
        color: accentColor,
        inactiveColor: chrome(theme).muted,
      },
      pointer: {
        shape: 'line',
        inset: bodyRadius * 0.25,
        length: bodyRadius * 0.8,
        width: scale(size, 0.03, 2),
        color: m.white,
      },
    };
  },

  /**
   * The pointed bar knob of guitar amps and selector switches. The whole body aims at the
   * value; a white inlay runs down the pointer. Pairs with `behavior="stepped"` and marks.
   */
  chickenhead: ({ theme, size, accentColor, hasMarks }) => {
    const m = MATERIALS;
    const radiusOffset = -scale(size, 0.1, 6);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    return {
      body: {
        shape: 'chickenhead',
        color: m.black,
        shading: 'dome',
        borderWidth: 1,
        borderColor: m.graphite,
        radiusOffset,
        shadow: dropShadow(size, 0.4),
      },
      ring: { visible: false, thickness: scale(size, 0.06, 4) },
      progress: false,
      thumb: false,
      ticks: {
        source: hasMarks ? 'marks' : 'count',
        count: 11,
        shape: 'line',
        position: 'center',
        length: scale(size, 0.04, 3),
        width: Math.max(2, Math.round(size * 0.012)),
        color: accentColor,
        inactiveColor: chrome(theme).muted,
        activeMode: 'nearest',
      },
      pointer: {
        shape: 'line',
        inset: bodyRadius * 0.45,
        length: bodyRadius * 0.9,
        width: scale(size, 0.02, 2),
        color: m.white,
      },
    };
  },

  /**
   * A Davies-style instrument knob: a black body over a flared skirt printed with a
   * numbered scale, a white line running onto the skirt, and a cap in the accent color.
   */
  skirted: ({ theme, size, accentColor }) => {
    const m = MATERIALS;
    const radiusOffset = -scale(size, 0.18, 10);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    const skirtRatio = 1.32;
    return {
      body: {
        color: m.black,
        shading: 'dome',
        radiusOffset,
        cap: { ratio: 0.5, color: accentColor, shading: 'dome' },
        skirt: { ratio: skirtRatio, color: m.charcoal, shading: 'matte', borderWidth: 1, borderColor: m.rim },
        shadow: dropShadow(size),
      },
      ring: { visible: false, thickness: scale(size, 0.04, 3) },
      progress: false,
      thumb: false,
      ticks: {
        source: 'count',
        count: 11,
        shape: 'line',
        position: 'center',
        radiusOffset: -(size / 2 - bodyRadius * (1 + skirtRatio) / 2) + scale(size, 0.02, 1),
        length: scale(size, 0.035, 3),
        width: Math.max(1.5, size * 0.008),
        color: m.white,
        inactiveColor: m.rim,
        label: size >= SCALE_LABEL_MIN_SIZE
          ? {
              show: true,
              position: 'outer',
              offset: scale(size, 0.08, 6),
              formatter: (_mark, index) => `${index}`,
              style: { color: chrome(theme).muted },
            }
          : undefined,
      },
      pointer: {
        shape: 'line',
        inset: bodyRadius * 0.55,
        length: bodyRadius * skirtRatio * 0.96,
        width: scale(size, 0.02, 2),
        color: m.white,
      },
    };
  },

  /**
   * A vintage console or radio knob: a scalloped bakelite body that turns with the value,
   * with a polished insert and a dark line on its face.
   */
  fluted: ({ theme, size, accentColor }) => {
    const m = MATERIALS;
    const radiusOffset = -scale(size, 0.09, 6);
    const bodyRadius = bodyRadiusFor(size, radiusOffset);
    const capRatio = 0.58;
    return {
      body: {
        shape: 'fluted',
        sides: 14,
        fluteDepth: 0.07,
        color: m.charcoal,
        shading: 'dome',
        borderWidth: 1,
        borderColor: m.graphite,
        radiusOffset,
        cap: { ratio: capRatio, color: m.silver, shading: 'brushed', borderWidth: 1, borderColor: m.rim },
        shadow: dropShadow(size),
      },
      ring: { visible: false, thickness: scale(size, 0.06, 4) },
      progress: false,
      thumb: false,
      ticks: {
        source: 'count',
        count: 11,
        shape: 'dot',
        position: 'center',
        width: scale(size, 0.02, 3),
        color: accentColor,
        inactiveColor: chrome(theme).muted,
        activeMode: 'nearest',
      },
      pointer: {
        shape: 'line',
        inset: bodyRadius * capRatio * 0.25,
        length: bodyRadius * capRatio * 0.88,
        width: scale(size, 0.025, 2),
        color: m.charcoal,
      },
    };
  },
};

/** Resolves a variant to its appearance defaults. `default` (or unset) adds nothing. */
export const buildKnobVariantAppearance = (
  variant: KnobVariant | undefined,
  context: KnobVariantContext
): KnobAppearance | undefined => {
  if (!variant || variant === 'default') return undefined;
  return VARIANT_BUILDERS[variant]?.(context);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Merges a caller's appearance over a variant preset, recursing through plain objects.
 * `false`/`null` from the caller wins outright (that is how a layer gets removed), arrays
 * replace rather than concatenate, and anything the caller leaves out keeps the preset's
 * value — so `variant="knurled"` plus `appearance={{ body: { cap: { color: 'red' } } }}`
 * keeps the knurl, the finish, and the cap's size.
 */
const deepMerge = (base: unknown, override: unknown): unknown => {
  if (override === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;
  const merged: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    merged[key] = deepMerge(base[key], override[key]);
  }
  return merged;
};

export const mergeKnobAppearance = (
  base: KnobAppearance | undefined,
  override: KnobAppearance | undefined
): KnobAppearance | undefined => {
  if (!base) return override;
  if (!override) return base;
  return deepMerge(base, override) as KnobAppearance;
};
