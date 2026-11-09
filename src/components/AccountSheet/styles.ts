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
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    codeInput: {
      flex: 1,
    },
    codeButton: {
      minWidth: 112,
    },
    captchaBox: {
      gap: 8,
      padding: 12,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    captchaImage: {
      height: 56,
      width: '100%',
    },
    submit: {
      marginTop: 8,
    },
    submitContent: {
      height: 48,
    },
  });
