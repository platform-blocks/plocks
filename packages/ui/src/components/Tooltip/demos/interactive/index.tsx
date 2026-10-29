import { Button, Link, Tooltip } from '@plocks/ui';

export function Demo() {
  return (
    <Tooltip
      interactive
      withArrow
      label={
        <>
          Every shortcut is listed in the{' '}
          <Link href="#shortcuts" size="md" c="inherit">
            keyboard guide
          </Link>
          .
        </>
      }
    >
      <Button size="sm" variant="outline">
        Keyboard shortcuts
      </Button>
    </Tooltip>
  );
}
