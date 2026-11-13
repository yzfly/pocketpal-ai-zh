import {StyleSheet} from 'react-native';
import {EdgeInsets} from 'react-native-safe-area-context';
import {Theme} from '../../utils/types';

export const createStyles = (theme: Theme, insets: EdgeInsets) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flexGrow: 1,
      padding: theme.spacing.default,
      paddingBottom: theme.spacing.default + insets.bottom,
    },
    // 口袋AI：居中的品牌区 + 平铺分组列表（与设置页一致），正文距屏幕边 16
    card: {
      backgroundColor: theme.colors.background,
    },
    hero: {
      alignItems: 'center',
      paddingTop: theme.spacing.default * 1.5,
      paddingBottom: theme.spacing.default * 1.5,
    },
    title: {
      ...theme.fonts.headlineMedium,
      color: theme.colors.onSurface,
      letterSpacing: -0.5,
      marginTop: theme.spacing.default,
    },
    heroDescription: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: theme.spacing.default / 2,
      marginBottom: theme.spacing.default * 1.25,
      paddingHorizontal: theme.spacing.default,
    },
    description: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: theme.spacing.default / 4,
    },
    versionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: 14,
      minHeight: 32,
      borderRadius: 16,
      gap: theme.spacing.default / 2,
    },
    versionText: {
      ...theme.fonts.labelLarge,
      color: theme.colors.onSurface,
      fontVariant: ['tabular-nums'],
    },
    llamaBuildText: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.default / 2,
      opacity: 0.7,
    },
    section: {
      paddingTop: theme.spacing.default * 0.75,
      paddingBottom: theme.spacing.default * 0.25,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outlineVariant,
    },
    // 分组标题：与设置页相同的小号灰色标签
    sectionTitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      letterSpacing: 0.3,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.default / 2,
      marginBottom: theme.spacing.default / 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      gap: 14,
      paddingVertical: theme.spacing.default / 2,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    rowPressed: {
      opacity: 0.6,
    },
    rowLabel: {
      ...theme.fonts.bodyLarge,
      color: theme.colors.onSurface,
      flex: 1,
    },
    rowStatus: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    feedbackForm: {
      padding: theme.spacing.default,
    },
    field: {
      marginBottom: theme.spacing.default,
    },
    label: {
      ...theme.fonts.labelMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.default / 2,
    },
    segmentedButtons: {
      marginTop: theme.spacing.default / 2,
    },
    submitButton: {
      marginTop: theme.spacing.default,
    },
    secondaryButtons: {
      flexDirection: 'row',
    },
    legalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.default,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outlineVariant,
      columnGap: theme.spacing.default / 2,
      rowGap: theme.spacing.default / 4,
    },
    legalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.default / 2,
    },
    legalHit: {
      minHeight: 44,
      justifyContent: 'center',
    },
    legalLink: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    legalSeparator: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.5,
    },
    legalSeparatorHidden: {
      opacity: 0,
    },
    noticesContent: {
      padding: theme.spacing.default,
      paddingBottom: insets.bottom + theme.spacing.default,
    },
    noticesCredit: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.default,
    },
    noticesText: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
  });
