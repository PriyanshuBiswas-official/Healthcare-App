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
  };
  vitals?: any[];
  activity?: {
    steps: number;
    calories_burned: number;
    active_minutes: number;
  };
  workouts?: any[];
  nutrition?: any[];
  sleep?: any[];
  medications?: any[];
  appointments?: any[];
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
