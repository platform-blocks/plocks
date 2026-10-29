import { renderHook } from '@testing-library/react-native';

import { useGlobalHotkeys, useHotkeys } from '../index';

describe('useHotkeys (native)', () => {
  it('is a no-op without a DOM, for both handler forms', () => {
    const down = jest.fn();
    const { unmount } = renderHook(() => {
      useHotkeys([['mod+k', down], ['shift', { keydown: down, keyup: down }]]);
      useGlobalHotkeys('native-test', ['space', { keyup: down }]);
    });
    unmount();
    expect(down).not.toHaveBeenCalled();
  });
});
