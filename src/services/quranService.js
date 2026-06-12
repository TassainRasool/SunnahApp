import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AR_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani';
const EN_URL = 'https://api.alquran.cloud/v1/quran/en.sahih';
const CACHE_KEY_AR = 'quran_ar_full';
const CACHE_KEY_EN = 'quran_en_full';
const META_KEY = 'quran_surah_meta';

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

async function fetchFull() {
  const [arRes, enRes] = await Promise.all([
    axios.get(AR_URL),
    axios.get(EN_URL),
  ]);
  const arData = arRes.data.data;
  const enData = enRes.data.data;
  const meta = extractMeta(arData.surahs);
  await AsyncStorage.setItem(CACHE_KEY_AR, JSON.stringify(arData));
  await AsyncStorage.setItem(CACHE_KEY_EN, JSON.stringify(enData));
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  return { arData, enData, meta };
}

export async function getSurahMeta() {
  const cached = await AsyncStorage.getItem(META_KEY);
  if (cached) return JSON.parse(cached);
  const { meta } = await fetchFull();
  return meta;
}

export async function getSurahAyahs(surahNumber) {
  let arData = null;
  let enData = null;
  const arCached = await AsyncStorage.getItem(CACHE_KEY_AR);
  const enCached = await AsyncStorage.getItem(CACHE_KEY_EN);
  if (arCached && enCached) {
    arData = JSON.parse(arCached);
    enData = JSON.parse(enCached);
  } else {
    const result = await fetchFull();
    arData = result.arData;
    enData = result.enData;
  }
  const arSurah = arData.surahs.find(s => s.number === surahNumber);
  const enSurah = enData.surahs.find(s => s.number === surahNumber);
  if (!arSurah || !enSurah) return [];
  return arSurah.ayahs.map((a, i) => ({
    number: a.number,
    arabic: a.text,
    english: enSurah.ayahs[i]?.text || '',
  }));
}
