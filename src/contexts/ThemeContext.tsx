import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  palette,
  typography,
  spacing,
  borderRadius,
  getShadows,
  animation,
} from '../constants/theme';

// ─── Types ────────────────────────────────────────────────

type ColorMode = 'light' | 'dark';

export type Theme = {
  colors: typeof palette.light;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: ReturnType<typeof getShadows>;
  animation: typeof animation;
  isDarkMode: boolean;
};

type ThemeContextValue = Theme & {
  setDarkMode: (value: boolean) => void;
};

// ─── Context ──────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Au MVP, le dark mode n'est pas exposé dans les réglages.
  const [isDarkMode, setDarkMode] = useState<boolean>(false);

  const theme = useMemo<ThemeContextValue>(() => {
    const colors = isDarkMode ? palette.dark : palette.light;
    const shadows = getShadows(isDarkMode, colors.shadowColor);
    return {
      colors,
      typography,
      spacing,
      borderRadius,
      shadows,
      animation,
      isDarkMode,
      setDarkMode,
    };
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() doit être utilisé à l\'intérieur d\'un <ThemeProvider>');
  }
  return ctx;
}
