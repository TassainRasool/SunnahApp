import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function OfflineBanner({ isOnline }) {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    banner: {
      backgroundColor: colors.warningBg,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.warning,
      padding: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    icon: { fontSize: 14 },
    text: { fontSize: 12, color: colors.warning, fontWeight: '500' },
  }), [colors, spacing, radius]);
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -50 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.icon}>📵</Text>
      <Text style={styles.text}>You are offline — showing cached hadiths</Text>
    </Animated.View>
  );
}


