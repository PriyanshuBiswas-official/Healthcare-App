import AsyncStorage from '@react-native-async-storage/async-storage';
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

export async function getNotificationInbox(): Promise<AppNotification[]> {
  try {
    const json = await AsyncStorage.getItem(INBOX_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Error reading inbox', e);
    return [];
  }
}

export async function addNotificationToInbox(notification: Notification): Promise<AppNotification | null> {
  if (!notification.id) return null;
  try {
    const inbox = await getNotificationInbox();
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
    
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(updated));
    return newNotif;
  } catch (e) {
    console.error('Error adding to inbox', e);
    return null;
  }
}

export async function markInboxItemRead(id: string): Promise<void> {
  try {
    const inbox = await getNotificationInbox();
    const updated = inbox.map(n => n.id === id ? { ...n, read: true } : n);
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export async function markAllInboxItemsRead(): Promise<void> {
  try {
    const inbox = await getNotificationInbox();
    const updated = inbox.map(n => ({ ...n, read: true }));
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export async function clearNotificationInbox(): Promise<void> {
  await AsyncStorage.removeItem(INBOX_KEY);
}

export async function removeInboxItem(id: string): Promise<void> {
  try {
    const inbox = await getNotificationInbox();
    const updated = inbox.filter(n => n.id !== id);
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(updated));
  } catch (e) {}
}
