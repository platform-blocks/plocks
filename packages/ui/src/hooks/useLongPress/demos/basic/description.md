---
title: Long press
category: basics
order: 10
tags: [press, long-press, pressable]
status: stable
hidden: false
---

`useLongPress(onLongPress, { threshold, onStart, onFinish, onCancel })` returns handlers to spread onto a `<Pressable>`, `<View>` or `<Button>`. `onLongPress` fires once after `threshold` ms (default 400); releasing, leaving or a system interrupt before that cancels the press.
