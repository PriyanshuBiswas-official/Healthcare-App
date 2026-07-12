import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
  Trigger,
} from '@notifee/react-native';
import type { Reminder, ReminderSchedule, NotificationPreferences } from '../types/reminder';
import { CATEGORY_META } from '../types/reminder';

// ── Channel Setup ──────────────────────────────────────────

const CHANNELS = [
  { id: 'medication', name: 'Medication Reminders', importance: AndroidImportance.HIGH },
  { id: 'water', name: 'Water Reminders', importance: AndroidImportance.HIGH },
  { id: 'workout', name: 'Workout Reminders', importance: AndroidImportance.HIGH },
  { id: 'nutrition', name: 'Nutrition Reminders', importance: AndroidImportance.DEFAULT },
  { id: 'sleep', name: 'Sleep Reminders', importance: AndroidImportance.HIGH },
  { id: 'health', name: 'Health Reminders', importance: AndroidImportance.HIGH },
  { id: 'appointment', name: 'Appointment Reminders', importance: AndroidImportance.HIGH },
  { id: 'general', name: 'General Notifications', importance: AndroidImportance.DEFAULT },
];

/**
 * Creates all notification channels. Call once on app startup.
 */
export async function createNotificationChannels(): Promise<void> {
  for (const channel of CHANNELS) {
    await notifee.createChannel({
      id: channel.id,
      name: channel.name,
      importance: channel.importance,
      vibration: true,
    });
  }
}

// ── Permission ─────────────────────────────────────────────

/**
 * Requests notification permission. Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1; // >= 1 means authorized
}

/**
 * Checks current notification permission status.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus >= 1;
}

// ── Scheduling ─────────────────────────────────────────────

/**
 * Generates a deterministic notification ID from reminder and schedule IDs.
 */
function getNotificationId(reminderId: number, scheduleId: number): string {
  return `reminder_${reminderId}_${scheduleId}`;
}

/**
 * Checks if a time is within quiet hours.
 */
function isInQuietHours(timeHHMM: string, quietStart: string, quietEnd: string): boolean {
  const [h, m] = timeHHMM.split(':').map(Number);
  const [sh, sm] = quietStart.split(':').map(Number);
  const [eh, em] = quietEnd.split(':').map(Number);

  const timeMinutes = h * 60 + m;
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    // Quiet hours don't cross midnight (e.g., 22:00 - 07:00 is NOT this case)
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  } else {
    // Quiet hours cross midnight (e.g., 22:00 - 07:00)
    return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
  }
}

/**
 * Checks if the schedule should fire on the given weekday.
 */
function shouldFireOnWeekday(weekdays: number[] | null, date: Date): boolean {
  if (!weekdays || weekdays.length === 0) return true; // one-time, no weekday filter
  return weekdays.includes(date.getDay());
}

/**
 * Schedules a single notification for a reminder+schedule combination.
 * Respects preferences (sound, vibration, quiet hours).
 */
export async function scheduleReminderNotification(
  reminder: Reminder,
  schedule: ReminderSchedule,
  preferences: NotificationPreferences,
): Promise<void> {
  if (!preferences.push_enabled || !preferences.local_enabled) return;
  if (!schedule.enabled) return;

  const meta = CATEGORY_META[reminder.category] || CATEGORY_META.general;

  // Check quiet hours
  if (isInQuietHours(schedule.notify_at, preferences.quiet_hr_start, preferences.quiet_hr_end)) {
    return; // Skip scheduling during quiet hours
  }

  const [hours, minutes] = schedule.notify_at.split(':').map(Number);

  // Build the next trigger date
  const now = new Date();
  const triggerDate = new Date();
  triggerDate.setHours(hours, minutes, 0, 0);

  // If trigger time already passed today, schedule for next applicable day
  if (triggerDate <= now) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  // For recurring with weekdays, find the next applicable weekday
  if (schedule.weekdays && schedule.weekdays.length > 0) {
    let maxDaysAhead = 7; // safety limit
    while (!shouldFireOnWeekday(schedule.weekdays, triggerDate) && maxDaysAhead > 0) {
      triggerDate.setDate(triggerDate.getDate() + 1);
      maxDaysAhead--;
    }
  }

  // Check end_date
  if (reminder.end_date) {
    const endDate = new Date(reminder.end_date + 'T23:59:59');
    if (triggerDate > endDate) return; // Reminder expired
  }

  // Don't schedule more than 60 days out
  const sixtyDaysOut = new Date();
  sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60);
  if (triggerDate > sixtyDaysOut) return;

  const notificationId = getNotificationId(reminder.reminder_id, schedule.reminder_schedule_id);

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: triggerDate.getTime(),
    repeatFrequency: reminder.repeat && !schedule.weekdays?.length
      ? RepeatFrequency.DAILY
      : undefined,
  };

  await notifee.createTriggerNotification(
    {
      id: notificationId,
      title: meta.label + ' Reminder',
      body: reminder.title + (reminder.description ? ` — ${reminder.description}` : ''),
      android: {
        channelId: meta.channel,
        importance: meta.channel === 'medication' || meta.channel === 'appointment'
          ? AndroidImportance.HIGH
          : AndroidImportance.DEFAULT,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
      data: {
        reminderId: reminder.reminder_id,
        category: reminder.category,
        screen: meta.channel,
      },
    },
    trigger,
  );
}

/**
 * Cancels a specific notification by reminder+schedule ID.
 */
export async function cancelReminderNotification(reminderId: number, scheduleId: number): Promise<void> {
  const notificationId = getNotificationId(reminderId, scheduleId);
  await notifee.cancelNotification(notificationId);
}

/**
 * Cancels all notifications for a specific reminder.
 */
export async function cancelAllReminderNotifications(reminderId: number): Promise<void> {
  const notifications = await notifee.getTriggerNotifications();
  for (const notification of notifications) {
    if (notification.notification.id?.startsWith(`reminder_${reminderId}_`)) {
      await notifee.cancelNotification(notification.notification.id);
    }
  }
}

/**
 * Cancels ALL scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await notifee.cancelAllNotifications();
}

/**
 * Reschedules all notifications for a user based on their reminders and preferences.
 * This is the main sync function — called on app start, sign-in, and any reminder/schedule change.
 */
export async function rescheduleAllNotifications(
  reminders: Reminder[],
  schedulesMap: Map<number, ReminderSchedule[]>,
  preferences: NotificationPreferences,
): Promise<void> {
  // 1. Cancel all existing scheduled notifications
  await cancelAllNotifications();

  // 2. If notifications disabled, stop here
  if (!preferences.push_enabled || !preferences.local_enabled) return;

  // 3. Re-schedule all active reminders
  for (const reminder of reminders) {
    const reminderSchedules = schedulesMap.get(reminder.reminder_id) || [];
    for (const schedule of reminderSchedules) {
      try {
        await scheduleReminderNotification(reminder, schedule, preferences);
      } catch (error) {
        console.error(`[NotificationService] Failed to schedule notification for reminder ${reminder.reminder_id}, schedule ${schedule.reminder_schedule_id}:`, error);
      }
    }
  }
}

/**
 * Gets the channel ID for a reminder category.
 */
export function getChannelForCategory(category: string): string {
  return CATEGORY_META[category as keyof typeof CATEGORY_META]?.channel || 'general';
}
