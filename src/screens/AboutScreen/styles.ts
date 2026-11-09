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
    // 口袋AI：去掉卡片套卡片和灰色头图，正文与其他页面一样距屏幕边 16
    card: {
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingVertical: theme.spacing.default * 1.5,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    stackedButton: {
      marginTop: theme.spacing.default * 0.75,
    },
    headerContent: {
      gap: theme.spacing.default,
    },
    title: {
      ...theme.fonts.headlineMedium,
      color: theme.colors.onSurface,
      letterSpacing: -0.5,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.default,
      lineHeight: 24,
    },
    versionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.default / 2,
    },
    versionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: theme.spacing.default,
      paddingVertical: theme.spacing.default / 2,
      borderRadius: theme.borders.default,
      gap: theme.spacing.default / 2,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    versionText: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurface,
    },
    llamaBuildText: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.default / 2,
      opacity: 0.7,
    },
    section: {
      paddingVertical: theme.spacing.default * 1.5,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    sectionTitle: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.default,
    },
    actionButton: {
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    orText: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginVertical: theme.spacing.default,
      opacity: 0.7,
    },
    feedbackButtonContent: {
      flexDirection: 'row-reverse',
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
      paddingVertical: theme.spacing.default * 1.5,
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
