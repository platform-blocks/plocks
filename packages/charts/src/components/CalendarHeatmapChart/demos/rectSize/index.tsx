import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate="2025-07-01" endDate={END} rectSize={16} gap={3} rectRadius={4} />;
}
