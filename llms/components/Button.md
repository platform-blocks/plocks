# Button

A flexible interactive button element supporting variants, sizes, icons, loading state, and full-width layout. `variant="none"` makes it the library's unstyled pressable: custom tiles, pads and rows keep real button behavior without a bare `Pressable`.

## Metadata

- Import: `import { Button } from '@plocks/ui';`
- Since: 0.1.0
- Tags: action, pressable, interactive
- Docs: https://plocks.dev/components/Button
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/ui/src/components/Button

## Props

- `title`: string — Button text content - can be provided via title prop or children
- `children`: React.ReactNode — Button text content - alternative to title prop
- `onPress`: () => void — Called when the button is pressed
- `onPressIn`: () => void — Called when the button press starts (for immediate feedback)
- `onPressOut`: () => void — Called when the button press ends
- `onHoverIn`: () => void — Called when the button is hovered (web/desktop only)
- `onHoverOut`: () => void — Called when the button is no longer hovered (web/desktop only)
- `onLongPress`: () => void — Called when the button is long-pressed
- `onLayout`: (event: LayoutChangeEvent) => void — Called when the button layout is calculated
- `variant`: 'default' | 'filled' | 'light' | 'subtle' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'link' | 'none' = 'default' ('filled' when `color` is set) — Button visual variant. `default` is a neutral button — a recessed fill with a visible border and body text — so an unstyled `<Button>` never claims the accent color. A solid primary fill is opt-in via `filled`. Passing a `color` without a `variant` gives a `filled` button in that color, with readable text picked for it. `none` is the unstyled pressable: no fill, no visible border, no padding and no fixed height, so the children you pass are the whole look (a pad, a tile, a list row, a swatch). It keeps everything else a Button does — the `button` role and accessible name, keyboard focus and the focus ring, press/hover feedback, haptics, `disabled` / `loading`, `tooltip`, `onLongPress` — so reach for it before a bare `Pressable` or a `Block` with `onPress`. Element children render as they are, in a centered row; text children get the label style (inheriting the color on web). `style` sizes and shapes it.
- `color`: ColorProp — Theme color the button is tinted with. A palette token (`primary`, `success`, `error`, …), `'primary.6'` shade syntax, or any raw CSS/hex color. Applies to the color-bearing variants (`filled`, `light`, `subtle`, `outline`, `gradient`) and to the text of `ghost`/`link`. Defaults to `primary`. `secondary` stays neutral by design. With no `variant`, a `color` makes the button `filled`.
- `size`: SizeValue — Button size: a size token, or a number (the control height in px).
- `disabled`: boolean — Whether the button is disabled
- `loading`: boolean — Whether button is in loading state (shows loader, sets `aria-busy`)
- `loadingTitle`: string — Text to show when loading (if not provided, shows empty text but maintains original width)
- `fullWidth`: boolean — Whether button should fill the full width of its parent container. Buttons size to their content by default; `fullWidth`, an explicit `w`, `flex`, or a flex value in `style` makes them fill instead.
- `flex`: number — Flex factor of the button inside a flex row or column, such as `flex={1}` for buttons that share a row equally. Sizes the button's outer wrapper, so the visible button fills the space it gets.
- `textColor`: ColorProp — Explicit text color override (else derived automatically from variant & color)
- `icon`: React.ReactNode — Icon to show in the center (for icon-only buttons). Icon-only buttons need an accessible name: pass `accessibilityLabel`, or a `tooltip` (used as the name).
- `startSection`: React.ReactNode — Content (usually an icon) before the label.
- `endSection`: React.ReactNode — Content (usually an icon) after the label.
- `tooltip`: TooltipPropValue — Tooltip shown on hover/focus — wraps the button in a `Tooltip`. Pass a string for the common case, or a config object to tune the tooltip: `tooltip={{ label: 'Long explanation…', maw: 320, withArrow: true }}`. For an icon-only button without `accessibilityLabel`, the tooltip text is also the button's accessible name.
- `transitionDuration`: number = 110 — Length of the press / pulse / hover transitions in ms. `0` applies each state instantly (no scale animation). Always 0 under reduced motion.
- `accessibilityLabel`: string — Accessible name. Defaults to the button's text; icon-only buttons fall back to the tooltip text.
- `accessibilityHint`: string — Accessibility hint for screen readers (native)
- `labelProps`: Omit<TextProps, 'children'> — Override props applied to the inner label `<Text>` (style, weight, ff, size, color).
- `w`: DimensionProp — Width
- `h`: DimensionProp — Height
- `miw`: DimensionProp — Minimum width
- `maw`: DimensionProp — Maximum width
- `mih`: DimensionProp — Minimum height
- `mah`: DimensionProp — Maximum height
- `bg`: ThemeColor — Background: a `theme.backgrounds` token (`'surface'`, `'subtle'`, `'elevated'`…), a palette name (its subtle tint), `'primary.5'` shade syntax, or any CSS color.
- `opacity`: number — Opacity, `0`–`1`

Also accepts the shared props — base (`style` `testID`), spacing (`m` `mt` `mr` `mb` `ml` `mx` `my` `p` `pt` `pr` `pb` `pl` `px` `py`), `radius`, `shadow`, visibility (`lightHidden` `darkHidden` `hiddenFrom` `visibleFrom`): https://plocks.dev/llms/guides/shared-props.md

## Examples

### Basics

Label a button with `title` (or children) and pass `onPress` to run its action.

```tsx
import { Button } from '@plocks/ui';

export function Demo() {
  return <Button title="Launch mission" />;
}
```

### Colors

Pair `color` with a color-bearing variant (`filled`, `light`, `subtle`, `outline`, `gradient`) to align actions with brand intent. With no `variant`, `color` alone gives a filled button whose text contrasts automatically. An explicit `variant="default"` stays neutral and ignores `color`.

```tsx
import { Button, Row } from '@plocks/ui';

export function Demo() {
  return (
    <Row gap="md" wrap="wrap">
      <Button color="primary">Primary</Button>
      <Button color="secondary">Secondary</Button>
      <Button color="success">Success</Button>
      <Button color="warning">Warning</Button>
      <Button color="error">Error</Button>
      <Button color="#5865F2">Custom</Button>
    </Row>
  );
}
```

### Loading state

Set `loading` to swap the label for a spinner and block presses. Add `loadingTitle` to keep text beside the spinner.

```tsx
import { Button, Row } from '@plocks/ui';

export function Demo() {
  return (
    <Row gap="md" wrap="wrap">
      <Button loading>Submit application</Button>
      <Button loading loadingTitle="Submitting…">
        Submit application
      </Button>
    </Row>
  );
}
```

### Variants

Preview the available button variants to match the desired emphasis level.

```tsx
import { Button, Row } from '@plocks/ui';

export function Demo() {
  return (
    <Row gap="md" wrap="wrap">
      <Button variant="default">Default</Button>
      <Button variant="filled">Filled</Button>
      <Button variant="light">Light</Button>
      <Button variant="subtle">Subtle</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="gradient">Gradient</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="none">Text only</Button>
    </Row>
  );
}
```

### Unstyled pressable

`variant="none"` drops the chrome — no fill, border, padding or fixed height — and keeps the button: its role and name, keyboard focus and focus ring, press feedback, haptics, `disabled`, `tooltip` and `onLongPress`. Use it for pressables whose children are the whole look (tiles, pads, rows, swatches) instead of a bare `Pressable` or a `Block` with `onPress`. `IconButton variant="none"` is the icon-only form.

```tsx
import { useState } from 'react';
import { Block, Button, IconButton, Row, Text } from '@plocks/ui';

const TILES = [
  { id: 'kick', label: 'Kick', color: '#f97316' },
  { id: 'snare', label: 'Snare', color: '#22c55e' },
  { id: 'hat', label: 'Hat', color: '#3b82f6' },
];

export function Demo() {
  const [picked, setPicked] = useState('kick');
  const [starred, setStarred] = useState(false);

  return (
    <Row gap="md" align="center" wrap="wrap">
      {TILES.map((tile) => (
        <Button
          key={tile.id}
          variant="none"
          accessibilityLabel={tile.label}
          aria-pressed={picked === tile.id}
          onPress={() => setPicked(tile.id)}
          style={{ borderRadius: 12 }}
        >
          <Block
            w={72}
            h={72}
            radius="md"
            justify="center"
            align="center"
            style={{ backgroundColor: tile.color, opacity: picked === tile.id ? 1 : 0.55 }}
          >
            <Text fw="700" c="white">{tile.label}</Text>
          </Block>
        </Button>
      ))}
      <IconButton
        variant="none"
        icon="heart"
        color={starred ? 'warning' : undefined}
        accessibilityLabel={starred ? 'Unstar' : 'Star'}
        onPress={() => setStarred((s) => !s)}
      />
    </Row>
  );
}
```

### Sizes

Preview the available button size tokens for different density requirements.

```tsx
import { Button, Row } from '@plocks/ui';

export function Demo() {
  return (
    <Row gap="md" wrap="wrap" align="flex-end">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra large</Button>
    </Row>
  );
}
```

### Localized labels

Switch locales at runtime and render translated button copy with `useI18n` helpers.

```tsx
import { Button, Flex, Select, useI18n } from '@plocks/ui';

const LOCALES = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' },
];

export function Demo() {
  const { t, locale, setLocale } = useI18n();

  return (
    <Flex>
      <Select
        options={LOCALES}
        value={locale}
        onChange={(value) => { if (value) setLocale(value); }}
      />
      <Button title={t('button.demo.submit')} />
    </Flex>
  );
}
```

### Tooltips

Add contextual hints to buttons with `tooltip` and optional placement overrides.

```tsx
import { Button, Row } from '@plocks/ui';

export function Demo() {
  return (
    <Row gap="md" wrap="wrap">
      <Button tooltip="Save your current work.">Save</Button>
      <Button tooltip={{ label: 'Permanently delete this item.', position: 'bottom' }}>
        Delete
      </Button>
      <Button tooltip={{ label: 'Download the file to your device.', position: 'left' }}>
        Download
      </Button>
      <Button tooltip={{ label: 'Get help and support resources.', position: 'right' }}>
        Help
      </Button>
    </Row>
  );
}
```

### Width

Buttons hug their label by default. Set `w` to a pixel or percentage width, or `fullWidth` to fill the container. In a row, `flex={1}` makes buttons share the space equally.

```tsx
import { Block, Button, Row } from '@plocks/ui';

export function Demo() {
  return (
    <Block fullWidth>
      <Button>Default width</Button>
      <Button w={200}>Fixed width (200)</Button>
      <Button w="50%">Half width (50%)</Button>
      <Button fullWidth>Full width</Button>
      <Row gap="sm">
        <Button flex={1}>Cancel</Button>
        <Button flex={1} variant="filled">Save</Button>
      </Row>
    </Block>
  );
}
```
