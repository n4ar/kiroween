/**
 * Paperkeep Design System
 */

export const colors = {
  light: {
    background: '#FEFCF8',
    primary: '#6B7F5A',
    accent: '#D4A574',
    text: '#2C2C2C',
    textSecondary: '#6B6B6B',
    border: '#E5E5E5',
    card: '#FFFFFF',
    error: '#D64545',
    success: '#5A7F6B',
  },
  dark: {
    background: '#1A1A1A',
    primary: '#8FA87A',
    accent: '#E5B885',
    text: '#F5F5F5',
    textSecondary: '#A0A0A0',
    border: '#3A3A3A',
    card: '#2A2A2A',
    error: '#E55555',
    success: '#7A8F7F',
  },
};

export const typography = {
  fonts: {
    ui: 'Inter',
    mono: 'JetBrains Mono',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
