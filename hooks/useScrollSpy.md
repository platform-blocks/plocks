# useScrollSpy

Collect headings from the DOM or title registry and track which section is currently visible, in the page or inside a nested scroll container (`scrollHost`).

## Metadata

- Import: `import { useScrollSpy } from '@plocks/ui';`
- Tags: toc, navigation, scroll
- Docs: https://plocks.dev/hooks/useScrollSpy
- Source: https://github.com/platform-blocks/plocks/tree/main/packages/ui/src/hooks/useScrollSpy/index.ts

## Definition

```ts
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

export function useScrollSpy(options?: ScrollSpyOptions, initialData: TocItem[] = []): UseScrollSpyReturn;
```

## Examples

### Table of contents

Use the title registry to power a live-updating table of contents that highlights the section currently in view.

```tsx
import { ScrollView, View } from 'react-native';
import { Badge, Block, Row, Text, TitleRegistryProvider, useScrollSpy, useTitleRegistration } from '@plocks/ui';

const SECTIONS = [
  { title: 'Overview', order: 1, copy: 'Introduce the feature and set expectations for what the rest of the document covers.' },
  { title: 'Installation', order: 2, copy: 'List required packages and platform caveats so teams can get started quickly.' },
  { title: 'Usage patterns', order: 3, copy: 'Highlight the most common ways to use the feature with short inline examples.' },
  { title: 'Troubleshooting', order: 4, copy: 'Capture the top issues support sees and the fix steps that usually resolve them.' }
] as const;

function Section({ title, order, copy }: { title: string; order: number; copy: string }) {
  const { elementRef, id } = useTitleRegistration({ text: title, order });

  return (
    <View ref={elementRef} nativeID={id}>
      <Text fw="semibold">{title}</Text>
      <Text size="sm" c="secondary">{copy}</Text>
    </View>
  );
}

function TocList() {
  const { items, activeId } = useScrollSpy();

  if (!items.length) {
    return <Text size="sm" c="muted">No headings detected yet.</Text>;
  }

  return (
    <Row gap="xs" wrap="wrap">
      {items.map(item => (
        <Badge
          key={item.id}
          variant={activeId === item.id ? 'light' : 'outline'}
          c={activeId === item.id ? 'primary' : 'gray'}
        >
          {item.value}
        </Badge>
      ))}
    </Row>
  );
}

export function Demo() {
  return (
    <TitleRegistryProvider>
      <Block gap="lg">
        <TocList />
        <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: 24 }}>
          {SECTIONS.map(section => (
            <Section key={section.title} {...section} />
          ))}
        </ScrollView>
      </Block>
    </TitleRegistryProvider>
  );
}
```

### Nested scroll container

Pass the scrolling element (or its ref) as `scrollHost` when the headings live inside a nested scroll container: it becomes the IntersectionObserver root and scroll listener target, and headings are looked up inside it when `container` is not given.

```tsx
import { useRef } from 'react';
import type { ScrollView } from 'react-native';
import { Block, Row, ScrollArea, TableOfContents, Text, Title, TitleRegistryProvider } from '@plocks/ui';

const SECTIONS = [
  { id: 'overview', title: 'Overview', copy: 'Introduce the feature and set expectations for the rest of the document.' },
  { id: 'install', title: 'Installation', copy: 'List required packages and platform caveats so teams can get started quickly.' },
  { id: 'usage', title: 'Usage', copy: 'Highlight the most common ways to use the feature with short inline examples.' },
  { id: 'theming', title: 'Theming', copy: 'Show which tokens the feature reads and how to override them per screen.' },
  { id: 'troubleshooting', title: 'Troubleshooting', copy: 'Capture the top issues support sees and the steps that usually resolve them.' },
];

export function Demo() {
  const hostRef = useRef<ScrollView>(null);

  return (
    <TitleRegistryProvider>
      <Row gap="xl" align="flex-start">
        <TableOfContents
          container="#scroll-spy-host-content"
          scrollSpyOptions={{ scrollHost: hostRef }}
          variant="outline"
          size="sm"
          p="sm"
          style={{ width: 200 }}
        />
        <ScrollArea ref={hostRef} id="scroll-spy-host-content" h={240} grow={1} contentProps={{ gap: 'xl' }}>
          {SECTIONS.map(section => (
            <Block key={section.id} gap="xs">
              <Title order={2}>{section.title}</Title>
              <Text c="secondary">{section.copy}</Text>
              <Text c="secondary">{section.copy}</Text>
            </Block>
          ))}
        </ScrollArea>
      </Row>
    </TitleRegistryProvider>
  );
}
```
