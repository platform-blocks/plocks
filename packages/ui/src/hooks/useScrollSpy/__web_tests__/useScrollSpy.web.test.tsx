import { act, renderHook } from '@testing-library/react';

import { useScrollSpy } from '../index';

describe('useScrollSpy (web)', () => {
  let article: HTMLElement;

  beforeEach(() => {
    article = document.createElement('article');
    article.innerHTML = '<h2 id="intro">Intro</h2><h3>Getting started</h3><h2>Intro</h2>';
    document.body.appendChild(article);
  });
  afterEach(() => {
    article.remove();
  });

  it('collects DOM headings from the container, dedupes ids and assigns missing ones', () => {
    const { result } = renderHook(() => useScrollSpy({ container: 'nav, article' }));

    expect(result.current.items.map(({ id, value, depth }) => ({ id, value, depth }))).toEqual([
      { id: 'intro', value: 'Intro', depth: 2 },
      { id: 'getting-started', value: 'Getting started', depth: 3 },
    ]);
    // Headings without an id get the generated one so links can target them.
    expect(article.querySelector('h3')?.id).toBe('getting-started');
    expect(result.current.items[1].getNode?.()).toBe(article.querySelector('h3'));
  });

  it('uses the latest accessor without re-collecting on every render', () => {
    const { result, rerender } = renderHook(
      ({ suffix }: { suffix: string }) =>
        useScrollSpy({ container: 'article', getValue: (el) => `${el.textContent}${suffix}` }),
      { initialProps: { suffix: '!' } }
    );
    const firstItems = result.current.items;
    expect(firstItems[0].value).toBe('Intro!');

    // A new inline accessor alone keeps the collected items.
    rerender({ suffix: '?' });
    expect(result.current.items).toBe(firstItems);

    act(() => result.current.reinitialize());
    expect(result.current.items[0].value).toBe('Intro?');
  });
});

describe('useScrollSpy scrollHost (web)', () => {
  type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
  const observers: { root: Element | Document | null; targets: Element[]; callback: Callback }[] = [];
  const originalIO = window.IntersectionObserver;

  let host: HTMLDivElement;
  let outside: HTMLElement;

  beforeEach(() => {
    observers.length = 0;
    window.IntersectionObserver = class {
      constructor(callback: Callback, init?: IntersectionObserverInit) {
        observers.push({ root: (init?.root as Element | null) ?? null, targets: [], callback });
      }
      observe(target: Element) {
        observers[observers.length - 1].targets.push(target);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;

    host = document.createElement('div');
    host.style.overflow = 'auto';
    host.innerHTML = '<h2 id="one">One</h2><h2 id="two">Two</h2>';
    document.body.appendChild(host);
    outside = document.createElement('article');
    outside.innerHTML = '<h2 id="elsewhere">Elsewhere</h2>';
    document.body.appendChild(outside);
  });
  afterEach(() => {
    window.IntersectionObserver = originalIO;
    host.remove();
    outside.remove();
  });

  it('accepts a ref object, scopes heading lookup to the host and observes against it', () => {
    const hostRef = { current: host };
    const { result } = renderHook(() => useScrollSpy({ scrollHost: hostRef }));

    expect(result.current.items.map((item) => item.id)).toEqual(['one', 'two']);
    const observer = observers[observers.length - 1];
    expect(observer.root).toBe(host);
    expect(observer.targets).toEqual([host.querySelector('#one'), host.querySelector('#two')]);
  });

  it('accepts an element and keeps an explicit container for the lookup', () => {
    const { result } = renderHook(() => useScrollSpy({ scrollHost: host, container: 'article' }));

    expect(result.current.items.map((item) => item.id)).toEqual(['elsewhere']);
    expect(observers[observers.length - 1].root).toBe(host);
  });

  it('measures headings against the host and follows its scroll events', () => {
    host.getBoundingClientRect = () => ({ top: 100, bottom: 400 }) as DOMRect;
    const one = host.querySelector<HTMLElement>('#one')!;
    const two = host.querySelector<HTMLElement>('#two')!;
    let tops = { one: 110, two: 250 };
    one.getBoundingClientRect = () => ({ top: tops.one }) as DOMRect;
    two.getBoundingClientRect = () => ({ top: tops.two }) as DOMRect;

    const { result } = renderHook(() => useScrollSpy({ scrollHost: host }));
    const observer = observers[observers.length - 1];

    act(() => {
      observer.callback([
        { target: one, isIntersecting: true, boundingClientRect: { top: tops.one } as DOMRect },
        { target: two, isIntersecting: true, boundingClientRect: { top: tops.two } as DOMRect },
      ]);
    });
    // Both are below the host's top edge (100): the nearest one wins.
    expect(result.current.activeId).toBe('one');

    // Scroll the host so "one" passes its top edge without leaving view.
    tops = { one: 60, two: 200 };
    act(() => {
      host.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.activeId).toBe('two');
  });

  it('observes against the viewport when no host is given', () => {
    renderHook(() => useScrollSpy({ container: 'article' }));
    expect(observers[observers.length - 1].root).toBeNull();
  });
});
