import { Column, Text, Toolbar } from '@plocks/ui';

export function Demo() {
  return (
    <Column gap="lg">
      <Column gap="xs">
        <Text fw="semibold">multiple</Text>
        <Toolbar>
          <Toolbar.ToggleGroup type="multiple" defaultValue={['bold', 'italic']} accessibilityLabel="Style">
            <Toolbar.ToggleItem value="bold" icon="bold" accessibilityLabel="Bold" />
            <Toolbar.ToggleItem value="italic" icon="italic" accessibilityLabel="Italic" />
            <Toolbar.ToggleItem value="underline" icon="underline" accessibilityLabel="Underline" />
            <Toolbar.ToggleItem value="strike" icon="strikethrough" accessibilityLabel="Strikethrough" />
          </Toolbar.ToggleGroup>
        </Toolbar>
      </Column>
      <Column gap="xs">
        <Text fw="semibold">single</Text>
        <Toolbar>
          <Toolbar.ToggleGroup type="single" defaultValue="center" accessibilityLabel="Alignment">
            <Toolbar.ToggleItem value="left" icon="alignLeft" accessibilityLabel="Align left" />
            <Toolbar.ToggleItem value="center" icon="alignCenter" accessibilityLabel="Align center" />
            <Toolbar.ToggleItem value="right" icon="alignRight" accessibilityLabel="Align right" />
            <Toolbar.ToggleItem value="justify" icon="alignJustify" accessibilityLabel="Justify" />
          </Toolbar.ToggleGroup>
        </Toolbar>
      </Column>
    </Column>
  );
}
