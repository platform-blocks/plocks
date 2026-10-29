import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { TreeSelect } from '../TreeSelect';
it('renders the field label', () => {
  const view = render(<TreeSelect label="Food" data={[{ id: 'apple', label: 'Apple' }]} />);
  expect(view.getByText('Food')).toBeTruthy();
});
it('opens and selects a leaf by touch', () => {
  const onChange = jest.fn();
  const view = render(<TreeSelect label="Food" data={[{ id: 'apple', label: 'Apple' }]} onChange={onChange} />);
  fireEvent.press(view.getByText('Select…'));
  fireEvent.press(view.getByText('Apple'));
  expect(onChange).toHaveBeenCalledWith('apple');
});
it('renders selected values through renderPill and keeps the overflow count', () => {
  const onChange = jest.fn();
  const data = [{ id: 'apple', label: 'Apple' }, { id: 'pear', label: 'Pear' }, { id: 'plum', label: 'Plum' }];
  const view = render(<TreeSelect label="Food" mode="multiple" data={data} defaultValue={['apple', 'pear', 'plum']} maxDisplayedValues={2} onChange={onChange} renderPill={(node, { remove, disabled }) => <Text key={node.id} onPress={remove}>{`${node.label} pill${disabled ? ' (disabled)' : ''}`}</Text>} />);
  expect(view.getByText('Apple pill')).toBeTruthy();
  expect(view.getByText('Pear pill')).toBeTruthy();
  expect(view.queryByText('Plum pill')).toBeNull();
  expect(view.getByText('+1')).toBeTruthy();
  fireEvent.press(view.getByText('Apple pill'));
  expect(onChange).toHaveBeenCalledWith(['pear', 'plum']);
});
it('tells renderPill when the field is disabled', () => {
  const view = render(<TreeSelect label="Food" mode="checkbox" data={[{ id: 'apple', label: 'Apple' }]} defaultValue={['apple']} disabled renderPill={(node, { disabled }) => <Text key={node.id}>{`${node.label}:${disabled}`}</Text>} />);
  expect(view.getByText('Apple:true')).toBeTruthy();
});
