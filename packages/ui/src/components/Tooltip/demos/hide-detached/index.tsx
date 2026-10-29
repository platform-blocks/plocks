import { Block, ScrollArea, Text, Tooltip } from '@plocks/ui';

export function Demo() {
  return (
    <ScrollArea fullWidth h={160} contentProps={{ p: 'md', gap: 'sm' }}>
      {Array.from({ length: 8 }, (_, index) => {
        const item = (
          <Block key={index} bg="subtle" p="sm">
            <Text>Item {index + 1}</Text>
          </Block>
        );
        return index === 1 ? (
          <Tooltip key={index} label="Scroll me out of view" opened>
            {item}
          </Tooltip>
        ) : (
          item
        );
      })}
    </ScrollArea>
  );
}
