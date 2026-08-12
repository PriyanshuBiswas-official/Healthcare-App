import { storage } from '../lib/storage';
import { Notification } from '@notifee/react-native';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  receivedAt: number;
  read: boolean;
  data?: Record<string, unknown>;
};

const INBOX_KEY = '@notification_inbox';

export function getNotificationInbox(): AppNotification[] {
  try {
    const json = storage.getString(INBOX_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Error reading inbox', e);
    return [];
  }
}

export function addNotificationToInbox(notification: Notification): AppNotification | null {
  if (!notification.id) return null;
  try {
    const inbox = getNotificationInbox();
    // Check if it already exists
    if (inbox.some(n => n.id === notification.id)) return null;
    
    const newNotif: AppNotification = {
      id: notification.id,
      title: notification.title || 'Notification',
      body: notification.body || '',
      receivedAt: Date.now(),
      read: false,
      data: notification.data,
    };
    
    const updated = [newNotif, ...inbox];
    // Keep max 100
    if (updated.length > 100) updated.length = 100;
    
    storage.set(INBOX_KEY, JSON.stringify(updated));
    return newNotif;
  } catch (e) {
    console.error('Error adding to inbox', e);
    return null;
  }
}

export function markInboxItemRead(id: string): void {
  try {
    const inbox = getNotificationInbox();
    const updated = inbox.map(n => n.id === id ? { ...n, read: true } : n);
    storage.set(INBOX_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export function markAllInboxItemsRead(): void {
  try {
    const inbox = getNotificationInbox();
    const updated = inbox.map(n => ({ ...n, read: true }));
    storage.set(INBOX_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export function clearNotificationInbox(): void {
  try {
    storage.remove(INBOX_KEY);
  } catch (e) {}
}

export function removeInboxItem(id: string): void {
  try {
    const inbox = getNotificationInbox();
    const updated = inbox.filter(n => n.id !== id);
    storage.set(INBOX_KEY, JSON.stringify(updated));
  } catch (e) {}
}
