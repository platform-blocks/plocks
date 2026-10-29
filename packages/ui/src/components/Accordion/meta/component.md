---
name: Accordion
title: Accordion
description: Collapsible content panels for organizing related information with single or multiple expansion modes and visual variants.
status: stable
category: display
subcategories: [layout, disclosure]
tags: [collapse, expand, panel, ui, content-grouping]
playground: true
a11yKeyboard: Arrow keys / Home / End navigate headers; Enter or Space toggles; focus returns to header after collapse.
a11yRoles: Headers behave as buttons; panels use region role with aria-labelledby referencing header id.
theming: [radius, spacing, variant-colors, divider-opacity]
performanceNotes: Content lazily rendered only when expanded (optional); animations respect ReducedMotionProvider.
props:
  items: Array of `{ key, title, content, disabled?, icon? }` definitions
  type: Expansion mode — 'single' (default) keeps one item open, 'multiple' expands items independently
  disableCollapse: Keep one item open at all times — pressing the open item (or the last open item in multiple mode) does not collapse it
  variant: Visual variant — default | filled | outline | etc.
  size: Size token controlling spacing density
  showChevron: Render the chevron indicator on each header
  chevronPosition: 'start' | 'end'
  headerStyle: Style applied to each header View
  headerTextStyle: Raw TextStyle applied to header labels (escape hatch)
  contentStyle: Style applied to each item's content View
  titleProps: Override props applied to each item's header `<Text>` (style, fw, ff, size, c)
  animated: Enable transitions (`true`) or pass `{ duration, easing }`
  transitionDuration: Transition length in ms for the chevron spin and panel height; `0` is instant
examples:
  - basic
  - multiple
  - disableCollapse
  - variants
  - colors
  - title-customization
---

The Accordion component groups related content into expandable sections.
