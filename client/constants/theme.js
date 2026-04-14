/**
 * Centralized theme constants for the Seagle app.
 * Import from here instead of hardcoding colors, fonts, or spacing.
 */

export const COLORS = {
  // Primary palette
  navy: '#111A50',
  navyDark: '#1a2647',
  navyDeep: '#1A1F5C',
  orange: '#FF8C42',
  orangeLight: '#FCECDD',
  orangeBg: '#FFF5EB',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#1a1a1a',
  textSecondary: '#666',
  textTertiary: '#999',
  textMuted: '#9ca3af',
  textDark: '#1f2937',
  textBody: '#374151',
  textGray: '#6b7280',

  // Backgrounds
  bgPrimary: '#f8f9fa',
  bgWhite: '#fff',
  bgWarm: '#fef9f3',
  bgLight: '#f0f4ff',
  bgInput: '#fff',

  // Borders
  border: '#e5e7eb',
  borderLight: '#ddd',
  borderInput: '#e5e7eb',

  // Status / accent
  red: '#FF4444',
  green: '#4CAF50',

  // Misc
  placeholder: '#9ca3af',
  navInactive: '#8B93C7',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.95)',
  shadow: '#000',
};

export const FONTS = {
  regular: 'FunnelSans-Regular',
  bold: 'FunnelSans-Bold',
  light: 'FunnelSans-Light',
  medium: 'FunnelSans-Medium',
  serifRegular: 'STIXTwoText-Regular',
  serifBold: 'STIXTwoText-Bold',
  serifSemiBold: 'STIXTwoText-SemiBold',
  serifMedium: 'STIXTwoText-Medium',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 4,
  md: 10,
  lg: 16,
  xl: 20,
  pill: 26,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 11,
  md: 12,
  body: 14,
  regular: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 24,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

const theme = {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  SHADOWS,
}

export default theme;
