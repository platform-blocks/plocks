import type { ReactNode } from 'react';

import type { BaseChartProps, ChartInteractionCallbacks, ChartTooltip } from '../../types/base';

/** One entry of the array form of `data`. */
export interface CalendarHeatmapChartEntry {
  /** Calendar day, as 'YYYY-MM-DD' or a `Date` (its local year, month and day are used) */
  date: string | Date;
  /** Value for that day. Entries sharing a day are summed. */
  value: number;
}

/** A day as handed to tooltips, `getRectProps` and press callbacks. */
export interface CalendarHeatmapChartDay {
  /** Calendar day as 'YYYY-MM-DD' */
  date: string;
  /** The day's value, or `null` when `data` has no entry for it */
  value: number | null;
}

/** SVG attributes a day cell accepts from `getRectProps`. */
export interface CalendarHeatmapChartRectProps {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rx?: number;
  ry?: number;
}

export interface CalendarHeatmapChartLegend {
  /** Show the color legend below the calendar */
  show?: boolean;
  /** Text at the low and high ends of the swatch strip. Defaults to `Less` and `More`. */
  labels?: [ReactNode, ReactNode];
  /** Horizontal placement under the calendar. Defaults to `end`, like GitHub. */
  align?: 'start' | 'center' | 'end';
}

export interface CalendarHeatmapChartProps
  extends BaseChartProps,
    ChartInteractionCallbacks<CalendarHeatmapChartDay> {
  /**
   * Values keyed by calendar day, `{ '2025-03-10': 4 }`. Keys are read as local
   * calendar dates, never as UTC instants. An array of `{ date, value }` is also
   * accepted. Days with no entry, or a value of `0`, are drawn in `emptyColor`.
   */
  data: Record<string, number> | CalendarHeatmapChartEntry[];
  /** First day shown. Defaults to 364 days before `endDate`. */
  startDate?: string | Date;
  /** Last day shown. Defaults to today. */
  endDate?: string | Date;
  /** First day of each week column: `0` Sunday, `1` Monday */
  firstDayOfWeek?: 0 | 1;
  /**
   * Size of a day cell in px. When the container is narrower than the calendar,
   * cells shrink to fit, down to 4px; below that the chart keeps its width.
   */
  rectSize?: number;
  /** Space between cells, in px */
  gap?: number;
  /** Corner radius of a cell */
  rectRadius?: number;
  /**
   * Colors days are bucketed into, low to high. Defaults to four shades of the
   * theme's first accent color.
   */
  colors?: string[];
  /** Value range spread across `colors`. Defaults to the data's min and max. */
  domain?: [number, number];
  /** Color of days with no value, and of outside days */
  emptyColor?: string;
  /** Show month names along the calendar */
  withMonthLabels?: boolean;
  /** Month names, January first */
  monthLabels?: string[];
  /** Which edge the month names sit on */
  monthLabelsPosition?: 'top' | 'bottom';
  /** Show weekday names to the left of the rows */
  withWeekdayLabels?: boolean;
  /**
   * Weekday names, Sunday first (indexed like `Date.getDay()`), whatever
   * `firstDayOfWeek` is. When rows are too short for every name, every other
   * row is labelled.
   */
  weekdayLabels?: string[];
  /** Width reserved for weekday names; measured from the names by default */
  weekdaysLabelsWidth?: number;
  /** Height reserved for month names */
  monthsLabelsHeight?: number;
  /** Label font size */
  fontSize?: number;
  /**
   * Draw the days of the first and last week that fall outside the range as
   * empty cells. `false` leaves those slots blank.
   */
  withOutsideDates?: boolean;
  /** Start every month in a new column, with an empty column between months */
  splitMonths?: boolean;
  /** Extra SVG attributes per day, e.g. a fill decided by thresholds */
  getRectProps?: (date: string, value: number | null) => CalendarHeatmapChartRectProps | undefined;
  /** Tooltip configuration; `formatter` receives the hovered `{ date, value }` */
  tooltip?: ChartTooltip<CalendarHeatmapChartDay>;
  /** Color legend */
  legend?: CalendarHeatmapChartLegend;
}
