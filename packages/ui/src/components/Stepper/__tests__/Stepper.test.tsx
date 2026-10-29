import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { Stepper } from '../Stepper';

const mockTheme = {
  colors: {
    primary: ['#E6F0FF', '#D0E2FF', '#A6C8FF', '#78A9FF', '#4589FF', '#0F62FE', '#0043CE', '#002D9C'],
    gray: ['#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151'],
  },
  text: {
    primary: '#111111',
    secondary: '#555555',
    muted: '#888888',
    disabled: '#cccccc',
  },
  fontFamily: 'System',
};

jest.mock('../../../core/theme/ThemeProvider', () => ({
  useTheme: () => mockTheme,
}));

jest.mock('../../Loader', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Loader: ({ testID = 'stepper-loader' }: { testID?: string }) => (
      React.createElement(Text, { testID }, 'loading')
    ),
  };
});

describe('Stepper - behavior', () => {
  it('invokes onStepClick for completed steps when allowed', () => {
    const handleStepClick = jest.fn();
    const { getByLabelText } = render(
      <Stepper active={1} onStepClick={handleStepClick}>
        <Stepper.Step label="One" aria-label="step-one" />
        <Stepper.Step label="Two" aria-label="step-two" />
      </Stepper>
    );

    fireEvent.press(getByLabelText('step-one'));
    expect(handleStepClick).toHaveBeenCalledWith(0);
  });

  it('blocks presses on future steps when allowNextStepsSelect=false', () => {
    const handleStepClick = jest.fn();
    const { getByLabelText } = render(
      <Stepper active={0} onStepClick={handleStepClick} allowNextStepsSelect={false}>
        <Stepper.Step label="One" aria-label="step-one" />
        <Stepper.Step label="Two" aria-label="step-two" />
      </Stepper>
    );

    fireEvent.press(getByLabelText('step-two'));
    expect(handleStepClick).not.toHaveBeenCalled();
  });

  it('renders loader inside steps marked as loading', () => {
    const { getByTestId } = render(
      <Stepper active={0}>
        <Stepper.Step label="Loading" loading />
      </Stepper>
    );

    expect(getByTestId('stepper-loader')).toBeTruthy();
  });

  it('surfaces active step content beneath the indicators', () => {
    const { getByText } = render(
      <Stepper active={1}>
        <Stepper.Step label="Intro">
          <Text>Intro content</Text>
        </Stepper.Step>
        <Stepper.Step label="Details">
          <Text>Details content</Text>
        </Stepper.Step>
      </Stepper>
    );

    expect(getByText('Details content')).toBeTruthy();
  });

  it('centers labels under the icon by default and starts them beside it with labelPosition="right"', () => {
    const stacked = render(
      <Stepper active={0}>
        <Stepper.Step label="Cart" description="Review items" />
        <Stepper.Step label="Payment" />
      </Stepper>
    );
    expect(StyleSheet.flatten(stacked.getByText('Cart').props.style).textAlign).toBe('center');
    expect(StyleSheet.flatten(stacked.getByText('Review items').props.style).textAlign).toBe('center');

    const inline = render(
      <Stepper active={0} labelPosition="right">
        <Stepper.Step label="Cart" description="Review items" />
        <Stepper.Step label="Payment" />
      </Stepper>
    );
    expect(StyleSheet.flatten(inline.getByText('Cart').props.style).textAlign).toBe('left');
    expect(StyleSheet.flatten(inline.getByText('Review items').props.style).textAlign).toBe('left');
    expect(inline.getByText('Payment')).toBeTruthy();
  });

  it('ignores labelPosition for vertical steppers', () => {
    const { getByText } = render(
      <Stepper active={0} orientation="vertical" labelPosition="right">
        <Stepper.Step label="Cart" />
        <Stepper.Step label="Payment" />
      </Stepper>
    );
    expect(StyleSheet.flatten(getByText('Cart').props.style).textAlign).toBe('left');
  });

  it('renders completed content when active exceeds step count', () => {
    const { getByText } = render(
      <Stepper active={2}>
        <Stepper.Step label="Intro" />
        <Stepper.Step label="Details" />
        <Stepper.Completed>
          <Text>All done!</Text>
        </Stepper.Completed>
      </Stepper>
    );

    expect(getByText('All done!')).toBeTruthy();
  });

  describe('compact', () => {
    const steps = (
      [
        <Stepper.Step key="a" label="Cart" description="Review items" />,
        <Stepper.Step key="b" label="Shipping" description="Where to" />,
        <Stepper.Step key="c" label="Payment" />,
      ]
    );

    it('shows only the active step label, once, below the indicators', () => {
      const { queryByText, getAllByText, getByLabelText } = render(
        <Stepper active={1} compact>{steps}</Stepper>
      );
      expect(queryByText('Cart')).toBeNull();
      expect(queryByText('Payment')).toBeNull();
      expect(getAllByText('Shipping')).toHaveLength(1);
      expect(getAllByText('Where to')).toHaveLength(1);
      expect(StyleSheet.flatten(getAllByText('Shipping')[0].props.style).textAlign).toBe('center');
      // Hidden labels still name their steps.
      expect(getByLabelText('Cart')).toBeTruthy();
      expect(getByLabelText('Payment')).toBeTruthy();
    });

    it('shows no caption once every step is complete', () => {
      const { queryByText } = render(<Stepper active={3} compact>{steps}</Stepper>);
      expect(queryByText('Cart')).toBeNull();
      expect(queryByText('Payment')).toBeNull();
    });

    it('resolves a breakpoint map against the viewport', () => {
      const compactNow = render(<Stepper active={0} compact={{ base: true, xl: false }}>{steps}</Stepper>);
      expect(compactNow.queryByText('Shipping')).toBeNull();
      compactNow.unmount();

      const fullNow = render(<Stepper active={0} compact={{ base: false }}>{steps}</Stepper>);
      expect(fullNow.getByText('Shipping')).toBeTruthy();
    });

    it('is ignored by vertical steppers', () => {
      const { getByText } = render(<Stepper active={0} compact orientation="vertical">{steps}</Stepper>);
      expect(getByText('Shipping')).toBeTruthy();
      expect(getByText('Payment')).toBeTruthy();
    });
  });
});
