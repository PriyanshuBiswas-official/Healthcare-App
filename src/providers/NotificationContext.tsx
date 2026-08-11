import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notifee, { EventType } from '@notifee/react-native';

import {
  getNotificationInbox,
  addNotificationToInbox,
  markInboxItemRead,
  markAllInboxItemsRead,
  clearNotificationInbox,
  removeInboxItem,
  AppNotification
} from '../services/notificationInbox';

export type { AppNotification };

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'receivedAt' | 'read'>) => Promise<string>;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  onNotificationTap: ((screen: string, data?: Record<string, unknown>) => void) | null;
  setOnNotificationTap: (handler: (screen: string, data?: Record<string, unknown>) => void) => void;
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: async () => '',
  markAsRead: () => {},
  markAllRead: () => {},
  removeNotification: () => {},
  clearAll: () => {},
  onNotificationTap: null,
  setOnNotificationTap: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

/**
 * Maps notification screen IDs to app tab/screen names for navigation.
 */
function mapScreenToTab(screen: string): string {
  const screenMap: Record<string, string> = {
    medication: 'medications',
    water: 'reminders-water',
    workout: 'reminders-workouts',
    nutrition: 'reminders-water',
    sleep: 'reminders-sleep',
    health: 'reminders-health',
    appointment: 'reminders-appointments',
    general: 'Notifications',
  };
  return screenMap[screen] || 'Notifications';
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const idCounter = useRef(0);
  const tapHandlerRef = useRef<((screen: string, data?: Record<string, unknown>) => void) | null>(null);

  // Load inbox on mount
  useEffect(() => {
    setNotifications(getNotificationInbox());
  }, []);

  // Listen for foreground notification events
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.DELIVERED) {
        if (detail.notification) {
          const added = addNotificationToInbox(detail.notification);
          if (added) {
            setNotifications(prev => [added, ...prev]);
          }
        }
      } else if (type === EventType.PRESS) {
        const { notification } = detail;
        if (notification) {
          // Route to the correct screen
          const screen = (notification.data?.screen as string) || 'general';
          const mappedScreen = mapScreenToTab(screen);
          tapHandlerRef.current?.(mappedScreen, notification.data as Record<string, unknown> | undefined);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle background/quit state notification opens
  useEffect(() => {
    notifee.getInitialNotification().then((notification) => {
      if (notification?.notification?.data) {
        const screen = (notification.notification.data.screen as string) || 'general';
        const mappedScreen = mapScreenToTab(screen);
        // Delay to ensure the app is fully rendered
        setTimeout(() => {
          tapHandlerRef.current?.(mappedScreen, notification.notification!.data as Record<string, unknown> | undefined);
        }, 1000);
      }
    });
  }, []);

  const addNotification = useCallback(async (n: Omit<AppNotification, 'id' | 'receivedAt' | 'read'>): Promise<string> => {
    idCounter.current += 1;
    const id = `notif_${idCounter.current}_${Date.now()}`;
    const newNotif: AppNotification = {
      ...n,
      id,
      receivedAt: Date.now(),
      read: false,
    };
    
    // Actually we shouldn't use this manually much if DELIVERED handles it, but keep it for legacy compat
    setNotifications(prev => [newNotif, ...prev]);
    return id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    markInboxItemRead(id);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    markAllInboxItemsRead();
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    removeInboxItem(id);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    clearNotificationInbox();
  }, []);

  const setOnNotificationTap = useCallback((handler: (screen: string, data?: Record<string, unknown>) => void) => {
    tapHandlerRef.current = handler;
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllRead,
        removeNotification,
        clearAll,
        onNotificationTap: tapHandlerRef.current,
        setOnNotificationTap,
      }}>
      {children}
    </NotificationContext.Provider>
  );
}
