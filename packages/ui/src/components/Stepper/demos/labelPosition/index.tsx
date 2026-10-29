import { Block, Stepper } from '@plocks/ui';

export function Demo() {
  return (
    <Block fullWidth>
      <Stepper active={1} labelPosition="right">
        <Stepper.Step label="Account" description="Create your credentials" />
        <Stepper.Step label="Verification" description="Confirm your email" />
        <Stepper.Step label="Preferences" description="Adjust defaults" />
      </Stepper>
    </Block>
  );
}
