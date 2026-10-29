import { AreaChart } from '@plocks/charts';

import { SIGNUP_SERIES } from './data';

export function Demo() {
  return (
    <AreaChart
      title="Signups by channel"
      h={320}
      series={SIGNUP_SERIES}
      layout="stacked"
      referenceAreas={[{ x1: 5, x2: 7, color: '#8b5cf6', label: 'Campaign' }]}
      referenceLines={[{ y: 40, label: 'Target 40k', color: '#ef4444', dashed: true }]}
      referenceDots={[{ x: 11, y: 50, r: 6, color: '#8b5cf6', label: 'Peak' }]}
      xAxis={{ show: true, labelFormatter: (value) => `W${Math.round(value) + 1}` }}
      yAxis={{ show: true, labelFormatter: (value) => `${value}k` }}
      grid={{ show: true }}
      legend={{ show: true, position: 'bottom' }}
    />
  );
}
