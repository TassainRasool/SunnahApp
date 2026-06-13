import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stripTajweedMarkers } from '../utils/tajweed';

const QURAN_URL = 'https://raw.githubusercontent.com/TassainRasool/hadith-data/refs/heads/main/quran_en.json';
const CACHE_KEY = 'sunnah_quran';
const CACHE_FLAG_KEY = 'sunnah_quran_cached';

const TAJWEED_URL = 'https://raw.githubusercontent.com/TassainRasool/hadith-data/refs/heads/main/quran-tajweed.json';
const TAJWEED_CACHE_KEY = 'sunnah_quran_tajweed';
const TAJWEED_CACHE_FLAG_KEY = 'sunnah_quran_tajweed_cached';

let cachedQuran = null;
let cachedTajweedQuran = null;

async function loadQuran() {
  if (cachedQuran) return cachedQuran;
  const stored = await AsyncStorage.getItem(CACHE_KEY);
  if (stored) {
    cachedQuran = JSON.parse(stored);
    return cachedQuran;
  }
  const res = await axios.get(QURAN_URL);
  cachedQuran = res.data;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cachedQuran));
  return cachedQuran;
}

async function loadTajweedQuran() {
  if (cachedTajweedQuran) return cachedTajweedQuran;
  const stored = await AsyncStorage.getItem(TAJWEED_CACHE_KEY);
  if (stored) {
    cachedTajweedQuran = JSON.parse(stored);
    return cachedTajweedQuran;
  }
  const res = await axios.get(TAJWEED_URL);
  cachedTajweedQuran = res.data.data.surahs;
  await AsyncStorage.setItem(TAJWEED_CACHE_KEY, JSON.stringify(cachedTajweedQuran));
  return cachedTajweedQuran;
}

export async function getSurahMeta() {
  const quran = await loadQuran();
  return quran.map(s => ({
    number: s.id,
    name: s.name,
    englishName: s.transliteration,
    englishNameTranslation: s.translation,
    revelationType: s.type,
    numberOfAyahs: s.total_verses,
  }));
}

export async function getSurahAyahs(surahNumber) {
  const quran = await loadQuran();
  const surah = quran.find(s => s.id === surahNumber);
  if (!surah) return [];
  return surah.verses.map((v, i) => ({
    number: i + 1,
    arabic: v.text,
    english: v.translation,
  }));
}

export async function getTajweedSurahAyahs(surahNumber) {
  const surahs = await loadTajweedQuran();
  const surah = surahs.find(s => s.number === surahNumber);
  if (!surah) return [];
  return surah.ayahs.map(a => ({
    number: a.numberInSurah,
    arabic: stripTajweedMarkers(a.text),
    tajweed: a.text,
    english: '',
  }));
}

export async function preCacheQuran(onProgress) {
  onProgress && onProgress(0, 'Downloading Quran');
  const res = await axios.get(QURAN_URL);
  const data = res.data;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  await AsyncStorage.setItem(CACHE_FLAG_KEY, 'true');
  cachedQuran = data;
  onProgress && onProgress(100, 'Complete');
}

export async function preCacheTajweed(onProgress) {
  onProgress && onProgress(0, 'Downloading Tajweed Quran');
  const res = await axios.get(TAJWEED_URL);
  const surahs = res.data.data.surahs;
  await AsyncStorage.setItem(TAJWEED_CACHE_KEY, JSON.stringify(surahs));
  await AsyncStorage.setItem(TAJWEED_CACHE_FLAG_KEY, 'true');
  cachedTajweedQuran = surahs;
  onProgress && onProgress(100, 'Complete');
}

export async function isQuranCached() {
  try {
    return (await AsyncStorage.getItem(CACHE_FLAG_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function isTajweedCached() {
  try {
    return (await AsyncStorage.getItem(TAJWEED_CACHE_FLAG_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function clearQuranCache() {
  try {
    await AsyncStorage.multiRemove([CACHE_KEY, CACHE_FLAG_KEY]);
    cachedQuran = null;
  } catch {}
}

export async function clearTajweedCache() {
  try {
    await AsyncStorage.multiRemove([TAJWEED_CACHE_KEY, TAJWEED_CACHE_FLAG_KEY]);
    cachedTajweedQuran = null;
  } catch {}
}
