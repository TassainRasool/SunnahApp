import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  PermissionsAndroid,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { toHijri } from 'hijri-converter';
import { useTheme } from '../../context/ThemeContext';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import {
  PRAYER_NAMES,
  fetchOnlineTimes,
  calculateOfflineTimes,
  getCurrentPosition,
  getCachedLocation,
  cacheLocation,
  formatTime24to12,
  formatDateObjTo12,
  getCountdown,
} from '../../services/prayerTimeService';

const PRAYER_ICONS = ['🌅', '☀️', '🌤️', '🌇', '🌙'];

async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        { title: 'Location Permission', message: 'Sunnah needs your location to calculate prayer times', buttonPositive: 'Grant', buttonNegative: 'Deny' },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  return true;
}

export default function PrayerTimesScreen() {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    headerTitle: { fontSize: 24, color: colors.gold, fontWeight: '700' },
    headerDivider: {
      height: 2,
      backgroundColor: colors.gold,
      opacity: 0.25,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderRadius: 1,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    dateText: { fontSize: 13, color: colors.textDim, fontWeight: '500' },
    hijriDate: { fontSize: 13, color: colors.textMuted },
    nextBanner: {
      backgroundColor: colors.primaryDark,
      borderRadius: radius.lg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.goldDark,
      overflow: 'hidden',
    },
    nextAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: colors.gold,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    nextContent: {
      padding: spacing.lg,
      paddingLeft: spacing.lg + 12,
      alignItems: 'center',
    },
    nextLabel: { fontSize: 10, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
    nextPrayerName: { fontSize: 26, color: colors.text, fontWeight: '700', marginTop: spacing.xs },
    nextCountdown: { fontSize: 20, color: colors.gold, fontWeight: '600', marginTop: spacing.sm },
    tahajjudCard: {
      borderRadius: radius.lg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.goldDark,
      overflow: 'hidden',
    },
    tahajjudBody: {
      backgroundColor: colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
    },
    tahajjudIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primaryDark,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    tahajjudIcon: { fontSize: 18 },
    tahajjudInfo: { flex: 1 },
    tahajjudName: { fontSize: 15, color: colors.gold, fontWeight: '600' },
    tahajjudSub: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
    tahajjudTime: { fontSize: 17, color: colors.gold, fontWeight: '700' },
    listCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      marginHorizontal: spacing.lg,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
    },
    prayerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
    },
    prayerRowActive: {
      backgroundColor: colors.primaryDark,
    },
    prayerActiveAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: colors.gold,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    prayerIcon: { fontSize: 18, width: 30, textAlign: 'center', marginRight: spacing.md },
    prayerInfo: { flex: 1 },
    prayerNameRow: { flexDirection: 'row', alignItems: 'center' },
    prayerName: { fontSize: 16, color: colors.text, fontWeight: '500' },
    prayerNameActive: { color: colors.primary },
    prayerTime: { fontSize: 17, color: colors.gold, fontWeight: '600' },
    prayerTimeActive: { color: colors.primary },
    activeBadge: {
      backgroundColor: colors.successBg,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 1,
      borderWidth: 0.5,
      borderColor: colors.success,
      marginLeft: spacing.sm,
    },
    activeBadgeText: { fontSize: 10, color: colors.success, fontWeight: '600' },
    nextBadge: {
      backgroundColor: colors.primaryDark,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 1,
      marginLeft: spacing.sm,
    },
    nextBadgeText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
    methodRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'center',
      gap: spacing.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    methodCard: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
    },
    methodCardPrimary: { borderColor: colors.primary },
    methodCardLabel: {
      fontSize: 9,
      color: colors.textDim,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    methodCardValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    methodCardValuePrimary: { color: colors.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
    centerText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
    retryBtn: {
      backgroundColor: colors.card,
      borderRadius: radius.round,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.xl,
      borderWidth: 0.5,
      borderColor: colors.gold,
      marginTop: spacing.md,
    },
    retryText: { color: colors.gold, fontWeight: '500' },
  }), [colors, spacing, radius]);

  const { isOnline } = useNetworkStatus();
  const [prayers, setPrayers] = useState([]);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [nextTime, setNextTime] = useState(null);
  const [tahajjudTime, setTahajjudTime] = useState(null);
  const methodId = 4;
  const madhab = 0;
  const [methodLabel, setMethodLabel] = useState('Umm al-Qura');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef(null);
  const prayerDatesRef = useRef({});
  const triggeredRef = useRef(new Set());

  const buildPrayerDateMap = (loc, now) => {
    const adhanResult = calculateOfflineTimes({
      latitude: loc.latitude,
      longitude: loc.longitude,
      date: now,
      methodId,
      madhab,
    });
    const map = {};
    adhanResult.list.forEach(p => { map[p.name] = p.date; });
    prayerDatesRef.current = map;
  };

  const loadLocation = async () => {
    const cached = await getCachedLocation();
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      try {
        const pos = await getCurrentPosition();
        const loc = { latitude: pos.latitude, longitude: pos.longitude };
        setLocation(loc);
        setLocationError(null);
        await cacheLocation(loc);
        return loc;
      } catch (err) {
        if (cached) {
          setLocation(cached);
          setLocationError('Using cached location — GPS failed');
          return cached;
        }
        setLocationError(err.message || 'Unable to get location');
        return null;
      }
    }
    if (cached) {
      setLocation(cached);
      setLocationError('Using cached location — permission denied');
      return cached;
    }
    setLocationError('Location permission denied. Enable GPS in Settings → Apps → Sunnah → Permissions.');
    return null;
  };

  const loadPrayerTimes = async (loc) => {
    if (!loc) return;
    try {
      const now = new Date();
      if (isOnline) {
        const result = await fetchOnlineTimes({
          latitude: loc.latitude,
          longitude: loc.longitude,
          date: now,
          methodId,
        });
        setPrayers(result.list.map(p => ({ ...p, time12: formatTime24to12(p.time) })));
        setMethodLabel(result.method);
        buildPrayerDateMap(loc, now);
        const adhanResult = calculateOfflineTimes({
          latitude: loc.latitude,
          longitude: loc.longitude,
          date: now,
          methodId,
          madhab,
        });
        setCurrentPrayer(adhanResult.currentPrayer);
        setNextPrayer(adhanResult.nextPrayer);
        setNextTime(adhanResult.nextTime);
        setTahajjudTime(adhanResult.tahajjudTime);
      } else {
        buildPrayerDateMap(loc, now);
        const result = calculateOfflineTimes({
          latitude: loc.latitude,
          longitude: loc.longitude,
          date: now,
          methodId,
          madhab,
        });
        setPrayers(result.list.map(p => ({ name: p.name, time12: formatDateObjTo12(p.date) })));
        setMethodLabel(result.method);
        setCurrentPrayer(result.currentPrayer);
        setNextPrayer(result.nextPrayer);
        setNextTime(result.nextTime);
        setTahajjudTime(result.tahajjudTime);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load prayer times');
    }
  };

  const load = async () => {
    setLoading(true);
    const loc = await loadLocation();
    if (loc) await loadPrayerTimes(loc);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const loc = await loadLocation();
    if (loc) await loadPrayerTimes(loc);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (location && isOnline !== undefined) {
      loadPrayerTimes(location);
    }
  }, [isOnline]);

  useFocusEffect(useCallback(() => {
    triggeredRef.current = new Set();
    timerRef.current = setInterval(() => {
      const now = new Date();
      if (nextTime) {
        setCountdown(getCountdown(nextTime));
      }
      Object.entries(prayerDatesRef.current).forEach(([name, date]) => {
        const diff = now.getTime() - date.getTime();
        if (diff >= 0 && diff < 30000 && !triggeredRef.current.has(name)) {
          triggeredRef.current.add(name);
          Vibration.vibrate([0, 500, 200, 500]);
          Alert.alert('🕌 Prayer Time', `${name} has begun`);
        }
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [nextTime]));

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
        <Text style={styles.headerTitle}>🕌 Prayer Times</Text>
      </View>
      <View style={styles.headerDivider} />

      {/* Date */}
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>{dateStr}</Text>
        <Text style={{ fontSize: 11, color: colors.textDim }}>|</Text>
        <Text style={styles.hijriDate}>{hijriStr}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.centerText}>Getting your location & prayer times...</Text>
        </View>
      ) : locationError && !location ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 32 }}>📍</Text>
          <Text style={styles.centerText}>Unable to get your location.</Text>
          <Text style={[styles.centerText, { fontSize: 12 }]}>{locationError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : prayers.length > 0 ? (
        <>
          {/* Next Prayer Banner */}
          <TouchableOpacity style={styles.nextBanner} activeOpacity={1}>
            <View style={styles.nextAccent} />
            <View style={styles.nextContent}>
              <Text style={styles.nextLabel}>
                {nextPrayer ? 'Up Next' : currentPrayer ? 'Current Prayer' : 'Prayer Times'}
              </Text>
              <Text style={styles.nextPrayerName}>
                {nextPrayer || currentPrayer || '—'}
              </Text>
              {nextPrayer && nextTime && (
                <Text style={styles.nextCountdown}>{countdown || getCountdown(nextTime)}</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Tahajjud Card */}
          {tahajjudTime && (
            <View style={styles.tahajjudCard}>
              <View style={styles.tahajjudBody}>
                <View style={styles.tahajjudIconWrap}>
                  <Text style={styles.tahajjudIcon}>🌙</Text>
                </View>
                <View style={styles.tahajjudInfo}>
                  <Text style={styles.tahajjudName}>Tahajjud</Text>
                  <Text style={styles.tahajjudSub}>Last third of the night</Text>
                </View>
                <Text style={styles.tahajjudTime}>{formatDateObjTo12(tahajjudTime)}</Text>
              </View>
            </View>
          )}

          {/* Prayer List */}
          <View style={styles.listCard}>
            {prayers.map((p, i) => {
              const isActive = p.name === currentPrayer;
              const isNext = p.name === nextPrayer;
              return (
                <View
                  key={p.name}
                  style={[
                    styles.prayerRow,
                    isActive && styles.prayerRowActive,
                    i === prayers.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  {isActive && <View style={styles.prayerActiveAccent} />}
                  <Text style={styles.prayerIcon}>{PRAYER_ICONS[i]}</Text>
                  <View style={styles.prayerInfo}>
                    <View style={styles.prayerNameRow}>
                      <Text style={[styles.prayerName, isActive && styles.prayerNameActive]}>
                        {p.name}
                      </Text>
                      {isActive && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Now</Text>
                        </View>
                      )}
                      {isNext && !isActive && (
                        <View style={styles.nextBadge}>
                          <Text style={styles.nextBadgeText}>⏰</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.prayerTime, isActive && styles.prayerTimeActive]}>
                    {p.time12}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Method label */}
          <View style={styles.methodRow}>
            <View style={[styles.methodCard, styles.methodCardPrimary]}>
              <Text style={styles.methodCardLabel}>Method</Text>
              <Text style={[styles.methodCardValue, styles.methodCardValuePrimary]}>{methodLabel}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.center}>
          <Text style={[styles.centerText, { fontSize: 12 }]}>No prayer times available.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}
