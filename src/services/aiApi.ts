import { API_BASE_URL, fetchWithTimeout } from '../config/api';

export type ChatHistoryItem = {
  role: 'user' | 'ai';
  text: string;
};

export type AIChatResponse = {
  text: string;
  timestamp: string;
};

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Sends a user message and conversation history to the backend AI chat endpoint.
 */
export async function sendAIChatMessage(
  token: string,
  message: string,
  history: ChatHistoryItem[] = [],
): Promise<AIChatResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/chat`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ message, history }),
    },
    15000, // 15 second timeout for LLM responses
  );

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Failed to get response from AI');
  }

  return json.data;
}

export type AISummaryTag = {
  label: string;
  color: 'success' | 'purple' | 'amber' | 'pink';
};

export type AIHealthSummaryResponse = {
  summary: string;
  tags: AISummaryTag[];
  generatedAt: string;
};

/**
 * Fetches the dynamic AI health summary compiled from patient metrics.
 */
export async function getAIHealthSummary(token: string): Promise<AIHealthSummaryResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/summary`,
    {
      method: 'GET',
      headers: authHeaders(token),
    },
    12000,
  );

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Failed to get AI health summary');
  }

  return json.data;
}
