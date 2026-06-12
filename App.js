import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { createNotificationChannel } from './src/services/notifications';

function AppContent() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  useEffect(() => {
    createNotificationChannel();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
