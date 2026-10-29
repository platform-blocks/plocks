import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} xLabelsRotation={-45} />;
}
