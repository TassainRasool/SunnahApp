import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { createNotificationChannel } from './src/services/notifications';
import { colors } from './src/utils/theme';

export default function App() {
  useEffect(() => {
    createNotificationChannel();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
