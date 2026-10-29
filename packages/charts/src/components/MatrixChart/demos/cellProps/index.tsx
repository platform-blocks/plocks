import { MatrixChart } from '@plocks/charts';

import { VISITORS } from './data';

export function Demo() {
  return (
    <MatrixChart
      data={VISITORS}
      getCellProps={(cell) => {
        if (cell.value === null) return undefined;
        if (cell.value >= 25) return { fill: '#1baf7a' };
        if (cell.value >= 15) return { fill: '#eda100' };
        return { fill: '#e34948' };
      }}
    />
  );
}
