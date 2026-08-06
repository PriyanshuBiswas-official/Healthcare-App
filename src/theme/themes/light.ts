import { ThemeColors, AppTheme } from '../types';

const lightThemeColors: ThemeColors = {
  // Backgrounds
  bg: '#EEF2FC',
  bgHero: '#2456E8',
  bgCard: '#FFFFFF',
  bgCardSolid: '#FFFFFF',
  bgCardBorder: '#E2EBF6',

  // Auth / inputs
  bgAuth: '#EEF2FC',
  bgInput: '#FFFFFF',
  inputBorder: '#E2EBF6',

  // Accents
  teal: '#0891B2',
  tealDim: 'rgba(8,145,178,0.10)',
  tealGlow: 'rgba(8,145,178,0.20)',
  pink: '#DB2777',
  pinkDim: 'rgba(219,39,119,0.10)',
  pinkGlow: 'rgba(219,39,119,0.20)',
  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.10)',
  amberGlow: 'rgba(245,158,11,0.20)',
  accentBlue: '#4F78F5',
  accentBlueDim: 'rgba(79,120,245,0.10)',
  blue: '#2456EB',
  blueDim: 'rgba(36,86,235,0.10)',

  // Cycle phase
  follicular: '#0EA5E9',

  // Text
  text: '#0D183E',
  textPrimary: '#0D183E',
  textSecondary: '#4A5780',
  textMuted: '#8E9CC4',
  textPlaceholder: '#D8EAFE',
  textInputLabel: '#0D183E',
  textHint: '#8E9CC4',

  // Modals / overlays
  overlay: 'rgba(0,0,0,0.3)',
  overlayHeavy: 'rgba(0,0,0,0.5)',
  modalBg: '#FFFFFF',

  // Tab bar
  tabBarBg: 'rgba(255,255,255,0.95)',

  // Surfaces
  chipBg: '#EBF2FF',
  chipBorder: '#D8EAFE',
  chartBg: '#F6F9FF',
  tooltipBg: '#EDF2FF',
  listItemBg: '#F6F9FF',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  danger: '#EF4444',
  success: '#10B981',
  divider: '#E2EBF6',
  shadowColor: '#8E9CC4',
};

export const lightTheme: AppTheme = {
  name: 'light',
  colors: lightThemeColors,
};
