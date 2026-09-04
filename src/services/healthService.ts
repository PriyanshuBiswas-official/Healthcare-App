import { API_BASE_URL } from '../config/api';
import type {
  MoodLog,
  DischargeLog,
  SymptomsLog,
  PeriodLog,
  CycleInsight,
  CycleData,
  CycleHistoryEntry,
  SleepLog,
  WeightEntry,
} from '../types/health';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ── Period Logs ──────────────────────────────────────────

export async function getPeriodLogs(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<PeriodLog[]> {
  let query = '';
  if (startDate && endDate) {
    query = `?startDate=${startDate}&endDate=${endDate}`;
  } else if (startDate) {
    query = `?date=${startDate}`;
  }
  const res = await fetch(`${API_BASE_URL}/api/logs${query}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch period logs');
  return json.data;
}

export async function savePeriodLog(
  token: string,
  log: {
    date: string;
    period_start_date?: string;
    flow_intensity?: string;
    day_no?: number;
    Flow_color?: string;
    cramps?: string;
    clots?: string;
  },
): Promise<PeriodLog> {
  const res = await fetch(`${API_BASE_URL}/api/logs`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(log),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save period log');
  return json.data;
}

// ── Mood Logs ────────────────────────────────────────────

export async function getMoodLogs(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<MoodLog[]> {
  let query = '';
  if (startDate && endDate) {
    query = `?startDate=${startDate}&endDate=${endDate}`;
  } else if (startDate) {
    query = `?date=${startDate}`;
  }
  const res = await fetch(`${API_BASE_URL}/api/health/mood${query}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch mood logs');
  return json.data;
}

export async function saveMoodLog(
  token: string,
  log: {
    date?: string;
    mood: string;
    energy_level?: string;
    libido?: number;
    focus_level?: number;
    stress?: number;
    stress_level?: number;
  },
): Promise<MoodLog> {
  const res = await fetch(`${API_BASE_URL}/api/health/mood`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(log),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save mood log');
  return json.data;
}

// ── Discharge Logs ───────────────────────────────────────

export async function getDischargeLogs(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<DischargeLog[]> {
  let query = '';
  if (startDate && endDate) {
    query = `?startDate=${startDate}&endDate=${endDate}`;
  } else if (startDate) {
    query = `?date=${startDate}`;
  }
  const res = await fetch(`${API_BASE_URL}/api/health/discharge${query}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch discharge logs');
  return json.data;
}

export async function saveDischargeLog(
  token: string,
  log: {
    date?: string;
    discharge_type?: string;
    texture?: string;
    color?: string;
    amount?: number;
  },
): Promise<DischargeLog> {
  const res = await fetch(`${API_BASE_URL}/api/health/discharge`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(log),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save discharge log');
  return json.data;
}

// ── Symptoms Logs ────────────────────────────────────────

export async function getSymptomsLogs(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<SymptomsLog[]> {
  let query = '';
  if (startDate && endDate) {
    query = `?startDate=${startDate}&endDate=${endDate}`;
  } else if (startDate) {
    query = `?date=${startDate}`;
  }
  const res = await fetch(`${API_BASE_URL}/api/health/symptoms${query}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch symptoms logs');
  return json.data;
}

export async function saveSymptomsLog(
  token: string,
  log: {
    date?: string;
    symptoms: Array<{ symptom: string; severity: number }>;
  },
): Promise<SymptomsLog> {
  const res = await fetch(`${API_BASE_URL}/api/health/symptoms`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(log),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save symptoms log');
  return json.data;
}

// ── Insights ─────────────────────────────────────────────

export async function getInsights(token: string): Promise<CycleInsight[]> {
  const res = await fetch(`${API_BASE_URL}/api/insights`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch insights');
  return json.data;
}

// ── Cycle Data ───────────────────────────────────────────

export async function getLatestCycle(token: string): Promise<CycleData | null> {
  const res = await fetch(`${API_BASE_URL}/api/cycle`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch cycle');
  return json.data;
}

export async function getCycleHistory(token: string): Promise<CycleHistoryEntry[]> {
  const res = await fetch(`${API_BASE_URL}/api/cycle/history`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch cycle history');
  return json.data ?? [];
}

export async function saveCycle(
  token: string,
  cycle: {
    start_date: string;
    cycle_length?: number;
    avg_cycle_length?: number;
    period_length?: number;
    regularity?: string;
  },
): Promise<CycleData> {
  const res = await fetch(`${API_BASE_URL}/api/cycle`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(cycle),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save cycle');
  return json.data;
}

export async function updateCycle(
  token: string,
  cycle: {
    cycle_id: number;
    start_date?: string;
    cycle_length?: number;
    avg_cycle_length?: number;
    period_length?: number;
    regularity?: string;
  },
): Promise<CycleData> {
  const res = await fetch(`${API_BASE_URL}/api/cycle`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(cycle),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update cycle');
  return json.data;
}

// ── Sleep Logs ──────────────────────────────────────

export async function getSleepLogs(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<SleepLog[]> {
  let query = '';
  if (startDate && endDate) {
    query = `?startDate=${startDate}&endDate=${endDate}`;
  } else if (startDate) {
    query = `?date=${startDate}`;
  }
  const res = await fetch(`${API_BASE_URL}/api/health/sleep${query}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch sleep logs');
  return json.data;
}

export async function saveSleepLog(
  token: string,
  log: {
    date?: string;
    sleep_hr: number;
    sleep_quality?: number;
    notes?: string;
  },
): Promise<SleepLog> {
  const res = await fetch(`${API_BASE_URL}/api/health/sleep`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(log),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save sleep log');
  return json.data;
}

// ── Weight Logs ──────────────────────────────────────

export async function getWeightLogs(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<WeightEntry[]> {
  let query = '';
  if (startDate && endDate) {
    query = `?startDate=${startDate}&endDate=${endDate}`;
  } else if (startDate) {
    query = `?date=${startDate}`;
  }
  const res = await fetch(`${API_BASE_URL}/api/weight${query}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch weight logs');
  return json.data ?? [];
}

export async function saveWeightLog(
  token: string,
  log: {
    date?: string;
    weight_kg: number;
  },
): Promise<WeightEntry> {
  const res = await fetch(`${API_BASE_URL}/api/weight`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(log),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save weight log');
  return json.data;
}
