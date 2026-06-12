import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { getSurahAyahs } from '../../services/quranService';

export default function QuranReaderScreen({ route, navigation }) {
  const { surah } = route.params;
  const { colors, spacing } = useTheme();
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSurahAyahs(surah.number);
        setAyahs(data);
      } catch {}
      setLoading(false);
    })();
  }, [surah.number]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    backIcon: { fontSize: 16 },
    backText: { color: colors.primary, fontSize: 15 },
    spacer: { width: 50 },
    scrollInner: { paddingBottom: spacing.xxl },
    surahInfo: { alignItems: 'center' },
    surahName: { fontSize: 16, color: colors.gold, fontWeight: '600' },
    surahMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    bismillahContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
      marginBottom: spacing.md,
    },
    bismillahText: { fontSize: 28, color: colors.arabic, textAlign: 'center' },
    ayahBlock: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
    },
    ayahArabic: {
      fontSize: 26,
      color: colors.arabic,
      textAlign: 'right',
      lineHeight: 48,
      writingDirection: 'rtl',
    },
    ayahNumberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: spacing.sm,
    },
    ayahNumber: {
      fontSize: 12,
      color: colors.gold,
      fontWeight: '600',
      backgroundColor: colors.primaryDark,
      borderRadius: 12,
      width: 24,
      height: 24,
      textAlign: 'center',
      lineHeight: 24,
      overflow: 'hidden',
    },
    ayahEnglish: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 24,
    },
    flexOne: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centerText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.md },
  }), [colors, spacing]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.centerText}>Loading surah...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.surahInfo}>
          <Text style={styles.surahName}>{surah.englishName}</Text>
          <Text style={styles.surahMeta}>
            {surah.revelationType} · {surah.numberOfAyahs} ayahs
          </Text>
        </View>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollInner}>
        {surah.number !== 9 && (
          <View style={styles.bismillahContainer}>
            <Text style={styles.bismillahText}>بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
          </View>
        )}

        {ayahs.map(ayah => (
          <View key={ayah.number} style={styles.ayahBlock}>
            <Text style={styles.ayahArabic}>{ayah.arabic}</Text>
            <View style={styles.ayahNumberRow}>
              <View style={styles.flexOne} />
              <Text style={styles.ayahNumber}>{ayah.number}</Text>
            </View>
            <Text style={styles.ayahEnglish}>{ayah.english}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
