import {StyleSheet} from 'react-native';
import {Theme} from '../../utils';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginTop: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    chevronIcon: {
      marginLeft: 8,
    },
    content: {
      paddingTop: 8,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 6,
      fontStyle: 'italic',
    },
    modelsList: {
      gap: 8,
    },
    singleModelTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    modelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surfaceVariant + '20', // Very subtle background
      borderRadius: 8,
    },
    selectedModelItem: {
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    modelInfo: {
      flex: 1,
      marginRight: 8, // Reduced from 12 to 8
    },
    modelName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 2, // Small gap between name and size
    },
    selectedModelName: {
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    modelSize: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    modelActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4, // Tighter spacing between action buttons
    },
    downloadedActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4, // Reduced from 8 to 4
    },
    selectArea: {
      padding: 6, // More compact padding
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 44,
      minHeight: 44,
    },
    selectedArea: {},
    selectText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    },
    deleteArea: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: theme.colors.errorContainer + '20',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 44,
      minHeight: 44,
    },
    downloadArea: {
      padding: 6, // More compact, icon-only
      borderRadius: 6,
      backgroundColor: theme.colors.primaryContainer + '20',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 44,
      minHeight: 44,
    },
    downloadText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.primary,
      marginLeft: 4,
    },
    downloadProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.primaryContainer + '30',
      borderRadius: 6,
    },
    progressText: {
      marginLeft: 6,
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.primary,
    },
  });
