import { ThemeColors, AppTheme } from '../types';

const lightThemeColors: ThemeColors = {
  // Backgrounds
  bg: '#F0F4FA',
  bgHero: '#D6E4F0',
  bgCard: 'rgba(0,0,0,0.04)',
  bgCardSolid: '#FFFFFF',
  bgCardBorder: 'rgba(0,0,0,0.08)',

  // Auth / inputs
  bgAuth: '#F8FAFC',
  bgInput: '#FFFFFF',
  inputBorder: '#CBD5E1',

  // Accents
  teal: '#0891B2',
  tealDim: 'rgba(8,145,178,0.10)',
  tealGlow: 'rgba(8,145,178,0.20)',
  pink: '#DB2777',
  pinkDim: 'rgba(219,39,119,0.10)',
  pinkGlow: 'rgba(219,39,119,0.20)',
  amber: '#D97706',
  amberDim: 'rgba(217,119,6,0.10)',
  amberGlow: 'rgba(217,119,6,0.20)',
  purple: '#7C3AED',
  purpleDim: 'rgba(124,58,237,0.10)',
  blue: '#2563EB',
  blueDim: 'rgba(37,99,235,0.10)',

  // Cycle phase
  follicular: '#0EA5E9',

  // Text
  text: '#1E293B',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textPlaceholder: '#CBD5E1',
  textInputLabel: '#334155',
  textHint: '#94A3B8',

  // Modals / overlays
  overlay: 'rgba(0,0,0,0.3)',
  overlayHeavy: 'rgba(0,0,0,0.5)',
  modalBg: '#FFFFFF',

  // Tab bar
  tabBarBg: 'rgba(255,255,255,0.95)',

  // Surfaces
  chipBg: 'rgba(0,0,0,0.05)',
  chipBorder: 'rgba(0,0,0,0.10)',
  chartBg: '#F8FAFC',
  tooltipBg: 'rgba(0,0,0,0.06)',
  listItemBg: 'rgba(0,0,0,0.03)',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  danger: '#DC2626',
  success: '#059669',
  divider: 'rgba(0,0,0,0.08)',
  shadowColor: '#94A3B8',
};

export const lightTheme: AppTheme = {
  name: 'light',
  colors: lightThemeColors,
};
