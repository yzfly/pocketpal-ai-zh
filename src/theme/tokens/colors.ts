/**
 * Color tokens — light and dark bindings.
 *
 * 口袋AI：Vercel / Geist 风格的黑白配色。只用黑、白与中性灰阶，
 * 主按钮为纯黑（亮色）/ 纯白（暗色），唯一的彩色是错误红。
 * 灰阶取自 Geist：亮色 #fafafa…#171717，暗色 #0a0a0a…#ededed，
 * 边框 #eaeaea / #333333。
 *
 * (Upstream notes below describe the original token sources.)
 *
 * Sources:
 *   - Light values: current `createBaseColors(AppTheme.Light)` +
 *     `createSemanticColors(_, false)` output from `src/utils/theme.ts`,
 *     preserved verbatim (no visual regression).
 *   - Dark values: extracted from canonical Figma `RZxDJea4t6jnBZrV4YBacF`,
 *     dark band `3011:*`. Where the canonical dark binding disagreed with
 *     the current dark Theme value at a key with visible consumers, the
 *     current dark value wins to avoid visual regression; the disagreement
 *     is tracked as a designer follow-up.
 *
 * `withOpacity` calls are deferred to a util (not inlined as literals) so
 * the output is byte-identical to today's runtime computation — this is
 * what guarantees no visual regression for the surfaceContainer* + border
 * + placeholder etc keys that currently derive via opacity math.
 *
 * NOTE on imports: this module imports from `../../utils/colorUtils` only,
 * which is a pure utility (no React, no Paper, no MobX). The purity
 * constraint for this module forbids React/Paper/MobX imports only.
 */
import {withOpacity, stateLayerOpacity} from '../../utils/colorUtils';

import {TokenColors} from './types';

// ── Light (Geist light) ─────────────────────────────────────────────
const LIGHT_PRIMARY = '#000000';
const LIGHT_SECONDARY = '#171717';
const LIGHT_TERTIARY = '#666666';
const LIGHT_ERROR = '#E5484D';
const LIGHT_BACKGROUND = '#FFFFFF';
const LIGHT_ON_BACKGROUND = '#000000';
const LIGHT_SURFACE = '#FFFFFF';
const LIGHT_ON_SURFACE = '#171717';
const LIGHT_INVERSE_ON_SURFACE = '#FAFAFA';
const LIGHT_BORDER = '#EAEAEA';
const LIGHT_MUTED = '#666666';

export const lightColors: TokenColors = {
  // MD3 base palette (light)
  primary: LIGHT_PRIMARY,
  onPrimary: '#FFFFFF',
  primaryContainer: '#F2F2F2',
  onPrimaryContainer: '#171717',
  secondary: LIGHT_SECONDARY,
  onSecondary: '#FFFFFF',
  secondaryContainer: '#EBEBEB',
  onSecondaryContainer: '#171717',
  tertiary: LIGHT_TERTIARY,
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#F2F2F2',
  onTertiaryContainer: '#171717',
  error: LIGHT_ERROR,
  onError: '#FFFFFF',
  errorContainer: '#FFEBEB',
  onErrorContainer: '#8F1F22',
  background: LIGHT_BACKGROUND,
  onBackground: LIGHT_ON_BACKGROUND,
  surface: LIGHT_SURFACE,
  onSurface: LIGHT_ON_SURFACE,
  surfaceVariant: '#F2F2F2',
  onSurfaceVariant: LIGHT_MUTED,
  outline: LIGHT_BORDER,
  outlineVariant: '#C9C9C9',
  mutedLight: '#EBEBEB',
  secondaryDefault: '#F2F2F2',
  // MD3 extras
  surfaceDisabled: withOpacity('#000000', 0.06),
  onSurfaceDisabled: withOpacity('#171717', 0.38),
  inverseSurface: '#171717',
  inverseOnSurface: LIGHT_INVERSE_ON_SURFACE,
  inversePrimary: '#EDEDED',
  inverseSecondary: '#A1A1A1',
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.25)',
  backdrop: 'rgba(0, 0, 0, 0.4)',

  // Surface ladder
  surfaceContainerHighest: '#EBEBEB',
  surfaceContainerHigh: '#F2F2F2',
  surfaceContainer: '#F5F5F5',
  surfaceContainerLow: '#FAFAFA',
  surfaceContainerLowest: '#FFFFFF',
  surfaceDim: '#F2F2F2',
  surfaceBright: '#FFFFFF',

  // Text
  text: LIGHT_ON_BACKGROUND,
  textSecondary: LIGHT_MUTED,
  inverseText: LIGHT_INVERSE_ON_SURFACE,
  inverseTextSecondary: withOpacity(LIGHT_INVERSE_ON_SURFACE, 0.6),

  // Border / placeholder
  border: LIGHT_BORDER,
  placeholder: '#A8A8A8',

  // Interactive state opacities
  stateLayerOpacity: 0.12,
  hoverStateOpacity: stateLayerOpacity.hover,
  pressedStateOpacity: stateLayerOpacity.pressed,
  draggedStateOpacity: stateLayerOpacity.dragged,
  focusStateOpacity: stateLayerOpacity.focus,

  // Menu
  menuBackground: '#FFFFFF',
  menuBackgroundDimmed: withOpacity('#FFFFFF', 0.9),
  menuBackgroundActive: '#F2F2F2',
  menuSeparator: LIGHT_BORDER,
  menuGroupSeparator: LIGHT_BORDER,
  menuText: LIGHT_ON_SURFACE,
  menuDangerText: LIGHT_ERROR,

  // Messages
  authorBubbleBackground: '#F2F2F2',
  receivedMessageDocumentIcon: LIGHT_PRIMARY,
  sentMessageDocumentIcon: LIGHT_ON_SURFACE,
  userAvatarImageBackground: 'transparent',
  userAvatarNameColors: ['#000000', '#454545', '#666666', '#8F8F8F'],
  searchBarBackground: '#F2F2F2',

  // Thinking bubble (neutral)
  thinkingBubbleBackground: '#FAFAFA',
  thinkingBubbleText: '#666666',
  thinkingBubbleBorder: LIGHT_BORDER,
  thinkingBubbleShadow: '#000000',
  thinkingBubbleChevronBackground: '#F2F2F2',
  thinkingBubbleChevronBorder: LIGHT_BORDER,

  // Status
  bgStatusActive: '#000000',
  bgStatusIdle: '#C9C9C9',
  statusLoaded: '#171717',

  // Buttons (outlined, monochrome)
  btnPrimaryBg: '#000000',
  btnPrimaryBorder: '#000000',
  btnPrimaryText: '#FFFFFF',
  btnReadyBg: '#FFFFFF',
  btnReadyBorder: LIGHT_BORDER,
  btnReadyText: '#171717',
  btnDownloadBg: '#FFFFFF',
  btnDownloadBorder: LIGHT_BORDER,
  btnDownloadText: '#171717',

  // Icons
  iconModelTypeText: '#454545',
  iconModelTypeVision: '#454545',
  iconModelTypeAudio: '#454545',

  accent: {
    peach: '#F2F2F2',
    greenStrong: '#000000',
  },
};

// ── Dark (Geist dark) ───────────────────────────────────────────────
const DARK_PRIMARY = '#FFFFFF';
const DARK_SECONDARY = '#EDEDED';
const DARK_TERTIARY = '#A1A1A1';
const DARK_ERROR = '#FF6166';
const DARK_BACKGROUND = '#000000';
const DARK_ON_BACKGROUND = '#FFFFFF';
const DARK_SURFACE = '#0A0A0A';
const DARK_ON_SURFACE = '#EDEDED';
const DARK_INVERSE_ON_SURFACE = '#171717';
const DARK_BORDER = '#333333';
const DARK_MUTED = '#A1A1A1';

export const darkColors: TokenColors = {
  // MD3 base palette (dark)
  primary: DARK_PRIMARY,
  onPrimary: '#000000',
  primaryContainer: '#1F1F1F',
  onPrimaryContainer: '#EDEDED',
  secondary: DARK_SECONDARY,
  onSecondary: '#000000',
  secondaryContainer: '#292929',
  onSecondaryContainer: '#EDEDED',
  tertiary: DARK_TERTIARY,
  onTertiary: '#000000',
  tertiaryContainer: '#1F1F1F',
  onTertiaryContainer: '#EDEDED',
  error: DARK_ERROR,
  onError: '#000000',
  errorContainer: '#3C1618',
  onErrorContainer: '#FFD1D3',
  background: DARK_BACKGROUND,
  onBackground: DARK_ON_BACKGROUND,
  surface: DARK_SURFACE,
  onSurface: DARK_ON_SURFACE,
  surfaceVariant: '#1F1F1F',
  onSurfaceVariant: DARK_MUTED,
  outline: DARK_BORDER,
  outlineVariant: '#454545',
  mutedLight: '#292929',
  secondaryDefault: '#1F1F1F',
  // MD3 extras
  surfaceDisabled: withOpacity('#FFFFFF', 0.06),
  onSurfaceDisabled: withOpacity('#EDEDED', 0.38),
  inverseSurface: '#EDEDED',
  inverseOnSurface: DARK_INVERSE_ON_SURFACE,
  inversePrimary: '#171717',
  inverseSecondary: '#454545',
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.6)',

  // Surface ladder
  surfaceContainerHighest: '#292929',
  surfaceContainerHigh: '#1F1F1F',
  surfaceContainer: '#1A1A1A',
  surfaceContainerLow: '#111111',
  surfaceContainerLowest: '#0A0A0A',
  surfaceDim: '#000000',
  surfaceBright: '#1F1F1F',

  // Text
  text: DARK_ON_BACKGROUND,
  textSecondary: DARK_MUTED,
  inverseText: DARK_INVERSE_ON_SURFACE,
  inverseTextSecondary: withOpacity(DARK_INVERSE_ON_SURFACE, 0.6),

  // Border / placeholder
  border: DARK_BORDER,
  placeholder: '#6E6E6E',

  // Interactive state opacities
  stateLayerOpacity: 0.12,
  hoverStateOpacity: stateLayerOpacity.hover,
  pressedStateOpacity: stateLayerOpacity.pressed,
  draggedStateOpacity: stateLayerOpacity.dragged,
  focusStateOpacity: stateLayerOpacity.focus,

  // Menu
  menuBackground: '#111111',
  menuBackgroundDimmed: withOpacity('#111111', 0.9),
  menuBackgroundActive: '#1F1F1F',
  menuSeparator: DARK_BORDER,
  menuGroupSeparator: DARK_BORDER,
  menuText: DARK_ON_SURFACE,
  menuDangerText: DARK_ERROR,

  // Messages
  authorBubbleBackground: '#1F1F1F',
  receivedMessageDocumentIcon: DARK_PRIMARY,
  sentMessageDocumentIcon: DARK_ON_SURFACE,
  userAvatarImageBackground: 'transparent',
  userAvatarNameColors: ['#FFFFFF', '#C9C9C9', '#A1A1A1', '#7D7D7D'],
  searchBarBackground: '#1A1A1A',

  // Thinking bubble (neutral)
  thinkingBubbleBackground: '#0A0A0A',
  thinkingBubbleText: '#A1A1A1',
  thinkingBubbleBorder: DARK_BORDER,
  thinkingBubbleShadow: '#000000',
  thinkingBubbleChevronBackground: '#1A1A1A',
  thinkingBubbleChevronBorder: DARK_BORDER,

  // Status
  bgStatusActive: '#FFFFFF',
  bgStatusIdle: '#454545',
  statusLoaded: '#EDEDED',

  // Buttons (outlined, monochrome)
  btnPrimaryBg: '#FFFFFF',
  btnPrimaryBorder: '#FFFFFF',
  btnPrimaryText: '#000000',
  btnReadyBg: '#0A0A0A',
  btnReadyBorder: DARK_BORDER,
  btnReadyText: '#EDEDED',
  btnDownloadBg: '#0A0A0A',
  btnDownloadBorder: DARK_BORDER,
  btnDownloadText: '#EDEDED',

  // Icons
  iconModelTypeText: '#C9C9C9',
  iconModelTypeVision: '#C9C9C9',
  iconModelTypeAudio: '#C9C9C9',

  accent: {
    peach: '#1F1F1F',
    greenStrong: '#FFFFFF',
  },
};
