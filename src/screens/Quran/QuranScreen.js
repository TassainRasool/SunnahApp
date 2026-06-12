import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { getSurahMeta } from '../../services/quranService';

export default function QuranScreen({ navigation }) {
  const { colors, spacing, radius } = useTheme();
  const [surahs, setSurahs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const meta = await getSurahMeta();
        setSurahs(meta);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return surahs;
    const q = search.trim().toLowerCase();
    return surahs.filter(s =>
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      s.name.includes(q)
    );
  }, [search, surahs]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    headerTitle: { fontSize: 24, color: colors.gold, fontWeight: '700' },
    headerDivider: {
      height: 2,
      backgroundColor: colors.gold,
      opacity: 0.25,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderRadius: 1,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    searchIcon: { fontSize: 14, marginRight: spacing.sm },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      padding: 0,
    },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    surahCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
    },
    numberBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primaryDark,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    numberText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    surahInfo: { flex: 1 },
    surahNameRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
    surahArabic: { fontSize: 18, color: colors.arabic, fontWeight: '500' },
    surahEnglish: { fontSize: 14, color: colors.text, fontWeight: '500' },
    surahMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 2,
    },
    surahMetaText: { fontSize: 11, color: colors.textMuted },
    surahRevelation: {
      fontSize: 10,
      color: colors.gold,
      fontWeight: '600',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centerText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.md },
  }), [colors, spacing, radius]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.centerText}>Loading Quran...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📖 Quran</Text>
      </View>
      <View style={styles.headerDivider} />

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search surah (Arabic or English)"
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.number)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.surahCard}
            onPress={() => navigation.navigate('QuranReader', { surah: item })}
            activeOpacity={0.7}
          >
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{item.number}</Text>
            </View>
            <View style={styles.surahInfo}>
              <View style={styles.surahNameRow}>
                <Text style={styles.surahArabic}>{item.name}</Text>
                <Text style={styles.surahEnglish}>{item.englishName}</Text>
              </View>
              <View style={styles.surahMeta}>
                <Text style={styles.surahRevelation}>{item.revelationType}</Text>
                <Text style={styles.surahMetaText}>·</Text>
                <Text style={styles.surahMetaText}>{item.numberOfAyahs} ayahs</Text>
                <Text style={styles.surahMetaText}>·</Text>
                <Text style={styles.surahMetaText}>{item.englishNameTranslation}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
