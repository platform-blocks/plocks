import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BottomAppBar } from '../BottomAppBar';
import type { BottomAppBarItem } from '../types';

// Icons sit inside an aria-hidden wrapper (the label names the item).
const HIDDEN = { includeHiddenElements: true };

const items: BottomAppBarItem[] = [
  { key: 'home', label: 'Home', icon: ({ color }) => <Text testID="home-icon">{color}</Text> },
  { key: 'search', label: 'Search', icon: ({ active, color }) => <Text testID="search-icon">{`${active}:${color}`}</Text> },
];

describe('BottomAppBar', () => {
  it('renders function icons and labels in the active and inactive colors', () => {
    const { getByTestId, getByText } = render(
      <BottomAppBar items={items} activeKey="home" activeColor="#ffffff" inactiveColor="#888888" />
    );
    expect(getByTestId('home-icon', HIDDEN)).toHaveTextContent('#ffffff');
    expect(getByTestId('search-icon', HIDDEN)).toHaveTextContent('false:#888888');
    expect(StyleSheet.flatten(getByText('Home').props.style).color).toBe('#ffffff');
    expect(StyleSheet.flatten(getByText('Search').props.style).color).toBe('#888888');
  });

  it('hides the active pill with indicator={false} and tints it with a color', () => {
    const pill = (indicator: boolean | string) => {
      const { getByTestId, unmount } = render(<BottomAppBar items={items} activeKey="home" indicator={indicator} />);
      // The pill is the icon's parent View.
      const color = StyleSheet.flatten(getByTestId('home-icon', HIDDEN).parent?.parent?.props.style).backgroundColor;
      unmount();
      return color;
    };
    expect(pill(false)).toBe('transparent');
    expect(pill('#123456')).toBe('#123456');
    expect(pill(true)).not.toBe('transparent');
  });

  it('colors count badges with badgeColor', () => {
    const { getByText } = render(
      <BottomAppBar items={[{ ...items[0], badgeCount: 3 }]} activeKey="home" badgeColor="#25d366" />
    );
    // Nearest ancestor with a background is the badge.
    let node = getByText('3', HIDDEN).parent;
    while (node && !StyleSheet.flatten(node.props.style)?.backgroundColor) node = node.parent;
    expect(StyleSheet.flatten(node?.props.style).backgroundColor).toBe('#25d366');
  });

  it('marks the active item and reports presses', () => {
    const onItemPress = jest.fn();
    const { getByLabelText } = render(<BottomAppBar items={items} activeKey="home" onItemPress={onItemPress} />);
    // `aria-current="page"` maps to the selected state on native.
    expect(getByLabelText('Home').props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(getByLabelText('Search'));
    expect(onItemPress).toHaveBeenCalledWith('search');
  });
});
