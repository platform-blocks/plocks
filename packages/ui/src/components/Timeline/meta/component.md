---
name: Timeline
description: A timeline component for displaying chronological sequences of events or steps
category: data
subcategory: Navigation
tags: [timeline, chronological, events, history, steps]
status: stable
playground: true
platform:
  web: true
  ios: true
  android: true
accessibility:
  - Screen reader compatible
  - Semantic HTML structure
  - Keyboard navigation
related:
  - Stepper
  - Progress
  - Breadcrumbs
props:
  active: Index of the last highlighted item; earlier items read as done
  color: Timeline color — palette token, `'primary.5'` shade syntax, or any CSS color
  align: Side of the spine the items sit on — 'left' | 'right'
  centerMode: Single central spine with items on both sides (auto-enabled when any item has `opposite`)
  size: Size token or title font size in px
  lineWidth: Connector line thickness
  bulletSize: Bullet diameter
  "Timeline.Item title": Item title
  "Timeline.Item timestamp": Timestamp text or node above the title
  "Timeline.Item bullet": Custom bullet content (icon, avatar)
  "Timeline.Item lineVariant": 'solid' | 'dashed' | 'dotted'
  "Timeline.Item itemAlign": Per-item side override — 'left' | 'right'
  "Timeline.Item opposite": Content rendered on the other side of the line (a timestamp, a label); switches the timeline to the centered layout
  "Timeline.Item alternate": Swap sides — content moves to the other column and `opposite` takes its place
examples:
  basic: Basic timeline usage
  alignment: Different alignment options
  opposite: Content on the other side of the line
  bullets: Custom bullet styles
  lineProps: Timeline line customization
  sizes: Various sizes and spacing
---

Timeline component displays a sequence of events or steps in chronological order with customizable styling and layout options.
