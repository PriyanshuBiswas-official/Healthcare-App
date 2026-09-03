import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  InteractionManager,
  BackHandler,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, ClipboardList, Pill, TriangleAlert, Phone, Bell, Smartphone, Droplets, Dumbbell, Building2, Moon, Heart, CircleQuestionMark, Shield, FileText, Info, PenLine, Monitor, Sun, Users, Crown, Lock, AlertTriangle, Calendar } from 'lucide-react-native';
import { GlassCardView, SectionHeader, ProgressBar, BackButton, LoadingSpinner } from '../../components/SharedComponents';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../../config/api';
import PersonalInfoScreen from './PersonalInfoScreen';
import MedicalHistoryScreen from './MedicalHistoryScreen';
import MedicationsScreen from './MedicationsScreen';
import AllergiesScreen from './AllergiesScreen';
import DietTypeScreen from './DietTypeScreen';
import EmergencyContactsScreen from './EmergencyContactsScreen';
import WaterRemindersScreen from '../reminders/WaterRemindersScreen';
import WorkoutsRemindersScreen from '../reminders/WorkoutsRemindersScreen';
import AppointmentsRemindersScreen from '../reminders/AppointmentsRemindersScreen';
import SleepRemindersScreen from '../reminders/SleepRemindersScreen';
import HealthRemindersScreen from '../reminders/HealthRemindersScreen';
import MedicationsRemindersScreen from '../reminders/MedicationsRemindersScreen';
import ManageSubscriptionsScreen from './ManageSubscriptionsScreen';
import OffboardingReasonScreen from '../offboarding/ReasonScreen';
import OffboardingFeedbackScreen from '../offboarding/FeedbackScreen';
import OffboardingDataExportScreen from '../offboarding/DataExportScreen';
import OffboardingWarningScreen from '../offboarding/WarningScreen';
import OffboardingConfirmScreen from '../offboarding/ConfirmScreen';
import { AppTheme } from '../../theme';

type HealthSection = 'personal' | 'medical' | 'medications' | 'allergies' | 'diet-type' | 'emergency' | 'reminders-medication' | 'reminders-water' | 'reminders-workouts' | 'reminders-appointments' | 'reminders-sleep' | 'reminders-health' | 'subscriptions' | 'offboarding-reason' | 'offboarding-feedback' | 'offboarding-export' | 'offboarding-warning' | 'offboarding-final';

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  color?: string;
  badge?: string;
};

interface ProfileData {
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  date_of_birth?: string;
  blood_group?: string;
  goals?: string[];
  medications?: { name: string; dosage: string; frequency: string; start_date?: string; end_date?: string }[];
  allergies?: string;
  medical_profile?: { allergies?: string; conditions?: string };
}

function getHealthProfile(profileData: ProfileData | null, colors: AppTheme['colors']): MenuItem[] {
  const meds = profileData?.medications;
  const medCount = Array.isArray(meds) ? meds.length : 0;
  const allergiesRaw = (profileData as any)?.allergies || (profileData as any)?.medical_profile?.allergies || '';
  const allergyList = typeof allergiesRaw === 'string'
    ? allergiesRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(allergiesRaw) ? allergiesRaw : [];

  return [
    { icon: <User size={20} color={colors.teal} />, label: 'Personal Information', sub: 'Name, DOB, gender', color: colors.teal },
    { icon: <ClipboardList size={20} color={colors.pink} />, label: 'Medical History', sub: 'Conditions, surgeries', color: colors.pink },
    { icon: <Pill size={20} color={colors.amber} />, label: 'Medications', sub: medCount > 0 ? `${medCount} active prescription${medCount > 1 ? 's' : ''}` : 'No active medications', color: colors.amber, badge: medCount > 0 ? String(medCount) : undefined },
    { icon: <TriangleAlert size={20} color={colors.danger} />, label: 'Allergies', sub: allergyList.length > 0 ? allergyList.slice(0, 2).join(', ') : 'No allergies recorded', color: colors.danger },
    { icon: <ClipboardList size={20} color={colors.accentBlue} />, label: 'Diet Type', sub: (profileData as any)?.diet_type || 'Not set', color: colors.accentBlue },
    { icon: <Phone size={20} color={colors.accentBlue} />, label: 'Emergency Contacts', sub: 'Emergency contacts', color: colors.accentBlue },
    { icon: <Calendar size={20} color={colors.teal} />, label: 'Health Calendar', sub: 'Appointments, medications, and more', color: colors.teal },
  ];
}

function MenuRow({ item, onPress, colors }: { item: MenuItem; onPress?: () => void; colors: AppTheme['colors'] }) {
  const accent = item.color ?? colors.teal;
  return (
    <TouchableOpacity style={menuStyles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[menuStyles.menuIcon, { backgroundColor: accent + '20' }]}>
        {item.icon}
      </View>
      <View style={menuStyles.menuContent}>
        <Text style={[menuStyles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
        {item.sub && <Text style={[menuStyles.menuSub, { color: colors.textSecondary }]}>{item.sub}</Text>}
      </View>
      {item.badge ? (
        <View style={[menuStyles.badge, { backgroundColor: accent + '25', borderColor: accent + '50' }]}>
          <Text style={[menuStyles.badgeText, { color: accent }]}>{item.badge}</Text>
        </View>
      ) : (
        <Text style={[menuStyles.chevron, { color: colors.textMuted }]}>›</Text>
      )}
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
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
  menuIconText: { fontSize: Typography.md },
  menuContent: { flex: 1, marginLeft: Spacing.md },
  menuLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
  },
  menuSub: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  chevron: {
    fontSize: Typography.xl,
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
});

export default function ProfileScreen({ onBackPress, onCompleteProfile, onNavigate, initialSection }: { onBackPress?: () => void; onCompleteProfile?: () => void; onNavigate?: (screen: string, params?: any) => void; initialSection?: string | null }) {
  const { theme } = useTheme();
  const { onScroll } = useScrollVisibility();
  const insets = useSafeAreaInsets();
  const { user, session, profileCompletion } = useAuth();
  const { systemSync, setSystemSync, themeName, setThemeName } = useTheme();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [activeSection, setActiveSection] = useState<HealthSection | null>(
    initialSection as HealthSection | null
  );
  const cameFromExternal = !!initialSection;
  const [loggingOut, setLoggingOut] = useState(false);
  const [offboardingReason, setOffboardingReason] = useState<string | null>(null);
  const [offboardingFeedback, setOffboardingFeedback] = useState('');

  const appVersion = require('../../../package.json').version as string;

  const healthProfile = useMemo(() => getHealthProfile(profileData, theme.colors), [profileData, theme.colors]);

  const styles = useStyles((t) => ({
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
      marginBottom: Spacing.xl,
    },
    backPlaceholder: { width: 40 },
    backIcon: { fontSize: Typography.lg, color: t.colors.textPrimary },
    pageTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    profileCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
    profileRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.colors.teal + '30',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: 68,
      height: 68,
      borderRadius: 34,
    },
    avatarText: {
      fontSize: Typography.xl,
      fontWeight: Typography.extraBold,
      color: t.colors.teal,
    },
    profileInfo: { flex: 1, marginLeft: Spacing.base },
    name: {
      fontSize: Typography.lg,
      fontWeight: Typography.extraBold,
      color: t.colors.textPrimary,
      letterSpacing: -0.3,
    },
    email: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    memberBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: Radius.full,
      backgroundColor: t.colors.teal + '20',
      borderWidth: 1,
      borderColor: t.colors.teal + '50',
    },
    memberBadgeText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: t.colors.teal,
      letterSpacing: Typography.lsWide,
    },
    upgradeBtn: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: Radius.full,
      backgroundColor: t.colors.amber + '20',
    },
    upgradeBtnText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: t.colors.amber,
      letterSpacing: Typography.lsWide,
    },
    profileMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.base,
      paddingTop: Spacing.base,
      borderTopWidth: 1,
      borderTopColor: t.colors.divider,
    },
    metaItem: { fontSize: Typography.xs, color: t.colors.textSecondary },
    statsRow: {
      flexDirection: 'row',
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.xl,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    statLabel: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: '80%',
      backgroundColor: t.colors.divider,
      position: 'absolute',
      right: 0,
    },
    completeCard: {
      backgroundColor: t.colors.bgCard,
      borderWidth: 1,
      borderColor: t.colors.teal + '40',
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
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
      marginRight: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completeCardTextWrap: {
      flex: 1,
    },
    completeCardTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    completeCardSub: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    completeCardProgress: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    completeCardPercent: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: t.colors.teal,
      marginLeft: Spacing.sm,
      minWidth: 30,
    },
    menuCard: { paddingVertical: Spacing.xs, marginBottom: Spacing.xl },
    divider: {
      height: 1,
      backgroundColor: t.colors.divider,
      marginLeft: 68,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: t.colors.bgCard,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      marginBottom: Spacing.md,
    },
    logoutIcon: { fontSize: Typography.base, marginRight: Spacing.sm },
    logoutText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.textSecondary,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: t.colors.danger + '15',
      borderWidth: 1,
      borderColor: t.colors.danger + '30',
      marginBottom: Spacing.lg,
    },
    deleteBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.danger,
    },
    chevron: {
      fontSize: Typography.xl,
      fontWeight: Typography.medium,
      marginLeft: Spacing.sm,
    },
    version: {
      textAlign: 'center',
      fontSize: Typography.xs,
      color: t.colors.textMuted,
      marginBottom: Spacing.base,
    },
    themeChipRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },
    themeChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: t.colors.bgCardBorder + '30',
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
    },
    themeChipActive: {
      backgroundColor: t.colors.teal + '20',
      borderColor: t.colors.teal + '60',
    },
    themeChipIcon: {
      marginBottom: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeChipText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: t.colors.textSecondary,
    },
    themeChipTextActive: {
      color: t.colors.teal,
    },
  }));

  const CONNECTED_DEVICES: MenuItem[] = useMemo(() => [
    { icon: <Smartphone size={20} color={theme.colors.pink} />, label: 'Health Connect', sub: 'Steps, sleep, heart rate', color: theme.colors.pink },
  ], [theme.colors]);

  const REMINDER_ITEMS: MenuItem[] = useMemo(() => [
    { icon: <Pill size={20} color={theme.colors.amber} />, label: 'Medications', sub: 'Manage medication reminders', color: theme.colors.amber },
    { icon: <Droplets size={20} color={theme.colors.blue} />, label: 'Water Reminders', sub: 'Hydration intake alerts', color: theme.colors.blue },
    { icon: <Dumbbell size={20} color={theme.colors.pink} />, label: 'Workouts', sub: 'Exercise schedule & reminders', color: theme.colors.pink },
    { icon: <Building2 size={20} color={theme.colors.teal} />, label: 'Appointments', sub: 'Upcoming visits & alerts', color: theme.colors.teal },
    { icon: <Moon size={20} color={theme.colors.accentBlue} />, label: 'Sleep', sub: 'Bedtime & wake reminders', color: theme.colors.accentBlue },
    { icon: <Heart size={20} color={theme.colors.danger} />, label: 'Health', sub: 'General health reminders', color: theme.colors.danger },
  ], [theme.colors]);

  const SUPPORT: MenuItem[] = useMemo(() => [
    { icon: <Crown size={20} color="#F59E0B" />, label: 'Manage Subscriptions', sub: 'Plans & billing' },
    { icon: <CircleQuestionMark size={20} color="#14B8A6" />, label: 'Help & Support', sub: 'FAQs, chat support, Feedback' },
    { icon: <Shield size={20} color="#3B82F6" />, label: 'Privacy Policy', sub: 'How we handle your data' },
    { icon: <Lock size={20} color="#8B5CF6" />, label: 'Privacy & Security', sub: 'Data sharing, permissions' },
    { icon: <FileText size={20} color="#F59E0B" />, label: 'Terms and Conditions', sub: 'Legal Terms and Conditions applied' },
    { icon: <AlertTriangle size={20} color="#EF4444" />, label: 'Disclaimer', sub: 'Health Disclaimer apply' },
    { icon: <Info size={20} color="#6B8AFF" />, label: 'About Cureto', sub: `Version ${appVersion}` },
  ], [appVersion]);

  // Handle initialSection changes (from notification taps)
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection as HealthSection);
    }
  }, [initialSection]);

  const handleSubScreenBack = useCallback(() => {
    if (cameFromExternal) {
      onBackPress?.();
    } else {
      setActiveSection(null);
    }
  }, [cameFromExternal, onBackPress]);

  useEffect(() => {
    if (!activeSection) return;

    const onBackPress = () => {
      handleSubScreenBack();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeSection, handleSubScreenBack]);

  const fetchProfile = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setProfileData(json.data);
      }
    } catch (e) {
      console.warn('[ProfileScreen] Backend fetch failed:', e);
    }
  }, [session?.access_token]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchProfile();
    });
    return () => task.cancel();
  }, [fetchProfile]);

  const percentage: number = profileCompletion?.percentage ?? 0;
  const isComplete = profileCompletion?.completed ?? false;

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = profileData?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = profileData?.email || user?.email || '';

  const healthStats = [
    { label: 'Age', value: profileData?.age ? `${profileData.age}` : '--' },
    { label: 'Weight', value: profileData?.weight ? `${profileData.weight} kg` : '--' },
    { label: 'Height', value: profileData?.height ? `${profileData.height} cm` : '--' },
    { label: 'Blood', value: profileData?.blood_group || '--' },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { GoogleSignin } = require('../../lib/googleSignin');
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        try {
          await GoogleSignin.revokeAccess();
        } catch (_) { }
        await GoogleSignin.signOut();
      }
    } catch (e) {
      console.warn('[ProfileScreen] Google sign-out error:', e);
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[ProfileScreen] Supabase sign-out error:', e);
    }
    setLoggingOut(false);
  };

  return (
    <View style={styles.root}>
      {activeSection ? (
        <>
          {activeSection === 'personal' && (
            <PersonalInfoScreen
              onBack={() => { setActiveSection(null); fetchProfile(); }}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'medical' && (
            <MedicalHistoryScreen
              onBack={() => { setActiveSection(null); fetchProfile(); }}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'medications' && (
            <MedicationsScreen
              onBack={() => { setActiveSection(null); fetchProfile(); }}
              onSaved={(section) => {
                fetchProfile();
                if (section) setActiveSection(section as HealthSection);
              }}
            />
          )}
          {activeSection === 'allergies' && (
            <AllergiesScreen
              onBack={() => { setActiveSection(null); fetchProfile(); }}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'diet-type' && (
            <DietTypeScreen
              onBack={() => { setActiveSection(null); fetchProfile(); }}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'emergency' && (
            <EmergencyContactsScreen
              onBack={handleSubScreenBack}
            />
          )}
          {activeSection === 'reminders-medication' && (
            <MedicationsRemindersScreen
              onBack={handleSubScreenBack}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'reminders-water' && (
            <WaterRemindersScreen
              onBack={handleSubScreenBack}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'reminders-workouts' && (
            <WorkoutsRemindersScreen
              onBack={handleSubScreenBack}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'reminders-appointments' && (
            <AppointmentsRemindersScreen
              onBack={handleSubScreenBack}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'reminders-sleep' && (
            <SleepRemindersScreen
              onBack={handleSubScreenBack}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'reminders-health' && (
            <HealthRemindersScreen
              onBack={handleSubScreenBack}
              onSaved={fetchProfile}
            />
          )}
          {activeSection === 'subscriptions' && (
            <ManageSubscriptionsScreen
              onBack={handleSubScreenBack}
            />
          )}
          {activeSection === 'offboarding-reason' && (
            <OffboardingReasonScreen
              onBack={() => setActiveSection(null)}
              onNext={(reason) => { setOffboardingReason(reason); setActiveSection('offboarding-feedback'); }}
              step={0}
              totalSteps={5}
            />
          )}
          {activeSection === 'offboarding-feedback' && (
            <OffboardingFeedbackScreen
              onBack={() => setActiveSection('offboarding-reason')}
              onNext={(feedback) => { setOffboardingFeedback(feedback); setActiveSection('offboarding-export'); }}
              onSkip={() => setActiveSection('offboarding-export')}
              step={1}
              totalSteps={5}
            />
          )}
          {activeSection === 'offboarding-export' && (
            <OffboardingDataExportScreen
              onBack={() => setActiveSection('offboarding-feedback')}
              onNext={() => setActiveSection('offboarding-warning')}
              onSkip={() => setActiveSection('offboarding-warning')}
              step={2}
              totalSteps={5}
            />
          )}
          {activeSection === 'offboarding-warning' && (
            <OffboardingWarningScreen
              onBack={() => setActiveSection('offboarding-export')}
              onNext={() => setActiveSection('offboarding-final')}
              step={3}
              totalSteps={5}
            />
          )}
          {activeSection === 'offboarding-final' && (
            <OffboardingConfirmScreen
              onBack={() => setActiveSection('offboarding-warning')}
              onDelete={() => { setActiveSection(null); Alert.alert('Account Deleted', 'This is a simulated feature. Your account has not been deleted.'); }}
              step={4}
              totalSteps={5}
            />
          )}
        </>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            onScroll={onScroll}
            scrollEventThrottle={16}>

            <View style={styles.topBar}>
              {onBackPress ? (
                <BackButton onPress={onBackPress} color={theme.colors.textPrimary} />
              ) : (
                <View style={styles.backPlaceholder} />
              )}
              <Text style={styles.pageTitle}>Profile</Text>
              <View style={{ width: 40 }} />
            </View>

            <GlassCardView style={styles.profileCard} accentColor={theme.colors.teal}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.name}>{displayName}</Text>
                  <Text style={styles.email}>{displayEmail}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, minHeight: 22 }}>
                    <View style={styles.memberBadge}>
                      <Text style={styles.memberBadgeText}>Free Account</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.upgradeBtn}
                      activeOpacity={0.7}
                      onPress={() => setActiveSection('subscriptions')}
                    >
                      <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </GlassCardView>

            <GlassCardView style={styles.statsRow}>
              {healthStats.map((stat, i) => (
                <View key={stat.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  {i < healthStats.length - 1 && <View style={styles.statDivider} />}
                </View>
              ))}
            </GlassCardView>

            {percentage < 100 && (
              <>
                <SectionHeader title="Complete Your Profile" subtitle={`${percentage}% completed`} />
                <TouchableOpacity
                  style={styles.completeCard}
                  onPress={() => onCompleteProfile?.()}
                  activeOpacity={0.7}>
                  <View style={styles.completeCardInner}>
                    <View style={styles.completeCardLeft}>
                      <View style={styles.completeCardIcon}>
                        <PenLine size={22} color={theme.colors.teal} />
                      </View>
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
                    <ProgressBar progress={percentage / 100} color={theme.colors.teal} height={4} />
                    <Text style={styles.completeCardPercent}>{percentage}%</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <SectionHeader title="Health Profile" subtitle="Manage your medical information" />
            <GlassCardView style={styles.menuCard}>
              {healthProfile.map((item, i) => (
                <View key={item.label}>
                  <MenuRow
                    item={item}
                    colors={theme.colors}
                    onPress={() => {
                      if (item.label === 'Health Calendar') {
                        Alert.alert('Coming Soon', 'Health Calendar is under development and will be available soon!');
                        return;
                      }
                      const sectionMap: Record<string, HealthSection> = {
                        'Personal Information': 'personal',
                        'Medical History': 'medical',
                        'Medications': 'medications',
                        'Allergies': 'allergies',
                        'Diet Type': 'diet-type',
                        'Emergency Contacts': 'emergency',
                      };
                      setActiveSection(sectionMap[item.label] || null);
                    }}
                  />
                  {i < healthProfile.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCardView>

            <SectionHeader title="Reminders" subtitle="Manage your daily reminders" />
            <GlassCardView style={styles.menuCard}>
              {REMINDER_ITEMS.map((item, i) => (
                <View key={item.label}>
                  <MenuRow
                    item={item}
                    colors={theme.colors}
                    onPress={() => {
                      const sectionMap: Record<string, HealthSection> = {
                        'Medications': 'reminders-medication',
                        'Water Reminders': 'reminders-water',
                        'Workouts': 'reminders-workouts',
                        'Appointments': 'reminders-appointments',
                        'Sleep': 'reminders-sleep',
                        'Health': 'reminders-health',
                      };
                      setActiveSection(sectionMap[item.label] || null);
                    }}
                  />
                  {i < REMINDER_ITEMS.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCardView>

            <SectionHeader title="Connected Devices" subtitle="Sync wearables & health data" />
            <GlassCardView style={styles.menuCard}>
              {CONNECTED_DEVICES.map((item, i) => (
                <View key={item.label}>
                  <MenuRow item={item} colors={theme.colors} onPress={() => Alert.alert('Coming Soon', 'Health Connect integration is under development and will be available soon!')} />
                  {i < CONNECTED_DEVICES.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCardView>

            <SectionHeader title="Appearance" subtitle="Choose your app theme" />
            <GlassCardView style={styles.menuCard}>
              <View style={styles.themeChipRow}>
                {([
                  { key: 'system' as const, icon: <Monitor size={18} color={theme.colors.textSecondary} />, label: 'System' },
                  { key: 'dark' as const, icon: <Moon size={18} color={theme.colors.textSecondary} />, label: 'Dark' },
                  { key: 'light' as const, icon: <Sun size={18} color={theme.colors.textSecondary} />, label: 'Light' },
                ]).map((opt) => {
                  const isActive = opt.key === 'system'
                    ? systemSync
                    : !systemSync && themeName === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.themeChip, isActive && styles.themeChipActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (opt.key === 'system') {
                          setSystemSync(true);
                        } else {
                          setSystemSync(false);
                          setThemeName(opt.key);
                        }
                      }}>
                      <View style={styles.themeChipIcon}>{opt.icon}</View>
                      <Text style={[styles.themeChipText, isActive && styles.themeChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassCardView>

            <SectionHeader title="Support" />
            <GlassCardView style={styles.menuCard}>
              {SUPPORT.map((item, i) => (
                <View key={item.label}>
                  <MenuRow
                    item={item}
                    colors={theme.colors}
                    onPress={() => {
                      const sectionMap: Record<string, HealthSection> = {
                        'Manage Subscriptions': 'subscriptions',
                      };
                      if (sectionMap[item.label]) {
                        setActiveSection(sectionMap[item.label]);
                      } else if (item.label === 'Help & Support') {
                        onNavigate?.('Feedback');
                      } else {
                        const messages: Record<string, string> = {
                          'Privacy Policy': 'Privacy Policy will be available soon.',
                          'Privacy & Security': 'Privacy & Security settings are under development.',
                          'Terms and Conditions': 'Terms and Conditions will be available soon.',
                          'Disclaimer': 'Health Disclaimer will be available soon.',
                          'About Cureto': 'About page is under development.',
                        };
                        Alert.alert('Coming Soon', messages[item.label] || 'This feature is under development and will be available soon!');
                      }
                    }}
                  />
                  {i < SUPPORT.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCardView>

            <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>⏻</Text>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.8}
              onPress={() => setActiveSection('offboarding-reason')}
            >
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      {loggingOut && (
        <LoadingSpinner overlay text="Signing out..." />
      )}
    </View>
  );
}
