---
title: Stroke
category: styling
order: 68
tags: [stroke, outline, text-stroke, typography]
highlightLines: []
status: stable
hidden: false
---

`stroke` outlines the glyphs: pass a color for a 1px stroke, or `{ c, w }` for color and width. Add `c="transparent"` for outline-only text. On web this is a true `-webkit-text-stroke`; React Native has no text stroke, so native approximates it with a `textShadow` halo and outline-only text fills with the stroke color instead.
