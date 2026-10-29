import type React from 'react';
import type { ImageSourcePropType, ViewStyle } from 'react-native';

import type { BaseProps } from '../../core/types/base';

/** Fields shared by every lightbox slide. */
interface LightboxItemBase {
  id: string;
  title?: string;
  description?: string;
  metadata?: {
    size?: string;
    dimensions?: {
      width: number;
      height: number;
    };
    dateCreated?: string;
    camera?: string;
    location?: string;
    /** Extra fields are listed in the metadata panel as `Key: String(value)`. */
    [key: string]: unknown;
  };
}

/** An image slide (the default when `type` is omitted). */
export interface LightboxImageItem extends LightboxItemBase {
  type?: 'image';
  /** Remote image URI, or a bundled asset from `require('./photo.png')` */
  uri: string | ImageSourcePropType;
}

/**
 * A video slide. Web plays it in a native `<video controls>` element; native
 * plays it through `expo-video` when installed, and otherwise shows the poster
 * with a play button that calls `onVideoPress`. Video slides never zoom.
 */
export interface LightboxVideoItem extends LightboxItemBase {
  type: 'video';
  /** URL of the video file. */
  src: string;
  /** Image shown before playback starts, and as the slide's thumbnail. */
  poster?: string;
  /** Start playing when the slide becomes active. @default false */
  autoPlay?: boolean;
  /** @default false */
  muted?: boolean;
  /** @default false */
  loop?: boolean;
}

/** A lightbox slide: an image (default) or a video (`type: 'video'`). */
export type LightboxItem = LightboxImageItem | LightboxVideoItem;

/** What `renderSlide` gets alongside the item. */
export interface LightboxSlideState {
  /** Position of the slide in `images`. */
  index: number;
  /** Whether the slide is the one on screen. */
  active: boolean;
}

export interface LightboxProps extends BaseProps<ViewStyle> {
  /** Slides to display: images, or videos (`type: 'video'`). */
  images: LightboxItem[];
  /**
   * Index of the image shown when the lightbox first opens.
   * @default 0
   */
  initialIndex?: number;
  /** Called when the lightbox is closed. */
  onClose?: () => void;
  /** Called when the active image changes, receiving the new index and image. */
  onImageChange?: (index: number, image: LightboxItem) => void;
  /** Called when the download action is triggered for the current image. */
  onDownload?: (image: LightboxItem) => void;
  /**
   * Whether to display the metadata panel for the current image.
   * @default false
   */
  showMetadata?: boolean;
  /**
   * Whether to display the thumbnail strip for navigating between images. The
   * `T` key (web) hides and shows it while the lightbox is open.
   * @default true
   */
  showThumbnails?: boolean;
  /**
   * Whether to display the download button in the lightbox controls.
   * @default true
   */
  showDownloadButton?: boolean;
  /**
   * Whether the arrow keys move between images (web). Escape always closes the
   * lightbox, and the thumbnail strip always supports arrow keys.
   * @default true
   */
  allowKeyboardNavigation?: boolean;
  /**
   * Whether swipe gestures can be used to move between images.
   * @default true
   */
  allowSwipeNavigation?: boolean;
  /**
   * Opacity of the backdrop behind the lightbox, from 0 to 1 — applied to the
   * theme scrim's color (`theme.backgrounds.scrim`).
   * @default 0.9
   */
  overlayOpacity?: number;
  /**
   * `0` opens and closes the lightbox without animation; any other value uses
   * the platform's modal fade. Reduced motion also turns the fade off.
   * @default 250
   */
  animationDuration?: number;
  /** Accessible name of the lightbox dialog. @default 'Image gallery' */
  accessibilityLabel?: string;
  /**
   * Whether image slides can be zoomed: double-tap / double-click, pinch,
   * ctrl/⌘ + wheel or trackpad pinch (web), the `+` `-` `0` and `Z` keys (web),
   * and the zoom button. While zoomed, dragging pans the image instead of
   * changing slides.
   * @default true
   */
  allowZoom?: boolean;
  /**
   * Largest zoom factor (1 is the fitted image).
   * @default 3
   */
  maxZoom?: number;
  /**
   * Width and height of each thumbnail in the strip, in px.
   * @default 60
   */
  thumbnailSize?: number;
  /**
   * Renders a slide yourself. Return `undefined` to fall back to the default
   * image / video rendering for that item. A custom slide is not zoomable.
   */
  renderSlide?: (item: LightboxItem, state: LightboxSlideState) => React.ReactNode;
  /**
   * Called when the play button of a video slide is pressed on native without
   * `expo-video` installed — e.g. to open the video in another player.
   */
  onVideoPress?: (item: LightboxVideoItem) => void;
}

export interface LightboxModalProps extends LightboxProps {
  /** Whether the lightbox is open. */
  opened?: boolean;
}

export interface LightboxThumbnailProps {
  images: LightboxItem[];
  currentIndex: number;
  /** Called when a thumbnail is pressed, or focused with the arrow keys. */
  onThumbnailPress: (index: number) => void;
  /** Width and height of each thumbnail, in px. @default 60 */
  thumbnailSize?: number;
}

export interface LightboxImageProps {
  image: LightboxImageItem;
  onLoad?: () => void;
  onError?: () => void;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
}

export interface LightboxControlsProps {
  currentIndex: number;
  totalImages: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onDownload?: () => void;
  showDownloadButton?: boolean;
  image?: LightboxItem;
  /** Whether the current image is zoomed in (sets the zoom button's label and icon). */
  zoomed?: boolean;
  /** Toggles zoom on the current image; the zoom button is shown only when set. */
  onToggleZoom?: () => void;
}

export interface LightboxMetadataProps {
  image: LightboxItem;
  visible: boolean;
}

export type LightboxNavigationDirection = 'previous' | 'next';

export interface LightboxGestureState {
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
  scale: number;
}
