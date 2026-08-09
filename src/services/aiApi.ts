import { API_BASE_URL, fetchWithTimeout } from '../config/api';

// ── Types ─────────────────────────────────────────────────────

export type ChatHistoryItem = {
  role: 'user' | 'ai';
  text: string;
};

export type AIChatResponse = {
  text: string;
  timestamp: string;
  attachment?: {
    storagePath: string;
    fileName: string;
    mimeType: string;
  };
};

export type ChatAttachment = {
  uri: string;
  type: string;
  name: string;
};

export type Conversation = {
  conversation_id: number;
  title: string | null;
  convo_type: string | null;
  pinned: boolean;
  archived: boolean;
  last_message_at: string;
  created_at: string;
};

export type AIMessage = {
  message_id: number;
  role: 'user' | 'ai';
  message: string;
  created_at: string;
  attachments?: {
    attachment_type: string;
    storage_path: string;
    file_type: string;
    file_size?: number;
  }[];
};

export type ConversationDetail = Conversation & {
  messages: AIMessage[];
};

// ── Helpers ───────────────────────────────────────────────────

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ── Chat ──────────────────────────────────────────────────────

/**
 * Sends a user message and conversation history to the backend AI chat endpoint.
 * Optionally persists to a conversation if conversationId is provided.
 * Supports file attachments via multipart/form-data.
 */
export async function sendAIChatMessage(
  token: string,
  message: string,
  history: ChatHistoryItem[] = [],
  conversationId?: number | null,
  attachments?: ChatAttachment[],
): Promise<AIChatResponse> {
  if (attachments && attachments.length > 0) {
    // Multipart upload with files
    const formData = new FormData();
    formData.append('message', message);
    formData.append('history', JSON.stringify(history));
    if (conversationId) {
      formData.append('conversation_id', conversationId.toString());
    }
    attachments.forEach((att) => {
      formData.append('attachments', {
        uri: att.uri,
        type: att.type,
        name: att.name,
      } as any);
    });

    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/ai/chat`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      },
      60000, // 60s timeout for file uploads
    );

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to get response from AI');
    }
    return json.data;
  }

  // JSON upload (no file)
  const body: Record<string, any> = { message, history };
  if (conversationId) {
    body.conversation_id = conversationId;
  }

  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/chat`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    },
    15000,
  );

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Failed to get response from AI');
  }

  return json.data;
}

// ── Conversations ─────────────────────────────────────────────

/**
 * Fetches all active conversations for the authenticated user.
 */
export async function getConversations(token: string): Promise<Conversation[]> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/conversations`,
    { method: 'GET', headers: authHeaders(token) },
    10000,
  );

  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load conversations');
  return json.data || [];
}

/**
 * Fetches archived conversations for the authenticated user.
 */
export async function getArchivedConversations(token: string): Promise<Conversation[]> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/conversations?archived=true`,
    { method: 'GET', headers: authHeaders(token) },
    10000,
  );

  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load archived conversations');
  return json.data || [];
}

/**
 * Fetches a single conversation with all its messages.
 */
export async function getConversationMessages(
  token: string,
  conversationId: number,
): Promise<ConversationDetail> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/conversations/${conversationId}`,
    { method: 'GET', headers: authHeaders(token) },
    10000,
  );

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Failed to load conversation');
  }
  return json.data;
}

/**
 * Creates a new conversation. Returns the conversation_id.
 */
export async function createConversation(
  token: string,
  title?: string | null,
): Promise<{ conversation_id: number; created_at: string }> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/conversations`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ title }),
    },
    8000,
  );

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Failed to create conversation');
  }
  return json.data;
}

/**
 * Updates a conversation (title, pinned, archived).
 */
export async function updateConversation(
  token: string,
  conversationId: number,
  updates: { title?: string; pinned?: boolean; archived?: boolean },
): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/conversations/${conversationId}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    },
    8000,
  );

  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to update conversation');
}

/**
 * Deletes a conversation and all its messages.
 */
export async function deleteConversation(
  token: string,
  conversationId: number,
): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/conversations/${conversationId}`,
    { method: 'DELETE', headers: authHeaders(token) },
    8000,
  );

  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to delete conversation');
}

/**
 * Auto-generates a title for a conversation using the first message.
 */
export async function generateConversationTitle(
  token: string,
  conversationId: number,
  firstMessage: string,
): Promise<{ title: string }> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/conversations/${conversationId}/generate-title`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ firstMessage }),
    },
    12000,
  );

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Failed to generate title');
  }
  return json.data;
}

// ── Health Summary ────────────────────────────────────────────

export type AISummaryTag = {
  label: string;
  color: 'success' | 'accentBlue' | 'amber' | 'pink';
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

/**
 * Gets a signed URL for viewing an attachment from Supabase Storage.
 */
export async function getAttachmentSignedUrl(token: string, storagePath: string): Promise<string> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/ai/attachment-url?path=${encodeURIComponent(storagePath)}`,
    { method: 'GET', headers: authHeaders(token) },
    10000,
  );

  const json = await res.json();
  if (!json.success || !json.data?.signedUrl) {
    throw new Error(json.message || 'Failed to get attachment URL');
  }

  return json.data.signedUrl;
}
