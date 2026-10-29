---
playground: true
title: Lightbox
description: Full-screen media viewer with zoom, video slides, swipe and keyboard navigation, thumbnails, and metadata.
source: ui/src/components/Lightbox
status: experimental
category: media
tags: [lightbox, gallery, images, video, zoom, thumbnails, media]
props:
  opened: Whether the lightbox is open
  images: "Slides — image items ({ id, uri }) or video items ({ id, type: 'video', src, poster?, autoPlay?, muted?, loop? })"
  initialIndex: Slide shown when the lightbox opens (default 0)
  onClose: Called when the lightbox closes
  onImageChange: Called with the new index and item when the slide changes
  showThumbnails: Show the thumbnail strip (default true; T toggles it on web)
  thumbnailSize: Width and height of each thumbnail in px (default 60)
  showMetadata: Show the metadata panel toggle
  showDownloadButton: Show the download button (default true)
  onDownload: Called with the current item when download is pressed
  allowKeyboardNavigation: Arrow keys move between slides on web (default true)
  allowSwipeNavigation: Swipe moves between slides; disabled while zoomed (default true)
  allowZoom: "Zoom image slides — double-tap, pinch, ctrl/⌘ + wheel, + - 0 Z keys, zoom button (default true)"
  maxZoom: Largest zoom factor (default 3)
  renderSlide: "(item, { index, active }) => ReactNode — render a slide yourself; return undefined for the default"
  onVideoPress: Native without expo-video — called when a video slide's play button is pressed
  overlayOpacity: Backdrop opacity, 0–1 (default 0.9)
  animationDuration: 0 disables the open / close fade (default 250)
  accessibilityLabel: Accessible name of the dialog (default "Image gallery")
examples:
  - basic
  - advanced
  - zoom
  - video
---

Lightbox displays images and videos in a full-screen viewer with zoom, navigation, and optional metadata.
