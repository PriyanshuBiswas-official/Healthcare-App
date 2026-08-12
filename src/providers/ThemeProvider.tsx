import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';
import { storage } from '../lib/storage';
import { AppTheme, ThemeName, darkTheme, themes } from '../theme';

interface ThemeContextType {
  theme: AppTheme;
  themeName: ThemeName;
  systemSync: boolean;
  setThemeName: (name: ThemeName) => void;
  setSystemSync: (sync: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  themeName: 'dark',
  systemSync: true,
  setThemeName: () => {},
  setSystemSync: () => {},
});

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}

export function useStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleCreator: (theme: AppTheme) => T
): T {
  const { theme } = useContext(ThemeContext);
  return useMemo(() => styleCreator(theme), [theme, styleCreator]);
}

const THEME_PREF_KEY = '@theme_pref';
const SYSTEM_SYNC_KEY = '@theme_system_sync';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null
  
  // Synchronously initialize state from MMKV
  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    const saved = storage.getString(THEME_PREF_KEY);
    return (saved && saved in themes) ? (saved as ThemeName) : 'dark';
  });

  const [systemSync, setSystemSyncState] = useState<boolean>(() => {
    const saved = storage.getString(SYSTEM_SYNC_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    try {
      storage.set(THEME_PREF_KEY, name);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  }, []);

  const setSystemSync = useCallback((sync: boolean) => {
    setSystemSyncState(sync);
    try {
      storage.set(SYSTEM_SYNC_KEY, String(sync));
    } catch (e) {
      console.error('Failed to save system sync', e);
    }
  }, []);
  // Compute effective theme based on system sync
  let effectiveThemeName = themeName;
  if (systemSync && systemColorScheme) {
    effectiveThemeName = (systemColorScheme in themes ? systemColorScheme : 'dark') as ThemeName;
  }

  const currentTheme = themes[effectiveThemeName] || darkTheme;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themeName: effectiveThemeName, systemSync, setThemeName, setSystemSync }}>
      {children}
    </ThemeContext.Provider>
  );
}
