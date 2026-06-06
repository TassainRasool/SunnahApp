import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getAllHadiths, COLLECTIONS } from '../../services/hadithService';
import { addBookmark, removeBookmark } from '../../services/storage';
import HadithCard from '../../components/HadithCard';
import { colors, spacing } from '../../utils/theme';

export default function ReaderListScreen({ route, navigation }) {
  const { collection = 'bukhari' } = route.params || {};
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedMap, setBookmarkedMap] = useState({});

  const col = COLLECTIONS.find(c => c.name === collection);

  useEffect(() => {
    navigation.setOptions({ title: col?.fullName || collection });
    loadHadiths();
  }, [collection]);

  const loadHadiths = async () => {
    setLoading(true);
    try {
      const data = await getAllHadiths(collection);
      setHadiths(data);
    } catch {
      setHadiths([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (hadith) => {
    const key = `${hadith.collectionName}_${hadith.hadithnumber}`;
    if (bookmarkedMap[key]) {
      await removeBookmark(hadith.collectionName, hadith.hadithnumber);
      setBookmarkedMap(prev => ({ ...prev, [key]: false }));
    } else {
      await addBookmark(hadith);
      setBookmarkedMap(prev => ({ ...prev, [key]: true }));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.loadingText}>Loading hadiths...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={hadiths}
        keyExtractor={(item, i) => `${item.hadithnumber || i}`}
        renderItem={({ item }) => (
          <HadithCard
            hadith={item}
            compact
            showArabic={false}
            onPress={() => navigation.navigate('Reader', { hadith: item })}
            onBookmark={() => handleBookmark(item)}
            isBookmarked={!!bookmarkedMap[`${item.collectionName}_${item.hadithnumber}`]}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.count}>{hadiths.length} hadiths</Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No hadiths found. Check your internet connection.</Text>
        }
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, gap: 12 },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  list: { padding: spacing.lg },
  count: { fontSize: 12, color: colors.textDim, marginBottom: spacing.lg },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});