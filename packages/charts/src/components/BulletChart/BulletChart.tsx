import React from 'react';
import { Text as RNText, View } from 'react-native';
import Svg, { G, Line as SvgLine, Rect as SvgRect, Text as SvgText } from 'react-native-svg';

import { ChartContainer, ChartTitle, estimateChartTextWidth, measureChartTitleBand } from '../../ChartBase';
import { CellGridHitTester } from '../../core/hittest/grid';
import type { HitSeries, Mark } from '../../core/hittest/types';
import { useActiveTarget, useChartInteractionContext } from '../../interaction/ChartInteractionContext';
import { useChartPointer } from '../../interaction/useChartPointer';
import { useChartTheme, useNumberFormatter } from '../../theme/ChartThemeContext';
import type { ChartInteractionEvent } from '../../types';
import { clamp, createTickFormatter, niceTickStep } from '../../utils';
import { generateNiceTicks } from '../../utils/scales';
import { interpolateColor } from '../../utils/colorScale';
import { AnimatedBulletBar } from './AnimatedBulletBar';
import type { BulletChartDatum, BulletChartItem, BulletChartProps } from './types';

const PAD = 8;
const LABEL_SIZE = 13;
const DESCRIPTION_SIZE = 11;
const TICK_SIZE = 11;
const TICK_LENGTH = 4;
const DEFAULT_BAND = 32;
const ROW_GAP = 14;
const VERTICAL_HEIGHT = 260;
const MAX_COLUMN_SLOT = 96;
const TARGET_WIDTH = 3;
const TARGET_HIT_SLOP = 6;

interface ResolvedRange {
  index: number;
  from: number;
  to: number;
  color: string;
  label?: string;
}

interface ResolvedRow {
  index: number;
  item: BulletChartItem;
  target?: number;
  ranges: ResolvedRange[];
  color: string;
  targetColor: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export const BulletChart: React.FC<BulletChartProps> = (props) => {
  const {
    value,
    target: targetProp,
    ranges: rangesProp,
    label,
    description,
    data,
    min: minProp,
    max: maxProp,
    orientation = 'horizontal',
    valueFormatter,
    color: colorProp,
    targetColor: targetColorProp,
    barThickness = 0.33,
    withAxis = true,
    ticks: tickCount = 5,
    w: width = 400,
    h: height = 0,
    title,
    subtitle,
    tooltip,
    disableAnimation = false,
    animationDuration = 600,
    accessibilityLabel,
    style,
    onPress,
    onDataPointPress,
    ...rest
  } = props;

  const theme = useChartTheme();
  const themeFormat = useNumberFormatter();
  const formatValue = valueFormatter ?? themeFormat;
  const horizontal = orientation !== 'vertical';

  const items = React.useMemo<BulletChartItem[]>(
    () => data ?? [{ label, description, value: isFiniteNumber(value) ? value : 0, target: targetProp, ranges: rangesProp }],
    [data, label, description, value, targetProp, rangesProp]
  );

  // --- Scale -------------------------------------------------------------------
  const min = isFiniteNumber(minProp) ? minProp : 0;
  const max = React.useMemo(() => {
    if (isFiniteNumber(maxProp) && maxProp > min) return maxProp;
    let raw = min;
    items.forEach((item) => {
      const target = item.target ?? targetProp;
      const ranges = item.ranges ?? rangesProp ?? [];
      [item.value, target, ...ranges.map((r) => r.value)].forEach((v) => {
        if (isFiniteNumber(v)) raw = Math.max(raw, v);
      });
    });
    if (raw <= min) return min + 1;
    const step = niceTickStep(raw - min, tickCount);
    return step > 0 ? min + Math.ceil((raw - min) / step - 1e-9) * step : raw;
  }, [maxProp, min, items, targetProp, rangesProp, tickCount]);

  const rows = React.useMemo<ResolvedRow[]>(() => {
    const textPrimary = theme.colors.textPrimary;
    const background = theme.colors.background;
    return items.map((item, index) => {
      const sorted = (item.ranges ?? rangesProp ?? []).filter((r) => isFiniteNumber(r.value)).slice().sort((a, b) => a.value - b.value);
      const n = sorted.length;
      let from = min;
      const ranges = sorted.map((r, i) => {
        // Few's convention: the lowest (worst) band is darkest, lightening toward the top of the scale.
        const shade = n === 1 ? 0.14 : 0.28 - (0.2 * i) / (n - 1);
        const resolved: ResolvedRange = {
          index: i,
          from,
          to: r.value,
          color: r.color ?? interpolateColor(background, textPrimary, shade),
          label: r.label,
        };
        from = r.value;
        return resolved;
      });
      const target = item.target ?? targetProp;
      return {
        index,
        item,
        target: isFiniteNumber(target) ? target : undefined,
        ranges,
        color: item.color ?? colorProp ?? theme.colors.accentPalette[0],
        targetColor: item.targetColor ?? targetColorProp ?? textPrimary,
      };
    });
  }, [items, rangesProp, targetProp, min, colorProp, targetColorProp, theme.colors]);

  const tickValues = React.useMemo(() => (withAxis ? generateNiceTicks(min, max, tickCount) : []), [withAxis, min, max, tickCount]);
  const formatTick = React.useMemo(
    () => valueFormatter ?? createTickFormatter(tickValues, theme.numberFormat),
    [valueFormatter, tickValues, theme.numberFormat]
  );
  const tickLabels = React.useMemo(() => tickValues.map((t) => formatTick(t)), [tickValues, formatTick]);

  // --- Layout ------------------------------------------------------------------
  const n = rows.length;
  const hasLabel = rows.some((r) => r.item.label);
  const hasDescription = rows.some((r) => r.item.description);
  const hasLabels = hasLabel || hasDescription;
  const titleBand = measureChartTitleBand(title, subtitle, { containerWidth: width });
  const top = Math.max(PAD, titleBand);

  let plotLeft: number;
  let plotTop: number;
  let plotWidth: number;
  let plotHeight: number;
  let band: number;
  let boxHeight: number;
  let labelBand = 0;
  let slot = 0;

  if (horizontal) {
    if (hasLabels) {
      const widest = rows.reduce(
        (acc, r) =>
          Math.max(
            acc,
            r.item.label ? estimateChartTextWidth(r.item.label, LABEL_SIZE) * 1.08 : 0,
            r.item.description ? estimateChartTextWidth(r.item.description, DESCRIPTION_SIZE) : 0
          ),
        0
      );
      labelBand = Math.min(Math.ceil(widest) + 12, width * 0.4);
    }
    const firstTick = tickLabels.length ? estimateChartTextWidth(tickLabels[0], TICK_SIZE) : 0;
    const lastTick = tickLabels.length ? estimateChartTextWidth(tickLabels[tickLabels.length - 1], TICK_SIZE) : 0;
    plotLeft = hasLabels ? PAD + labelBand : Math.max(PAD, firstTick / 2 + 2);
    const plotRight = width - Math.max(PAD, lastTick / 2 + 2);
    plotWidth = Math.max(0, plotRight - plotLeft);
    const axisBand = withAxis ? TICK_LENGTH + 3 + TICK_SIZE + 2 : 0;
    band = height > 0 ? Math.max(4, (height - top - PAD - axisBand - ROW_GAP * Math.max(n - 1, 0)) / Math.max(n, 1)) : DEFAULT_BAND;
    plotTop = top;
    plotHeight = n * band + ROW_GAP * Math.max(n - 1, 0);
    boxHeight = height > 0 ? height : plotTop + plotHeight + axisBand + PAD;
  } else {
    const labelBlock = hasLabels ? (hasLabel ? Math.round(LABEL_SIZE * 1.35) : 0) + (hasDescription ? Math.round(DESCRIPTION_SIZE * 1.35) : 0) + 6 : 0;
    labelBand = labelBlock;
    boxHeight = height > 0 ? height : VERTICAL_HEIGHT;
    const tickHalf = withAxis ? TICK_SIZE / 2 : 0;
    plotTop = top + labelBlock + tickHalf;
    plotHeight = Math.max(0, boxHeight - PAD - tickHalf - plotTop);
    const widestTick = tickLabels.reduce((acc, t) => Math.max(acc, estimateChartTextWidth(t, TICK_SIZE)), 0);
    const axisWidth = withAxis ? Math.ceil(widestTick) + TICK_LENGTH + 4 : 0;
    const available = Math.max(0, width - 2 * PAD - axisWidth);
    slot = n > 0 ? Math.min(available / n, MAX_COLUMN_SLOT) : 0;
    band = Math.max(4, Math.min(slot * 0.6, DEFAULT_BAND + 8));
    plotWidth = n * slot;
    // Keep the axis beside the columns and centre the group in the box.
    plotLeft = PAD + Math.max(0, (available - plotWidth) / 2) + axisWidth;
  }

  const span = max - min;
  const position = React.useCallback(
    (v: number) => {
      const t = span > 0 ? (clamp(v, min, max) - min) / span : 0;
      return horizontal ? plotLeft + t * plotWidth : plotTop + plotHeight - t * plotHeight;
    },
    [span, min, max, horizontal, plotLeft, plotWidth, plotTop, plotHeight]
  );

  /** Rect covering data values `a`..`b` along the value axis and `crossStart`..+`crossSize` across it. */
  const rectBetween = React.useCallback(
    (a: number, b: number, crossStart: number, crossSize: number): Rect => {
      const pa = position(a);
      const pb = position(b);
      const lo = Math.min(pa, pb);
      const length = Math.abs(pb - pa);
      return horizontal
        ? { x: lo, y: crossStart, width: length, height: crossSize }
        : { x: crossStart, y: lo, width: crossSize, height: length };
    },
    [position, horizontal]
  );

  const crossStartFor = React.useCallback(
    (index: number) => (horizontal ? plotTop + index * (band + ROW_GAP) : plotLeft + index * slot + (slot - band) / 2),
    [horizontal, plotTop, band, plotLeft, slot]
  );

  const thickness = clamp(barThickness, 0.05, 1);
  const baseline = clamp(0, min, max);

  const geometry = React.useMemo(
    () =>
      rows.map((row) => {
        const cross = crossStartFor(row.index);
        const track = rectBetween(min, max, cross, band);
        const ranges = row.ranges.map((r) => ({ range: r, rect: rectBetween(r.from, r.to, cross, band) }));
        const barSize = band * thickness;
        const bar = rectBetween(baseline, row.item.value, cross + (band - barSize) / 2, barSize);
        let targetRect: Rect | null = null;
        if (row.target != null) {
          const at = position(row.target);
          const markerSize = band * 0.7;
          const markerCross = cross + (band - markerSize) / 2;
          targetRect = horizontal
            ? { x: at - TARGET_WIDTH / 2, y: markerCross, width: TARGET_WIDTH, height: markerSize }
            : { x: markerCross, y: at - TARGET_WIDTH / 2, width: markerSize, height: TARGET_WIDTH };
        }
        return { row, track, ranges, bar, target: targetRect };
      }),
    [rows, crossStartFor, rectBetween, min, max, band, thickness, baseline, position, horizontal]
  );

  // --- Interaction ---------------------------------------------------------------
  let interaction: ReturnType<typeof useChartInteractionContext> | null = null;
  try {
    interaction = useChartInteractionContext();
  } catch {
    interaction = null;
  }
  const register = interaction?.register;
  const tooltipFormatter = tooltip?.formatter;
  const tooltipShown = tooltip?.show !== false;

  const hitSeries = React.useMemo<HitSeries[]>(() => {
    const marks: Mark[] = [];
    const push = (id: string, datum: BulletChartDatum, rect: Rect, anchor: { x: number; y: number }, formatted: string) => {
      const custom = tooltipFormatter?.(datum);
      marks.push({
        id,
        pixel: anchor,
        value: datum.value,
        datum,
        label: datum.label,
        color: datum.color,
        extent: { rect },
        formattedValue: typeof custom === 'string' ? custom : formatted,
        ...(custom != null && typeof custom !== 'string' ? { customTooltip: custom } : {}),
      });
    };
    // The tester takes the first rect containing the pointer, so the marker and
    // bar are listed ahead of the bands they sit on.
    geometry.forEach(({ row, ranges, bar, target }) => {
      const name = row.item.label;
      const prefix = name ? `${name} · ` : '';
      if (target && row.target != null) {
        const slop = horizontal
          ? { x: target.x - TARGET_HIT_SLOP, y: target.y, width: target.width + TARGET_HIT_SLOP * 2, height: target.height }
          : { x: target.x, y: target.y - TARGET_HIT_SLOP, width: target.width, height: target.height + TARGET_HIT_SLOP * 2 };
        push(
          `${row.index}-target`,
          { kind: 'target', index: row.index, label: `${prefix}Target`, value: row.target, color: row.targetColor, item: row.item },
          slop,
          { x: target.x + target.width / 2, y: target.y + target.height / 2 },
          formatValue(row.target)
        );
      }
      push(
        `${row.index}-value`,
        { kind: 'value', index: row.index, label: name ?? 'Value', value: row.item.value, color: row.color, item: row.item },
        bar,
        horizontal ? { x: bar.x + bar.width, y: bar.y + bar.height / 2 } : { x: bar.x + bar.width / 2, y: bar.y },
        formatValue(row.item.value)
      );
      ranges.forEach(({ range, rect }) => {
        push(
          `${row.index}-range-${range.index}`,
          {
            kind: 'range',
            index: row.index,
            label: `${prefix}${range.label ?? `Range ${range.index + 1}`}`,
            value: range.to,
            from: range.from,
            color: range.color,
            item: row.item,
          },
          rect,
          { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
          `${formatValue(range.from)} – ${formatValue(range.to)}`
        );
      });
    });
    return [{ id: 'bullet', name: title || 'Bullet', visible: true, marks }];
  }, [geometry, horizontal, tooltipFormatter, formatValue, title]);

  const tester = React.useMemo(() => new CellGridHitTester(hitSeries), [hitSeries]);

  React.useEffect(() => {
    if (!register) return;
    register('bullet', { frame: { kind: 'cartesian' } as any, geometry: { kind: 'cell' }, series: hitSeries });
    return () => register('bullet', null);
  }, [register, hitSeries]);

  const interactive = Boolean(interaction) && tooltipShown && hitSeries[0].marks.length > 0;
  const { handlers: pointerHandlers, ref: surfaceRef, onLayout: surfaceOnLayout } = useChartPointer({
    padding: { top: plotTop, left: plotLeft, right: 0, bottom: 0 },
    plotWidth,
    plotHeight,
    enabled: interactive,
    hover: true,
    press: Boolean(onDataPointPress || onPress),
    tester,
    onPress: (e, hit) => {
      if (!hit) return;
      const datum = hit.datum as BulletChartDatum;
      const event: ChartInteractionEvent<BulletChartDatum> = {
        nativeEvent: e.raw,
        chartX: plotWidth > 0 ? e.plotX / plotWidth : 0,
        chartY: plotHeight > 0 ? e.plotY / plotHeight : 0,
        dataPoint: datum,
        distance: hit.distance,
      };
      onDataPointPress?.(datum, event);
      onPress?.(event);
    },
  });

  const { activeTarget } = useActiveTarget();
  const activeId = activeTarget?.seriesId === 'bullet' ? activeTarget.markId : undefined;
  const highlight = theme.colors.textPrimary;

  // --- Accessibility ---------------------------------------------------------------
  const summary = React.useMemo(
    () =>
      rows
        .map((row) => {
          const parts = [formatValue(row.item.value)];
          if (row.target != null) parts.push(`target ${formatValue(row.target)}`);
          const within = row.ranges.find((r) => row.item.value <= r.to);
          if (within) parts.push(within.label ? `range ${within.label} up to ${formatValue(within.to)}` : `range up to ${formatValue(within.to)}`);
          else if (row.ranges.length) parts.push('above all ranges');
          const name = row.item.label ?? (data ? undefined : title);
          return name ? `${name}: ${parts.join(', ')}` : parts.join(', ');
        })
        .join('; '),
    [rows, formatValue, data, title]
  );

  const trackFill = interpolateColor(theme.colors.background, theme.colors.textPrimary, 0.06);
  const tickColor = theme.colors.textSecondary;
  const axisAt = horizontal ? plotTop + plotHeight : plotLeft;

  return (
    <ChartContainer
      {...rest}
      w={width}
      h={boxHeight}
      style={style}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? summary}
      interactionConfig={{ multiTooltip: false, liveTooltip: false }}
    >
      {(title || subtitle) && <ChartTitle title={title} subtitle={subtitle} />}
      <Svg width={width} height={boxHeight} style={{ position: 'absolute' }} pointerEvents="none">
        {geometry.map(({ row, track, ranges, bar, target }) => (
          <G key={row.index}>
            <SvgRect testID={`bullet-track-${row.index}`} {...track} fill={trackFill} />
            {ranges.map(({ range, rect }) => {
              const active = activeId === `${row.index}-range-${range.index}`;
              return (
                <SvgRect
                  key={range.index}
                  testID={`bullet-range-${row.index}-${range.index}`}
                  {...rect}
                  fill={range.color}
                  stroke={active ? highlight : 'none'}
                  strokeWidth={active ? 1.5 : 0}
                />
              );
            })}
            <AnimatedBulletBar
              testID={`bullet-bar-${row.index}`}
              {...bar}
              horizontal={horizontal}
              fill={row.color}
              stroke={activeId === `${row.index}-value` ? highlight : undefined}
              duration={animationDuration}
              disabled={disableAnimation}
            />
            {target && (
              <SvgRect
                testID={`bullet-target-${row.index}`}
                {...target}
                fill={row.targetColor}
                stroke={activeId === `${row.index}-target` ? highlight : 'none'}
                strokeWidth={activeId === `${row.index}-target` ? 1 : 0}
              />
            )}
          </G>
        ))}
        {withAxis &&
          tickValues.map((tick, i) => {
            const at = position(tick);
            return horizontal ? (
              <G key={`tick-${i}`}>
                <SvgLine x1={at} x2={at} y1={axisAt + 2} y2={axisAt + 2 + TICK_LENGTH} stroke={tickColor} strokeWidth={1} />
                <SvgText
                  x={at}
                  y={axisAt + 2 + TICK_LENGTH + 3 + TICK_SIZE * 0.8}
                  fontSize={TICK_SIZE}
                  fill={tickColor}
                  fontFamily={theme.fontFamily}
                  textAnchor="middle"
                >
                  {tickLabels[i]}
                </SvgText>
              </G>
            ) : (
              <G key={`tick-${i}`}>
                <SvgLine x1={axisAt - 2 - TICK_LENGTH} x2={axisAt - 2} y1={at} y2={at} stroke={tickColor} strokeWidth={1} />
                <SvgText
                  x={axisAt - 2 - TICK_LENGTH - 3}
                  y={at + TICK_SIZE * 0.35}
                  fontSize={TICK_SIZE}
                  fill={tickColor}
                  fontFamily={theme.fontFamily}
                  textAnchor="end"
                >
                  {tickLabels[i]}
                </SvgText>
              </G>
            );
          })}
      </Svg>
      {hasLabels &&
        rows.map((row) => {
          if (!row.item.label && !row.item.description) return null;
          const box = horizontal
            ? { left: PAD, top: crossStartFor(row.index), width: Math.max(0, labelBand - 12), height: band, justifyContent: 'center' as const }
            : { left: plotLeft + row.index * slot, top, width: slot, height: labelBand, alignItems: 'center' as const };
          const textAlign = horizontal ? ('right' as const) : ('center' as const);
          return (
            <View key={`label-${row.index}`} pointerEvents="none" style={{ position: 'absolute', ...box }}>
              {row.item.label ? (
                <RNText
                  numberOfLines={1}
                  style={{ fontSize: LABEL_SIZE, fontWeight: '600', color: theme.colors.textPrimary, fontFamily: theme.fontFamily, textAlign }}
                >
                  {row.item.label}
                </RNText>
              ) : null}
              {row.item.description ? (
                <RNText
                  numberOfLines={horizontal ? 2 : 1}
                  style={{ fontSize: DESCRIPTION_SIZE, color: theme.colors.textSecondary, fontFamily: theme.fontFamily, textAlign }}
                >
                  {row.item.description}
                </RNText>
              ) : null}
            </View>
          );
        })}
      {interactive && (
        <View
          ref={surfaceRef}
          onLayout={surfaceOnLayout}
          testID="bullet-gesture-surface"
          style={{ position: 'absolute', left: 0, top: 0, width, height: boxHeight }}
          {...pointerHandlers}
        />
      )}
    </ChartContainer>
  );
};

BulletChart.displayName = 'BulletChart';

export default BulletChart;
