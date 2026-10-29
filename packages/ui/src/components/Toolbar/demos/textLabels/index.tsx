import { Toolbar } from '@plocks/ui';

export function Demo() {
  return (
    <Toolbar accessibilityLabel="Document actions">
      <Toolbar.ToggleGroup type="multiple" defaultValue={['bold']} accessibilityLabel="Style">
        <Toolbar.ToggleItem value="bold" icon="bold" accessibilityLabel="Bold" />
        <Toolbar.ToggleItem value="italic" icon="italic" accessibilityLabel="Italic" />
      </Toolbar.ToggleGroup>
      <Toolbar.Divider />
      <Toolbar.Toggle icon="save" defaultActive>Save</Toolbar.Toggle>
      <Toolbar.Toggle>Cancel</Toolbar.Toggle>
      <Toolbar.Toggle icon="share" autoWidth accessibilityLabel="Share" />
    </Toolbar>
  );
}
