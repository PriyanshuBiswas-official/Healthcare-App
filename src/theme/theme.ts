import { ThemeColors, AppTheme } from './types';

const darkThemeColors: ThemeColors = {
  // Backgrounds
  bg: '#0A0B14',
  bgHero: '#1A1535',
  bgCard: 'rgba(255,255,255,0.05)',
  bgCardSolid: '#141522',
  bgCardBorder: 'rgba(255,255,255,0.10)',

  // Auth / inputs
  bgAuth: '#09090B',
  bgInput: '#18181B',
  inputBorder: '#27272A',

  // Accents
  teal: '#00E5CC',
  tealDim: 'rgba(0,229,204,0.15)',
  tealGlow: 'rgba(0,229,204,0.35)',
  pink: '#FF4D8D',
  pinkDim: 'rgba(255,77,141,0.15)',
  pinkGlow: 'rgba(255,77,141,0.35)',
  amber: '#FFB347',
  amberDim: 'rgba(255,179,71,0.15)',
  amberGlow: 'rgba(255,179,71,0.35)',
  purple: '#A78BFA',
  purpleDim: 'rgba(167,139,250,0.15)',
  blue: '#3B82F6',
  blueDim: 'rgba(59,130,246,0.15)',

  // Cycle phase
  follicular: '#7EC8E3',

  // Text
  text: '#F0F4FF',
  textPrimary: '#F0F4FF',
  textSecondary: '#8B92B4',
  textMuted: '#4A5070',
  textPlaceholder: '#52525B',
  textInputLabel: '#E4E4E7',
  textHint: '#A1A1AA',

  // Modals / overlays
  overlay: 'rgba(0,0,0,0.5)',
  overlayHeavy: 'rgba(0,0,0,0.72)',
  modalBg: '#111322',

  // Tab bar
  tabBarBg: 'rgba(12,16,30,0.92)',

  // Surfaces
  chipBg: 'rgba(255,255,255,0.06)',
  chipBorder: 'rgba(255,255,255,0.14)',
  chartBg: '#16182C',
  tooltipBg: 'rgba(255,255,255,0.04)',
  listItemBg: 'rgba(255,255,255,0.07)',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  danger: '#FF5E5E',
  success: '#00E5A0',
  divider: 'rgba(255,255,255,0.07)',
  shadowColor: '#000',
};

export const darkTheme: AppTheme = {
  name: 'dark',
  colors: darkThemeColors,
};

// Temporarily keep Colors exported so we don't break the whole app instantly
export const Colors = darkThemeColors;

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
  card: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const GlassCard = {
  backgroundColor: Colors.bgCard,
  borderWidth: 1,
  borderColor: Colors.bgCardBorder,
  borderRadius: Radius.lg,
  ...Shadows.card,
};
