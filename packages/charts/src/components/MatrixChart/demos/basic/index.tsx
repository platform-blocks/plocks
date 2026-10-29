import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return (
    <MatrixChart
      title="Visitors by hour"
      data={VISITORS}
      tooltip={{ formatter: ({ x, y, value }) => `${y} ${x}: ${value === null ? 'No data' : `${value} visitors`}` }}
    />
  );
}
