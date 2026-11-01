---
title: useModifierKeys
category: keyboard
order: 12
tags: [keyboard, modifiers, shift, alt, held, web]
status: stable
since: 0.3.1
hidden: false
---

Know which modifier keys (`alt`, `ctrl`, `meta`, `shift`) are held right now from one shared, document-wide tracker: `useModifierKeys()` re-renders only when one changes, and `getModifierKeys()` reads the state inside an event or gesture handler without a render. Window blur releases everything. Web only; all `false` on native.
