import { BarChart } from '@plocks/charts';

import { DATA } from './data';

export function Demo() {
  return (
    <BarChart
      h={340}
      data={DATA}
      withBrush
      brushProps={{ start: 24, end: 35 }}
      xAxis={{ show: true }}
      yAxis={{ show: true, labelFormatter: (value) => `$${value}k` }}
      legend={{ show: false }}
    />
  );
}
