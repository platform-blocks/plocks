import { useState } from 'react';

import { Knob } from '@plocks/ui';

export function Demo() {
  const [value, setValue] = useState(6.5);

  return (
    <Knob.Root
      accessibilityLabel="Drive"
      size={180}
      min={0}
      max={10}
      step={0.1}
      value={value}
      onChange={setValue}
      appearance={{ arc: { startAngle: -135, sweepAngle: 270 } }}
      valueLabel={{ position: 'bottom', formatter: (current) => current.toFixed(1) }}
    >
      <Knob.Ring visible={false} />
      <Knob.Progress visible={false} />
      <Knob.Thumb visible={false} />
      <Knob.Body
        shape="polygon"
        sides={7}
        radiusOffset={-18}
        color="#b45309"
        shading="dome"
        borderWidth={1}
        borderColor="#78350f"
        cap={{ ratio: 0.62, color: '#d6d3d1', shading: 'brushed' }}
        shadow={{ offsetY: 4, blur: 10, opacity: 0.35 }}
      />
      <Knob.TickLayer
        source="count"
        count={11}
        shape="line"
        length={8}
        width={2}
        color="#b45309"
        glow={{ intensity: 0.6 }}
      />
      <Knob.Pointer shape="triangle" length={48} width={12} color="#1c1917" />
    </Knob.Root>
  );
}
