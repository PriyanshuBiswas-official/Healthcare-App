import { API_BASE_URL, fetchWithTimeout } from '../config/api';
import type {
  Reminder, ReminderSchedule, NotificationPreferences,
  CreateReminderPayload, UpdateReminderPayload,
  CreateSchedulePayload, UpdateSchedulePayload, UpdatePreferencesPayload,
} from '../types/reminder';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ── Reminders ──────────────────────────────────────────────

export async function getReminders(token: string): Promise<Reminder[]> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to fetch reminders');
  return json.data;
}

export async function getReminderById(token: string, id: number): Promise<Reminder> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders/${id}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to fetch reminder');
  return json.data;
}

export async function createReminder(token: string, payload: CreateReminderPayload): Promise<Reminder> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to create reminder');
  return json.data;
}

export async function updateReminder(token: string, id: number, payload: UpdateReminderPayload): Promise<Reminder> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to update reminder');
  return json.data;
}

export async function deleteReminder(token: string, id: number): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to delete reminder');
}

export async function toggleReminder(token: string, id: number, enabled: boolean): Promise<ReminderSchedule[]> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders/${id}/toggle`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ enabled }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to toggle reminder');
  return json.data;
}

// ── Schedules ──────────────────────────────────────────────

export async function getSchedules(token: string, reminderId: number): Promise<ReminderSchedule[]> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders/${reminderId}/schedules`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to fetch schedules');
  return json.data;
}

export async function addSchedule(token: string, reminderId: number, payload: CreateSchedulePayload): Promise<ReminderSchedule> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders/${reminderId}/schedules`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to add schedule');
  return json.data;
}

export async function updateSchedule(token: string, scheduleId: number, payload: UpdateSchedulePayload): Promise<ReminderSchedule> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders/schedules/${scheduleId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to update schedule');
  return json.data;
}

export async function deleteSchedule(token: string, scheduleId: number): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to delete schedule');
}

// ── Notification Preferences ───────────────────────────────

export async function getPreferences(token: string): Promise<NotificationPreferences> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/notifications/preferences`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to fetch preferences');
  return json.data;
}

export async function updatePreferences(token: string, payload: UpdatePreferencesPayload): Promise<NotificationPreferences> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/notifications/preferences`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to update preferences');
  return json.data;
}
