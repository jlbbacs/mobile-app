import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, Theme, ThemeMode } from '../constants/theme';
import { storageService } from '../services/storageService';

interface ThemeContextValue {
  theme: Theme;
  themeOverride: 'system' | ThemeMode;
  setThemeOverride: (mode: 'system' | ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeOverride, setThemeOverrideState] = useState<'system' | ThemeMode>('system');

  useEffect(() => {
    void storageService.getSettings().then((settings) => {
      setThemeOverrideState(settings.themeOverride);
    });
  }, []);

  const setThemeOverride = async (mode: 'system' | ThemeMode) => {
    setThemeOverrideState(mode);
    const settings = await storageService.getSettings();
    await storageService.saveSettings({ ...settings, themeOverride: mode });
  };

  const resolvedMode: ThemeMode = themeOverride === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeOverride;

  const theme = useMemo(() => buildTheme(resolvedMode), [resolvedMode]);

  return (
    <ThemeContext.Provider value={{ theme, themeOverride, setThemeOverride }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
