import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS } from '@/theme/tokens';

const THEME_PREF_KEY = 'jc_theme_dark_mode';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  vert: string;
  or: string;
  urgent: string;
  info: string;
  success: string;
  bleu: string;
}

export const LIGHT_THEME: ThemeColors = {
  background: COLORS.blanc,
  surface: COLORS.surface,
  card: '#FFFFFF',
  text: COLORS.noir,
  textSecondary: COLORS.champagne,
  border: 'rgba(142, 134, 113, 0.2)',
  vert: COLORS.vert,
  or: COLORS.or,
  urgent: COLORS.urgent,
  info: COLORS.info,
  success: COLORS.success,
  bleu: COLORS.bleu,
};

export const DARK_THEME: ThemeColors = {
  background: '#0D1117',
  surface: '#161B22',
  card: '#21262D',
  text: '#F0F6FC',
  textSecondary: '#8B949E',
  border: 'rgba(240, 246, 252, 0.15)',
  vert: '#142C1D',
  or: '#E5C048',
  urgent: '#EF4444',
  info: '#F97316',
  success: '#22C55E',
  bleu: '#3B82F6',
};

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeColors;
  toggleDarkMode: (enable?: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: LIGHT_THEME,
  toggleDarkMode: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        if (Platform.OS !== 'web') {
          const saved = await SecureStore.getItemAsync(THEME_PREF_KEY);
          if (saved !== null) {
            setIsDark(saved === 'true');
            return;
          }
        }
        // Si aucun choix utilisateur enregistré, suivre la préférence système
        if (systemScheme === 'dark') {
          setIsDark(true);
        }
      } catch {
        // Fallback silencieux sur light
      }
    }
    loadTheme();
  }, [systemScheme]);

  const toggleDarkMode = useCallback(async (enable?: boolean) => {
    setIsDark((prev) => {
      const next = enable !== undefined ? enable : !prev;
      if (Platform.OS !== 'web') {
        SecureStore.setItemAsync(THEME_PREF_KEY, String(next)).catch(() => {});
      }
      return next;
    });
  }, []);

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
