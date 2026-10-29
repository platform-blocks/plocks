---
name: Card
title: Card
category: display
tags: [card, container, content, layout]
playground: true
props:
  variant: 'filled' (default) | 'outline' | 'elevated' | 'subtle' | 'ghost' | 'gradient'
  withBorder: Adds a 1px theme border on top of any variant
  borderColor: Custom border color (CSS string) — implies `withBorder`
  borderWidth: Custom border width in px — implies `withBorder`
  bg: Background override — accepts CSS color or theme palette name (`'primary' | 'gray' | 'success' | 'warning' | 'error' | 'secondary'`) → resolves to that palette's subtle shade. Also accepts `theme.backgrounds` keys (`'surface' | 'subtle' | 'elevated' | 'base'`).
  padding: Internal padding — size token ('xs'…'3xl') or pixel number
  clip: Clips children to the card's radius — use with full-bleed `Card.Section` content (off by default so menus/popovers can escape)
  radius: Corner radius (size token or number)
  shadow: Shadow token (overrides the variant's default shadow)
  onPress: Makes the card pressable; renders inside a `<Pressable>` with a pressed-state style
  onLongPress: Long-press handler; also makes the card pressable (`delayLongPress` sets the delay in ms)
  onPressIn: Press-start handler; also makes the card pressable (`onPressOut` for press end)
  pressedStyle: Style while pressed — replaces the variant's built-in press feedback, e.g. `{ opacity: 0.7 }`
  disabled: Disables every press handler + dims to 50%
examples:
  - basic
  - variants
  - border-and-bg
  - sections
subComponents:
  - name: Card.Section
    description: Sub-region that opts out of the parent Card's padding for full-bleed images, dividers, or banded content. Position-aware — first/last sections also escape top/bottom padding.
    props:
      withBorder: Adds a 1px theme divider — top border when not first, bottom border when not last
      inheritPadding: Adds the Card's horizontal padding back inside the section so inner content lines up
      py: Vertical padding inside the section (size token or px)
      px: Horizontal padding inside the section (overrides `inheritPadding`)
---
The Card component provides a flexible container for displaying content.

## Selection

Card forwards `role` and `aria-*` to its root, so a selectable card needs no extra prop. Give it a role that has a selected state and pass `aria-selected`:

```tsx
<Card role="option" aria-selected={selected} onPress={() => setSelected(!selected)}>
  <Text>Pro plan</Text>
</Card>
```

Use `role="radio"` with `aria-checked` for single-choice groups.
