/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { addNotificationToInbox } from './src/services/notificationInbox';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED && detail.notification) {
    await addNotificationToInbox(detail.notification);
  }
});

AppRegistry.registerComponent(appName, () => App);
