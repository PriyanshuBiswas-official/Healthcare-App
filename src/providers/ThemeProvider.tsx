import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [themeName, setThemeNameState] = useState<ThemeName>('dark');
  const [systemSync, setSystemSyncState] = useState<boolean>(true);
  const [isReady, setIsReady] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const [savedTheme, savedSync] = await Promise.all([
          AsyncStorage.getItem(THEME_PREF_KEY),
          AsyncStorage.getItem(SYSTEM_SYNC_KEY),
        ]);

        if (savedSync !== null) {
          setSystemSyncState(savedSync === 'true');
        }

        if (savedTheme && savedTheme in themes) {
          setThemeNameState(savedTheme as ThemeName);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsReady(true);
      }
    }
    loadTheme();
  }, []);

  const setThemeName = useCallback(async (name: ThemeName) => {
    setThemeNameState(name);
    try {
      await AsyncStorage.setItem(THEME_PREF_KEY, name);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  }, []);

  const setSystemSync = useCallback(async (sync: boolean) => {
    setSystemSyncState(sync);
    try {
      await AsyncStorage.setItem(SYSTEM_SYNC_KEY, String(sync));
    } catch (e) {
      console.error('Failed to save system sync', e);
    }
  }, []);

  // Compute effective theme based on system sync
  let effectiveThemeName = themeName;
  if (systemSync && systemColorScheme) {
    // If system is light, use light. If system is dark, use dark. 
    // Currently we only have dark, so fallback to dark if not available.
    effectiveThemeName = (systemColorScheme in themes ? systemColorScheme : 'dark') as ThemeName;
  }

  const currentTheme = themes[effectiveThemeName] || darkTheme;

  if (!isReady) {
    return null; // Or a splash screen
  }

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themeName: effectiveThemeName, systemSync, setThemeName, setSystemSync }}>
      {children}
    </ThemeContext.Provider>
  );
}
