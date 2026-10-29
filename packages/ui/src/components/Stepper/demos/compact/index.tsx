import { Block, Stepper } from '@plocks/ui';

const steps = ['Type', 'Category', 'Location', 'Details', 'Photos', 'Review'];

export function Demo() {
  return (
    <Block fullWidth>
      <Stepper active={2} compact={{ base: true, md: false }}>
        {steps.map(label => (
          <Stepper.Step key={label} label={label} />
        ))}
      </Stepper>
    </Block>
  );
}
