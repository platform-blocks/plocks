import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { createThemedStyles } from '../../core/hooks/useThemedStyles';
import { getControlSize, resolveFontSize, resolveSpacing } from '../../core/theme/tokens';
import type { PlocksTheme, SizeValue } from '../../core/theme/types';

/**
 * TextArea-specific styles on top of the shared field frame. `rowHeight` is
 * the line height one `rows` step adds. Cached per theme + size.
 */
export const getTextAreaStyles = createThemedStyles((theme: PlocksTheme, size: SizeValue) => {
  const metrics = getControlSize(theme, size);
  const rowHeight = Math.round(metrics.fontSize * 1.7);
  const inset = resolveSpacing(theme, 'xs') as number;

  const styles = StyleSheet.create({
    root: { marginBottom: inset } as ViewStyle,
    // Multi-line content and sections sit at the top of the box.
    frame: { alignItems: 'flex-start' } as ViewStyle,
    // `flex`: the frame takes the root's remaining height and the control stretches with it.
    frameFill: { flex: 1, alignItems: 'stretch', minHeight: 0 } as ViewStyle,
    input: {
      // The shared field input is `flex: 1`, which on web is `flex-basis: 0%`
      // and overrides `height` in the column control: the box collapsed to its
      // `rows`. An `auto` basis lets `h` (or the rows height) size it.
      flexBasis: 'auto',
      lineHeight: rowHeight,
      textAlignVertical: 'top',
      paddingTop: 0,
      paddingBottom: 0,
    } as TextStyle,
    inputFill: { flexGrow: 1, flexShrink: 1, minHeight: 0 } as TextStyle,
    clearButton: { position: 'absolute', top: inset, end: inset, margin: 0 } as ViewStyle,
    counter: {
      color: theme.text.secondary,
      fontSize: resolveFontSize(theme, 'xs'),
      marginTop: inset,
      // Trailing edge in either reading direction.
      alignSelf: 'flex-end',
    } as TextStyle,
    counterError: { color: theme.colors.error[5] } as TextStyle,
  });

  return { rowHeight, styles };
});
