/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import App from './App';
import { name as appName } from './app.json';
import { renderPrayerTimesWidget } from './src/widgets/PrayerTimesWidget';

notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.DELIVERED) {
    notifee.displayNotification({
      title: detail.notification.title,
      body: detail.notification.body,
      android: {
        channelId: 'prayer_times',
        importance: 5,
        category: 'alarm',
        visibility: 1,
        sound: 'default',
        pressAction: { id: 'default' },
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
    });
  }
});

registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
  const widget = await renderPrayerTimesWidget();
  renderWidget(widget);
});

AppRegistry.registerComponent(appName, () => App);
