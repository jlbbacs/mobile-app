export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryText: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F6',
  primary: '#2F6FED',
  primaryText: '#FFFFFF',
  text: '#151A23',
  textMuted: '#69707E',
  border: '#E1E5EC',
  success: '#1E9E5A',
  error: '#D64545',
  warning: '#C98A1B',
  overlay: 'rgba(15, 18, 25, 0.45)',
};

export const darkColors: ThemeColors = {
  background: '#0F131A',
  surface: '#1A2029',
  surfaceAlt: '#222A36',
  primary: '#5B8DF6',
  primaryText: '#0B0F16',
  text: '#EDEFF3',
  textMuted: '#97A0AF',
  border: '#2B3341',
  success: '#3FC17E',
  error: '#F0685E',
  warning: '#E3A93F',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

export function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    typography,
  };
}
