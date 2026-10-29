import { withChartAutoSize } from '../../core/autoSize';
import { CalendarHeatmapChart as CalendarHeatmapChartBase } from './CalendarHeatmapChart';

/**
 * Fills the width it is given, centring the calendar in any slack, and sizes its
 * height to the calendar unless `h` says otherwise — see `withChartAutoSize`.
 * Cells keep `rectSize` while they fit and shrink (to 4px at the least) in a
 * narrower box. The unwrapped component is `CalendarHeatmapChartBase`.
 */
export const CalendarHeatmapChart = withChartAutoSize(CalendarHeatmapChartBase, { width: 600, height: 0 });
export default CalendarHeatmapChart;

export type {
  CalendarHeatmapChartProps,
  CalendarHeatmapChartEntry,
  CalendarHeatmapChartDay,
  CalendarHeatmapChartRectProps,
  CalendarHeatmapChartLegend,
} from './types';
