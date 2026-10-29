import React from 'react';
import { AccessibilityInfo, Text, TextInput } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { Field, useFieldContext, type FieldRenderProps } from '../Field';

describe('Field (native)', () => {
  it('renders label, description, control and helper text, wiring the control', () => {
    render(
      <Field id="email" label="Email" description="Work address" helperText="We never share it" required>
        {({ controlProps }) => <TextInput testID="input" {...controlProps} />}
      </Field>
    );

    expect(screen.getByText(/Email/)).toBeTruthy();
    expect(screen.getByText('Work address')).toBeTruthy();
    expect(screen.getByText('We never share it')).toBeTruthy();

    const input = screen.getByTestId('input');
    expect(input.props.id).toBe('email');
    expect(input.props['aria-label']).toBe('Email, required');
    expect(input.props.accessibilityHint).toBe('Work address. We never share it');
  });

  it('announces the required label instead of the asterisk', () => {
    render(
      <Field label="Email" required>
        <TextInput />
      </Field>
    );
    // The visual asterisk stays, but the label node's spoken name is "Email, required".
    expect(screen.getByLabelText('Email, required')).toBeTruthy();
  });

  it('shows the error (instead of helper text) as a polite alert', () => {
    const spoken = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions').mockImplementation(() => {});
    render(
      <Field id="name" label="Name" helperText="Full name" error="Name is required">
        {({ controlProps, invalid }) => <TextInput testID="input" {...controlProps} aria-invalid={invalid} />}
      </Field>
    );
    expect(screen.queryByText('Full name')).toBeNull();
    const alert = screen.getByRole('alert');
    expect(alert.props.id).toBe('name-error');
    expect(alert.props['aria-live']).toBe('polite');
    expect(screen.getByText('Name is required')).toBeTruthy();
    expect(screen.getByTestId('input').props.accessibilityHint).toBe('Name is required');
    // iOS has no live regions, so the new error is spoken explicitly.
    expect(spoken).toHaveBeenCalledWith('Name is required', { queue: true });
    spoken.mockRestore();
  });

  it('exposes the wiring to nested controls through useFieldContext', () => {
    const Control = () => {
      const field = useFieldContext();
      return <Text testID="ctx">{`${field?.ids.control}|${field?.invalid}|${field?.disabled}`}</Text>;
    };
    render(
      <Field id="c" label="Custom" disabled error>
        <Control />
      </Field>
    );
    expect(screen.getByTestId('ctx').props.children).toBe('c|true|true');
  });

  it('places the label beside the control', () => {
    render(
      <Field label="Accept terms" labelPosition="end" testID="field">
        <TextInput testID="control" />
      </Field>
    );
    expect(screen.getByTestId('field')).toBeTruthy();
    expect(screen.getByText('Accept terms')).toBeTruthy();
  });

  it('returns no context outside a Field', () => {
    const Probe = () => <Text testID="p">{String(useFieldContext())}</Text>;
    render(<Probe />);
    expect(screen.getByTestId('p').props.children).toBe('null');
  });

  it('shows a success message in the helper slot and flags success, until an error wins', () => {
    const Control = ({ controlProps, success, invalid }: FieldRenderProps) => (
      <>
        <TextInput testID="input" {...controlProps} />
        <Text testID="flags">{`${success}|${invalid}`}</Text>
      </>
    );
    const { rerender } = render(
      <Field id="user" label="Username" helperText="Pick a handle" success="Username is available">
        {Control}
      </Field>
    );
    expect(screen.getByText('Username is available')).toBeTruthy();
    expect(screen.queryByText('Pick a handle')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('input').props.accessibilityHint).toBe('Username is available');
    expect(screen.getByTestId('flags').props.children).toBe('true|false');

    rerender(
      <Field id="user" label="Username" success="Username is available" error="Username is taken">
        {Control}
      </Field>
    );
    expect(screen.queryByText('Username is available')).toBeNull();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByTestId('flags').props.children).toBe('false|true');
  });

  it('treats `success` as a flag only when it has no message', () => {
    render(
      <Field id="code" label="Code" helperText="Six digits" success>
        {({ controlProps, success }) => (
          <>
            <TextInput testID="input" {...controlProps} />
            <Text testID="flag">{String(success)}</Text>
          </>
        )}
      </Field>
    );
    expect(screen.getByText('Six digits')).toBeTruthy();
    expect(screen.getByTestId('flag').props.children).toBe('true');
  });
});
