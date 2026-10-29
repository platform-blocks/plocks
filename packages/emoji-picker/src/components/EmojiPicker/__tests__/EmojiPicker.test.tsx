import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { EmojiPicker } from '../EmojiPicker';

describe('EmojiPicker on native', () => {
  it('returns the chosen emoji and adds it to recent selections', () => {
    const onSelect = jest.fn();
    const onRecentChange = jest.fn();
    const view = render(
      <EmojiPicker
        testID="picker"
        emojis={[{ id: 'heart', emoji: '❤️', name: 'Heart', category: 'reactions' }]}
        onSelect={onSelect}
        onRecentChange={onRecentChange}
      />,
    );

    fireEvent.press(view.getByTestId('picker-emoji-heart'));

    expect(onSelect).toHaveBeenCalledWith({ id: 'heart', emoji: '❤️', name: 'Heart', category: 'reactions', skinTone: 0 });
    expect(onRecentChange).toHaveBeenCalledWith(['❤️']);
  });

  it('draws its own frame by default and drops it with withBorder={false}', () => {
    const emojis = [{ id: 'heart', emoji: '❤️', name: 'Heart', category: 'reactions' }];
    const view = render(
      <>
        <EmojiPicker testID="framed" emojis={emojis} onSelect={jest.fn()} />
        <EmojiPicker testID="flush" emojis={emojis} onSelect={jest.fn()} withBorder={false} />
      </>,
    );

    const framed = StyleSheet.flatten(view.getByTestId('framed').props.style);
    expect(framed.borderWidth).toBe(1);
    expect(framed.borderRadius).toBeTruthy();
    expect(framed.backgroundColor).toBeTruthy();

    const flush = StyleSheet.flatten(view.getByTestId('flush').props.style);
    expect(flush.borderWidth).toBeUndefined();
    expect(flush.borderRadius).toBeUndefined();
    expect(flush.backgroundColor).toBeUndefined();
    expect(flush.overflow).toBe('hidden');
  });
});
