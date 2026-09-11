import { API_BASE_URL } from '../config/api';
import type { LibraryWorkoutPlan } from '../data/libraryWorkoutPlans';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getLibraryPlans(token: string): Promise<LibraryWorkoutPlan[]> {
  const res = await fetch(`${API_BASE_URL}/api/activity/library-plans`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch library plans');
  return json.data;
}

export async function getLibraryPlanById(token: string, planId: string): Promise<LibraryWorkoutPlan> {
  const res = await fetch(`${API_BASE_URL}/api/activity/library-plans/${planId}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch library plan');
  return json.data;
}
