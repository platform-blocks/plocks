import { Button, useToast } from '@plocks/ui';

export function Demo() {
  const toast = useToast();

  return (
    <Button
      onPress={() =>
        toast.info({
          title: 'Uploading finished',
          message: 'Hover to pause the countdown.',
          autoHide: 6000,
          withAutoCloseProgress: true,
        })
      }
    >
      Show toast with progress
    </Button>
  );
}
