import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';

const GOLD = '#D4AF37';
const NAVY = '#0e0e1a';
const GOLD_DIM = 'rgba(212, 175, 55, 0.4)';

function usePulse(delay) {
  const val = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return val;
}

function LoadingDots() {
  const d1 = usePulse(0);
  const d2 = usePulse(200);
  const d3 = usePulse(400);
  return (
    <View style={styles.dotsRow}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.Text key={i} style={[styles.dot, { opacity: d }]}>.</Animated.Text>
      ))}
    </View>
  );
}

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.inner}>
        <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
        <Text style={styles.ornament}>━━━ ❁ ━━━</Text>

        <View style={styles.logoOuter}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>سنة</Text>
          </View>
        </View>

        <Text style={styles.diamond}>✦</Text>
        <Text style={styles.appNameArabic}>سنة</Text>
        <Text style={styles.appNameEnglish}>SUNNAH</Text>
        <Text style={styles.tagline}>Hadith of the Prophet ﷺ</Text>

        <LoadingDots />
      </View>

      <Text style={styles.footer}>Developed by Tassain Rasool Malik</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  inner: {
    alignItems: 'center',
  },
  bismillah: {
    fontSize: 22,
    color: GOLD,
    textAlign: 'center',
    lineHeight: 40,
    fontFamily: 'serif',
    marginBottom: 12,
  },
  ornament: {
    fontSize: 14,
    color: GOLD_DIM,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 28,
  },
  logoOuter: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  logoText: {
    fontSize: 32,
    color: GOLD,
    fontFamily: 'serif',
  },
  diamond: {
    fontSize: 22,
    color: GOLD,
    marginBottom: 12,
  },
  appNameArabic: {
    fontSize: 48,
    color: GOLD,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 4,
  },
  appNameEnglish: {
    fontSize: 28,
    color: GOLD,
    letterSpacing: 8,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 14,
    color: GOLD_DIM,
    textAlign: 'center',
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 2,
  },
  dot: {
    fontSize: 32,
    color: GOLD,
    lineHeight: 20,
  },
  footer: {
    fontSize: 11,
    color: 'rgba(212, 175, 55, 0.35)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
