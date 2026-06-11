export const Colors = {
  // Backgrounds
  bg: '#0A0B14',
  bgCard: 'rgba(255,255,255,0.05)',
  bgCardBorder: 'rgba(255,255,255,0.10)',

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

  // Text
  text: '#F0F4FF',
  textPrimary: '#F0F4FF',
  textSecondary: '#8B92B4',
  textMuted: '#4A5070',

  // Utility
  white: '#FFFFFF',
  danger: '#FF5E5E',
  success: '#00E5A0',
  divider: 'rgba(255,255,255,0.07)',
};

export const Typography = {
  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  display: 38,

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,

  // Families
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
    shadowColor: '#000',
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
