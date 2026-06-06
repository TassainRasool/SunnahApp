import notifee, { TriggerType, RepeatFrequency, AndroidImportance } from '@notifee/react-native';
import { getDailyHadith } from './api';
import { cacheDailyHadith } from './storage';

const CHANNEL_ID = 'daily_hadith';

export const createNotificationChannel = async () => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Daily Hadith',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });
};

export const requestNotificationPermission = async () => {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
};

export const scheduleDailyNotification = async (timeString) => {
  // Cancel any existing daily notifications
  await cancelDailyNotification();

  const [hours, minutes] = timeString.split(':').map(Number);

  // Pre-fetch today's hadith and cache it
  try {
    const hadith = await getDailyHadith();
    await cacheDailyHadith(hadith);

    const triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);
    // If the time has already passed today, schedule for tomorrow
    if (triggerDate <= new Date()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const text = hadith?.hadith?.[0]?.body || 'Open the app to read today\'s hadith.';
    const truncated = text.replace(/<[^>]*>/g, '').slice(0, 100) + '...';

    await notifee.createTriggerNotification(
      {
        id: 'daily_hadith',
        title: '📿 Daily Hadith',
        body: truncated,
        android: {
          channelId: CHANNEL_ID,
          smallIcon: 'ic_notification',
          color: '#d4af7a',
          pressAction: { id: 'default' },
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      }
    );
  } catch (error) {
    console.warn('Failed to schedule notification:', error);
  }
};

export const cancelDailyNotification = async () => {
  await notifee.cancelNotification('daily_hadith');
};

export const getScheduledNotifications = async () => {
  return await notifee.getTriggerNotifications();
};
