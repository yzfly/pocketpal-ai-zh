import {StyleSheet} from 'react-native';

import {Theme} from '../../../utils/types';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      // 口袋AI：统一 16 的内边距、12 的圆角、细描边，不用阴影。
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 6,
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      borderWidth: StyleSheet.hairlineWidth * 2,
    },
    cardContent: {
      paddingBottom: 4,
    },
    downloadProgressContainer: {
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 12,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
    },
    downloadSpeed: {
      textAlign: 'right',
      fontSize: 12,
      marginTop: 4,
      color: theme.colors.onSurfaceVariant,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 8,
    },
    warningContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    warningIcon: {
      margin: 0,
      marginLeft: -8,
    },
    warningText: {
      color: theme.colors.error,
      fontSize: 12,
      flex: 1,
      flexWrap: 'wrap',
    },
    visionToggleContainer: {
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.colors.border,
      padding: 12,
      gap: 8,
    },
    modelTypeIcon: {
      flexShrink: 0,
    },
    tagline: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurface,
      marginTop: 4,
    },
    serverLink: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
    },
    serverLinkText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
      textDecorationLine: 'underline',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceVariant,
    },
    activeBadgeText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    detailsContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
    },
    hfLinkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.colors.border,
      minHeight: 48,
    },
    hfLinkContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    hfLinkText: {
      fontSize: 13,
      color: theme.colors.onSurface,
      marginLeft: 8,
    },
    // Action buttons section
    actionButtonsContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    primaryActionButton: {
      flex: 1,
      borderRadius: 8,
      marginRight: 4,
    },
    draftOnlyHint: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    iconButton: {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
    },
    visionToggleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    visionToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    visionToggleLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    visionHelpText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    projectionModelsContainer: {
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.colors.border,
      padding: 12,
    },
    projectorOffer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 44,
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.colors.border,
    },
    projectorOfferTitle: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    projectorOfferAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    projectorOfferActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    projectorProgress: {
      marginTop: 8,
      gap: 6,
    },
    projectorProgressText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    projectorProgressBar: {
      height: 6,
      borderRadius: 3,
    },
    storageErrorText: {
      marginHorizontal: 16,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modelName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    sizeText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      fontVariant: ['tabular-nums'],
      flexShrink: 0,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    metaText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    primaryActionContent: {
      height: 44,
    },
    primaryActionLabel: {
      fontSize: 14,
      marginVertical: 0,
    },
    detailsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      height: 44,
      paddingLeft: 8,
      paddingRight: 0,
      borderRadius: 8,
    },
    chevronUp: {
      transform: [{rotate: '180deg'}],
    },
    detailsToggleText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    specList: {
      borderTopWidth: StyleSheet.hairlineWidth * 2,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
      marginTop: -4,
    },
    specTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    specRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      gap: 12,
    },
    specRowLast: {
      borderBottomWidth: 0,
    },
    specLabel: {
      width: 72,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    specValue: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.onSurface,
    },
  });
