import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { useChartTheme } from '../../theme/ChartThemeContext';
import { CHART_BRUSH_HEIGHT } from '../../ChartBase';
import type { ChartBrushProps, ChartBrushSeries } from './types';

// A range selector for cartesian charts: a miniature of the data, the unselected
// stretches dimmed, and a window with two handles. Every drag works in deltas of
// the pointer's page/client x from where it went down, so the same math serves web
// PointerEvents and the native responder system without measuring the strip.

type DragMode = 'start' | 'end' | 'window' | 'track';
type Range = [number, number];

const isWeb = Platform.OS === 'web';
const COARSE_MULTIPLIER = 10;
const PREVIEW_PAD = 3;
const HANDLE_HIT_SLOP = { top: 4, bottom: 4, left: 10, right: 10 };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const finiteOr = (value: number, fallback: number) => (Number.isNaN(value) ? fallback : value);
const sameRange = (a: Range, b: Range) => a[0] === b[0] && a[1] === b[1];
// aria-valuenow is read aloud; float noise from drag math is not.
const tidy = (value: number) => Math.round(value * 1e6) / 1e6;

/** Orders `range` and pulls it inside `domain` (±Infinity and NaN fall back to the domain ends). */
export const clampBrushRange = (range: Range, domain: Range): Range => {
  const [d0, d1] = domain;
  const a = finiteOr(range[0], d0);
  const b = finiteOr(range[1], d1);
  return [clamp(Math.min(a, b), d0, d1), clamp(Math.max(a, b), d0, d1)];
};

/** The smallest gap between distinct x values — the natural keyboard step for a series. */
export const inferBrushStep = (values: number[], domain: Range): number => {
  const span = domain[1] - domain[0];
  const sorted = Array.from(new Set(values.filter(Number.isFinite))).sort((a, b) => a - b);
  let gap = Infinity;
  for (let i = 1; i < sorted.length; i += 1) gap = Math.min(gap, sorted[i] - sorted[i - 1]);
  if (!Number.isFinite(gap) || gap <= 0) return span > 0 ? span / 100 : 1;
  return span > 0 ? Math.max(gap, span / 1000) : gap;
};

/**
 * The points a plot needs to draw `range`: those inside it plus one neighbor on
 * each side, so a line still runs to the plot edge. Assumes points sorted by x.
 */
export function sliceToBrushWindow<T>(points: T[], getX: (point: T) => number, range: Range): T[] {
  let first = -1;
  let last = -1;
  for (let i = 0; i < points.length; i += 1) {
    const x = getX(points[i]);
    if (x >= range[0] && x <= range[1]) {
      if (first < 0) first = i;
      last = i;
    }
  }
  if (first < 0) {
    // A window between two samples still shows the segment crossing it.
    for (let i = 1; i < points.length; i += 1) {
      if (getX(points[i - 1]) < range[0] && getX(points[i]) > range[1]) return [points[i - 1], points[i]];
    }
    return [];
  }
  return points.slice(Math.max(0, first - 1), Math.min(points.length, last + 2));
}

/** Series picked for the preview: `selection` matches ids or names; empty/undefined keeps all. */
export function pickBrushSeries<T extends { id?: string | number; name?: string }>(series: T[], selection?: string[]): T[] {
  if (!selection || selection.length === 0) return series;
  const wanted = new Set(selection.map(String));
  return series.filter((item) => (item.id != null && wanted.has(String(item.id))) || (item.name != null && wanted.has(item.name)));
}

/**
 * Controlled/uncontrolled range state for a chart's brush, in data units.
 * `start`/`end` seed the uncontrolled state; `value` (the chart's `brushRange`)
 * wins when given. The range is always clamped to `domain`, and a full-domain
 * selection is stored as "no selection" so streaming data keeps the whole view.
 */
export function useChartBrushRange(options: {
  domain: Range;
  value?: Range;
  start?: number;
  end?: number;
  onChange?: Array<((range: Range) => void) | undefined>;
}) {
  const { domain, value, start, end } = options;
  const [inner, setInner] = useState<Range | null>(() =>
    start != null || end != null ? [start ?? -Infinity, end ?? Infinity] : null,
  );
  const controlled = value !== undefined;
  const range = clampBrushRange(controlled ? value : inner ?? domain, domain);
  const state = useRef({ range, domain, controlled, onChange: options.onChange });
  state.current = { range, domain, controlled, onChange: options.onChange };

  const setRange = useCallback((next: Range) => {
    const current = state.current;
    const resolved = clampBrushRange(next, current.domain);
    if (sameRange(resolved, current.range)) return;
    current.range = resolved;
    if (!current.controlled) setInner(sameRange(resolved, current.domain) ? null : resolved);
    current.onChange?.forEach((listener) => listener?.(resolved));
  }, []);

  return { range, setRange, active: range[0] > domain[0] || range[1] < domain[1] };
}

const seriesExtent = (series: ChartBrushSeries[]): Range => {
  let lo = Infinity;
  let hi = -Infinity;
  series.forEach((item) => item.data.forEach((point) => {
    if (Number.isFinite(point.x)) {
      lo = Math.min(lo, point.x);
      hi = Math.max(hi, point.x);
    }
  }));
  return Number.isFinite(lo) ? [lo, hi] : [0, 1];
};

const valueExtent = (series: ChartBrushSeries[], includeZero: boolean): Range => {
  let lo = includeZero ? 0 : Infinity;
  let hi = includeZero ? 0 : -Infinity;
  series.forEach((item) => item.data.forEach((point) => {
    if (Number.isFinite(point.y)) {
      lo = Math.min(lo, point.y);
      hi = Math.max(hi, point.y);
    }
  }));
  if (!Number.isFinite(lo)) return [0, 1];
  return lo === hi ? [lo - 1, hi + 1] : [lo, hi];
};

/**
 * A brush (range selector): a strip with a miniature of the data, the unselected
 * stretches dimmed, and a draggable window between two handles. Drag a handle to
 * resize the window, drag the window to pan it, or press the strip to center the
 * window there. Each handle is a `role="slider"` — Arrow keys step, Shift+Arrow
 * and PageUp/PageDown step ten times further, Home/End jump to the ends.
 *
 * The cartesian charts render one under their x axis with `withBrush`; use this
 * component directly to place a brush elsewhere and drive a chart's `brushRange`.
 */
export const ChartBrush: React.FC<ChartBrushProps> = (props) => {
  const {
    series = [],
    previewType = 'area',
    normalizeSeries = false,
    band = false,
    w: width = 300,
    h: height = CHART_BRUSH_HEIGHT,
    travellerWidth = 8,
    fill,
    stroke,
    formatValue,
    startLabel = 'Range start',
    endLabel = 'Range end',
    disabled = false,
    testID,
    style,
    onChange,
    onChangeEnd,
  } = props;
  const theme = useChartTheme();

  const domain = useMemo<Range>(() => {
    const raw = props.domain ?? seriesExtent(series);
    return [Math.min(raw[0], raw[1]), Math.max(raw[0], raw[1])];
  }, [props.domain, series]);

  // Everything below works on a continuous internal axis. With `band`, index i owns
  // [i, i + 1), so the inclusive selection [s, e] is [s, e + 1) internally.
  const D0 = domain[0];
  const D1 = band ? domain[1] + 1 : domain[1];
  const span = D1 - D0 || 1;
  const snap = band || !!props.snap;
  const stepInternal = band ? Math.max(1, Math.round(props.step ?? 1)) : (props.step != null && props.step > 0 ? props.step : span / 100);
  const minSpanInternal = band ? Math.max(1, Math.round(props.minSpan ?? 0) + 1) : Math.min(props.minSpan ?? stepInternal, span);

  const snapValue = useCallback(
    (value: number) => (snap ? D0 + Math.round((value - D0) / stepInternal) * stepInternal : value),
    [snap, D0, stepInternal],
  );
  const toInternal = useCallback((range: Range): Range => (band ? [range[0], range[1] + 1] : range), [band]);
  const toExternal = useCallback(
    (range: Range): Range => (band ? [Math.round(range[0]), Math.round(range[1]) - 1] : [tidy(range[0]), tidy(range[1])]),
    [band],
  );
  const normalizeInternal = useCallback((range: Range): Range => {
    let start = clamp(snapValue(clamp(Math.min(range[0], range[1]), D0, D1)), D0, D1);
    let end = clamp(snapValue(clamp(Math.max(range[0], range[1]), D0, D1)), D0, D1);
    if (end - start < minSpanInternal) {
      end = Math.min(D1, start + minSpanInternal);
      start = Math.max(D0, end - minSpanInternal);
    }
    return [start, end];
  }, [snapValue, D0, D1, minSpanInternal]);

  const [innerValue, setInnerValue] = useState<Range | null>(() => props.defaultValue ?? null);
  const controlled = props.value !== undefined;
  const externalValue = (controlled ? props.value : innerValue) ?? domain;
  const internal = normalizeInternal(toInternal(clampBrushRange(externalValue, domain)));
  const value = toExternal(internal);

  // Read by gesture and key handlers between renders, so rapid input builds on the
  // latest committed range rather than a stale prop.
  const latest = useRef({ value, internal, onChange, onChangeEnd, controlled });
  latest.current = { value, internal, onChange, onChangeEnd, controlled };

  const commitInternal = useCallback((next: Range) => {
    const normalized = normalizeInternal(next);
    const external = toExternal(normalized);
    if (sameRange(external, latest.current.value)) return;
    latest.current.value = external;
    latest.current.internal = normalized;
    if (!latest.current.controlled) setInnerValue(external);
    latest.current.onChange?.(external);
  }, [normalizeInternal, toExternal]);

  const settle = useCallback(() => latest.current.onChangeEnd?.(latest.current.value), []);

  const moveEdge = useCallback((edge: 'start' | 'end', from: Range, target: number): Range => (
    edge === 'start'
      ? [clamp(snapValue(target), D0, from[1] - minSpanInternal), from[1]]
      : [from[0], clamp(snapValue(target), from[0] + minSpanInternal, D1)]
  ), [snapValue, D0, D1, minSpanInternal]);

  const shiftWindow = useCallback((from: Range, nextStart: number): Range => {
    const size = from[1] - from[0];
    const start = clamp(snapValue(nextStart), D0, D1 - size);
    return [start, start + size];
  }, [snapValue, D0, D1]);

  // Geometry: the track is inset by half a handle on each side so a handle parked
  // at either end is still fully visible and grabbable.
  const inset = travellerWidth / 2;
  const trackWidth = Math.max(width - travellerWidth, 1);
  const toPx = useCallback((v: number) => inset + ((v - D0) / span) * trackWidth, [inset, D0, span, trackWidth]);
  const startPx = toPx(internal[0]);
  const endPx = toPx(internal[1]);

  // ── Dragging ──────────────────────────────────────────────────────────────
  const rootRef = useRef<View | null>(null);
  const dragRef = useRef<{ mode: Exclude<DragMode, 'track'>; originX: number; from: Range } | null>(null);
  const geometry = useRef({ trackWidth, span, inset, D0 });
  geometry.current = { trackWidth, span, inset, D0 };

  const begin = useCallback((mode: DragMode, originX: number, localX: number) => {
    let from = latest.current.internal;
    let dragMode: Exclude<DragMode, 'track'> = mode === 'track' ? 'window' : mode;
    if (mode === 'track') {
      // Pressing the strip centers the window there; the drag then pans it.
      const g = geometry.current;
      const pressed = g.D0 + ((localX - g.inset) / g.trackWidth) * g.span;
      from = shiftWindow(from, pressed - (from[1] - from[0]) / 2);
      commitInternal(from);
      from = latest.current.internal;
      dragMode = 'window';
    }
    dragRef.current = { mode: dragMode, originX, from };
  }, [shiftWindow, commitInternal]);

  const move = useCallback((clientX: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const g = geometry.current;
    const delta = ((clientX - drag.originX) / g.trackWidth) * g.span;
    const { from } = drag;
    if (drag.mode === 'window') commitInternal(shiftWindow(from, from[0] + delta));
    else commitInternal(moveEdge(drag.mode, from, (drag.mode === 'start' ? from[0] : from[1]) + delta));
  }, [commitInternal, shiftWindow, moveEdge]);

  const end = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    settle();
  }, [settle]);

  const dragHandlers = useCallback((mode: DragMode): Record<string, any> => {
    if (disabled) return {};
    if (isWeb) {
      return {
        onPointerDown: (event: any) => {
          event.stopPropagation?.();
          try { event.currentTarget?.setPointerCapture?.(event.pointerId); } catch { /* not capturable */ }
          let localX = 0;
          if (mode === 'track') {
            const rect = (rootRef.current as any)?.getBoundingClientRect?.();
            localX = rect ? event.clientX - rect.left : 0;
          }
          begin(mode, event.clientX ?? 0, localX);
        },
        onPointerMove: (event: any) => {
          if (!dragRef.current) return;
          event.stopPropagation?.();
          move(event.clientX ?? 0);
        },
        onPointerUp: (event: any) => {
          try { event.currentTarget?.releasePointerCapture?.(event.pointerId); } catch { /* not captured */ }
          end();
        },
        onPointerCancel: end,
      };
    }
    // Native responder: page x deltas stay valid when the finger leaves the strip,
    // and refusing termination keeps a parent ScrollView from stealing the drag.
    return {
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
      onResponderTerminationRequest: () => false,
      onResponderGrant: (event: any) => {
        const native = event?.nativeEvent ?? {};
        begin(mode, native.pageX ?? 0, native.locationX ?? 0);
        // Returning true blocks the native responder (Android scroll interception).
        return true;
      },
      onResponderMove: (event: any) => move(event?.nativeEvent?.pageX ?? 0),
      onResponderRelease: end,
      onResponderTerminate: end,
    };
  }, [disabled, begin, move, end]);

  // ── Keyboard / assistive tech ─────────────────────────────────────────────
  const nudge = useCallback((edge: 'start' | 'end', target: (range: Range) => number) => {
    const from = latest.current.internal;
    commitInternal(moveEdge(edge, from, target(from)));
    settle();
  }, [commitInternal, moveEdge, settle]);

  const keyHandler = useCallback((edge: 'start' | 'end') => (event: any) => {
    if (disabled) return;
    const key = event?.key ?? event?.nativeEvent?.key;
    const shift = !!(event?.shiftKey ?? event?.nativeEvent?.shiftKey);
    const amount = stepInternal * (shift ? COARSE_MULTIPLIER : 1);
    const page = stepInternal * COARSE_MULTIPLIER;
    const current = (range: Range) => (edge === 'start' ? range[0] : range[1]);
    let target: ((range: Range) => number) | null = null;
    switch (key) {
      case 'ArrowRight':
      case 'ArrowUp':
        target = (range) => current(range) + amount;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        target = (range) => current(range) - amount;
        break;
      case 'PageUp':
        target = (range) => current(range) + page;
        break;
      case 'PageDown':
        target = (range) => current(range) - page;
        break;
      case 'Home':
        target = (range) => (edge === 'start' ? D0 : range[0] + minSpanInternal);
        break;
      case 'End':
        target = (range) => (edge === 'start' ? range[1] - minSpanInternal : D1);
        break;
      default:
        return;
    }
    // Otherwise arrows scroll the page and Home/End jump it.
    event.preventDefault?.();
    event.stopPropagation?.();
    nudge(edge, target);
  }, [disabled, stepInternal, D0, D1, minSpanInternal, nudge]);

  const accessibilityAction = useCallback((edge: 'start' | 'end') => (event: any) => {
    const name = event?.nativeEvent?.actionName;
    const sign = name === 'increment' ? 1 : name === 'decrement' ? -1 : 0;
    if (!sign || disabled) return;
    nudge(edge, (range) => (edge === 'start' ? range[0] : range[1]) + sign * stepInternal);
  }, [disabled, nudge, stepInternal]);

  const minSpanExternal = band ? minSpanInternal - 1 : minSpanInternal;
  const valueText = (v: number) => (formatValue ? formatValue(v) : String(tidy(v)));
  const handleA11y = (edge: 'start' | 'end') => {
    const now = edge === 'start' ? value[0] : value[1];
    const min = edge === 'start' ? domain[0] : tidy(value[0] + minSpanExternal);
    const max = edge === 'start' ? tidy(value[1] - minSpanExternal) : domain[1];
    const a11y: Record<string, any> = {
      role: 'slider',
      'aria-label': edge === 'start' ? startLabel : endLabel,
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-valuenow': now,
      'aria-valuetext': valueText(now),
    };
    if (disabled) a11y['aria-disabled'] = true;
    if (isWeb) {
      a11y.tabIndex = disabled ? -1 : 0;
      a11y.onKeyDown = keyHandler(edge);
    } else {
      a11y.accessible = true;
      a11y.accessibilityActions = [{ name: 'increment' }, { name: 'decrement' }];
      a11y.onAccessibilityAction = accessibilityAction(edge);
    }
    return a11y;
  };

  // ── Preview ───────────────────────────────────────────────────────────────
  const palette = theme.colors.accentPalette;
  const preview = useMemo(() => {
    const drawable = series.filter((item) => item.data.length > 0);
    const typeOf = (item: ChartBrushSeries) => item.type ?? previewType;
    const barSeries = drawable.filter((item) => typeOf(item) === 'bar');
    const shared = valueExtent(drawable, barSeries.length > 0 || drawable.some((item) => typeOf(item) === 'area'));
    const innerHeight = Math.max(height - PREVIEW_PAD * 2, 1);
    const xOf = (x: number) => toPx(band ? x + 0.5 : x);
    const distinctX = new Set(barSeries.flatMap((item) => item.data.map((point) => point.x))).size;
    const bandPx = band ? trackWidth / span : trackWidth / Math.max(distinctX, 1);
    const barWidth = Math.max((bandPx * 0.8) / Math.max(barSeries.length, 1), 0.5);

    return drawable.map((item, index) => {
      const color = item.color ?? palette[index % palette.length];
      const type = typeOf(item);
      const [lo, hi] = normalizeSeries ? valueExtent([item], type !== 'line') : shared;
      const yOf = (y: number) => PREVIEW_PAD + (1 - (y - lo) / (hi - lo || 1)) * innerHeight;
      const baseline = yOf(clamp(0, lo, hi));
      const key = String(item.id ?? item.name ?? index);
      if (type === 'bar') {
        const slot = barSeries.indexOf(item);
        const d = item.data.map((point) => {
          const x = xOf(point.x) - (barWidth * barSeries.length) / 2 + slot * barWidth;
          const y = yOf(point.y);
          return `M ${x} ${Math.min(y, baseline)} h ${barWidth} V ${Math.max(y, baseline)} h ${-barWidth} Z`;
        }).join(' ');
        return <Path key={key} d={d} fill={color} fillOpacity={0.55} />;
      }
      const line = item.data.map((point, i) => `${i === 0 ? 'M' : 'L'} ${xOf(point.x)} ${yOf(point.y)}`).join(' ');
      if (type === 'area' && item.data.length > 1) {
        const first = xOf(item.data[0].x);
        const last = xOf(item.data[item.data.length - 1].x);
        return (
          <G key={key}>
            <Path d={`${line} L ${last} ${baseline} L ${first} ${baseline} Z`} fill={color} fillOpacity={0.22} />
            <Path d={line} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.8} />
          </G>
        );
      }
      return <Path key={key} d={line} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.85} />;
    });
  }, [series, previewType, normalizeSeries, height, toPx, band, trackWidth, span, palette]);

  const outline = stroke ?? theme.colors.textSecondary;
  const windowFill = fill ?? palette[0];
  const webSurface = isWeb ? ({ touchAction: 'none', userSelect: 'none', cursor: disabled ? 'default' : 'pointer' } as any) : null;
  const handleWidth = travellerWidth;

  const grip = { width: 1, height: Math.min(12, height / 3), backgroundColor: theme.colors.background, marginHorizontal: 0.5, pointerEvents: 'none' as const };

  const renderHandle = (edge: 'start' | 'end') => {
    const center = edge === 'start' ? startPx : endPx;
    return (
      <View
        key={edge}
        testID={testID ? `${testID}-${edge}` : undefined}
        {...handleA11y(edge)}
        {...dragHandlers(edge)}
        hitSlop={isWeb ? undefined : HANDLE_HIT_SLOP}
        style={[
          {
            position: 'absolute',
            left: center - handleWidth / 2,
            top: 0,
            width: handleWidth,
            height,
            borderRadius: Math.min(3, handleWidth / 2),
            backgroundColor: outline,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            opacity: disabled ? 0.5 : 1,
          },
          isWeb ? ({ cursor: disabled ? 'default' : 'ew-resize' } as any) : null,
        ]}
      >
        {/* Grip */}
        <View style={grip} />
        <View style={grip} />
      </View>
    );
  };

  return (
    <View
      ref={rootRef}
      testID={testID}
      collapsable={false}
      style={[{ width, height, position: 'relative' }, webSurface, style]}
      {...dragHandlers('track')}
    >
      <Svg width={width} height={height} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
        <Rect x={inset} y={0.5} width={trackWidth} height={Math.max(height - 1, 0)} fill="none" stroke={theme.colors.grid} strokeWidth={1} rx={2} />
        <G>{preview}</G>
        {/* Unselected stretches are dimmed so the window reads as the focus. */}
        <Rect x={inset} y={0} width={Math.max(startPx - inset, 0)} height={height} fill={theme.colors.background} fillOpacity={0.65} />
        <Rect x={endPx} y={0} width={Math.max(inset + trackWidth - endPx, 0)} height={height} fill={theme.colors.background} fillOpacity={0.65} />
        <Rect
          x={startPx}
          y={0.5}
          width={Math.max(endPx - startPx, 0)}
          height={Math.max(height - 1, 0)}
          fill={windowFill}
          fillOpacity={fill ? 1 : 0.12}
          stroke={outline}
          strokeWidth={1}
        />
      </Svg>
      <View
        testID={testID ? `${testID}-window` : undefined}
        {...dragHandlers('window')}
        style={[
          { position: 'absolute', left: startPx, top: 0, width: Math.max(endPx - startPx, 0), height },
          isWeb ? ({ cursor: disabled ? 'default' : 'grab' } as any) : null,
        ]}
      />
      {renderHandle('start')}
      {renderHandle('end')}
    </View>
  );
};

ChartBrush.displayName = 'ChartBrush';
