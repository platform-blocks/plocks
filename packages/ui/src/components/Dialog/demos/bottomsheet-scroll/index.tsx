import { Button, Column, Text, useDialog } from '@plocks/ui';

const items = Array.from({ length: 40 }, (_, index) => `Item ${index + 1}`);

export function Demo() {
  const { openDialog } = useDialog();

  const showScrollingSheet = () => {
    openDialog({
      variant: 'bottomsheet',
      title: 'Items',
      content: (
        <Column gap="md">
          {items.map((item) => (
            <Text key={item}>{item}</Text>
          ))}
        </Column>
      )
    });
  };

  return (
    <Button onPress={showScrollingSheet}>Open Scrolling Sheet</Button>
  );
}
