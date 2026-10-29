const ORDERS = [320, 340, 365, 410, 520, 560, 480, 455, 470, 510, 590, 640];

const movingAverage = (values: number[], window: number) =>
  values.map((_, index) => {
    const slice = values.slice(Math.max(0, index - window + 1), index + 1);
    return Math.round(slice.reduce((sum, value) => sum + value, 0) / slice.length);
  });

export const LAYERS = [
  {
    type: 'bar' as const,
    id: 'orders',
    name: 'Orders',
    data: ORDERS.map((y, index) => ({ x: index + 1, y })),
  },
  {
    type: 'line' as const,
    id: 'average',
    name: '3-month average',
    showPoints: false,
    data: movingAverage(ORDERS, 3).map((y, index) => ({ x: index + 1, y })),
  },
];
