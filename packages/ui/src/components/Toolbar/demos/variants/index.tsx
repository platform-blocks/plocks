import { Column, Text, Toolbar } from '@plocks/ui';

const variants = ['light', 'filled'] as const;

export function Demo() {
  return (
    <Column gap="lg">
      {variants.map((variant) => (
        <Column key={variant} gap="xs">
          <Text fw="semibold">{variant}</Text>
          <Toolbar variant={variant} color="success">
            <Toolbar.ToggleGroup type="multiple" defaultValue={['bold']} accessibilityLabel="Style">
              <Toolbar.ToggleItem value="bold" icon="bold" accessibilityLabel="Bold" />
              <Toolbar.ToggleItem value="italic" icon="italic" accessibilityLabel="Italic" />
              <Toolbar.ToggleItem value="underline" icon="underline" accessibilityLabel="Underline" />
            </Toolbar.ToggleGroup>
            <Toolbar.Divider />
            <Toolbar.Toggle icon="link" defaultActive accessibilityLabel="Insert link" />
          </Toolbar>
        </Column>
      ))}
    </Column>
  );
}
