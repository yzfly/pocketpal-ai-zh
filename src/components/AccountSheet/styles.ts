import {StyleSheet} from 'react-native';

import {Theme} from '../../utils/types';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
    },
    form: {
      gap: 12,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    hint: {
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: -6,
    },
    submit: {
      marginTop: 8,
    },
    submitContent: {
      height: 48,
    },
    // “去注册/去登录”做成明显可点的链接
    switchLabel: {
      color: theme.colors.primary,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });
