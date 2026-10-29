import React from 'react';
import { Text as RNText, View } from 'react-native';
import Svg, { G, Rect as SvgRect, Text as SvgText } from 'react-native-svg';

import { ChartContainer, ChartTitle, estimateChartTextWidth, measureChartTitleBand } from '../../ChartBase';
import { CellGridHitTester } from '../../core/hittest/grid';
import type { HitSeries, Mark } from '../../core/hittest/types';
import { useActiveTarget, useChartInteractionContext } from '../../interaction/ChartInteractionContext';
import { useChartPointer } from '../../interaction/useChartPointer';
import { useChartTheme, useNumberFormatter } from '../../theme/ChartThemeContext';
import type { ChartInteractionEvent } from '../../types';
import { clamp } from '../../utils';
import { interpolateColor, interpolateColors } from '../../utils/colorScale';
import type { MatrixChartCell, MatrixChartProps } from './types';

interface PlacedCell {
  key: string;
  row: number;
  col: number;
  x: number;
  y: number;
  cell: MatrixChartCell;
  fill: string;
}

const MIN_AUTO_CELL = 12;
const MAX_AUTO_CELL = 40;
const LEGEND_SWATCH = 12;
const LEGEND_GAP = 10;
const PAD = 8;

const uniqueInOrder = (values: string[]) => Array.from(new Set(values));

export const MatrixChart: React.FC<MatrixChartProps> = (props) => {
  const {
    data,
    w: width = 320,
    h: height = 0,
    title,
    subtitle,
    xLabels: xLabelsProp,
    yLabels: yLabelsProp,
    withXLabels = true,
    withYLabels = true,
    xLabelsPosition = 'bottom',
    xLabelsRotation = 0,
    xLabelsHeight,
    yLabelsWidth,
    fontSize = 11,
    colors: colorsProp,
    domain: domainProp,
    emptyColor,
    cellSize,
    gap = 2,
    cellRadius = 2,
    getCellProps,
    tooltip,
    legend,
    accessibilityLabel,
    style,
    onPress,
    onDataPointPress,
    ...rest
  } = props;

  const theme = useChartTheme();
  const formatValue = useNumberFormatter();

  const xLabels = React.useMemo(() => xLabelsProp ?? uniqueInOrder(data.map((d) => d.x)), [xLabelsProp, data]);
  const yLabels = React.useMemo(() => yLabelsProp ?? uniqueInOrder(data.map((d) => d.y)), [yLabelsProp, data]);
  const columns = xLabels.length;
  const rows = yLabels.length;

  const lookup = React.useMemo(() => {
    const map = new Map<string, MatrixChartCell>();
    data.forEach((d) => map.set(`${d.x}\u0000${d.y}`, d));
    return map;
  }, [data]);

  const values = React.useMemo(
    () => data.map((d) => d.value).filter((v): v is number => typeof v === 'number' && Number.isFinite(v)),
    [data]
  );
  const domain = React.useMemo<[number, number]>(() => {
    if (domainProp) return domainProp;
    if (!values.length) return [0, 1];
    return [Math.min(...values), Math.max(...values)];
  }, [domainProp, values]);

  const colors = React.useMemo(() => {
    if (colorsProp?.length) return colorsProp;
    const base = theme.colors.accentPalette[0];
    return [
      interpolateColor(base, theme.colors.background, 0.78),
      interpolateColor(base, theme.colors.background, 0.45),
      base,
      interpolateColor(base, theme.colors.textPrimary, 0.3),
    ];
  }, [colorsProp, theme.colors.accentPalette, theme.colors.background, theme.colors.textPrimary]);

  const colorFor = React.useCallback(
    (value: number) => {
      const [lo, hi] = domain;
      const t = hi === lo ? 1 : clamp((value - lo) / (hi - lo), 0, 1);
      return interpolateColors(colors, t);
    },
    [colors, domain]
  );
  const emptyFill = emptyColor ?? interpolateColor(theme.colors.textPrimary, theme.colors.background, 0.9);

  // --- Layout ----------------------------------------------------------------
  const labelColor = theme.colors.textSecondary;
  const yBand = React.useMemo(() => {
    if (!withYLabels || rows === 0) return 0;
    if (yLabelsWidth != null) return yLabelsWidth;
    const widest = yLabels.reduce((max, label) => Math.max(max, estimateChartTextWidth(label, fontSize)), 0);
    return Math.ceil(widest) + 8;
  }, [withYLabels, rows, yLabelsWidth, yLabels, fontSize]);

  const rotation = ((xLabelsRotation % 360) + 360) % 360;
  const radians = (rotation * Math.PI) / 180;
  const xBand = React.useMemo(() => {
    if (!withXLabels || columns === 0) return 0;
    if (xLabelsHeight != null) return xLabelsHeight;
    const widest = xLabels.reduce((max, label) => Math.max(max, estimateChartTextWidth(label, fontSize)), 0);
    const extent = Math.abs(Math.sin(radians)) * widest + Math.abs(Math.cos(radians)) * fontSize * 1.2;
    return Math.ceil(extent) + 8;
  }, [withXLabels, columns, xLabelsHeight, xLabels, fontSize, radians]);

  const legendShown = legend?.show === true;
  const legendBand = legendShown ? LEGEND_SWATCH + LEGEND_GAP + 6 : 0;
  const titleBand = measureChartTitleBand(title, subtitle, { containerWidth: width });

  const gridLeft = PAD + yBand;
  const availableWidth = Math.max(0, width - gridLeft - PAD);
  const autoCell = columns > 0 ? Math.floor((availableWidth - gap * (columns - 1)) / columns) : MIN_AUTO_CELL;
  // An explicit cellSize is the natural size; like auto cells, it shrinks to fit
  // the width, down to MIN_AUTO_CELL, past which the chart keeps its width.
  const cell =
    cellSize != null
      ? Math.max(Math.min(cellSize, autoCell), Math.min(cellSize, MIN_AUTO_CELL))
      : clamp(autoCell, MIN_AUTO_CELL, MAX_AUTO_CELL);
  const gridWidth = columns * cell + gap * Math.max(columns - 1, 0);
  const gridHeight = rows * cell + gap * Math.max(rows - 1, 0);
  const gridTop = Math.max(PAD, titleBand) + (xLabelsPosition === 'top' ? xBand : 0);
  const contentHeight = gridTop + gridHeight + (xLabelsPosition === 'bottom' ? xBand : 0) + legendBand + PAD;
  const boxHeight = Math.max(height, contentHeight);
  const boxWidth = Math.max(width, gridLeft + gridWidth + PAD);

  const placed = React.useMemo<PlacedCell[]>(() => {
    const out: PlacedCell[] = [];
    yLabels.forEach((y, row) => {
      xLabels.forEach((x, col) => {
        const found = lookup.get(`${x}\u0000${y}`) ?? { x, y, value: null };
        const hasValue = typeof found.value === 'number' && Number.isFinite(found.value);
        out.push({
          key: `${col}-${row}`,
          row,
          col,
          x: gridLeft + col * (cell + gap),
          y: gridTop + row * (cell + gap),
          cell: found,
          fill: hasValue ? colorFor(found.value as number) : emptyFill,
        });
      });
    });
    return out;
  }, [xLabels, yLabels, lookup, gridLeft, gridTop, cell, gap, colorFor, emptyFill]);

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
    const marks: Mark[] = placed.map((p) => {
      const custom = tooltipFormatter?.(p.cell);
      const hasValue = typeof p.cell.value === 'number';
      return {
        id: p.key,
        pixel: { x: p.x + cell / 2, y: p.y + cell / 2 },
        value: hasValue ? (p.cell.value as number) : 0,
        datum: p.cell,
        label: `${p.cell.y} · ${p.cell.x}`,
        color: p.fill,
        extent: { rect: { x: p.x, y: p.y, width: cell, height: cell }, cell: { row: p.row, col: p.col } },
        formattedValue: typeof custom === 'string' ? custom : hasValue ? formatValue(p.cell.value as number) : 'No data',
        ...(custom != null && typeof custom !== 'string' ? { customTooltip: custom } : {}),
      };
    });
    return [{ id: 'matrix', name: title || 'Matrix', visible: true, marks }];
  }, [placed, cell, tooltipFormatter, formatValue, title]);

  const tester = React.useMemo(() => new CellGridHitTester(hitSeries), [hitSeries]);

  React.useEffect(() => {
    if (!register) return;
    register('matrix', { frame: { kind: 'cartesian' } as any, geometry: { kind: 'cell' }, series: hitSeries });
    return () => register('matrix', null);
  }, [register, hitSeries]);

  const interactive = Boolean(interaction) && tooltipShown && placed.length > 0;
  const { handlers: pointerHandlers, ref: surfaceRef, onLayout: surfaceOnLayout } = useChartPointer({
    padding: { top: gridTop, left: gridLeft, right: 0, bottom: 0 },
    plotWidth: gridWidth,
    plotHeight: gridHeight,
    enabled: interactive,
    hover: true,
    press: Boolean(onDataPointPress || onPress),
    tester,
    onPress: (e, target) => {
      if (!target) return;
      const datum = target.datum as MatrixChartCell;
      const event: ChartInteractionEvent<MatrixChartCell> = {
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

  const { activeTarget } = useActiveTarget();
  const activeKey = activeTarget?.seriesId === 'matrix' ? activeTarget.markId : undefined;

  // Column labels anchor toward the grid when rotated, so they hang off their cell.
  const xAnchor: 'start' | 'middle' | 'end' =
    rotation === 0 || rotation === 180 ? 'middle' : (rotation > 180) === (xLabelsPosition === 'bottom') ? 'end' : 'start';
  const xLabelY = xLabelsPosition === 'bottom' ? gridTop + gridHeight + 6 : gridTop - 6;
  const xLabelBaseline = rotation === 0 ? (xLabelsPosition === 'bottom' ? fontSize : 0) : fontSize * 0.35;

  const legendX =
    legend?.align === 'start' ? gridLeft : legend?.align === 'end' ? gridLeft + gridWidth - colors.length * (LEGEND_SWATCH + 3) : gridLeft + (gridWidth - colors.length * (LEGEND_SWATCH + 3)) / 2;
  const legendY = boxHeight - PAD - LEGEND_SWATCH;

  const summary = React.useMemo(() => `${rows} by ${columns} matrix`, [rows, columns]);

  return (
    <ChartContainer
      {...rest}
      w={boxWidth}
      h={boxHeight}
      style={style}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? summary}
      interactionConfig={{ multiTooltip: false, liveTooltip: false }}
    >
      {(title || subtitle) && <ChartTitle title={title} subtitle={subtitle} />}
      <Svg width={boxWidth} height={boxHeight} style={{ position: 'absolute' }} pointerEvents="none">
        <G>
          {placed.map((p) => {
            const extra = getCellProps?.(p.cell);
            const highlighted = activeKey === p.key;
            return (
              <SvgRect
                key={p.key}
                testID={`matrix-cell-${p.key}`}
                x={p.x}
                y={p.y}
                width={cell}
                height={cell}
                rx={cellRadius}
                ry={cellRadius}
                fill={p.fill}
                stroke={highlighted ? theme.colors.textPrimary : 'none'}
                strokeWidth={highlighted ? 1.5 : 0}
                {...extra}
              />
            );
          })}
        </G>
        {withYLabels &&
          yLabels.map((label, row) => (
            <SvgText
              key={`y-${row}`}
              x={gridLeft - 6}
              y={gridTop + row * (cell + gap) + cell / 2 + fontSize * 0.35}
              fontSize={fontSize}
              fill={labelColor}
              fontFamily={theme.fontFamily}
              textAnchor="end"
            >
              {label}
            </SvgText>
          ))}
        {withXLabels &&
          xLabels.map((label, col) => {
            const cx = gridLeft + col * (cell + gap) + cell / 2;
            return (
              <SvgText
                key={`x-${col}`}
                x={cx}
                y={xLabelY + xLabelBaseline}
                fontSize={fontSize}
                fill={labelColor}
                fontFamily={theme.fontFamily}
                textAnchor={xAnchor}
                transform={rotation ? `rotate(${rotation} ${cx} ${xLabelY + xLabelBaseline})` : undefined}
              >
                {label}
              </SvgText>
            );
          })}
        {legendShown &&
          colors.map((color, i) => (
            <SvgRect
              key={`legend-${i}`}
              x={legendX + i * (LEGEND_SWATCH + 3)}
              y={legendY}
              width={LEGEND_SWATCH}
              height={LEGEND_SWATCH}
              rx={2}
              ry={2}
              fill={color}
            />
          ))}
      </Svg>
      {legendShown && (
        <>
          <RNText
            style={{ position: 'absolute', right: boxWidth - legendX + 6, top: legendY - 1, fontSize, color: labelColor, fontFamily: theme.fontFamily }}
          >
            {legend?.labels?.[0] ?? 'Less'}
          </RNText>
          <RNText
            style={{ position: 'absolute', left: legendX + colors.length * (LEGEND_SWATCH + 3) + 3, top: legendY - 1, fontSize, color: labelColor, fontFamily: theme.fontFamily }}
          >
            {legend?.labels?.[1] ?? 'More'}
          </RNText>
        </>
      )}
      {interactive && (
        <View
          ref={surfaceRef}
          onLayout={surfaceOnLayout}
          testID="matrix-gesture-surface"
          style={{ position: 'absolute', left: 0, top: 0, width: boxWidth, height: boxHeight }}
          {...pointerHandlers}
        />
      )}
    </ChartContainer>
  );
};

MatrixChart.displayName = 'MatrixChart';

export default MatrixChart;
