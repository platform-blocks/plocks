import { useState } from 'react';

import { Toolbar } from '@plocks/ui';

export function Demo() {
  const [formatting, setFormatting] = useState<(string | number)[]>(['bold']);
  const [alignment, setAlignment] = useState<string | number | null>('left');

  return (
    <Toolbar accessibilityLabel="Text formatting">
      <Toolbar.ToggleGroup type="multiple" value={formatting} onChange={setFormatting} accessibilityLabel="Style">
        <Toolbar.ToggleItem value="bold" icon="bold" accessibilityLabel="Bold" />
        <Toolbar.ToggleItem value="italic" icon="italic" accessibilityLabel="Italic" />
        <Toolbar.ToggleItem value="underline" icon="underline" accessibilityLabel="Underline" />
      </Toolbar.ToggleGroup>
      <Toolbar.Divider />
      <Toolbar.ToggleGroup value={alignment} onChange={setAlignment} accessibilityLabel="Alignment">
        <Toolbar.ToggleItem value="left" icon="alignLeft" accessibilityLabel="Align left" />
        <Toolbar.ToggleItem value="center" icon="alignCenter" accessibilityLabel="Align center" />
        <Toolbar.ToggleItem value="right" icon="alignRight" accessibilityLabel="Align right" />
      </Toolbar.ToggleGroup>
      <Toolbar.Divider />
      <Toolbar.Toggle icon="link" accessibilityLabel="Insert link" />
    </Toolbar>
  );
}
