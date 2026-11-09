import {StyleSheet} from 'react-native';

import type {Theme} from '../../../../utils/types';

// 口袋AI：黑白风格。推荐卡用前景色描边，其他卡用浅灰描边，不用彩色。
export const createStyles = (
  theme: Theme,
  selected: boolean,
  recommended: boolean,
) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.ml,
      borderRadius: theme.radius.m,
      borderWidth: recommended ? theme.stroke.md : theme.stroke.sm,
      borderColor: recommended ? theme.colors.primary : theme.colors.border,
      backgroundColor: recommended
        ? theme.colors.surfaceContainerLow
        : theme.colors.background,
      marginBottom: theme.spacing.s,
    },
    radio: {
      // 16×16 ring, active variant: 1.5px yellow/highest-contrast
      // border + 8px inner dot. Default: 1px light-grey border.
      width: 16,
      height: 16,
      borderRadius: 16,
      borderWidth: selected ? 1.5 : 1,
      borderColor: selected
        ? theme.colors.primary
        : theme.colors.outlineVariant,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    body: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    title: {
      ...theme.typography.titleS,
      color: theme.colors.onBackground,
    },
    subtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.captionS,
      color: theme.colors.onBackground,
      opacity: 0.7,
    },
    badge: {
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.radius.xs,
      backgroundColor: theme.colors.primary,
    },
    badgeText: {
      ...theme.typography.captionM,
      fontWeight: '500',
      color: theme.colors.onPrimary,
    },
  });
