/**
 * Toast stack layout — the placement rules that make a multi-toast stack read
 * as a stack instead of as a pile that snaps around.
 */

import { computeStackLayout } from '../ToastStack';

const item = (id: string, visible = true) => ({ id, visible });
const HEIGHTS = { a: 60, b: 80, c: 50 };
const GAP = 12;

const layout = (
  items: { id: string; visible: boolean }[],
  pinned: Record<string, number> = {},
  heights: Record<string, number> = HEIGHTS,
) => computeStackLayout(items, heights, GAP, pinned);

describe('computeStackLayout', () => {
  it('puts the newest toast against the anchored edge', () => {
    // Items arrive oldest-first; `c` is the most recent.
    const { offsets } = layout([item('a'), item('b'), item('c')]);
    expect(offsets.c).toBe(0);
    expect(offsets.b).toBe(HEIGHTS.c + GAP);
    expect(offsets.a).toBe(HEIGHTS.c + GAP + HEIGHTS.b + GAP);
  });

  it('leaves the toasts already on screen where they are when one arrives', () => {
    const before = layout([item('a'), item('b')]);
    const after = layout([item('a'), item('b'), item('c')]);
    // Every existing toast shifts by exactly the new toast's footprint — one
    // uniform move, not a reshuffle.
    expect(after.offsets.a - before.offsets.a).toBe(HEIGHTS.c + GAP);
    expect(after.offsets.b - before.offsets.b).toBe(HEIGHTS.c + GAP);
  });

  it('closes the gap behind a leaving toast without moving the toast itself', () => {
    const visible = layout([item('a'), item('b'), item('c')]);
    // `b`, in the middle, starts leaving.
    const leaving = layout(
      [item('a'), item('b', false), item('c')],
      visible.pinned,
    );

    // The leaving toast holds the slot it is leaving from...
    expect(leaving.offsets.b).toBe(visible.offsets.b);
    // ...the newest is untouched...
    expect(leaving.offsets.c).toBe(0);
    // ...and the toast behind it moves up into the vacated space immediately,
    // rather than snapping when the leaving toast finally unmounts.
    expect(leaving.offsets.a).toBe(HEIGHTS.c + GAP);
  });

  it('holds a leaving toast still even as the stack keeps changing around it', () => {
    const step1 = layout([item('a'), item('b'), item('c')]);
    const step2 = layout([item('a'), item('b', false), item('c')], step1.pinned);
    const step3 = layout([item('a'), item('b', false), item('c')], step2.pinned);
    expect(step3.offsets.b).toBe(step1.offsets.b);
  });

  it('drops a toast that has left from the pinned offsets', () => {
    const withB = layout([item('a'), item('b', false)]);
    const withoutB = layout([item('a')], withB.pinned);
    expect(withoutB.pinned).not.toHaveProperty('b');
  });

  it('sizes the container to cover leaving toasts as well as visible ones', () => {
    const visible = layout([item('a'), item('b'), item('c')]);
    expect(visible.stackHeight).toBe(HEIGHTS.c + GAP + HEIGHTS.b + GAP + HEIGHTS.a);

    // The oldest starts leaving: it still needs to be inside the container's
    // bounds or it gets clipped out of hit-testing mid-transition.
    const leaving = layout(
      [item('a', false), item('b'), item('c')],
      visible.pinned,
    );
    expect(leaving.stackHeight).toBe(visible.offsets.a + HEIGHTS.a);
  });

  it('falls back to an estimated height only for an unmeasured toast', () => {
    const { offsets } = layout([item('a'), item('new')], {}, HEIGHTS);
    // The newest is at the edge regardless, so the estimate only affects the
    // toast behind it for the single frame before layout arrives.
    expect(offsets.new).toBe(0);
    expect(offsets.a).toBeGreaterThan(0);
  });

  it('returns an empty layout for an empty stack', () => {
    expect(layout([])).toEqual({ offsets: {}, stackHeight: 0, pinned: {}, depths: {}, clipHeight: null });
  });

  it('lists every toast at full height when not collapsed', () => {
    const { depths, clipHeight } = layout([item('a'), item('b'), item('c')]);
    expect(depths).toEqual({ a: 0, b: 0, c: 0 });
    expect(clipHeight).toBeNull();
  });
});

describe('computeStackLayout (collapsed deck)', () => {
  const deck = (
    items: { id: string; visible: boolean }[],
    pinned: Record<string, number> = {},
  ) => computeStackLayout(items, HEIGHTS, GAP, pinned, true);

  it('tucks older toasts a few px behind the newest instead of listing them', () => {
    const { offsets, depths, clipHeight, stackHeight } = deck([item('a'), item('b'), item('c')]);
    expect(offsets.c).toBe(0);
    expect(depths).toEqual({ c: 0, b: 1, a: 2 });
    expect(offsets.b).toBeGreaterThan(0);
    expect(offsets.b).toBeLessThan(GAP);
    expect(offsets.a).toBe(offsets.b * 2);
    // Everything behind is clipped to the front toast, so the deck is the front
    // toast plus the peeking edges — never the taller toast hiding behind it.
    expect(clipHeight).toBe(HEIGHTS.c);
    expect(stackHeight).toBe(offsets.a + HEIGHTS.c);
  });

  it('stops peeking after a couple of toasts and keeps the rest tucked at the back', () => {
    const many = ['a', 'b', 'c', 'd', 'e'].map(id => item(id));
    const { offsets, depths } = deck(many);
    expect(depths.e).toBe(0);
    expect(depths.a).toBe(4);
    // Deeper toasts share the last peek offset rather than piling further out.
    expect(offsets.a).toBe(offsets.b);
    expect(offsets.b).toBe(offsets.c);
  });

  it('promotes the next toast to the front when the front one leaves', () => {
    const before = deck([item('a'), item('b')]);
    const after = deck([item('a'), item('b', false)], before.pinned);
    expect(after.offsets.a).toBe(0);
    expect(after.depths.a).toBe(0);
    // The leaving toast holds its place in front while it fades.
    expect(after.offsets.b).toBe(0);
    expect(after.depths.b).toBe(0);
  });

  it('keeps a tucked toast tucked while it leaves', () => {
    const before = deck([item('a'), item('b')]);
    const after = deck([item('a', false), item('b')], before.pinned);
    expect(after.offsets.a).toBe(before.offsets.a);
    expect(after.depths.a).toBe(1);
    expect(after.stackHeight).toBe(before.stackHeight);
  });
});
