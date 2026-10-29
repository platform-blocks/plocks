import React, { createRef } from 'react';
import { AccessibilityInfo, StyleSheet, TextInput, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEFAULT_THEME } from '../../../core/theme/defaultTheme';
import { TextArea } from '../TextArea';

const getInput = () => screen.UNSAFE_getByType(TextInput);
const RING = DEFAULT_THEME.states!.focusRing!;

/** Whether the focus ring (the only node bordered in the ring color) is drawn. */
const ringDrawn = () =>
  screen.UNSAFE_queryAllByType(View).some((node) => StyleSheet.flatten(node.props.style)?.borderColor === RING);

describe('TextArea (native)', () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('forwards its ref to the TextInput', () => {
    const ref = createRef<TextInput>();
    render(<TextArea label="Notes" ref={ref} />);
    expect(ref.current).toBe(getInput().instance);
  });

  it('is multiline, labelled, and typeable uncontrolled', () => {
    render(<TextArea label="Notes" defaultValue="Hello" />);
    const input = getInput();
    expect(input.props.multiline).toBe(true);
    expect(input.props['aria-label']).toBe('Notes');
    fireEvent.changeText(input, 'Hello there');
    expect(getInput().props.value).toBe('Hello there');
  });

  it('shows the error as an alert instead of the helper text', () => {
    render(<TextArea label="Notes" helperText="Optional" error="Too short" />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Too short')).toBeTruthy();
    expect(screen.queryByText('Optional')).toBeNull();
  });

  it('grows with its content when autoResize is on', () => {
    render(<TextArea label="Notes" autoResize minRows={1} maxRows={3} defaultValue="one" />);
    expect(getInput().props.numberOfLines).toBe(1);
    fireEvent.changeText(getInput(), 'one\ntwo');
    expect(getInput().props.numberOfLines).toBe(2);
    fireEvent.changeText(getInput(), 'a\nb\nc\nd\ne');
    expect(getInput().props.numberOfLines).toBe(3);
  });

  it('counts characters and refuses text past maxLength', () => {
    render(<TextArea label="Bio" maxLength={5} showCharCounter defaultValue="abc" />);
    expect(screen.getByText('3/5')).toBeTruthy();
    fireEvent.changeText(getInput(), 'abcdefgh');
    expect(getInput().props.value).toBe('abc');
  });

  it('clears through a labelled clear button', () => {
    const onClear = jest.fn();
    render(<TextArea label="Notes" defaultValue="draft" clearable onClear={onClear} />);
    fireEvent.press(screen.getByLabelText('Clear'));
    expect(getInput().props.value).toBe('');
    expect(onClear).toHaveBeenCalled();
  });

  it('maps readOnly to a non-editable TextInput', () => {
    render(<TextArea label="Notes" readOnly value="fixed" />);
    expect(getInput().props.editable).toBe(false);
  });

  it('draws the focus ring while focused, except unstyled', () => {
    const { rerender } = render(<TextArea label="Notes" />);
    fireEvent(getInput(), 'focus');
    expect(ringDrawn()).toBe(true);
    rerender(<TextArea label="Notes" variant="unstyled" />);
    expect(ringDrawn()).toBe(false);
  });

  it('forces the focused look with `focused`', () => {
    const { rerender } = render(<TextArea label="Notes" focused />);
    expect(ringDrawn()).toBe(true);
    rerender(<TextArea label="Notes" focused={false} />);
    fireEvent(getInput(), 'focus');
    expect(ringDrawn()).toBe(false);
  });

  it('runs textInputProps.onFocus / onBlur alongside the ring and onFocus / onBlur', () => {
    const onFocus = jest.fn();
    const nativeFocus = jest.fn();
    const nativeBlur = jest.fn();
    render(<TextArea label="Notes" onFocus={onFocus} textInputProps={{ onFocus: nativeFocus, onBlur: nativeBlur }} />);
    fireEvent(getInput(), 'focus', { nativeEvent: {} });
    expect(nativeFocus).toHaveBeenCalledWith({ nativeEvent: {} });
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(ringDrawn()).toBe(true);
    fireEvent(getInput(), 'blur', { nativeEvent: {} });
    expect(nativeBlur).toHaveBeenCalledTimes(1);
    expect(ringDrawn()).toBe(false);
  });

  it('fills its parent with `flex`: no rows height, the box grows', () => {
    render(<TextArea label="Body" testID="body" flex={1} rows={4} />);
    expect(StyleSheet.flatten(screen.getByTestId('body').props.style).flex).toBe(1);
    const input = StyleSheet.flatten(getInput().props.style);
    expect(input.height).toBeUndefined();
    expect(input.flexGrow).toBe(1);
  });

  it('sizes the root with `w` (over `fullWidth`) and the text box with its own `h`', () => {
    render(<TextArea label="Notes" testID="notes" fullWidth w={240} h={120} />);
    const root = StyleSheet.flatten(screen.getByTestId('notes').props.style);
    expect(root.width).toBe(240);
    expect(root.height).toBeUndefined();
    expect(StyleSheet.flatten(getInput().props.style).height).toBe(120);
  });
});
