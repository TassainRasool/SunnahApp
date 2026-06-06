import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBookmarks, removeBookmark } from '../../services/storage';
import HadithCard from '../../components/HadithCard';
import { COLLECTIONS } from '../../services/hadithService';
import { colors, spacing, radius } from '../../utils/theme';

export default function BookmarksScreen({ navigation }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  const loadBookmarks = async () => {
    const data = await getBookmarks();
    setBookmarks(data);
  };

  const handleRemove = (hadith) => {
    Alert.alert(
      'Remove Bookmark',
      'Remove this hadith from your bookmarks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeBookmark(hadith.collectionName, hadith.hadithnumber || hadith.hadithNumber);
            loadBookmarks();
          },
        },
      ]
    );
  };

  const filtered = filter === 'all'
    ? bookmarks
    : bookmarks.filter(b => b.collectionName === filter);

  const usedCollections = [...new Set(bookmarks.map(b => b.collectionName))];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Hadiths</Text>
        <Text style={styles.count}>{bookmarks.length}</Text>
      </View>

      {usedCollections.length > 1 && (
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, filter === 'all' && styles.chipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {usedCollections.map(col => (
            <TouchableOpacity
              key={col}
              style={[styles.chip, filter === col && styles.chipActive]}
              onPress={() => setFilter(col)}
            >
              <Text style={[styles.chipText, filter === col && styles.chipTextActive]}>
                {COLLECTIONS.find(c => c.name === col)?.label || col}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40 }}>🔖</Text>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySub}>Tap the 📌 icon on any hadith to save it here</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => `${item.collectionName}_${item.hadithnumber || item.hadithNumber}_${i}`}
          renderItem={({ item }) => (
            <HadithCard
              hadith={item}
              compact
              showArabic={false}
              onPress={() => navigation.navigate('Reader', { hadith: item })}
              onBookmark={() => handleRemove(item)}
              isBookmarked
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.noFilter}>No saved hadiths from this collection.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: '600', color: colors.text },
  count: {
    backgroundColor: colors.primaryDark,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryDark, borderColor: '#3a5aaa' },
  chipText: { fontSize: 12, color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  list: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, paddingBottom: 60 },
  emptyTitle: { fontSize: 16, color: colors.text, fontWeight: '500' },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  noFilter: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
