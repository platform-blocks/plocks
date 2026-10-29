import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Path, G, Defs } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  withTiming, 
  useAnimatedProps, 
  Easing,
  withDelay,
  SharedValue
} from 'react-native-reanimated';
import { LineChartSeries } from '../LineChart/types';
import { StackedAreaChartProps } from './types';
import { ChartDataPoint } from '../../types';
import { ChartContainer, ChartTitle, ChartLegend , withChartBandPadding, measureChartBrushBand, CHART_BRUSH_GAP, CHART_BRUSH_HEIGHT } from '../../ChartBase';
import { ChartBrush, inferBrushStep, pickBrushSeries, sliceToBrushWindow, useChartBrushRange } from '../ChartBrush/ChartBrush';
import { resolveCartesianPadding, domainTickLabels } from '../../core/axisLayout';
import { useChartInteractionContext, usePointer, useActiveTarget } from '../../interaction/ChartInteractionContext';
import { useChartPointer } from '../../interaction/useChartPointer';
import { PointSeriesHitTester } from '../../core/hittest/point';
import type { HitSeries, Mark } from '../../core/hittest/types';
import { useChartTheme } from '../../theme/ChartThemeContext';
import { 
  getMultiSeriesDomain, 
  scaleLinear, 
  scaleLog, 
  scaleTime, 
  generateTicks, 
  createSmoothPath, 
  getColorFromScheme, 
  createTickFormatter
} from '../../utils';
import { ChartGrid } from '../../core/ChartGrid';
import { ChartGradientDef, isChartGradient, useChartFillId, type ChartGradient } from '../../core/ChartFill';
import { Axis } from '../../core/Axis';
import { ReferenceAreas, ReferenceDots, ReferenceLines, numericReference, type ReferenceMarkScales } from '../../core/ReferenceMarks';
import type { Scale } from '../../utils/scales';


interface StackedPoint { 
  x: number; 
  y0: number; 
  y1: number; 
  raw?: ChartDataPoint; 
  absoluteY0: number;
  absoluteY1: number;
}

interface StackedSeries { 
  id: any; 
  name?: string; 
  color: string; 
  /** Gradient area fill from the series' `fillColor`, when it is one */
  fill?: ChartGradient;
  points: StackedPoint[]; 
  visible: boolean; 
}

interface StackedLayer {
  id: any;
  name?: string;
  color: string;
  fill?: ChartGradient;
  path: string;
  smooth: boolean;
  points: StackedPoint[];
  visible: boolean;
  index: number;
}

// Create animated SVG components
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Custom hook for stacked data processing
const useStackedData = (
  series: LineChartSeries[], 
  stackOrder: 'normal' | 'reverse', 
  interaction: ReturnType<typeof useChartInteractionContext> | null,
  palette: string[]
) => {
  return useMemo(() => {
    const xValues = Array.from(
      new Set(series.filter(s => s.visible !== false).flatMap(s => s.data.map(p => p.x)))
    ).sort((a, b) => a - b);

    const order = stackOrder === 'reverse' ? [...series].reverse() : series;
    const layers: StackedSeries[] = [];
    const runningTotals: number[] = new Array(xValues.length).fill(0);

    order.forEach((s, si) => {
      const overriddenVisible = interaction?.series.find(sr => sr.id === (s.id ?? si))?.visible;
      if (s.visible === false || overriddenVisible === false) return;
      
      const color = s.color || getColorFromScheme(si, palette);
      const points: StackedPoint[] = xValues.map((x, idx) => {
        const raw = s.data.find(p => p.x === x);
        const val = raw ? raw.y : 0;
        const y0 = runningTotals[idx];
        const y1 = y0 + val;
        runningTotals[idx] = y1;
        return {
          x,
          y0,
          y1,
          raw: raw || { x, y: 0 },
          absoluteY0: y0,
          absoluteY1: y1,
        };
      });
      
      layers.push({
        id: s.id ?? si,
        name: s.name,
        color,
        fill: isChartGradient(s.fillColor) ? s.fillColor : undefined,
        points,
        visible: overriddenVisible !== undefined ? overriddenVisible : (s.visible ?? true)
      });
    });

    return { layers, totals: runningTotals, xValues };
  }, [series, stackOrder, interaction?.series, palette]);
};

// Custom hook for generating area paths
const useStackedAreaPaths = (
  layers: StackedSeries[],
  scaleX: (v: number) => number,
  scaleY: (v: number) => number,
  smooth: boolean
) => {
  return useMemo(() => {
    return layers.map((layer, index) => {
      const topPoints = layer.points.map(p => ({ x: scaleX(p.x), y: scaleY(p.y1) }));
      const bottomPoints = [...layer.points].reverse().map(p => ({ x: scaleX(p.x), y: scaleY(p.y0) }));
      
      let path = '';
      if (topPoints.length > 0) {
        if (smooth) {
          // For smooth curves, we need to create a proper area path
          const topPath = createSmoothPath(topPoints);
          const bottomPath = createSmoothPath(bottomPoints);
          
          // Extract the path commands without the initial M
          const topCommands = topPath.replace(/^M\s*/, '');
          const bottomCommands = bottomPath.replace(/^M\s*/, '');
          
          path = `M ${topPoints[0].x} ${topPoints[0].y} ${topCommands} L ${bottomPoints[0].x} ${bottomPoints[0].y} ${bottomCommands} Z`;
        } else {
          // Linear path
          path = `M ${topPoints[0].x} ${topPoints[0].y}`;
          for (let i = 1; i < topPoints.length; i++) {
            path += ` L ${topPoints[i].x} ${topPoints[i].y}`;
          }
          for (let i = 0; i < bottomPoints.length; i++) {
            path += ` L ${bottomPoints[i].x} ${bottomPoints[i].y}`;
          }
          path += ' Z';
        }
      }
      
      return {
        id: layer.id,
        name: layer.name,
        color: layer.color,
        fill: layer.fill,
        path,
        smooth,
        points: layer.points,
        visible: layer.visible,
        index
      } as StackedLayer;
    });
  }, [layers, scaleX, scaleY, smooth]);
};

// AnimatedStackedArea component - encapsulates animation logic
const AnimatedStackedArea: React.FC<{
  layer: StackedLayer;
  /** Gradient url for the fill; the layer color otherwise */
  paint?: string;
  opacity: number;
  animationProgress: SharedValue<number>;
  disabled: boolean;
  onHover?: () => void;
  onHoverOut?: () => void;
}> = React.memo(({ layer, paint, opacity, animationProgress, disabled, onHover, onHoverOut }) => {
  const scale = useSharedValue(disabled ? 1 : 0);
  
  useEffect(() => {
    if (disabled) {
      scale.value = 1;
      return;
    }
    
    const delay = layer.index * 100; // Stagger animation by layer index
    scale.value = withDelay(delay, withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    }));
  }, [disabled, layer.index, scale]);

  const animatedProps = useAnimatedProps(() => {
    const progress = animationProgress.value * scale.value;
    const finalOpacity = opacity * (1 - layer.index * 0.05); // Slight opacity variation by layer
    
    return {
      d: layer.path,
      opacity: progress * finalOpacity,
    } as any;
  }, [layer.path, opacity, layer.index]);

  const isWeb = Platform.OS === 'web';

  return (
    <G
      {...(isWeb ? {
        onMouseEnter: onHover,
        onMouseLeave: onHoverOut,
      } : {})}
    >
      <AnimatedPath
        animatedProps={animatedProps}
        fill={paint ?? layer.color}
        stroke={layer.color}
        strokeWidth={1}
      />
    </G>
  );
});

AnimatedStackedArea.displayName = 'AnimatedStackedArea';

export const StackedAreaChart: React.FC<StackedAreaChartProps> = (props) => {
  const {
    series,
    w: width = 400,
    h: height = 300,
    title,
    subtitle,
    xAxis,
    yAxis,
    grid,
    legend,
    smooth = true,
    opacity = 0.55,
    stackMode = 'absolute',
    xScaleType = 'linear',
    yScaleType = 'linear',
    animationDuration = 800,
    style,
    enableCrosshair,
    liveTooltip,
    multiTooltip,
    enablePanZoom,
    zoomMode,
    minZoom,
    enableWheelZoom,
    wheelZoomStep,
    invertWheelZoom,
    resetOnDoubleTap,
    clampToInitialDomain,
    invertPinchZoom,
    disabled = false,
    stackOrder = 'normal',
    referenceLines,
    referenceAreas,
    referenceDots,
    withBrush = false,
    brushProps,
    brushRange,
    onBrushChange,
    ...rest
  } = props;
  const isStream = stackMode === 'stream';
  // A streamgraph's y values are offsets around a moving centerline, so the y axis
  // and its gridlines carry no meaning — hidden unless `yAxis.show` opts back in.
  const showYAxis = isStream ? yAxis?.show === true : yAxis?.show !== false;
  const theme = useChartTheme();
  const fillIdPrefix = useChartFillId('stacked-area-fill');

  let interaction: ReturnType<typeof useChartInteractionContext> | null = null;
  try {
    interaction = useChartInteractionContext();
  } catch {
    interaction = null;
  }

  const register = interaction?.register;
  const updateSeriesVisibility = interaction?.updateSeriesVisibility;

  // Live pointer + resolved target drive a cursor-tracking crosshair (snaps to the
  // nearest x when a target is resolved, else follows the raw pointer). usePointer
  // re-renders per-frame during hover — acceptable for a cursor-following visual.
  const pointer = usePointer();
  const { activeTarget } = useActiveTarget();

  // Use custom hooks for data processing
  const stackedData = useStackedData(series, stackOrder, interaction, theme.colors.accentPalette);
  const { layers: rawLayers, totals, xValues } = stackedData;

  // Brush: the selected x window is the domain the plot draws.
  const fullXDomain: [number, number] = useMemo(() => [xValues[0] ?? 0, xValues[xValues.length - 1] ?? 1], [xValues]);
  const brush = useChartBrushRange({
    domain: fullXDomain,
    value: brushRange,
    start: withBrush ? brushProps?.start : undefined,
    end: withBrush ? brushProps?.end : undefined,
    onChange: [onBrushChange, brushProps?.onChange],
  });
  const xWindowed = (withBrush || brushRange !== undefined) && brush.active;
  const xDomain: [number, number] = xWindowed ? brush.range : fullXDomain;

  const stackedLayers = useMemo(() => {
    if (stackMode === 'stream') {
      // Silhouette offset: shift every x's stack down by half its total so the
      // stack is centered on y = 0 (d3's stackOffsetSilhouette). The absolute*
      // fields keep the un-offset values for tooltips.
      return rawLayers.map((layer) => ({
        ...layer,
        points: layer.points.map((point, idx) => {
          const offset = -(totals[idx] ?? 0) / 2;
          return { ...point, y0: point.absoluteY0 + offset, y1: point.absoluteY1 + offset };
        }),
      }));
    }

    if (stackMode !== 'percentage') {
      return rawLayers;
    }

    return rawLayers.map((layer) => {
      const normalizedPoints = layer.points.map((point, idx) => {
        const total = totals[idx];
        if (!total) {
          return {
            ...point,
            y0: 0,
            y1: 0,
          };
        }

        return {
          ...point,
          y0: point.absoluteY0 / total,
          y1: point.absoluteY1 / total,
        };
      });

      return {
        ...layer,
        points: normalizedPoints,
      };
    });
  }, [rawLayers, totals, stackMode]);

  // Only the brushed window (plus a neighbor each side) is drawn, and y refits to it.
  const layers = useMemo(() => (
    xWindowed
      ? stackedLayers.map((layer) => ({ ...layer, points: sliceToBrushWindow(layer.points, (p) => p.x, xDomain) }))
      : stackedLayers
  ), [stackedLayers, xWindowed, xDomain]);
  const windowTotals = useMemo(
    () => (xWindowed ? totals.filter((_, idx) => xValues[idx] >= xDomain[0] && xValues[idx] <= xDomain[1]) : totals),
    [xWindowed, totals, xValues, xDomain]
  );

  const yDomain: [number, number] = useMemo(() => {
    if (stackMode === 'percentage') return [0, 1];
    if (stackMode === 'stream') {
      // Symmetric around 0 so the centerline is the plot's mid-height.
      const half = (Math.max(0, ...windowTotals) || 1) / 2;
      return [-half, half];
    }
    return [0, Math.max(1, ...windowTotals)];
  }, [stackMode, windowTotals]);

  // Margins measured from the labels that will be drawn, rather than a fixed
  // reserve that was a third of the width on a narrow chart.
  const basePadding = useMemo(
    () => resolveCartesianPadding({
      yTickLabels: domainTickLabels(yDomain, yAxis?.labelFormatter
        ?? (yScaleType === 'time' ? (value: number) => new Date(value).toLocaleDateString() : undefined), theme.numberFormat),
      xTickLabels: domainTickLabels(xDomain, xAxis?.labelFormatter
        ?? (xScaleType === 'time' ? (value: number) => new Date(value).toLocaleDateString() : undefined), theme.numberFormat),
      yTitle: yAxis?.title,
      xTitle: xAxis?.title,
      showYAxis,
      showXAxis: xAxis?.show !== false,
      showYTickLabels: yAxis?.showLabels !== false,
      showXTickLabels: xAxis?.showLabels !== false,
      containerWidth: width,
      containerHeight: height,
    }),
    [yDomain, xDomain, yAxis?.labelFormatter, xAxis?.labelFormatter, yAxis?.title, xAxis?.title,
     showYAxis, xAxis?.show, yAxis?.showLabels, xAxis?.showLabels, yScaleType, xScaleType, width, height, theme.numberFormat]
  );
  // Grown so the plot clears the title and legend overlays.
  const legendLabels = useMemo(
    () => layers.map((l) => ({ label: l.name || String(l.id) })),
    [layers]
  );
  const brushHeight = brushProps?.height ?? CHART_BRUSH_HEIGHT;
  const brushBand = measureChartBrushBand(withBrush, brushHeight);
  const padding = useMemo(
    () =>
      withChartBandPadding(basePadding, {
        title,
        subtitle,
        legendItems: legend?.show ? legendLabels : undefined,
        legendPosition: legend?.position,
        legendFontSize: legend?.fontSize,
        containerWidth: width,
        bottomAllowance: brushBand,
      }),
    [basePadding, title, subtitle, legend?.show, legend?.position, legend?.fontSize, legendLabels, width, brushBand]
  );
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Scale functions
  const scaleX = useCallback((v: number) => {
    switch (xScaleType) {
      case 'log': return scaleLog(Math.max(v, 1e-12), xDomain, [0, plotWidth]);
      case 'time': return scaleTime(v, xDomain, [0, plotWidth]);
      default: return scaleLinear(v, xDomain, [0, plotWidth]);
    }
  }, [xScaleType, xDomain, plotWidth]);

  const scaleY = useCallback((v: number) => {
    switch (yScaleType) {
      case 'log': return scaleLog(Math.max(v, 1e-12), yDomain, [plotHeight, 0]);
      case 'time': return scaleTime(v, yDomain, [plotHeight, 0]);
      default: return scaleLinear(v, yDomain, [plotHeight, 0]);
    }
  }, [yScaleType, yDomain, plotHeight]);

  // Generate area paths using custom hook
  const areaPaths = useStackedAreaPaths(layers, scaleX, scaleY, smooth);

  // Reference marks use the drawn scales: stack totals in `absolute`, the 0–1
  // stack fraction in `percentage`, centered offsets (0 = centerline) in `stream`.
  const referenceScales = useMemo<ReferenceMarkScales>(() => ({
    xToPx: numericReference(scaleX),
    yToPx: numericReference(scaleY),
    plotWidth,
    plotHeight,
  }), [scaleX, scaleY, plotWidth, plotHeight]);

  // Animation
  const animationProgress = useSharedValue(disabled ? 1 : 0);
  const hasPlayedIntro = React.useRef(false);
  const dataSignature = useMemo(() => {
    return layers.map(l => 
      `${l.id}-${l.color}-${l.points.map(p => `${p.x}:${p.y1}`).join(',')}`
    ).join('|');
  }, [layers]);

  useEffect(() => {
    if (hasPlayedIntro.current) {
      return;
    }
    hasPlayedIntro.current = true;
    if (disabled) {
      animationProgress.value = 1;
      return;
    }
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [animationProgress, animationDuration, dataSignature, disabled]);

  // New interaction engine: one point hit-series per stacked layer, anchored at
  // the layer's upper edge (y1). Registering all layers lets the shared engine
  // resolve the nearest point on hover and produce a multi-series slice tooltip
  // (every layer's value at the hovered x). Legend visibility is driven separately
  // via updateSeriesVisibility (upsert).
  const hitSeries: HitSeries[] = useMemo(() => layers.map((layer, index) => ({
    id: layer.id,
    name: layer.name || `Series ${index + 1}`,
    color: layer.color,
    visible: layer.visible !== false,
    // Neighbors kept for line continuity sit outside the plot; they are not targets.
    marks: layer.points.flatMap((p, i): Mark[] => (scaleX(p.x) < -0.5 || scaleX(p.x) > plotWidth + 0.5) ? [] : [{
      id: i,
      pixel: { x: scaleX(p.x) + padding.left, y: scaleY(p.y1) + padding.top },
      // The series' own value at this x, never the stacked/offset coordinates.
      value: p.raw?.y ?? p.absoluteY1 - p.absoluteY0,
      datum: p,
      dataX: p.x,
      dataY: p.y1,
      formattedValue: stackMode === 'percentage'
        ? `${((p.y1 - p.y0) * 100).toFixed(1)}%`
        : String(p.raw?.y ?? p.absoluteY1 - p.absoluteY0),
    }]),
  })), [layers, scaleX, scaleY, padding.left, padding.top, stackMode, plotWidth]);

  const tester = useMemo(() => new PointSeriesHitTester(hitSeries), [hitSeries]);

  useEffect(() => {
    if (!register) return;
    register('stacked-area', { frame: { kind: 'cartesian' } as any, geometry: { kind: 'point' }, series: hitSeries });
    return () => register('stacked-area', null);
  }, [register, hitSeries]);

  const { handlers: pointerHandlers, ref: surfaceRef, onLayout: surfaceOnLayout } = useChartPointer({
    padding,
    plotWidth,
    plotHeight,
    enabled: Boolean(interaction) && !disabled,
    hover: liveTooltip !== false,
    press: false,
    tester,
    maxDistance: 40,
  });

  // Generate ticks and scales for axes
  const xTicks = useMemo(() => generateTicks(xDomain[0], xDomain[1], 6), [xDomain]);
  const yTicks = useMemo(() => generateTicks(yDomain[0], yDomain[1], 5), [yDomain]);
  const xTickFormat = useMemo(() => createTickFormatter(xTicks, theme.numberFormat), [xTicks, theme.numberFormat]);
  const yTickFormat = useMemo(() => createTickFormatter(yTicks, theme.numberFormat), [yTicks, theme.numberFormat]);
  const normXTicks = useMemo(() => 
    xTicks.map(t => (plotWidth > 0 ? scaleX(t) / plotWidth : 0)), [xTicks, scaleX, plotWidth]
  );
  const normYTicks = useMemo(() => 
    yTicks.map(t => (plotHeight > 0 ? scaleY(t) / plotHeight : 0)), [yTicks, scaleY, plotHeight]
  );

  const axisScaleX = useMemo<Scale<number>>(() => {
    const range: [number, number] = [0, Math.max(plotWidth, 0)];
    const scale = ((value: number) => scaleX(value)) as Scale<number>;
    scale.domain = () => [...xDomain];
    scale.range = () => [...range];
    scale.ticks = (count?: number) => (xTicks.length ? xTicks : generateTicks(xDomain[0], xDomain[1], count ?? 6));
    return scale;
  }, [scaleX, plotWidth, xDomain, xTicks]);

  const axisScaleY = useMemo<Scale<number>>(() => {
    const range: [number, number] = [Math.max(plotHeight, 0), 0];
    const scale = ((value: number) => scaleY(value)) as Scale<number>;
    scale.domain = () => [...yDomain];
    scale.range = () => [...range];
    scale.ticks = (count?: number) => (yTicks.length ? yTicks : generateTicks(yDomain[0], yDomain[1], count ?? 5));
    return scale;
  }, [scaleY, plotHeight, yDomain, yTicks]);

  const xAxisTickSize = xAxis?.tickLength ?? 4;
  const yAxisTickSize = yAxis?.tickLength ?? 4;
  const axisTickPadding = 4;
  const resolvedTextColor = theme.colors.textSecondary;

  const brushSeries = useMemo(() => {
    if (!withBrush) return [];
    const visible = stackedLayers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      color: layer.color,
      data: layer.points.map((p) => ({ x: p.x, y: p.raw?.y ?? p.absoluteY1 - p.absoluteY0 })),
    }));
    return pickBrushSeries(visible, brushProps?.series);
  }, [withBrush, stackedLayers, brushProps?.series]);
  const brushStep = useMemo(
    () => brushProps?.step ?? (withBrush ? inferBrushStep(xValues, fullXDomain) : 1),
    [brushProps?.step, withBrush, xValues, fullXDomain]
  );
  const brushTraveller = brushProps?.travellerWidth ?? 8;

  const legendItems = layers.map(l => ({ 
    label: l.name || String(l.id), 
    color: l.color, 
    visible: l.visible 
  }));

  return (
    <ChartContainer
      w={width}
      h={height}
      disabled={disabled}
      animationDuration={animationDuration}
      style={style}
      interactionConfig={{
        enablePanZoom,
        zoomMode,
        minZoom,
        enableWheelZoom,
        wheelZoomStep,
        resetOnDoubleTap,
        clampToInitialDomain,
        invertPinchZoom,
        invertWheelZoom,
        enableCrosshair,
        liveTooltip,
        multiTooltip
      }}
      {...rest}
    >
      {(title || subtitle) && <ChartTitle title={title} subtitle={subtitle} />}
      
      {grid && (
        <ChartGrid
          grid={grid}
          plotWidth={plotWidth}
          plotHeight={plotHeight}
          xTicks={normXTicks}
          yTicks={showYAxis || !isStream ? normYTicks : []}
          padding={padding}
          useSVG={true}
        />
      )}

      {/* Stacked Areas */}
      <Svg
        style={{ position: 'absolute', left: padding.left, top: padding.top }}
        width={plotWidth}
        height={plotHeight}
      >
        {areaPaths.some((area) => area.fill) && (
          <Defs>
            {areaPaths.map((area) => area.fill ? (
              <ChartGradientDef
                key={area.index}
                id={`${fillIdPrefix}-${area.index}`}
                gradient={area.fill}
                bounds={area.fill.extent === 'plot' ? { x: 0, y: 0, width: plotWidth, height: plotHeight } : undefined}
              />
            ) : null)}
          </Defs>
        )}

        <ReferenceAreas areas={referenceAreas} scales={referenceScales} />

        <G>
          {areaPaths.map((area, index) => {
            const visible = layers.find(l => l.id === area.id)?.visible !== false;
            if (!visible) return null;
            
            return (
              <AnimatedStackedArea
                key={area.id}
                layer={area}
                paint={area.fill ? `url(#${fillIdPrefix}-${area.index})` : undefined}
                opacity={opacity}
                animationProgress={animationProgress}
                disabled={disabled}
              />
            );
          })}
        </G>

        <ReferenceLines lines={referenceLines} scales={referenceScales} />
        <ReferenceDots dots={referenceDots} scales={referenceScales} />
      </Svg>

      {/* Crosshair — a vertical guide tracking the cursor x across the plot. Snaps to the
          resolved active target's x when one exists, else follows the raw pointer. Pointer
          coords from useChartPointer are container-origin (x = containerX), matching
          activeTarget.pixel.x (scaleX + padding.left), so positioned directly. */}
      {enableCrosshair && pointer?.inside && (() => {
        const rawX = activeTarget?.pixel?.x ?? pointer.x;
        if (!Number.isFinite(rawX)) return null;
        const crosshairX = Math.max(padding.left, Math.min(padding.left + plotWidth, rawX));
        return (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: crosshairX,
              top: padding.top,
              height: plotHeight,
              width: 1,
              backgroundColor: theme.colors.grid || 'rgba(0,0,0,0.2)',
            }}
          />
        );
      })()}

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
            if (xScaleType === 'time') return new Date(numeric).toLocaleDateString();
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

      {showYAxis && plotHeight > 0 && (
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
            if (yScaleType === 'time') return new Date(numeric).toLocaleDateString();
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

      {legend?.show !== false && (
        <ChartLegend
          items={legendItems}
          position={legend?.position}
          align={legend?.align}
          onItemPress={(item, index, nativeEvent) => {
            const layer = layers[index];
            if (!layer || !updateSeriesVisibility) return;
            
            const id = layer.id;
            const override = interaction?.series.find(sr => sr.id === id);
            const current = override ? override.visible !== false : true;
            const isolate = nativeEvent?.shiftKey;
            
            if (isolate) {
              const visibleIds = layers
                .filter((l) => {
                  const layerOverride = interaction?.series.find(sr => sr.id === l.id);
                  return layerOverride ? layerOverride.visible !== false : true;
                })
                .map(l => l.id);
              const isSole = visibleIds.length === 1 && visibleIds[0] === id;
              
              layers.forEach((l) =>
                updateSeriesVisibility(l.id, isSole ? true : l.id === id)
              );
            } else {
              updateSeriesVisibility(id, !current);
            }
          }}
        />
      )}

      {/* Unified cross-platform gesture surface (web PointerEvents | native
          Responder). Full-chart overlay so pointer coords are container-origin,
          matching the registered mark pixels. */}
      {Boolean(interaction) && !disabled && (
        <View
          ref={surfaceRef}
          onLayout={surfaceOnLayout}
          testID="stacked-area-gesture-surface"
          style={{ position: 'absolute', left: 0, top: 0, width, height }}
          {...pointerHandlers}
        />
      )}

      {/* Drawn after the gesture overlay so the strip receives its own drags. */}
      {withBrush && plotWidth > 0 && (
        <ChartBrush
          testID="stacked-area-brush"
          style={{
            position: 'absolute',
            left: padding.left - brushTraveller / 2,
            top: padding.top + plotHeight + basePadding.bottom + CHART_BRUSH_GAP,
          }}
          w={plotWidth + brushTraveller}
          h={brushHeight}
          domain={fullXDomain}
          value={brush.range}
          onChange={brush.setRange}
          series={brushSeries}
          previewType="area"
          step={brushStep}
          travellerWidth={brushTraveller}
          fill={brushProps?.fill}
          stroke={brushProps?.stroke}
          formatValue={brushProps?.formatValue ?? ((value) => {
            if (xAxis?.labelFormatter) return xAxis.labelFormatter(value);
            if (xScaleType === 'time') return new Date(value).toLocaleDateString();
            return xTickFormat(value);
          })}
          disabled={disabled}
        />
      )}
    </ChartContainer>
  );
};

StackedAreaChart.displayName = 'StackedAreaChart';
