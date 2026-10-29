---
displayName: Input
description: A versatile text input component with support for different types, states, and validation.
category: input
status: stable
tags: [input, form, text, validation]
playground: true
props:
  value: The current value of the input (controlled)
  defaultValue: Initial value while uncontrolled
  onChangeText: Callback fired when the input value changes
  readOnly: Show the value without allowing edits (`editable` still passes through)
  validation: Rules checked after the first blur, then on change (debounced by `debounceMs`); the first failing message shows while no `error` is given
  clearable: Show a clear button (named by `clearButtonLabel`, default "Clear") while there is a value
  placeholder: Placeholder text displayed when input is empty
  label: Label text displayed above the input
  error: Error message displayed below the input, announced and linked to it (`aria-describedby`)
  success: Success state — colors the frame with the theme's success color; a string or node also shows as a success message in the helper slot, linked to the input. `error` wins while both are set
  helperText: Help text below the input (replaced by the error or success message while there is one)
  description: Text under the label
  disabled: Whether the input is disabled
  required: Whether the input is required
  type: Input type (text, password, email, number, etc.)
  variant: Visual variant of the input shell — 'default' | 'filled' | 'outline' | 'unstyled' (no frame and no focus ring)
  focused: Force the focused look regardless of real focus (`false` keeps the focus ring off)
  textInputProps: Extra props for the underlying `TextInput`; its `onFocus` / `onBlur` receive the native event and run alongside the field's focus ring and `onFocus` / `onBlur`
  size: Size token controlling height, font, label, and toggle icon scaling
  autoFocus: Whether to auto-focus the input on mount
  maxLength: Maximum number of characters allowed
  multiline: Whether the input supports multiple lines
  numberOfLines: Number of lines for multiline inputs
  autoComplete: Auto-complete behavior
  labelProps: Override props applied to the label `<Text>` (style, fw, ff, etc.)
  descriptionProps: Override props applied to the description `<Text>`
  disclaimer: Helper text rendered below the field
  disclaimerProps: Override props for the disclaimer `<Text>`
  placeholderTextColor: Color of the placeholder text (overrides theme.text.muted)
  startSection: Content rendered before the input
  startSectionProps: View props applied to the startSection wrapper (style, accessibility, etc.)
  endSection: Content rendered after the input
  endSectionProps: View props applied to the endSection wrapper
  visibilityToggleFocusable: "`PasswordInput` only — keep the show/hide toggle in the keyboard tab order (default false: clickable but skipped by Tab)"
related:
  - PasswordInput
  - AutoComplete
  - Form
examples:
  - Basic text input with label and placeholder
  - Visual variants (default, filled, outline, unstyled)
  - Different input types (email, password, number, tel)
  - Validation, required, and disabled states
  - Success state
  - Focusable password visibility toggle
  - Multiline text input
  - Sections and slot styling (startSection, endSection, clearable)
---

Input provides a styled text field with labels, validation states, and helper text.
