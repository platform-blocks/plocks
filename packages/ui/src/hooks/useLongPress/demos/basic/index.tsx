import { useState } from 'react';
import { Button, useLongPress } from '@plocks/ui';

export function Demo() {
  const [state, setState] = useState<'idle' | 'pressing' | 'long-pressed'>('idle');
  const handlers = useLongPress(() => setState('long-pressed'), {
    threshold: 600,
    onStart: () => setState('pressing'),
    onCancel: () => setState('idle'),
  });

  return (
    <Button {...handlers} variant={state === 'long-pressed' ? 'filled' : 'outline'}>
      {state === 'idle' ? 'Hold me' : state === 'pressing' ? 'Keep holding…' : 'Long pressed'}
    </Button>
  );
}
