import { withChartAutoSize } from '../../core/autoSize';
import { WaffleChart as WaffleChartBase } from './WaffleChart';

/**
 * Fills the width it is given and sizes its height to the grid unless `h` says
 * otherwise — see `withChartAutoSize`. The unwrapped component is `WaffleChartBase`.
 */
export const WaffleChart = withChartAutoSize(WaffleChartBase, { width: 320, height: 0 });
export default WaffleChart;

export type { WaffleChartProps, WaffleChartCell, WaffleChartSegment, WaffleChartFillDirection } from './types';
