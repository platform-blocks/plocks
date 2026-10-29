import { useState } from 'react';

import { Block, Knob, Text } from '@plocks/ui';
import type { KnobVariant } from '@plocks/ui';

const VARIANTS: KnobVariant[] = [
  'default',
  'minimal',
  'outline',
  'material',
  'studio',
  'neumorphic',
  'digital',
  'segmented',
  'led-ring',
  'gauge',
];

export function Demo() {
  const [value, setValue] = useState(62);

  return (
    <Block fullWidth direction="row" wrap="wrap" justify="center" gap="xl">
      {VARIANTS.map((variant) => (
        <Block key={variant} align="center" gap="xs">
          <Knob
            accessibilityLabel={`${variant} knob`}
            variant={variant}
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
