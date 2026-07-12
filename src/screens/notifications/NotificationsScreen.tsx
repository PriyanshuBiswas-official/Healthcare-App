import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { ArrowLeft, Bell } from 'lucide-react-native';

import { GlassCardView, SectionHeader } from '../../components/SharedComponents';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import { useNotifications, AppNotification } from '../../providers/NotificationContext';

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

function getNotificationColor(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('medication') || lower.includes('medicine') || lower.includes('dose')) return Colors.teal;
  if (lower.includes('appointment') || lower.includes('doctor')) return Colors.pink;
  if (lower.includes('vital') || lower.includes('heart') || lower.includes('bp')) return Colors.amber;
  if (lower.includes('workout') || lower.includes('exercise')) return Colors.purple;
  if (lower.includes('sleep')) return Colors.blue;
  if (lower.includes('water') || lower.includes('hydration')) return Colors.blue;
  if (lower.includes('report') || lower.includes('result')) return Colors.amber;
  return Colors.teal;
}

function getNotificationIcon(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('medication') || lower.includes('medicine') || lower.includes('dose')) return '💊';
  if (lower.includes('appointment') || lower.includes('doctor')) return '🏥';
  if (lower.includes('vital') || lower.includes('heart') || lower.includes('bp')) return '🩺';
  if (lower.includes('workout') || lower.includes('exercise')) return '💪';
  if (lower.includes('sleep')) return '💤';
  if (lower.includes('water') || lower.includes('hydration')) return '💧';
  if (lower.includes('report') || lower.includes('result')) return '📊';
  return '🔔';
}

function NotificationCard({ item, onPress }: { item: AppNotification; onPress?: () => void }) {
  const color = getNotificationColor(item.title);
  const icon = getNotificationIcon(item.title);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <GlassCardView style={[styles.notifCard, !item.read && { borderColor: color + '40' }]}>
        <View style={styles.notifRow}>
          <View style={[styles.notifIconWrap, { backgroundColor: color + '20' }]}>
            <Text style={{ fontSize: Typography.lg }}>{icon}</Text>
          </View>
          <View style={styles.notifContent}>
            <View style={styles.notifTitleRow}>
              <Text style={[styles.notifTitle, !item.read && { fontWeight: Typography.bold }]}>{item.title}</Text>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
            </View>
            <Text style={styles.notifSub}>{item.body}</Text>
            <Text style={styles.notifTime}>{formatTimeAgo(item.receivedAt)}</Text>
          </View>
        </View>
      </GlassCardView>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ onBackPress }: { onBackPress?: () => void }) {
  const { onScroll } = useScrollVisibility();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [now, setNow] = useState(Date.now());

  // Re-render every 30s to update "time ago" labels
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
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
            <TouchableOpacity style={styles.backBtn} onPress={onBackPress} activeOpacity={0.7}>
              <ArrowLeft size={22} color={Colors.text} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.pageTitle}>Notifications</Text>
          <View style={styles.topRight}>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Bell size={32} color={Colors.textMuted} strokeWidth={1.5} />
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
                    onPress={() => markAsRead(item.id)}
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
                    onPress={() => markAsRead(item.id)}
                  />
                ))}
              </>
            )}
          </>
        )}

        {notifications.length > 0 && unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: 120,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: 40 },
  pageTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
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
  badge: {
    marginLeft: Spacing.sm,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.bg,
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
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  notifSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },


  markAllBtn: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.teal + '40',
    backgroundColor: Colors.teal + '10',
    alignItems: 'center',
  },
  markAllText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.teal,
  },
});
