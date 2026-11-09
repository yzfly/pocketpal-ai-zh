import {StyleSheet} from 'react-native';
import {Theme} from '../../utils/types';

export const createStyles = ({theme}: {theme: Theme}) =>
  StyleSheet.create({
    container: {
      // Don't use flex: 1 since we're in a FlatList ListEmptyComponent
      // The FlatList already handles centering with justifyContent: 'center'
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 20,
      gap: 16,
      minHeight: 400, // Ensure minimum height for proper centering
    },
    content: {
      alignItems: 'center',
      gap: 6,
      maxWidth: '100%',
    },
    title: {
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 2,
      ...theme.fonts.titleLarge,
    },
    subtitle: {
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 6,
      ...theme.fonts.titleSmall,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 16,
      ...theme.fonts.bodyMedium,
    },
    experimentalNotice: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 12,
      maxWidth: '100%',
    },
    experimentalText: {
      color: theme.colors.onErrorContainer,
      textAlign: 'center',
      ...theme.fonts.bodySmall,
    },
    instructionsContainer: {
      alignItems: 'flex-start',
      gap: 3,
      maxWidth: '100%',
    },
    instructionsTitle: {
      color: theme.colors.onSurface,
      marginBottom: 6,
      ...theme.fonts.titleSmall,
    },
    instructionStep: {
      color: theme.colors.onSurfaceVariant,
      ...theme.fonts.bodySmall,
    },
  });
