import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { Video } from '../Video';

function postFromPlayer(iframe: HTMLIFrameElement, message: Record<string, unknown>) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', { data: JSON.stringify(message), source: iframe.contentWindow })
    );
  });
}

describe('YouTube playback (react-native-web DOM)', () => {
  it('renders a titled iframe and relays player events', () => {
    const onDurationChange = jest.fn();
    const onPlay = jest.fn();
    const onQualityChange = jest.fn();
    render(
      <Video
        source={{ youtube: 'dQw4w9WgXcQ' }}
        accessibilityLabel="Launch video"
        onDurationChange={onDurationChange}
        onPlay={onPlay}
        onQualityChange={onQualityChange}
      />
    );
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('title')).toBe('Launch video');

    postFromPlayer(iframe, { eventType: 'playerReady', data: { duration: 120 } });
    expect(onDurationChange).toHaveBeenCalledWith(120);

    postFromPlayer(iframe, { eventType: 'playerStateChange', data: 1 });
    expect(onPlay).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();

    postFromPlayer(iframe, { eventType: 'playerQualityChange', data: 'hd720' });
    expect(onQualityChange).toHaveBeenCalledWith('hd720');
  });

  it('updates the elapsed readout from the playhead a state change carries', () => {
    render(<Video source={{ youtube: 'dQw4w9WgXcQ' }} />);
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    postFromPlayer(iframe, { eventType: 'playerReady', data: { duration: 120, currentTime: 0 } });
    expect(screen.getByText('0:00 / 2:00')).toBeTruthy();

    // A seek while paused arrives as a state change, not a progress tick.
    postFromPlayer(iframe, { eventType: 'playerStateChange', data: { state: 2, currentTime: 42.5, duration: 120 } });
    expect(screen.getByText('0:42 / 2:00')).toBeTruthy();
    // The next poll at the same position must not leave it behind.
    postFromPlayer(iframe, { eventType: 'playerState', data: { currentTime: 42.55, duration: 120 } });
    expect(screen.getByText('0:42 / 2:00')).toBeTruthy();
  });

  it('ignores messages from other windows', () => {
    const onDurationChange = jest.fn();
    render(<Video source={{ youtube: 'dQw4w9WgXcQ' }} onDurationChange={onDurationChange} />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: JSON.stringify({ eventType: 'playerReady', data: { duration: 5 } }) })
      );
    });
    expect(onDurationChange).not.toHaveBeenCalled();
  });

  it('reports an invalid YouTube source as an alert', () => {
    const onError = jest.fn();
    render(<Video source={{ youtube: 'not a video' }} onError={onError} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onError).toHaveBeenCalledWith('Invalid YouTube video ID or URL');
  });
});
