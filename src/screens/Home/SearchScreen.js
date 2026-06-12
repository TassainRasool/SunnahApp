import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { COLLECTIONS, searchHadiths } from '../../services/hadithService';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import HadithCard from '../../components/HadithCard';
import { useTheme } from '../../context/ThemeContext';

export default function SearchScreen({ route, navigation }) {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    offlineBadge: {
      backgroundColor: colors.warningBg,
      padding: spacing.sm,
      alignItems: 'center',
      borderBottomWidth: 0.5,
      borderBottomColor: colors.warning,
    },
    offlineText: { fontSize: 12, color: colors.warning, fontWeight: '500' },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      paddingTop: spacing.xl,
      gap: spacing.sm,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    input: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.sm,
      padding: spacing.sm,
      paddingHorizontal: spacing.md,
      color: colors.text,
      fontSize: 15,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    chipContainer: { paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    chip: {
      backgroundColor: colors.card,
      borderRadius: radius.round,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primary },
    chipText: { fontSize: 12, color: colors.textMuted },
    chipTextActive: { color: colors.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
    loadingText: { color: colors.textMuted, marginTop: spacing.sm },
    noResults: { fontSize: 16, color: colors.text, fontWeight: '500', textAlign: 'center' },
    noResultsSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
    hint: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
    hintSub: { fontSize: 13, color: colors.textDim, textAlign: 'center' },
    list: { padding: spacing.lg },
    resultCount: { fontSize: 12, color: colors.textDim, marginBottom: spacing.md },
  }), [colors, spacing, radius]);
  const initialQuery = route.params?.query || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const inputRef = useRef(null);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
    if (initialQuery) doSearch(initialQuery, null);
  }, []);

  const doSearch = async (q, col) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    Keyboard.dismiss();
    try {
      const data = await searchHadiths(q.trim(), col);
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionFilter = (col) => {
    const next = selectedCollection === col ? null : col;
    setSelectedCollection(next);
    if (query) doSearch(query, next);
  };

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>📵 Offline — searching cached hadiths</Text>
        </View>
      )}

      {/* Search input */}
      <View style={styles.searchRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search hadiths..."
          placeholderTextColor={colors.textDim}
          returnKeyType="search"
          onSubmitEditing={() => doSearch(query, selectedCollection)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Text style={{ color: colors.textMuted, fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Collection filter chips */}
      <View style={styles.chipContainer}>
        <FlatList
          horizontal
          data={COLLECTIONS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={c => c.name}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCollection === item.name && styles.chipActive]}
              onPress={() => handleCollectionFilter(item.name)}
            >
              <Text style={[styles.chipText, selectedCollection === item.name && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.loadingText}>Searching hadiths...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 32 }}>🔍</Text>
          <Text style={styles.noResults}>No hadiths found for "{query}"</Text>
          <Text style={styles.noResultsSub}>
            {isOnline ? 'Try different keywords' : 'Download collections first for offline search'}
          </Text>
        </View>
      ) : !searched ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>📿</Text>
          <Text style={styles.hint}>Search by keyword, narrator, or topic</Text>
          <Text style={styles.hintSub}>e.g. "prayer", "kindness", "intention"</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, i) => `${item.collectionName}_${item.hadithnumber}_${i}`}
          renderItem={({ item }) => (
            <HadithCard
              hadith={item}
              compact
              showArabic={false}
              onPress={() => navigation.navigate('Reader', { hadith: item })}
            />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {results.length} results for "{query}"
              {!isOnline ? ' (cached)' : ''}
            </Text>
          }
        />
      )}
    </View>
  );
}


