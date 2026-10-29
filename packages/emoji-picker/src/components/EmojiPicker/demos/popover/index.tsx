import { useState } from 'react';
import { Button, Popover } from '@plocks/ui';
import { EmojiPicker } from '@plocks/emoji-picker';

export function Demo() {
  const [opened, setOpened] = useState(false);
  const [emoji, setEmoji] = useState('🙂');
  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-start" w={352}>
      <Popover.Target>
        <Button variant="outline">{emoji}</Button>
      </Popover.Target>
      <Popover.Dropdown>
        <EmojiPicker
          withBorder={false}
          w="100%"
          h={360}
          onSelect={selection => {
            setEmoji(selection.emoji);
            setOpened(false);
          }}
        />
      </Popover.Dropdown>
    </Popover>
  );
}
