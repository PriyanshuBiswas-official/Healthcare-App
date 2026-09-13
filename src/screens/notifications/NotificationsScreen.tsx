import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Bell, X } from 'lucide-react-native';

import { GlassCardView, SectionHeader, BackButton } from '../../components/SharedComponents';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import { useNotifications, AppNotification } from '../../providers/NotificationContext';
import { sendTestNotification } from '../../services/notificationService';

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function getNotificationIcon(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('medication') || lower.includes('medicine') || lower.includes('dose')) return '💊';
  if (lower.includes('appointment') || lower.includes('doctor')) return '🏥';
  if (lower.includes('workout') || lower.includes('exercise')) return '💪';
  if (lower.includes('sleep')) return '💤';
  if (lower.includes('water') || lower.includes('hydration')) return '💧';
  if (lower.includes('report') || lower.includes('result')) return '📊';
  return '🔔';
}

export default function NotificationsScreen({ onBackPress }: { onBackPress?: () => void }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const styles = useStyles(t => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    scroll: {
      paddingHorizontal: Spacing.base,
      paddingTop: insets.top + Spacing.xl,
      paddingBottom: 120,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    backPlaceholder: { width: 40 },
    pageTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
      textAlign: 'center',
      position: 'absolute',
      left: 0,
      right: 0,
    },
    topRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    notifCard: {
      padding: Spacing.base,
      marginBottom: Spacing.sm,
    },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    notifIconWrap: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifContent: {
      flex: 1,
    },
    notifTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
      color: t.colors.text,
      marginBottom: 4,
    },
    notifSub: {
      fontSize: Typography.sm,
      color: t.colors.textMuted,
      lineHeight: 20,
      marginBottom: 4,
      paddingRight: Spacing.md,
    },
    notifTime: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
    },
    removeBtn: {
      padding: 4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xxxl,
    },
    emptyIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: t.colors.bgCard,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
      color: t.colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    emptySub: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      textAlign: 'center',
    },
    testBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: Radius.full,
      backgroundColor: t.colors.teal + '20',
      borderWidth: 1,
      borderColor: t.colors.teal + '40',
    },
    testBtnText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: t.colors.teal,
    },
  }));

  function NotificationCard({ item, onRemove }: { item: AppNotification; onRemove?: () => void }) {
    const getNotificationColor = (title: string): string => {
      const lower = title.toLowerCase();
      if (lower.includes('medication') || lower.includes('medicine') || lower.includes('dose')) return colors.teal;
      if (lower.includes('appointment') || lower.includes('doctor')) return colors.pink;
      if (lower.includes('workout') || lower.includes('exercise')) return colors.accentBlue;
      if (lower.includes('sleep')) return colors.blue;
      if (lower.includes('water') || lower.includes('hydration')) return colors.blue;
      if (lower.includes('report') || lower.includes('result')) return colors.amber;
      return colors.teal;
    };

    const color = getNotificationColor(item.title);
    const icon = getNotificationIcon(item.title);

    return (
      <GlassCardView style={styles.notifCard}>
        <View style={styles.notifRow}>
          <View style={[styles.notifIconWrap, { backgroundColor: color + '20' }]}>
            <Text style={{ fontSize: Typography.lg }}>{icon}</Text>
          </View>
          <View style={styles.notifContent}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            <Text style={styles.notifSub}>{item.body}</Text>
            <Text style={styles.notifTime}>{formatTimeAgo(item.receivedAt)}</Text>
          </View>
          {onRemove && (
            <TouchableOpacity onPress={onRemove} style={styles.removeBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </GlassCardView>
    );
  }

  const { onScroll } = useScrollVisibility();
  const { notifications, markAllRead, removeNotification } = useNotifications();
  const [now, setNow] = useState(Date.now());

  // Re-render every 30s to update "time ago" labels
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-mark all as read when screen opens
  useEffect(() => {
    markAllRead();
  }, []);


  const today = notifications.filter(n => (Date.now() - n.receivedAt) < 86400000);
  const earlier = notifications.filter(n => (Date.now() - n.receivedAt) >= 86400000);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          {onBackPress ? (
            <BackButton onPress={() => navigation.goBack()} color={colors.textPrimary} />
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.pageTitle} pointerEvents="none">Notifications</Text>
          <View style={styles.topRight}>
              <TouchableOpacity
                style={styles.testBtn}
                activeOpacity={0.7}
                onPress={async () => {
                  try {
                    await sendTestNotification();
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Failed to send test notification');
                  }
                }}>
                <Text style={styles.testBtnText}>🔔 Test</Text>
              </TouchableOpacity>
            </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Bell size={32} color={colors.textMuted} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>Your notifications will be listed here</Text>
          </View>
        ) : (
          <>
            {today.length > 0 && (
              <>
                <SectionHeader title="Today" />
                {today.map(item => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    onRemove={() => removeNotification(item.id)}
                  />
                ))}
              </>
            )}

            {earlier.length > 0 && (
              <>
                <SectionHeader title="Earlier" />
                {earlier.map(item => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    onRemove={() => removeNotification(item.id)}
                  />
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
