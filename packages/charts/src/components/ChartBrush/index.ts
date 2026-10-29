import { withChartAutoSize } from '../../core/autoSize';
import { CHART_BRUSH_HEIGHT } from '../../ChartBase';
import { ChartBrush as ChartBrushBase } from './ChartBrush';

/**
 * Fills the width it is given unless `w` says otherwise — see `withChartAutoSize`.
 * The charts' built-in `withBrush` strip uses the unwrapped `ChartBrushBase`.
 */
export const ChartBrush = withChartAutoSize(ChartBrushBase, { width: 300, height: CHART_BRUSH_HEIGHT });

export type { ChartBrushProps, ChartBrushSeries, ChartBrushConfig, ChartBrushChartProps } from './types';
