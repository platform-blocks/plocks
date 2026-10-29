import { literalBackgrounds, literalText } from '../../core/theme/cssVariableTheme';
import type { PlocksTheme } from '../../core/theme/types';
import type {
  KnobAppearance,
  KnobVariant,
  KnobRingSegment,
  KnobRingShadow,
  KnobPointerStyle,
  KnobBodyStyle,
  KnobBodyDisc,
  KnobBodyGrip,
  KnobGradient,
  KnobShading,
  KnobShadow,
  KnobTickLayer,
  KnobThumbShape,
  KnobThumbStyle,
  KnobBehavior,
  KnobPanningConfig,
} from './types';
import { buildKnobVariantAppearance, mergeKnobAppearance } from './variants';

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getDefaultRingThickness = (size: number) => {
  const derived = Math.round(size * 0.04);
  return clampNumber(derived, 3, 14);
};

const getDefaultThumbSize = (size: number) => Math.max(12, Math.round(size * 0.18));

/** How much the thumb grows while the knob is being scrubbed. */
const DEFAULT_THUMB_ACTIVE_SCALE = 1.25;

export type ResolvedRingStyle = {
  visible: boolean;
  thickness: number;
  color: string;
  trailColor: string;
  backgroundColor: string;
  cap: 'butt' | 'round';
  radiusOffset: number;
  shadow?: KnobRingShadow;
  segments: KnobRingSegment[];
  segmentMode: 'track' | 'progress';
};

export type ResolvedBodyDisc = {
  ratio: number;
  color: string;
  shading: KnobShading;
  gradient?: KnobGradient;
  borderWidth: number;
  borderColor: string;
};

export type ResolvedBodyStyle = {
  shape: NonNullable<KnobBodyStyle['shape']>;
  sides: number;
  fluteDepth: number;
  color: string;
  shading: KnobShading;
  gradient?: KnobGradient;
  borderWidth: number;
  borderColor: string;
  radiusOffset: number;
  rotates: boolean;
  grip: Required<Omit<KnobBodyGrip, 'color'>> & { color: string } | null;
  cap: ResolvedBodyDisc | null;
  skirt: ResolvedBodyDisc | null;
  shadows: KnobShadow[];
};

const GRIP_DEFAULT_COUNT: Record<NonNullable<KnobBodyGrip['style']>, number> = {
  knurl: 60,
  ridge: 24,
  dots: 16,
};

const resolveDisc = (
  disc: KnobBodyDisc | false | undefined,
  fallbackRatio: number,
  fallbackColor: string
): ResolvedBodyDisc | null =>
  !disc
    ? null
    : {
        ratio: disc.ratio ?? fallbackRatio,
        color: disc.color ?? fallbackColor,
        shading: disc.shading ?? 'flat',
        gradient: disc.gradient,
        borderWidth: disc.borderWidth ?? 0,
        borderColor: disc.borderColor ?? 'transparent',
      };

export type ResolvedThumbStyle = {
  size: number;
  activeScale: number;
  color: string;
  shape: KnobThumbShape;
  strokeWidth: number;
  strokeColor: string;
  offset: number;
  glow?: KnobThumbStyle['glow'];
  style?: KnobThumbStyle['style'];
  renderThumb?: KnobThumbStyle['renderThumb'];
};

export type ResolvedProgressStyle = {
  mode: 'none' | 'contiguous' | 'split';
  color: string;
  trailColor: string;
  roundedCaps: boolean;
  thickness: number;
};

export type ResolvedKnobAppearance = {
  ring: ResolvedRingStyle;
  body: ResolvedBodyStyle | null;
  thumb: ResolvedThumbStyle | null;
  progress: ResolvedProgressStyle | null;
  pointer: (KnobPointerStyle & { visible: boolean }) | null;
  ticks: KnobTickLayer[];
  panning: KnobPanningConfig | null;
};

export interface ResolveAppearanceOptions {
  appearance?: KnobAppearance;
  /** Visual preset merged *under* `appearance`. */
  variant?: KnobVariant;
  theme: PlocksTheme;
  behavior: KnobBehavior;
  disabled: boolean;
  size: number;
  thumbSize?: number;
  accentColor?: string;
  hasMarks?: boolean;
}

const pickAccentColor = (
  theme: PlocksTheme,
  behavior: KnobBehavior,
  accentColor?: string
) => {
  if (accentColor) return accentColor;
  switch (behavior) {
    case 'status':
      return theme.colors.primary[5];
    case 'dual':
      return theme.colors.teal ? theme.colors.teal[5] : theme.colors.primary[5];
    default:
      return theme.colors.primary[5];
  }
};

export const resolveKnobAppearance = ({
  appearance: appearanceProp,
  variant,
  theme,
  behavior,
  disabled,
  size,
  thumbSize,
  accentColor,
  hasMarks,
}: ResolveAppearanceOptions): ResolvedKnobAppearance => {
  const derivedThumbSize = thumbSize ?? getDefaultThumbSize(size);
  const ringThicknessBase = getDefaultRingThickness(size);
  const highlightColor = pickAccentColor(theme, behavior, accentColor);

  // The variant only supplies defaults, so it goes underneath everything the caller passed.
  const appearance = mergeKnobAppearance(
    buildKnobVariantAppearance(variant, { theme, size, accentColor: highlightColor, disabled, hasMarks }),
    appearanceProp
  );

  // `ring: false` hides the track but keeps its geometry: ticks, thumb and arm still place
  // themselves off the ring radius.
  const ringInput = appearance?.ring === false ? undefined : appearance?.ring;
  const resolvedRingThickness = ringInput?.thickness ?? ringThicknessBase;
  // Drawn as SVG strokes, so the literal colors (on web the tokens are `var()` references).
  const text = literalText(theme);
  const lines = literalBackgrounds(theme);
  const ringColorFallback = disabled ? text.muted : text.disabled;

  const ring: ResolvedRingStyle = {
    visible: appearance?.ring !== false && ringInput?.visible !== false,
    thickness: resolvedRingThickness,
    color: ringInput?.color ?? ringColorFallback,
    trailColor: ringInput?.trailColor ?? lines.borderStrong ?? lines.border,
    backgroundColor: ringInput?.backgroundColor ?? theme.backgrounds.surface,
    cap: ringInput?.cap ?? 'round',
    radiusOffset: ringInput?.radiusOffset ?? 0,
    shadow: ringInput?.shadow,
    segments: (ringInput?.segments ?? []).filter(
      (segment): segment is KnobRingSegment =>
        !!segment && Number.isFinite(segment.value) && segment.value > 0
    ),
    segmentMode: ringInput?.segmentMode === 'progress' ? 'progress' : 'track',
  };

  const bodyInput = appearance?.body;
  let body: ResolvedBodyStyle | null = null;
  if (bodyInput !== false) {
    const shape = bodyInput?.shape ?? 'circle';
    const bodyColor = bodyInput?.color ?? theme.backgrounds.surface;
    const gripInput = bodyInput?.grip;
    const gripStyle = (gripInput && gripInput.style) || 'knurl';
    const grip = gripInput
      ? {
          style: gripStyle,
          count: gripInput.count ?? GRIP_DEFAULT_COUNT[gripStyle],
          depth: gripInput.depth ?? 0.12,
          width: gripInput.width ?? (gripStyle === 'ridge' ? Math.max(2, size * 0.012) : 1),
          color: gripInput.color ?? '#000000',
          opacity: gripInput.opacity ?? 0.35,
        }
      : null;
    const shadowInput = bodyInput?.shadow;
    body = {
      shape,
      sides: Math.max(3, Math.round(bodyInput?.sides ?? 8)),
      fluteDepth: bodyInput?.fluteDepth ?? 0.08,
      color: bodyColor,
      shading: bodyInput?.shading ?? 'flat',
      gradient: bodyInput?.gradient,
      borderWidth: bodyInput?.borderWidth ?? 0,
      borderColor: bodyInput?.borderColor ?? 'transparent',
      radiusOffset:
        bodyInput?.radiusOffset ?? -Math.max(4, Math.round(ring.thickness * 0.6)),
      // A plain disc looks the same at every angle, so turning it would only cost renders.
      rotates: bodyInput?.rotates ?? (shape !== 'circle' || !!grip),
      grip,
      cap: resolveDisc(bodyInput?.cap, 0.55, bodyColor),
      skirt: resolveDisc(bodyInput?.skirt, 1.25, bodyColor),
      shadows: !shadowInput ? [] : Array.isArray(shadowInput) ? shadowInput : [shadowInput],
    };
  }

  const thumb: ResolvedThumbStyle | null = appearance?.thumb === false
    ? null
    : {
        size: appearance?.thumb?.size ?? derivedThumbSize,
        activeScale: Number.isFinite(appearance?.thumb?.activeScale as number)
          ? Math.max(0, appearance!.thumb!.activeScale as number)
          : DEFAULT_THUMB_ACTIVE_SCALE,
        color: appearance?.thumb?.color ?? (disabled ? text.muted : highlightColor),
        shape: appearance?.thumb?.shape ?? 'circle',
        strokeWidth: appearance?.thumb?.strokeWidth ?? 0,
        strokeColor: appearance?.thumb?.strokeColor ?? 'transparent',
        offset: appearance?.thumb?.offset ?? 0,
        glow: appearance?.thumb?.glow,
        style: appearance?.thumb?.style,
        renderThumb: appearance?.thumb?.renderThumb,
      };

  const progress: ResolvedProgressStyle | null = appearance?.progress === false
    ? null
    : {
        mode: appearance?.progress?.mode ?? 'none',
        color: appearance?.progress?.color ?? highlightColor,
        trailColor:
          appearance?.progress?.trailColor ?? ring.trailColor,
        roundedCaps: appearance?.progress?.roundedCaps ?? true,
        thickness: appearance?.progress?.thickness ?? ring.thickness,
      };

  // The arm is opt-in: the stock dial has none, and the variants that want one ask for it.
  // Anything falsy — omitted, `null`, or `false` — leaves it off.
  const pointerInput = appearance?.pointer;
  const pointer: (KnobPointerStyle & { visible: boolean }) | null = !pointerInput
    ? null
    : {
        ...pointerInput,
        visible: pointerInput.visible ?? true,
        color: pointerInput.color ?? (disabled ? text.muted : highlightColor),
      };

  const ticksInput = appearance?.ticks;
  let ticks: KnobTickLayer[] = [];
  if (Array.isArray(ticksInput)) {
    ticks = ticksInput;
  } else if (ticksInput && typeof ticksInput !== 'boolean') {
    ticks = [ticksInput];
  }

  return {
    ring,
    body,
    thumb,
    progress,
    pointer,
    ticks,
    panning: appearance?.panning ?? null,
  };
};
