import { useState } from 'react';
import { Button, Lightbox } from '@plocks/ui';
import type { LightboxItem } from '@plocks/ui';

const IMAGES: LightboxItem[] = [
  { id: 'mountains', uri: require('../../../../assets/images/scene-mountains.png'), title: 'Mountain Landscape' },
  { id: 'forest', uri: require('../../../../assets/images/scene-forest.png'), title: 'Forest Path' },
  { id: 'lake', uri: require('../../../../assets/images/scene-lake.png'), title: 'Alpine Lake' },
];

export function Demo() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button onPress={() => setOpened(true)}>Open lightbox</Button>
      <Lightbox opened={opened} images={IMAGES} maxZoom={4} onClose={() => setOpened(false)} />
    </>
  );
}
