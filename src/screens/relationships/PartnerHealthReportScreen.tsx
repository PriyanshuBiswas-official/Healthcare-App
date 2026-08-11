import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Heart,
  Activity as ActivityIcon,
  Droplets,
  Scale,
  Pill,
  Dumbbell,
  Footprints,
  PersonStanding,
  ChevronRight,
  ShieldAlert,
  Moon,
  Calendar,
} from 'lucide-react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { GlassCardView, SectionHeader, ActivityProgressCard, BackButton } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import * as relationshipApi from '../../services/relationshipApi';

const { width } = Dimensions.get('window');

interface PartnerHealthReportScreenProps {
  relationshipId: string;
  onBack: () => void;
}

export default function PartnerHealthReportScreen({
  relationshipId,
  onBack,
}: PartnerHealthReportScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useStyles(t => ({
    root: {
      flex: 1,
      backgroundColor: t.colors.bg,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    loadingText: {
      color: t.colors.textMuted,
      fontSize: Typography.sm,
      marginTop: Spacing.base,
    },
    errorHeader: {
      position: 'absolute',
      top: Spacing.base,
      left: Spacing.base,
    },
    errorTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
      marginTop: Spacing.base,
    },
    errorSub: {
      fontSize: Typography.sm,
      color: t.colors.textMuted,
      textAlign: 'center',
      marginTop: Spacing.xs,
      lineHeight: 18,
      marginBottom: Spacing.lg,
    },
    retryBtn: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: t.colors.chipBg,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
    },
    retryBtnText: {
      color: t.colors.textPrimary,
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },

    headerTitles: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: Typography.lg,
      color: t.colors.textPrimary,
      fontWeight: Typography.bold,
    },
    headerSubtitle: {
      fontSize: Typography.xs,
      color: t.colors.textMuted,
    },
    scrollContent: {
      paddingHorizontal: Spacing.base,
      paddingBottom: 100,
    },
    profileCard: {
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      marginTop: Spacing.md,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarContainer: {
      marginRight: Spacing.md,
    },
    avatarPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: t.colors.teal + '20',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: t.colors.teal,
    },
    avatarText: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: t.colors.teal,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
      marginBottom: 2,
    },
    profileDetails: {
      fontSize: Typography.xs,
      color: t.colors.textMuted,
      marginBottom: 4,
    },
    activeBadge: {
      alignSelf: 'flex-start',
      backgroundColor: t.colors.teal + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radius.full,
    },
    activeBadgeText: {
      fontSize: 10,
      color: t.colors.teal,
      fontWeight: Typography.semiBold,
    },
    healthScoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: t.colors.bgCardBorder + '30',
      marginTop: Spacing.base,
      paddingTop: Spacing.base,
    },
    scoreCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: t.colors.teal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.white,
    },
    scoreMeta: {
      marginLeft: Spacing.base,
    },
    scoreTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    scoreDesc: {
      fontSize: Typography.xs - 1,
      color: t.colors.textMuted,
      marginTop: 2,
    },
    section: {
      marginTop: Spacing.md,
    },
    dataCard: {
      padding: Spacing.base,
      borderRadius: Radius.md,
    },
    hScroll: {
      paddingBottom: Spacing.md,
      gap: Spacing.md,
    },
    vitalCard: {
      padding: Spacing.md,
      width: 130,
      marginRight: Spacing.sm,
    },
    vitalLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: Spacing.sm,
    },
    vitalLabel: {
      fontSize: Typography.xs,
      color: t.colors.textMuted,
      fontWeight: Typography.bold,
    },
    vitalValue: {
      fontSize: Typography.base,
      color: t.colors.textPrimary,
      fontWeight: Typography.bold,
    },
    vitalUnit: {
      fontSize: Typography.xs - 1,
      color: t.colors.textMuted,
    },
    vitalBP: {
      fontSize: Typography.xs - 2,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    emptyMetricCard: {
      padding: Spacing.base,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.md,
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    emptyMetricText: {
      color: t.colors.textMuted,
      fontSize: Typography.xs,
    },
    workoutItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    medItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    apptItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    workoutIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    workoutInfo: {
      flex: 1,
    },
    workoutTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    workoutSub: {
      fontSize: Typography.xs,
      color: t.colors.textMuted,
      marginTop: 2,
    },
    emptyInner: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
    },
    emptyInnerText: {
      fontSize: Typography.xs,
      color: t.colors.textMuted,
    },
  }));
  const { session } = useAuth();
  const token = session?.access_token || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<relationshipApi.HealthReport | null>(null);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      if (token && relationshipId) {
        loadReport();
      }
    });
    return () => task.cancel();
  }, [token, relationshipId]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await relationshipApi.getHealthReport(token, parseInt(relationshipId));
      setReport(data);
    } catch (err: any) {
      console.error('[PartnerHealthReportScreen] Load failed:', err);
      setError(err.message || 'Failed to fetch partner health report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={styles.loadingText}>Loading shared health data...</Text>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.errorHeader}>
          <BackButton onPress={onBack} color={colors.textPrimary} />
        </View>
        <ShieldAlert size={48} color={colors.pink} />
        <Text style={styles.errorTitle}>Access Denied or Revoked</Text>
        <Text style={styles.errorSub}>{error || 'You do not have active sharing permissions for this user.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onBack}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { permissions, user: partnerUser } = report;

  // Format overview metrics
  const steps = report.activity?.steps || 0;
  const calories = report.activity?.calories_burned || 0;
  const activeMin = report.activity?.active_minutes || 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={[styles.header, { zIndex: 10 }]}>
        <BackButton onPress={onBack} color={colors.textPrimary} />
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Health Report</Text>
          <Text style={styles.headerSubtitle}>
            Shared by {partnerUser.name}{' '}
            <ShieldCheck size={14} color={colors.teal} style={{ marginLeft: 4 }} />
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* PROFILE CARD */}
        <GlassCardView style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{partnerUser.avatar.charAt(0)}</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{partnerUser.name}</Text>
              <Text style={styles.profileDetails}>
                {partnerUser.gender ? partnerUser.gender : 'Partner'}
                {partnerUser.age ? ` · ${partnerUser.age} years` : ''}
              </Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Shared Connection</Text>
              </View>
            </View>
          </View>

          {/* Overall Health Score Info */}
          {permissions.health_score && report.health_score && (
            <View style={styles.healthScoreRow}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>
                  {report.health_score.current || report.health_score.last_reliable_score || '--'}
                </Text>
              </View>
              <View style={styles.scoreMeta}>
                <Text style={styles.scoreTitle}>Overall Health Score</Text>
                {report.health_score.status === 'insufficient_recent_data' ? (
                  <Text style={styles.scoreDesc}>Stale score (insufficient recent data)</Text>
                ) : (
                  <Text style={styles.scoreDesc}>Calculated from active daily metrics</Text>
                )}
              </View>
            </View>
          )}
        </GlassCardView>

        {/* ACTIVITY SECTION */}
        {permissions.activity && (
          <View style={styles.section}>
            <SectionHeader title="Daily Activity" />
            <GlassCardView style={styles.dataCard}>
              <ActivityProgressCard
                steps={steps}
                stepsTarget={10000}
                exercise={activeMin}
                exerciseTarget={60}
                calories={calories}
                caloriesTarget={2000}
              />
            </GlassCardView>
          </View>
        )}

        {/* VITALS SECTION */}
        {permissions.vitals && (
          <View style={styles.section}>
            <SectionHeader title="Vitals & Health Logs" />
            {report.vitals && report.vitals.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {report.vitals.map((v, i) => (
                  <GlassCardView key={i} style={styles.vitalCard}>
                    <View style={styles.vitalLabelRow}>
                      <Heart size={14} color={colors.pink} />
                      <Text style={styles.vitalLabel}>Heart Rate</Text>
                    </View>
                    <Text style={styles.vitalValue}>
                      {v.heart_rate || '--'} <Text style={styles.vitalUnit}>bpm</Text>
                    </Text>
                    {v.blood_pressure_sys && (
                      <Text style={styles.vitalBP}>
                        BP: {v.blood_pressure_sys}/{v.blood_pressure_dia}
                      </Text>
                    )}
                  </GlassCardView>
                ))}
              </ScrollView>
            ) : (
              <GlassCardView style={styles.emptyMetricCard}>
                <Heart size={20} color={colors.textMuted} />
                <Text style={styles.emptyMetricText}>No recent vitals logged</Text>
              </GlassCardView>
            )}
          </View>
        )}

        {/* WORKOUTS SECTION */}
        {permissions.workouts && (
          <View style={styles.section}>
            <SectionHeader title="Workouts" />
            <GlassCardView style={styles.dataCard}>
              {report.workouts && report.workouts.length > 0 ? (
                report.workouts.map((w, idx) => (
                  <View key={idx} style={[styles.workoutItem, idx > 0 && { marginTop: Spacing.md }]}>
                    <View style={[styles.workoutIcon, { backgroundColor: colors.teal + '20' }]}>
                      <Dumbbell size={18} color={colors.teal} />
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutTitle}>{w.workout_type || 'Exercise'}</Text>
                      <Text style={styles.workoutSub}>
                        {w.duration_minutes} min · {w.calories_burned} kcal
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyInner}>
                  <Text style={styles.emptyInnerText}>No logged workouts</Text>
                </View>
              )}
            </GlassCardView>
          </View>
        )}

        {/* MEDICATIONS SECTION */}
        {permissions.medications && (
          <View style={styles.section}>
            <SectionHeader title="Medications" />
            <GlassCardView style={styles.dataCard}>
              {report.medications && report.medications.length > 0 ? (
                report.medications.map((m, idx) => (
                  <View key={idx} style={[styles.medItem, idx > 0 && { marginTop: Spacing.md }]}>
                    <View style={[styles.workoutIcon, { backgroundColor: colors.amber + '20' }]}>
                      <Pill size={18} color={colors.amber} />
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutTitle}>{m.name}</Text>
                      <Text style={styles.workoutSub}>
                        {m.dosage} · {m.frequency || 'As scheduled'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyInner}>
                  <Text style={styles.emptyInnerText}>No medications shared</Text>
                </View>
              )}
            </GlassCardView>
          </View>
        )}

        {/* APPOINTMENTS SECTION */}
        {permissions.appointments && (
          <View style={styles.section}>
            <SectionHeader title="Appointments" />
            <GlassCardView style={styles.dataCard}>
              {report.appointments && report.appointments.length > 0 ? (
                report.appointments.map((a, idx) => (
                  <View key={idx} style={[styles.apptItem, idx > 0 && { marginTop: Spacing.md }]}>
                    <View style={[styles.workoutIcon, { backgroundColor: colors.blue + '20' }]}>
                      <Calendar size={18} color={colors.blue} />
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutTitle}>{a.doctor_name}</Text>
                      <Text style={styles.workoutSub}>
                        {a.speciality} · {new Date(a.date_with_time).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyInner}>
                  <Text style={styles.emptyInnerText}>No shared appointments</Text>
                </View>
              )}
            </GlassCardView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
