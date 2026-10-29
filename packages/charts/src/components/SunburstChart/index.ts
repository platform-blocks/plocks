import { withChartAutoSize } from '../../core/autoSize';
import { SunburstChart as SunburstChartBase } from './SunburstChart';

/**
 * Fills the width it is given and keeps its rings square inside the box — see
 * `withChartAutoSize`. The unwrapped component is `SunburstChartBase`.
 */
export const SunburstChart = withChartAutoSize(SunburstChartBase, { width: 360, height: 360 });
export default SunburstChart;

export type { SunburstChartProps, SunburstChartSegment, SunburstNode } from './types';
