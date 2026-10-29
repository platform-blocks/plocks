import { BulletChart } from '@plocks/charts';

export function Demo() {
  return (
    <BulletChart
      orientation="vertical"
      label="Profit"
      description="%"
      value={22}
      target={26}
      ranges={[{ value: 20 }, { value: 25 }, { value: 30 }]}
      h={280}
    />
  );
}
