import { AreaChart } from '@plocks/charts';

import { ACTIVE_USERS } from './data';

export function Demo() {
  return (
    <AreaChart
      title="Daily active users"
      h={300}
      data={ACTIVE_USERS}
      showPoints={false}
      referenceAreas={[{ x1: 5, x2: 7, color: '#8b5cf6', label: 'Launch week' }]}
      referenceLines={[{ y: 4, label: 'Goal 4M', color: '#f59e0b', dashed: true }]}
      referenceDots={[{ x: 11, y: 4.4, r: 6, color: '#8b5cf6', label: 'Record' }]}
      xAxis={{ show: true, labelFormatter: (value) => `W${Math.round(value) + 1}` }}
      yAxis={{ show: true, labelFormatter: (value) => `${value}M` }}
      grid={{ show: true }}
    />
  );
}
