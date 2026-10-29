---
title: Unstyled pressable
category: styling
order: 35
tags: [buttons, variants, pressable, custom]
highlightLines: []
status: stable
hidden: false
---

`variant="none"` drops the chrome — no fill, border, padding or fixed height — and keeps the button: its role and name, keyboard focus and focus ring, press feedback, haptics, `disabled`, `tooltip` and `onLongPress`. Use it for pressables whose children are the whole look (tiles, pads, rows, swatches) instead of a bare `Pressable` or a `Block` with `onPress`. `IconButton variant="none"` is the icon-only form.
