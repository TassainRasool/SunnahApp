import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { toHijri } from 'hijri-converter';
import {
  COLLECTIONS,
  getDailyHadith,
} from '../../services/hadithService';
import {
  getCachedDailyHadith,
  cacheDailyHadith,
  getRecent,
  getBookmarks,
  addBookmark,
  removeBookmark,
} from '../../services/storage';
import HadithCard from '../../components/HadithCard';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { useTheme } from '../../context/ThemeContext';

const ICONS = ['📖', '📚', '📜', '📗', '📕'];

export default function HomeScreen({ navigation }) {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: 0,
    },
    greeting: { fontSize: 22, color: colors.gold, fontWeight: '600' },
    dateGroup: { alignItems: 'flex-end' },
    date: { fontSize: 13, color: colors.textMuted },
    hijriDate: { fontSize: 12, color: colors.textDim, marginTop: 2 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    searchPlaceholder: { color: colors.textDim, fontSize: 14 },
    sectionLabel: {
      fontSize: 11,
      color: colors.textDim,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.md,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    dailySection: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
    dailyCard: {
      backgroundColor: colors.primaryDark,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    dailyTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    dailyMeta: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    sahihBadge: {
      backgroundColor: colors.successBg,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderWidth: 0.5,
      borderColor: colors.success,
    },
    sahihText: { fontSize: 10, color: colors.success },
    dailyArabic: {
      fontSize: 16,
      color: colors.arabic,
      textAlign: 'right',
      lineHeight: 26,
      marginBottom: spacing.sm,
    },
    dailyBody: { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: spacing.sm },
    readMore: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    bookGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    bookCard: {
      width: '46%',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 0.5,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    bookIcon: { fontSize: 28 },
    bookLabel: { fontSize: 16, color: colors.text, fontWeight: '600' },
    bookFull: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
    errorText: { color: colors.textMuted, textAlign: 'center', marginVertical: spacing.lg },
  }), [colors, spacing, radius]);
  const [dailyHadith, setDailyHadith] = useState(null);
  const [recentHadiths, setRecentHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarks, setBookmarks] = useState({});
  const { isOnline } = useNetworkStatus();

  const loadDailyHadith = async () => {
    let hadith = await getDailyHadith();
    if (hadith) {
      await cacheDailyHadith(hadith);
    } else {
      hadith = await getCachedDailyHadith();
    }
    setDailyHadith(hadith);
  };

  const loadRecent = async () => {
    const recent = await getRecent();
    setRecentHadiths(recent.slice(0, 5));
  };

  const loadBookmarkState = async () => {
    const allBookmarks = await getBookmarks();
    const map = {};
    allBookmarks.forEach(b => {
      const key = `${b.collectionName}_${b.hadithnumber}`;
      map[key] = true;
    });
    setBookmarks(map);
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([
      loadDailyHadith(),
      loadRecent(),
      loadBookmarkState(),
    ]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { loadRecent(); loadBookmarkState(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleBookmark = async (hadith) => {
    const key = `${hadith.collectionName}_${hadith.hadithnumber}`;
    if (bookmarks[key]) {
      await removeBookmark(hadith.collectionName, hadith.hadithnumber);
      setBookmarks(prev => ({ ...prev, [key]: false }));
    } else {
      await addBookmark(hadith);
      setBookmarks(prev => ({ ...prev, [key]: true }));
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hijri = toHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const hijriStr = `${hijri.hd} ${['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'][hijri.hm - 1]} ${hijri.hy} AH`;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>السلام عليكم</Text>
        <View style={styles.dateGroup}>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.hijriDate}>{hijriStr}</Text>
        </View>
      </View>

      {/* Search */}
      <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search', { query: '' })}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search hadiths...</Text>
      </TouchableOpacity>

      {/* Daily Hadith */}
      <View style={styles.dailySection}>
        <Text style={styles.sectionLabel}>Hadith of the Day</Text>
        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
        ) : dailyHadith ? (
          <TouchableOpacity
            style={styles.dailyCard}
            onPress={() => navigation.navigate('Reader', { hadith: dailyHadith })}
            activeOpacity={0.85}
          >
            <View style={styles.dailyTop}>
              <Text style={styles.dailyMeta}>
                {dailyHadith.collectionName} · #{dailyHadith.hadithnumber}
              </Text>
              {dailyHadith.grades?.[0]?.grade ? (
                <View style={styles.sahihBadge}>
                  <Text style={styles.sahihText}>{dailyHadith.grades[0].grade}</Text>
                </View>
              ) : null}
            </View>
            {dailyHadith.arabic ? (
              <Text style={styles.dailyArabic} numberOfLines={2}>{dailyHadith.arabic}</Text>
            ) : null}
            <Text style={styles.dailyBody} numberOfLines={3}>{dailyHadith.text}</Text>
            <Text style={styles.readMore}>Read full hadith →</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.errorText}>Could not load today's hadith. Pull to refresh.</Text>
        )}
      </View>

      {/* Book Cards */}
      <Text style={styles.sectionLabel}>Browse Collections</Text>
      <View style={styles.bookGrid}>
        {/* Quran Card */}
        <TouchableOpacity
          style={[styles.bookCard, { borderColor: colors.gold }]}
          onPress={() => navigation.navigate('Quran', { screen: 'QuranMain' })}
          activeOpacity={0.8}
        >
          <Text style={styles.bookIcon}>🕌</Text>
          <Text style={styles.bookLabel}>Quran</Text>
          <Text style={styles.bookFull}>The Noble Quran</Text>
        </TouchableOpacity>
        {COLLECTIONS.map((col, i) => (
          <TouchableOpacity
            key={col.name}
            style={[styles.bookCard, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('ReaderList', { collection: col.name })}
            activeOpacity={0.8}
          >
            <Text style={styles.bookIcon}>{ICONS[i % ICONS.length]}</Text>
            <Text style={styles.bookLabel}>{col.label}</Text>
            <Text style={styles.bookFull}>{col.fullName}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent */}
      {recentHadiths.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Recently Viewed</Text>
          {recentHadiths.map((hadith, i) => (
            <HadithCard
              key={i}
              hadith={hadith}
              compact
              showArabic={false}
              onPress={() => navigation.navigate('Reader', { hadith })}
            />
          ))}
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}


