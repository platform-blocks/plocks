import { ScatterChart } from '@plocks/charts';

import { CAMPAIGNS } from './data';

export function Demo() {
  return (
    <ScatterChart
      title="Campaign spend vs. leads"
      h={320}
      data={CAMPAIGNS}
      referenceAreas={[{ x1: 40, y1: 60, color: '#10b981', label: 'High return' }]}
      referenceLines={[
        { x: 40, dashed: true },
        { y: 60, label: 'Median leads', dashed: true },
      ]}
      referenceDots={[{ x: 72, y: 96, r: 6, color: '#10b981', label: 'Best campaign' }]}
      xAxis={{ show: true, title: 'Spend (USD thousands)' }}
      yAxis={{ show: true, title: 'Qualified leads' }}
      grid={{ show: true }}
    />
  );
}
