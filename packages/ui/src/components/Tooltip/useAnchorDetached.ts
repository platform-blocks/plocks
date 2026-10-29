import { useEffect, useState } from 'react';

import { isWeb } from '../../core/platform';

/**
 * True when the node is out of the document, not rendered, or (where layout can
 * be measured) collapsed to 0×0. Without layout (jsdom, SSR) every box measures
 * 0×0, so size is only trusted alongside IntersectionObserver; "can't tell"
 * counts as attached.
 */
function isAnchorHidden(node: Element, canMeasure: boolean): boolean {
  if (!node.isConnected) return true;
  const visibilityCheck = (node as Element & { checkVisibility?: (options?: object) => boolean }).checkVisibility;
  if (typeof visibilityCheck === 'function' && !visibilityCheck.call(node, { visibilityProperty: true })) return true;
  const style = typeof getComputedStyle === 'function' ? getComputedStyle(node) : null;
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return true;
  if (!canMeasure) return false;
  const rect = node.getBoundingClientRect();
  return rect.width === 0 && rect.height === 0;
}

/**
 * Web: whether the tooltip's anchor is "detached" (removed, hidden, zero-sized,
 * or scrolled / clipped fully out of view) while `active`. Always false on
 * native and when inactive. `getAnchor` should be stable; the anchor is read
 * each time the tooltip becomes active.
 *
 * Clipping comes from an IntersectionObserver on the implicit (viewport) root:
 * its intersection is clipped by every ancestor with `overflow` other than
 * visible, so one observer covers both the viewport and the nearest scroll
 * container. A ResizeObserver catches the anchor collapsing to 0×0 or being
 * removed, which may not change its intersection. The positioning layer only
 * listens to window scroll / resize to reposition; neither observer duplicates it.
 */
export function useAnchorDetached(getAnchor: () => unknown, active: boolean): boolean {
  const [detached, setDetached] = useState(false);

  useEffect(() => {
    if (!active || !isWeb || typeof Element === 'undefined') {
      setDetached(false);
      return undefined;
    }
    const node = getAnchor();
    if (!(node instanceof Element)) {
      setDetached(false);
      return undefined;
    }

    const canMeasure = typeof IntersectionObserver === 'function';
    let intersecting = true;
    const evaluate = () => setDetached(!intersecting || isAnchorHidden(node, canMeasure));
    evaluate();

    let intersectionObserver: IntersectionObserver | undefined;
    if (canMeasure) {
      intersectionObserver = new IntersectionObserver((entries) => {
        const latest = entries[entries.length - 1];
        if (latest) intersecting = latest.isIntersecting;
        evaluate();
      });
      intersectionObserver.observe(node);
    }
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(evaluate);
      resizeObserver.observe(node);
    }

    return () => {
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [active, getAnchor]);

  return active && detached;
}
