export type ReminderCategory = 'medication' | 'water' | 'workout' | 'nutrition' | 'sleep' | 'health' | 'appointment' | 'general';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RepeatType = 'daily' | 'weekly' | 'interval' | 'monthly';

export type IntervalUnit = 'hours' | 'days' | 'weeks' | 'months';

export interface Reminder {
  reminder_id: number;
  user_id: number;
  title: string;
  description: string | null;
  category: ReminderCategory;
  timezone: string | null;
  repeat: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ReminderSchedule {
  reminder_schedule_id: number;
  reminder_id: number;
  notify_at: string;
  weekdays: Weekday[] | null;
  enabled: boolean;
  repeat_type: RepeatType | null;
  repeat_interval: number;
  interval_unit: IntervalUnit | null;
  created_at: string;
  updated_at: string | null;
}

export interface NotificationPreferences {
  notification_id: number;
  user_id: number;
  push_enabled: boolean;
  local_enabled: boolean;
  vibration_enabled: boolean;
  sound_enabled: boolean;
  quiet_hr_start: string;
  quiet_hr_end: string;
  created_at: string;
}

export interface CreateReminderPayload {
  category: ReminderCategory;
  title: string;
  description?: string;
  start_date: string;
  repeat?: boolean;
}

export interface UpdateReminderPayload {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  repeat?: boolean;
}

export interface CreateSchedulePayload {
  notify_at: string;
  weekdays?: Weekday[];
  enabled?: boolean;
  repeat_type?: RepeatType | null;
  repeat_interval?: number;
  interval_unit?: IntervalUnit | null;
}

export interface UpdateSchedulePayload {
  notify_at?: string;
  weekdays?: Weekday[];
  enabled?: boolean;
  repeat_type?: RepeatType | null;
  repeat_interval?: number;
  interval_unit?: IntervalUnit | null;
}

export interface UpdatePreferencesPayload {
  push_enabled?: boolean;
  local_enabled?: boolean;
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
  quiet_hr_start?: string;
  quiet_hr_end?: string;
}

export const CATEGORY_META: Record<ReminderCategory, { label: string; icon: string; color: string; channel: string }> = {
  medication: { label: 'Medications', icon: 'Pill', color: '#FFB347', channel: 'medication' },
  water: { label: 'Water', icon: 'Droplets', color: '#3B82F6', channel: 'water' },
  workout: { label: 'Workouts', icon: 'Dumbbell', color: '#FF4D8D', channel: 'workout' },
  nutrition: { label: 'Nutrition', icon: 'Apple', color: '#00E5A0', channel: 'nutrition' },
  sleep: { label: 'Sleep', icon: 'Moon', color: '#A78BFA', channel: 'sleep' },
  health: { label: 'Health', icon: 'Heart', color: '#FF5E5E', channel: 'health' },
  appointment: { label: 'Appointments', icon: 'Calendar', color: '#00E5CC', channel: 'appointment' },
  general: { label: 'General', icon: 'Bell', color: '#8B92B4', channel: 'general' },
};
