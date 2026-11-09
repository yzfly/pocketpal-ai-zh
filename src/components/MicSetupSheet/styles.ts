import {StyleSheet} from 'react-native';

import {Theme} from '../../utils/types';

export const createStyles = ({theme}: {theme: Theme}) =>
  StyleSheet.create({
    // 与弹层标题（左右 16）对齐
    content: {
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 16,
    },
    body: {
      color: theme.colors.onSurfaceVariant,
    },
    card: {
      borderWidth: 1,
      borderRadius: 18,
      borderColor: theme.colors.outlineVariant,
    },
  });
