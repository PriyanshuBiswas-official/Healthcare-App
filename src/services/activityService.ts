import { API_BASE_URL } from '../config/api';
import type { ActivitySummary, TodayWorkout, WeeklyData, PersonalRecord } from '../types/activity';

export interface PlanDayInput {
  day_no: number;
  day_name: string;
  exercises: {
    exercise_name: string;
    exercise_order: number;
    sets: number;
    reps: number;
    rest?: number | null;
    target_weight?: number | null;
  }[];
}

export interface PlanInput {
  plan_name: string;
  description?: string;
  goal?: string;
  days_per_week: number;
  days: PlanDayInput[];
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getTodaySummary(token: string, date: string): Promise<ActivitySummary> {
  const res = await fetch(`${API_BASE_URL}/api/activity/today?date=${date}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch activity summary');
  return json.data;
}

export async function getTodayWorkout(token: string, date: string): Promise<TodayWorkout> {
  const res = await fetch(`${API_BASE_URL}/api/activity/workout/today?date=${date}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch today workout');
  return json.data;
}

export async function getWeeklyStats(token: string, date: string): Promise<WeeklyData> {
  const res = await fetch(`${API_BASE_URL}/api/activity/weekly?date=${date}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch weekly stats');
  return json.data;
}

export async function getPersonalRecords(token: string): Promise<PersonalRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/activity/prs`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch personal records');
  return json.data;
}

export async function createWorkoutPlan(token: string, plan: PlanInput): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/activity/plan`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(plan),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create workout plan');
  return json.data;
}
