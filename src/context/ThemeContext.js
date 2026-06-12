import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings } from '../services/storage';
import { darkColors, lightColors, spacing, radius } from '../utils/theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  const loadTheme = useCallback(async () => {
    const s = await getSettings();
    setIsDark(s.themeMode !== 'light');
  }, []);

  useEffect(() => { loadTheme(); }, []);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, spacing, radius, isDark, setIsDark, loadTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
