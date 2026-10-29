import type { FC, ReactNode } from 'react';
import type { TextStyle, ViewStyle, StyleProp } from 'react-native';
import type { BaseProps } from '../../core/types/base';
import type { LayoutProps } from '../../core/utils/layout';
import type { ComponentSizeValue } from '../../core/theme/componentSize';

export interface KnobMark {
  /** Absolute value within the knob range to display */
  value: number;
  /** Optional label rendered near the tick */
  label?: ReactNode;
  /** Optional accent color applied when the mark becomes active */
  accentColor?: string;
  /** Optional icon surfaced by status-oriented variants */
  icon?: ReactNode;
}

/**
 * What kind of control the knob is — how it behaves and what it reads out, not how it
 * looks. Visual styling belongs to `variant` (and `appearance`).
 *
 * - `level` — plain bounded dial; the default
 * - `stepped` — snaps to `marks`
 * - `endless` — continuous encoder with no absolute angle→value mapping
 * - `dual` — primary readout in the centre plus a secondary line below
 * - `status` — discrete scenes: the active mark's icon and accent take over the centre
 */
export type KnobBehavior = 'level' | 'stepped' | 'endless' | 'dual' | 'status';

/**
 * How the knob looks. Variants set the body, ring, pointer and ticks; they take their
 * colors from the theme (its neutrals and the accent) rather than shipping their own
 * palettes. Every value is a default that `appearance` can override.
 *
 * Interface styles:
 * - `default` — the stock dial: neutral ring, accent thumb, no arm
 * - `minimal` — hairline track and a small dot; for dense panels
 * - `outline` — wireframe: an empty bordered body and a full-length arm
 * - `material` — thick track and a rounded arc around the value; a circular slider
 * - `studio` — chunky track, bright arc, and an outlined rim dot; the plugin-rack look
 * - `neumorphic` — a soft raised disc lit from the top left, with an inset track
 *
 * Digital and metering:
 * - `digital` — a 128-segment collar that lights with the value
 * - `segmented` — a dozen chunky blocks that fill like a game or DAW meter
 * - `led-ring` — a dark encoder cap ringed by glowing LEDs, as on MIDI controllers
 * - `gauge` — a 240° dial with a scale and a tapered needle
 *
 * Hardware:
 * - `retro` — domed body, a stubby arm over a center cap, silkscreened ticks
 * - `knurled` — machined aluminum with a knurled grip that turns with the value
 * - `encoder` — endless-style ridged cap with a finger dimple
 * - `soft-touch` — matte rubber synth knob with a ribbed edge and a white line
 * - `chickenhead` — the pointed bar knob of amp and selector switches
 * - `skirted` — a flared skirt with a numbered scale and a contrasting cap
 * - `fluted` — a scalloped, vintage console/radio knob
 */
export type KnobVariant =
  | 'default'
  | 'minimal'
  | 'outline'
  | 'material'
  | 'studio'
  | 'neumorphic'
  | 'digital'
  | 'segmented'
  | 'led-ring'
  | 'gauge'
  | 'retro'
  | 'knurled'
  | 'encoder'
  | 'soft-touch'
  | 'chickenhead'
  | 'skirted'
  | 'fluted';

export type KnobValueLabelPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface KnobValueLabelConfig {
  /** Placement relative to the knob surface */
  position?: KnobValueLabelPosition;
  /** Primary formatter for the displayed value */
  formatter?: (value: number) => ReactNode;
  /** Optional prefix rendered before the value */
  prefix?: ReactNode;
  /** Optional suffix rendered after the value */
  suffix?: ReactNode;
  /** Style overrides for the wrapper */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style overrides for the primary text */
  textStyle?: StyleProp<TextStyle>;
  /** Secondary readout rendered at an independent slot */
  secondary?: {
    formatter?: (value: number) => ReactNode;
    position?: KnobValueLabelPosition;
    prefix?: ReactNode;
    suffix?: ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
  };
}

export type KnobInteractionMode = 'spin' | 'vertical-slide' | 'horizontal-slide' | 'scroll';

export interface KnobInteractionConfig {
  /** Enabled gesture modalities */
  modes?: KnobInteractionMode[];
  /** Distance in pixels before committing to a gesture */
  lockThresholdPx?: number;
  /** Allowable perpendicular wiggle while detecting slides */
  variancePx?: number;
  /** Required dominance ratio (primary axis vs secondary) before locking into slide */
  slideDominanceRatio?: number;
  /** Pixels of movement required for one degree of rotation */
  slideRatio?: number;
  /** Minimum pixel delta before slides update, filters jitter */
  slideHysteresisPx?: number;
  /** Prevent spin gestures from wrapping past min/max in bounded mode */
  spinStopAtLimits?: boolean;
  /** Ignore tiny spin deltas (degrees) to avoid jitter */
  spinDeadZoneDegrees?: number;
  /** Radius at which spin drags increase precision */
  spinPrecisionRadius?: number;
  /** Whether to mirror GarageBand-style sidedness rules */
  respectStartSide?: boolean;
  /**
   * Jump to the pressed angle on mouse-down and scrub from there for the rest of the
   * gesture. Defaults to `true`. Ignored in endless mode, where an angle has no absolute
   * value; knobs without `'spin'` fall back to setting the value on release.
   */
  tapToSet?: boolean;
  /**
   * Fraction of the knob radius around the centre where presses are ignored, because the
   * angle there is dominated by a few pixels of noise. Defaults to `0.15`.
   */
  tapDeadRadiusRatio?: number;
  /** Mouse/trackpad scroll behavior */
  scroll?: {
    enabled?: boolean;
    ratio?: number;
    invert?: boolean;
    preventPageScroll?: boolean;
  };
  /** Gesture change callback */
  onModeChange?: (mode: KnobInteractionMode | null) => void;
}

export type KnobRingShadow = KnobShadow;

/**
 * One band of a segmented ring, in the spirit of `Progress.Section`: segments are laid end
 * to end from `min`, each covering `value` units of the knob's own range. Any range the
 * segments leave uncovered keeps the plain ring color.
 */
export interface KnobRingSegment {
  /** Span of this band in value units (for a 0–100 knob these read as percentages) */
  value: number;
  /** Band color. Defaults to the ring color. */
  color?: string;
  /** Band thickness. Defaults to the ring thickness. */
  thickness?: number;
}

export interface KnobRingStyle {
  /** Hide the track (and the surface disk under it). Geometry still uses it. @default true */
  visible?: boolean;
  thickness?: number;
  color?: string;
  trailColor?: string;
  backgroundColor?: string;
  cap?: 'butt' | 'round';
  radiusOffset?: number;
  shadow?: KnobRingShadow;
  /** Colored bands drawn over the ring, laid end to end from `min`. */
  segments?: KnobRingSegment[];
  /**
   * How `segments` relate to the current value.
   *
   * - `'track'` (default) paints every band across the whole ring as a static backdrop —
   *   zones you read the value against, with the progress arc drawn over the top.
   * - `'progress'` makes the bands the progress arc itself: they are clipped at the current
   *   value and nothing is drawn beyond it, so the dial fills through each color in turn.
   *   The plain progress stroke is suppressed, since the bands replace it.
   */
  segmentMode?: 'track' | 'progress';
}

/**
 * A two-or-more stop gradient. `linear` runs along `angle` (0° = top to bottom, 90° = left
 * to right); `radial` spreads from `center` (fractions of the shape's box) out to `radius`.
 */
export interface KnobGradient {
  type?: 'linear' | 'radial';
  stops: { offset: number; color: string; opacity?: number }[];
  /** Linear only. @default 0 */
  angle?: number;
  /** Radial only, as fractions of the shape's box. @default { x: 0.5, y: 0.5 } */
  center?: { x: number; y: number };
  /** Radial only, as a fraction of the shape's box. @default 0.5 */
  radius?: number;
}

/**
 * Lighting painted over a surface's base color as white/black overlays, so it works with
 * any color — a brand accent or a theme neutral alike. Lighting stays fixed while the
 * body turns, the way a real knob catches the room's light.
 *
 * - `flat` — no lighting
 * - `dome` — convex, lit from the top left
 * - `concave` — a dish, the inverse of `dome` (finger dimples, inset caps)
 * - `matte` — a soft top-to-bottom falloff; rubber and plastic
 * - `metal` — a hard linear sheen; machined and chromed parts
 * - `brushed` — concentric spun-aluminum rings plus a metal sheen
 */
export type KnobShading = 'flat' | 'dome' | 'concave' | 'matte' | 'metal' | 'brushed';

/** A soft shadow. Several can be stacked (neumorphism uses a light and a dark one). */
export interface KnobShadow {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  opacity?: number;
}

/**
 * Grip texture around the body's rim. It turns with the body when `body.rotates` is on.
 *
 * - `knurl` — many fine lines; machined metal
 * - `ridge` — fewer, wider ribs; rubber and plastic
 * - `dots` — a ring of small studs
 */
export interface KnobBodyGrip {
  style?: 'knurl' | 'ridge' | 'dots';
  /** Number of grip marks around the rim. */
  count?: number;
  /** How far the marks reach in from the rim, as a fraction of the body radius. @default 0.12 */
  depth?: number;
  /** Stroke width (or stud diameter) in pixels. */
  width?: number;
  color?: string;
  opacity?: number;
}

/** A concentric disc layered on the body: the cap on top, or the skirt underneath. */
export interface KnobBodyDisc {
  /** Radius as a fraction of the body radius — under 1 for a cap, over 1 for a skirt. */
  ratio?: number;
  color?: string;
  shading?: KnobShading;
  gradient?: KnobGradient;
  borderWidth?: number;
  borderColor?: string;
}

/**
 * The physical part of the knob: the thing you grab. Hardware looks live almost entirely
 * here — shape, finish, grip texture, cap, and skirt.
 */
export interface KnobBodyStyle {
  /**
   * - `circle` — round
   * - `polygon` — `sides` straight edges
   * - `fluted` — `sides` scalloped flutes
   * - `chickenhead` — a pointed bar with a short tail; aims at the value
   * @default 'circle'
   */
  shape?: 'circle' | 'polygon' | 'fluted' | 'chickenhead';
  /** Edges for `polygon`, flutes for `fluted`. @default 8 */
  sides?: number;
  /** How deep each flute cuts, as a fraction of the radius. @default 0.08 */
  fluteDepth?: number;
  color?: string;
  shading?: KnobShading;
  /** A custom gradient fill. Takes precedence over `color`; `shading` still layers on top. */
  gradient?: KnobGradient;
  borderWidth?: number;
  borderColor?: string;
  /** Pixels added to the knob radius (negative shrinks the body). */
  radiusOffset?: number;
  /**
   * Turn the body — shape, grip, and anything else drawn on it — with the value, as a real
   * knob does. Defaults to on for non-circular shapes and bodies with a grip.
   */
  rotates?: boolean;
  grip?: KnobBodyGrip | false;
  cap?: KnobBodyDisc | false;
  skirt?: KnobBodyDisc | false;
  shadow?: KnobShadow | KnobShadow[] | false;
}

export type KnobThumbShape = 'circle' | 'pill' | 'square';

export interface KnobThumbGlow {
  color?: string;
  blur?: number;
  intensity?: number;
}

export interface KnobThumbRenderContext {
  value: number;
  angle: number;
  size: number;
  /** True while the knob is being dragged, so custom thumbs can show their own press state. */
  isScrubbing: boolean;
}

export interface KnobThumbStyle {
  size?: number;
  /**
   * Scale applied to the thumb while the knob is being scrubbed, as press feedback.
   * `1` disables it; values below 1 shrink instead. @default 1.25
   */
  activeScale?: number;
  shape?: KnobThumbShape;
  color?: string;
  strokeWidth?: number;
  strokeColor?: string;
  offset?: number;
  glow?: KnobThumbGlow;
  style?: StyleProp<ViewStyle>;
  renderThumb?: (context: KnobThumbRenderContext) => ReactNode;
}

export type KnobTickSource = 'marks' | 'steps' | 'values' | 'count';
export type KnobTickShape = 'dot' | 'line' | 'icon' | 'custom';

export interface KnobTickLabelConfig {
  show?: boolean;
  formatter?: (mark: KnobMark, index: number) => ReactNode;
  position?: 'inner' | 'center' | 'outer';
  offset?: number;
  style?: StyleProp<TextStyle>;
}

/** What a per-tick color resolver is told about the tick it is being asked to color. */
export interface KnobTickColorContext {
  /** The value this tick sits at. */
  value: number;
  /** Index within the layer, in ascending value order. */
  index: number;
  /** Angle the tick is drawn at, in degrees. */
  angle: number;
  /** Whether the layer's `activeMode` counts this tick as lit. */
  isActive: boolean;
  /** The mark the tick came from — only for `source: 'marks'`. */
  mark?: KnobMark;
}

/**
 * One color for the whole layer, or a resolver called per tick so every tick can differ.
 * Returning `undefined` from the resolver falls through to the usual defaults.
 */
export type KnobTickColor = string | ((context: KnobTickColorContext) => string | undefined);

export interface KnobTickLayer {
  source?: KnobTickSource;
  values?: number[];
  /**
   * With `source: 'count'`, how many evenly spaced ticks to lay around the arc — an LED
   * ring of a fixed resolution, independent of `step` and `marks`. Capped at 512.
   */
  count?: number;
  shape?: KnobTickShape;
  length?: number;
  width?: number;
  radiusOffset?: number;
  position?: 'inner' | 'center' | 'outer';
  /**
   * Color of an active tick. A resolver colors each tick individually; for
   * `source: 'marks'`, a mark's own `accentColor` is used ahead of a flat string, so
   * per-detent colors need no resolver at all.
   */
  color?: KnobTickColor;
  /** Color of a tick the layer's `activeMode` leaves unlit. Also accepts a resolver. */
  inactiveColor?: KnobTickColor;
  /**
   * What counts as an active tick in this layer.
   *
   * - `'fill'` (default) lights every tick from `min` up to the current value, the way a
   *   meter fills.
   * - `'nearest'` lights only the single tick the pointer is aimed at, the way a selector
   *   or detent indicator reads. Matched by angle, so it works on endless knobs too.
   */
  activeMode?: 'fill' | 'nearest';
  /** Line-tick stroke caps. `butt` gives hard-edged blocks. @default 'round' */
  cap?: 'round' | 'butt';
  /** A halo around lit ticks, for LED rings. Unlit ticks never glow. */
  glow?: { color?: string; intensity?: number; blur?: number };
  iconName?: string;
  label?: KnobTickLabelConfig;
  renderTick?: (context: {
    value: number;
    angle: number;
    index: number;
    isActive: boolean;
    center: { x: number; y: number };
    radius: number;
  }) => ReactNode;
}

/**
 * The indicator drawn on the body.
 *
 * - `line` — a stroke from `inset` out to `length`
 * - `needle` — a tapered gauge needle from the hub
 * - `notch` — a groove cut into the body, with a lit edge
 * - `dot` — a single dot at `length`
 * - `dimple` — a concave finger dimple at `length`
 * - `triangle` — an arrowhead at `length`, pointing outward
 */
export type KnobPointerShape = 'line' | 'needle' | 'notch' | 'dot' | 'dimple' | 'triangle';

export interface KnobPointerStyle {
  visible?: boolean;
  shape?: KnobPointerShape;
  /** Distance from the center to the far end (or to the dot/dimple/arrowhead). */
  length?: number;
  /** Distance from the center where a `line`/`notch` starts. @default 0 */
  inset?: number;
  /** Stroke width, or the dot/dimple/arrowhead size. */
  width?: number;
  offset?: number;
  color?: string;
  cap?: 'round' | 'butt';
  counterweight?: { size?: number; color?: string };
}

export interface KnobArcConfig {
  startAngle?: number;
  sweepAngle?: number;
  direction?: 'cw' | 'ccw';
  clampInput?: boolean;
  wrap?: boolean;
}

export type KnobProgressMode = 'none' | 'contiguous' | 'split';

export interface KnobProgressConfig {
  mode?: KnobProgressMode;
  color?: string;
  trailColor?: string;
  roundedCaps?: boolean;
  thickness?: number;
}

export interface KnobPanningConfig {
  pivotValue?: number;
  positiveColor?: string;
  negativeColor?: string;
  showZeroIndicator?: boolean;
  valueFormatter?: (value: number) => string | ReactNode;
  mirrorThumbOffset?: boolean;
}

export interface KnobAppearance {
  /**
   * Take the knob's accent — thumb, arm, and progress arc — from the `accentColor` of the
   * mark nearest the current value, so the whole control matches the detent it is on.
   * `behavior="status"` already does this; this opts any other behavior in. Marks without
   * an `accentColor` leave the theme accent in place. @default false
   */
  accentFromMarks?: boolean;
  ring?: KnobRingStyle | false;
  body?: KnobBodyStyle | false;
  thumb?: KnobThumbStyle | false;
  ticks?: KnobTickLayer | KnobTickLayer[] | false;
  pointer?: KnobPointerStyle | false;
  arc?: KnobArcConfig;
  progress?: KnobProgressConfig | false;
  panning?: KnobPanningConfig;
  interaction?: KnobInteractionConfig;
}

export interface KnobProps extends BaseProps, LayoutProps {
  /** What kind of control this is: how it behaves and what it reads out. @default 'level' */
  behavior?: KnobBehavior;
  /**
   * Visual style preset. Merged under `appearance`, so single properties stay overridable.
   * @default 'default'
   */
  variant?: KnobVariant;
  /** Interaction mode for bounded or endless rotary behavior */
  mode?: 'bounded' | 'endless';
  /** Controlled value */
  value?: number;
  /** Uncontrolled initial value */
  defaultValue?: number;
  /** Minimum selectable value */
  min?: number;
  /** Maximum selectable value */
  max?: number;
  /** Step increment applied when interacting */
  step?: number;
  /** Called on every value change */
  onChange?: (value: number) => void;
  /** Called after interaction completes */
  onChangeEnd?: (value: number) => void;
  /** Fired when the user begins dragging */
  onScrubStart?: () => void;
  /** Fired when the user ends dragging */
  onScrubEnd?: () => void;
  /** Size token (`xs`–`3xl`) or an explicit diameter in pixels */
  size?: ComponentSizeValue;
  /** Diameter of the thumb indicator, in pixels. Defaults to a ratio of the resolved size. */
  thumbSize?: number;
  /** Disable all user interaction */
  disabled?: boolean;
  /** Prevent interaction but keep visual state */
  readOnly?: boolean;
  /** Custom formatter for the value label */
  formatLabel?: (value: number) => ReactNode;
  /** Render the value label inside the knob */
  withLabel?: boolean;
  /** Structured configuration for the value label block */
  valueLabel?: KnobValueLabelConfig | false;
  /** Optional marks rendered around the control */
  marks?: KnobMark[];
  /** Restrict interaction to the supplied marks */
  restrictToMarks?: boolean;
  /** Optional visual label rendered outside the knob */
  label?: ReactNode;
  /** Optional helper text rendered with the label */
  description?: ReactNode;
  /** Placement for the external label */
  labelPosition?: 'left' | 'right' | 'top' | 'bottom';
  /** Style overrides for the outer container */
  style?: StyleProp<ViewStyle>;
  /** Style overrides for the circular track */
  trackStyle?: StyleProp<ViewStyle>;
  /** Style overrides for the thumb */
  thumbStyle?: StyleProp<ViewStyle>;
  /** Style overrides for mark labels */
  markLabelStyle?: StyleProp<TextStyle>;
  /** Accessibility identifier */
  testID?: string;
  /** Screen reader label */
  accessibilityLabel?: string;
  /** Unified surface styling and interaction overrides */
  appearance?: KnobAppearance;
}

export interface KnobRootProps extends KnobProps {
  /** Modular children composed of Knob.* sub-components */
  children?: ReactNode;
}

export interface KnobBodyPartProps extends KnobBodyStyle {
  visible?: boolean;
}

export interface KnobRingPartProps extends KnobRingStyle {
  visible?: boolean;
}

export interface KnobRingSegmentPartProps extends KnobRingSegment {
  visible?: boolean;
}

export interface KnobProgressPartProps extends KnobProgressConfig {
  visible?: boolean;
}

export type KnobTickLayerPartProps = KnobTickLayer;

export interface KnobPointerPartProps extends KnobPointerStyle {
  enabled?: boolean;
}

export interface KnobThumbPartProps extends KnobThumbStyle {
  visible?: boolean;
}

export interface KnobValueLabelPartProps extends KnobValueLabelConfig {
  visible?: boolean;
}

export type KnobPartKind =
  | 'body'
  | 'ring'
  | 'ringSegment'
  | 'progress'
  | 'tick'
  | 'pointer'
  | 'thumb'
  | 'valueLabel';

export type KnobPartEntry =
  | { kind: 'body'; props: KnobBodyPartProps; order: number }
  | { kind: 'ring'; props: KnobRingPartProps; order: number }
  | { kind: 'ringSegment'; props: KnobRingSegmentPartProps; order: number }
  | { kind: 'progress'; props: KnobProgressPartProps; order: number }
  | { kind: 'tick'; props: KnobTickLayerPartProps; order: number }
  | { kind: 'pointer'; props: KnobPointerPartProps; order: number }
  | { kind: 'thumb'; props: KnobThumbPartProps; order: number }
  | { kind: 'valueLabel'; props: KnobValueLabelPartProps; order: number };

export type KnobPartComponent<P> = FC<P> & {
  __knobPartKind: KnobPartKind;
};
