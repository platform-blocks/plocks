import { Toolbar } from '@plocks/ui';

export function Demo() {
  return (
    <Toolbar orientation="vertical" accessibilityLabel="Drawing tools">
      <Toolbar.ToggleGroup type="single" defaultValue="text" accessibilityLabel="Tool">
        <Toolbar.ToggleItem value="text" icon="text" accessibilityLabel="Text" />
        <Toolbar.ToggleItem value="heading" icon="heading" accessibilityLabel="Heading" />
        <Toolbar.ToggleItem value="quote" icon="quote" accessibilityLabel="Quote" />
        <Toolbar.ToggleItem value="code" icon="code" accessibilityLabel="Code" />
      </Toolbar.ToggleGroup>
      <Toolbar.Divider />
      <Toolbar.Toggle icon="list" accessibilityLabel="Bulleted list" />
      <Toolbar.Toggle icon="listOrdered" accessibilityLabel="Numbered list" />
    </Toolbar>
  );
}
