import type { ComponentType } from 'react';

import type { NativeSelectProps } from './levelSelect';

/**
 * The header select behind `withNativeLevelSelect`. Web renders a real
 * `<select>` (NativeSelect.web.tsx); native has no select element, so this is
 * `null` and the calendar keeps its level button.
 * @internal
 */
export const NativeSelect: ComponentType<NativeSelectProps> | null = null;
