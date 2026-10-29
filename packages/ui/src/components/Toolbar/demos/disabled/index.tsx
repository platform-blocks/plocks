import { Toolbar } from '@plocks/ui';

export function Demo() {
  return (
    <Toolbar accessibilityLabel="Text formatting">
      <Toolbar.ToggleGroup type="multiple" defaultValue={['bold']} accessibilityLabel="Style">
        <Toolbar.ToggleItem value="bold" icon="bold" accessibilityLabel="Bold" />
        <Toolbar.ToggleItem value="italic" icon="italic" accessibilityLabel="Italic" disabled />
        <Toolbar.ToggleItem value="underline" icon="underline" accessibilityLabel="Underline" />
      </Toolbar.ToggleGroup>
      <Toolbar.Divider />
      <Toolbar.ToggleGroup type="single" defaultValue="left" disabled accessibilityLabel="Alignment">
        <Toolbar.ToggleItem value="left" icon="alignLeft" accessibilityLabel="Align left" />
        <Toolbar.ToggleItem value="center" icon="alignCenter" accessibilityLabel="Align center" />
        <Toolbar.ToggleItem value="right" icon="alignRight" accessibilityLabel="Align right" />
      </Toolbar.ToggleGroup>
    </Toolbar>
  );
}
