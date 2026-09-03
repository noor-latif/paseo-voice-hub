// Vendor copy of paseo/packages/app/src/styles/theme.ts @ de11ed0
// — only the static token literals that plugins can't inherit.
// Delete when PluginTheme exposes them (see app/plugins/theme.ts).
// Keep names/order identical to host for future `s/..\/theme/..\/theme/` moves.

export const SPACING = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

export const FONT_SIZE = {
  code: 12,
  content: 15,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 22,
  '4xl': 26,
} as const;

export const BORDER_RADIUS = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
} as const;

export const BORDER_WIDTH = { 0: 0, 1: 1, 2: 2 } as const;

export const ICON_SIZE = { xs: 12, sm: 14, md: 16, lg: 20 } as const;

export const FONT_WEIGHT = {
  normal: 'normal' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: 'bold' as const,
} as const;

export const OPACITY = { 0: 0, 50: 0.5, 100: 1 } as const;

export const LINE_HEIGHT = { diff: 22 } as const;

export const SHADOW = {
  sm: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(0,0,0,0.16)',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  lg: {
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
} as const;
