import { BarChart } from '@plocks/charts';

import { SIGNUPS } from './data';

export function Demo() {
  return (
    <BarChart
      title="Monthly signups"
      h={300}
      data={SIGNUPS}
      barBorderRadius={4}
      referenceAreas={[{ x1: 'Jul', x2: 'Aug', color: '#8b5cf6', label: 'Campaign' }]}
      referenceLines={[{ y: 1200, label: 'Target 1,200', color: '#f59e0b', dashed: true }]}
      referenceDots={[{ x: 'Aug', y: 1520, r: 6, color: '#8b5cf6', label: 'Record' }]}
      xAxis={{ show: true }}
      yAxis={{ show: true }}
      legend={{ show: false }}
    />
  );
}
