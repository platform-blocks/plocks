import { AreaChart } from '@plocks/charts';

import { SERIES } from './data';

export function Demo() {
  return (
    <AreaChart
      h={340}
      layout="stacked"
      series={SERIES}
      withBrush
      brushProps={{ start: 360, end: 539 }}
      xAxis={{ show: true, labelFormatter: (value) => `D${value}` }}
      yAxis={{ show: true }}
    />
  );
}
