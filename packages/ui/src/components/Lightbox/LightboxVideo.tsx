import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { a11yProps } from '../../core/accessibility/a11yProps';
import { resolveOptionalModule } from '../../utils/optionalModule';
import { Icon } from '../Icon';
import type { LightboxVideoProps } from './LightboxVideo.types';

/** The slice of an `expo-video` player the slide drives. */
interface ExpoVideoPlayerLike {
  play(): void;
  pause(): void;
  loop: boolean;
  muted: boolean;
}

/** The parts of `expo-video` (an optional dependency) the slide uses. */
interface ExpoVideoModule {
  useVideoPlayer: (source: string, setup?: (player: ExpoVideoPlayerLike) => void) => ExpoVideoPlayerLike;
  VideoView: React.ComponentType<{
    player: ExpoVideoPlayerLike;
    style?: StyleProp<ViewStyle>;
    nativeControls?: boolean;
    contentFit?: 'contain' | 'cover' | 'fill';
    allowsFullscreen?: boolean;
    accessibilityLabel?: string;
  }>;
}

let expoVideo: ExpoVideoModule | null | undefined;

/** `expo-video` when installed, resolved on the first video slide (not at import). */
function loadExpoVideo(): ExpoVideoModule | null {
  if (expoVideo === undefined) {
    const mod = resolveOptionalModule<Partial<ExpoVideoModule>>('expo-video', {
      devWarning:
        'expo-video not found. Lightbox video slides show their poster on native; install expo-video to play them, or handle `onVideoPress`.',
    });
    expoVideo = mod?.useVideoPlayer && mod.VideoView ? (mod as ExpoVideoModule) : null;
  }
  return expoVideo;
}

/** Plays through expo-video; rendered only when the module is installed. */
function ExpoVideoSlide({ item, active, width, height, label, expo }: LightboxVideoProps & { expo: ExpoVideoModule }) {
  const { useVideoPlayer, VideoView } = expo;
  const player = useVideoPlayer(item.src, (created) => {
    created.loop = !!item.loop;
    created.muted = !!item.muted;
  });
  const autoPlay = !!item.autoPlay;

  useEffect(() => {
    // The player is released when the slide unmounts; pausing a released
    // player throws, so leaving the lightbox needs no pause here.
    try {
      if (!active) player.pause();
      else if (autoPlay) player.play();
    } catch {
      // Player already released.
    }
  }, [active, autoPlay, player]);

  return (
    <VideoView
      player={player}
      style={{ width, height }}
      nativeControls
      allowsFullscreen
      contentFit="contain"
      accessibilityLabel={label}
    />
  );
}

/**
 * Native video slide: `expo-video` when installed, otherwise the poster with a
 * play button that calls `onVideoPress`.
 * @internal
 */
export function LightboxVideo(props: LightboxVideoProps) {
  const expo = loadExpoVideo();
  if (expo) return <ExpoVideoSlide {...props} expo={expo} />;

  const { item, width, height, label, onVideoPress } = props;
  return (
    <View
      style={[styles.fallback, { width, height }]}
      // Without a poster the box itself carries the name (unless the play button does).
      {...(!item.poster && !onVideoPress ? a11yProps({ role: 'img', label, accessible: true }) : {})}
    >
      {item.poster ? (
        <Image
          source={{ uri: item.poster }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          {...a11yProps({ role: 'img', label, accessible: true })}
        />
      ) : null}
      {onVideoPress ? (
        <Pressable
          style={styles.play}
          onPress={() => onVideoPress(item)}
          {...a11yProps({ role: 'button', label: `Play video: ${label}` })}
        >
          <Icon name="play" variant="filled" size={36} color="#FFFFFF" />
        </Pressable>
      ) : (
        <View style={styles.play} {...a11yProps({ hidden: true, accessible: false })}>
          <Icon name="play" variant="filled" size={36} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  play: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
});
