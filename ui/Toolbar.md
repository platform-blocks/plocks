# Toolbar

Toolbar groups formatting and tool toggles the way an editor does. `Toolbar.ToggleGroup` manages a single or multiple selection of `Toolbar.ToggleItem`s, `Toolbar.Toggle` is an independent toggle, and `Toolbar.Divider` separates sections. Every toggle shares one tab stop, so a long toolbar costs keyboard users a single Tab.

## Metadata

- Import: `import { Toolbar } from '@plocks/ui';`
- Status: beta
- Docs: https://plocks.dev/components/Toolbar
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/ui/src/components/Toolbar

## Props

- `children` (required): React.ReactNode — Toolbar content: `Toolbar.Toggle`, `Toolbar.ToggleGroup`, `Toolbar.Divider`, or any other control.
- `orientation`: 'horizontal' | 'vertical' — Layout direction; also decides which arrow keys move focus.
- `variant`: 'filled' | 'light' — Visual style of active toggles, inherited by every toggle inside.
- `color`: ColorProp — Accent of active toggles. A palette token, `'primary.6'` shade syntax, or any CSS color.
- `size`: SizeValue — Size of toggles, padding and gap.
- `withBorder`: boolean — Draw a hairline border around the toolbar.
- `loop`: boolean — Wrap arrow-key focus from the last toggle to the first and back.
- `accessibilityLabel`: string — Accessible name of the toolbar.
- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), sizing (`fullWidth`), `radius`, visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

## Sub-components

`import { ToolbarToggle, ToolbarToggleGroup, ToolbarToggleItem, ToolbarDivider } from '@plocks/ui';`

### ToolbarToggle

- `active`: boolean — Active state (controlled).
- `defaultActive`: boolean — Initial active state (uncontrolled).
- `onActiveChange`: (active: boolean) => void — Called with the next active state when the toggle is pressed.
- `onPress`: () => void — Called on every press, after `onActiveChange`.
- `icon`: string | ExternalIconComponent | React.ReactElement — Icon to render, by registry name or as an external icon component/element.
- `children`: React.ReactNode — Content. A string renders as a label; anything else renders as-is.
- `disabled`: boolean — Whether the toggle is disabled.
- `autoWidth`: boolean — Size the toggle to its content instead of making an icon-only toggle square.
- `size`: SizeValue — Size override; defaults to the toolbar's.
- `color`: ColorProp — Accent override; defaults to the toolbar's.
- `variant`: 'filled' | 'light' — Variant override; defaults to the toolbar's.
- `accessibilityLabel`: string — Accessible name; required when the content isn't text (an icon-only toggle).
- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), `radius`, visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

### ToolbarToggleGroup

- `type`: 'single' | 'multiple' — One active item at a time; pressing the active item deselects it. Any number of active items.
- `value`: ToolbarToggleValue | null | ToolbarToggleValue[] — Active value (controlled). Active values (controlled).
- `defaultValue`: ToolbarToggleValue | null | ToolbarToggleValue[] — Initial active value (uncontrolled). Initial active values (uncontrolled).
- `onChange`: ((value: ToolbarToggleValue | null) => void) | ((value: ToolbarToggleValue[]) => void) — Called with the next value, or `null` when the active item is deselected. Called with the array of active values.
- `children` (required): React.ReactNode — `Toolbar.ToggleItem` components.
- `disabled`: boolean — Disables every item in the group.
- `accessibilityLabel`: string — Accessible name of the group.
- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

### ToolbarToggleItem

- `value` (required): ToolbarToggleValue — Identifies the item within its `Toolbar.ToggleGroup`.
- `icon`: string | ExternalIconComponent | React.ReactElement — Icon to render, by registry name or as an external icon component/element.
- `children`: React.ReactNode — Content. A string renders as a label; anything else renders as-is.
- `disabled`: boolean — Whether the toggle is disabled.
- `autoWidth`: boolean — Size the toggle to its content instead of making an icon-only toggle square.
- `size`: SizeValue — Size override; defaults to the toolbar's.
- `color`: ColorProp — Accent override; defaults to the toolbar's.
- `variant`: 'filled' | 'light' — Variant override; defaults to the toolbar's.
- `accessibilityLabel`: string — Accessible name; required when the content isn't text (an icon-only toggle).
- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), `radius`, visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

### ToolbarDivider

- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

### Toolbar.Divider

- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

### Toolbar.Toggle

- `active`: boolean — Active state (controlled).
- `defaultActive`: boolean — Initial active state (uncontrolled).
- `onActiveChange`: (active: boolean) => void — Called with the next active state when the toggle is pressed.
- `onPress`: () => void — Called on every press, after `onActiveChange`.
- `icon`: string | ExternalIconComponent | React.ReactElement — Icon to render, by registry name or as an external icon component/element.
- `children`: React.ReactNode — Content. A string renders as a label; anything else renders as-is.
- `disabled`: boolean — Whether the toggle is disabled.
- `autoWidth`: boolean — Size the toggle to its content instead of making an icon-only toggle square.
- `size`: SizeValue — Size override; defaults to the toolbar's.
- `color`: ColorProp — Accent override; defaults to the toolbar's.
- `variant`: 'filled' | 'light' — Variant override; defaults to the toolbar's.
- `accessibilityLabel`: string — Accessible name; required when the content isn't text (an icon-only toggle).
- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), `radius`, visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

### Toolbar.ToggleGroup

- `type`: 'single' | 'multiple' — One active item at a time; pressing the active item deselects it. Any number of active items.
- `value`: ToolbarToggleValue | null | ToolbarToggleValue[] — Active value (controlled). Active values (controlled).
- `defaultValue`: ToolbarToggleValue | null | ToolbarToggleValue[] — Initial active value (uncontrolled). Initial active values (uncontrolled).
- `onChange`: ((value: ToolbarToggleValue | null) => void) | ((value: ToolbarToggleValue[]) => void) — Called with the next value, or `null` when the active item is deselected. Called with the array of active values.
- `children` (required): React.ReactNode — `Toolbar.ToggleItem` components.
- `disabled`: boolean — Disables every item in the group.
- `accessibilityLabel`: string — Accessible name of the group.
- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

### Toolbar.ToggleItem

- `value` (required): ToolbarToggleValue — Identifies the item within its `Toolbar.ToggleGroup`.
- `icon`: string | ExternalIconComponent | React.ReactElement — Icon to render, by registry name or as an external icon component/element.
- `children`: React.ReactNode — Content. A string renders as a label; anything else renders as-is.
- `disabled`: boolean — Whether the toggle is disabled.
- `autoWidth`: boolean — Size the toggle to its content instead of making an icon-only toggle square.
- `size`: SizeValue — Size override; defaults to the toolbar's.
- `color`: ColorProp — Accent override; defaults to the toolbar's.
- `variant`: 'filled' | 'light' — Variant override; defaults to the toolbar's.
- `accessibilityLabel`: string — Accessible name; required when the content isn't text (an icon-only toggle).
- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), `radius`, visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

## Types

```ts
export type ToolbarToggleValue = string | number;
```

## Examples

### Basics

Group toggles with `Toolbar.ToggleGroup`, separate sections with `Toolbar.Divider`, and add independent `Toolbar.Toggle`s. Every toggle shares one tab stop; arrow keys move between them.

```tsx
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
```

### Toggle groups

`type="multiple"` keeps any number of items active and reports an array. `type="single"` keeps one, and pressing it again deselects it and reports `null`.

```tsx
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
```

### Variants and color

`variant` and `color` on the toolbar apply to every toggle inside. `light` tints active toggles; `filled` gives them a solid accent fill with legible content.

```tsx
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
```

### Sizes

`size` sets the toggle height (the same scale as `Button`), along with the toolbar's padding and gap.

```tsx
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
```

### Vertical orientation

A vertical toolbar stacks its toggles, draws dividers across, and moves focus with the Up and Down arrow keys.

```tsx
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
```

### Text labels

An icon-only toggle is square. A toggle with a text label sizes to its content, as does an icon toggle with `autoWidth`.

```tsx
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
```

### Disabled

Disable one item with `disabled` on it, or a whole group with `disabled` on `Toolbar.ToggleGroup`. Disabled toggles are skipped by arrow-key navigation.

```tsx
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
```
