---
title: useFieldA11y
category: accessibility
order: 20
tags: [accessibility, form, label, aria]
status: stable
since: 0.1.0
hidden: false
---

Wire a custom form control to its label, description, error and helper text, using the same contract as every plocks field. On web it links them with ids and `aria-*` references; on native, where id references don't work, it composes the control's label and hint instead.
