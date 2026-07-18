import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidStyle,
  AndroidColor,
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
  Trigger,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import type { Reminder, ReminderSchedule, NotificationPreferences } from '../types/reminder';
import type { Appointment } from '../types/appointment';
import { CATEGORY_META } from '../types/reminder';

// ── Channel Setup ──────────────────────────────────────────

// IMPORTANT: Android caches channel settings permanently.
// If you change sound/vibration/importance here, bump CHANNEL_VERSION
// so old cached channels are deleted and recreated with the new settings.
const CHANNEL_VERSION = 'v5';

const CHANNELS = [
  { id: 'medication', name: 'Medication Reminders', importance: AndroidImportance.HIGH },
  { id: 'water', name: 'Water Reminders', importance: AndroidImportance.HIGH },
  { id: 'workout', name: 'Workout Reminders', importance: AndroidImportance.HIGH },
  { id: 'nutrition', name: 'Nutrition Reminders', importance: AndroidImportance.HIGH },
  { id: 'sleep', name: 'Sleep Reminders', importance: AndroidImportance.HIGH },
  { id: 'health', name: 'Health Reminders', importance: AndroidImportance.HIGH },
  { id: 'appointment', name: 'Appointment Reminders', importance: AndroidImportance.HIGH },
  { id: 'general', name: 'General Notifications', importance: AndroidImportance.HIGH },
];

// ── Creative Notification Pools ────────────────────────────

const TITLE_POOL: Record<string, string[]> = {
  medication: [
    '💊 Time for your medication!',
    '💊 Medication reminder!',
    '💊 Don\'t miss your dose!',
    '💊 Take your medicine!',
    '💊 Your medication is due!',
    '💊 Stay on track!',
    '💊 Health first — take your meds!',
    '💊 Your prescription awaits!',
  ],
  water: [
    '💧 Time to Hydrate!',
    '💧 Water break!',
    '💧 Stay hydrated!',
    '💧 Sip sip!',
    '💧 Your body needs water',
    '💧 Hydration time!',
    '💧 Water o\'clock!',
    '💧 Drink up!',
  ],
  workout: [
    '💪 Let\'s get moving!',
    '💪 Sweat time!',
    '💪 Don\'t skip today!',
    '💪 Crush it!',
    '💪 Your workout awaits',
    '💪 Time to train!',
    '💪 Show up strong!',
    '💪 Move your body!',
  ],
  sleep: [
    '🌙 Wind down time!',
    '🌙 Sleep o\'clock!',
    '🌙 Time to rest!',
    '🌙 Bedtime reminder',
    '🌙 Sweet dreams ahead',
    '🌙 Unwind & relax',
    '🌙 Rest up!',
    '🌙 Good night!',
  ],
  health: [
    '❤️ Health check!',
    '❤️ Quick reminder!',
    '❤️ Your health matters',
    '❤️ Time for a check-in',
    '❤️ Stay on track!',
    '❤️ Wellness time!',
    '❤️ Take a moment',
    '❤️ You matter!',
  ],
  general: [
    '🔔 Hey there!',
    '🔔 Friendly reminder!',
    '🔔 Quick nudge!',
    '🔔 Just checking in!',
    '🔔 Don\'t forget!',
    '🔔 Here\'s a reminder!',
    '🔔 Stay consistent!',
    '🔔 You\'ve got this!',
  ],
};

const BODY_POOL: Record<string, Array<(r: Reminder) => string>> = {
  medication: [
    (r) => `Take ${r.title} as prescribed`,
    (r) => `${r.title} — stay consistent with your dosage`,
    () => 'Your health depends on timely medication',
    (r) => `Time to take ${r.title}. Follow your doctor's advice.`,
    (r) => `${r.title} is part of your daily routine`,
    () => 'Medication adherence is key to recovery',
    (r) => `Don't forget — ${r.title} keeps you healthy`,
    (r) => `Take ${r.title} now for best results`,
  ],
  water: [
    () => 'A glass a day keeps you fresh',
    (r) => `${r.title} - Your body will thank you later`,
    () => 'Stay fresh, stay hydrated',
    (r) => `Water o\'clock! Time to sip ${r.title} of water`,
    (r) => `Small sips, big benefits - Only ${r.title}`,
    () => 'Hydration is self-care',
    (r) => `Keep the momentum going, one ${r.title} at a time`,
    (r) => `Your cells are thirsty, treat them with ${r.title} of water`,
  ],
  workout: [
    () => 'No excuses today! 💪',
    () => 'Your goals are counting on you',
    () => 'Strong body, strong mind',
    () => 'Today\'s effort, tomorrow\'s strength',
    () => 'Show up for yourself',
    () => 'You\'ll feel better after',
    () => 'Consistency is key 🔑',
    () => 'One rep at a time',
  ],
  sleep: [
    () => 'Wind down, big day tomorrow 🌙',
    () => 'Rest well, recover strong',
    () => 'Sleep is self-care',
    () => 'Time to recharge 🔋',
    () => 'Good night, sleep tight',
    () => 'Your body needs rest',
    () => 'Drift off peacefully tonight',
    () => 'Recharge for tomorrow',
  ],
  health: [
    () => 'Quick check, big difference ❤️',
    () => 'Your health matters',
    () => 'A minute of care goes a long way',
    () => 'Small step, big impact',
    () => 'Health is wealth',
    () => 'Stay on top of things',
    () => 'Your future self will thank you',
    () => 'Wellness starts here',
  ],
  general: [
    () => 'Just a friendly nudge 🔔',
    () => 'We\'re here to help',
    () => 'Take a moment for yourself',
    () => 'You\'ve got this! 💪',
    () => 'Quick reminder, big impact',
    () => 'Stay consistent, stay strong',
    () => 'A little reminder goes a long way',
    () => 'Hey! Don\'t forget this',
  ],
};

function formatApptTime(dateWithTime: string): string {
  try {
    const d = new Date(dateWithTime);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function getApptBody(appointment: Appointment, suffix: string): string {
  const time = formatApptTime(appointment.date_with_time);
  switch (suffix) {
    case '1d':
      return `Appointment with ${appointment.doctor_name} (${appointment.speciality}) tomorrow at ${time}`;
    case '2h':
      return `Appointment with ${appointment.doctor_name} (${appointment.speciality}) in 2 hours — at ${time}`;
    case 'custom':
      return `Reminder: Appointment with ${appointment.doctor_name} (${appointment.speciality}) at ${time}`;
    case 'now':
      return `Appointment with ${appointment.doctor_name} (${appointment.speciality}) is now!`;
    default:
      return `Appointment with ${appointment.doctor_name} (${appointment.speciality}) at ${time}`;
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns the versioned channel ID (e.g. 'medication_v2').
 * This forces Android to create a fresh channel when the version changes.
 */
export function getVersionedChannelId(baseId: string): string {
  return `${baseId}_${CHANNEL_VERSION}`;
}

/**
 * Deletes old versioned channels from previous versions.
 */
async function cleanupOldChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const existingChannels = await notifee.getChannels();
    for (const ch of existingChannels) {
      // Delete channels that don't have the current version suffix
      const isOurChannel = CHANNELS.some(c => ch.id.startsWith(c.id));
      if (isOurChannel && !ch.id.endsWith(`_${CHANNEL_VERSION}`)) {
        await notifee.deleteChannel(ch.id);
      }
    }
  } catch (e) {
    console.warn('[NotificationService] Failed to clean up old channels:', e);
  }
}

/**
 * Creates all notification channels. Call once on app startup.
 * Uses versioned channel IDs to ensure Android re-creates channels
 * when sound/vibration/importance settings change.
 */
export async function createNotificationChannels(): Promise<void> {
  // Clean up old channels first
  await cleanupOldChannels();

  for (const channel of CHANNELS) {
    await notifee.createChannel({
      id: getVersionedChannelId(channel.id),
      name: channel.name,
      importance: channel.importance,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
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
 *
 * For interval-type schedules (interval_unit: 'hours'), calculates all
 * fire times within the day and schedules each as a daily notification.
 */
export async function scheduleReminderNotification(
  reminder: Reminder,
  schedule: ReminderSchedule,
  preferences: NotificationPreferences,
): Promise<void> {
  if (!preferences.push_enabled || !preferences.local_enabled) return;
  if (!schedule.enabled) return;

  const meta = CATEGORY_META[reminder.category] || CATEGORY_META.general;

  // For interval hours: schedule multiple notifications within the day
  if (schedule.repeat_type === 'interval' && schedule.interval_unit === 'hours') {
    await scheduleIntervalHoursNotifications(reminder, schedule, preferences, meta);
    return;
  }

  // For all other types (daily, weekly, monthly, null/one-shot): single notification
  await scheduleSingleNotification(reminder, schedule, preferences, meta);
}

/**
 * Schedules multiple notifications for interval-based hourly reminders.
 * Calculates fire times from start through end of day (or midnight).
 */
async function scheduleIntervalHoursNotifications(
  reminder: Reminder,
  schedule: ReminderSchedule,
  preferences: NotificationPreferences,
  meta: { label: string; icon: string; color: string; channel: string },
): Promise<void> {
  const [startHour, startMin] = schedule.notify_at.split(':').map(Number);
  const intervalHours = schedule.repeat_interval || 1;

  // Calculate all fire times within the day
  const fireTimes: Array<{ hour: number; minute: number }> = [];
  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < 24) {
    fireTimes.push({ hour: currentHour, minute: currentMin });
    currentHour += intervalHours;
  }

  // If start time is past today, skip to tomorrow
  const now = new Date();
  let dayOffset = 0;
  if (fireTimes.length > 0) {
    const firstToday = new Date();
    firstToday.setHours(fireTimes[0].hour, fireTimes[0].minute, 0, 0);
    if (firstToday <= now) {
      dayOffset = 1;
    }
  }

  for (const ft of fireTimes) {
    const triggerDate = new Date();
    triggerDate.setDate(triggerDate.getDate() + dayOffset);
    triggerDate.setHours(ft.hour, ft.minute, 0, 0);

    // Skip if more than 60 days out
    const sixtyDaysOut = new Date();
    sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60);
    if (triggerDate > sixtyDaysOut) continue;

    // Check quiet hours
    const timeStr = `${String(ft.hour).padStart(2, '0')}:${String(ft.minute).padStart(2, '0')}`;
    if (isInQuietHours(timeStr, preferences.quiet_hr_start, preferences.quiet_hr_end)) continue;

    const notificationId = `${getNotificationId(reminder.reminder_id, schedule.reminder_schedule_id)}_${ft.hour}${String(ft.minute).padStart(2, '0')}`;
    const versionedChannelId = getVersionedChannelId(meta.channel);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: pickRandom(TITLE_POOL[reminder.category] || TITLE_POOL.general),
        body: pickRandom(BODY_POOL[reminder.category] || BODY_POOL.general)(reminder),
        android: {
          channelId: versionedChannelId,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          smallIcon: 'ic_launcher',
          color: meta.color,
          sound: 'default',
          pressAction: { id: 'default' },
          style: reminder.description
            ? { type: AndroidStyle.BIGTEXT, text: reminder.description }
            : undefined,
          showTimestamp: true,
          timestamp: triggerDate.getTime(),
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
}

/**
 * Schedules a single notification for daily/weekly/monthly/once reminders.
 */
async function scheduleSingleNotification(
  reminder: Reminder,
  schedule: ReminderSchedule,
  preferences: NotificationPreferences,
  meta: { label: string; icon: string; color: string; channel: string },
): Promise<void> {
  // Check quiet hours
  if (isInQuietHours(schedule.notify_at, preferences.quiet_hr_start, preferences.quiet_hr_end)) {
    return;
  }

  const [hours, minutes] = schedule.notify_at.split(':').map(Number);
  const now = new Date();

  let triggerDate: Date;

  if (!reminder.repeat) {
    // One-shot: fire on start_date at the specified time
    const [sy, sm, sd] = reminder.start_date.split('-').map(Number);
    triggerDate = new Date(sy, sm - 1, sd, hours, minutes, 0, 0);
    // If the intended fire time already passed, skip
    if (triggerDate <= now) return;
  } else {
    // Repeating: fire starting today/tomorrow
    triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    // For recurring with weekdays, find the next applicable weekday
    if (schedule.weekdays && schedule.weekdays.length > 0) {
      let maxDaysAhead = 7;
      while (!shouldFireOnWeekday(schedule.weekdays, triggerDate) && maxDaysAhead > 0) {
        triggerDate.setDate(triggerDate.getDate() + 1);
        maxDaysAhead--;
      }
    }
  }

  // Don't schedule more than 60 days out
  const sixtyDaysOut = new Date();
  sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60);
  if (triggerDate > sixtyDaysOut) return;

  const notificationId = getNotificationId(reminder.reminder_id, schedule.reminder_schedule_id);
  const versionedChannelId = getVersionedChannelId(meta.channel);

  // Determine repeat frequency based on schedule repeat_type
  let repeatFrequency: RepeatFrequency | undefined;
  if (reminder.repeat) {
    switch (schedule.repeat_type) {
      case 'daily':
        // Daily with no weekday filter = native daily repeat
        repeatFrequency = (!schedule.weekdays || schedule.weekdays.length === 0)
          ? RepeatFrequency.DAILY
          : undefined;
        break;
      case 'weekly':
        repeatFrequency = RepeatFrequency.WEEKLY;
        break;
      case 'monthly':
        // No native monthly repeat in notifee — fire once and reschedule on app start
        repeatFrequency = undefined;
        break;
      case 'interval':
        // interval with days/weeks/months unit — use native repeat where possible
        if (schedule.interval_unit === 'days') {
          repeatFrequency = schedule.repeat_interval === 1
            ? RepeatFrequency.DAILY
            : undefined; // multi-day intervals can't use native repeat, fire once per cycle
        } else if (schedule.interval_unit === 'weeks') {
          repeatFrequency = RepeatFrequency.WEEKLY;
        }
        // months: no native monthly repeat in notifee, fire once and reschedule on app start
        break;
      default:
        repeatFrequency = undefined;
    }
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: triggerDate.getTime(),
    repeatFrequency,
  };

  await notifee.createTriggerNotification(
    {
      id: notificationId,
      title: pickRandom(TITLE_POOL[reminder.category] || TITLE_POOL.general),
      body: pickRandom(BODY_POOL[reminder.category] || BODY_POOL.general)(reminder),
      android: {
        channelId: versionedChannelId,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: 'ic_launcher',
        color: meta.color,
        sound: 'default',
        pressAction: { id: 'default' },
        style: reminder.description
          ? { type: AndroidStyle.BIGTEXT, text: reminder.description }
          : undefined,
        showTimestamp: true,
        timestamp: triggerDate.getTime(),
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
 * Handles both regular IDs (reminder_X_Y) and interval IDs (reminder_X_Y_HHMM).
 */
export async function cancelAllReminderNotifications(reminderId: number): Promise<void> {
  const prefix = `reminder_${reminderId}_`;
  const notifications = await notifee.getTriggerNotifications();
  for (const notification of notifications) {
    if (notification.notification.id?.startsWith(prefix)) {
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
 * Returns the set of notification IDs currently scheduled at the OS level.
 */
async function getCurrentlyScheduledIds(): Promise<Set<string>> {
  const triggered = await notifee.getTriggerNotifications();
  const ids = new Set<string>();
  for (const t of triggered) {
    if (t.notification.id) ids.add(t.notification.id);
  }
  return ids;
}

/**
 * Generates the notification IDs that SHOULD be scheduled
 * for a given reminder+schedule combination.
 */
function getExpectedNotificationIds(reminder: Reminder, schedule: ReminderSchedule): string[] {
  const ids: string[] = [];

  // For one-shots: if start_date is in the past, the notification already fired
  if (!reminder.repeat) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(reminder.start_date + 'T00:00:00');
    if (startDate < today) return [];
  }

  if (schedule.repeat_type === 'interval' && schedule.interval_unit === 'hours') {
    const [startHour, startMin] = schedule.notify_at.split(':').map(Number);
    const min = String(startMin).padStart(2, '0');
    const intervalHours = schedule.repeat_interval || 1;
    let currentHour = startHour;
    while (currentHour < 24) {
      ids.push(`${getNotificationId(reminder.reminder_id, schedule.reminder_schedule_id)}_${currentHour}${min}`);
      currentHour += intervalHours;
    }
  } else {
    ids.push(getNotificationId(reminder.reminder_id, schedule.reminder_schedule_id));
  }

  return ids;
}

/**
 * Smart sync: compares what's scheduled at the OS level with what should be scheduled.
 * Only adds missing notifications and removes stale ones.
 * Does NOT cancel notifications that are already correctly scheduled.
 *
 * Safe to call on every app open — won't nuke pending notifications.
 */
export async function syncNotifications(
  reminders: Reminder[],
  schedulesMap: Map<number, ReminderSchedule[]>,
  preferences: NotificationPreferences,
): Promise<void> {
  if (!preferences.push_enabled || !preferences.local_enabled) {
    await cancelAllNotifications();
    return;
  }

  const scheduledIds = await getCurrentlyScheduledIds();
  const expectedIds = new Set<string>();

  // Calculate what should be scheduled
  for (const reminder of reminders) {
    const reminderSchedules = schedulesMap.get(reminder.reminder_id) || [];
    for (const schedule of reminderSchedules) {
      if (!schedule.enabled) continue;

      const ids = getExpectedNotificationIds(reminder, schedule);
      for (const id of ids) {
        expectedIds.add(id);
      }
    }
  }

  // Remove stale notifications (no longer in reminders/schedules)
  for (const scheduledId of scheduledIds) {
    if (!expectedIds.has(scheduledId)) {
      await notifee.cancelNotification(scheduledId);
    }
  }

  // Add missing notifications (new reminders/schedules added while app was closed)
  for (const reminder of reminders) {
    const reminderSchedules = schedulesMap.get(reminder.reminder_id) || [];
    for (const schedule of reminderSchedules) {
      const ids = getExpectedNotificationIds(reminder, schedule);
      if (ids.length === 0) continue; // expired one-shot or disabled
      const alreadyScheduled = ids.every(id => scheduledIds.has(id));

      if (!alreadyScheduled) {
        try {
          await scheduleReminderNotification(reminder, schedule, preferences);
        } catch (error) {
          console.error(`[NotificationService] sync failed for reminder ${reminder.reminder_id}, schedule ${schedule.reminder_schedule_id}:`, error);
        }
      }
    }
  }
}

/**
 * Reschedules notifications for a single reminder.
 * Cancels existing notifications for this reminder, then re-schedules.
 * Used when a specific reminder is added/edited/removed.
 */
export async function rescheduleReminderNotifications(
  reminder: Reminder,
  schedules: ReminderSchedule[],
  preferences: NotificationPreferences,
): Promise<void> {
  await cancelAllReminderNotifications(reminder.reminder_id);

  if (!preferences.push_enabled || !preferences.local_enabled) return;

  for (const schedule of schedules) {
    try {
      await scheduleReminderNotification(reminder, schedule, preferences);
    } catch (error) {
      console.error(`[NotificationService] Failed to reschedule notification for reminder ${reminder.reminder_id}, schedule ${schedule.reminder_schedule_id}:`, error);
    }
  }
}

/**
 * Reschedules all notifications for a user based on their reminders and preferences.
 * NUCLEAR option — cancels everything and reschedules.
 * Only use for force-refresh scenarios.
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
  const baseChannel = CATEGORY_META[category as keyof typeof CATEGORY_META]?.channel || 'general';
  return getVersionedChannelId(baseChannel);
}

// ── Appointment Notifications ──────────────────────────────

function getApptNotificationId(appointmentId: number, suffix: string): string {
  return `appt_${appointmentId}_${suffix}`;
}

/**
 * Schedules up to 4 notifications for an appointment:
 * 1 day before (if remind_1d), 2 hours before (if remind_2h),
 * at custom time (if remind_custom), and at appointment time (always).
 */
export async function scheduleAppointmentNotifications(appointment: Appointment): Promise<void> {
  const channelId = getVersionedChannelId('appointment');
  const now = Date.now();
  const apptTime = new Date(appointment.date_with_time).getTime();

  const notifications: Array<{ id: string; timestamp: number; suffix: string }> = [];

  // 1 day before
  if (appointment.remind_1d) {
    const ts = apptTime - 24 * 60 * 60 * 1000;
    if (ts > now && ts - now > 1000) {
      notifications.push({ id: getApptNotificationId(appointment.appointment_id, '1d'), timestamp: ts, suffix: '1d' });
    }
  }

  // 2 hours before
  if (appointment.remind_2h) {
    const ts = apptTime - 2 * 60 * 60 * 1000;
    if (ts > now && ts - now > 1000) {
      notifications.push({ id: getApptNotificationId(appointment.appointment_id, '2h'), timestamp: ts, suffix: '2h' });
    }
  }

  // Custom time
  if (appointment.remind_custom) {
    const ts = new Date(appointment.remind_custom).getTime();
    if (ts > now && ts - now > 1000 && ts < apptTime) {
      notifications.push({ id: getApptNotificationId(appointment.appointment_id, 'custom'), timestamp: ts, suffix: 'custom' });
    }
  }

  // At appointment time (always)
  if (apptTime > now && apptTime - now > 1000) {
    notifications.push({ id: getApptNotificationId(appointment.appointment_id, 'now'), timestamp: apptTime, suffix: 'now' });
  }

  for (const n of notifications) {
    try {
      const isNow = n.suffix === 'now';
      await notifee.createTriggerNotification(
        {
          id: n.id,
          title: isNow
            ? '📅 Time for your appointment!'
            : n.suffix === '1d'
              ? '📅 Appointment tomorrow!'
              : n.suffix === '2h'
                ? '📅 Appointment in 2 hours!'
                : '📅 Appointment reminder!',
          body: getApptBody(appointment, n.suffix),
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            smallIcon: 'ic_launcher',
            color: '#00E5CC',
            sound: 'default',
            pressAction: { id: 'default' },
            showTimestamp: true,
            timestamp: n.timestamp,
          },
          data: {
            appointmentId: appointment.appointment_id,
            screen: 'reminders-appointments',
          },
        },
        { type: TriggerType.TIMESTAMP, timestamp: n.timestamp },
      );
    } catch (err) {
      console.error(`[NotificationService] Failed to schedule appointment notification ${n.id}:`, err);
    }
  }
}

/**
 * Cancels all notifications for a specific appointment.
 */
export async function cancelAppointmentNotifications(appointmentId: number): Promise<void> {
  const suffixes = ['1d', '2h', 'custom', 'now'];
  for (const suffix of suffixes) {
    await notifee.cancelNotification(getApptNotificationId(appointmentId, suffix));
  }
}

/**
 * Fires an immediate test notification to verify sound, vibration, and display.
 */
export async function sendTestNotification(): Promise<void> {
  const channelId = getVersionedChannelId('general');

  await notifee.displayNotification({
    title: '🔔 Test Notification',
    body: 'If you can hear a sound and see this banner — notifications are working!',
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      smallIcon: 'ic_launcher',
      color: '#00E5CC',
      pressAction: { id: 'default' },
      style: {
        type: AndroidStyle.BIGTEXT,
        text: 'If you can hear a sound and see this banner — notifications are working! You can customize categories in the Reminders tab.',
      },
      showTimestamp: true,
      timestamp: Date.now(),
    },
    ios: {
      sound: 'default',
    },
  });
}
