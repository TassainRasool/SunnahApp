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
      s.name.includes(q)
    );
  }, [search, surahs]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    headerTitle: { fontSize: 22, color: colors.gold, fontWeight: '700' },
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    searchIcon: { fontSize: 14, marginRight: spacing.sm, color: colors.textMuted },
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
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primaryDark,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    numberText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    surahInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
    arabicName: { fontSize: 18, color: colors.arabic, fontWeight: '500' },
    transliteration: { fontSize: 14, color: colors.text, fontWeight: '500' },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 2,
    },
    metaText: { fontSize: 11, color: colors.textMuted },
    typeBadge: {
      fontSize: 10,
      color: colors.gold,
      fontWeight: '600',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centerText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.md },
  }), [colors, spacing, radius]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={s.container}>
        <View style={s.center}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={s.centerText}>Loading Quran...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Quran</Text>
      </View>
      <View style={s.headerDivider} />

      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search surah (Arabic or English)"
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.number)}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.surahCard}
            onPress={() => navigation.navigate('QuranReader', { surah: item })}
            activeOpacity={0.7}
          >
            <View style={s.numberBadge}>
              <Text style={s.numberText}>{item.number}</Text>
            </View>
            <View style={s.surahInfo}>
              <View style={s.nameRow}>
                <Text style={s.arabicName}>{item.name}</Text>
                <Text style={s.transliteration}>{item.englishName}</Text>
              </View>
              <View style={s.metaRow}>
                <Text style={s.typeBadge}>{item.revelationType}</Text>
                <Text style={s.metaText}>·</Text>
                <Text style={s.metaText}>{item.numberOfAyahs} ayahs</Text>
                <Text style={s.metaText}>·</Text>
                <Text style={s.metaText}>{item.englishNameTranslation}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
