import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} tooltip={{ formatter: ({ date, value }) => `${value ?? 0} contributions on ${date}` }} />;
}
