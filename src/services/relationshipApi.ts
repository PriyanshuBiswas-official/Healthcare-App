import { API_BASE_URL } from '../config/api';

export interface PartnerInfo {
  user_id: number | null;
  name: string;
  email: string | null;
  avatar: string;
}

export interface Relationship {
  relationship_id: number;
  relationship_type: 'partner' | 'doctor' | 'coach' | 'caregiver';
  status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  created_at: string;
  accepted_at: string | null;
  updated_at: string;
  role: 'owner' | 'viewer';
  partner: PartnerInfo;
}

export interface RelationshipPermissions {
  permission_id: number;
  relationship_id: number;
  health_score: boolean;
  vitals: boolean;
  activity: boolean;
  workouts: boolean;
  nutrition: boolean;
  sleep: boolean;
  medications: boolean;
  appointments: boolean;
  updated_at: string;
}

export interface HealthReport {
  relationship: {
    relationship_id: number;
    type: string;
    status: string;
    accepted_at: string | null;
  };
  user: {
    user_id: number;
    name: string;
    avatar: string;
    age: number | null;
    gender: string | null;
  };
  permissions: {
    health_score: boolean;
    vitals: boolean;
    activity: boolean;
    workouts: boolean;
    nutrition: boolean;
    sleep: boolean;
    medications: boolean;
    appointments: boolean;
  };
  health_score?: {
    current: number | null;
    status: string;
    last_reliable_score: number | null;
    last_updated: string | null;
    sub_scores?: {
      activity: number;
      nutrition: number;
      sleep: number;
      hydration: number;
      mood_stress: number;
    };
  };
  activity?: {
    today: {
      steps: number;
      calories_burned: number;
      active_minutes: number;
    };
    weekly: {
      total_active_minutes: number;
      total_calories: number;
      total_steps: number;
      avg_daily_steps: number;
      session_count: number;
      total_volume_kg?: number;
    };
  };
  workouts?: Array<{
    sesson_id: number;
    plan_name: string | null;
    day_name: string | null;
    duration: number;
    calories_burned: number;
    started_at: string;
    exercises?: Array<{
      exercise_name: string;
      muscle_group: string | null;
      sets_completed: number;
      target_sets: number;
      target_reps: number;
    }>;
  }>;
  nutrition?: {
    calories: { current: number; target: number };
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fat: { current: number; target: number };
    fiber: { current: number; target: number };
    water: { current_ml: number; target_ml: number };
    meals: Array<{
      name: string;
      time: string | null;
      items: string;
      calories: number;
      protein: number;
    }>;
  };
  sleep?: {
    avg_hours: number;
    avg_quality: number | null;
    days_logged: number;
    latest_quality_label: string;
  };
  vitals?: {
    sleep: {
      avg_hours: number;
      avg_quality: number | null;
      days_logged: number;
      latest_quality_label: string;
    } | null;
    stress: { value: number | null; label: string };
    energy: { level: string };
    focus: { level: string };
    resting_hr: number | null;
    hrv: number | null;
  };
  medications?: Array<{
    name: string;
    dosage: string | null;
    frequency: string | null;
    is_active: boolean;
    taken_today: boolean;
  }>;
  appointments?: Array<{
    appointment_id: number;
    doctor_name: string;
    speciality: string;
    date_with_time: string;
    notes: string | null;
    status: string;
    location: string | null;
  }>;
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function createInvite(
  token: string,
  relationshipType: string
): Promise<{ invite_code: string; relationship_type: string; expires_at: string }> {
  const res = await fetch(`${API_BASE_URL}/api/relationships/invites`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ relationship_type: relationshipType }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to create invite code');
  return json.data;
}

export async function redeemInvite(token: string, inviteCode: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/relationships/invites/redeem`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ invite_code: inviteCode }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to redeem invite code');
  return json.data;
}

export async function listRelationships(token: string): Promise<Relationship[]> {
  const res = await fetch(`${API_BASE_URL}/api/relationships`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to list relationships');
  return json.data;
}

export async function acceptRelationship(token: string, relationshipId: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/relationships/${relationshipId}/accept`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to accept relationship');
  return json.data;
}

export async function rejectRelationship(token: string, relationshipId: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/relationships/${relationshipId}/reject`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to reject relationship');
  return json.data;
}

export async function revokeRelationship(token: string, relationshipId: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/relationships/${relationshipId}/revoke`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to revoke relationship');
  return json.data;
}

export async function getPermissions(token: string, relationshipId: number): Promise<RelationshipPermissions> {
  const res = await fetch(`${API_BASE_URL}/api/relationships/${relationshipId}/permissions`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch permissions');
  return json.data;
}

export async function updatePermissions(
  token: string,
  relationshipId: number,
  permissions: Partial<Omit<RelationshipPermissions, 'permission_id' | 'relationship_id' | 'updated_at'>>
): Promise<RelationshipPermissions> {
  const res = await fetch(`${API_BASE_URL}/api/relationships/${relationshipId}/permissions`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(permissions),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to update permissions');
  return json.data;
}

export async function getHealthReport(token: string, relationshipId: number): Promise<HealthReport> {
  const res = await fetch(`${API_BASE_URL}/api/relationships/${relationshipId}/health-report`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch health report');
  return json.data;
}
