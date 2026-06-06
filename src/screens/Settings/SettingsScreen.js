import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getSettings, saveSettings } from '../../services/storage';
import {
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelDailyNotification,
  createNotificationChannel,
} from '../../services/notifications';
import { COLLECTIONS } from '../../services/hadithService';
import { colors, spacing, radius } from '../../utils/theme';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
    createNotificationChannel();
  }, []);

  const update = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);

    if (key === 'notificationsEnabled') {
      if (value) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Please enable notifications for this app in your device settings.');
          const reverted = { ...updated, notificationsEnabled: false };
          setSettings(reverted);
          await saveSettings(reverted);
          return;
        }
        await scheduleDailyNotification(updated.notificationTime);
      } else {
        await cancelDailyNotification();
      }
    }

    if (key === 'notificationTime' && settings?.notificationsEnabled) {
      await scheduleDailyNotification(value);
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

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const h = selectedDate.getHours().toString().padStart(2, '0');
      const m = selectedDate.getMinutes().toString().padStart(2, '0');
      update('notificationTime', `${h}:${m}`);
    }
  };

  const timeToDate = (timeStr = '06:00') => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const formatTime = (timeStr = '06:00') => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  if (!settings) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Settings</Text>

      {/* Daily Notifications */}
      <Text style={styles.sectionLabel}>Daily Hadith Reminder</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Enable Reminders</Text>
            <Text style={styles.rowSub}>Get a daily hadith notification</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={v => update('notificationsEnabled', v)}
            trackColor={{ false: colors.card, true: colors.primaryDark }}
            thumbColor={settings.notificationsEnabled ? colors.primary : colors.textDim}
          />
        </View>

        {settings.notificationsEnabled && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => setShowTimePicker(true)}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Reminder Time</Text>
                <Text style={styles.rowSub}>{formatTime(settings.notificationTime)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={timeToDate(settings.notificationTime)}
          mode="time"
          is24Hour={false}
          onChange={onTimeChange}
        />
      )}

      {/* Display Preferences */}
      <Text style={styles.sectionLabel}>Display</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Show Arabic Text</Text>
            <Text style={styles.rowSub}>Display original Arabic alongside translation</Text>
          </View>
          <Switch
            value={settings.showArabic}
            onValueChange={v => update('showArabic', v)}
            trackColor={{ false: colors.card, true: colors.primaryDark }}
            thumbColor={settings.showArabic ? colors.primary : colors.textDim}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Show Grade Badge</Text>
            <Text style={styles.rowSub}>Sahih, Hasan, Da'if indicator</Text>
          </View>
          <Switch
            value={settings.showGrade}
            onValueChange={v => update('showGrade', v)}
            trackColor={{ false: colors.card, true: colors.primaryDark }}
            thumbColor={settings.showGrade ? colors.primary : colors.textDim}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Show Transliteration</Text>
            <Text style={styles.rowSub}>Romanized Arabic pronunciation</Text>
          </View>
          <Switch
            value={settings.showTransliteration}
            onValueChange={v => update('showTransliteration', v)}
            trackColor={{ false: colors.card, true: colors.primaryDark }}
            thumbColor={settings.showTransliteration ? colors.primary : colors.textDim}
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
          <Text style={styles.rowTitle}>Data Source</Text>
          <Text style={styles.rowValue}>fawazahmed0/hadith-api</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  colChipActive: { backgroundColor: colors.primaryDark, borderColor: '#3a5aaa' },
  colChipText: { fontSize: 13, color: colors.textMuted },
  colChipTextActive: { color: colors.primary },
  checkmark: { fontSize: 12, color: colors.primary },
});
