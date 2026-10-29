import { withChartAutoSize } from '../../core/autoSize';
import { MatrixChart as MatrixChartBase } from './MatrixChart';

/**
 * Fills the width it is given and sizes its height to the grid unless `h` says
 * otherwise — see `withChartAutoSize`. The unwrapped component is `MatrixChartBase`.
 */
export const MatrixChart = withChartAutoSize(MatrixChartBase, { width: 320, height: 0 });
export default MatrixChart;

export type { MatrixChartProps, MatrixChartCell, MatrixChartCellProps, MatrixChartLegend } from './types';
