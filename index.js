/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { addNotificationToInbox } from './src/services/notificationInbox';
import { workoutTimerService } from './src/services/workoutTimerService';

enableScreens(true);

// Register foreground service handler once at app startup.
// This stays alive until notifee.stopForegroundService() is called.
notifee.registerForegroundService(() => {
  return new Promise(() => {
    // Timer updates are handled by workoutTimerService / notificationService
    // The promise never resolves — the service runs until stopForegroundService() is called.
  });
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED && detail.notification) {
    await addNotificationToInbox(detail.notification);
  } else if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
    const actionId = detail.pressAction?.id;
    if (actionId === 'workout_timer_pause') {
      await workoutTimerService.pause();
    } else if (actionId === 'workout_timer_resume') {
      await workoutTimerService.resume();
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
