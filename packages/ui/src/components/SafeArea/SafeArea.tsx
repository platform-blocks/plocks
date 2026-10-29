import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeSafeAreaViewProps } from 'react-native-safe-area-context';
import type { View } from 'react-native';

import { factory } from '../../core/factory/factory';
import { Block } from '../Block';
import type { BlockProps } from '../Block';

/** A Block whose background and layout extend through the device safe area. */
export type SafeAreaProps = Omit<BlockProps, 'component'> & {
  /**
   * Which edges get the safe-area inset, forwarded to `SafeAreaView`
   * (e.g. `['top']`, or `{ bottom: 'maximum' }`). Default: all edges.
   */
  edges?: NativeSafeAreaViewProps['edges'];
};

export const SafeArea = factory<{ props: SafeAreaProps; ref: View }>((props, ref) => (
  <Block {...props} component={SafeAreaView} ref={ref} />
), { displayName: 'SafeArea' });
