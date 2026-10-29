import { renderHook } from '@testing-library/react-native';

import { getModifierKeys, useModifierKeys } from '../useModifierKeys';

describe('useModifierKeys (native)', () => {
  it('reports no modifiers: native has no keyboard modifiers to track', () => {
    const { result } = renderHook(() => useModifierKeys());
    const none = { alt: false, ctrl: false, meta: false, shift: false };
    expect(result.current).toEqual(none);
    expect(getModifierKeys()).toEqual(none);
  });
});
