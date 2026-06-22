import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows, GlassCard } from '../theme/theme';
import { GlassCardView, SectionHeader, StatPill, ProgressBar } from '../components/SharedComponents';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { GoogleSignin } from '../lib/googleSignin';
import { getProfileCompletion, calculatePercentage, ProfileCompletion } from '../services/profileCompletionService';

type MenuItem = {
  icon: string;
  label: string;
  sub?: string;
  color?: string;
  badge?: string;
};

const HEALTH_STATS = [
  { label: 'Age', value: '28', color: Colors.teal },
  { label: 'Weight', value: '62 kg', color: Colors.pink },
  { label: 'Height', value: '165 cm', color: Colors.amber },
  { label: 'Blood', value: 'B+', color: Colors.purple },
];

const HEALTH_PROFILE: MenuItem[] = [
  { icon: '👤', label: 'Personal Information', sub: 'Name, DOB, gender', color: Colors.teal },
  { icon: '📋', label: 'Medical History', sub: 'Conditions, surgeries', color: Colors.pink },
  { icon: '💊', label: 'Medications', sub: '3 active prescriptions', color: Colors.amber, badge: '3' },
  { icon: '⚠️', label: 'Allergies', sub: 'Penicillin, peanuts', color: Colors.danger },
  { icon: '🆘', label: 'Emergency Contacts', sub: '2 contacts saved', color: Colors.purple },
];

const CONNECTED_DEVICES: MenuItem[] = [
  { icon: '⌚', label: 'Apple Watch', sub: 'Synced · Last: 2 min ago', color: Colors.teal, badge: 'On' },
  { icon: '📱', label: 'Health Connect', sub: 'Steps, sleep, heart rate', color: Colors.pink },
];

const PREFERENCES = [
  { key: 'notifications', icon: '🔔', label: 'Push Notifications', sub: 'Appointments & reminders', default: true },
  { key: 'reminders', icon: '💊', label: 'Medication Reminders', sub: 'Daily dose alerts', default: true },
  { key: 'cycle', icon: '🌸', label: 'Cycle Tracking Alerts', sub: 'Phase & fertility updates', default: false },
  { key: 'biometric', icon: '🔒', label: 'Biometric Lock', sub: 'Face ID / fingerprint', default: true },
] as const;

const SUPPORT: MenuItem[] = [
  { icon: '❓', label: 'Help & Support', sub: 'FAQs, chat support' },
  { icon: '🛡️', label: 'Privacy & Security', sub: 'Data sharing, permissions' },
  { icon: '📄', label: 'Terms & Policies', sub: 'Legal documents' },
  { icon: 'ℹ️', label: 'About HealthApp', sub: 'Version 0.0.1' },
];

function MenuRow({ item, onPress }: { item: MenuItem; onPress?: () => void }) {
  const accent = item.color ?? Colors.teal;
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: accent + '20' }]}>
        <Text style={styles.menuIconText}>{item.icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
      </View>
      {item.badge ? (
        <View style={[styles.badge, { backgroundColor: accent + '25', borderColor: accent + '50' }]}>
          <Text style={[styles.badgeText, { color: accent }]}>{item.badge}</Text>
        </View>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

function ToggleRow({
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
    <View style={styles.menuRow}>
      <View style={[styles.menuIcon, { backgroundColor: Colors.teal + '20' }]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
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

export default function ProfileScreen({ onBackPress, onOpenProfileSetup }: { onBackPress?: () => void; onOpenProfileSetup?: () => void }) {
  const { onScroll } = useScrollVisibility();
  const { user } = useAuth();
  const [toggles, setToggles] = useState(
    Object.fromEntries(PREFERENCES.map(p => [p.key, p.default])) as Record<string, boolean>,
  );
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);

  useEffect(() => {
    getProfileCompletion().then(setCompletion);
  }, []);

  const percentage = completion ? calculatePercentage(completion) : 0;

  const setToggle = (key: string, value: boolean) =>
    setToggles(prev => ({ ...prev, [key]: value }));

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignore if not signed in via Google
    }
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        <View style={styles.topBar}>
          {onBackPress ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBackPress} activeOpacity={0.7}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <GlassCardView style={styles.profileCard} accentColor={Colors.teal}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>✓</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.email ? user.email.split('@')[0] : 'User'}</Text>
              <Text style={styles.email}>{user?.email ?? 'user@email.com'}</Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>Premium Member</Text>
              </View>
            </View>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.metaItem}>Member since Jan 2025</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaItem}>Health Score 78</Text>
          </View>
        </GlassCardView>

        <View style={styles.statsRow}>
          {HEALTH_STATS.map(stat => (
            <StatPill key={stat.label} label={stat.label} value={stat.value} color={stat.color} />
          ))}
        </View>

        {percentage < 100 && (
          <>
            <SectionHeader title="Complete Your Profile" subtitle={`${percentage}% completed`} />
            <TouchableOpacity
              style={styles.completeCard}
              onPress={onOpenProfileSetup}
              activeOpacity={0.7}>
              <View style={styles.completeCardInner}>
                <View style={styles.completeCardLeft}>
                  <Text style={styles.completeCardIcon}>📝</Text>
                  <View style={styles.completeCardTextWrap}>
                    <Text style={styles.completeCardTitle}>Set Up Your Profile</Text>
                    <Text style={styles.completeCardSub}>
                      {percentage === 0
                        ? 'Fill in your health details for a better experience'
                        : `${6 - Math.round(percentage / 100 * 6)} sections remaining`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
              <View style={styles.completeCardProgress}>
                <ProgressBar progress={percentage / 100} color={Colors.teal} height={4} />
                <Text style={styles.completeCardPercent}>{percentage}%</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <SectionHeader title="Health Profile" subtitle="Manage your medical information" />
        <GlassCardView style={styles.menuCard}>
          {HEALTH_PROFILE.map((item, i) => (
            <View key={item.label}>
              <MenuRow item={item} />
              {i < HEALTH_PROFILE.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCardView>

        <SectionHeader title="Connected Devices" subtitle="Sync wearables & health data" />
        <GlassCardView style={styles.menuCard}>
          {CONNECTED_DEVICES.map((item, i) => (
            <View key={item.label}>
              <MenuRow item={item} />
              {i < CONNECTED_DEVICES.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCardView>

        <SectionHeader title="Preferences" />
        <GlassCardView style={styles.menuCard}>
          {PREFERENCES.map((item, i) => (
            <View key={item.key}>
              <ToggleRow
                icon={item.icon}
                label={item.label}
                sub={item.sub}
                value={toggles[item.key]}
                onValueChange={v => setToggle(item.key, v)}
              />
              {i < PREFERENCES.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCardView>

        <SectionHeader title="Support" />
        <GlassCardView style={styles.menuCard}>
          {SUPPORT.map((item, i) => (
            <View key={item.label}>
              <MenuRow item={item} />
              {i < SUPPORT.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCardView>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>⏻</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>HealthApp v0.0.1 · Build 1</Text>
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
    marginBottom: Spacing.xl,
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
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal + '20',
    borderWidth: 1,
    borderColor: Colors.teal + '50',
  },
  editBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.teal,
  },
  profileCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.teal + '30',
    borderWidth: 2,
    borderColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.teal,
  },
  avatarText: {
    fontSize: Typography.xl,
    fontWeight: Typography.extraBold,
    color: Colors.teal,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeText: { fontSize: 10, color: Colors.bg, fontWeight: Typography.bold },
  profileInfo: { flex: 1, marginLeft: Spacing.base },
  name: {
    fontSize: Typography.lg,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.amber + '20',
    borderWidth: 1,
    borderColor: Colors.amber + '50',
  },
  memberBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: Colors.amber,
    letterSpacing: 0.3,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  metaItem: { fontSize: Typography.xs, color: Colors.textSecondary },
  metaDot: { fontSize: Typography.xs, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  completeCard: {
    ...GlassCard,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderColor: Colors.teal + '40',
  },
  completeCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  completeCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeCardIcon: {
    fontSize: 22,
    marginRight: Spacing.md,
  },
  completeCardTextWrap: {
    flex: 1,
  },
  completeCardTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  completeCardSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  completeCardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeCardPercent: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.teal,
    marginLeft: Spacing.sm,
    minWidth: 30,
  },
  menuCard: { paddingVertical: Spacing.xs, marginBottom: Spacing.xl },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: { fontSize: 18 },
  menuContent: { flex: 1, marginLeft: Spacing.md },
  menuLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  menuSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    marginLeft: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 68,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.danger + '15',
    borderWidth: 1,
    borderColor: Colors.danger + '40',
    marginBottom: Spacing.lg,
  },
  logoutIcon: { fontSize: 16, marginRight: Spacing.sm },
  logoutText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.danger,
  },
  version: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.base,
  },
});
