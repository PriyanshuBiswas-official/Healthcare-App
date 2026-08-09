import { darkTheme } from './themes/dark';

export { darkTheme } from './themes/dark';
export { lightTheme } from './themes/light';

// Backward-compatible static export — keeps all 44+ files working without migration
export const Colors = darkTheme.colors;

export const Typography = {
  // ── Font Sizes ──
  micro: 8,
  xs: 10,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  display: 36,

  // ── Font Weights ──
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,

  // ── Line Heights ──
  lhTight: 1.1,
  lhSnug: 1.25,
  lhNormal: 1.4,
  lhRelaxed: 1.6,

  // ── Letter Spacing ──
  lsTight: -0.5,
  lsNormal: 0,
  lsWide: 0.4,
  lsWider: 0.8,

  // ── Font Family ──
  fontFamily: 'System',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const Shadows = {
  teal: {
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pink: {
    shadowColor: Colors.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  amber: {
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const GlassCard = {
  backgroundColor: Colors.bgCard,
  borderWidth: 1,
  borderColor: Colors.bgCardBorder,
  borderRadius: Radius.lg,
};
