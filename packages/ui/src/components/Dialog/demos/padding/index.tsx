import { useState } from 'react';
import { Block, Button, Dialog, Text } from '@plocks/ui';

export function Demo() {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Button onPress={() => setOpened(true)}>Open profile</Button>
      <Dialog
        opened={opened}
        variant="bottomsheet"
        accessibilityLabel="Profile"
        p={0}
        onClose={() => setOpened(false)}
      >
        <Block h={120} bg="primary" />
        <Block p="lg">
          <Text fw="600">Ada Lovelace</Text>
        </Block>
      </Dialog>
    </>
  );
}
