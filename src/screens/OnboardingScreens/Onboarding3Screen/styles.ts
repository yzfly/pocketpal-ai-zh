import {StyleSheet} from 'react-native';

import {Theme} from '../../../utils/types';

// 对比卡片：两张等宽卡片，左边是口袋AI（实线描边），右边是云端（浅灰底），
// 轻微反向倾斜保留原插画的活泼感。
export const createCardStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    card: {
      width: 148,
      minHeight: 172,
      borderRadius: 12,
      padding: 16,
      gap: 6,
    },
    localCard: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.onSurface,
      transform: [{rotate: '-4deg'}],
    },
    cloudCard: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      transform: [{rotate: '4deg'}],
    },
    cloudIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    title: {
      marginTop: 10,
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    mutedTitle: {
      color: theme.colors.onSurfaceVariant,
    },
    sub: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.onSurfaceVariant,
    },
    tags: {
      marginTop: 'auto',
      fontSize: 12,
      color: theme.colors.onSurface,
    },
    vs: {
      fontSize: 13,
      fontStyle: 'italic',
      color: theme.colors.onSurfaceVariant,
    },
  });
