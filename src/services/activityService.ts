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
    equipment?: string;
    muscle_group?: string;
    exercise_type?: string;
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

export interface LogPRInput {
  exercise_id: number;
  weight: number;
  reps: number;
  description?: string;
  achieved_at?: string;
}

export async function createPersonalRecord(token: string, data: LogPRInput): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/activity/prs`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to log PR');
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

export async function deleteWorkoutPlan(token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/activity/plan`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete workout plan');
}

export async function activateLibraryPlan(token: string, libraryPlanId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/activity/plan/activate`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ library_plan_id: libraryPlanId }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to activate library plan');
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
  equipment?: string;
  muscle_group?: string;
  other_muscles?: string[];
  exercise_type?: string;
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
  equipment?: string;
  muscle_group?: string;
  exercise_type?: string;
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
  active_min?: number;
  calories_burnt?: number;
  other_activities?: string;
  other_act_calorie_burn?: number;
}

export async function getTodayActivityLog(token: string, date: string): Promise<ActivityLogInput | null> {
  const res = await fetch(`${API_BASE_URL}/api/activity/log/today?date=${date}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch activity log');
  return json.data || null;
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

export interface LogWorkoutSetResult {
  data: any;
  completed: boolean;
  is_new_pr?: boolean;
  previous_pr?: { weight: number; reps: number };
  new_record?: { weight: number; reps: number };
}

export async function logWorkoutSet(
  token: string,
  data: { exercise_id: number; set_no: number; weight: number; reps: number }
): Promise<LogWorkoutSetResult> {
  const res = await fetch(`${API_BASE_URL}/api/activity/log-set`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || json.error || 'Failed to log set');
  return {
    data: json.data,
    completed: json.completed || false,
    is_new_pr: json.is_new_pr,
    previous_pr: json.previous_pr,
    new_record: json.new_record,
  };
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

export interface ExerciseProgressPoint {
  date: string;
  max_weight?: number;
  total_reps?: number;
  max_reps?: number;
  total_volume?: number;
  value?: number;
}

export async function getExerciseProgress(token: string, exerciseId: number): Promise<ExerciseProgressPoint[]> {
  const res = await fetch(`${API_BASE_URL}/api/activity/exercise-progress/${exerciseId}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch exercise progress');
  return json.data;
}
