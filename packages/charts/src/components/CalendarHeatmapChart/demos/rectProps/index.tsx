import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} getRectProps={(date, value) => (value !== null && value >= 12 ? { stroke: '#e34948', strokeWidth: 1 } : undefined)} />;
}
