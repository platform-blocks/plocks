import { LineChart } from '@plocks/charts';

import { SERIES } from './data';

export function Demo() {
  return (
    <LineChart
      h={340}
      series={SERIES}
      showPoints={false}
      withBrush
      brushProps={{ start: 104, end: 155 }}
      xAxis={{ show: true, labelFormatter: (value) => `W${value}` }}
      yAxis={{ show: true }}
    />
  );
}
