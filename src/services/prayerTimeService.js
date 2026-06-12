import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Coordinates,
  PrayerTimes,
  CalculationMethod,
  Madhab,
} from 'adhan';

const ALADHAN_BASE = 'https://api.aladhan.com/v1';
const CACHE_KEY = 'sunnah_prayer_location';

export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const METHODS = [
  { id: 2, label: 'ISNA', offline: 'NorthAmerica' },
  { id: 3, label: 'MWL', offline: 'MuslimWorldLeague' },
  { id: 1, label: 'Karachi', offline: 'Karachi' },
  { id: 4, label: 'Umm al-Qura', offline: 'UmmAlQura' },
  { id: 5, label: 'Egypt', offline: 'Egyptian' },
];

const MADHAB_LABELS = { 0: 'Shafi', 1: 'Hanafi' };

function pad(n) {
  return String(n).padStart(2, '0');
}

function computeTahajjudTime(coords, params) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let pt = new PrayerTimes(coords, today, params);
  let time = new Date(pt.fajr.getTime() - 90 * 60 * 1000);
  if (time <= new Date()) {
    const next = new Date(today);
    next.setDate(next.getDate() + 1);
    pt = new PrayerTimes(coords, next, params);
    time = new Date(pt.fajr.getTime() - 90 * 60 * 1000);
  }
  return time;
}

export async function fetchOnlineTimes({ latitude, longitude, date, methodId = 2 }) {
  const ds = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const res = await axios.get(`${ALADHAN_BASE}/timings/${ds}`, {
    params: { latitude, longitude, method: methodId },
  });
  const d = res.data.data;
  const timings = d.timings;
  const meta = d.meta;
  const list = PRAYER_NAMES.map(name => ({
    name,
    time: timings[name],
  }));
  const tzOffset = (d.date?.timezoneOffset
    ? parseInt(d.date.timezoneOffset, 10)
    : new Date().getTimezoneOffset()) * -1;
  return { list, tzOffset, method: meta?.method?.name || 'Unknown' };
}

export function calculateOfflineTimes({ latitude, longitude, date, methodId = 2, madhab = 0 }) {
  const coords = new Coordinates(latitude, longitude);
  const methodDef = METHODS.find(m => m.id === methodId) || METHODS[0];
  const methodKey = methodDef.offline;
  const params = CalculationMethod[methodKey]();
  params.madhab = madhab === 1 ? Madhab.Hanafi : Madhab.Shafi;
  const pt = new PrayerTimes(coords, date, params);
  const now = new Date();
  const tahajjudTime = computeTahajjudTime(coords, params);
  const list = PRAYER_NAMES.map(name => {
    const key = name.toLowerCase();
    const d = pt[key];
    return { name, date: d };
  });
  let currentPrayer = null;
  let nextPrayer = null;
  let nextTime = null;
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].date <= now) {
      currentPrayer = list[i].name;
      break;
    }
  }
  for (let i = 0; i < list.length; i++) {
    if (list[i].date > now) {
      nextPrayer = list[i].name;
      nextTime = list[i].date;
      break;
    }
  }
  return {
    list,
    tahajjudTime,
    currentPrayer,
    nextPrayer,
    nextTime,
    method: methodDef.label,
    madhab: MADHAB_LABELS[madhab] || 'Shafi',
  };
}

export async function getCachedLocation() {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheLocation(location) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(location));
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    let geo = null;
    try {
      const Geolocation = require('@react-native-community/geolocation');
      geo = Geolocation.default || Geolocation;
    } catch {}
    if (!geo) {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        geo = navigator.geolocation;
      }
    }
    if (!geo) {
      reject(new Error('Geolocation not available. Install @react-native-community/geolocation.'));
      return;
    }
    geo.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}

export function formatTime24to12(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${pad(m)} ${ampm}`;
}

export function formatDateObjTo12(d) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${pad(m)} ${ampm}`;
}

export function getCountdown(nextDate) {
  if (!nextDate) return '';
  const diff = nextDate.getTime() - Date.now();
  if (diff <= 0) return 'Now';
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}
