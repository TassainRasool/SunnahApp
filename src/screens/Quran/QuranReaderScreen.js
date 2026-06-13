import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { getSurahAyahs, getTajweedSurahAyahs } from '../../services/quranService';
import { parseTajweedText, TAJWEED_LEGEND } from '../../utils/tajweed';

const AyahRow = memo(function AyahRow({ ayah, colors, showTranslation }) {
  const s = useMemo(() => ({
    block: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
    },
    arabicBase: {
      fontSize: 26,
      lineHeight: 48,
      color: colors.arabic,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    numberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 6,
    },
    numberCircle: {
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
    english: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 24,
    },
    flexOne: { flex: 1 },
  }), [colors]);

  return (
    <View style={s.block}>
      {ayah.segments ? (
        <Text style={s.arabicBase}>
          {ayah.segments.map((seg, i) => (
            <Text key={i} style={{ color: seg.color || colors.arabic }}>
              {seg.text}
            </Text>
          ))}
        </Text>
      ) : (
        <Text style={s.arabicBase}>{ayah.arabic}</Text>
      )}
      <View style={s.numberRow}>
        <View style={s.flexOne} />
        <Text style={s.numberCircle}>{ayah.number}</Text>
      </View>
      {showTranslation && ayah.english ? (
        <Text style={s.english}>{ayah.english}</Text>
      ) : null}
    </View>
  );
});

const BISMARK = 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

export default function QuranReaderScreen({ route, navigation }) {
  const { surah } = route.params;
  const { colors, spacing } = useTheme();
  const [ayahs, setAyahs] = useState([]);
  const [tajweedAyahs, setTajweedAyahs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tajweedLoading, setTajweedLoading] = useState(false);
  const [mode, setMode] = useState('translation');
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSurahAyahs(surah.number);
        if (!cancelled) setAyahs(data);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [surah.number]);

  const tajweedLoadAttempted = useRef(false);

  useEffect(() => {
    if (mode !== 'tajweed') return;
    if (tajweedAyahs || tajweedLoadAttempted.current) return;
    tajweedLoadAttempted.current = true;

    let cancelled = false;
    (async () => {
      setTajweedLoading(true);
      try {
        const raw = await getTajweedSurahAyahs(surah.number);
        if (cancelled) return;
        const parsed = raw.map(a => ({
          number: a.number,
          arabic: a.arabic,
          english: '',
          segments: parseTajweedText(a.tajweed),
        }));
        setTajweedAyahs(parsed);
      } catch {
        setTajweedAyahs([]);
      }
      if (!cancelled) setTajweedLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, surah.number]);

  const data = mode === 'tajweed' && tajweedAyahs ? tajweedAyahs : ayahs;

  const renderItem = useCallback(({ item }) => (
    <AyahRow
      ayah={item}
      colors={colors}
      showTranslation={mode === 'translation'}
    />
  ), [colors, mode]);

  const keyExtractor = useCallback(item => String(item.number), []);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginRight: spacing.sm },
    backIcon: { fontSize: 16 },
    backText: { color: colors.primary, fontSize: 15 },
    surahInfo: {
      flex: 1,
      alignItems: 'center',
      marginLeft: spacing.sm,
    },
    surahName: { fontSize: 16, color: colors.gold, fontWeight: '600' },
    surahMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    bismillahContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
    },
    bismillahText: { fontSize: 28, color: colors.arabic, textAlign: 'center' },
    list: { paddingBottom: spacing.xxl },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centerText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.md },
    legendToggle: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    legendToggleText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
    legendBar: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
    },
    legendSwatch: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 3,
    },
    legendLabel: {
      fontSize: 9,
      color: colors.textMuted,
    },
    modeToggleRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    modeBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    modeBtnActive: {
      backgroundColor: colors.primaryDark,
      borderColor: colors.primary,
    },
    modeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    modeTextActive: {
      color: colors.primary,
    },
  }), [colors, spacing]);

  const toggleMode = useCallback((newMode) => {
    setMode(newMode);
    if (newMode !== 'tajweed') setShowLegend(false);
  }, []);

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

  const showBismillah = surah.number !== 1 && surah.number !== 9;

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
      </View>

      <View style={styles.modeToggleRow}>
        {['translation', 'arabic'].map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => toggleMode(m)}
          >
            <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
              {m === 'translation' ? 'Translation' : m === 'arabic' ? 'Arabic Only' : 'Tajweed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'tajweed' && (
        <>
          <TouchableOpacity
            style={styles.legendToggle}
            onPress={() => setShowLegend(v => !v)}
          >
            <Text style={styles.legendToggleText}>
              {showLegend ? 'Hide Tajweed Legend ▲' : 'Show Tajweed Legend ▼'}
            </Text>
          </TouchableOpacity>
          {showLegend && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.legendBar}
            >
              {TAJWEED_LEGEND.map(item => (
                <View key={item.code} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {mode === 'tajweed' && tajweedLoading && (
        <View style={{ paddingVertical: 8 }}>
          <ActivityIndicator color={colors.gold} size="small" />
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        extraData={mode}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListHeaderComponent={showBismillah ? (
          <View style={styles.bismillahContainer}>
            <Text style={styles.bismillahText}>{BISMARK}</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}
