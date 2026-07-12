import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notifee, { EventType } from '@notifee/react-native';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  receivedAt: number;
  read: boolean;
  data?: Record<string, unknown>;
};

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'receivedAt' | 'read'>) => string;
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
  addNotification: () => '',
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

  // Listen for foreground notification events
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const { notification } = detail;
        if (notification) {
          addNotification({
            title: notification.title || 'Notification',
            body: notification.body || '',
            data: notification.data as Record<string, unknown> | undefined,
          });

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

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'receivedAt' | 'read'>): string => {
    idCounter.current += 1;
    const id = `notif_${idCounter.current}_${Date.now()}`;
    const newNotif: AppNotification = {
      ...n,
      id,
      receivedAt: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    return id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
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
