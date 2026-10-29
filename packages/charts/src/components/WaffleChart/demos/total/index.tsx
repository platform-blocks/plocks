import { WaffleChart } from '@plocks/charts';

export function Demo() {
  return (
    <WaffleChart
      title="Migration progress"
      data={[
        { name: 'Migrated', value: 412 },
        { name: 'In review', value: 96 },
      ]}
      total={800}
      maw={360}
    />
  );
}
