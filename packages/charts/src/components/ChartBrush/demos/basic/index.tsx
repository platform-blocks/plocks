import { useState } from 'react';
import { ChartBrush, LineChart } from '@plocks/charts';

import { SERIES } from './data';

export function Demo() {
  const [range, setRange] = useState<[number, number]>([60, 100]);

  return (
    <>
      <LineChart
        h={260}
        series={SERIES}
        showPoints={false}
        brushRange={range}
        onBrushChange={setRange}
        xAxis={{ show: true, labelFormatter: (value) => `Day ${value}` }}
        yAxis={{ show: true }}
        grid={{ show: true, style: 'dashed' }}
      />
      <ChartBrush
        h={48}
        series={SERIES}
        value={range}
        onChange={setRange}
        step={1}
        formatValue={(value) => `Day ${Math.round(value)}`}
      />
    </>
  );
}
