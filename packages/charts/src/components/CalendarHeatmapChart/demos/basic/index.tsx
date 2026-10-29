import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart title="Contributions" data={CONTRIBUTIONS} startDate={START} endDate={END} />;
}
