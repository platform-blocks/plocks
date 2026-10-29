// Five years of monthly orders with a 6-month moving average.
const ORDERS = Array.from({ length: 60 }, (_, month) =>
  Math.round(300 + month * 6 + 70 * Math.sin((month / 12) * Math.PI * 2) + 25 * Math.sin(month * 2.1)),
);

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
    name: '6-month average',
    data: movingAverage(ORDERS, 6).map((y, index) => ({ x: index + 1, y })),
  },
];
