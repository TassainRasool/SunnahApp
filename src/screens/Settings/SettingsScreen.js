import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings, saveSettings } from '../../services/storage';
import { COLLECTIONS } from '../../services/hadithService';
import { useTheme } from '../../context/ThemeContext';
const PKG_VERSION = require('../../../package.json').version;

export default function SettingsScreen({ navigation }) {
  const { colors, spacing, radius, loadTheme } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 40 },
    pageTitle: { fontSize: 24, fontWeight: '600', color: colors.text, marginBottom: spacing.lg },
    sectionLabel: {
      fontSize: 11,
      color: colors.textDim,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
      marginTop: spacing.lg,
    },
    sectionNote: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 0.5,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
    },
    centeredRow: {
      alignItems: 'center',
      padding: spacing.md,
    },
    rowInfo: { flex: 1, marginRight: spacing.md },
    rowTitle: { fontSize: 14, color: colors.text, fontWeight: '500' },
    rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    rowValue: { fontSize: 13, color: colors.textMuted },
    chevron: { fontSize: 20, color: colors.textMuted },
    divider: { height: 0.5, backgroundColor: colors.border, marginHorizontal: spacing.md },
    collectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    colChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.round,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    colChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primary },
    colChipText: { fontSize: 13, color: colors.textMuted },
    colChipTextActive: { color: colors.primary },
    checkmark: { fontSize: 12, color: colors.primary },
    arabicBismillah: {
      fontSize: 18,
      color: colors.gold,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    madeWith: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    credit: {
      fontSize: 12,
      color: colors.textDim,
      textAlign: 'center',
    },
    footer: {
      marginTop: spacing.xl,
      alignItems: 'center',
      paddingBottom: spacing.lg,
    },
    footerText: {
      fontSize: 13,
      color: colors.textDim,
      fontWeight: '500',
    },
    footerSub: {
      fontSize: 12,
      color: colors.textDim,
      marginTop: 4,
    },
  }), [colors, spacing, radius]);
  const [settings, setSettings] = useState(null);
  const [downloadCount, setDownloadCount] = useState(null);
  const [loadingDownloads, setLoadingDownloads] = useState(true);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const fetchDownloadCount = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('sunnah_download_count');
      if (cached) {
        setDownloadCount(parseInt(cached, 10));
        setLoadingDownloads(false);
      }
      const res = await fetch('https://api.github.com/repos/TassainRasool/SunnahApp/releases/latest');
      if (!res.ok) return;
      const data = await res.json();
      const total = (data.assets || []).reduce((sum, a) => sum + (a.download_count || 0), 0);
      if (total > 0) {
        setDownloadCount(total);
        await AsyncStorage.setItem('sunnah_download_count', String(total));
      }
    } catch { }
    setLoadingDownloads(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoadingDownloads(true);
      fetchDownloadCount();
    }, [])
  );

  const update = async (key, value) => {
    try {
      const current = await getSettings();
      const updated = { ...current, [key]: value };
      setSettings(updated);
      await saveSettings(updated);

      if (key === 'themeMode') {
        loadTheme();
      }
    } catch (err) {
      console.warn('Settings update failed:', err);
      const reloaded = await getSettings();
      setSettings(reloaded);
    }
  };

  const toggleCollection = async (colName) => {
    const current = settings.preferredCollections || [];
    const updated = current.includes(colName)
      ? current.filter(c => c !== colName)
      : [...current, colName];
    if (updated.length === 0) return;
    await update('preferredCollections', updated);
  };

  if (!settings) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Theme */}
        <Text style={styles.sectionLabel}>Theme</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Dark Mode</Text>
              <Text style={styles.rowSub}>{settings.themeMode === 'light' ? 'Off' : 'On'}</Text>
            </View>
            <Switch
              value={settings.themeMode !== 'light'}
              onValueChange={v => update('themeMode', v ? 'dark' : 'light')}
              trackColor={{ false: colors.card, true: colors.primaryDark }}
              thumbColor={settings.themeMode !== 'light' ? colors.primary : colors.textDim}
            />
          </View>
        </View>

        {/* Preferred Collections */}
        <Text style={styles.sectionLabel}>Preferred Collections</Text>
        <Text style={styles.sectionNote}>Shown in your Daily Hadith and Home feed</Text>
        <View style={styles.collectionsGrid}>
          {COLLECTIONS.map(col => {
            const active = settings.preferredCollections?.includes(col.name);
            return (
              <TouchableOpacity
                key={col.name}
                style={[styles.colChip, active && styles.colChipActive]}
                onPress={() => toggleCollection(col.name)}
              >
                <Text style={[styles.colChipText, active && styles.colChipTextActive]}>
                  {col.label}
                </Text>
                {active && <Text style={styles.checkmark}> ✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Offline */}
        <Text style={styles.sectionLabel}>Offline</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('OfflineDownload')}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>⬇️ Download for Offline</Text>
              <Text style={styles.rowSub}>Cache all 5 collections for offline reading</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>App Name</Text>
            <Text style={styles.rowValue}>Sunnah</Text>
          </View>
          <View style={styles.divider} />
          {/* <View style={styles.row}>
          <Text style={styles.rowTitle}>Created by</Text>
          <Text style={styles.rowValue}>Tassain Rasool Malik</Text>
        </View> */}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Purpose</Text>
            <Text style={styles.rowValue}>Free Islamic Reference</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Collections</Text>
            <Text style={styles.rowValue}>5 Major Collections</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Total Downloads</Text>
            {loadingDownloads ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <Text style={[styles.rowValue, { color: colors.gold }]}>
                {downloadCount !== null ? downloadCount.toLocaleString() : 'N/A'}
              </Text>
            )}
          </View>
          {/* <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Version</Text>
            <Text style={styles.rowValue}>{PKG_VERSION}</Text>
          </View> */}
          <View style={styles.divider} />
          <View style={styles.centeredRow}>
            <Text style={styles.arabicBismillah}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
            <Text style={styles.madeWith}>Made with ❤️ for the Muslim Ummah</Text>
            <Text style={styles.credit}>© 2026 Tassain Rasool Malik</Text>
          </View>
        </View>

        {/* <View style={styles.footer}>
        <Text style={styles.footerText}>Sunnah App v1.0.0</Text>
        <Text style={styles.footerSub}>Developed by Tassain Rasool Malik</Text>
      </View> */}

      </ScrollView>
    </SafeAreaView>
  );
}

