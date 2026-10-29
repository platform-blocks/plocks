import { AppShell, Block, Text, useAppShellResize } from '@plocks/ui';

export function Demo() {
  const resize = useAppShellResize({
    navbar: { min: 160, max: 320, collapseThreshold: 120 },
    aside: { min: 140, max: 280 },
    footer: { min: 32, max: 96 },
  });

  return (
    <Block fullWidth h={320}>
      <AppShell
        header={{ height: 48 }}
        navbar={{ width: 220, collapsedWidth: 56, expandOnHover: false }}
        aside={{ width: 180, collapsed: { desktop: false } }}
        footer={{ height: 40 }}
        resize={resize}
        headerContent={<Text p="sm">Header</Text>}
        navbarContent={<Text p="sm">Navbar</Text>}
        asideContent={<Text p="sm">Aside</Text>}
        footerContent={<Text p="sm">Footer</Text>}
        autoLayout
        withSafeArea={false}
      >
        <Block p="md">
          <Text>Page content</Text>
        </Block>
      </AppShell>
    </Block>
  );
}
