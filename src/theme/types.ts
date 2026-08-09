export interface ThemeColors {
  // Backgrounds
  bg: string;
  bgHero: string;
  bgCard: string;
  bgCardSolid: string;
  bgCardBorder: string;

  // Auth / inputs
  bgAuth: string;
  bgInput: string;
  inputBorder: string;

  // Accents
  teal: string;
  tealDim: string;
  tealGlow: string;
  pink: string;
  pinkDim: string;
  pinkGlow: string;
  amber: string;
  amberDim: string;
  amberGlow: string;
  accentBlue: string;
  accentBlueDim: string;
  blue: string;
  blueDim: string;

  // Cycle phase
  follicular: string;

  // Text
  text: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;
  textInputLabel: string;
  textHint: string;

  // Modals / overlays
  overlay: string;
  overlayHeavy: string;
  modalBg: string;

  // Tab bar
  tabBarBg: string;

  // Surfaces
  chipBg: string;
  chipBorder: string;
  chartBg: string;
  tooltipBg: string;
  listItemBg: string;

  // Utility
  white: string;
  black: string;
  danger: string;
  success: string;
  divider: string;
  shadowColor: string;
}

export type ThemeName = 'dark' | 'light'; // Add 'neon' here later

export interface AppTheme {
  name: ThemeName;
  colors: ThemeColors;
}
