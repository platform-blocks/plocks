import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate="2025-03-12" endDate="2025-08-20" withOutsideDates={false} />;
}
