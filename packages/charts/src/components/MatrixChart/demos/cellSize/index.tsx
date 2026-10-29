import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return <MatrixChart data={VISITORS} cellSize={30} gap={3} cellRadius={4} />;
}
