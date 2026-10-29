// Weekly store visits (thousands) against what those visits bought.
const WEEKS: Array<[visits: number, units: number, revenue: number]> = [
  [2.1, 92, 7.4], [3.4, 131, 11.8], [4.0, 168, 12.1], [4.8, 181, 16.9],
  [5.5, 226, 17.2], [6.3, 241, 22.6], [7.1, 287, 23.4], [7.9, 302, 28.8],
  [8.6, 351, 27.9], [9.4, 362, 33.5], [10.2, 411, 34.1], [11.0, 428, 39.7],
  [11.9, 472, 40.2], [12.7, 489, 45.6], [13.6, 538, 46.3],
];

export const UNITS_SOLD = WEEKS.map(([x, y], index) => ({ id: `units-${index}`, x, y }));
export const REVENUE = WEEKS.map(([x, , y], index) => ({ id: `revenue-${index}`, x, y }));
