import {StyleSheet} from 'react-native';

import {Theme} from '../../utils/types';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    // 口袋AI：分组平铺，正文统一距屏幕 16（Card.Content 自带 16），组间用分隔线
    container: {
      paddingVertical: 8,
    },
    scrollViewContent: {
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    card: {
      marginVertical: 0,
      borderRadius: 0,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    settingItemContainer: {
      marginVertical: 16,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 8,
    },
    textContainer: {
      flex: 1,
      marginRight: 16,
    },
    labelWithIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    settingIcon: {
      marginRight: 8,
    },
    textLabel: {
      color: theme.colors.onSurface,
    },
    textDescription: {
      color: theme.colors.onSurfaceVariant,
      //marginTop: 4,
    },
    divider: {
      marginVertical: 12,
    },
    slider: {
      //marginVertical: 8,
      //height: 40,
    },
    textInput: {
      marginVertical: 8,
    },
    invalidInput: {
      borderColor: theme.colors.error,
      borderWidth: 1,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: 4,
    },
    // Cap the value side of a settings row so a long value label ellipsizes
    // inside the button instead of squeezing the flex title/description
    // column into a sliver.
    menuContainer: {
      position: 'relative',
      flexShrink: 1,
      maxWidth: '55%',
    },
    menuButton: {
      minWidth: 100,
      maxWidth: '100%',
    },
    // 卡片底部的主按钮与上方说明文字留出间距
    cardActionButton: {
      marginTop: 12,
    },
    tierActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    inUseLabel: {
      color: theme.colors.primary,
    },
    // A control too wide to share its row (e.g. the draft-model picker, whose
    // values are model filenames) sits under the title/description instead.
    // Also keeps the menu anchor at the row's left edge, on-screen.
    fullRowControl: {
      marginTop: 8,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    consentContainer: {
      marginVertical: 8,
    },
    consentButton: {
      alignSelf: 'flex-end',
      marginTop: 12,
    },
    buttonContent: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
    },
    advancedSettingsButton: {
      marginVertical: 8,
    },
    advancedSettingsContent: {
      marginTop: 8,
    },
    advancedAccordion: {
      height: 55,
      paddingRight: 0,
    },
    // 去掉 Paper 默认的 16 左缩进，与其他设置项左对齐
    advancedAccordionContent: {
      paddingLeft: 0,
    },
    accordionTitle: {
      fontSize: 14,
      color: theme.colors.secondary,
    },
    // Floor, not a fixed width: dropdown items size to their longest label
    // (the outer menu clamps at 90% screen and item titles ellipsize past it).
    menu: {
      minWidth: 170,
    },
    linkContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    linkIcon: {
      marginLeft: 4,
    },
    segmentedButtons: {
      marginVertical: 8,
    },
    keySheetContent: {
      padding: 16,
      paddingBottom: 32,
    },
    titleWithBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    keySheetActions: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
  });
