import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';

import { useLongPress } from '../useLongPress';

function LongPressPressable({ onCancel }: { onCancel?: () => void }) {
  const [label, setLabel] = useState('idle');
  const handlers = useLongPress(() => setLabel('long pressed'), {
    threshold: 300,
    onStart: () => setLabel('pressing'),
    onCancel: () => {
      setLabel('cancelled');
      onCancel?.();
    },
  });
  return (
    <Pressable role="button" {...handlers}>
      <Text>{label}</Text>
    </Pressable>
  );
}

function LongPressView() {
  const [label, setLabel] = useState('idle');
  const handlers = useLongPress(() => setLabel('long pressed'), { threshold: 300 });
  return (
    <View testID="target" {...handlers}>
      <Text>{label}</Text>
    </View>
  );
}

/** jsdom touch events carry no touches; react-native-web's responder reads them. */
function fireTouch(target: Element, type: 'touchStart' | 'touchEnd' | 'touchCancel') {
  const touch = { identifier: 0, target, clientX: 0, clientY: 0, pageX: 0, pageY: 0, force: 0 };
  const event = createEvent[type](target);
  const list = type === 'touchStart' ? [touch] : [];
  Object.defineProperty(event, 'touches', { value: list });
  Object.defineProperty(event, 'targetTouches', { value: list });
  Object.defineProperty(event, 'changedTouches', { value: [touch] });
  fireEvent(target, event);
}

describe('useLongPress (web)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fires after the threshold when the mouse is held on a Pressable', () => {
    render(<LongPressPressable />);
    const target = screen.getByRole('button');

    fireEvent.mouseDown(target);
    expect(screen.getByText('pressing')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(screen.getByText('pressing')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByText('long pressed')).toBeTruthy();

    fireEvent.mouseUp(target);
    expect(screen.getByText('long pressed')).toBeTruthy();
  });

  it('cancels when the mouse leaves or is released early', () => {
    const onCancel = jest.fn();
    render(<LongPressPressable onCancel={onCancel} />);
    const target = screen.getByRole('button');

    fireEvent.mouseDown(target);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    fireEvent.mouseLeave(target);
    expect(onCancel).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('cancelled')).toBeTruthy();

    fireEvent.mouseDown(target);
    fireEvent.mouseUp(target);
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('works through DOM touch events on a plain View', () => {
    render(<LongPressView />);
    const target = screen.getByTestId('target');

    fireTouch(target, 'touchStart');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByText('long pressed')).toBeTruthy();
    fireTouch(target, 'touchEnd');
  });

  it('cancels a plain View press on touchcancel', () => {
    render(<LongPressView />);
    const target = screen.getByTestId('target');

    fireTouch(target, 'touchStart');
    fireTouch(target, 'touchCancel');
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('idle')).toBeTruthy();
  });
});
