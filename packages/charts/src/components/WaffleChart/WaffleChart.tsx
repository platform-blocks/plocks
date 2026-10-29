import React from 'react';
import { View } from 'react-native';
import Svg, { G, Rect as SvgRect } from 'react-native-svg';

import { ChartContainer, ChartLegend, ChartTitle, measureChartLegendBand, measureChartTitleBand, resolveChartLegendPosition } from '../../ChartBase';
import { CellGridHitTester } from '../../core/hittest/grid';
import type { HitSeries, Mark } from '../../core/hittest/types';
import { useActiveTarget, useChartInteractionContext } from '../../interaction/ChartInteractionContext';
import { useChartPointer } from '../../interaction/useChartPointer';
import { useChartTheme, useNumberFormatter } from '../../theme/ChartThemeContext';
import type { ChartInteractionEvent } from '../../types';
import { formatPercentage } from '../../utils';
import { interpolateColor } from '../../utils/colorScale';
import { AnimatedWaffleCell } from './AnimatedWaffleCell';
import type { WaffleChartCell, WaffleChartFillDirection, WaffleChartProps, WaffleChartSegment } from './types';

interface GridCell {
  index: number;
  row: number;
  col: number;
  /** Segment index, or -1 for an empty cell */
  segment: number;
}

/** Grid position of the `index`-th cell in fill order. */
function positionFor(index: number, rows: number, columns: number, direction: WaffleChartFillDirection): { row: number; col: number } {
  switch (direction) {
    case 'left-to-right':
      return { row: Math.floor(index / columns), col: index % columns };
    case 'right-to-left':
      return { row: Math.floor(index / columns), col: columns - 1 - (index % columns) };
    case 'top-to-bottom':
      return { row: index % rows, col: Math.floor(index / rows) };
    case 'bottom-to-top':
    default:
      return { row: rows - 1 - (index % rows), col: Math.floor(index / rows) };
  }
}

/**
 * Cells per segment, proportional to value, by largest remainder so the counts
 * add up to exactly the cells the data is entitled to.
 */
function allocateCells(data: WaffleChartCell[], total: number, cellCount: number): number[] {
  if (total <= 0 || cellCount <= 0) return data.map(() => 0);
  const exact = data.map((d) => (Math.max(0, d.value) / total) * cellCount);
  const counts = exact.map(Math.floor);
  const target = Math.min(cellCount, Math.round(exact.reduce((sum, v) => sum + v, 0)));
  let remaining = target - counts.reduce((sum, v) => sum + v, 0);
  const byRemainder = exact
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .filter((e) => e.rem > 0)
    .sort((a, b) => b.rem - a.rem);
  for (const { i } of byRemainder) {
    if (remaining <= 0) break;
    counts[i] += 1;
    remaining -= 1;
  }
  return counts;
}

export const WaffleChart: React.FC<WaffleChartProps> = (props) => {
  const {
    data,
    w: width = 320,
    h: height = 0,
    title,
    subtitle,
    total: totalProp,
    rows = 10,
    columns = 10,
    gap = 4,
    cellRadius = 2,
    fillDirection = 'bottom-to-top',
    emptyColor,
    legend,
    tooltip,
    disableAnimation = false,
    accessibilityLabel,
    style,
    onPress,
    onDataPointPress,
    ...rest
  } = props;

  const theme = useChartTheme();
  const formatValue = useNumberFormatter();

  const sum = React.useMemo(() => data.reduce((acc, d) => acc + Math.max(0, d.value), 0), [data]);
  const total = totalProp != null && totalProp > sum ? totalProp : sum;
  const cellCount = Math.max(0, rows * columns);

  const segments = React.useMemo<WaffleChartSegment[]>(() => {
    const counts = allocateCells(data, total, cellCount);
    const palette = theme.colors.accentPalette;
    return data.map((d, i) => ({
      ...d,
      color: d.color ?? palette[i % palette.length],
      count: counts[i],
      percentage: total > 0 ? Math.max(0, d.value) / total : 0,
    }));
  }, [data, total, cellCount, theme.colors.accentPalette]);

  const grid = React.useMemo<GridCell[]>(() => {
    const cells: GridCell[] = [];
    let segmentIndex = 0;
    let usedInSegment = 0;
    for (let index = 0; index < cellCount; index += 1) {
      while (segmentIndex < segments.length && usedInSegment >= segments[segmentIndex].count) {
        segmentIndex += 1;
        usedInSegment = 0;
      }
      const segment = segmentIndex < segments.length ? segmentIndex : -1;
      if (segment >= 0) usedInSegment += 1;
      cells.push({ index, segment, ...positionFor(index, rows, columns, fillDirection) });
    }
    return cells;
  }, [cellCount, segments, rows, columns, fillDirection]);

  // --- Layout ----------------------------------------------------------------
  const legendShown = legend?.show !== false && segments.length > 0;
  const legendItems = React.useMemo(
    () => (legend?.items ?? segments.map((s) => ({ label: s.name, color: s.color }))),
    [legend?.items, segments]
  );
  const legendPosition = resolveChartLegendPosition(legend?.position, width);
  const legendBand = measureChartLegendBand({
    items: legendShown ? legendItems : undefined,
    containerWidth: width,
    position: legendPosition,
    fontSize: legend?.fontSize,
  });
  const titleBand = measureChartTitleBand(title, subtitle, { containerWidth: width });
  const PAD = 8;

  const plotLeft = PAD + legendBand.left;
  const plotTop = Math.max(PAD, titleBand) + legendBand.top;
  const availableWidth = Math.max(0, width - plotLeft - PAD - legendBand.right);
  const cellFromWidth = columns > 0 ? (availableWidth - gap * (columns - 1)) / columns : 0;
  let cell: number;
  if (height > 0) {
    const availableHeight = Math.max(0, height - plotTop - PAD - legendBand.bottom);
    const cellFromHeight = rows > 0 ? (availableHeight - gap * (rows - 1)) / rows : 0;
    cell = Math.max(1, Math.floor(Math.min(cellFromWidth, cellFromHeight)));
  } else {
    cell = Math.max(1, Math.floor(cellFromWidth));
  }
  const gridWidth = columns * cell + gap * Math.max(columns - 1, 0);
  const gridHeight = rows * cell + gap * Math.max(rows - 1, 0);
  const boxHeight = height > 0 ? height : plotTop + gridHeight + PAD + legendBand.bottom;
  // Centre the grid in whatever room is left over.
  const originX = plotLeft + Math.max(0, (availableWidth - gridWidth) / 2);
  const originY = plotTop + Math.max(0, (boxHeight - plotTop - PAD - legendBand.bottom - gridHeight) / 2);

  // --- Interaction -----------------------------------------------------------
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
    grid.forEach((g) => {
      if (g.segment < 0) return;
      const segment = segments[g.segment];
      const x = originX + g.col * (cell + gap);
      const y = originY + g.row * (cell + gap);
      const custom = tooltipFormatter?.(segment);
      marks.push({
        id: g.index,
        pixel: { x: x + cell / 2, y: y + cell / 2 },
        value: segment.value,
        datum: segment,
        label: segment.name,
        color: segment.color,
        extent: { rect: { x, y, width: cell, height: cell }, cell: { row: g.row, col: g.col } },
        formattedValue:
          typeof custom === 'string' ? custom : `${formatValue(segment.value)} · ${formatPercentage(segment.percentage, 1)}`,
        ...(custom != null && typeof custom !== 'string' ? { customTooltip: custom } : {}),
      });
    });
    return [{ id: 'waffle', name: title || 'Waffle', visible: true, marks }];
  }, [grid, segments, originX, originY, cell, gap, tooltipFormatter, formatValue, title]);

  const tester = React.useMemo(() => new CellGridHitTester(hitSeries), [hitSeries]);

  React.useEffect(() => {
    if (!register) return;
    register('waffle', { frame: { kind: 'cartesian' } as any, geometry: { kind: 'cell' }, series: hitSeries });
    return () => register('waffle', null);
  }, [register, hitSeries]);

  const interactive = Boolean(interaction) && tooltipShown && hitSeries[0].marks.length > 0;
  const { handlers: pointerHandlers, ref: surfaceRef, onLayout: surfaceOnLayout } = useChartPointer({
    padding: { top: originY, left: originX, right: 0, bottom: 0 },
    plotWidth: gridWidth,
    plotHeight: gridHeight,
    enabled: interactive,
    hover: true,
    press: Boolean(onDataPointPress || onPress),
    tester,
    onPress: (e, target) => {
      if (!target) return;
      const datum = target.datum as WaffleChartSegment;
      const event: ChartInteractionEvent<WaffleChartSegment> = {
        nativeEvent: e.raw,
        chartX: gridWidth > 0 ? e.plotX / gridWidth : 0,
        chartY: gridHeight > 0 ? e.plotY / gridHeight : 0,
        dataPoint: datum,
        distance: target.distance,
      };
      onDataPointPress?.(datum, event);
      onPress?.(event);
    },
  });

  // Hovering any cell highlights its whole segment.
  const { activeTarget } = useActiveTarget();
  const activeSegment = activeTarget?.seriesId === 'waffle' ? (activeTarget.datum as WaffleChartSegment | undefined) : undefined;

  const emptyFill = emptyColor ?? interpolateColor(theme.colors.textPrimary, theme.colors.background, 0.88);
  const animationDisabled = disableAnimation || cellCount > 400;
  const summary = React.useMemo(
    () => segments.map((s) => `${s.name} ${formatValue(s.value)}`).join(', '),
    [segments, formatValue]
  );

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
        <G>
          {grid.map((g) => {
            const x = originX + g.col * (cell + gap);
            const y = originY + g.row * (cell + gap);
            if (g.segment < 0) {
              return <SvgRect key={g.index} x={x} y={y} width={cell} height={cell} rx={cellRadius} ry={cellRadius} fill={emptyFill} />;
            }
            const segment = segments[g.segment];
            return (
              <AnimatedWaffleCell
                key={g.index}
                testID={`waffle-cell-${g.index}`}
                x={x}
                y={y}
                size={cell}
                radius={cellRadius}
                fill={segment.color}
                index={g.index}
                total={cellCount}
                disabled={animationDisabled}
                highlighted={activeSegment != null && activeSegment.name === segment.name}
                stroke={theme.colors.textPrimary}
              />
            );
          })}
        </G>
      </Svg>
      {legendShown && (
        <ChartLegend
          items={legendItems}
          position={legendPosition}
          align={legend?.align}
          textColor={legend?.textColor}
          fontSize={legend?.fontSize}
          style={
            legendPosition === 'left' || legendPosition === 'right'
              ? { maxWidth: legendBand[legendPosition], top: titleBand }
              : { maxHeight: legendBand[legendPosition], ...(legendPosition === 'top' ? { top: titleBand } : null) }
          }
        />
      )}
      {interactive && (
        <View
          ref={surfaceRef}
          onLayout={surfaceOnLayout}
          testID="waffle-gesture-surface"
          style={{ position: 'absolute', left: 0, top: 0, width, height: boxHeight }}
          {...pointerHandlers}
        />
      )}
    </ChartContainer>
  );
};

WaffleChart.displayName = 'WaffleChart';

export default WaffleChart;
