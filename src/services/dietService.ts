import { API_BASE_URL } from '../config/api';
import type {
  NutritionLog,
  WaterLog,
  NutritionGoal,
  DayMealsResponse,
  DayWaterResponse,
  WeeklyTrendDay,
  WaterChallenge,
} from '../types/diet';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ── Meals ─────────────────────────────────────────────────

export async function getMealsForDate(token: string, date: string): Promise<DayMealsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/diet/meals?date=${date}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch meals');
  return json.data;
}

export async function logMeal(
  token: string,
  meal: { food: string; taken_as: string; serving_size?: string; calories?: number; protein?: number; carbs?: number; fiber?: number; fat?: number },
): Promise<NutritionLog> {
  const res = await fetch(`${API_BASE_URL}/api/diet/meals`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(meal),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to log meal');
  return json.data;
}

export async function updateMeal(
  token: string,
  id: number,
  fields: Partial<Pick<NutritionLog, 'food' | 'taken_as' | 'serving_size' | 'calories' | 'protein' | 'carbs' | 'fiber' | 'fat'>>,
): Promise<NutritionLog> {
  const res = await fetch(`${API_BASE_URL}/api/diet/meals/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(fields),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update meal');
  return json.data;
}

export async function deleteMeal(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/diet/meals/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete meal');
}

// ── Water ─────────────────────────────────────────────────

export async function getWaterForDate(token: string, date: string): Promise<DayWaterResponse> {
  const res = await fetch(`${API_BASE_URL}/api/diet/water?date=${date}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch water logs');
  return json.data;
}

export async function logWater(token: string, amountInMl: number): Promise<WaterLog> {
  const res = await fetch(`${API_BASE_URL}/api/diet/water`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ amount_in_ml: amountInMl }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to log water');
  return json.data;
}

export async function deleteWaterLog(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/diet/water/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete water log');
}

export async function getWaterChallenge(token: string, days: number = 5): Promise<WaterChallenge> {
  const res = await fetch(`${API_BASE_URL}/api/diet/water/challenge?days=${days}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch water challenge');
  return json.data;
}

// ── Goals ─────────────────────────────────────────────────

export async function getCalorieGoal(token: string): Promise<NutritionGoal | null> {
  const res = await fetch(`${API_BASE_URL}/api/diet/goal`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch goal');
  return json.data;
}

export async function saveCalorieGoal(
  token: string,
  goals: Partial<Pick<NutritionGoal, 'calorie_goal' | 'water_goal' | 'protein_goal' | 'carbs_goal' | 'fat_goal' | 'fiber_goal'>>,
): Promise<NutritionGoal> {
  const res = await fetch(`${API_BASE_URL}/api/diet/goal`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(goals),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save goal');
  return json.data;
}

// ── Weekly Trend ──────────────────────────────────────────

export async function getWeeklyTrend(token: string, date?: string): Promise<WeeklyTrendDay[]> {
  const query = date ? `?date=${date}` : '';
  const res = await fetch(`${API_BASE_URL}/api/diet/weekly${query}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch weekly trend');
  return json.data;
}
