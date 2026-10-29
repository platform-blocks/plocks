import { LineChart } from '@plocks/charts';

import { LATENCY } from './data';

export function Demo() {
  return (
    <LineChart
      title="API latency"
      h={300}
      data={LATENCY}
      showPoints={false}
      referenceAreas={[{ x1: 7, x2: 9, color: '#ef4444', label: 'Incident' }]}
      referenceLines={[
        { y: 250, label: 'SLO 250 ms', color: '#f59e0b', dashed: true },
        { x: 4, label: 'v2.3 release' },
      ]}
      referenceDots={[{ x: 8, y: 412, r: 6, color: '#ef4444', label: 'Peak' }]}
      xAxis={{ show: true, labelFormatter: (value) => `W${Math.round(value) + 1}` }}
      yAxis={{ show: true, labelFormatter: (value) => `${value} ms` }}
      grid={{ show: true }}
    />
  );
}
