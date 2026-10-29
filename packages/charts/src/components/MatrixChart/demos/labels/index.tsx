import { MatrixChart } from '@plocks/charts';

import { DAYS, HOURS, VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} xLabels={HOURS} yLabels={DAYS} xLabelsPosition="top" />;
}
