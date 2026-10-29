import { useState } from 'react';

import { Block, Knob, Text } from '@plocks/ui';
import type { KnobVariant } from '@plocks/ui';

const VARIANTS: KnobVariant[] = [
  'retro',
  'knurled',
  'encoder',
  'soft-touch',
  'chickenhead',
  'skirted',
  'fluted',
];

export function Demo() {
  const [value, setValue] = useState(40);

  return (
    <Block fullWidth direction="row" wrap="wrap" justify="center" gap="xl">
      {VARIANTS.map((variant) => (
        <Block key={variant} align="center" gap="xs">
          <Knob
            accessibilityLabel={`${variant} knob`}
            variant={variant}
            size={140}
            min={0}
            max={100}
            value={value}
            onChange={setValue}
            formatLabel={(current) => Math.round(current)}
          />
          <Text size="sm" fw="600">{variant}</Text>
        </Block>
      ))}
    </Block>
  );
}
