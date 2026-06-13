import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AR_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani';
const EN_URL = 'https://api.alquran.cloud/v1/quran/en.sahih';
const META_KEY = 'quran_surah_meta_v2';
const SURAH_PREFIX = 'quran_surah_v2_';
export const QURAN_CACHE_KEY = 'quran_cached_v2';

function extractMeta(surahs) {
  return surahs.map(s => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    revelationType: s.revelationType,
    numberOfAyahs: s.numberOfAyahs,
  }));
}

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

function mapAyahs(arSurah, enSurah) {
  const skipBismillah = arSurah.number !== 1 && arSurah.number !== 9 && arSurah.ayahs[0]?.text === BISMILLAH;
  const startIdx = skipBismillah ? 1 : 0;
  return arSurah.ayahs.slice(startIdx).map((a, j) => ({
    number: j + 1,
    arabic: a.text,
    english: enSurah?.ayahs[startIdx + j]?.text || '',
  }));
}

async function fetchAndCacheAll() {
  const [arRes, enRes] = await Promise.all([
    axios.get(AR_URL),
    axios.get(EN_URL),
  ]);
  const arData = arRes.data.data;
  const enData = enRes.data.data;
  const meta = extractMeta(arData.surahs);

  const promises = arData.surahs.map((arSurah, i) => {
    const enSurah = enData.surahs[i];
    const ayahs = mapAyahs(arSurah, enSurah);
    return AsyncStorage.setItem(SURAH_PREFIX + arSurah.number, JSON.stringify(ayahs));
  });
  promises.push(AsyncStorage.setItem(META_KEY, JSON.stringify(meta)));

  await Promise.all(promises);
  return { meta, arData, enData };
}

export async function getSurahMeta() {
  const cached = await AsyncStorage.getItem(META_KEY);
  if (cached) return JSON.parse(cached);
  const { meta } = await fetchAndCacheAll();
  return meta;
}

export async function getSurahAyahs(surahNumber) {
  const cached = await AsyncStorage.getItem(SURAH_PREFIX + surahNumber);
  if (cached) return JSON.parse(cached);

  const { arData, enData } = await fetchAndCacheAll();
  const arSurah = arData.surahs.find(s => s.number === surahNumber);
  const enSurah = enData.surahs.find(s => s.number === surahNumber);
  if (!arSurah || !enSurah) return [];

  return mapAyahs(arSurah, enSurah);
}

export async function preCacheQuran(onProgress) {
  const [arRes, enRes] = await Promise.all([
    axios.get(AR_URL),
    axios.get(EN_URL),
  ]);
  const arData = arRes.data.data;
  const enData = enRes.data.data;
  const meta = extractMeta(arData.surahs);

  const total = arData.surahs.length;
  for (let i = 0; i < total; i++) {
    const arSurah = arData.surahs[i];
    const enSurah = enData.surahs[i];
    const ayahs = mapAyahs(arSurah, enSurah);
    await AsyncStorage.setItem(SURAH_PREFIX + arSurah.number, JSON.stringify(ayahs));
    onProgress && onProgress(Math.round(((i + 1) / total) * 100), arSurah.englishName);
  }

  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  await AsyncStorage.setItem(QURAN_CACHE_KEY, 'true');
}

export async function isQuranCached() {
  try {
    return (await AsyncStorage.getItem(QURAN_CACHE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function clearQuranCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const quranKeys = keys.filter(k => k.startsWith('quran_surah') || k === META_KEY || k === QURAN_CACHE_KEY);
    await AsyncStorage.multiRemove(quranKeys);
  } catch {}
}
