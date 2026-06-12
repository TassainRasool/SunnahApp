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
import { useTheme } from '../../context/ThemeContext';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import {
  PRAYER_NAMES,
  METHODS,
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
      marginBottom: spacing.lg,
      padding: spacing.lg,
      paddingBottom: 0,
    },
    headerTitle: { fontSize: 22, color: colors.gold, fontWeight: '600' },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    locationText: { fontSize: 13, color: colors.textMuted, flex: 1 },
    dateRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    dateText: { fontSize: 13, color: colors.textDim },
    nextBanner: {
      backgroundColor: colors.primaryDark,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 0.5,
      borderColor: colors.border,
      alignItems: 'center',
    },
    nextLabel: { fontSize: 12, color: colors.primary, fontWeight: '500', marginBottom: spacing.xs },
    nextPrayer: { fontSize: 22, color: colors.text, fontWeight: '600' },
    nextCountdown: { fontSize: 16, color: colors.gold, fontWeight: '500' },
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
      padding: spacing.lg,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
    },
    prayerRowActive: {
      backgroundColor: colors.primaryDark,
    },
    prayerIcon: { fontSize: 20, marginRight: spacing.md },
    prayerInfo: { flex: 1 },
    prayerName: { fontSize: 16, color: colors.text, fontWeight: '500' },
    prayerNameActive: { color: colors.primary },
    prayerTime: { fontSize: 18, color: colors.gold, fontWeight: '600' },
    prayerTimeActive: { color: colors.primary },
    activeBadge: {
      backgroundColor: colors.successBg,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderWidth: 0.5,
      borderColor: colors.success,
      marginLeft: spacing.sm,
    },
    activeBadgeText: { fontSize: 10, color: colors.success, fontWeight: '500' },
    methodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    methodLabel: { fontSize: 12, color: colors.textDim },
    methodValue: { fontSize: 12, color: colors.textMuted },
    methodBtn: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
    centerText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
    retryBtn: {
      backgroundColor: colors.primaryDark,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      marginTop: spacing.md,
    },
    retryText: { color: colors.primary, fontWeight: '500' },
  }), [colors, spacing, radius]);

  const { isOnline } = useNetworkStatus();
  const [prayers, setPrayers] = useState([]);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [nextTime, setNextTime] = useState(null);
  const [methodId, setMethodId] = useState(2);
  const [madhab, setMadhab] = useState(0);
  const [methodLabel, setMethodLabel] = useState('ISNA');
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
  }, [methodId, madhab, isOnline]);

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

  const changeMethod = () => {
    const idx = METHODS.findIndex(m => m.id === methodId);
    const next = (idx + 1) % METHODS.length;
    setMethodId(METHODS[next].id);
  };

  const toggleMadhab = () => {
    setMadhab(prev => (prev === 0 ? 1 : 0));
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const coordStr = location
    ? `${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E`
    : 'Location unavailable';
  const madhabLabel = madhab === 0 ? 'Shafi' : 'Hanafi';

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

      {/* Location & Date */}
      <View style={styles.locationRow}>
        <Text style={{ fontSize: 14 }}>📍</Text>
        <Text style={styles.locationText}>{coordStr}</Text>
        {locationError && <Text style={[styles.locationText, { color: colors.warning, flex: 0 }]}>⚠️</Text>}
      </View>
      {locationError && location ? (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 11, color: colors.warning }}>{locationError}</Text>
        </View>
      ) : null}
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>{dateStr}</Text>
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
            <Text style={styles.nextLabel}>
              {nextPrayer ? `Next Prayer: ${nextPrayer}` : currentPrayer ? `Current: ${currentPrayer}` : 'Prayer Times'}
            </Text>
            {nextPrayer && nextTime && (
              <Text style={styles.nextCountdown}>{countdown || getCountdown(nextTime)}</Text>
            )}
          </TouchableOpacity>

          {/* Prayer List */}
          <View style={styles.listCard}>
            {prayers.map((p, i) => {
              const isActive = p.name === currentPrayer;
              const isNext = p.name === nextPrayer;
              return (
                <View key={p.name} style={[styles.prayerRow, isActive && styles.prayerRowActive]}>
                  <Text style={styles.prayerIcon}>{PRAYER_ICONS[i]}</Text>
                  <View style={styles.prayerInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.prayerName, isActive && styles.prayerNameActive]}>
                        {p.name}{isNext ? ' ⏰' : ''}
                      </Text>
                      {isActive && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Now</Text>
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

          {/* Method Selector */}
          <View style={styles.methodRow}>
            <TouchableOpacity onPress={changeMethod}>
              <Text style={styles.methodBtn}>{methodLabel}</Text>
            </TouchableOpacity>
            <Text style={styles.methodValue}>·</Text>
            <TouchableOpacity onPress={toggleMadhab}>
              <Text style={styles.methodBtn}>{madhabLabel}</Text>
            </TouchableOpacity>
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
