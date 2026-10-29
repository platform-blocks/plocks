import type { LineChartProps, LineChartSeries } from '../LineChart/types';
import type { ChartReferenceArea, ChartReferenceDot, ChartReferenceLine } from '../../types/base';

export interface SeriesPoint {
  /** X-axis value */
  x: number;
  /** Y-axis value */
  y: number;
}

export interface StackedAreaSeries {
  /** Series name */
  name: string;
  /** Series color */
  color: string;
  /** Array of data points */
  data: SeriesPoint[];
  /** Optional visibility toggle */
  visible?: boolean;
}

/**
 * Props for {@link StackedAreaChart}. Extends {@link LineChartProps} (minus the
 * single-series `data`/`fill`/`smooth` fields it replaces) so it inherits the
 * axes, grid, legend, tooltip, crosshair, scale-type and interaction props, plus
 * the stacking-specific options below. This is the single source of truth — the
 * component consumes this exact interface.
 */
export interface StackedAreaChartProps
  extends Omit<LineChartProps, 'data' | 'fill' | 'smooth'> {
  /** Data series to stack */
  series: LineChartSeries[];
  /** Order layers are stacked in */
  stackOrder?: 'normal' | 'reverse';
  /** Smooth (curved) area tops */
  smooth?: boolean;
  /** Base opacity for the stacked layers */
  opacity?: number;
  /**
   * How the layers are stacked.
   * - `absolute` stacks raw values from zero (default).
   * - `percentage` normalizes each x to its share of the total; the y scale runs
   *   0–1 (the values the y-axis `labelFormatter` receives).
   * - `stream` is a streamgraph: each x's stack is centered on y = 0 (silhouette
   *   offset). The y axis and its gridlines are hidden unless `yAxis.show` is
   *   `true`; tooltips still report each series' raw value.
   */
  stackMode?: 'absolute' | 'percentage' | 'stream';
  /**
   * Vertical (`x`) or horizontal (`y`) guide lines drawn above the layers. `y` is
   * in the drawn stack scale: the stack total in `absolute`, the 0–1 stack
   * fraction in `percentage` (`0.5` is 50%), and the offset from the centerline
   * in `stream` (`0` is the middle of the stream).
   */
  referenceLines?: ChartReferenceLine[];
  /** Shaded regions drawn below the layers; `y1`/`y2` use the same scale as `referenceLines`. */
  referenceAreas?: ChartReferenceArea[];
  /** Point markers drawn above the layers; `y` uses the same scale as `referenceLines`. */
  referenceDots?: ChartReferenceDot[];
}

export type SimpleStackedAreaChartProps = StackedAreaChartProps;
