import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { preCacheAllCollections, clearAllCache, isCollectionCached, COLLECTIONS } from '../../services/hadithService';
import { preCacheQuran, isQuranCached, clearQuranCache } from '../../services/quranService';
import { useTheme } from '../../context/ThemeContext';

export default function OfflineDownloadScreen({ navigation }) {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
    backBtn: { marginBottom: spacing.lg },
    title: { fontSize: 22, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
    sub: { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.lg },
    collectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    colChip: {
      backgroundColor: colors.card,
      borderRadius: radius.round,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    colChipCached: { backgroundColor: colors.successBg, borderColor: colors.success },
    colText: { fontSize: 12, color: colors.textMuted },
    colTextCached: { color: colors.success },
    note: { fontSize: 12, color: colors.textDim, marginBottom: spacing.xl },
    progressSection: { marginBottom: spacing.lg },
    progressBar: {
      height: 6,
      backgroundColor: colors.card,
      borderRadius: radius.round,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    progressFill: { height: 6, backgroundColor: colors.gold, borderRadius: radius.round },
    progressText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
    successBox: {
      backgroundColor: colors.successBg,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 0.5,
      borderColor: colors.success,
      alignItems: 'center',
    },
    successText: { fontSize: 14, color: colors.success, fontWeight: '500' },
    successSub: { fontSize: 12, color: colors.success, marginTop: 4 },
    actions: { gap: spacing.md },
    downloadBtn: {
      backgroundColor: colors.primaryDark,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    downloadBtnText: { color: colors.primary, fontWeight: '500', fontSize: 15 },
    clearBtn: {
      backgroundColor: colors.errorBg,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.error,
    },
    clearBtnText: { color: colors.error, fontWeight: '500' },
  }), [colors, spacing, radius]);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [done, setDone] = useState(false);
  const [cachedCollections, setCachedCollections] = useState([]);
  const [quranCached, setQuranCached] = useState(false);

  useEffect(() => {
    checkCached();
  }, []);

  const checkCached = async () => {
    const cached = [];
    for (const col of COLLECTIONS) {
      const isCached = await isCollectionCached(col.name);
      if (isCached) cached.push(col.name);
    }
    setCachedCollections(cached);
    const qc = await isQuranCached();
    setQuranCached(qc);
    if (cached.length === COLLECTIONS.length && qc) setDone(true);
  };

  const startDownload = async () => {
    setDownloading(true);
    setDone(false);

    await preCacheAllCollections((percent, label) => {
      setProgress(Math.round(percent * 0.6));
      setCurrentItem('Hadith: ' + label);
    });

    await preCacheQuran((percent, name) => {
      setProgress(60 + Math.round(percent * 0.4));
      setCurrentItem('Quran: ' + name);
    });

    setDownloading(false);
    setDone(true);
    await checkCached();
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Offline Data',
      'This will delete all cached hadiths and Quran data. You will need to re-download for offline use.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllCache();
            await clearQuranCache();
            setDone(false);
            setProgress(0);
            setCachedCollections([]);
            setQuranCached(false);
            Alert.alert('Done', 'Offline data cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Offline Mode</Text>
      <Text style={styles.sub}>
        Download hadith collections and the full Quran for offline use
      </Text>

      <Text style={[styles.sub, { fontSize: 13, fontWeight: '600', color: colors.text }]}>
        Hadith Collections
      </Text>
      <View style={styles.collectionsGrid}>
        {COLLECTIONS.map(col => (
          <View key={col.name} style={[
            styles.colChip,
            cachedCollections.includes(col.name) && styles.colChipCached
          ]}>
            <Text style={[
              styles.colText,
              cachedCollections.includes(col.name) && styles.colTextCached
            ]}>
              {cachedCollections.includes(col.name) ? '✓ ' : ''}{col.label}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sub, { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: spacing.sm }]}>
        Quran
      </Text>
      <View style={styles.collectionsGrid}>
        <View style={[styles.colChip, quranCached && styles.colChipCached]}>
          <Text style={[styles.colText, quranCached && styles.colTextCached]}>
            {quranCached ? '✓ ' : ''}Full Quran (114 surahs)
          </Text>
        </View>
      </View>

      <Text style={styles.note}>
        {cachedCollections.length}/{COLLECTIONS.length} collections · {quranCached ? '✓' : '○'} Quran
      </Text>

      {downloading && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress}% — {currentItem}
          </Text>
        </View>
      )}

      {done && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ All data cached successfully!</Text>
          <Text style={styles.successSub}>Hadith + Quran available offline</Text>
        </View>
      )}

      <View style={styles.actions}>
        {!downloading && !done && (
          <TouchableOpacity style={styles.downloadBtn} onPress={startDownload}>
            <Text style={styles.downloadBtnText}>⬇️ Download for Offline</Text>
          </TouchableOpacity>
        )}

        {downloading && (
          <ActivityIndicator color={colors.gold} size="large" />
        )}

        {done && !downloading && (
          <TouchableOpacity style={styles.downloadBtn} onPress={startDownload}>
            <Text style={styles.downloadBtnText}>🔄 Re-download</Text>
          </TouchableOpacity>
        )}

        {(cachedCollections.length > 0 || quranCached) && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>🗑️ Clear Offline Data</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}


