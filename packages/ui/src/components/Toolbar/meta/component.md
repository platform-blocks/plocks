---
title: Toolbar
description: A row or column of toggles with toggle groups, dividers and one shared tab stop.
source: "@plocks/ui"
status: "beta"
category: input
playground: true
accessibility: "The root is a toolbar with aria-orientation. Toggles are buttons with aria-pressed and share one tab stop: arrow keys (RTL-aware) move between them across groups and dividers, Home/End jump to the ends, Space/Enter press. Icon-only toggles need an accessibilityLabel."
related:
  - "Toggle"
  - "SegmentedControl"
  - "IconButton"
  - "Menubar"
props:
  - name: "orientation"
    type: "'horizontal' | 'vertical'"
    description: "Layout direction; also decides which arrow keys move focus."
    default: "horizontal"
  - name: "variant"
    type: "'light' | 'filled'"
    description: "How active toggles are drawn, inherited by every toggle inside."
    default: "light"
  - name: "color"
    type: "ColorProp"
    description: "Accent of active toggles."
    default: "primary"
  - name: "size"
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'"
    description: "Toggle height (the Button scale), padding and gap."
    default: "md"
  - name: "withBorder"
    type: boolean
    description: "Draw a hairline border around the toolbar."
    default: true
  - name: "loop"
    type: boolean
    description: "Wrap arrow-key focus from the last toggle to the first."
    default: true
examples:
  - basic
  - toggleGroups
  - variants
  - sizes
  - orientation
  - textLabels
  - disabled
---

Toolbar groups formatting and tool toggles the way an editor does. `Toolbar.ToggleGroup` manages a single or multiple selection of `Toolbar.ToggleItem`s, `Toolbar.Toggle` is an independent toggle, and `Toolbar.Divider` separates sections. Every toggle shares one tab stop, so a long toolbar costs keyboard users a single Tab.
