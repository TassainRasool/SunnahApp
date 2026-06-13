import notifee, { AndroidImportance, AndroidCategory, AndroidVisibility, TriggerType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

const CHANNEL_ID = 'prayer_times';
const NOTIFICATION_PREFIX = 'prayer_';

let lastScheduledDate = '';

export async function requestNotificationPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      'android.permission.POST_NOTIFICATIONS',
      {
        title: 'Prayer Notifications',
        message: 'Sunnah needs notification permission to alert you at prayer times.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function setupPrayerChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Prayer Times',
    description: 'Notifications for prayer time alerts',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
    bypassDnd: true,
  });
}

export async function schedulePrayerNotifications(prayers, currentDate) {
  const todayKey = currentDate.toDateString();
  if (todayKey === lastScheduledDate) return;
  lastScheduledDate = todayKey;

  const existing = await notifee.getTriggerNotifications();
  for (const t of existing) {
    if (t.notification.data?.type === NOTIFICATION_PREFIX) {
      await notifee.cancelNotification(t.notification.id);
    }
  }

  for (const p of prayers) {
    const [h, m] = p.time.split(':').map(Number);
    const triggerDate = new Date(currentDate);
    triggerDate.setHours(h, m, 0, 0);

    if (triggerDate <= new Date()) continue;

    const remindDate = new Date(triggerDate.getTime() - 30 * 60 * 1000);
    if (remindDate <= new Date()) continue;

    await notifee.createTriggerNotification(
      {
        id: `${NOTIFICATION_PREFIX}${p.name.toLowerCase()}`,
        title: `🕌 ${p.name} in 30 min`,
        body: `Get ready for ${p.name} prayer`,
        data: { type: NOTIFICATION_PREFIX },
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.ALARM,
          visibility: AndroidVisibility.PUBLIC,
          sound: 'default',
          pressAction: { id: 'default' },
          asForegroundService: true,
        },
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            badge: true,
            banner: true,
            list: true,
            sound: true,
          },
        },
      },
      { type: TriggerType.TIMESTAMP, timestamp: remindDate.getTime() },
    );
  }
}

export async function cancelAllPrayerNotifications() {
  const triggered = await notifee.getTriggerNotifications();
  for (const t of triggered) {
    if (t.notification.data?.type === NOTIFICATION_PREFIX) {
      await notifee.cancelNotification(t.notification.id);
    }
  }
}
