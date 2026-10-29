import React, { useEffect, useRef } from 'react';

import type { LightboxVideoProps } from './LightboxVideo.types';

/**
 * Web video slide: the browser's own `<video controls>` player. Starts when
 * the slide becomes active (if `autoPlay`) and pauses when it is left.
 * @internal
 */
export function LightboxVideo({ item, active, width, height, label }: LightboxVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { autoPlay = false, muted = false, loop = false, src, poster } = item;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!active) {
      video.pause();
      return;
    }
    if (autoPlay) {
      // Browsers reject unmuted autoplay without a user gesture; the controls stay usable.
      const playing = video.play() as Promise<void> | undefined;
      playing?.catch?.(() => {});
    }
    return () => {
      video.pause();
    };
  }, [active, autoPlay, src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      controls
      muted={muted}
      loop={loop}
      playsInline
      preload="metadata"
      aria-label={label}
      style={{ width, height, maxWidth: '100%', objectFit: 'contain', backgroundColor: '#000000', display: 'block' }}
    />
  );
}
