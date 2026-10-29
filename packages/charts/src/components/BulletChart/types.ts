import type { BaseChartProps, ChartInteractionCallbacks, ChartTooltip } from '../../types/base';

/**
 * One qualitative band behind the bar. `value` is the band's upper bound; each
 * band starts where the previous one ends (the first starts at `min`).
 */
export interface BulletChartRange {
  /** Upper bound of the band, in data units */
  value: number;
  /** Band color; defaults to a shade of the theme's neutral, darkest for the lowest band */
  color?: string;
  /** Name of the band ("Poor", "Good"), used in the tooltip and accessible label */
  label?: string;
}

/** One bullet: a measure, its target and the bands it is judged against. */
export interface BulletChartItem {
  /** Name shown beside the bar */
  label?: string;
  /** Secondary line shown under the label (units, period) */
  description?: string;
  /** The measure the bar shows */
  value: number;
  /** Comparative measure, drawn as a marker across the bar */
  target?: number;
  /** Qualitative bands; falls back to the chart's `ranges` */
  ranges?: BulletChartRange[];
  /** Bar color; falls back to the chart's `color` */
  color?: string;
  /** Target marker color; falls back to the chart's `targetColor` */
  targetColor?: string;
}

/** What a hovered or pressed mark resolves to, passed to tooltips and interactions. */
export interface BulletChartDatum {
  /** Which part of the bullet the mark is */
  kind: 'value' | 'target' | 'range';
  /** Row of the bullet in `data` (0 for a single bullet) */
  index: number;
  /** Display name of the mark */
  label: string;
  /** The value, the target, or a range's upper bound */
  value: number;
  /** A range's lower bound */
  from?: number;
  /** Resolved color of the mark */
  color: string;
  /** The bullet the mark belongs to */
  item: BulletChartItem;
}

export type BulletChartOrientation = 'horizontal' | 'vertical';

export interface BulletChartProps extends BaseChartProps, ChartInteractionCallbacks<BulletChartDatum> {
  /** The measure the bar shows. Required unless `data` is given. */
  value?: number;
  /** Comparative measure, drawn as a marker across the bar */
  target?: number;
  /**
   * Qualitative bands as cumulative upper bounds, lowest first. With `data`,
   * these apply to every row that has no `ranges` of its own.
   */
  ranges?: BulletChartRange[];
  /** Name shown beside the bar: on the leading side when horizontal, above when vertical */
  label?: string;
  /** Secondary line under `label` */
  description?: string;
  /**
   * Several bullets on one shared scale, one row (or column, when vertical)
   * each. Replaces `value`, `label` and `description`; `target` and `ranges`
   * act as defaults for rows that omit them.
   */
  data?: BulletChartItem[];
  /** Start of the scale */
  min?: number;
  /** End of the scale. Defaults to the largest value, target or range, rounded up to a tick. */
  max?: number;
  /** Direction the bar grows */
  orientation?: BulletChartOrientation;
  /** Formats axis ticks, tooltip values and the accessible label. Defaults to the theme's number format. */
  valueFormatter?: (value: number) => string;
  /** Bar color; defaults to the first color of the theme's accent palette */
  color?: string;
  /** Target marker color; defaults to the theme's primary text color */
  targetColor?: string;
  /** Bar thickness as a fraction of the band's thickness (0–1) */
  barThickness?: number;
  /** Draw the value axis */
  withAxis?: boolean;
  /** Approximate number of axis ticks */
  ticks?: number;
  /** Tooltip configuration; `formatter` receives the hovered mark */
  tooltip?: ChartTooltip<BulletChartDatum>;
  /** Draw the bar at its final length at once */
  disableAnimation?: boolean;
}
