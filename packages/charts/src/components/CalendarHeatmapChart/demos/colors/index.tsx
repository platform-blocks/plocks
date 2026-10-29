import { CalendarHeatmapChart } from '@plocks/charts';

import { CONTRIBUTIONS, END, START } from './data';

export function Demo() {
  return <CalendarHeatmapChart data={CONTRIBUTIONS} startDate={START} endDate={END} colors={['#9be9a8', '#40c463', '#30a14e', '#216e39']} />;
}
