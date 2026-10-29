import { useRef } from 'react';

import { Button, ToastProvider, useToast } from '@plocks/ui';

function Trigger() {
  const toast = useToast();
  const counter = useRef(0);

  return (
    <Button
      onPress={() => {
        counter.current += 1;
        toast.show({
          title: `Message ${counter.current}`,
          message: 'Hover or press the stack to expand it.',
          severity: (['info', 'success', 'warning', 'error'] as const)[counter.current % 4],
          autoHide: 8000,
        });
      }}
    >
      Add a toast
    </Button>
  );
}

export function Demo() {
  return (
    <ToastProvider layout="stacked" defaultPosition="bottom-right">
      <Trigger />
    </ToastProvider>
  );
}
