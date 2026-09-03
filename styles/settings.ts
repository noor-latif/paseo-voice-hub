// Vendor copy of paseo/packages/app/src/styles/settings.ts @ de11ed0
// Host uses StyleSheet.create((theme)=>...), plugin can't — plain factory
// with PluginColors (11 colors from PluginTheme) is the closest mirror.
// Delete when host exposes Settings primitives via @getpaseo/plugin/ui.

import { BORDER_RADIUS, BORDER_WIDTH, FONT_SIZE, FONT_WEIGHT, SPACING } from '../theme';

export interface PluginColors {
  surface0: string;
  surface1: string;
  surface2: string;
  border: string;
  foreground: string;
  foregroundMuted: string;
  accent: string;
  accentForeground: string;
  statusSuccess: string;
  statusWarning: string;
  statusDanger: string;
}

export function createSettingsStyles(colors: PluginColors) {
  return {
    section: {
      marginBottom: SPACING[6],
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: SPACING[3],
      marginLeft: SPACING[1],
    },
    sectionHeaderTitle: {
      color: colors.foregroundMuted,
      fontSize: FONT_SIZE.sm,
      fontWeight: FONT_WEIGHT.normal,
    },
    sectionHeaderLink: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: SPACING[1],
    },
    sectionHeaderLinkText: {
      color: colors.foregroundMuted,
      fontSize: FONT_SIZE.sm,
    },
    card: {
      backgroundColor: colors.surface1,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: BORDER_WIDTH[1],
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: SPACING[4],
      paddingHorizontal: SPACING[4],
    },
    rowBorder: {
      borderTopWidth: BORDER_WIDTH[1],
      borderTopColor: colors.border,
    },
    rowContent: {
      flex: 1,
      marginRight: SPACING[3],
    },
    rowTitle: {
      color: colors.foreground,
      fontSize: FONT_SIZE.base,
    },
    rowHint: {
      color: colors.foregroundMuted,
      fontSize: FONT_SIZE.sm,
      marginTop: SPACING[1],
    },
    rowError: {
      color: colors.statusDanger,
      fontSize: FONT_SIZE.sm,
      marginTop: SPACING[1],
    },
  };
}
