import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, spacing } from '../utils/theme';

export default function OfflineBanner({ isOnline }) {
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

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#3a2a00',
    borderBottomWidth: 0.5,
    borderBottomColor: '#7a5a00',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: { fontSize: 14 },
  text: { fontSize: 12, color: '#d4af7a', fontWeight: '500' },
});
