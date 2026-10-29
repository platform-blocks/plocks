import { Column, Text, Toolbar } from '@plocks/ui';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export function Demo() {
  return (
    <Column gap="lg">
      {sizes.map((size) => (
        <Column key={size} gap="xs">
          <Text fw="semibold">{size}</Text>
          <Toolbar size={size}>
            <Toolbar.ToggleGroup type="multiple" defaultValue={['bold']} accessibilityLabel="Style">
              <Toolbar.ToggleItem value="bold" icon="bold" accessibilityLabel="Bold" />
              <Toolbar.ToggleItem value="italic" icon="italic" accessibilityLabel="Italic" />
              <Toolbar.ToggleItem value="underline" icon="underline" accessibilityLabel="Underline" />
            </Toolbar.ToggleGroup>
            <Toolbar.Divider />
            <Toolbar.Toggle icon="undo" accessibilityLabel="Undo" />
            <Toolbar.Toggle icon="redo" accessibilityLabel="Redo" />
          </Toolbar>
        </Column>
      ))}
    </Column>
  );
}
