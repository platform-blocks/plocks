---
title: Held modifiers
category: basics
order: 10
tags: [keyboard, modifiers, held]
status: stable
hidden: false
---

`useModifierKeys()` returns `{ alt, ctrl, meta, shift }` and re-renders only when one of them changes — here, to show what a drag would do. In a gesture handler, read `getModifierKeys()` instead: no render at all.
