import { ScatterChart } from '@plocks/charts';

import { REVENUE, UNITS_SOLD } from './data';

export function Demo() {
  return (
    <ScatterChart
      title="Visits vs. units and revenue"
      h={320}
      data={[]}
      series={[
        { id: 'units', name: 'Units sold', data: UNITS_SOLD },
        { id: 'revenue', name: 'Revenue', data: REVENUE, yAxis: 'right' },
      ]}
      xAxis={{ title: 'Store visits (thousands)' }}
      yAxis={{ title: 'Units sold' }}
      yAxisRight={{ title: 'Revenue (USD)', labelFormatter: (value) => `$${value}k` }}
      grid={{ show: true }}
      legend={{ show: true, position: 'bottom' }}
    />
  );
}
