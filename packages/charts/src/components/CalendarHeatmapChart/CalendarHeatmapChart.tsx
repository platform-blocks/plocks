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
import { interpolateColor } from '../../utils/colorScale';
import { addDays, daysBetween, parseDateKey, toCalendarDay, toDateKey, weekdayRow } from './dates';
import type { CalendarHeatmapChartDay, CalendarHeatmapChartProps } from './types';

interface DaySlot {
  key: string;
  row: number;
  col: number;
  inRange: boolean;
  day: CalendarHeatmapChartDay;
}

interface MonthMark {
  month: number;
  col: number;
  /** The range's first, possibly partial, month */
  first: boolean;
}

const DEFAULT_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MIN_CELL = 3;
const PAD = 8;
const LEGEND_GAP = 10;
const SERIES_ID = 'calendar-heatmap';

const formatDay = (key: string) => {
  const date = parseDateKey(key);
  if (!date) return key;
  try {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return key;
  }
};

const hasValue = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value !== 0;

export const CalendarHeatmapChart: React.FC<CalendarHeatmapChartProps> = (props) => {
  const {
    data,
    w: width = 600,
    h: height = 0,
    title,
    subtitle,
    startDate,
    endDate,
    firstDayOfWeek = 1,
    rectSize = 10,
    gap = 1,
    rectRadius = 2,
    colors: colorsProp,
    domain: domainProp,
    emptyColor,
    withMonthLabels = true,
    monthLabels = DEFAULT_MONTH_LABELS,
    monthLabelsPosition = 'top',
    withWeekdayLabels = false,
    weekdayLabels = DEFAULT_WEEKDAY_LABELS,
    weekdaysLabelsWidth,
    monthsLabelsHeight,
    fontSize = 11,
    withOutsideDates = true,
    splitMonths = false,
    getRectProps,
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

  // --- Range -----------------------------------------------------------------
  // Keys, not Date objects, drive the memos so a fresh `new Date()` per render
  // doesn't rebuild the calendar.
  const todayKey = toDateKey(new Date());
  const endKey = toDateKey(toCalendarDay(endDate) ?? (parseDateKey(todayKey) as Date));
  const startKey = toDateKey(toCalendarDay(startDate) ?? addDays(parseDateKey(endKey) as Date, -364));
  const [fromKey, toKey] = startKey <= endKey ? [startKey, endKey] : [endKey, startKey];

  const values = React.useMemo(() => {
    const map = new Map<string, number>();
    if (Array.isArray(data)) {
      data.forEach((entry) => {
        const day = toCalendarDay(entry?.date);
        if (!day || typeof entry.value !== 'number' || !Number.isFinite(entry.value)) return;
        const key = toDateKey(day);
        map.set(key, (map.get(key) ?? 0) + entry.value);
      });
    } else if (data) {
      Object.keys(data).forEach((raw) => {
        const day = parseDateKey(raw);
        const value = data[raw];
        if (!day || typeof value !== 'number' || !Number.isFinite(value)) return;
        const key = toDateKey(day);
        map.set(key, (map.get(key) ?? 0) + value);
      });
    }
    return map;
  }, [data]);

  const calendar = React.useMemo(() => {
    const start = parseDateKey(fromKey) as Date;
    const end = parseDateKey(toKey) as Date;
    const gridStart = addDays(start, -weekdayRow(start, firstDayOfWeek));
    const gridEnd = addDays(end, 6 - weekdayRow(end, firstDayOfWeek));
    const firstIn = daysBetween(gridStart, start);
    const lastIn = daysBetween(gridStart, end);
    const total = daysBetween(gridStart, gridEnd) + 1;

    const slots: DaySlot[] = [];
    const months: MonthMark[] = [];
    let col = 0;
    for (let i = 0; i < total; i++) {
      const date = addDays(gridStart, i);
      const row = weekdayRow(date, firstDayOfWeek);
      const inRange = i >= firstIn && i <= lastIn;
      if (i > 0) {
        // A split month starts a fresh column after one empty spacer column.
        if (splitMonths && inRange && i > firstIn && date.getDate() === 1) col += 2;
        else if (row === 0) col += 1;
      }
      if (inRange && (i === firstIn || date.getDate() === 1)) {
        // GitHub labels a month over its first full week; split months and the
        // range's opening month start where their first day is.
        const labelCol = splitMonths || row === 0 || i === firstIn ? col : col + 1;
        months.push({ month: date.getMonth(), col: labelCol, first: i === firstIn });
      }
      if (!inRange && !withOutsideDates) continue;
      const key = toDateKey(date);
      slots.push({ key, row, col, inRange, day: { date: key, value: inRange ? values.get(key) ?? null : null } });
    }
    return { slots, months, columns: col + 1 };
  }, [fromKey, toKey, firstDayOfWeek, splitMonths, withOutsideDates, values]);

  const { slots, columns } = calendar;

  // --- Color -----------------------------------------------------------------
  const visibleValues = React.useMemo(
    () => slots.map((s) => s.day.value).filter(hasValue),
    [slots]
  );
  const domain = React.useMemo<[number, number]>(() => {
    if (domainProp) return domainProp;
    if (!visibleValues.length) return [0, 1];
    return [Math.min(...visibleValues), Math.max(...visibleValues)];
  }, [domainProp, visibleValues]);

  const colors = React.useMemo(() => {
    if (colorsProp?.length) return colorsProp;
    const base = theme.colors.accentPalette[0];
    return [
      interpolateColor(base, theme.colors.background, 0.7),
      interpolateColor(base, theme.colors.background, 0.4),
      base,
      interpolateColor(base, theme.colors.textPrimary, 0.3),
    ];
  }, [colorsProp, theme.colors.accentPalette, theme.colors.background, theme.colors.textPrimary]);

  const emptyFill = emptyColor ?? interpolateColor(theme.colors.textPrimary, theme.colors.background, 0.9);

  const colorFor = React.useCallback(
    (value: number | null) => {
      if (!hasValue(value)) return emptyFill;
      const [lo, hi] = domain;
      const t = hi === lo ? 1 : clamp((value - lo) / (hi - lo), 0, 1);
      return colors[Math.min(colors.length - 1, Math.floor(t * colors.length))];
    },
    [colors, domain, emptyFill]
  );

  // --- Layout ----------------------------------------------------------------
  const labelColor = theme.colors.textSecondary;
  const titleBand = measureChartTitleBand(title, subtitle, { containerWidth: width });

  const weekdayBand = React.useMemo(() => {
    if (!withWeekdayLabels) return 0;
    if (weekdaysLabelsWidth != null) return weekdaysLabelsWidth;
    const widest = weekdayLabels.reduce((max, label) => Math.max(max, estimateChartTextWidth(label ?? '', fontSize)), 0);
    return Math.ceil(widest) + 6;
  }, [withWeekdayLabels, weekdaysLabelsWidth, weekdayLabels, fontSize]);

  const available = Math.max(0, width - PAD - weekdayBand - PAD);
  const gapSpace = gap * Math.max(columns - 1, 0);
  // Fits the natural size when it can; otherwise shrinks cells (gaps stay put)
  // down to MIN_CELL, past which the chart keeps its width and overflows.
  const cell =
    columns * rectSize + gapSpace <= available
      ? rectSize
      : Math.max(Math.min(rectSize, MIN_CELL), Math.floor((available - gapSpace) / Math.max(columns, 1)));
  const radius = Math.min(cell / 2, rectSize > 0 ? (rectRadius * cell) / rectSize : rectRadius);
  const step = cell + gap;
  const gridWidth = columns * cell + gapSpace;
  // Centred under the (centred) title when the box is wider than the calendar.
  const gridLeft = PAD + weekdayBand + Math.floor(Math.max(0, available - gridWidth) / 2);
  const gridHeight = 7 * cell + 6 * gap;

  const monthBand = withMonthLabels ? monthsLabelsHeight ?? Math.ceil(fontSize * 1.2) + 4 : 0;
  const monthsOnTop = monthLabelsPosition !== 'bottom';
  const legendShown = legend?.show === true;
  const swatch = Math.max(8, Math.min(cell, 12));
  const legendBand = legendShown ? swatch + LEGEND_GAP : 0;

  const gridTop = Math.max(PAD, titleBand) + (monthsOnTop ? monthBand : 0);
  const contentHeight = gridTop + gridHeight + (monthsOnTop ? 0 : monthBand) + legendBand + PAD;
  const boxHeight = Math.max(height, contentHeight);
  const boxWidth = Math.max(width, gridLeft + gridWidth + PAD);

  const monthMarks = React.useMemo(() => {
    if (!withMonthLabels) return [];
    const placed: { key: string; label: string; x: number; first: boolean; end: number }[] = [];
    calendar.months.forEach((m, i) => {
      if (m.col >= columns) return;
      const label = monthLabels[m.month] ?? DEFAULT_MONTH_LABELS[m.month];
      const x = gridLeft + m.col * step;
      const mark = { key: `${i}`, label, x, first: m.first, end: x + estimateChartTextWidth(label, fontSize) };
      const prev = placed[placed.length - 1];
      if (prev && x < prev.end + 4) {
        // The opening month is usually a sliver; give way to the full month.
        if (prev.first) placed[placed.length - 1] = mark;
        return;
      }
      placed.push(mark);
    });
    return placed;
  }, [withMonthLabels, calendar.months, columns, monthLabels, gridLeft, step, fontSize]);

  const weekdayRows = React.useMemo(() => {
    if (!withWeekdayLabels) return [];
    const every = step >= fontSize * 1.1 ? 1 : 2;
    const rows: { row: number; label: string }[] = [];
    for (let row = 0; row < 7; row++) {
      if (every === 2 && row % 2 === 0) continue;
      rows.push({ row, label: weekdayLabels[(row + firstDayOfWeek) % 7] ?? '' });
    }
    return rows;
  }, [withWeekdayLabels, step, fontSize, weekdayLabels, firstDayOfWeek]);

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
    slots.forEach((s) => {
      if (!s.inRange) return;
      const x = gridLeft + s.col * step;
      const y = gridTop + s.row * step;
      const custom = tooltipFormatter?.(s.day);
      const valued = typeof s.day.value === 'number';
      marks.push({
        id: s.key,
        pixel: { x: x + cell / 2, y: y + cell / 2 },
        value: valued ? (s.day.value as number) : 0,
        datum: s.day,
        label: formatDay(s.key),
        color: colorFor(s.day.value),
        extent: { rect: { x, y, width: cell, height: cell }, cell: { row: s.row, col: s.col } },
        formattedValue: typeof custom === 'string' ? custom : valued ? formatValue(s.day.value as number) : 'No data',
        ...(custom != null && typeof custom !== 'string' ? { customTooltip: custom } : {}),
      });
    });
    return [{ id: SERIES_ID, name: title || 'Calendar', visible: true, marks }];
  }, [slots, gridLeft, gridTop, step, cell, tooltipFormatter, colorFor, formatValue, title]);

  const tester = React.useMemo(() => new CellGridHitTester(hitSeries), [hitSeries]);

  React.useEffect(() => {
    if (!register) return;
    register(SERIES_ID, { frame: { kind: 'cartesian' } as any, geometry: { kind: 'cell' }, series: hitSeries });
    return () => register(SERIES_ID, null);
  }, [register, hitSeries]);

  const interactive = Boolean(interaction) && tooltipShown && slots.length > 0;
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
      const datum = target.datum as CalendarHeatmapChartDay;
      const event: ChartInteractionEvent<CalendarHeatmapChartDay> = {
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
  const activeKey = activeTarget?.seriesId === SERIES_ID ? activeTarget.markId : undefined;

  // --- Accessibility ---------------------------------------------------------
  const summary = React.useMemo(() => {
    let total = 0;
    let active = 0;
    let max: CalendarHeatmapChartDay | null = null;
    slots.forEach((s) => {
      if (!hasValue(s.day.value)) return;
      total += s.day.value;
      active += 1;
      if (!max || s.day.value > (max.value as number)) max = s.day;
    });
    const range = `Calendar heatmap from ${formatDay(fromKey)} to ${formatDay(toKey)}`;
    if (!max) return `${range}. No values.`;
    const top = max as CalendarHeatmapChartDay;
    return `${range}. Total ${formatValue(total)} across ${active} ${active === 1 ? 'day' : 'days'}; highest ${formatValue(top.value as number)} on ${formatDay(top.date)}.`;
  }, [slots, fromKey, toKey, formatValue]);

  // --- Legend ----------------------------------------------------------------
  const legendColors = [emptyFill, ...colors];
  const legendStrip = legendColors.length * (swatch + 3) - 3;
  const legendX =
    legend?.align === 'start'
      ? gridLeft
      : legend?.align === 'center'
        ? gridLeft + (gridWidth - legendStrip) / 2
        : gridLeft + gridWidth - legendStrip;
  const legendY = boxHeight - PAD - swatch;
  const monthBaseline = monthsOnTop ? gridTop - 5 : gridTop + gridHeight + 3 + fontSize;

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
          {slots.map((s) => {
            const extra = s.inRange ? getRectProps?.(s.day.date, s.day.value) : undefined;
            const highlighted = activeKey === s.key;
            return (
              <SvgRect
                key={s.key}
                testID={`calendar-heatmap-cell-${s.key}`}
                x={gridLeft + s.col * step}
                y={gridTop + s.row * step}
                width={cell}
                height={cell}
                rx={radius}
                ry={radius}
                fill={s.inRange ? colorFor(s.day.value) : emptyFill}
                opacity={s.inRange ? undefined : 0.5}
                stroke={highlighted ? theme.colors.textPrimary : 'none'}
                strokeWidth={highlighted ? 1.5 : 0}
                {...extra}
              />
            );
          })}
        </G>
        {monthMarks.map((m) => (
          <SvgText
            key={`month-${m.key}`}
            testID={`calendar-heatmap-month-${m.key}`}
            x={m.x}
            y={monthBaseline}
            fontSize={fontSize}
            fill={labelColor}
            fontFamily={theme.fontFamily}
            textAnchor="start"
          >
            {m.label}
          </SvgText>
        ))}
        {weekdayRows.map((w) => (
          <SvgText
            key={`weekday-${w.row}`}
            testID={`calendar-heatmap-weekday-${w.row}`}
            x={gridLeft - 6}
            y={gridTop + w.row * step + cell / 2 + fontSize * 0.35}
            fontSize={fontSize}
            fill={labelColor}
            fontFamily={theme.fontFamily}
            textAnchor="end"
          >
            {w.label}
          </SvgText>
        ))}
        {legendShown &&
          legendColors.map((color, i) => (
            <SvgRect
              key={`legend-${i}`}
              testID={`calendar-heatmap-legend-${i}`}
              x={legendX + i * (swatch + 3)}
              y={legendY}
              width={swatch}
              height={swatch}
              rx={Math.min(2, swatch / 2)}
              ry={Math.min(2, swatch / 2)}
              fill={color}
            />
          ))}
      </Svg>
      {legendShown && (
        <>
          <RNText
            style={{
              position: 'absolute',
              right: boxWidth - legendX + 6,
              top: legendY + swatch / 2 - fontSize * 0.65,
              fontSize,
              color: labelColor,
              fontFamily: theme.fontFamily,
            }}
          >
            {legend?.labels?.[0] ?? 'Less'}
          </RNText>
          <RNText
            style={{
              position: 'absolute',
              left: legendX + legendStrip + 6,
              top: legendY + swatch / 2 - fontSize * 0.65,
              fontSize,
              color: labelColor,
              fontFamily: theme.fontFamily,
            }}
          >
            {legend?.labels?.[1] ?? 'More'}
          </RNText>
        </>
      )}
      {interactive && (
        <View
          ref={surfaceRef}
          onLayout={surfaceOnLayout}
          testID="calendar-heatmap-gesture-surface"
          style={{ position: 'absolute', left: 0, top: 0, width: boxWidth, height: boxHeight }}
          {...pointerHandlers}
        />
      )}
    </ChartContainer>
  );
};

CalendarHeatmapChart.displayName = 'CalendarHeatmapChart';

export default CalendarHeatmapChart;
