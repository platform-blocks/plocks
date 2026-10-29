import { Block, Input } from '@plocks/ui';

export function Demo() {
  return (
    <Block fullWidth>
      <Input label="Username" value="ada_lovelace" success="Username is available" />
      <Input label="Invite code" value="PLOCKS-2026" success />
    </Block>
  );
}
