---
name: Radio
description: A radio button component for single-choice selection from a group of options
category: input
subcategory: Form Controls
tags: [input, form, selection, choice]
status: stable
playground: true
props:
  value: Value reported to onChange when this radio is picked
  checked: Whether this radio is the selected one
  onChange: Called with value when the radio is picked
  label: Label displayed beside the radio (ReactNode); pressing it picks the radio
  description: Supporting text shown beneath the label (ReactNode)
  size: Size token controlling radio + label scaling
  color: Radio color — palette token | 'primary.6' | any CSS color
  variant: Draw style once selected — 'filled' (solid accent disc, default) or 'light' (tinted disc, dot in the accent)
  disabled: Whether the radio is disabled
  error: Error message (ReactNode); replaces helperText and marks the radio invalid
  labelPosition: Label side, left or right (follows the reading direction)
  transitionDuration: Length of the select/deselect animation in ms; `0` applies the state instantly
platform:
  web: true
  ios: true
  android: true
accessibility:
  - RadioGroup is a labelled role="radiogroup"; each option is role="radio" with aria-checked
  - One tab stop per group (the selected option, or the first while none is selected)
  - Arrow keys move focus and selection together, following the reading direction; Home/End jump to the ends; Space selects
  - Group label, description, helperText and error are linked through the shared Field frame
related:
  - Checkbox
  - Switch
  - Select
examples:
  basic: Basic radio button usage
  variants: Different visual variants
  controlVariants: Filled and light radios
  orientations: Horizontal and vertical layouts
  forms: Integration with form controls
---

Radio lets users select one option from a group of choices.
