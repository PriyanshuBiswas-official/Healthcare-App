import { API_BASE_URL } from '../config/api';
import type { ActivitySummary, TodayWorkout, WeeklyData, PersonalRecord, ActivityGoal, WorkoutPlanDays } from '../types/activity';

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

export async function getCurrentWorkoutPlanDays(token: string): Promise<WorkoutPlanDays> {
  const res = await fetch(`${API_BASE_URL}/api/activity/plan/current-days`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch workout plan days');
  return json.data;
}

export interface AddExerciseInput {
  plan_day_id: number;
  exercise_name: string;
  exercise_order?: number;
  sets?: number;
  reps?: number;
  rest?: number;
  target_weight?: number;
}

export async function addExerciseToDay(token: string, data: AddExerciseInput): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/activity/plan/exercise`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to add exercise');
  return json.data;
}

export interface UpdateExerciseInput {
  exercise_id: number;
  exercise_name?: string;
  exercise_order?: number;
  sets?: number;
  reps?: number;
  rest?: number;
  target_weight?: number;
}

export async function updateExercise(token: string, data: UpdateExerciseInput): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/activity/plan/exercise`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update exercise');
  return json.data;
}

export async function deleteExercise(token: string, exerciseId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/activity/plan/exercise/${exerciseId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete exercise');
}

// ── Activity Goals ─────────────────────────────────────────

export async function getActivityGoal(token: string): Promise<ActivityGoal | null> {
  const res = await fetch(`${API_BASE_URL}/api/activity/goal`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch activity goal');
  return json.data || null;
}

export async function saveActivityGoal(token: string, goal: { calorie_burn_goal?: number; exercise_min_goal?: number; steps_goal?: number }): Promise<ActivityGoal> {
  const res = await fetch(`${API_BASE_URL}/api/activity/goal`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(goal),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save activity goal');
  return json.data;
}

// ── Activity Log ───────────────────────────────────────────

export interface ActivityLogInput {
  distance?: number;
  calories_burnt?: number;
  other_activities?: string;
  other_act_calorie_burn?: number;
}

export async function logActivity(token: string, data: ActivityLogInput): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/activity/log`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to log activity');
  return json.data;
}

// ── Workout Set Log ───────────────────────────────────────

export async function logWorkoutSet(token: string, data: { exercise_id: number; set_no: number; weight: number; reps: number }): Promise<{ data: any; completed: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/activity/log-set`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || json.error || 'Failed to log set');
  return { data: json.data, completed: json.completed || false };
}

export async function editWorkoutSet(token: string, setId: number, data: { weight?: number; reps?: number }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/activity/log-set/${setId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to edit set');
  return json.data;
}
