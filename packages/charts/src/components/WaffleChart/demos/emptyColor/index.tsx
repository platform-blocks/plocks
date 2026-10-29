import { WaffleChart } from '@plocks/charts';

export function Demo() {
  return (
    <WaffleChart
      data={[{ name: 'Completed', value: 68, color: '#1baf7a' }]}
      total={100}
      emptyColor="#E2E8F0"
      maw={360}
    />
  );
}
