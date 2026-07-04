import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';
import { GlassCardView, SectionHeader } from '../../components/SharedComponents';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';

type NotificationItem = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  color: string;
  read: boolean;
};

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    icon: '💊',
    title: 'Medication Reminder',
    subtitle: 'Time to take Metformin 500mg',
    time: '2 min ago',
    color: Colors.teal,
    read: false,
  },
  {
    id: '2',
    icon: '🏥',
    title: 'Appointment Tomorrow',
    subtitle: 'Dr. Priya Sharma · Gynecologist at 10:30 AM',
    time: '1 hour ago',
    color: Colors.pink,
    read: false,
  },
  {
    id: '3',
    icon: '🩺',
    title: 'Vitals Alert',
    subtitle: 'Your resting heart rate has been elevated for 3 days',
    time: '3 hours ago',
    color: Colors.amber,
    read: false,
  },
  {
    id: '4',
    icon: '📊',
    title: 'Weekly Health Report',
    subtitle: 'Your health score improved by 4% this week',
    time: 'Yesterday',
    color: Colors.purple,
    read: true,
  },
  {
    id: '5',
    icon: '🏃',
    title: 'Workout Streak',
    subtitle: "Amazing! You've maintained a 5-day workout streak",
    time: 'Yesterday',
    color: Colors.teal,
    read: true,
  },
  {
    id: '6',
    icon: '💤',
    title: 'Sleep Insight',
    subtitle: 'Your sleep quality dropped 12% — consider reducing screen time',
    time: '2 days ago',
    color: Colors.pink,
    read: true,
  },
  {
    id: '7',
    icon: '🧪',
    title: 'Lab Results Available',
    subtitle: 'Your CBC panel results are ready for review',
    time: '3 days ago',
    color: Colors.amber,
    read: true,
  },
];

const REMINDER_CATEGORIES = [
  { key: 'medications', icon: '💊', label: 'Medication Reminders', sub: 'Daily dose alerts & refills', default: true },
  { key: 'appointments', icon: '🏥', label: 'Appointment Alerts', sub: '24h & 1h before visits', default: true },
  { key: 'cycle', icon: '🌸', label: 'Cycle Tracking', sub: 'Phase changes & fertility', default: true },
  { key: 'vitals', icon: '🩺', label: 'Vitals Alerts', sub: 'Abnormal readings', default: true },
  { key: 'workouts', icon: '💪', label: 'Workout Reminders', sub: 'Scheduled sessions', default: false },
  { key: 'hydration', icon: '💧', label: 'Hydration Reminders', sub: 'Water intake goals', default: false },
  { key: 'sleep', icon: '🌙', label: 'Sleep Reminders', sub: 'Bedtime & wake alerts', default: false },
] as const;

function NotificationCard({ item }: { item: NotificationItem }) {
  return (
    <GlassCardView style={[styles.notifCard, !item.read && { borderColor: item.color + '40' }]}>
      <View style={styles.notifRow}>
        <View style={[styles.notifIconWrap, { backgroundColor: item.color + '20' }]}>
          <Text style={{ fontSize: 20 }}>{item.icon}</Text>
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text style={[styles.notifTitle, !item.read && { fontWeight: Typography.bold }]}>{item.title}</Text>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: item.color }]} />}
          </View>
          <Text style={styles.notifSub}>{item.subtitle}</Text>
          <Text style={styles.notifTime}>{item.time}</Text>
        </View>
      </View>
    </GlassCardView>
  );
}

function ToggleReminder({
  icon,
  label,
  sub,
  value,
  onValueChange,
}: {
  icon: string;
  label: string;
  sub: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.reminderRow}>
      <View style={[styles.reminderIcon, { backgroundColor: Colors.teal + '20' }]}>
        <Text style={styles.reminderIconText}>{icon}</Text>
      </View>
      <View style={styles.reminderContent}>
        <Text style={styles.reminderLabel}>{label}</Text>
        <Text style={styles.reminderSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.bgCardBorder, true: Colors.teal + '60' }}
        thumbColor={value ? Colors.teal : Colors.textMuted}
      />
    </View>
  );
}

export default function NotificationsScreen({ onBackPress }: { onBackPress?: () => void }) {
  const { onScroll } = useScrollVisibility();
  const [activeSection, setActiveSection] = useState<'notifications' | 'reminders'>('notifications');
  const [toggles, setToggles] = useState(
    Object.fromEntries(REMINDER_CATEGORIES.map(r => [r.key, r.default])) as Record<string, boolean>,
  );

  const setToggle = (key: string, value: boolean) =>
    setToggles(prev => ({ ...prev, [key]: value }));

  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length;

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
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.pageTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.markAllBtn} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {/* Section Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeSection === 'notifications' && styles.tabBtnActive]}
            onPress={() => setActiveSection('notifications')}
            activeOpacity={0.7}>
            <Text style={[styles.tabText, activeSection === 'notifications' && styles.tabTextActive]}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.tabBadge, activeSection === 'notifications' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeSection === 'notifications' && styles.tabBadgeTextActive]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeSection === 'reminders' && styles.tabBtnActive]}
            onPress={() => setActiveSection('reminders')}
            activeOpacity={0.7}>
            <Text style={[styles.tabText, activeSection === 'reminders' && styles.tabTextActive]}>
              Reminders
            </Text>
          </TouchableOpacity>
        </View>

        {activeSection === 'notifications' ? (
          <>
            {/* Today */}
            <SectionHeader title="Today" />
            {NOTIFICATIONS.filter(n => n.time.includes('ago')).map(item => (
              <NotificationCard key={item.id} item={item} />
            ))}

            {/* Earlier */}
            <SectionHeader title="Earlier" />
            {NOTIFICATIONS.filter(n => !n.time.includes('ago')).map(item => (
              <NotificationCard key={item.id} item={item} />
            ))}

            <View style={{ height: 100 }} />
          </>
        ) : (
          <>
            {/* Reminder Settings */}
            <GlassCardView style={styles.quietHoursCard} accentColor={Colors.purple}>
              <View style={styles.quietRow}>
                <View style={[styles.quietIcon, { backgroundColor: Colors.purple + '20' }]}>
                  <Text style={{ fontSize: 20 }}>🌙</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quietTitle}>Quiet Hours</Text>
                  <Text style={styles.quietSub}>10:00 PM — 7:00 AM</Text>
                </View>
                <Switch
                  value={true}
                  trackColor={{ false: Colors.bgCardBorder, true: Colors.purple + '60' }}
                  thumbColor={Colors.purple}
                />
              </View>
            </GlassCardView>

            <SectionHeader title="Reminder Categories" subtitle="Choose what you'd like to be reminded about" />
            <GlassCardView style={styles.reminderCard}>
              {REMINDER_CATEGORIES.map((item, i) => (
                <View key={item.key}>
                  <ToggleReminder
                    icon={item.icon}
                    label={item.label}
                    sub={item.sub}
                    value={toggles[item.key]}
                    onValueChange={v => setToggle(item.key, v)}
                  />
                  {i < REMINDER_CATEGORIES.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCardView>

            <SectionHeader title="Upcoming Reminders" />
            <GlassCardView style={styles.upcomingCard}>
              <View style={styles.upcomingRow}>
                <View style={[styles.upcomingIcon, { backgroundColor: Colors.pink + '20' }]}>
                  <Text style={{ fontSize: 18 }}>🏥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingTitle}>Dr. Priya Sharma</Text>
                  <Text style={styles.upcomingSub}>Tomorrow · 10:30 AM</Text>
                </View>
                <View style={[styles.upcomingBadge, { backgroundColor: Colors.teal + '20' }]}>
                  <Text style={[styles.upcomingBadgeText, { color: Colors.teal }]}>Reminder set</Text>
                </View>
              </View>
            </GlassCardView>

            <GlassCardView style={styles.upcomingCard}>
              <View style={styles.upcomingRow}>
                <View style={[styles.upcomingIcon, { backgroundColor: Colors.teal + '20' }]}>
                  <Text style={{ fontSize: 18 }}>💊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingTitle}>Metformin 500mg</Text>
                  <Text style={styles.upcomingSub}>Daily · 8:00 PM</Text>
                </View>
                <View style={[styles.upcomingBadge, { backgroundColor: Colors.amber + '20' }]}>
                  <Text style={[styles.upcomingBadgeText, { color: Colors.amber }]}>Recurring</Text>
                </View>
              </View>
            </GlassCardView>

            <GlassCardView style={styles.upcomingCard}>
              <View style={styles.upcomingRow}>
                <View style={[styles.upcomingIcon, { backgroundColor: Colors.amber + '20' }]}>
                  <Text style={{ fontSize: 18 }}>🧪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingTitle}>Blood Lab Panel</Text>
                  <Text style={styles.upcomingSub}>Jun 20 · 8:00 AM · Fasting required</Text>
                </View>
                <View style={[styles.upcomingBadge, { backgroundColor: Colors.purple + '20' }]}>
                  <Text style={[styles.upcomingBadgeText, { color: Colors.purple }]}>Prep needed</Text>
                </View>
              </View>
            </GlassCardView>

            <View style={{ height: 100 }} />
          </>
        )}
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
    justifyContent: 'space-between',
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
  backIcon: { fontSize: 20, color: Colors.textPrimary },
  pageTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
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
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.bg,
  },
  markAllBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal + '20',
    borderWidth: 1,
    borderColor: Colors.teal + '50',
  },
  markAllText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.teal,
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: 3,
    marginBottom: Spacing.xl,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm + 2,
    gap: Spacing.xs,
  },
  tabBtnActive: {
    backgroundColor: Colors.teal + '20',
    borderWidth: 1,
    borderColor: Colors.teal + '50',
  },
  tabText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.teal,
    fontWeight: Typography.semiBold,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: Colors.pink + '30',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.pink,
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
    fontSize: 10,
    color: Colors.textMuted,
  },

  quietHoursCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  quietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quietIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  quietSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  reminderCard: {
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderIconText: { fontSize: 18 },
  reminderContent: { flex: 1, marginLeft: Spacing.md },
  reminderLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  reminderSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 96,
  },

  upcomingCard: {
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  upcomingIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  upcomingSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  upcomingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
  },
});
