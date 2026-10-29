import { useState } from 'react';
import { Block, Button, IconButton, Row, Text } from '@plocks/ui';

const TILES = [
  { id: 'kick', label: 'Kick', color: '#f97316' },
  { id: 'snare', label: 'Snare', color: '#22c55e' },
  { id: 'hat', label: 'Hat', color: '#3b82f6' },
];

export function Demo() {
  const [picked, setPicked] = useState('kick');
  const [starred, setStarred] = useState(false);

  return (
    <Row gap="md" align="center" wrap="wrap">
      {TILES.map((tile) => (
        <Button
          key={tile.id}
          variant="none"
          accessibilityLabel={tile.label}
          aria-pressed={picked === tile.id}
          onPress={() => setPicked(tile.id)}
          style={{ borderRadius: 12 }}
        >
          <Block
            w={72}
            h={72}
            radius="md"
            justify="center"
            align="center"
            style={{ backgroundColor: tile.color, opacity: picked === tile.id ? 1 : 0.55 }}
          >
            <Text fw="700" c="white">{tile.label}</Text>
          </Block>
        </Button>
      ))}
      <IconButton
        variant="none"
        icon="heart"
        color={starred ? 'warning' : undefined}
        accessibilityLabel={starred ? 'Unstar' : 'Star'}
        onPress={() => setStarred((s) => !s)}
      />
    </Row>
  );
}
