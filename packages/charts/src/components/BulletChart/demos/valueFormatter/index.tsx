import { BulletChart } from '@plocks/charts';

export function Demo() {
  return (
    <BulletChart
      value={230000}
      target={150000}
      ranges={[{ value: 100000 }, { value: 200000 }, { value: 300000 }]}
      valueFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
      maw={520}
    />
  );
}
