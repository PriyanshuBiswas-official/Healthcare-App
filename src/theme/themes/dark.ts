import { ThemeColors, AppTheme } from '../types';

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
  accentBlue: '#6B8AFF',
  accentBlueDim: 'rgba(107,138,255,0.15)',
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
