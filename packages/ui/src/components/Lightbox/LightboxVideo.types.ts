import type { LightboxVideoItem } from './types';

/** @internal Props of the platform video slide (LightboxVideo.tsx / LightboxVideo.web.tsx). */
export interface LightboxVideoProps {
  item: LightboxVideoItem;
  /** Whether the slide is on screen; an inactive video is paused. */
  active: boolean;
  width: number;
  height: number;
  /** Accessible name of the video. */
  label: string;
  /** Native fallback (no `expo-video`): called by the poster's play button. */
  onVideoPress?: (item: LightboxVideoItem) => void;
}
