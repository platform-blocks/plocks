import { Block, PasswordInput } from '@plocks/ui';

export function Demo() {
  return (
    <Block fullWidth>
      <PasswordInput label="Toggle skipped by Tab" defaultValue="secret" />
      <PasswordInput label="Toggle in tab order" defaultValue="secret" visibilityToggleFocusable />
    </Block>
  );
}
