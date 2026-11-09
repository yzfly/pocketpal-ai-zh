import {StyleSheet} from 'react-native';
import {Theme} from '../../../../utils/types';
import {EdgeInsets} from 'react-native-safe-area-context';

export const createStyles = (theme: Theme, insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outline,
    },
    actionBar: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingVertical: 8,
      paddingBottom: Math.max(insets.bottom, 12),
      justifyContent: 'space-around',
      alignItems: 'center',
      minHeight: 70,
    },
  });
