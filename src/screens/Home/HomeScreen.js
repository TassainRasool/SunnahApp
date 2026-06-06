import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  COLLECTIONS,
  getDailyHadith,
  getHadithsBySection,
} from '../../services/hadithService';
import {
  getCachedDailyHadith,
  cacheDailyHadith,
  getRecent,
  addBookmark,
  removeBookmark,
} from '../../services/storage';
import HadithCard from '../../components/HadithCard';
import OfflineBanner from '../../components/OfflineBanner';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { colors, spacing, radius } from '../../utils/theme';

export default function HomeScreen({ navigation }) {
  const [dailyHadith, setDailyHadith] = useState(null);
  const [recentHadiths, setRecentHadiths] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('bukhari');
  const [collectionHadiths, setCollectionHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarks, setBookmarks] = useState({});
  const { isOnline } = useNetworkStatus();

  const loadDailyHadith = async () => {
    let hadith = await getCachedDailyHadith();
    if (!hadith) {
      hadith = await getDailyHadith();
      if (hadith) await cacheDailyHadith(hadith);
    }
    setDailyHadith(hadith);
  };

  const loadCollectionHadiths = async (collection) => {
    try {
      const data = await getHadithsBySection(collection, 1);
      setCollectionHadiths(data || []);
    } catch {
      setCollectionHadiths([]);
    }
  };

  const loadRecent = async () => {
    const recent = await getRecent();
    setRecentHadiths(recent.slice(0, 5));
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([
      loadDailyHadith(),
      loadCollectionHadiths(selectedCollection),
      loadRecent(),
    ]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { loadRecent(); }, []));
  useEffect(() => { loadCollectionHadiths(selectedCollection); }, [selectedCollection]);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <OfflineBanner isOnline={isOnline} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>السلام عليكم</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
        </TouchableOpacity>
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

      {/* Collection Chips */}
      <Text style={styles.sectionLabel}>Browse Collections</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {COLLECTIONS.map(col => (
          <TouchableOpacity
            key={col.name}
            style={[styles.chip, selectedCollection === col.name && styles.chipActive]}
            onPress={() => setSelectedCollection(col.name)}
          >
            <Text style={[styles.chipText, selectedCollection === col.name && styles.chipTextActive]}>
              {col.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Collection Hadiths */}
      <View style={styles.collectionSection}>
        {collectionHadiths.slice(0, 3).map((hadith, i) => (
          <HadithCard
            key={i}
            hadith={hadith}
            compact
            showArabic={false}
            onPress={() => navigation.navigate('Reader', { hadith })}
            onBookmark={() => handleBookmark(hadith)}
            isBookmarked={!!bookmarks[`${hadith.collectionName}_${hadith.hadithnumber}`]}
          />
        ))}
        {collectionHadiths.length > 0 && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate('ReaderList', { collection: selectedCollection })}
          >
            <Text style={styles.viewAllText}>
              View all in {COLLECTIONS.find(c => c.name === selectedCollection)?.label} →
            </Text>
          </TouchableOpacity>
        )}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 0,
  },
  greeting: { fontSize: 22, color: colors.gold, fontWeight: '600' },
  date: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  bellBtn: { padding: spacing.sm },
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
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dailySection: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
  dailyCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 0.5,
    borderColor: '#3a5aaa',
  },
  dailyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dailyMeta: { fontSize: 12, color: '#7aaaf0', fontWeight: '500' },
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
  dailyBody: { fontSize: 14, color: '#c8c8e0', lineHeight: 22, marginBottom: spacing.sm },
  readMore: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  chipRow: { marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryDark, borderColor: '#3a5aaa' },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  collectionSection: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
  viewAllBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  viewAllText: { color: colors.primary, fontSize: 13 },
  errorText: { color: colors.textMuted, textAlign: 'center', marginVertical: spacing.lg },
});
