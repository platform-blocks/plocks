// 120 days of a deterministic daily metric with a weekly rhythm and a slow climb.
export const SERIES = [
  {
    id: 'visits',
    name: 'Visits',
    color: '#4C6EF5',
    data: Array.from({ length: 120 }, (_, day) => ({
      x: day,
      y: Math.round(800 + day * 4 + 140 * Math.sin((day / 7) * Math.PI * 2) + 60 * Math.sin(day / 11)),
    })),
  },
];
