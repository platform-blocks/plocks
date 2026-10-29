import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { Modal, View } from 'react-native';
import type { ModalProps, ViewProps } from 'react-native';

import { isWeb } from '../platform';

/** The attributes react-native-web puts on its modal window. */
const WINDOW_SEMANTICS = ['role', 'aria-modal'] as const;

type ElementLike = {
  hasAttribute?: (name: string) => boolean;
  removeAttribute?: (name: string) => void;
};

function stripWindowSemantics(node: ElementLike) {
  for (const name of WINDOW_SEMANTICS) {
    if (node.hasAttribute?.(name)) node.removeAttribute?.(name);
  }
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/**
 * React Native's `Modal`, minus react-native-web's window semantics.
 *
 * On web, RN `Modal` renders its full-screen window as `role="dialog"` with
 * `aria-modal="true"` and no name, and drops the role (but keeps `aria-modal`)
 * while another modal sits on top. Every plocks modal (Dialog, DropdownSheet,
 * Lightbox, MobileMenu) already renders its own labelled `role="dialog"`
 * inside, so that window reads as a second, unnamed dialog wrapped around the
 * real one. This keeps the window a plain container: the semantics come from
 * the content. Native is untouched (RN `Modal` adds no such role there).
 *
 * Library-internal; use it in place of RN `Modal` wherever the content carries
 * its own dialog role and name.
 */
export const ModalWindow = forwardRef<unknown, ModalProps>(function ModalWindow(props, ref) {
  const observerRef = useRef<MutationObserver | null>(null);

  const setWindow = useCallback(
    (node: unknown) => {
      assignRef(ref, node);
      if (!isWeb) return;
      observerRef.current?.disconnect();
      observerRef.current = null;
      const element = node as (ElementLike & Node) | null;
      if (!element || typeof element.removeAttribute !== 'function') return;
      stripWindowSemantics(element);
      // react-native-web sets `role` again whenever this modal becomes the
      // active (topmost) one, so keep stripping it.
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => stripWindowSemantics(element));
        observer.observe(element, { attributes: true, attributeFilter: [...WINDOW_SEMANTICS] });
        observerRef.current = observer;
      }
    },
    [ref]
  );

  useEffect(() => () => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  return (
    <Modal
      {...props}
      // RN types the ref as the Modal class; react-native-web hands over the window's DOM node.
      ref={(isWeb ? setWindow : ref) as React.Ref<Modal>}
    />
  );
});

ModalWindow.displayName = 'ModalWindow';

const WINDOW_FILL = { flex: 1 } as const;

/**
 * The dialog element of a modal that hosts its own floating content: given
 * `a11y` (role, aria-modal, name), a view filling the `ModalWindow` that
 * carries it, so tooltips, popovers and menus the modal's `OverlayHost`
 * renders beside the card are still inside the dialog (inside its aria-modal
 * boundary and its landmark). Given `null`, the children render as they are
 * and the card keeps the semantics (native).
 */
export function WindowDialog({ a11y, children }: { a11y: ViewProps | null; children: React.ReactNode }) {
  if (!a11y) return <>{children}</>;
  return (
    <View style={WINDOW_FILL} {...a11y}>
      {children}
    </View>
  );
}
