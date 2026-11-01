---
name: Waveform
description: A waveform visualization component for audio data representation and interaction
category: media
subcategory: Visualization
tags: [audio, waveform, visualization, media, interactive]
status: stable
since: 0.1.0
playground: true
platform:
  web: true
  ios: true
  android: true
accessibility:
  - Screen reader compatible
  - Keyboard controls
  - ARIA labels
related:
  - Chart
  - Progress
  - Slider
examples:
  basic: Basic waveform display
  variants: Different visual variants
  sizes: The seven size tokens
  synchronized: Synchronized waveforms
  audioPlayback: Waveform driven by real audio playback
  videoSync: Waveform synced to the Video component
  interactive: Interactive waveform controls
  fullWidth: Full width responsive layout
  regions: Pressable regions and an externally driven playhead
---

Waveform visualizes audio data and can provide a seek control. `regions` lay pressable spans over it (slices of a chopped sample: `onRegionPress(index)`, one named button per region), and `playhead` takes a Reanimated shared value the caller writes every frame, so a live playback line moves without re-rendering the waveform.
