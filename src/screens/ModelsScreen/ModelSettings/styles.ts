import {Dimensions, StyleSheet} from 'react-native';

import {Theme} from '../../../utils/types';

const screenHeight = Dimensions.get('window').height;

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      paddingVertical: 8,
    },
    advancedToggleText: {
      flex: 1,
      marginRight: 8,
    },
    advancedToggleTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    advancedToggleHint: {
      marginTop: 2,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    // 外层弹层已有 16 内边距，这里不再重复缩进，和下方“多模态/推理”分组对齐
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borders.default,
    },
    chatTemplateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 2,
    },
    chatTemplateLabel: {
      flex: 1,
    },
    templateDefault: {
      flex: 2,
      color: theme.colors.textSecondary,
    },
    chatTemplateContainer: {
      flex: 2,
      height: 20,
      overflow: 'hidden',
    },
    chatTemplateMaskContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    chatTemplatePreviewGradient: {
      flex: 1,
    },
    textArea: {
      fontSize: 12,
      lineHeight: 16,
      borderRadius: 8,
      maxHeight: screenHeight * 0.4,
    },
    completionSettingsContainer: {
      marginTop: 12,
      paddingHorizontal: 2,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 4,
    },
    settingsSection: {
      paddingVertical: 8,
    },
    modelNameLabel: {
      fontSize: 16,
      fontWeight: '600',
      paddingBottom: 8,
    },
    divider: {
      marginVertical: 4,
    },
    templateNote: {
      color: theme.colors.textSecondary,
      marginVertical: 8,
    },
    stopLabel: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingItem: {
      marginTop: 8,
      marginBottom: 8,
    },
    settingLabel: {
      marginBottom: 6,
    },
    settingValue: {
      textAlign: 'right',
    },
    stopWordsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    stopChip: {
      marginRight: 4,
      marginVertical: 4,
    },
    stopChipText: {
      fontSize: 12,
    },
    sheetContainer: {
      padding: 16,
    },
    actionsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
