import type { SunburstNode } from '@plocks/charts';

export const BUDGET: SunburstNode[] = [
  {
    name: 'Engineering',
    color: '#2563eb',
    children: [
      { name: 'Platform', value: 420 },
      { name: 'Mobile', value: 310 },
      { name: 'Web', value: 280 },
    ],
  },
  {
    name: 'Sales',
    color: '#16a34a',
    children: [
      { name: 'EMEA', value: 190 },
      { name: 'Americas', value: 260 },
      { name: 'APAC', value: 120 },
    ],
  },
  {
    name: 'Marketing',
    color: '#ea580c',
    children: [
      { name: 'Brand', value: 140 },
      { name: 'Events', value: 90, color: '#a855f7' },
    ],
  },
];
