import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notifee, { EventType } from '@notifee/react-native';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  receivedAt: number; // timestamp ms
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
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => '',
  markAsRead: () => {},
  markAllRead: () => {},
  removeNotification: () => {},
  clearAll: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const idCounter = useRef(0);


  // Listen for foreground notification events (only PRESS — DELIVERED is handled by explicit addNotification)
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
        }
      }
    });

    return () => unsubscribe();
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
      }}>
      {children}
    </NotificationContext.Provider>
  );
}
