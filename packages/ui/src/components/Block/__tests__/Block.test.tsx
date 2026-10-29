import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEFAULT_THEME } from '../../../core/theme/defaultTheme';
import { Block } from '../Block';

/** How many entries of a (nested) style array set `key`. */
const timesSet = (style: unknown, key: string): number =>
  Array.isArray(style)
    ? style.reduce((n: number, entry) => n + timesSet(entry, key), 0)
    : style != null && typeof style === 'object' && (style as Record<string, unknown>)[key] !== undefined
      ? 1
      : 0;

describe('Block', () => {
  it('applies the box props to its root once', () => {
    render(
      <Block testID="block" w={120} mah="full" bg="surface" opacity={0.5}>
        <Text>inside</Text>
      </Block>
    );
    const style = screen.getByTestId('block').props.style;
    expect(StyleSheet.flatten(style)).toMatchObject({
      width: 120,
      maxHeight: '100%',
      backgroundColor: DEFAULT_THEME.backgrounds.surface,
      opacity: 0.5,
    });
    for (const key of ['width', 'maxHeight', 'backgroundColor', 'opacity']) {
      expect(timesSet(style, key)).toBe(1);
    }
  });

  it('lets an explicit w win over fullWidth', () => {
    render(<Block testID="block" fullWidth w={200} />);
    expect(StyleSheet.flatten(screen.getByTestId('block').props.style).width).toBe(200);
  });

  it('applies pressedStyle only while pressed', () => {
    render(
      <Block onPress={() => {}} bg="surface" pressedStyle={{ opacity: 0.7 }}>
        <Text>row</Text>
      </Block>
    );
    const [pressable] = screen.UNSAFE_root.findAll((node) => typeof node.props.style === 'function');
    const style = pressable.props.style;
    expect(StyleSheet.flatten(style({ pressed: false })).opacity).toBeUndefined();
    expect(StyleSheet.flatten(style({ pressed: true })).opacity).toBe(0.7);
  });

  it('forwards delayLongPress to the Pressable', () => {
    const onLongPress = jest.fn();
    render(
      <Block onLongPress={onLongPress} delayLongPress={250}>
        <Text>hold</Text>
      </Block>
    );
    expect(screen.UNSAFE_root.findAll((node) => node.props.delayLongPress === 250).length).toBeGreaterThan(0);
    fireEvent(screen.getByText('hold'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
