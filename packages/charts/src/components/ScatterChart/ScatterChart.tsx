import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useChartTheme } from '../../theme/ChartThemeContext';
import { ScatterChartProps, ChartInteractionEvent, ChartDataPoint } from '../../types';
import { ChartContainer, ChartTitle, ChartLegend , withChartBandPadding } from '../../ChartBase';
import {
  resolveCartesianPadding,
  domainTickLabels,
  measureWidestLabel,
  AXIS_TICK_FONT_SIZE,
  AXIS_TICK_PADDING,
  AXIS_TICK_SIZE,
  AXIS_TITLE_FONT_SIZE,
  AXIS_TITLE_GAP,
} from '../../core/axisLayout';
import { useOptionalChartInteraction, useChartInteractionVolatile } from '../../interaction/ChartInteractionContext';
import { useChartPointer } from '../../interaction/useChartPointer';
import { touchDistance } from '../../interaction/useOptionalPinch';
import { PointSeriesHitTester } from '../../core/hittest/point';
import type { HitSeries, Mark } from '../../core/hittest/types';
import type { NormalizedPointerEvent } from '../../interaction/pointerNormalize';
import { ChartGrid } from '../../core/ChartGrid';
import { Axis } from '../../core/Axis';
import Svg from 'react-native-svg';
import { ReferenceAreas, ReferenceDots, ReferenceLines, numericReference, type ReferenceMarkScales } from '../../core/ReferenceMarks';

import {
  scaleLinear,
  scaleLog,
  scaleTime,
  generateTicks,
  generateLogTicks,
  generateTimeTicks,
  getDataDomain,
  dataToChartCoordinates,
  chartToDataCoordinates,
  getColorFromScheme,
  formatNumber,
  createTickFormatter,
  distance as calculateDistance
} from '../../utils';
import type { Scale } from '../../utils/scales';
import { usePanZoom } from '../../hooks/usePanZoom';

const formatTime = (value: number) => new Date(value).toLocaleDateString();

type ScatterScaleType = ScatterChartProps['xScaleType'];
type ScatterValueAxis = 'left' | 'right';

const generateScaleTicks = (domain: [number, number], scaleType: ScatterScaleType, count: number): number[] => {
  switch (scaleType) {
    case 'log': return generateLogTicks(domain, count);
    case 'time': return generateTimeTicks(domain, count);
    default: return generateTicks(domain[0], domain[1], count);
  }
};

/** 10% breathing room either side, so edge points don't sit on the axis line. */
const padDomain = (domain: [number, number]): [number, number] => {
  const pad = (domain[1] - domain[0]) * 0.1;
  return [domain[0] - pad, domain[1] + pad];
};

/**
 * Axis scale for one plot dimension. `invert` maps the domain bottom-up (value
 * axes); a collapsed extent yields a constant scale so axes render nothing.
 */
const buildAxisScale = (
  domain: [number, number],
  extent: number,
  invert: boolean,
  scaleType: ScatterScaleType,
  ticks: number[],
  defaultCount: number,
): Scale<number> => {
  const d = [...domain] as [number, number];
  if (extent <= 0) {
    const scale = ((_: number) => 0) as Scale<number>;
    scale.domain = () => d;
    scale.range = () => [0, 0];
    scale.ticks = () => [...ticks];
    return scale;
  }
  const range: [number, number] = invert ? [extent, 0] : [0, extent];
  const scale = ((value: number) => {
    switch (scaleType) {
      case 'log':
        return scaleLog(Math.max(value, 1e-12), d, range);
      case 'time':
        return scaleTime(value, d, range);
      default:
        return scaleLinear(value, d, range);
    }
  }) as Scale<number>;
  scale.domain = () => d.slice();
  scale.range = () => range.slice();
  scale.ticks = (count?: number) => (ticks.length ? ticks : generateScaleTicks(d, scaleType, count ?? defaultCount));
  return scale;
};

/** Per-series shape fed to the hit-test engine (points augmented with layout coordinates). */
interface ScatterChartSeriesRegistration {
  id: string;
  name?: string;
  color: string;
  visible?: boolean;
  pointColor?: string;
  pointSize?: number;
  /** Value axis the series is scaled against. */
  yAxis: ScatterValueAxis;
  chartPoints: Array<ChartDataPoint & { chartX: number; chartY: number }>;
}

const SPACING_PROP_KEYS = ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'my', 'p', 'pt', 'pr', 'pb', 'pl', 'px', 'py'] as const;
type SpacingPropKey = typeof SPACING_PROP_KEYS[number];

// Animated scatter point component
const AnimatedScatterPoint: React.FC<{
  point: ChartDataPoint & { chartX: number; chartY: number };
  pointSize: number;
  pointOpacity: number;
  isSelected: boolean;
  index: number;
  disabled: boolean;
  theme: ReturnType<typeof useChartTheme>;
  colorScheme: string[];
  fallbackColor?: string;
  duration?: number;
}> = React.memo(({
  point,
  pointSize,
  pointOpacity,
  isSelected,
  index,
  disabled,
  theme,
  colorScheme,
  fallbackColor,
  duration = 400,
}) => {
  const scale = useSharedValue(disabled ? 1 : 0);
  const opacity = useSharedValue(disabled ? 1 : 0);

  useEffect(() => {
    if (disabled) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }

    // Staggered appearance animation
    const delay = index * 50;
    scale.value = withDelay(delay, withTiming(1, {
      duration,
      easing: Easing.out(Easing.back(1.2)),
    }));
    opacity.value = withDelay(delay, withTiming(1, {
      duration: Math.min(300, duration),
      easing: Easing.out(Easing.cubic),
    }));
  }, [disabled, index, duration, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * (isSelected ? 1.5 : 1) }],
    opacity: opacity.value * pointOpacity,
  }));

  // Skip rendering if coordinates invalid
  if (typeof point.chartX !== 'number' || typeof point.chartY !== 'number') {
    return null;
  }

  const backgroundColor = point.color || fallbackColor || getColorFromScheme(index, colorScheme);

  return (
    <Animated.View
      testID="scatter-point"
      style={[
        {
          position: 'absolute',
          left: point.chartX - pointSize,
          top: point.chartY - pointSize,
          width: pointSize * 2,
          height: pointSize * 2,
          borderRadius: pointSize,
          backgroundColor,
          borderWidth: isSelected ? 2 : 0,
          borderColor: theme.colors.accentPalette[0],
          pointerEvents: 'none'
        },
        animatedStyle
      ]}
    />
  );
});

AnimatedScatterPoint.displayName = 'AnimatedScatterPoint';
const ScatterChartInner: React.FC<ScatterChartProps> = (props) => {
  const {
    data: initialData,
    w: width = 400,
    h: height = 300,
    pointSize = 6,
    series,
    pointColor,
    pointOpacity = 1,
    allowAddPoints = false,
    animation,
    showTrendline = false,
    trendlineColor,
    title,
    subtitle,
    xAxis,
    yAxis,
    yAxisRight,
    yDomainRight: yDomainRightProp,
    grid,
    legend,
    tooltip,
    quadrants,
    onPress,
    onDataPointPress,
    disabled = false,
    multiTooltip,
    enableCrosshair,
    referenceLines,
    referenceAreas,
    referenceDots,
  } = props;

  const theme = useChartTheme();
  const pointDuration = animation?.duration ?? 400;
  const interaction = useOptionalChartInteraction();
  // Volatile subscription: ScatterChart draws crosshair guides from the active target +
  // pointer, so it re-renders each frame during hover.
  const { activeTarget, pointer } = useChartInteractionVolatile();
  const crosshairEnabled = enableCrosshair !== false && interaction?.config?.enableCrosshair !== false;
  const updateSeriesVisibility = interaction?.updateSeriesVisibility;
  const [data, setData] = useState<ChartDataPoint[]>(initialData);
  // Normalize multi-series (fallback to single-series wrapper)
  const normalizedSeries = React.useMemo(() => {
    if (series && series.length) {
      return series.map((s, i) => {
        const color = s.color || theme.colors.accentPalette[i % theme.colors.accentPalette.length];
        return {
          id: s.id || `series-${i}`,
          name: s.name || `Series ${i + 1}`,
          color,
          data: s.data,
          pointSize: s.pointSize ?? pointSize,
          // Points take the series color (the one the legend shows) unless overridden.
          pointColor: s.pointColor || color,
          yAxis: (s.yAxis === 'right' ? 'right' : 'left') as ScatterValueAxis,
        };
      });
    }
    // Fallback single-series mode using initial data prop
    return [{
      id: 'series-0',
      name: title || 'Series 1',
      color: pointColor || theme.colors.accentPalette[0],
      data: data,
      pointSize,
      pointColor: pointColor || theme.colors.accentPalette[0],
      yAxis: 'left' as ScatterValueAxis,
    }];
  }, [series, data, pointSize, pointColor, theme.colors.accentPalette, title]);

  // (Removed per-point animated values to avoid hook-in-loop invalid usage)

  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  // Calculate data bounds with some padding
  const computedXDomain = React.useMemo(() => getDataDomain(normalizedSeries.flatMap(s => s.data), d => d.x), [normalizedSeries]);
  // The left axis is scaled by the series bound to it; when every series is on
  // the right it falls back to all of them so it still has a sensible range.
  const hasRightSeries = normalizedSeries.some(s => s.yAxis === 'right');
  const computedYDomain = React.useMemo(() => {
    const leftSeries = normalizedSeries.filter(s => s.yAxis !== 'right');
    return getDataDomain((leftSeries.length ? leftSeries : normalizedSeries).flatMap(s => s.data), d => d.y);
  }, [normalizedSeries]);
  const computedYDomainRight = React.useMemo(
    () => getDataDomain(normalizedSeries.filter(s => s.yAxis === 'right').flatMap(s => s.data), d => d.y),
    [normalizedSeries]
  );
  const [xDomainState, setXDomainState] = useState<[number, number] | null>(null);
  const [yDomainState, setYDomainState] = useState<[number, number] | null>(null);
  const rawXDomain = xDomainState || computedXDomain;
  const rawYDomain = yDomainState || computedYDomain;
  const clampToInitial = props.clampToInitialDomain;
  const clampDomain = (domain: [number, number], base: [number, number]) => {
    if (!clampToInitial) return domain;
    const width = domain[1] - domain[0];
    const baseWidth = base[1] - base[0];
    if (width >= baseWidth) return base;
    const min = Math.max(base[0], Math.min(domain[0], base[1] - width));
    const max = min + width;
    return [min, max] as [number, number];
  };
  const xDomain = clampDomain(rawXDomain, computedXDomain);
  const yDomain = clampDomain(rawYDomain, computedYDomain);

  // Add some padding to the domain
  const xPadding = (xDomain[1] - xDomain[0]) * 0.1;
  const yPadding = (yDomain[1] - yDomain[0]) * 0.1;
  const paddedXDomain: [number, number] = [xDomain[0] - xPadding, xDomain[1] + xPadding];
  const paddedYDomain: [number, number] = [yDomain[0] - yPadding, yDomain[1] + yPadding];

  // Secondary (right) value axis — same model as ComboChart: shown when a series
  // binds to it or `yAxisRight` is passed; its domain is the right-bound series'
  // data (or `yDomainRight`), mirroring the left domain when nothing binds to it.
  const hasRightAxis = hasRightSeries || !!yAxisRight;
  const showRightAxis = hasRightAxis && yAxisRight?.show !== false;
  const basePaddedYDomain = React.useMemo(() => padDomain(computedYDomain), [computedYDomain]);
  const baseYDomainRight = React.useMemo<[number, number]>(() => {
    if (yDomainRightProp) return yDomainRightProp;
    if (!hasRightSeries) return basePaddedYDomain;
    const [min, max] = computedYDomainRight;
    // A single right-bound value would otherwise give a zero-height domain.
    if (min === max) {
      const delta = min === 0 ? 1 : Math.abs(min) * 0.1;
      return [min - delta, max + delta];
    }
    return padDomain(computedYDomainRight);
  }, [yDomainRightProp, hasRightSeries, basePaddedYDomain, computedYDomainRight]);
  // Pan/zoom drives the left domain; carry the same window onto the right axis so
  // both sides of the plot keep describing the same pixels.
  const [paddedYMin, paddedYMax] = paddedYDomain;
  const paddedYDomainRight = React.useMemo<[number, number]>(() => {
    const baseSpan = basePaddedYDomain[1] - basePaddedYDomain[0];
    if (!baseSpan) return baseYDomainRight;
    const t0 = (paddedYMin - basePaddedYDomain[0]) / baseSpan;
    const t1 = (paddedYMax - basePaddedYDomain[0]) / baseSpan;
    if (t0 === 0 && t1 === 1) return baseYDomainRight;
    const span = baseYDomainRight[1] - baseYDomainRight[0];
    return [baseYDomainRight[0] + t0 * span, baseYDomainRight[0] + t1 * span];
  }, [paddedYMin, paddedYMax, basePaddedYDomain, baseYDomainRight]);
  const domainForAxis = (axis: ScatterValueAxis) => (axis === 'right' ? paddedYDomainRight : paddedYDomain);

  // Right ticks depend only on the right domain, not on the plot size, so they
  // can be computed up front and measured exactly for the padding below.
  const yTicksRight = React.useMemo(
    () => yAxisRight?.ticks ?? generateScaleTicks(paddedYDomainRight, props.yScaleType, 5),
    [yAxisRight?.ticks, paddedYDomainRight, props.yScaleType]
  );
  const yTickFormatRight = React.useMemo(() => createTickFormatter(yTicksRight, theme.numberFormat), [yTicksRight, theme.numberFormat]);
  const rightLabelFormatter = yAxisRight?.labelFormatter;
  const formatRightTick = React.useCallback((value: number | string) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (rightLabelFormatter) return rightLabelFormatter(numeric);
    if (props.yScaleType === 'time') return formatTime(numeric);
    return yTickFormatRight(numeric);
  }, [rightLabelFormatter, props.yScaleType, yTickFormatRight]);

  // Room right of the plot for the secondary axis: tick, gap, its widest label
  // (under the same width budget as the left axis) and its rotated title.
  const rightTickSize = yAxisRight?.tickLength ?? AXIS_TICK_SIZE;
  const rightAxisLayout = React.useMemo(() => {
    if (!showRightAxis) return { allowance: 0, tickLabelWidth: 0 };
    const tickLabelWidth = yAxisRight?.showLabels !== false
      ? Math.min(
          Math.ceil(measureWidestLabel(yTicksRight.map((tick) => String(formatRightTick(tick))), yAxisRight?.labelFontSize ?? AXIS_TICK_FONT_SIZE)),
          Math.max(28, Math.round(width * 0.33)),
        )
      : 0;
    const titleBand = yAxisRight?.title
      ? Math.round((yAxisRight?.titleFontSize ?? AXIS_TITLE_FONT_SIZE) * 1.3) + AXIS_TITLE_GAP
      : 0;
    return { allowance: rightTickSize + AXIS_TICK_PADDING + tickLabelWidth + titleBand, tickLabelWidth };
  }, [showRightAxis, yTicksRight, formatRightTick, yAxisRight?.showLabels, yAxisRight?.labelFontSize,
      yAxisRight?.title, yAxisRight?.titleFontSize, rightTickSize, width]);

  // Chart dimensions — grown so the plot clears the title and legend overlays.
  const basePadding = React.useMemo(
    () => resolveCartesianPadding({
      yTickLabels: domainTickLabels(paddedYDomain, yAxis?.labelFormatter ?? (props.yScaleType === 'time' ? formatTime : undefined), theme.numberFormat),
      xTickLabels: domainTickLabels(paddedXDomain, xAxis?.labelFormatter ?? (props.xScaleType === 'time' ? formatTime : undefined), theme.numberFormat),
      yTitle: yAxis?.title,
      xTitle: xAxis?.title,
      showYAxis: yAxis?.show !== false,
      showXAxis: xAxis?.show !== false,
      showYTickLabels: yAxis?.showLabels !== false,
      showXTickLabels: xAxis?.showLabels !== false,
      containerWidth: width,
      containerHeight: height,
      rightAllowance: rightAxisLayout.allowance,
    }),
    [paddedYDomain, paddedXDomain, yAxis?.labelFormatter, xAxis?.labelFormatter, yAxis?.title, xAxis?.title,
     yAxis?.show, xAxis?.show, yAxis?.showLabels, xAxis?.showLabels, width, height,
     props.xScaleType, props.yScaleType, theme.numberFormat, rightAxisLayout.allowance]
  );
  const legendLabels = React.useMemo(
    () => normalizedSeries.map((s, i) => ({ label: s.name || `Series ${i + 1}` })),
    [normalizedSeries]
  );
  const padding = React.useMemo(
    () =>
      withChartBandPadding(basePadding, {
        title,
        subtitle,
        legendItems: legend?.show ? legendLabels : undefined,
        legendPosition: legend?.position,
        legendFontSize: legend?.fontSize,
        containerWidth: width,
      }),
    [basePadding, title, subtitle, legend?.show, legend?.position, legend?.fontSize, legendLabels, width]
  );
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const interactionVisibility = useMemo(() => {
    const visibilityMap = new Map<string, boolean>();
    interaction?.series.forEach((entry) => {
      visibilityMap.set(String(entry.id), entry.visible !== false);
    });
    return visibilityMap;
  }, [interaction?.series]);

  const chartSeries: ScatterChartSeriesRegistration[] = normalizedSeries.map(s => ({
    ...s,
    visible: interactionVisibility.get(String(s.id)) ?? true,
    pointColor: s.pointColor,
    pointSize: s.pointSize,
    chartPoints: s.data.map((point) => {
      const coords = dataToChartCoordinates(point.x, point.y, { x: 0, y: 0, width: plotWidth, height: plotHeight }, paddedXDomain, domainForAxis(s.yAxis));
      return { ...point, chartX: coords.x, chartY: coords.y };
    })
  }));

  // New interaction engine: build container-origin marks + a point hit-tester,
  // register it with the store, and let the shared engine drive hover/tooltip.
  const hitSeries: HitSeries[] = useMemo(() => chartSeries.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.pointColor || s.color,
    visible: s.visible !== false,
    marks: s.chartPoints.map((p, i): Mark => {
      const custom = tooltip?.formatter?.(p);
      const quadrantLabel = quadrants?.x != null && quadrants.y != null ? quadrants.labels?.[
        p.y >= quadrants.y
          ? p.x >= quadrants.x ? 'topRight' : 'topLeft'
          : p.x >= quadrants.x ? 'bottomRight' : 'bottomLeft'
      ] : undefined;
      const fallback = p.label ? String(p.label) : `(${formatNumber(p.x)}, ${formatNumber(p.y)})`;
      return {
        id: p.id ?? i,
        pixel: { x: p.chartX + padding.left, y: p.chartY + padding.top },
        value: p.y,
        datum: p,
        dataX: p.x,
        dataY: p.y,
        label: p.label,
        formattedValue: typeof custom === 'string' ? custom : fallback,
        ...(custom != null && typeof custom !== 'string' ? { customTooltip: custom } : {}),
        ...(custom == null && width < 400 && quadrantLabel ? { formattedValue: `${fallback} · ${quadrantLabel}` } : {}),
      };
    }),
  })), [chartSeries, padding.left, padding.top, tooltip, quadrants, width]);

  const tester = useMemo(() => new PointSeriesHitTester(hitSeries), [hitSeries]);
  const register = interaction?.register;
  useEffect(() => {
    if (!register) return;
    register('scatter', { frame: { kind: 'cartesian' } as any, geometry: { kind: 'point' }, series: hitSeries });
    return () => register('scatter', null);
  }, [register, hitSeries]);

  const xTicks = React.useMemo(() => generateScaleTicks(paddedXDomain, props.xScaleType, 6), [paddedXDomain, props.xScaleType]);
  const yTicks = React.useMemo(() => generateScaleTicks(paddedYDomain, props.yScaleType, 5), [paddedYDomain, props.yScaleType]);
  const xTickFormat = React.useMemo(() => createTickFormatter(xTicks, theme.numberFormat), [xTicks, theme.numberFormat]);
  const yTickFormat = React.useMemo(() => createTickFormatter(yTicks, theme.numberFormat), [yTicks, theme.numberFormat]);

  const axisScaleX = useMemo<Scale<number>>(
    () => buildAxisScale(paddedXDomain, plotWidth, false, props.xScaleType, xTicks, 6),
    [plotWidth, paddedXDomain, props.xScaleType, xTicks]
  );
  const axisScaleY = useMemo<Scale<number>>(
    () => buildAxisScale(paddedYDomain, plotHeight, true, props.yScaleType, yTicks, 5),
    [plotHeight, paddedYDomain, props.yScaleType, yTicks]
  );
  const axisScaleYRight = useMemo<Scale<number>>(
    () => buildAxisScale(paddedYDomainRight, plotHeight, true, props.yScaleType, yTicksRight, 5),
    [plotHeight, paddedYDomainRight, props.yScaleType, yTicksRight]
  );

  // Reference marks share the axis scales (plot-local px). Their y values are
  // read against the primary (left) axis, as in ComboChart.
  const referenceScales = useMemo<ReferenceMarkScales>(() => ({
    xToPx: numericReference(axisScaleX),
    yToPx: numericReference(axisScaleY),
    plotWidth: Math.max(0, plotWidth),
    plotHeight: Math.max(0, plotHeight),
  }), [axisScaleX, axisScaleY, plotWidth, plotHeight]);

  const quadrantVisual = useMemo(() => {
    if (!quadrants) return null;
    if (plotWidth <= 0 || plotHeight <= 0) return null;
    const { x, y } = quadrants;
    if (x == null || y == null) return null;

    const rawX = axisScaleX(x);
    const rawY = axisScaleY(y);
    if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;

    const clampCoord = (value: number, max: number) => Math.min(Math.max(value, 0), max);
    const xCoord = clampCoord(rawX, plotWidth);
    const yCoord = clampCoord(rawY, plotHeight);

    return {
      xCoord,
      yCoord,
      fills: quadrants.fills,
      fillOpacity: Math.min(Math.max(quadrants.fillOpacity ?? 0.08, 0), 1),
      showLines: quadrants.showLines !== false,
      lineColor: quadrants.lineColor || theme.colors.grid,
      lineWidth: Math.max(quadrants.lineWidth ?? 1, 0.5),
      labels: quadrants.labels,
      labelColor: quadrants.labelColor || theme.colors.textSecondary,
      labelFontSize: quadrants.labelFontSize ?? 11,
      labelOffset: quadrants.labelOffset ?? 14,
    };
  }, [quadrants, axisScaleX, axisScaleY, plotHeight, plotWidth, theme.colors.grid, theme.colors.textSecondary]);

  const quadrantLayout = useMemo(() => {
    if (!quadrantVisual) return null;
    return {
      ...quadrantVisual,
      leftWidth: quadrantVisual.xCoord,
      rightWidth: Math.max(0, plotWidth - quadrantVisual.xCoord),
      topHeight: quadrantVisual.yCoord,
      bottomHeight: Math.max(0, plotHeight - quadrantVisual.yCoord),
    };
  }, [plotHeight, plotWidth, quadrantVisual]);

  const normalizedXTicks = useMemo(() => {
    if (plotWidth <= 0) return [] as number[];
    return xTicks.map((tick) => {
      const value = axisScaleX(tick);
      if (!Number.isFinite(value) || plotWidth === 0) return 0;
      return value / plotWidth;
    });
  }, [xTicks, axisScaleX, plotWidth]);

  const normalizedYTicks = useMemo(() => {
    if (plotHeight <= 0) return [] as number[];
    return yTicks.map((tick) => {
      const value = axisScaleY(tick);
      if (!Number.isFinite(value) || plotHeight === 0) return 0;
      return value / plotHeight;
    });
  }, [yTicks, axisScaleY, plotHeight]);

  const xAxisTickSize = xAxis?.tickLength ?? 4;
  const yAxisTickSize = yAxis?.tickLength ?? 4;
  const axisTickPadding = 4;

  const resolvedTextColor = theme.colors.textSecondary;

  // Calculate trend line (simple linear regression)
  const calculateTrendline = () => {
    if (data.length < 2) return null;

    const n = data.length;
    const sumX = data.reduce((sum, p) => sum + p.x, 0);
    const sumY = data.reduce((sum, p) => sum + p.y, 0);
    const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = data.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const startX = paddedXDomain[0];
    const endX = paddedXDomain[1];
    const startY = slope * startX + intercept;
    const endY = slope * endX + intercept;

    return {
      start: dataToChartCoordinates(startX, startY,
        { x: 0, y: 0, width: plotWidth, height: plotHeight },
        paddedXDomain, paddedYDomain),
      end: dataToChartCoordinates(endX, endY,
        { x: 0, y: 0, width: plotWidth, height: plotHeight },
        paddedXDomain, paddedYDomain)
    };
  };

  // Regression helpers
  const computeRegression = (pts: ChartDataPoint[]) => {
    if (pts.length < 2) return null;
    const n = pts.length;
    const sumX = pts.reduce((s, p) => s + p.x, 0);
    const sumY = pts.reduce((s, p) => s + p.y, 0);
    const sumXY = pts.reduce((s, p) => s + p.x * p.y, 0);
    const sumXX = pts.reduce((s, p) => s + p.x * p.x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (!denom) return null;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  };
  const trendlines = React.useMemo(() => {
    if (!showTrendline) return [] as any[];
    const toPlot = (x: number, y: number, yDom: [number, number]) =>
      dataToChartCoordinates(x, y, { x: 0, y: 0, width: plotWidth, height: plotHeight }, paddedXDomain, yDom);
    if (showTrendline === 'per-series') {
      return chartSeries.map(s => {
        const reg = computeRegression(s.chartPoints);
        if (!reg) return null;
        const yDom = s.yAxis === 'right' ? paddedYDomainRight : paddedYDomain;
        const startX = paddedXDomain[0];
        const endX = paddedXDomain[1];
        return {
          id: s.id,
          color: s.color,
          start: toPlot(startX, reg.slope * startX + reg.intercept, yDom),
          end: toPlot(endX, reg.slope * endX + reg.intercept, yDom)
        };
      }).filter(Boolean);
    }
    // One regression only means something on one scale: fit the left-bound
    // series (or the right-bound ones when nothing is on the left).
    const leftBound = chartSeries.filter(s => s.yAxis !== 'right');
    const fitted = leftBound.length ? leftBound : chartSeries;
    const yDom = leftBound.length ? paddedYDomain : paddedYDomainRight;
    const reg = computeRegression(fitted.flatMap(s => s.chartPoints));
    if (!reg) return [];
    const startX = paddedXDomain[0];
    const endX = paddedXDomain[1];
    return [{
      id: 'overall',
      color: trendlineColor || theme.colors.accentPalette[0],
      start: toPlot(startX, reg.slope * startX + reg.intercept, yDom),
      end: toPlot(endX, reg.slope * endX + reg.intercept, yDom)
    }];
  }, [showTrendline, chartSeries, paddedXDomain, paddedYDomain, paddedYDomainRight, plotWidth, plotHeight, trendlineColor, theme.colors.accentPalette]);

  // Pan/Zoom integration
  const pinchTrackingRef = React.useRef(false);
  const lastTapTimeRef = React.useRef<number>(0);
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const panZoom = usePanZoom(
    { xDomain: xDomain, yDomain: yDomain },
    (next) => {
      if (next.xDomain) setXDomainState(next.xDomain);
      if (next.yDomain) setYDomainState(next.yDomain);
    },
    {
      enablePanZoom: props.enablePanZoom,
      zoomMode: props.zoomMode,
      minZoom: props.minZoom,
      wheelZoomStep: props.wheelZoomStep,
      clampDomain: clampDomain,
      baseX: computedXDomain,
      baseY: computedYDomain,
      invertPinchZoom: props.invertPinchZoom,
      invertWheelZoom: props.invertWheelZoom,
    }
  );

  // --- Unified pointer engine (replaces PanResponder + web mouse dual paths) ---
  const panningRef = useRef(false);

  const handlePointer = useCallback((e: NormalizedPointerEvent) => {
    const enablePanZoom = props.enablePanZoom;
    if (e.phase === 'down') {
      dragStartRef.current = { x: e.plotX, y: e.plotY };
      const dist = touchDistance(e.raw);
      if (enablePanZoom && dist != null) {
        panZoom.startPinch(dist);
        pinchTrackingRef.current = true;
        return;
      }
      if (enablePanZoom) {
        panZoom.startPan(e.plotX, e.plotY);
        panningRef.current = true;
      }
      return;
    }
    if (e.phase === 'move') {
      const dist = touchDistance(e.raw);
      if (enablePanZoom && dist != null) {
        if (!pinchTrackingRef.current) {
          panZoom.startPinch(dist);
          pinchTrackingRef.current = true;
          panningRef.current = false;
        } else {
          panZoom.updatePinch(dist);
        }
        return;
      }
      if (enablePanZoom && panningRef.current && !pinchTrackingRef.current) {
        panZoom.updatePan(e.plotX, e.plotY, plotWidth, plotHeight);
      }
      return;
    }
    if (e.phase === 'up') {
      // Double-tap reset (only counts taps, not drags).
      if (props.resetOnDoubleTap && dragStartRef.current) {
        const dragDistance = Math.hypot(e.plotX - dragStartRef.current.x, e.plotY - dragStartRef.current.y);
        if (dragDistance < 10) {
          const now = Date.now();
          if (now - lastTapTimeRef.current < 300) {
            setXDomainState(null);
            setYDomainState(null);
            lastTapTimeRef.current = 0;
            // @ts-expect-error optional web-only onDomainChange prop not in base type
            props.onDomainChange?.(computedXDomain, computedYDomain);
          } else {
            lastTapTimeRef.current = now;
          }
        }
      }
      dragStartRef.current = null;
      panZoom.endPan();
      panningRef.current = false;
      if (pinchTrackingRef.current) { panZoom.endPinch(); pinchTrackingRef.current = false; }
      // @ts-expect-error optional
      props.onDomainChange?.(xDomain, yDomain);
    }
  }, [props.enablePanZoom, props.resetOnDoubleTap, plotWidth, plotHeight, panZoom, xDomain, yDomain, computedXDomain, computedYDomain]);

  const handlePress = useCallback((e: NormalizedPointerEvent, target: import('../../core/hittest/types').ActiveTarget | null) => {
    if (disabled) return;
    const chartX = e.plotX;
    const chartY = e.plotY;
    const datum = target?.datum;
    const hitThreshold = ((datum?.size ?? pointSize) + 6);
    if (target && datum && target.distance <= hitThreshold) {
      setSelectedPoint(datum);
      onDataPointPress?.(datum, { nativeEvent: e.raw, chartX, chartY, dataPoint: datum, distance: target.distance });
    } else if (allowAddPoints && e.inside) {
      const dataCoords = chartToDataCoordinates(chartX, chartY, { x: 0, y: 0, width: plotWidth, height: plotHeight }, paddedXDomain, paddedYDomain);
      const newPoint: ChartDataPoint = {
        id: Date.now(),
        x: Math.round(dataCoords.x * 100) / 100,
        y: Math.round(dataCoords.y * 100) / 100,
        color: pointColor || getColorFromScheme(data.length, theme.colors.accentPalette),
      };
      setData([...data, newPoint]);
      setSelectedPoint(newPoint);
    }
    onPress?.({ nativeEvent: e.raw, chartX, chartY });
  }, [disabled, pointSize, allowAddPoints, plotWidth, plotHeight, paddedXDomain, paddedYDomain, pointColor, data, onDataPointPress, onPress, theme.colors.accentPalette]);

  const { handlers: pointerHandlers, ref: surfaceRef, onLayout: surfaceOnLayout } = useChartPointer({
    padding,
    plotWidth,
    plotHeight,
    enabled: !disabled,
    hover: crosshairEnabled,
    press: true,
    wheel: !!props.enableWheelZoom,
    tester,
    maxDistance: 30,
    onPointer: handlePointer,
    onPress: handlePress,
    onWheel: (g) => { if (props.enablePanZoom) panZoom.wheelZoom(g.deltaY, g.anchorXRatio, g.anchorYRatio); },
    onLeave: () => {
      panZoom.endPan();
      panningRef.current = false;
      if (pinchTrackingRef.current) { panZoom.endPinch(); pinchTrackingRef.current = false; }
    },
  });

  // Ticks already computed earlier (xTicks, yTicks)

  return (
    <>
      {/* Title */}
      {(title || subtitle) && (
        <ChartTitle
          title={title}
          subtitle={subtitle}
        />
      )}

      {grid && (
        <ChartGrid
          grid={
            typeof grid === 'object' ? grid : { show: true, showMajor: true, showMinor: false }
          }
          plotWidth={plotWidth}
          plotHeight={plotHeight}
          xTicks={normalizedXTicks}
          yTicks={normalizedYTicks}
          padding={padding}
          useSVG={false} // ScatterChart is not fully SVG yet
        />
      )}

      {/* Axes */}
      {xAxis?.show !== false && plotWidth > 0 && (
        <Axis
          scale={axisScaleX}
          orientation="bottom"
          length={plotWidth}
          offset={{ x: padding.left, y: padding.top + plotHeight }}
          ticks={xTicks}
          tickLabelWidth={basePadding.xTickLabelWidth}
          tickLabelLines={basePadding.xTickLabelLines}
          tickSize={xAxisTickSize}
          tickPadding={axisTickPadding}
          tickFormat={(value) => {
            const numeric = typeof value === 'number' ? value : Number(value);
            if (xAxis?.labelFormatter) return xAxis.labelFormatter(numeric);
            if (props.xScaleType === 'time') return formatTime(numeric);
            return xTickFormat(numeric);
          }}
          showLabels={xAxis?.showLabels !== false}
          showTicks={xAxis?.showTicks !== false}
          stroke={xAxis?.color || theme.colors.grid}
          strokeWidth={xAxis?.thickness ?? 1}
          label={xAxis?.title}
          tickLabelColor={xAxis?.labelColor || resolvedTextColor}
          tickLabelFontSize={xAxis?.labelFontSize}
          labelColor={xAxis?.titleColor || theme.colors.textPrimary}
          labelFontSize={xAxis?.titleFontSize}
        />
      )}

      {yAxis?.show !== false && plotHeight > 0 && (
        <Axis
          scale={axisScaleY}
          orientation="left"
          length={plotHeight}
          offset={{ x: padding.left, y: padding.top }}
          ticks={yTicks}
          tickLabelWidth={basePadding.yTickLabelWidth}
          tickSize={yAxisTickSize}
          tickPadding={axisTickPadding}
          tickFormat={(value) => {
            const numeric = typeof value === 'number' ? value : Number(value);
            if (yAxis?.labelFormatter) return yAxis.labelFormatter(numeric);
            if (props.yScaleType === 'time') return formatTime(numeric);
            return yTickFormat(numeric);
          }}
          showLabels={yAxis?.showLabels !== false}
          showTicks={yAxis?.showTicks !== false}
          stroke={yAxis?.color || theme.colors.grid}
          strokeWidth={yAxis?.thickness ?? 1}
          label={yAxis?.title}
          tickLabelColor={yAxis?.labelColor || resolvedTextColor}
          tickLabelFontSize={yAxis?.labelFontSize}
          labelColor={yAxis?.titleColor || theme.colors.textPrimary}
          labelFontSize={yAxis?.titleFontSize}
          style={{ width: padding.left, height: plotHeight }}
        />
      )}

      {showRightAxis && plotHeight > 0 && (
        <Axis
          scale={axisScaleYRight}
          orientation="right"
          length={plotHeight}
          offset={{ x: padding.left + plotWidth, y: padding.top }}
          ticks={yTicksRight}
          tickLabelWidth={rightAxisLayout.tickLabelWidth}
          tickSize={rightTickSize}
          tickPadding={axisTickPadding}
          tickFormat={formatRightTick}
          showLabels={yAxisRight?.showLabels !== false}
          showTicks={yAxisRight?.showTicks !== false}
          stroke={yAxisRight?.color || theme.colors.grid}
          strokeWidth={yAxisRight?.thickness ?? 1}
          label={yAxisRight?.title}
          tickLabelColor={yAxisRight?.labelColor || resolvedTextColor}
          tickLabelFontSize={yAxisRight?.labelFontSize}
          labelColor={yAxisRight?.titleColor || theme.colors.textPrimary}
          labelFontSize={yAxisRight?.titleFontSize}
        />
      )}

      {/* Chart interaction area */}
      <View
        style={{
          position: 'absolute',
          left: padding.left,
          top: padding.top,
          width: plotWidth,
          height: plotHeight,
        }}
        pointerEvents="none"
      >
        <View style={{ flex: 1 }} collapsable={false} pointerEvents="none">
          {/* Reference areas sit under everything else in the plot */}
          {referenceAreas?.length ? (
            <Svg width={referenceScales.plotWidth} height={referenceScales.plotHeight} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
              <ReferenceAreas areas={referenceAreas} scales={referenceScales} />
            </Svg>
          ) : null}
          {/* Quadrant background overlays */}
          {quadrantLayout && (
            <>
              {quadrantLayout.fills?.topLeft && quadrantLayout.leftWidth > 0 && quadrantLayout.topHeight > 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: quadrantLayout.leftWidth,
                    height: quadrantLayout.topHeight,
                    backgroundColor: quadrantLayout.fills.topLeft,
                    opacity: quadrantLayout.fillOpacity,
                    zIndex: -1,
                  }}
                />
              )}
              {quadrantLayout.fills?.topRight && quadrantLayout.rightWidth > 0 && quadrantLayout.topHeight > 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: quadrantLayout.xCoord,
                    top: 0,
                    width: quadrantLayout.rightWidth,
                    height: quadrantLayout.topHeight,
                    backgroundColor: quadrantLayout.fills.topRight,
                    opacity: quadrantLayout.fillOpacity,
                    zIndex: -1,
                  }}
                />
              )}
              {quadrantLayout.fills?.bottomLeft && quadrantLayout.leftWidth > 0 && quadrantLayout.bottomHeight > 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: quadrantLayout.yCoord,
                    width: quadrantLayout.leftWidth,
                    height: quadrantLayout.bottomHeight,
                    backgroundColor: quadrantLayout.fills.bottomLeft,
                    opacity: quadrantLayout.fillOpacity,
                    zIndex: -1,
                  }}
                />
              )}
              {quadrantLayout.fills?.bottomRight && quadrantLayout.rightWidth > 0 && quadrantLayout.bottomHeight > 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: quadrantLayout.xCoord,
                    top: quadrantLayout.yCoord,
                    width: quadrantLayout.rightWidth,
                    height: quadrantLayout.bottomHeight,
                    backgroundColor: quadrantLayout.fills.bottomRight,
                    opacity: quadrantLayout.fillOpacity,
                    zIndex: -1,
                  }}
                />
              )}

              {quadrantLayout.showLines && (
                <>
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: Math.min(Math.max(quadrantLayout.xCoord - quadrantLayout.lineWidth / 2, 0), Math.max(plotWidth - quadrantLayout.lineWidth, 0)),
                      top: 0,
                      width: quadrantLayout.lineWidth,
                      height: plotHeight,
                      backgroundColor: quadrantLayout.lineColor,
                      opacity: 0.5,
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: Math.min(Math.max(quadrantLayout.yCoord - quadrantLayout.lineWidth / 2, 0), Math.max(plotHeight - quadrantLayout.lineWidth, 0)),
                      width: plotWidth,
                      height: quadrantLayout.lineWidth,
                      backgroundColor: quadrantLayout.lineColor,
                      opacity: 0.5,
                    }}
                  />
                </>
              )}

              {(width >= 400 || tooltip?.show === false) && quadrantLayout.labels && (
                <>
                  {quadrantLayout.labels.topLeft && (
                    <Text
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: quadrantLayout.labelOffset,
                        top: quadrantLayout.labelOffset,
                        color: quadrantLayout.labelColor,
                        fontSize: quadrantLayout.labelFontSize,
                        fontFamily: theme.fontFamily,
                      }}
                    >
                      {quadrantLayout.labels.topLeft}
                    </Text>
                  )}
                  {quadrantLayout.labels.topRight && (
                    <Text
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        right: quadrantLayout.labelOffset,
                        top: quadrantLayout.labelOffset,
                        color: quadrantLayout.labelColor,
                        fontSize: quadrantLayout.labelFontSize,
                        fontFamily: theme.fontFamily,
                        textAlign: 'right',
                      }}
                    >
                      {quadrantLayout.labels.topRight}
                    </Text>
                  )}
                  {quadrantLayout.labels.bottomLeft && (
                    <Text
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: quadrantLayout.labelOffset,
                        bottom: quadrantLayout.labelOffset,
                        color: quadrantLayout.labelColor,
                        fontSize: quadrantLayout.labelFontSize,
                        fontFamily: theme.fontFamily,
                      }}
                    >
                      {quadrantLayout.labels.bottomLeft}
                    </Text>
                  )}
                  {quadrantLayout.labels.bottomRight && (
                    <Text
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        right: quadrantLayout.labelOffset,
                        bottom: quadrantLayout.labelOffset,
                        color: quadrantLayout.labelColor,
                        fontSize: quadrantLayout.labelFontSize,
                        fontFamily: theme.fontFamily,
                        textAlign: 'right',
                      }}
                    >
                      {quadrantLayout.labels.bottomRight}
                    </Text>
                  )}
                </>
              )}
            </>
          )}

          {/* Trend line */}
          {trendlines.map(tl => tl && (
            <View
              key={`trend-${tl.id}`}
              style={{
                position: 'absolute',
                left: tl.start.x,
                top: tl.start.y,
                width: calculateDistance(tl.start.x, tl.start.y, tl.end.x, tl.end.y),
                height: 2,
                backgroundColor: tl.color,
                opacity: 0.6,
                transform: [{
                  rotate: `${Math.atan2(tl.end.y - tl.start.y, tl.end.x - tl.start.x) * 180 / Math.PI}deg`
                }],
                transformOrigin: 'left center',
                pointerEvents: 'none'
              }}
            />
          ))}

          {/* Data points */}
          {chartSeries.map(s => s.visible !== false ? s.chartPoints.map((point, index) => {
            const isSelected = selectedPoint?.id === point.id;
            const seriesPointSize =typeof s.pointSize === 'number' && Number.isFinite(s.pointSize) ? s.pointSize : pointSize;
            const rawPointSize = typeof point.size === 'number' && Number.isFinite(point.size) ? point.size : seriesPointSize;
            const resolvedPointSize = Math.max(2, rawPointSize);

            return (
              <AnimatedScatterPoint
                key={`point-${s.id}-${point.id || index}`}
                point={point}
                pointSize={resolvedPointSize}
                pointOpacity={pointOpacity}
                isSelected={isSelected}
                index={index}
                disabled={disabled}
                theme={theme}
                colorScheme={theme.colors.accentPalette}
                fallbackColor={s.pointColor || pointColor}
                duration={pointDuration}
              />
            );
          }) : null)}

          {/* Reference lines and dots sit above the points */}
          {referenceLines?.length || referenceDots?.length ? (
            <Svg width={referenceScales.plotWidth} height={referenceScales.plotHeight} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
              <ReferenceLines lines={referenceLines} scales={referenceScales} />
              <ReferenceDots dots={referenceDots} scales={referenceScales} />
            </Svg>
          ) : null}

          {/* Crosshair overlays (driven by the normalized active target / pointer,
              converted from container-origin to plot-local by subtracting padding) */}
          {crosshairEnabled && activeTarget && plotHeight > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: Math.max(0, Math.min(plotWidth - 1, activeTarget.pixel.x - padding.left)),
                top: 0,
                height: plotHeight,
                width: 1,
                backgroundColor: theme.colors.grid || 'rgba(0,0,0,0.2)',
              }}
            />
          )}
          {crosshairEnabled && pointer?.inside && typeof pointer?.y === 'number' && plotWidth > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                top: Math.max(0, Math.min(plotHeight - 1, pointer.y - padding.top)),
                width: plotWidth,
                height: 1,
                backgroundColor: theme.colors.grid || 'rgba(0,0,0,0.2)',
              }}
            />
          )}

          {/* Selected point tooltip */}
          {selectedPoint && tooltip?.show !== false && !multiTooltip && (() => {
            const selectedChartPoint = chartSeries.flatMap(s => s.chartPoints).find(p => p.id === selectedPoint.id);
            if (!selectedChartPoint) return null;

            return (
              <View
                style={{
                  position: 'absolute',
                  left: selectedChartPoint.chartX,
                  top: selectedChartPoint.chartY - 50,
                  backgroundColor: tooltip?.backgroundColor || theme.colors.background,
                  padding: tooltip?.padding || 8,
                  borderRadius: tooltip?.borderRadius || 4,
                  alignItems: 'center',
                  transform: [{ translateX: -50 }], // Center the tooltip
                }}
              >
                <Text
                  style={{
                    fontSize: tooltip?.fontSize || 12,
                    color: tooltip?.textColor || theme.colors.textPrimary,
                    fontFamily: theme.fontFamily,
                  }}
                >
                  {tooltip?.formatter?.(selectedPoint) ||
                    (selectedPoint.label
                      ? `${selectedPoint.label}: ${formatNumber(selectedPoint.x)}, ${formatNumber(selectedPoint.y)}`
                      : `(${formatNumber(selectedPoint.x)}, ${formatNumber(selectedPoint.y)})`)}
                </Text>
              </View>
            );
          })()}
        </View>
      </View>

      {/* Unified cross-platform gesture surface (web PointerEvents | native
          Responder). Full-chart overlay so pointer coords are container-origin,
          matching registered mark pixels. Sits below the legend (zIndex 10). */}
      {!disabled && (
        <View
          ref={surfaceRef}
          onLayout={surfaceOnLayout}
          style={{ position: 'absolute', left: 0, top: 0, width, height, zIndex: 1 }}
          {...pointerHandlers}
        />
      )}

      {/* Instructions for interactive features */}
      {allowAddPoints && (
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily,
              textAlign: 'center',
            }}
          >
            Tap to add points
          </Text>
        </View>
      )}

      {/* Legend */}
      {legend?.show && (
        <ChartLegend
          items={chartSeries.map((s, i) => ({
            label: s.name || `Series ${i + 1}`,
            color: s.color || theme.colors.accentPalette[i % theme.colors.accentPalette.length],
            visible: s.visible !== false,
          }))}
          position={legend.position}
          align={legend.align}
          textColor={legend.textColor}
          fontSize={legend.fontSize}
          onItemPress={(item, index, nativeEvent) => {
            const target = chartSeries[index];
            if (!target || !updateSeriesVisibility) return;
            const current = target.visible !== false;
            const isolate = nativeEvent?.shiftKey;
            if (isolate) {
              const visibleIds = chartSeries.filter(s => s.visible !== false).map(s => s.id);
              const isSole = visibleIds.length === 1 && visibleIds[0] === target.id;
              chartSeries.forEach(s => updateSeriesVisibility(s.id, isSole ? true : s.id === target.id));
            } else {
              updateSeriesVisibility(target.id, !current);
            }
          }}
        />
      )}
    </>
  );
};

export const ScatterChart: React.FC<ScatterChartProps> = (props) => {
  const {
    w: width = 400,
    h: height = 300,
    disabled = false,
    animationDuration = 800,
    animationEasing,
    style,
    multiTooltip,
    enableCrosshair,
    liveTooltip,
    useOwnInteractionProvider,
    suppressPopover,
    testID,
  } = props;

  const spacingProps: Partial<Record<SpacingPropKey, number>> = {};
  const spacingSource = props as Record<SpacingPropKey, number | undefined>;
  SPACING_PROP_KEYS.forEach((key) => {
    const value = spacingSource[key];
    if (value != null) {
      spacingProps[key] = value;
    }
  });

  const interactionConfig = useMemo(() => ({
    multiTooltip,
    enableCrosshair: enableCrosshair !== false,
    liveTooltip: liveTooltip !== false,
    enablePanZoom: props.enablePanZoom,
    zoomMode: props.zoomMode,
    minZoom: props.minZoom,
    wheelZoomStep: props.wheelZoomStep,
    resetOnDoubleTap: props.resetOnDoubleTap,
    clampToInitialDomain: props.clampToInitialDomain,
    invertPinchZoom: props.invertPinchZoom,
    invertWheelZoom: props.invertWheelZoom,
  }), [
    multiTooltip,
    enableCrosshair,
    liveTooltip,
    props.enablePanZoom,
    props.zoomMode,
    props.minZoom,
    props.wheelZoomStep,
    props.resetOnDoubleTap,
    props.clampToInitialDomain,
    props.invertPinchZoom,
    props.invertWheelZoom,
  ]);

  return (
    <ChartContainer
      w={width}
      h={height}
      disabled={disabled}
      animationDuration={animationDuration}
      animationEasing={animationEasing}
      style={style}
      interactionConfig={interactionConfig}
      useOwnInteractionProvider={useOwnInteractionProvider}
      suppressPopover={suppressPopover}
      testID={testID}
      {...spacingProps}
    >
      <ScatterChartInner
        {...props}
        w={width}
        h={height}
        disabled={disabled}
        animationDuration={animationDuration}
      />
    </ChartContainer>
  );
};

ScatterChart.displayName = 'ScatterChart';
