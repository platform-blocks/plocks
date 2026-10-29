import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { Toolbar } from '../Toolbar';

describe('Toolbar', () => {
  it('toggles a standalone toggle and reports the next state', () => {
    const onActiveChange = jest.fn();
    const { getByLabelText } = render(
      <Toolbar>
        <Toolbar.Toggle accessibilityLabel="Bold" onActiveChange={onActiveChange}>B</Toolbar.Toggle>
      </Toolbar>
    );
    fireEvent.press(getByLabelText('Bold'));
    expect(onActiveChange).toHaveBeenCalledWith(true);
    fireEvent.press(getByLabelText('Bold'));
    expect(onActiveChange).toHaveBeenLastCalledWith(false);
  });

  it('single group keeps one value and deselects to null', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <Toolbar>
        <Toolbar.ToggleGroup type="single" defaultValue="left" onChange={onChange}>
          <Toolbar.ToggleItem value="left" accessibilityLabel="Left">L</Toolbar.ToggleItem>
          <Toolbar.ToggleItem value="right" accessibilityLabel="Right">R</Toolbar.ToggleItem>
        </Toolbar.ToggleGroup>
      </Toolbar>
    );
    fireEvent.press(getByLabelText('Right'));
    expect(onChange).toHaveBeenLastCalledWith('right');
    fireEvent.press(getByLabelText('Right'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('multiple group reports the array of active values', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <Toolbar>
        <Toolbar.ToggleGroup type="multiple" defaultValue={['bold']} onChange={onChange}>
          <Toolbar.ToggleItem value="bold" accessibilityLabel="Bold">B</Toolbar.ToggleItem>
          <Toolbar.ToggleItem value="italic" accessibilityLabel="Italic">I</Toolbar.ToggleItem>
        </Toolbar.ToggleGroup>
      </Toolbar>
    );
    fireEvent.press(getByLabelText('Italic'));
    expect(onChange).toHaveBeenLastCalledWith(['bold', 'italic']);
    fireEvent.press(getByLabelText('Bold'));
    expect(onChange).toHaveBeenLastCalledWith(['italic']);
  });

  it('a disabled group ignores presses', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <Toolbar>
        <Toolbar.ToggleGroup type="multiple" disabled onChange={onChange}>
          <Toolbar.ToggleItem value="bold" accessibilityLabel="Bold">B</Toolbar.ToggleItem>
        </Toolbar.ToggleGroup>
      </Toolbar>
    );
    fireEvent.press(getByLabelText('Bold'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
