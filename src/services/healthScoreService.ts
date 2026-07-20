import { API_BASE_URL } from '../config/api';
import type { HealthScore, DashboardHealthScore } from '../types/health';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function getDashboardHealthScore(token: string): Promise<DashboardHealthScore> {
  const res = await fetch(`${API_BASE_URL}/api/health/score/dashboard`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch health score');
  return json.data;
}

export async function getTodayHealthScore(token: string): Promise<HealthScore | null> {
  const res = await fetch(`${API_BASE_URL}/api/health/score/today`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch today health score');
  return json.data;
}

export async function getHealthScoreRange(
  token: string,
  startDate: string,
  endDate: string,
): Promise<HealthScore[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/health/score/range?startDate=${startDate}&endDate=${endDate}`,
    { headers: authHeaders(token) },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch health score range');
  return json.data;
}
