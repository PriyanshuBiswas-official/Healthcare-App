import { API_BASE_URL } from '../config/api';
import type { FeedbackThread, FeedbackMessage } from '../types/feedback';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function getThreads(token: string): Promise<FeedbackThread[]> {
  const res = await fetch(`${API_BASE_URL}/api/feedback/threads`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch feedback threads');
  return json.data;
}

export async function getThread(token: string, threadId: number): Promise<FeedbackThread> {
  const res = await fetch(`${API_BASE_URL}/api/feedback/threads/${threadId}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch feedback thread');
  return json.data;
}

export async function createThread(
  token: string,
  payload: {
    category: string;
    subject: string;
    message: string;
    attachments?: { storage_path: string; file_type: string; file_size?: number }[];
  },
): Promise<FeedbackThread> {
  const res = await fetch(`${API_BASE_URL}/api/feedback/threads`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create feedback thread');
  return json.data;
}

export async function addMessage(
  token: string,
  threadId: number,
  message: string,
  attachments?: { storage_path: string; file_type: string; file_size?: number }[],
): Promise<FeedbackMessage> {
  const res = await fetch(`${API_BASE_URL}/api/feedback/threads/${threadId}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ message, attachments }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to add message');
  return json.data;
}

export async function uploadAttachments(
  token: string,
  files: { uri: string; type: string; name: string }[],
): Promise<{ storage_path: string; file_type: string; file_size: number }[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('attachments', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
  }

  const res = await fetch(`${API_BASE_URL}/api/feedback/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to upload attachments');
  return json.data;
}

export async function getAttachmentSignedUrl(token: string, storagePath: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/feedback/attachment-url?path=${encodeURIComponent(storagePath)}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to get attachment URL');
  return json.data;
}
