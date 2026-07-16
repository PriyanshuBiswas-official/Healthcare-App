import { API_BASE_URL, fetchWithTimeout } from '../config/api';
import type { Appointment, CreateAppointmentPayload, UpdateAppointmentPayload, AppointmentStatus } from '../types/appointment';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function getAppointments(token: string): Promise<Appointment[]> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/appointments`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to fetch appointments');
  return json.data;
}

export async function getAppointmentById(token: string, id: number): Promise<Appointment> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/appointments/${id}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to fetch appointment');
  return json.data;
}

export async function createAppointment(token: string, payload: CreateAppointmentPayload): Promise<Appointment> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to create appointment');
  return json.data;
}

export async function updateAppointment(token: string, id: number, payload: UpdateAppointmentPayload): Promise<Appointment> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/appointments/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to update appointment');
  return json.data;
}

export async function deleteAppointment(token: string, id: number): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/appointments/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to delete appointment');
}

export async function updateAppointmentStatus(token: string, id: number, status: AppointmentStatus): Promise<Appointment> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/appointments/${id}/status`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || json.message || 'Failed to update appointment status');
  return json.data;
}
