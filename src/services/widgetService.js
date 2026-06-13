import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

const WIDGET_CACHE_KEY = 'sunnah_widget_prayer_data';

export const saveWidgetPrayerData = async (data) => {
  try {
    await AsyncStorage.setItem(WIDGET_CACHE_KEY, JSON.stringify(data));

    if (Platform.OS === 'ios' && NativeModules.RNWidgetBridge) {
      await NativeModules.RNWidgetBridge.savePrayerData(data);
    }
  } catch {}
};

export const getWidgetPrayerData = async () => {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
