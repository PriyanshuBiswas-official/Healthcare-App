import { API_BASE_URL, fetchWithTimeout } from '../config/api';
import type { Reminder, ReminderSchedule } from './reminder';

export interface Medication {
  id: number;
  user_id: number;
  name: string;
  dosage: string | null;
  frequency: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  reminder_id: number | null;
  created_at: string;
  reminder: Reminder | null;
  schedules: ReminderSchedule[];
}

export interface CreateMedicationPayload {
  name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateMedicationPayload {
  name?: string;
  dosage?: string | null;
  frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

export interface MedicationReminderPayload {
  times: string[];
  repeat: boolean;
  weekdays?: number[];
  description?: string;
  start_date?: string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ── Medications CRUD ───────────────────────────────────────

export async function getMedications(token: string): Promise<Medication[]> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/medications`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to fetch medications');
  return json.data;
}

export async function getMedicationById(token: string, id: number): Promise<Medication> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/medications/${id}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to fetch medication');
  return json.data;
}

export async function createMedication(token: string, payload: CreateMedicationPayload): Promise<Medication> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/medications`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to create medication');
  return json.data;
}

export async function updateMedication(token: string, id: number, payload: UpdateMedicationPayload): Promise<Medication> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/medications/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to update medication');
  return json.data;
}

export async function deleteMedication(token: string, id: number): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/medications/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to delete medication');
}

// ── Medication Reminders ───────────────────────────────────

export async function createMedicationReminder(
  token: string,
  medicationId: number,
  payload: MedicationReminderPayload,
): Promise<Medication> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/medications/${medicationId}/reminder`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to create reminder');
  return json.data;
}

export async function updateMedicationReminder(
  token: string,
  medicationId: number,
  payload: MedicationReminderPayload,
): Promise<Medication> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/medications/${medicationId}/reminder`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to update reminder');
  return json.data;
}

export async function deleteMedicationReminder(token: string, medicationId: number): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/medications/${medicationId}/reminder`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to delete reminder');
}

// ── Toggle (reuses existing reminders endpoint) ────────────

export async function toggleMedicationReminder(
  token: string,
  reminderId: number,
  enabled: boolean,
): Promise<ReminderSchedule[]> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/reminders/${reminderId}/toggle`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ enabled }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to toggle reminder');
  return json.data;
}
