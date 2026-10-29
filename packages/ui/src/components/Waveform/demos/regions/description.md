---
title: Regions and playhead
category: interaction
order: 60
tags: [waveform, regions, slices, playhead]
status: stable
hidden: false
---

`regions` splits the waveform into pressable spans (`onRegionPress(index)`), each its own named button. `playhead` takes a Reanimated shared value the caller writes from its clock: only the line moves, and the waveform never re-renders. Press a slice to "play" it.
