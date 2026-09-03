export type FeedbackCategory = 'bug' | 'feature' | 'question' | 'other';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type FeedbackSender = 'user' | 'admin';

export interface FeedbackAttachment {
  feedback_attachment_id: number;
  storage_path: string;
  file_type: string;
  file_size: number | null;
}

export interface FeedbackMessage {
  feedback_message_id: number;
  feedback_thread_id: number;
  sender: FeedbackSender;
  message: string;
  created_at: string;
  attachments?: FeedbackAttachment[];
}

export interface FeedbackThread {
  feedback_thread_id: number;
  user_id: number;
  category: FeedbackCategory;
  subject: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  messages?: FeedbackMessage[];
  last_message?: { sender: FeedbackSender; message: string; created_at: string } | null;
  message_count?: number;
}

export const CATEGORY_META: Record<FeedbackCategory, { label: string; color: string }> = {
  bug: { label: 'Bug Report', color: '#EF4444' },
  feature: { label: 'Feature Request', color: '#8B5CF6' },
  question: { label: 'Question', color: '#3B82F6' },
  other: { label: 'Other', color: '#6B7280' },
};

export const STATUS_META: Record<FeedbackStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: '#F59E0B' },
  in_progress: { label: 'In Progress', color: '#3B82F6' },
  resolved: { label: 'Resolved', color: '#10B981' },
  closed: { label: 'Closed', color: '#6B7280' },
};
