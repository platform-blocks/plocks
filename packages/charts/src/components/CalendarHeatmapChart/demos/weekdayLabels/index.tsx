import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} withWeekdayLabels firstDayOfWeek={0} />;
}
