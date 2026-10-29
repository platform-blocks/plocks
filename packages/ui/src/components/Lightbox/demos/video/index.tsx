import { useState } from 'react';
import { Button, Lightbox } from '@plocks/ui';
import type { LightboxItem } from '@plocks/ui';

const SLIDES: LightboxItem[] = [
  { id: 'ocean', uri: require('../../../../assets/images/scene-ocean.png'), title: 'Coastal Sunrise' },
  {
    id: 'flower',
    type: 'video',
    src: 'https://developer.mozilla.org/shared-assets/videos/flower.mp4',
    poster: 'https://developer.mozilla.org/shared-assets/images/examples/flowers.jpg',
    title: 'Flower',
    muted: true,
    loop: true,
  },
  { id: 'city', uri: require('../../../../assets/images/scene-city.png'), title: 'City at Dusk' },
];

export function Demo() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button onPress={() => setOpened(true)}>Open lightbox</Button>
      <Lightbox opened={opened} images={SLIDES} onClose={() => setOpened(false)} />
    </>
  );
}
