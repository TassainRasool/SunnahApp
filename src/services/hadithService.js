import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://raw.githubusercontent.com/TassainRasool/hadith-data/refs/heads/main';

const CACHE_PREFIX = 'sunnah_v3_';

export const COLLECTIONS = [
  { name: 'bukhari', label: 'Bukhari', fullName: 'Sahih al-Bukhari' },
  { name: 'muslim', label: 'Muslim', fullName: 'Sahih Muslim' },
  { name: 'abudawud', label: 'Abu Dawud', fullName: 'Sunan Abi Dawud' },
  { name: 'tirmidhi', label: 'Tirmidhi', fullName: 'Jami at-Tirmidhi' },
  { name: 'ibnmajah', label: 'Ibn Majah', fullName: 'Sunan Ibn Majah' },
];

const KEYWORD_MAP = {
  // Worship
  nimaz:        ['prayer', 'salat', 'salah', 'worship', 'prostration'],
  namaaz:       ['prayer', 'salat', 'salah', 'worship'],
  salat:        ['prayer', 'salah', 'worship', 'prostration', 'bowing'],
  salah:        ['prayer', 'salat', 'worship', 'prostration'],
  roza:         ['fasting', 'fast', 'ramadan', 'sawm', 'siyam'],
  sawm:         ['fasting', 'fast', 'ramadan', 'roza'],
  siyam:        ['fasting', 'fast', 'ramadan'],
  ramadan:      ['fasting', 'fast', 'sawm', 'roza', 'ramadan'],
  ramazan:      ['fasting', 'fast', 'sawm', 'ramadan'],
  zakat:        ['charity', 'alms', 'zakah', 'tithe', 'poor', 'giving'],
  zakah:        ['charity', 'alms', 'zakat', 'poor', 'giving'],
  sadaqah:      ['charity', 'alms', 'donation', 'giving', 'generosity'],
  sadqa:        ['charity', 'alms', 'donation', 'giving'],
  hajj:         ['pilgrimage', 'makkah', 'kaaba', 'ihram', 'tawaf'],
  umrah:        ['pilgrimage', 'makkah', 'kaaba', 'ihram'],
  wuzu:         ['ablution', 'wudu', 'purification', 'cleansing', 'wash'],
  wadu:         ['ablution', 'wudu', 'purification', 'cleansing', 'wash'],
  wadoo:        ['ablution', 'wudu', 'purification', 'cleansing', 'wash'],
  wudu:         ['ablution', 'purification', 'cleansing', 'wash'],
  ghusl:        ['bath', 'purification', 'cleansing', 'ritual bath'],
  tayammum:     ['purification', 'dust', 'sand', 'ablution'],
  azan:         ['call to prayer', 'adhan', 'prayer call', 'muezzin'],
  adhan:        ['call to prayer', 'azan', 'prayer call'],
  jumuah:       ['friday', 'prayer', 'congregation', 'khutbah', 'sermon'],
  jummah:       ['friday', 'prayer', 'congregation', 'sermon'],
  taraweeh:     ['night prayer', 'ramadan', 'prayer', 'standing'],
  tahajjud:     ['night prayer', 'prayer', 'night', 'standing', 'worship'],
  witr:         ['prayer', 'odd', 'night prayer'],
  eid:          ['festival', 'celebration', 'prayer', 'happiness'],
  qibla:        ['direction', 'makkah', 'kaaba', 'prayer direction'],
  masjid:       ['mosque', 'prayer', 'house of allah'],
  mosque:       ['masjid', 'prayer', 'worship', 'congregation'],
  // Beliefs
  iman:         ['faith', 'belief', 'trust', 'conviction'],
  yaqeen:       ['faith', 'belief', 'certainty', 'conviction'],
  tawheed:      ['monotheism', 'oneness', 'allah', 'unity of god'],
  shirk:        ['polytheism', 'association', 'idol', 'partners with allah'],
  kufr:         ['disbelief', 'rejection', 'unbeliever'],
  nifaq:        ['hypocrisy', 'hypocrite', 'munafiq'],
  munafiq:      ['hypocrite', 'hypocrisy', 'double faced'],
  taqwa:        ['piety', 'fear of allah', 'righteousness', 'god-consciousness'],
  tawakkul:     ['trust in allah', 'reliance', 'dependence on allah'],
  sabr:         ['patience', 'perseverance', 'endurance', 'steadfastness'],
  shukr:        ['gratitude', 'thankfulness', 'gratefulness'],
  tawbah:       ['repentance', 'forgiveness', 'return to allah'],
  ikhlas:       ['sincerity', 'pure intention', 'devotion'],
  niyyah:       ['intention', 'purpose', 'sincerity'],
  niyat:        ['intention', 'purpose', 'sincerity'],
  // Character
  akhlaq:       ['character', 'manners', 'morals', 'ethics', 'behavior'],
  adab:         ['manners', 'etiquette', 'respect', 'politeness'],
  ihsan:        ['excellence', 'perfection', 'goodness', 'kindness'],
  adl:          ['justice', 'fairness', 'equity'],
  insaaf:       ['justice', 'fairness', 'equity'],
  amana:        ['trust', 'honesty', 'integrity', 'trustworthiness'],
  amanah:       ['trust', 'honesty', 'integrity'],
  sidq:         ['truthfulness', 'honesty', 'truth'],
  sach:         ['truth', 'honesty', 'truthfulness'],
  haya:         ['modesty', 'shyness', 'shame', 'honor'],
  kibr:         ['arrogance', 'pride', 'boasting', 'conceit'],
  takabbur:     ['arrogance', 'pride', 'boasting'],
  hasad:        ['envy', 'jealousy', 'hatred'],
  ghibat:       ['backbiting', 'gossip', 'slander', 'speaking ill'],
  gheebat:      ['backbiting', 'gossip', 'slander'],
  namima:       ['tale bearing', 'gossip', 'slander', 'backbiting'],
  jhoot:        ['lie', 'lying', 'falsehood', 'deception'],
  kizb:         ['lie', 'lying', 'falsehood'],
  ghadab:       ['anger', 'rage', 'wrath'],
  gussa:        ['anger', 'rage', 'wrath'],
  hilm:         ['forbearance', 'gentleness', 'patience', 'tolerance'],
  rahm:         ['mercy', 'compassion', 'kindness'],
  rehmat:       ['mercy', 'compassion', 'blessing'],
  // Family
  nikah:        ['marriage', 'wedding', 'spouse', 'husband', 'wife'],
  shadi:        ['marriage', 'wedding', 'nikah'],
  talaq:        ['divorce', 'separation', 'marriage'],
  walid:        ['parents', 'father', 'mother', 'obedience'],
  walidain:     ['parents', 'mother', 'father', 'obedience'],
  maa:          ['mother', 'parents', 'woman'],
  baap:         ['father', 'parents'],
  aulad:        ['children', 'sons', 'daughters', 'offspring'],
  bacche:       ['children', 'sons', 'daughters'],
  rishtay:      ['relatives', 'kinship', 'family ties', 'relations'],
  silaturrahim: ['kinship', 'family ties', 'relatives', 'relations'],
  mehman:       ['guest', 'hospitality', 'honor'],
  huqooq:       ['rights', 'duties', 'obligations'],
  pados:        ['neighbor', 'neighbour'],
  yateem:       ['orphan', 'fatherless', 'poor'],
  orphan:       ['yateem', 'fatherless', 'care'],
  // Daily life
  khana:        ['food', 'eating', 'drink', 'meal'],
  khaana:       ['food', 'eating', 'drink', 'meal'],
  pani:         ['water', 'drink', 'purification'],
  safar:        ['travel', 'journey', 'trip'],
  tijarat:      ['trade', 'business', 'commerce', 'buying', 'selling'],
  business:     ['trade', 'commerce', 'buying', 'selling', 'tijarat'],
  qarz:         ['debt', 'loan', 'borrowing'],
  halal:        ['lawful', 'permitted', 'allowed', 'permissible'],
  haram:        ['forbidden', 'prohibited', 'unlawful', 'impermissible'],
  ilm:          ['knowledge', 'learning', 'education', 'wisdom'],
  taleem:       ['education', 'learning', 'knowledge', 'teaching'],
  amal:         ['deeds', 'actions', 'works', 'practice'],
  dua:          ['supplication', 'prayer', 'invocation', 'asking allah'],
  dhikr:        ['remembrance', 'mention', 'glorification', 'zikr'],
  zikr:         ['remembrance', 'mention', 'glorification', 'dhikr'],
  quran:        ['quran', 'recitation', 'revelation', 'book of allah'],
  tilawat:      ['recitation', 'quran', 'reading'],
  sunnah:       ['sunnah', 'tradition', 'practice', 'way of prophet'],
  // Afterlife
  jannat:       ['paradise', 'heaven', 'jannah', 'garden'],
  jannah:       ['paradise', 'heaven', 'garden', 'reward'],
  jahannum:     ['hell', 'fire', 'punishment', 'hellfire'],
  jahannam:     ['hell', 'fire', 'punishment', 'hellfire'],
  qayamat:      ['day of judgment', 'resurrection', 'last day', 'hereafter'],
  akhirat:      ['hereafter', 'afterlife', 'next life', 'day of judgment'],
  maut:         ['death', 'dying', 'deceased'],
  mout:         ['death', 'dying', 'deceased'],
  qabr:         ['grave', 'burial', 'death', 'tomb'],
  mizan:        ['scale', 'balance', 'judgment', 'deeds'],
  sirat:        ['bridge', 'path', 'judgment', 'crossing'],
  azaab:        ['punishment', 'torment', 'hell', 'suffering'],
  sawab:        ['reward', 'paradise', 'good deeds', 'blessing'],
  gunah:        ['sin', 'wrongdoing', 'transgression'],
  sins:         ['sin', 'gunah', 'wrongdoing', 'transgression', 'forgiveness'],
  forgiveness:  ['forgiveness', 'tawbah', 'repentance', 'mercy', 'pardon'],
  maafi:        ['forgiveness', 'pardon', 'mercy'],
  // People
  nabi:         ['prophet', 'messenger', 'muhammad', 'prophethood'],
  rasool:       ['messenger', 'prophet', 'muhammad', 'apostle'],
  prophet:      ['nabi', 'rasool', 'messenger', 'muhammad'],
  muhammad:     ['prophet', 'messenger', 'rasool', 'sunnah'],
  sahaba:       ['companions', 'disciples', 'followers of prophet'],
  muslim:       ['believer', 'islam', 'faith', 'submission'],
  momin:        ['believer', 'faithful', 'muslim'],
  alim:         ['scholar', 'learned', 'knowledgeable', 'teacher'],
  imam:         ['leader', 'prayer leader', 'scholar'],
  // World
  dunya:        ['world', 'life', 'earth', 'worldly'],
  duniya:       ['world', 'life', 'earth', 'worldly'],
  raat:         ['night', 'darkness', 'evening'],
  subah:        ['morning', 'dawn', 'fajr'],
  shaam:        ['evening', 'sunset', 'dusk'],
};

const expandQuery = (query) => {
  const lowerQuery = query.toLowerCase().trim();
  const keywords = [lowerQuery];
  Object.entries(KEYWORD_MAP).forEach(([key, values]) => {
    if (lowerQuery.includes(key)) keywords.push(...values);
    values.forEach(v => {
      if (lowerQuery.includes(v)) keywords.push(key, ...values);
    });
  });
  return [...new Set(keywords)];
};

const saveToCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch {}
};

const getFromCache = async (key) => {
  try {
    const data = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const fetchCollection = async (collectionName, lang) => {
  const url = `${BASE_URL}/${lang}-${collectionName}.min.json`;
  const response = await axios.get(url, { timeout: 30000 });
  return response.data;
};

const loadCollection = async (collectionName, lang) => {
  const cacheKey = `${collectionName}_${lang}`;
  const cached = await getFromCache(cacheKey);
  if (cached) return cached;
  const data = await fetchCollection(collectionName, lang);
  await saveToCache(cacheKey, data);
  return data;
};

const mergeHadiths = (engData, araData, collectionName) => {
  const engHadiths = engData?.hadiths || [];
  const araHadiths = araData?.hadiths || [];
  const sections = engData?.metadata?.sections || {};
  const araMap = {};
  araHadiths.forEach(h => { araMap[h.hadithnumber] = h.text; });

  return engHadiths
    .map(h => ({
      hadithnumber: h.hadithnumber,
      arabicnumber: h.arabicnumber,
      collectionName,
      text: h.text || '',
      arabic: araMap[h.hadithnumber] || '',
      grades: h.grades || [],
      reference: h.reference || {},
      sectionName: sections[String(h.reference?.book)] || '',
    }))
    .filter(h => h.text.trim() !== '' || h.arabic.trim() !== '');
};

export const getAllHadiths = async (collectionName) => {
  const [engData, araData] = await Promise.all([
    loadCollection(collectionName, 'eng'),
    loadCollection(collectionName, 'ara'),
  ]);
  return mergeHadiths(engData, araData, collectionName);
};

export const getHadithsBySection = async (collectionName, page = 1, pageSize = 20) => {
  const all = await getAllHadiths(collectionName);
  const start = (page - 1) * pageSize;
  return all.slice(start, start + pageSize);
};

export const getHadithByNumber = async (collectionName, hadithNumber) => {
  const all = await getAllHadiths(collectionName);
  return all.find(h => h.hadithnumber === hadithNumber) || all[0];
};

export const getDailyHadith = async () => {
  try {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const all = await getAllHadiths('bukhari');
    const index = seed % all.length;
    return all[index] || all[0];
  } catch {
    return null;
  }
};

export const searchHadiths = async (query, collectionFilter = null) => {
  const results = [];
  const trimmedQuery = query.trim();
  const lowerQuery = trimmedQuery.toLowerCase();

  // Check if query is a number — search by hadith number across all collections
  const isNumber = /^\d+$/.test(trimmedQuery);

  const collectionsToSearch = collectionFilter
    ? COLLECTIONS.filter(c => c.name === collectionFilter)
    : COLLECTIONS;

  if (isNumber) {
    const hadithNumber = parseInt(trimmedQuery);
    for (const col of collectionsToSearch) {
      try {
        const all = await getAllHadiths(col.name);
        const match = all.find(h => h.hadithnumber === hadithNumber);
        if (match) results.push(match);
      } catch {}
    }
    return results;
  }

  // Normal keyword search
  const keywords = expandQuery(lowerQuery);
  for (const col of collectionsToSearch) {
    try {
      const all = await getAllHadiths(col.name);
      const matches = all.filter(h => {
        const text = (h.text || '').toLowerCase();
        const arabic = (h.arabic || '').toLowerCase();
        const section = (h.sectionName || '').toLowerCase();
        return keywords.some(kw =>
          text.includes(kw) || arabic.includes(kw) || section.includes(kw)
        );
      });
      results.push(...matches.slice(0, 20));
    } catch {}
  }
  return results.slice(0, 100);
};

export const preCacheAllCollections = async (onProgress) => {
  const total = COLLECTIONS.length;
  let done = 0;
  for (const col of COLLECTIONS) {
    onProgress && onProgress(Math.round((done / total) * 100), col.label);
    try { await getAllHadiths(col.name); } catch {}
    done++;
    onProgress && onProgress(Math.round((done / total) * 100), col.label);
  }
};

export const isCollectionCached = async (collectionName) => {
  const cached = await getFromCache(`${collectionName}_eng`);
  return !!cached;
};

export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch {}
};

export const getCollectionMeta = async (collectionName) => {
  try {
    const cached = await getFromCache(`${collectionName}_eng`);
    if (cached) return { name: cached.metadata?.name, sections: cached.metadata?.sections || {} };
    return { name: collectionName, sections: {} };
  } catch {
    return { name: collectionName, sections: {} };
  }
};