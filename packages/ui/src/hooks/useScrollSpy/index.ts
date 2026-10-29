import { useState, useEffect, useRef, useCallback, useMemo, type RefObject } from 'react';
import type { ScrollView, View } from 'react-native';

import { useLatestCallback } from '../../core/hooks/useLatestCallback';
import { hasDOM } from '../../core/platform/flags';
import { useTitleRegistryOptional } from '../useTitleRegistration/contexts/TitleRegistryContext';

export interface ScrollSpyOptions {
  /** CSS selector for the headings to track */
  selector?: string;
  /** Margin around the root element */
  rootMargin?: string;
  /** Container to search for headings. Defaults to `scrollHost`, then the document. */
  container?: string | HTMLElement;
  /**
   * The scrolling element the headings live in (web): the IntersectionObserver
   * root and the scroll listener target, so headings inside a nested scroll
   * container are measured against it rather than the viewport. An element or
   * a ref object; on web a React Native `View` / `ScrollView` ref is the DOM
   * element, so a `ScrollArea` ref works. Omit for a page that scrolls as a whole.
   */
  scrollHost?: HTMLElement | RefObject<HTMLElement | View | ScrollView | null>;
  /**
   * Function to get heading depth, defaults to h1=1, h2=2, etc. Accessors may
   * be inline functions: the latest one is used on the next collection, and a
   * new identity alone doesn't trigger one (call `reinitialize()` for that).
   */
  getDepth?: (el: Element) => number;
  /** Function to get text value from element, defaults to textContent */
  getValue?: (el: Element) => string;
  /** Function to get ID from element, defaults to element ID or generated from text */
  getId?: (el: Element) => string;
  /** Disable automatic active ID updates from scroll events */
  disableAutoUpdate?: boolean;
}

export interface TocItem {
  /** Unique identifier for the heading */
  id: string;
  /** Text content of the heading */
  value: string;
  /** Heading depth, e.g. 1 for h1, 2 for h2, etc. */
  depth: number;
  /** Function to get the underlying DOM node, if available (web only) */
  getNode?: () => HTMLElement | null;
}

export interface UseScrollSpyReturn {
  /** Collected heading items */
  items: TocItem[];
  /** Currently active heading ID, or null if none */
  activeId: string | null;
  /** Set the active ID programmatically */
  setActiveId: (id: string | null) => void;
  /** Re-collect headings and re-initialize the observer */
  reinitialize: () => void;
}

const DEFAULT_SELECTOR = 'h1, h2, h3, h4, h5, h6';
const DEFAULT_ROOT_MARGIN = '0px 0px -60% 0px';

const defaultGetDepth = (el: Element): number => {
  const match = el.tagName.toLowerCase().match(/h([1-6])/);
  return match ? parseInt(match[1], 10) : 1;
};
const defaultGetValue = (el: Element): string => (el.textContent || '').trim();

const asHTMLElement = (node: unknown): HTMLElement | null =>
  hasDOM && node instanceof HTMLElement ? node : null;

const resolveHost = (scrollHost: ScrollSpyOptions['scrollHost']): HTMLElement | null => {
  if (!scrollHost) return null;
  return asHTMLElement('current' in scrollHost ? scrollHost.current : scrollHost);
};

const resolveContainer = (container: ScrollSpyOptions['container'], fallback: ParentNode): ParentNode => {
  if (!container) return fallback;
  if (typeof container !== 'string') return container;
  // A comma-separated list is tried in order; the first match wins.
  for (const selector of container.split(',').map((s) => s.trim())) {
    if (!selector) continue;
    try {
      const element = document.querySelector(selector);
      if (element) return element;
    } catch {
      // Invalid selector: try the next one.
    }
  }
  return fallback;
};

const sameItems = (a: TocItem[], b: TocItem[]): boolean =>
  a.length === b.length &&
  a.every(
    (item, index) =>
      item.id === b[index].id &&
      item.value === b[index].value &&
      item.depth === b[index].depth &&
      item.getNode?.() === b[index].getNode?.()
  );

/**
 * Collects headings (from the `TitleRegistryProvider` registry and, on web, the
 * DOM) and tracks which one is currently in view.
 *
 * @example
 * const { items, activeId } = useScrollSpy({ container: 'main' });
 *
 * // Headings inside a nested scroll container:
 * const hostRef = useRef<ScrollView>(null);
 * const { items, activeId } = useScrollSpy({ scrollHost: hostRef });
 * <ScrollArea ref={hostRef}>…</ScrollArea>
 */
export function useScrollSpy(options?: ScrollSpyOptions, initialData: TocItem[] = []): UseScrollSpyReturn {
  const [items, setItems] = useState<TocItem[]>(initialData);
  const [activeId, setActiveId] = useState<string | null>(null);
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;
  const visibilityMap = useRef<Map<string, number>>(new Map());
  const titles = useTitleRegistryOptional()?.titles;

  const selector = options?.selector || DEFAULT_SELECTOR;
  const container = options?.container;
  const scrollHost = options?.scrollHost;
  const rootMargin = options?.rootMargin || DEFAULT_ROOT_MARGIN;
  const disableAutoUpdate = !!options?.disableAutoUpdate;
  const getDepth = useLatestCallback(options?.getDepth);
  const getValue = useLatestCallback(options?.getValue);
  const getId = useLatestCallback(options?.getId);

  const collectHeadings = useCallback(() => {
    let collectedItems: TocItem[] = [];

    // Title registry first (native, or web pages built from Title components).
    if (titles && titles.length > 0) {
      collectedItems = titles.map((title) => ({
        id: title.id,
        value: title.text,
        depth: title.order,
        getNode: () => asHTMLElement(title.ref?.current),
      }));
    }

    // Native screens can supply headings directly when they do not use the
    // title registry. Recollection must not erase those initial items.
    if (!hasDOM && collectedItems.length === 0) {
      collectedItems = initialDataRef.current;
    }

    // Web: DOM headings too.
    if (hasDOM) {
      const valueOf = (el: Element) => getValue(el) ?? defaultGetValue(el);
      const scope = resolveContainer(container, resolveHost(scrollHost) ?? document);
      const domItems: TocItem[] = Array.from(scope.querySelectorAll(selector)).map((el) => ({
        id: getId(el) ?? (el.getAttribute('id') || valueOf(el).toLowerCase().replace(/\s+/g, '-')),
        value: valueOf(el),
        depth: getDepth(el) ?? defaultGetDepth(el),
        getNode: () => asHTMLElement(el),
      }));
      collectedItems = [...collectedItems, ...domItems];
    }

    // Ids are React keys and element lookups: keep the first occurrence of each
    // (registry items win over DOM headings; repeated heading text collapses).
    const seenIds = new Set<string>();
    collectedItems = collectedItems.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    setItems((previous) => (sameItems(previous, collectedItems) ? previous : collectedItems));

    // Give DOM headings without an id the one we generated, so links can target them.
    if (hasDOM) {
      collectedItems.forEach((item) => {
        const el = item.getNode?.();
        if (el && !el.id) el.id = item.id;
      });
    }
  }, [titles, container, scrollHost, selector, getDepth, getValue, getId]);

  // A new container or host: the active heading and visibility belong to the old one.
  useEffect(() => {
    setActiveId(null);
    visibilityMap.current.clear();
  }, [container, scrollHost]);

  // Collect now, and again shortly after in case the headings render after this effect.
  useEffect(() => {
    collectHeadings();
    const timeoutId = setTimeout(collectHeadings, 50);
    return () => clearTimeout(timeoutId);
  }, [collectHeadings]);

  // Track the heading nearest the top of the scroll host / viewport (web).
  useEffect(() => {
    if (!hasDOM || typeof IntersectionObserver === 'undefined') return undefined;
    if (!items.length) return undefined;
    const visible = visibilityMap.current;
    const host = resolveHost(scrollHost);
    // Heading offsets are relative to the host's top edge (0 for the viewport).
    const originTop = () => (host ? host.getBoundingClientRect().top : 0);

    // Prefer the visible heading closest below the top edge; otherwise the
    // one that scrolled past it most recently.
    const pickActive = () => {
      let candidate: { id: string; top: number } | null = null;
      for (const [id, top] of Array.from(visible.entries())) {
        if (candidate == null) candidate = { id, top };
        else if (top >= 0 && (candidate.top < 0 || top < candidate.top)) candidate = { id, top };
        else if (top < 0 && candidate.top < 0 && top > candidate.top) candidate = { id, top };
      }
      // setState bails out when the id is unchanged.
      if (candidate) setActiveId(candidate.id);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (disableAutoUpdate) return;
        const origin = originTop();
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).id;
          if (!id) return;
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top - origin);
          else visible.delete(id);
        });
        pickActive();
      },
      { root: host, rootMargin, threshold: [0, 1] }
    );

    const nodes = new Map<string, HTMLElement>();
    items.forEach((item) => {
      const el = item.getNode?.();
      if (!el) return;
      nodes.set(item.id, el);
      observer.observe(el);
    });

    // The observer only reports threshold crossings; refresh the offsets of the
    // headings in view as the host scrolls so the nearest one stays active.
    const onScroll = () => {
      if (disableAutoUpdate || visible.size === 0) return;
      const origin = originTop();
      visible.forEach((_top, id) => {
        const el = nodes.get(id);
        if (el) visible.set(id, el.getBoundingClientRect().top - origin);
      });
      pickActive();
    };
    const scrollTarget: EventTarget = host ?? window;
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      scrollTarget.removeEventListener('scroll', onScroll);
    };
  }, [items, rootMargin, disableAutoUpdate, scrollHost]);

  return useMemo(
    () => ({ items, activeId, setActiveId, reinitialize: collectHeadings }),
    [items, activeId, collectHeadings]
  );
}

export type { TocItem as UseScrollSpyItem };
