---
title: useHapticsSettings
category: input
order: 20
tags: [haptics, settings, feedback, native]
status: stable
since: 0.1.0
hidden: false
---

Read and flip the app-wide haptics switch that `useHaptics`, and every component built on it such as Button, Toast and Wheel, obeys: `enabled`, `setEnabled(on)` and `temporarilyDisable(ms)`. `PlocksProvider` mounts the `HapticsProvider` it reads from; `useOptionalHapticsSettings` returns undefined instead of throwing when there is none.
