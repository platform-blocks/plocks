import type { BaseChartProps, ChartInteractionCallbacks, ChartLegend, ChartTooltip } from '../../types/base';

/** One part of the whole. */
export interface WaffleChartCell {
  /** Display name, shown in the legend and tooltip */
  name: string;
  /** Share of the whole. Cells are allocated in proportion to it. */
  value: number;
  /** Color override; defaults to the theme's accent palette */
  color?: string;
  /** Arbitrary metadata forwarded through interactions */
  data?: any;
}

/** A segment as resolved by the chart, passed to tooltips and interactions. */
export interface WaffleChartSegment extends WaffleChartCell {
  /** Resolved color */
  color: string;
  /** Number of grid cells allocated to the segment */
  count: number;
  /** Share of `total` (0–1) */
  percentage: number;
}

/**
 * Order in which cells are filled. Row-wise directions fill one row at a time;
 * column-wise directions fill one column at a time.
 */
export type WaffleChartFillDirection = 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

export interface WaffleChartProps extends BaseChartProps, ChartInteractionCallbacks<WaffleChartSegment> {
  /** Segments to display */
  data: WaffleChartCell[];
  /**
   * The whole the values are measured against. Defaults to the sum of all values,
   * which fills the grid; a larger total leaves the rest of the grid empty, for
   * progress toward a goal. A total smaller than the sum is ignored.
   */
  total?: number;
  /** Number of grid rows */
  rows?: number;
  /** Number of grid columns */
  columns?: number;
  /** Distance between cells, in px */
  gap?: number;
  /** Border radius of each cell */
  cellRadius?: number;
  /** Order in which cells are filled */
  fillDirection?: WaffleChartFillDirection;
  /** Color of unallocated cells */
  emptyColor?: string;
  /** Legend configuration. Shown below the grid by default; pass `{ show: false }` to hide it. */
  legend?: ChartLegend;
  /** Tooltip configuration; `formatter` receives the segment with its cell `count` and `percentage` */
  tooltip?: ChartTooltip<WaffleChartSegment>;
  /** Skip the cell fill-in animation */
  disableAnimation?: boolean;
}
