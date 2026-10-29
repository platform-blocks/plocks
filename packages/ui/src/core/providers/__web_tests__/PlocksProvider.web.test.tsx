import React from 'react';
import { Text } from 'react-native';
import { renderToString } from 'react-dom/server';
import { act, render, screen } from '@testing-library/react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { PlocksProvider } from '../../theme/PlocksProvider';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nContext';
import { useDirection } from '../DirectionProvider';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { useAnnouncer, useFocus } from '../../accessibility/hooks';
import { useHapticsSettings } from '../../haptics/HapticsProvider';
import { useOverlayApi } from '../OverlayProvider';
import { ToastProvider, useOptionalToast, useToast } from '../../../components/Toast/ToastProvider';

const renders = { count: 0 };

/** Memoized: it re-renders only when a context it reads publishes a new value. */
const Consumer = React.memo(function Consumer() {
  renders.count += 1;
  useTheme();
  useI18n();
  useDirection();
  useReducedMotion();
  useAnnouncer();
  useFocus('consumer');
  useHapticsSettings();
  useOverlayApi();
  useOptionalToast();
  return null;
});

const consumer = <Consumer />;

describe('PlocksProvider', () => {
  beforeEach(() => {
    renders.count = 0;
  });

  it('does not re-render consumers when the app root re-renders with the same props', () => {
    const resources = { en: { translation: { hi: 'Hi' } } };
    const App = ({ tick }: { tick: number }) => (
      // A new `children` element every render, like a real app root.
      <PlocksProvider locale="en" i18nResources={resources}>
        <Text>{`tick ${tick}`}</Text>
        {consumer}
      </PlocksProvider>
    );
    const { rerender } = render(<App tick={0} />);
    const initial = renders.count;
    expect(initial).toBeGreaterThan(0);

    rerender(<App tick={1} />);
    rerender(<App tick={2} />);
    expect(screen.getByText('tick 2')).toBeTruthy();
    expect(renders.count).toBe(initial);
  });

  it('forces reduced motion from its prop without remounting the app', () => {
    let reduced: boolean | null = null;
    const mounts = { count: 0 };
    const Probe = () => {
      reduced = useReducedMotion();
      React.useEffect(() => {
        mounts.count += 1;
      }, []);
      return null;
    };
    const { rerender } = render(
      <PlocksProvider>
        <Probe />
      </PlocksProvider>
    );
    expect(reduced).toBe(false);
    rerender(
      <PlocksProvider reducedMotion>
        <Probe />
      </PlocksProvider>
    );
    expect(reduced).toBe(true);
    expect(mounts.count).toBe(1);
  });

  it('works with direction={false} (useDirection no longer throws)', () => {
    let dir = '';
    const Probe = () => {
      dir = useDirection().dir;
      return null;
    };
    expect(() =>
      render(
        <PlocksProvider direction={false}>
          <Probe />
        </PlocksProvider>
      )
    ).not.toThrow();
    expect(dir).toBe('ltr');
  });

  it('follows the locale prop', () => {
    const resources = {
      en: { translation: { hi: 'Hi' } },
      fr: { translation: { hi: 'Salut' } },
    };
    const Greeting = () => <Text>{useI18n().t('hi')}</Text>;
    const { rerender } = render(
      <PlocksProvider locale="en" i18nResources={resources}>
        <Greeting />
      </PlocksProvider>
    );
    expect(screen.getByText('Hi')).toBeTruthy();
    act(() => {
      rerender(
        <PlocksProvider locale="fr" i18nResources={resources}>
          <Greeting />
        </PlocksProvider>
      );
    });
    expect(screen.getByText('Salut')).toBeTruthy();
  });

  // A SafeAreaProvider with no starting insets renders nothing until it has
  // measured, which never happens during a static export.
  it('renders its children into server markup', () => {
    const html = renderToString(
      <PlocksProvider>
        <Text>prerendered</Text>
      </PlocksProvider>
    );
    expect(html).toContain('prerendered');
  });

  it('provides safe-area insets on web', () => {
    let insets: unknown = null;
    const Probe = () => {
      insets = React.useContext(SafeAreaInsetsContext);
      return null;
    };
    render(
      <PlocksProvider>
        <Probe />
      </PlocksProvider>
    );
    expect(insets).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  describe('toasts', () => {
    type Api = ReturnType<typeof useOptionalToast>;
    const probe = (sink: { api?: Api }) => function Probe() {
      sink.api = useOptionalToast();
      return null;
    };

    it('mounts a ToastProvider, so useToast() works with no setup', () => {
      const sink: { api?: Api } = {};
      const Probe = probe(sink);
      function Trigger() {
        const toast = useToast();
        return <Text onPress={() => toast.show({ title: 'Built in', persistent: true })}>show</Text>;
      }
      render(
        <PlocksProvider>
          <Probe />
          <Trigger />
        </PlocksProvider>
      );
      expect(sink.api).not.toBeNull();
      act(() => { screen.getByText('show').click(); });
      expect(screen.getAllByText('Built in')).toHaveLength(1);
    });

    it('leaves it out with toast={false}', () => {
      const sink: { api?: Api } = {};
      const Probe = probe(sink);
      render(
        <PlocksProvider toast={false}>
          <Probe />
        </PlocksProvider>
      );
      expect(sink.api).toBeNull();
    });

    it("lets the app's own ToastProvider take over below it: one toast, one viewport", () => {
      const outer: { api?: Api } = {};
      const inner: { api?: Api } = {};
      const OuterProbe = probe(outer);
      const InnerProbe = probe(inner);
      function Trigger() {
        const toast = useToast();
        return <Text onPress={() => toast.show({ title: 'Mine', persistent: true })}>show</Text>;
      }
      render(
        <PlocksProvider>
          <OuterProbe />
          <ToastProvider defaultPosition="bottom-center">
            <InnerProbe />
            <Trigger />
          </ToastProvider>
        </PlocksProvider>
      );
      expect(inner.api).not.toBe(outer.api);
      act(() => { screen.getByText('show').click(); });
      expect(screen.getAllByText('Mine')).toHaveLength(1);
    });

    it('skips the built-in provider under an app ToastProvider above it', () => {
      const outside: { api?: Api } = {};
      const inside: { api?: Api } = {};
      const OutsideProbe = probe(outside);
      const InsideProbe = probe(inside);
      render(
        <ToastProvider>
          <OutsideProbe />
          <PlocksProvider>
            <InsideProbe />
          </PlocksProvider>
        </ToastProvider>
      );
      expect(inside.api).toBe(outside.api);
    });
  });
});
