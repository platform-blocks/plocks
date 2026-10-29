import { useEffect, useMemo, useState } from 'react';
import { cancelAnimation, Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { Block, Text, Waveform } from '@plocks/ui';

import { WAVEFORM_DEMO_PEAKS } from '../data';

const SLICES = 4;
const SLICE_MS = 900;

export function Demo() {
  const [playing, setPlaying] = useState<number | null>(null);
  const playhead = useSharedValue(-1);

  const regions = useMemo(
    () =>
      Array.from({ length: SLICES }, (_, i) => ({
        start: i / SLICES,
        end: (i + 1) / SLICES,
        label: `Play slice ${i + 1}`,
        active: i === playing,
      })),
    [playing]
  );

  useEffect(() => {
    if (playing === null) return undefined;
    // Sweep the slice, then hide the line: the waveform itself never re-renders.
    playhead.value = playing / SLICES;
    playhead.value = withTiming((playing + 1) / SLICES, { duration: SLICE_MS, easing: Easing.linear });
    const done = setTimeout(() => {
      playhead.value = -1;
      setPlaying(null);
    }, SLICE_MS);
    return () => {
      clearTimeout(done);
      cancelAnimation(playhead);
    };
  }, [playing, playhead]);

  return (
    <Block fullWidth gap="xs">
      <Waveform
        peaks={WAVEFORM_DEMO_PEAKS}
        fullWidth
        h={72}
        regions={regions}
        onRegionPress={setPlaying}
        playhead={playhead}
        accessibilityLabel="Sample slices"
      />
      <Text size="sm" c="muted">
        {playing === null ? 'Press a slice to play it.' : `Playing slice ${playing + 1}`}
      </Text>
    </Block>
  );
}
