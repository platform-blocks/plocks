# Knob

Comprehensive rotary input supporting behavior presets, value labels, split progress, and the new tick-layer system.

## Behavior vs. variant

Two independent axes:

- **`behavior`** — *what kind of control* it is: `level` (default), `stepped`, `endless`, `dual`, `status`. Drives mode, mark snapping, and which readouts appear.
- **`variant`** — *how it looks*: 17 presets across interface, metering, and hardware styles. Drives the body, ring, ticks, sweep, and which indicator carries the value.

They compose freely — `<Knob behavior="stepped" variant="chickenhead" marks={…} />` is a detented selector in an amp-knob skin.

```tsx
<Knob variant="knurled" value={value} onChange={setValue} />
```

| group | variant | look |
| --- | --- | --- |
| interface | `default` | stock dial: neutral ring, accent thumb, full circle |
| | `minimal` | hairline track and a small dot; for dense panels |
| | `outline` | wireframe: empty bordered body, hairline arc, full-length arm |
| | `material` | circular slider: thick soft track, rounded arc, ringed handle |
| | `studio` | plugin rack: chunky track, bright arc, outlined rim dot |
| | `neumorphic` | soft raised disc with light and dark shadows, slim inset track |
| metering | `digital` | 128-segment collar that lights with the value, square glowing marker |
| | `segmented` | twelve hard-edged blocks that fill like a DAW meter |
| | `led-ring` | dark domed encoder ringed by glowing LEDs |
| | `gauge` | 240° instrument dial: printed decade scale, tapered needle on a hub |
| hardware | `retro` | domed charcoal body, dished center cap, white arm, silkscreened marks |
| | `knurled` | machined aluminum: knurled grip, spun face, engraved notch, 0–10 scale |
| | `encoder` | ridged grip, domed cap with a finger dimple, a position LED that follows it |
| | `soft-touch` | matte rubber synth knob with a ribbed edge and a white line |
| | `chickenhead` | pointed bar knob; ticks `marks` when there are any, a scale otherwise |
| | `skirted` | black body over a numbered skirt, cap in the accent color |
| | `fluted` | scalloped console knob with a polished insert |

Every variant except `default` and `encoder` also sets the sweep: 270° for pots (`-135`→`135`), 240° for `gauge` and `chickenhead`, 300° for `skirted`. Hardware variants and `gauge` move the value label below the knob so it never sits on the cap; pass `valueLabel.position` to put it back.

Interface and metering variants take their colors from the theme and the accent, so they read correctly in light and dark and never fight a brand. Hardware variants use fixed physical materials (black bakelite stays black in dark mode — the theme's gray ramp reverses there) and put the accent on their LEDs, scales, and caps. Every value a variant sets is a default: the preset is deep-merged *under* `appearance`, so you can retune one property without opting out of the preset.

```tsx
// knurled's grip, finish, and scale — with a gold face
<Knob variant="knurled" appearance={{ body: { cap: { color: '#d4a017' } } }} />
```

## Body

`appearance.body` (or `<Knob.Body>`) is the physical part you grab, drawn under the ring.

- `shape`: `'circle'` (default), `'polygon'` (`sides` edges), `'fluted'` (`sides` scallops, `fluteDepth`), or `'chickenhead'` (a pointed bar that aims at the value)
- `color` or `gradient` (`{ type: 'linear' | 'radial', stops, angle | center/radius }`)
- `shading`: `'flat'`, `'dome'`, `'concave'`, `'matte'`, `'metal'`, `'brushed'` — white/black lighting overlays, so they finish any base color
- `grip`: `{ style: 'knurl' | 'ridge' | 'dots', count, depth, width, color, opacity }` around the rim
- `cap` / `skirt`: concentric discs (`ratio` of the body radius, below 1 for a cap, above 1 for a skirt), each with its own `color`, `shading`, `gradient`, and border
- `shadow`: one soft shadow or an array (neumorphism stacks a light and a dark one)
- `rotates`: turn the body with the value. Defaults to on for non-circular shapes and gripped bodies; the lighting stays fixed while the geometry turns
- `radiusOffset`, `borderWidth`, `borderColor`; `body: false` removes it

`ring: false` (or `ring.visible: false`) hides the track and its backdrop while keeping its geometry for ticks, thumb, and arm.

## Pointer shapes

`appearance.pointer.shape` picks the indicator: `'line'` (from `inset` out to `length`), `'needle'` (tapered gauge needle), `'notch'` (an engraved groove with a lit edge), `'dot'`, `'dimple'` (a concave finger dish), or `'triangle'` (an arrowhead at `length`). `width` is the stroke width or the mark's size.

## Tick layers

Configure `appearance.ticks` with one or more layers derived from marks, steps, explicit values, or a fixed count:

- `source`: `'marks' | 'steps' | 'values' | 'count'`
- `count`: with `source: 'count'`, how many evenly spaced ticks to lay around the arc — a fixed-resolution collar that ignores `step` and `marks`, so it reads the same whether the knob runs 0–1 or 0–360. Capped at 512.
- `shape`: `'dot' | 'line' | 'icon' | 'custom'`
- `position`, `radiusOffset`, `length`, `width`: geometry controls
- `cap`: `'round'` (default) or `'butt'` for hard-edged line blocks
- `glow`: `{ color, intensity, blur }` — a halo on lit ticks only, for LED rings; dropped while disabled
- `activeMode`: `'fill'` (default) lights every tick up to the value like a meter; `'nearest'` lights only the tick the pointer is aimed at, like a selector. Set per layer, and matched by angle so it wraps at the seam of a full circle and works on endless knobs.
- `color` / `inactiveColor`: lit and unlit colors — see below
- `label`: show/format labels per tick
- `renderTick`: custom React output

Example:

```tsx
ticks: [
  { source: 'marks', shape: 'line', label: { show: true } },
  { source: 'steps', values: [0, 10, 20], shape: 'dot', radiusOffset: -8 },
]
```

### Coloring ticks individually

A layer's `color` and `inactiveColor` take one color for the whole layer, or a resolver called per tick — `({ value, index, angle, isActive, mark }) => string | undefined`. Returning `undefined` falls through to the usual defaults, so a resolver can restyle a few ticks and leave the rest alone.

For `source: 'marks'`, a mark's own `accentColor` already colors its lit tick, so per-detent colors need no resolver at all. `appearance.accentFromMarks` then hands that same color to the knob itself — thumb, arm, and progress arc — so the control matches the detent it is sitting on. (`behavior="status"` does this already; the flag opts other behaviors in.)

```tsx
<Knob
  marks={[
    { value: 0, accentColor: '#f87171' },
    { value: 1, accentColor: '#4ade80' },
    { value: 2, accentColor: '#38bdf8' },
  ]}
  restrictToMarks
  appearance={{
    accentFromMarks: true,
    ticks: [
      {
        source: 'marks',
        shape: 'line',
        activeMode: 'nearest',
        // Unlit ticks keep their own hue, dimmed.
        inactiveColor: ({ mark }) => (mark?.accentColor ? `${mark.accentColor}44` : undefined),
      },
    ],
  }}
/>
```

## Compound parts

Use `Knob.Root` together with the exported statics to declaratively control every visual layer. Each child simply merges into the `appearance` map, so you can reorder, swap, or disable layers without rewriting the component internals.

```tsx
<Knob.Root value={value} onChange={setValue} appearance={{ arc: { startAngle: -120, sweepAngle: 240 } }}>
  <Knob.Body color="#0f172a" shading="dome" grip={{ style: 'ridge', count: 24 }} />
  <Knob.Ring thickness={22} color="#1f2937" trailColor="#0f172a" />
  <Knob.RingSegment value={60} color="#166534" />
  <Knob.RingSegment value={40} color="#7f1d1d" />
  <Knob.Progress mode="split" thickness={12} roundedCaps />
  <Knob.TickLayer source="marks" shape="line" length={18} label={{ show: true }} />
  <Knob.Pointer visible length={72} width={3} color="#f8fafc" />
  <Knob.Thumb size={24} strokeWidth={2} strokeColor="#0f172a" />
  <Knob.ValueLabel position="center" formatter={(val) => `${Math.round(val)}%`} />
</Knob.Root>
```

Available parts:

- `Knob.Body` – the physical knob: shape, finish, grip, cap, skirt, and shadows (see [Body](#body)); `visible={false}` removes it.
- `Knob.Ring` – primary stroke layer with independent thickness and colors; `visible={false}` hides the track.
- `Knob.RingSegment` – one colored band of a segmented ring. Repeat it the way you would stack `Progress.Section`s: each segment covers `value` units of the knob's range, laid end to end from `min`, so on a 0–100 knob the values read as percentages. Anything the segments leave uncovered keeps the plain ring color. By default the bands are a static backdrop with the progress arc drawn on top; `appearance.ring.segmentMode: 'progress'` instead makes them the progress arc itself, clipped at the current value. Equivalent to `appearance.ring.segments`.
- `Knob.Progress` – contiguous or split progress arc; set `visible={false}` to remove it.
- `Knob.TickLayer` – add one or more tick/label tiers derived from marks, steps, or explicit values.
- `Knob.Pointer` – the indicator on the body. Opt-in: adding the part (or `appearance.pointer`) draws it, reaching from the center out to the thumb by default. Pick a `shape` (see [Pointer shapes](#pointer-shapes)) and tune it with `length`/`inset`/`width`/`color`/`cap`/`offset`/`counterweight`, or drop it again with `visible={false}`.
- `Knob.Thumb` – rotary handle marker (can be hidden for pointer-driven designs).
- `Knob.ValueLabel` – center or external readouts, including secondary lines.

`Knob.Root` accepts all `Knob` props, so you can opt into the low-level API only when you need bespoke layouts.

## Keyboard & assistive tech

The knob takes focus on web (`tabIndex=0`) and reports itself as a slider (`role="slider"`, native adjustable) with `aria-valuemin/max/now` — bounds are omitted on endless knobs — so it is operable without a pointer. It is named by `label` (or `accessibilityLabel`) and described by `description`. The keyboard and accessibility actions come from the shared `useAdjustable` primitive:

| Key | Effect |
| --- | --- |
| `←` `↓` / `→` `↑` | one `step` (horizontal arrows swap under RTL) |
| `shift` + arrow | ten steps |
| `PageUp` / `PageDown` | a tenth of the range |
| `Home` / `End` | `min` / `max` (ignored on endless knobs, which have no ends) |

On a knob with `restrictToMarks`, arrows move between adjacent marks rather than by `step` — a step-sized nudge would usually re-snap to the detent it started on. Every keypress commits, so `onChangeEnd` fires alongside `onChange`; `disabled` and `readOnly` knobs ignore keys entirely.

Physical keys are web-only. On native the same moves are exposed as `increment`/`decrement` accessibility actions, which is how VoiceOver and TalkBack drive an adjustable control.

## Press state

While the knob is being scrubbed, the thumb grows to `appearance.thumb.activeScale` (default `1.25`) and settles back on release, so the control acknowledges the grab under your finger. Set `activeScale: 1` to switch it off, or below `1` to shrink instead.

The scale rides in the same `transform` array as the thumb's position — one style key can only be set once, so a second `transform` would replace the position rather than compose with it — and it is applied after the translation, which is what makes the thumb grow in place rather than drift outward. Custom thumbs get the same signal: `renderThumb` receives `isScrubbing` alongside `value`, `angle`, and `size`.

The change is instant in both directions rather than eased. `transform` carries the position too, so a transition on it would smear the thumb behind the pointer during a drag — and behind the wheel in `scroll` mode, where the value moves without a press at all.

## Interaction modes

Enable spin, slide, and scroll gestures through `appearance.interaction`:

- `modes`: opt into `'spin'`, `'vertical-slide'`, `'horizontal-slide'`, and `'scroll'` simultaneously.
- `lockThresholdPx` / `variancePx`: tune how quickly slide gestures lock to an axis.
- `slideDominanceRatio`: require that one axis exceeds the other (default ~1.35×) before committing to a slide, making circular spins easier.
- `slideRatio`: convert linear drag distance into rotary degrees.
- `spinStopAtLimits`: keep bounded knobs from wrapping when spinning so they behave like sliders with hard stops.
- `tapToSet`: jump to the pressed angle on mouse-down and start scrubbing from there, so the knob tracks the pointer for the rest of the gesture without waiting out `lockThresholdPx`. Defaults to `true`; set it to `false` if the knob should only respond to turning. Endless knobs ignore it, since an angle there has no absolute value. Knobs without `'spin'` in `modes` still resolve the value on release instead.
- `tapDeadRadiusRatio`: fraction of the radius around the centre where presses are ignored, because a few pixels of movement there swing the angle wildly. Defaults to `0.15`. Presses inside it fall through to the slide modes, which is how vertical/horizontal drags stay reachable on a knob that otherwise scrubs on press.
- `scroll`: `{ enabled, ratio, invert, preventPageScroll }` configures wheel behavior. `preventPageScroll` defaults to `true` so mouse wheels don’t bubble up to the parent `ScrollView`.

Presses that land in the uncovered gap of a partial arc (for example the bottom wedge of a 270° knob) are ignored rather than snapped to the nearest end, so a mis-hit can’t slam the value to a limit.

Example:

```tsx
appearance={{
  interaction: {
    modes: ['spin', 'vertical-slide', 'horizontal-slide', 'scroll'],
    lockThresholdPx: 32,
    slideRatio: 1.5,
    spinStopAtLimits: true,
    scroll: { enabled: true, ratio: 0.75, preventPageScroll: true },
  },
}}
```