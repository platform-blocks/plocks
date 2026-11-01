---
title: useHotkeys
category: keyboard
order: 10
tags: [keyboard, shortcuts, scoped]
status: stable
since: 0.1.0
hidden: false
---

Register scoped keyboard shortcuts that only run while the component using them stays mounted. A binding takes a handler or `{ keydown, keyup, repeat, preventDefault }`: `keyup` runs when the key of a matched press is released (or the window loses focus), and a modifier can be bound on its own (`'shift'`, `'alt'`), for held-key behavior. `useModifierKeys` reports which modifiers are held.
