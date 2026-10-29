import type { LineChartProps } from '../LineChart/types';
import type { ChartReferenceArea, ChartReferenceDot, ChartReferenceLine } from '../../types/base';

export type AreaChartLayout = 'overlap' | 'stacked' | 'stackedPercentage' | 'stream';

export interface AreaChartProps extends LineChartProps {
  /**
   * Controls how multiple series are rendered.
   * - `overlap` leaves each area independent (default).
   * - `stacked` cumulatively stacks values and renders using stacked layers.
   * - `stackedPercentage` stacks each x's share of its total; the y scale runs 0–1.
   * - `stream` is a streamgraph: the stack is centered on a moving baseline
   *   (silhouette offset). The y axis and its gridlines are hidden unless
   *   `yAxis.show` is `true`; tooltips still report each series' raw value.
   */
  layout?: AreaChartLayout;
  /** Opacity used when rendering stacked layers (if not provided defaults to fillOpacity). */
  areaOpacity?: number;
  /** Adjust the stacking order when using stacked layouts. */
  stackOrder?: 'normal' | 'reverse';
  /**
   * Vertical (`x`) or horizontal (`y`) guide lines drawn above the areas, in
   * every layout. `y` is in the drawn scale: data values in `overlap`, stack
   * totals in `stacked`, the 0–1 stack fraction in `stackedPercentage` (`0.5` is
   * 50%), and the offset from the centerline in `stream` (`0` is the middle).
   */
  referenceLines?: ChartReferenceLine[];
  /** Shaded regions drawn below the areas; `y1`/`y2` use the same scale as `referenceLines`. */
  referenceAreas?: ChartReferenceArea[];
  /** Point markers drawn above the areas; `y` uses the same scale as `referenceLines`. */
  referenceDots?: ChartReferenceDot[];
}
