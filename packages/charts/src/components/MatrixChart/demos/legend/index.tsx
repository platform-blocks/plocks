import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} legend={{ show: true, labels: ['Quiet', 'Busy'] }} />;
}
