import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
  getSchedules,
  addSchedule,
  deleteSchedule,
  getPreferences,
  updatePreferences,
} from '../services/reminderApi';
import {
  createNotificationChannels,
  requestNotificationPermission,
  syncNotifications,
  rescheduleReminderNotifications,
  cancelAllReminderNotifications,
} from '../services/notificationService';
import type {
  Reminder,
  ReminderSchedule,
  NotificationPreferences,
  CreateReminderPayload,
  UpdateReminderPayload,
  CreateSchedulePayload,
  UpdatePreferencesPayload,
  ReminderCategory,
} from '../types/reminder';

type ReminderContextType = {
  reminders: Reminder[];
  schedules: Map<number, ReminderSchedule[]>;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Reminder CRUD
  fetchReminders: () => Promise<void>;
  addReminder: (payload: CreateReminderPayload) => Promise<Reminder>;
  editReminder: (id: number, payload: UpdateReminderPayload) => Promise<Reminder>;
  removeReminder: (id: number) => Promise<void>;
  toggleEnabled: (id: number, enabled: boolean) => Promise<void>;

  // Schedule management
  fetchSchedules: (reminderId: number) => Promise<ReminderSchedule[]>;
  addReminderSchedule: (reminderId: number, payload: CreateSchedulePayload, reminder?: Reminder) => Promise<ReminderSchedule>;
  removeSchedule: (scheduleId: number, reminderId: number) => Promise<void>;

  // Preferences
  fetchPreferences: () => Promise<void>;
  savePreferences: (payload: UpdatePreferencesPayload) => Promise<void>;

  // Full sync
  syncAll: () => Promise<void>;

  // Helpers
  getSchedulesForReminder: (reminderId: number) => ReminderSchedule[];
  getRemindersByCategory: (category: ReminderCategory) => Reminder[];
};

const ReminderContext = createContext<ReminderContextType>({
  reminders: [],
  schedules: new Map(),
  preferences: null,
  isLoading: false,
  isSyncing: false,
  error: null,
  fetchReminders: async () => {},
  addReminder: async () => ({} as Reminder),
  editReminder: async () => ({} as Reminder),
  removeReminder: async () => {},
  toggleEnabled: async () => {},
  fetchSchedules: async () => [],
  addReminderSchedule: async () => ({} as ReminderSchedule),
  removeSchedule: async () => {},
  fetchPreferences: async () => {},
  savePreferences: async () => {},
  syncAll: async () => {},
  getSchedulesForReminder: () => [],
  getRemindersByCategory: () => [],
});

export function useReminders() {
  return useContext(ReminderContext);
}

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const token = session?.access_token || '';

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schedules, setSchedules] = useState<Map<number, ReminderSchedule[]>>(new Map());
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize notification channels on mount
  useEffect(() => {
    createNotificationChannels();
    requestNotificationPermission();
  }, []);

  // ── Reminder CRUD ──────────────────────────────────────

  const fetchReminders = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await getReminders(token);
      setReminders(data);
    } catch (err: any) {
      console.error('[ReminderContext] fetchReminders error:', err);
      setError(err.message);
    }
  }, [token]);

  const addReminder = useCallback(async (payload: CreateReminderPayload): Promise<Reminder> => {
    if (!token) throw new Error('Not authenticated');
    const reminder = await createReminder(token, payload);
    setReminders(prev => [reminder, ...prev]);
    return reminder;
  }, [token]);

  const editReminder = useCallback(async (id: number, payload: UpdateReminderPayload): Promise<Reminder> => {
    if (!token) throw new Error('Not authenticated');
    const reminder = await updateReminder(token, id, payload);
    setReminders(prev => prev.map(r => r.reminder_id === id ? reminder : r));
    return reminder;
  }, [token]);

  const removeReminder = useCallback(async (id: number): Promise<void> => {
    if (!token) throw new Error('Not authenticated');
    await deleteReminder(token, id);
    setReminders(prev => prev.filter(r => r.reminder_id !== id));
    setSchedules(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    await cancelAllReminderNotifications(id);
  }, [token]);

  const toggleEnabled = useCallback(async (id: number, enabled: boolean): Promise<void> => {
    if (!token) throw new Error('Not authenticated');
    const updatedSchedules = await toggleReminder(token, id, enabled);
    setSchedules(prev => {
      const next = new Map(prev);
      next.set(id, updatedSchedules);
      return next;
    });
  }, [token]);

  // ── Schedule Management ────────────────────────────────

  const fetchSchedules = useCallback(async (reminderId: number): Promise<ReminderSchedule[]> => {
    if (!token) return [];
    try {
      const data = await getSchedules(token, reminderId);
      setSchedules(prev => {
        const next = new Map(prev);
        next.set(reminderId, data);
        return next;
      });
      return data;
    } catch (err: any) {
      console.error('[ReminderContext] fetchSchedules error:', err);
      return [];
    }
  }, [token]);

  const addReminderSchedule = useCallback(async (reminderId: number, payload: CreateSchedulePayload, reminder?: Reminder): Promise<ReminderSchedule> => {
    if (!token) throw new Error('Not authenticated');
    const schedule = await addSchedule(token, reminderId, payload);
    setSchedules(prev => {
      const next = new Map(prev);
      const existing = next.get(reminderId) || [];
      next.set(reminderId, [...existing, schedule]);
      return next;
    });
    // Re-schedule notifications for this reminder
    const reminderObj = reminder || reminders.find(r => r.reminder_id === reminderId);
    if (reminderObj && preferences) {
      const updatedSchedules = [...(schedules.get(reminderId) || []), schedule];
      await rescheduleReminderNotifications(reminderObj, updatedSchedules, preferences);
    }
    return schedule;
  }, [token, reminders, schedules, preferences]);

  const removeSchedule = useCallback(async (scheduleId: number, reminderId: number): Promise<void> => {
    if (!token) throw new Error('Not authenticated');
    await deleteSchedule(token, scheduleId);
    setSchedules(prev => {
      const next = new Map(prev);
      const existing = next.get(reminderId) || [];
      next.set(reminderId, existing.filter(s => s.reminder_schedule_id !== scheduleId));
      return next;
    });
    // Re-schedule notifications for this reminder (without the removed schedule)
    const reminderObj = reminders.find(r => r.reminder_id === reminderId);
    if (reminderObj && preferences) {
      const remainingSchedules = (schedules.get(reminderId) || []).filter(s => s.reminder_schedule_id !== scheduleId);
      await rescheduleReminderNotifications(reminderObj, remainingSchedules, preferences);
    }
  }, [token, reminders, schedules, preferences]);

  // ── Preferences ────────────────────────────────────────

  const fetchPreferences = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getPreferences(token);
      setPreferences(data);
    } catch (err: any) {
      console.error('[ReminderContext] fetchPreferences error:', err);
    }
  }, [token]);

  const savePreferences = useCallback(async (payload: UpdatePreferencesPayload): Promise<void> => {
    if (!token) throw new Error('Not authenticated');
    const updated = await updatePreferences(token, payload);
    setPreferences(updated);
  }, [token]);

  // ── Full Sync ──────────────────────────────────────────

  const syncAll = useCallback(async () => {
    if (!token) return;
    try {
      setIsSyncing(true);
      setError(null);

      // 1. Fetch all data from backend
      const [remindersData, prefsData] = await Promise.all([
        getReminders(token),
        getPreferences(token),
      ]);

      setReminders(remindersData);
      setPreferences(prefsData);

      // 2. Fetch schedules for all reminders
      const schedulesMap = new Map<number, ReminderSchedule[]>();
      await Promise.all(
        remindersData.map(async (r) => {
          try {
            const scheds = await getSchedules(token, r.reminder_id);
            schedulesMap.set(r.reminder_id, scheds);
          } catch {
            schedulesMap.set(r.reminder_id, []);
          }
        })
      );
      setSchedules(schedulesMap);

      // 3. Smart sync notifications on device (non-destructive)
      await syncNotifications(remindersData, schedulesMap, prefsData);
    } catch (err: any) {
      console.error('[ReminderContext] syncAll error:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [token]);

  // Auto-sync when token changes (sign-in)
  useEffect(() => {
    if (token) {
      syncAll();
    }
  }, [token]);

  // ── Helpers ────────────────────────────────────────────

  const getSchedulesForReminder = useCallback((reminderId: number): ReminderSchedule[] => {
    return schedules.get(reminderId) || [];
  }, [schedules]);

  const getRemindersByCategory = useCallback((category: ReminderCategory): Reminder[] => {
    return reminders.filter(r => r.category === category);
  }, [reminders]);

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        schedules,
        preferences,
        isLoading,
        isSyncing,
        error,
        fetchReminders,
        addReminder,
        editReminder,
        removeReminder,
        toggleEnabled,
        fetchSchedules,
        addReminderSchedule,
        removeSchedule,
        fetchPreferences,
        savePreferences,
        syncAll,
        getSchedulesForReminder,
        getRemindersByCategory,
      }}>
      {children}
    </ReminderContext.Provider>
  );
}
