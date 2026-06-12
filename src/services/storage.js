import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  BOOKMARKS: 'sunnah_bookmarks',
  NOTES: 'sunnah_notes',
  SETTINGS: 'sunnah_settings',
  DAILY_CACHE: 'sunnah_daily_cache',
  RECENT: 'sunnah_recent',
};

// ─── Bookmarks ────────────────────────────────────────────────
export const getBookmarks = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addBookmark = async (hadith) => {
  const bookmarks = await getBookmarks();
  const exists = bookmarks.some(
    b => b.collectionName === hadith.collectionName && (b.hadithnumber ?? b.hadithNumber) === (hadith.hadithnumber ?? hadith.hadithNumber)
  );
  if (exists) return bookmarks;
  const updated = [{ ...hadith, savedAt: new Date().toISOString() }, ...bookmarks];
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(updated));
  return updated;
};

export const removeBookmark = async (collectionName, hadithNumber) => {
  const bookmarks = await getBookmarks();
  const updated = bookmarks.filter(
    b => !(b.collectionName === collectionName && (b.hadithnumber ?? b.hadithNumber) === hadithNumber)
  );
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(updated));
  return updated;
};

export const isBookmarked = async (collectionName, hadithNumber) => {
  const bookmarks = await getBookmarks();
  return bookmarks.some(
    b => b.collectionName === collectionName && (b.hadithnumber ?? b.hadithNumber) === hadithNumber
  );
};

// ─── Notes ───────────────────────────────────────────────────
export const getNote = async (collectionName, hadithNumber) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.NOTES);
    const notes = data ? JSON.parse(data) : {};
    return notes[`${collectionName}_${hadithNumber}`] || '';
  } catch {
    return '';
  }
};

export const saveNote = async (collectionName, hadithNumber, text) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.NOTES);
    const notes = data ? JSON.parse(data) : {};
    notes[`${collectionName}_${hadithNumber}`] = text;
    await AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  } catch {}
};

// ─── Settings ─────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  showArabic: true,
  showTransliteration: false,
  showGrade: true,
  notificationsEnabled: false,
  notificationTime: '06:00',
  preferredCollections: ['bukhari', 'muslim'],
  themeMode: 'dark',
};

export const getSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings) => {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

// ─── Daily cache ──────────────────────────────────────────────
export const getCachedDailyHadith = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.DAILY_CACHE);
    if (!data) return null;
    const { date, hadith } = JSON.parse(data);
    const today = new Date().toDateString();
    return date === today ? hadith : null;
  } catch {
    return null;
  }
};

export const cacheDailyHadith = async (hadith) => {
  const payload = { date: new Date().toDateString(), hadith };
  await AsyncStorage.setItem(KEYS.DAILY_CACHE, JSON.stringify(payload));
};

// ─── Recent history ───────────────────────────────────────────
export const addRecent = async (hadith) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECENT);
    let recent = data ? JSON.parse(data) : [];
    recent = recent.filter(
      r => !(r.collectionName === hadith.collectionName && r.hadithNumber === hadith.hadithNumber)
    );
    recent.unshift({ ...hadith, viewedAt: new Date().toISOString() });
    recent = recent.slice(0, 20);
    await AsyncStorage.setItem(KEYS.RECENT, JSON.stringify(recent));
  } catch {}
};

export const getRecent = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECENT);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};
