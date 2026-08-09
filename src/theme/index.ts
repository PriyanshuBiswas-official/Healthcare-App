import { ThemeName, AppTheme } from './types';
import { darkTheme } from './themes/dark';
import { lightTheme } from './themes/light';

export const themes: Record<ThemeName, AppTheme> = {
  dark: darkTheme,
  light: lightTheme,
  // neon: neonTheme, // TODO: add later
};

export type { ThemeName, AppTheme, ThemeColors } from './types';
export { darkTheme } from './themes/dark';
export { lightTheme } from './themes/light';
