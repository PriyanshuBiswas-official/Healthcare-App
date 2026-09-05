import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidStyle,
  AndroidColor,
  AndroidForegroundServiceType,
  AndroidLaunchActivityFlag,
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
  Trigger,
} from '@notifee/react-native';
import { Platform, NativeModules } from 'react-native';
import type { Appointment } from '../types/appointment';
import type { Reminder, ReminderSchedule, NotificationPreferences } from '../types/reminder';
import { CATEGORY_META } from '../types/reminder';
import { storage } from '../lib/storage';

// ── Constants ─────────────────────────────────────────────────

const CHANNEL_VERSION = '1.2';

// ── Helpers ───────────────────────────────────────────────────

function getVersionedChannelId(channelBase: string): string {
  return `${channelBase}_v${CHANNEL_VERSION}`;
}

function getBuildNumber(): string {
  try {
    return NativeModules?.InfoDictionaryManager?.buildNumber || '1';
  } catch {
    return '1';
  }
}

function isQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quiet_hr_start || !preferences.quiet_hr_end) return false;
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [startH, startM] = preferences.quiet_hr_start.split(':').map(Number);
  const [endH, endM] = preferences.quiet_hr_end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

function getNotificationId(prefix: string, id: number, index: number = 0): string {
  return `${prefix}_${id}_${index}`;
}

// ── Notification Channel Setup ────────────────────────────────

export function createNotificationChannels(): void {
  if (Platform.OS !== 'android') return;

  const categories = Object.values(CATEGORY_META);
  categories.forEach((cat) => {
    notifee.createChannel({
      id: getVersionedChannelId(cat.channel),
      name: cat.label,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      vibration: true,
      sound: 'default',
    });
  });

  notifee.createChannel({
    id: getVersionedChannelId('workout_session'),
    name: 'Workout Timer',
    importance: AndroidImportance.LOW,
    visibility: AndroidVisibility.PUBLIC,
    vibration: false,
    sound: undefined,
  });
}

export function requestNotificationPermission(): void {
  if (Platform.OS !== 'android') return;
  notifee.requestPermission({ sound: true, badge: true, alert: true }).catch(() => {});
}

// ── Reminder Notifications ────────────────────────────────────

export async function syncNotifications(
  reminders: Reminder[],
  schedules: Map<number, ReminderSchedule[]>,
  preferences: NotificationPreferences,
): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!preferences.push_enabled && !preferences.local_enabled) return;
  if (isQuietHours(preferences)) return;

  const existingNotifications = await notifee.getTriggerNotifications();
  const existingIds = new Set(
    existingNotifications.map((n) => n.notification.id || '')
  );

  for (const reminder of reminders) {
    const reminderSchedules = schedules.get(reminder.reminder_id) || [];
    for (const schedule of reminderSchedules) {
      if (!schedule.enabled) continue;

      const notifId = getNotificationId('reminder', reminder.reminder_id, schedule.reminder_schedule_id);
      if (existingIds.has(notifId)) continue;

      const notifyAt = new Date(schedule.notify_at);
      if (notifyAt.getTime() <= Date.now()) continue;

      const catMeta = CATEGORY_META[reminder.category] || CATEGORY_META.general;

      await notifee.createTriggerNotification(
        {
          id: notifId,
          title: catMeta.label,
          body: reminder.title,
          data: { screen: reminder.category, reminderId: reminder.reminder_id },
          android: {
            channelId: getVersionedChannelId(catMeta.channel),
            smallIcon: 'ic_stat_cureto',
            color: catMeta.color,
            pressAction: { id: 'default' },
            style: reminder.description ? { type: AndroidStyle.BIGTEXT, text: reminder.description } : undefined,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: notifyAt.getTime(),
          repeatFrequency: schedule.repeat_type === 'daily' ? RepeatFrequency.DAILY : undefined,
        },
      );
    }
  }
}

export async function rescheduleReminderNotifications(
  reminder: Reminder,
  schedules: ReminderSchedule[],
  preferences: NotificationPreferences,
): Promise<void> {
  if (Platform.OS !== 'android') return;

  await cancelAllReminderNotifications(reminder.reminder_id);

  if (!preferences.push_enabled && !preferences.local_enabled) return;
  if (isQuietHours(preferences)) return;

  const catMeta = CATEGORY_META[reminder.category] || CATEGORY_META.general;

  for (const schedule of schedules) {
    if (!schedule.enabled) continue;

    const notifyAt = new Date(schedule.notify_at);
    if (notifyAt.getTime() <= Date.now()) continue;

    const notifId = getNotificationId('reminder', reminder.reminder_id, schedule.reminder_schedule_id);

    await notifee.createTriggerNotification(
      {
        id: notifId,
        title: catMeta.label,
        body: reminder.title,
        data: { screen: reminder.category, reminderId: reminder.reminder_id },
        android: {
          channelId: getVersionedChannelId(catMeta.channel),
          smallIcon: 'ic_stat_cureto',
          color: catMeta.color,
          pressAction: { id: 'default' },
          style: reminder.description ? { type: AndroidStyle.BIGTEXT, text: reminder.description } : undefined,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: notifyAt.getTime(),
        repeatFrequency: schedule.repeat_type === 'daily' ? RepeatFrequency.DAILY : undefined,
      },
    );
  }
}

export async function cancelAllReminderNotifications(reminderId: number): Promise<void> {
  if (Platform.OS !== 'android') return;

  const existing = await notifee.getTriggerNotifications();
  for (const n of existing) {
    if (n.notification.id?.startsWith(`reminder_${reminderId}_`)) {
      await notifee.cancelTriggerNotification(n.notification.id);
    }
  }
}

// ── Appointment Notifications ─────────────────────────────────

export async function scheduleAppointmentNotifications(appointment: Appointment): Promise<void> {
  if (Platform.OS !== 'android') return;

  const appointmentDate = new Date(appointment.date_with_time);
  if (appointmentDate.getTime() <= Date.now()) return;

  const catMeta = CATEGORY_META.appointment;
  const body = `Dr. ${appointment.doctor_name} — ${appointment.speciality}`;

  // 1 day before
  if (appointment.remind_1d) {
    const oneDayBefore = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
    if (oneDayBefore.getTime() > Date.now()) {
      await notifee.createTriggerNotification(
        {
          id: getNotificationId('appt_1d', appointment.appointment_id),
          title: 'Appointment Tomorrow',
          body,
          data: { screen: 'appointment', appointmentId: appointment.appointment_id },
          android: {
            channelId: getVersionedChannelId(catMeta.channel),
            smallIcon: 'ic_stat_cureto',
            color: catMeta.color,
            pressAction: { id: 'default' },
          },
        },
        { type: TriggerType.TIMESTAMP, timestamp: oneDayBefore.getTime() },
      );
    }
  }

  // 2 hours before
  if (appointment.remind_2h) {
    const twoHoursBefore = new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000);
    if (twoHoursBefore.getTime() > Date.now()) {
      await notifee.createTriggerNotification(
        {
          id: getNotificationId('appt_2h', appointment.appointment_id),
          title: 'Appointment in 2 Hours',
          body,
          data: { screen: 'appointment', appointmentId: appointment.appointment_id },
          android: {
            channelId: getVersionedChannelId(catMeta.channel),
            smallIcon: 'ic_stat_cureto',
            color: catMeta.color,
            pressAction: { id: 'default' },
          },
        },
        { type: TriggerType.TIMESTAMP, timestamp: twoHoursBefore.getTime() },
      );
    }
  }

  // Custom reminder
  if (appointment.remind_custom) {
    const customDate = new Date(appointment.remind_custom);
    if (customDate.getTime() > Date.now() && customDate.getTime() < appointmentDate.getTime()) {
      await notifee.createTriggerNotification(
        {
          id: getNotificationId('appt_custom', appointment.appointment_id),
          title: 'Appointment Reminder',
          body,
          data: { screen: 'appointment', appointmentId: appointment.appointment_id },
          android: {
            channelId: getVersionedChannelId(catMeta.channel),
            smallIcon: 'ic_stat_cureto',
            color: catMeta.color,
            pressAction: { id: 'default' },
          },
        },
        { type: TriggerType.TIMESTAMP, timestamp: customDate.getTime() },
      );
    }
  }
}

export async function cancelAppointmentNotifications(appointmentId: number): Promise<void> {
  if (Platform.OS !== 'android') return;

  const prefixes = ['appt_1d', 'appt_2h', 'appt_custom'];
  for (const prefix of prefixes) {
    await notifee.cancelTriggerNotification(getNotificationId(prefix, appointmentId));
  }
}

// ── Test Notification ─────────────────────────────────────────

export async function sendTestNotification(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await notifee.displayNotification({
    title: 'Cureto',
    body: 'Notifications are working!',
    android: {
      channelId: getVersionedChannelId('general'),
      smallIcon: 'ic_stat_cureto',
      color: '#0891B2',
      pressAction: { id: 'default' },
    },
  });
}

// ── Workout Timer Foreground Service ─────────────────────────

const WORKOUT_TIMER_NOTIFICATION_ID = 'workout_timer_session';



function formatTimerNotificationTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export async function startWorkoutTimerNotification(elapsed: number): Promise<void> {
  const channelId = getVersionedChannelId('workout_session');
  const timeStr = formatTimerNotificationTime(elapsed);

  await notifee.displayNotification({
    id: WORKOUT_TIMER_NOTIFICATION_ID,
    title: 'Workout Timer',
    body: `${timeStr} — Session in progress`,
    data: { screen: 'workout_timer' },
    android: {
      channelId,
      asForegroundService: true,
      foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_HEALTH],
      smallIcon: 'ic_stat_cureto',
      color: '#0891B2',
      pressAction: { id: 'default' },
      ongoing: true,
      actions: [
        { pressAction: { id: 'workout_timer_pause' }, title: 'Pause' },
      ],
    },
  });
}

export async function updateWorkoutTimerNotification(
  elapsed: number,
  paused: boolean,
): Promise<void> {
  const timeStr = formatTimerNotificationTime(elapsed);
  const status = paused ? 'Paused' : 'Session in progress';

  await notifee.displayNotification({
    id: WORKOUT_TIMER_NOTIFICATION_ID,
    title: 'Workout Timer',
    body: `${timeStr} — ${status}`,
    data: { screen: 'workout_timer' },
    android: {
      channelId: getVersionedChannelId('workout_session'),
      asForegroundService: true,
      foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_HEALTH],
      smallIcon: 'ic_stat_cureto',
      color: '#0891B2',
      pressAction: { id: 'default' },
      ongoing: true,
      actions: paused
        ? [{ pressAction: { id: 'workout_timer_resume' }, title: 'Resume' }]
        : [{ pressAction: { id: 'workout_timer_pause' }, title: 'Pause' }],
    },
  });
}

export async function stopWorkoutTimerNotification(): Promise<void> {
  try {
    await notifee.cancelNotification(WORKOUT_TIMER_NOTIFICATION_ID);
  } catch {}
  try {
    await notifee.stopForegroundService();
  } catch {}
}
