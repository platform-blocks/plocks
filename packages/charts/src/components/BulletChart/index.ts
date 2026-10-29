import { withChartAutoSize } from '../../core/autoSize';
import { BulletChart as BulletChartBase } from './BulletChart';

/**
 * Fills the width it is given and sizes its height to its rows unless `h` says
 * otherwise (vertical bullets default to 260px) — see `withChartAutoSize`. The
 * unwrapped component is `BulletChartBase`.
 */
export const BulletChart = withChartAutoSize(BulletChartBase, { width: 400, height: 0 });
export default BulletChart;

export type { BulletChartProps, BulletChartItem, BulletChartRange, BulletChartDatum, BulletChartOrientation } from './types';
