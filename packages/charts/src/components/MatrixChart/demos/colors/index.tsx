import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} colors={['#FFEDD5', '#FDBA74', '#F97316', '#9A3412']} />;
}
