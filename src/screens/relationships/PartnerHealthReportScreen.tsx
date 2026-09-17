import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  InteractionManager,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  ShieldCheck,
  Droplets,
  Dumbbell,
  Footprints,
  Moon,
  Flame,
  Zap,
  Utensils,
  Coffee,
  Salad,
  Apple,
  UtensilsCrossed,
  CheckCircle2,
  TrendingUp,
  Clock,
  HeartPulse,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  GitCompareArrows,
} from 'lucide-react-native';
import HealthCompareModal from './HealthCompareModal';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { GlassCardView, SectionHeader, BackButton, LoadingSpinner } from '../../components/SharedComponents';
import { getHealthReport, HealthReport } from '../../services/relationshipApi';

interface PartnerHealthReportScreenProps {
  relationshipId?: string;
  onBack: () => void;
}

type TabType = 'health' | 'nutrition' | 'activity';

const MUSCLE_COLORS: Record<string, string> = {
  'Legs': '#3B82F6',
  'Glutes': '#3B82F6',
  'Chest': '#6B8AFF',
  'Triceps': '#6B8AFF',
  'Back': '#8B5CF6',
  'Biceps': '#8B5CF6',
  'Shoulders': '#FF4D8D',
  'Core': '#FFB347',
  'Cardio': '#FFB347',
  'Arms': '#10B981',
};

const SCORE_FACTOR_META: Array<{ key: string; label: string; max: number; color: string; subKeys: string[] }> = [
  { key: 'sleep', label: 'Sleep Quality', max: 20, color: '#6B8AFF', subKeys: ['sleep'] },
  { key: 'activity', label: 'Activity Load', max: 25, color: '#8B5CF6', subKeys: ['activity'] },
  { key: 'nutrition', label: 'Nutrition Quality', max: 20, color: '#10B981', subKeys: ['nutrition'] },
  { key: 'vitals', label: 'Vitals Stability', max: 15, color: '#3B82F6', subKeys: ['hydration', 'mood_stress'] },
];

function formatTime(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

function formatRelativeTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

const gaugeStyles = StyleSheet.create({
  container: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  centerBox: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: Typography.extraBold,
    color: '#F0F4FF',
  },
  subText: {
    fontSize: 10,
    fontWeight: Typography.semiBold,
    color: '#8B92B4',
    marginTop: -4,
  },
});

const HealthScoreCircleGauge: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={gaugeStyles.container}>
      <Svg width={size} height={size} style={gaugeStyles.svg}>
        <Defs>
          <SvgLinearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor="#3B82F6" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={gaugeStyles.centerBox}>
        <Text style={gaugeStyles.scoreText}>{score}</Text>
        <Text style={gaugeStyles.subText}>/ 100</Text>
      </View>
    </View>
  );
};

function computeMuscleSplit(workouts: HealthReport['workouts']): Array<{ name: string; pct: number; color: string }> {
  const counts: Record<string, number> = {};
  let total = 0;
  if (!workouts) return [];

  for (const w of workouts) {
    if (!w.exercises) continue;
    for (const ex of w.exercises) {
      if (!ex.muscle_group) continue;
      const group = ex.muscle_group;
      counts[group] = (counts[group] || 0) + 1;
      total++;
    }
  }

  if (total === 0) return [];

  const split = Object.entries(counts)
    .map(([name, count]) => ({
      name,
      pct: Math.round((count / total) * 100),
      color: MUSCLE_COLORS[name] || '#8B92B4',
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return split;
}

export default function PartnerHealthReportScreen({
  relationshipId,
  onBack,
}: PartnerHealthReportScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = theme.colors;
  const { session } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [compareVisible, setCompareVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<HealthReport | null>(null);

  const fetchReport = useCallback(async () => {
    const token = session?.access_token;
    if (!token || !relationshipId) return;
    try {
      const data = await getHealthReport(token, Number(relationshipId));
      setReport(data);
      setError(null);
    } catch (e: any) {
      console.warn('[PartnerReport] Fetch failed:', e);
      setError(e?.message || 'Failed to load report');
    }
  }, [session?.access_token, relationshipId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchReport();
    setLoading(false);
  }, [fetchReport]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReport();
    setRefreshing(false);
  }, [fetchReport]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => { loadData(); });
    return () => task.cancel();
  }, [loadData]);

  const styles = useStyles(t => ({
    root: {
      flex: 1,
      backgroundColor: t.colors.bg,
    },
    topNavHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    topNavTitleBox: {
      flex: 1,
      alignItems: 'center',
    },
    topNavTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.extraBold,
      color: t.colors.textPrimary,
      letterSpacing: Typography.lsTight,
    },
    sharedBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    sharedBadgeText: {
      fontSize: 10,
      color: t.colors.accentBlue,
      fontWeight: Typography.semiBold,
    },
    spacer40: {
      width: 40,
    },
    socialProfileCard: {
      padding: Spacing.base,
      marginBottom: Spacing.base,
      marginTop: Spacing.sm,
      borderRadius: Radius.lg,
    },
    profileCardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    avatarCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.colors.accentBlueDim,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.colors.accentBlue,
      flexShrink: 0,
    },
    avatarText: {
      fontSize: 22,
      fontWeight: Typography.extraBold,
      color: t.colors.accentBlue,
    },
    profileTextCol: {
      flex: 1,
    },
    partnerNameText: {
      fontSize: Typography.lg,
      fontWeight: Typography.extraBold,
      color: t.colors.textPrimary,
      letterSpacing: -0.3,
    },
    partnerRelationText: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      fontWeight: Typography.medium,
      marginTop: 2,
    },
    centeredReactionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
    },
    reactionPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      backgroundColor: t.colors.chipBg,
      borderRadius: Radius.md,
      gap: 8,
    },
    reactionText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: t.colors.textSecondary,
    },
    reactionPillActive: {
      backgroundColor: t.colors.accentBlue + '25',
      borderWidth: 1,
      borderColor: t.colors.accentBlue + '50',
    },
    reactionPillDislike: {
      backgroundColor: t.colors.pink + '25',
      borderWidth: 1,
      borderColor: t.colors.pink + '50',
    },
    fab: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.colors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: t.colors.accentBlue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
    scrollContent: {
      paddingHorizontal: Spacing.base,
      paddingBottom: 110,
    },
    tabBarContainer: {
      flexDirection: 'row',
      backgroundColor: t.colors.bgCard,
      borderRadius: Radius.lg,
      padding: 4,
      marginBottom: Spacing.base,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: Radius.md,
    },
    tabActive: {
      backgroundColor: t.colors.accentBlue,
      shadowColor: t.colors.accentBlue,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    },
    tabText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: t.colors.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontWeight: Typography.extraBold,
    },
    section: {
      marginBottom: Spacing.base,
    },
    card: {
      padding: Spacing.base,
      borderRadius: Radius.lg,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    scoreMeta: {
      flex: 1,
    },
    scoreMetaTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.extraBold,
      color: t.colors.textPrimary,
    },
    scoreMetaSub: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    factorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.06)',
    },
    factorBox: {
      width: '48.5%',
      backgroundColor: t.colors.chipBg,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    factorLabel: {
      fontSize: 10,
      color: t.colors.textSecondary,
      textAlign: 'center',
    },
    factorValue: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
      textAlign: 'center',
    },
    factorStatus: {
      fontSize: 10,
      fontWeight: Typography.semiBold,
      textAlign: 'center',
    },
    vitalsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    vitalsBox: {
      width: '48.5%',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    vitalsTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    vitalsIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    vitalsLabel: {
      fontSize: 10,
      color: t.colors.textSecondary,
    },
    vitalsValue: {
      marginTop: Spacing.lg,
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    vitalsUnit: {
      fontSize: 10,
      color: t.colors.textSecondary,
    },
    vitalsStatus: {
      fontSize: 10,
      fontWeight: Typography.semiBold,
      marginLeft: Spacing.xs,
      flexShrink: 0,
    },
    calHeroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: Spacing.md,
    },
    calBig: {
      fontSize: Typography.xxl,
      fontWeight: Typography.extraBold,
      color: t.colors.textPrimary,
      letterSpacing: -0.5,
    },
    calSub: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    progressTrack: {
      height: 10,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: Radius.full,
      overflow: 'hidden',
      marginBottom: Spacing.lg,
    },
    progressFill: {
      height: '100%',
      backgroundColor: t.colors.amber,
      borderRadius: Radius.full,
    },
    macrosRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      paddingHorizontal: 2,
    },
    macroBox: {
      width: '48.5%',
      backgroundColor: t.colors.chipBg,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    macroName: {
      fontSize: 10,
      color: t.colors.textSecondary,
      textAlign: 'center',
    },
    macroVal: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
      textAlign: 'center',
    },
    macroPct: {
      fontSize: 10,
      fontWeight: Typography.semiBold,
      textAlign: 'center',
    },
    mealItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    borderBottomNone: {
      borderBottomWidth: 0,
    },
    mealIconBox: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: 'rgba(255,179,71,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,179,71,0.3)',
    },
    mealMeta: {
      flex: 1,
    },
    mealTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    mealTime: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      fontWeight: Typography.regular,
    },
    mealDesc: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    mealCalsText: {
      fontSize: 11,
      color: t.colors.amber,
      marginTop: 3,
      fontWeight: Typography.semiBold,
    },
    routineDoneIconBox: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: t.colors.accentBlueDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(107,138,255,0.3)',
    },
    routinePendingIconBox: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: 'rgba(255,179,71,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,179,71,0.3)',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowCenterGap12: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    volVal: {
      fontSize: Typography.display,
      fontWeight: Typography.extraBold,
      color: t.colors.textPrimary,
      letterSpacing: -0.8,
    },
    volSub: {
      fontSize: Typography.xs,
      color: t.colors.accentBlue,
      fontWeight: Typography.bold,
      marginTop: 2,
      letterSpacing: Typography.lsWide,
      textTransform: 'uppercase',
    },
    growthBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: t.colors.accentBlueDim,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: 'rgba(107,138,255,0.3)',
    },
    growthText: {
      fontSize: 11,
      color: t.colors.accentBlue,
      fontWeight: Typography.bold,
    },
    statBoxGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.06)',
    },
    statMiniBox: {
      width: '48.5%',
      backgroundColor: t.colors.chipBg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statMiniVal: {
      fontSize: Typography.sm,
      fontWeight: Typography.extraBold,
      color: t.colors.textPrimary,
    },
    statMiniSub: {
      fontSize: 10,
      color: t.colors.textSecondary,
      marginTop: 3,
    },
    muscleBar: {
      flexDirection: 'row',
      height: 12,
      borderRadius: Radius.full,
      overflow: 'hidden',
      marginVertical: Spacing.sm,
    },
    muscleSegment: {
      height: '100%',
    },
    muscleLegendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 11,
      color: t.colors.textSecondary,
    },
    workoutItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    workoutIcon: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: t.colors.accentBlueDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(107,138,255,0.3)',
    },
    workoutInfo: {
      flex: 1,
    },
    workoutTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    workoutMeta: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    workoutLift: {
      fontSize: Typography.xs,
      color: t.colors.accentBlue,
      fontWeight: Typography.semiBold,
      marginTop: 4,
    },
    noDataCard: {
      padding: Spacing.xl,
      borderRadius: Radius.lg,
      alignItems: 'center',
    },
    noDataText: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      textAlign: 'center',
    },
    noDataSub: {
      fontSize: Typography.xs,
      color: t.colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
    },
    errorText: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    retryButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      backgroundColor: t.colors.accentBlue,
      borderRadius: Radius.md,
    },
    retryText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: '#FFFFFF',
    },
  }));

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topNavHeader}>
          <BackButton onPress={onBack} color={colors.textPrimary} />
          <View style={styles.topNavTitleBox}>
            <Text style={styles.topNavTitle}>Health Report</Text>
          </View>
          <View style={styles.spacer40} />
        </View>
        <LoadingSpinner />
      </View>
    );
  }

  if (error && !report) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topNavHeader}>
          <BackButton onPress={onBack} color={colors.textPrimary} />
          <View style={styles.topNavTitleBox}>
            <Text style={styles.topNavTitle}>Health Report</Text>
          </View>
          <View style={styles.spacer40} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const partner = report?.user;
  const score = report?.health_score?.current ?? report?.health_score?.last_reliable_score ?? 0;
  const subScores = report?.health_score?.sub_scores;
  const muscleSplit = computeMuscleSplit(report?.workouts);

  const relationLabel = report?.relationship?.type
    ? report.relationship.type.charAt(0).toUpperCase() + report.relationship.type.slice(1)
    : 'Partner';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* TOP NAV */}
      <View style={styles.topNavHeader}>
        <BackButton onPress={onBack} color={colors.textPrimary} />
        <View style={styles.topNavTitleBox}>
          <Text style={styles.topNavTitle}>Health Report</Text>
          <View style={styles.sharedBadgeRow}>
            <ShieldCheck size={12} color={colors.accentBlue} />
            <Text style={styles.sharedBadgeText}>Partner Health Sync</Text>
          </View>
        </View>
        <View style={styles.spacer40} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentBlue} />}>
        {/* PROFILE CARD */}
        <GlassCardView style={styles.socialProfileCard}>
          <View style={styles.profileCardTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{partner?.avatar || '?'}</Text>
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.partnerNameText}>{partner?.name || 'Partner'}</Text>
              <Text style={styles.partnerRelationText}>{relationLabel}</Text>
            </View>
          </View>
          <View style={styles.centeredReactionsRow}>
            <TouchableOpacity
              style={[styles.reactionPill, liked && styles.reactionPillActive]}
              activeOpacity={0.75}
              onPress={() => { setLiked(prev => !prev); setDisliked(false); }}>
              <ThumbsUp size={18} color={liked ? colors.accentBlue : colors.textSecondary} />
              <Text style={[styles.reactionText, liked && { color: colors.accentBlue }]}>Liked</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reactionPill, disliked && styles.reactionPillDislike]}
              activeOpacity={0.75}
              onPress={() => { setDisliked(prev => !prev); setLiked(false); }}>
              <ThumbsDown size={18} color={disliked ? colors.pink : colors.textSecondary} />
              <Text style={[styles.reactionText, disliked && { color: colors.pink }]}>Disliked</Text>
            </TouchableOpacity>
          </View>
        </GlassCardView>

        {/* TAB BAR */}
        <View style={styles.tabBarContainer}>
          <TouchableOpacity style={[styles.tabItem, activeTab === 'health' && styles.tabActive]} onPress={() => setActiveTab('health')}>
            <Text style={[styles.tabText, activeTab === 'health' && styles.tabTextActive]}>Health</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItem, activeTab === 'nutrition' && styles.tabActive]} onPress={() => setActiveTab('nutrition')}>
            <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextActive]}>Nutrition</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItem, activeTab === 'activity' && styles.tabActive]} onPress={() => setActiveTab('activity')}>
            <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>Activity</Text>
          </TouchableOpacity>
        </View>

        {/* ─── TAB: HEALTH ─── */}
        {activeTab === 'health' && (
          <>
            {report?.permissions.health_score ? (
              <View style={styles.section}>
                <GlassCardView style={styles.card}>
                  <View style={styles.scoreRow}>
                    <HealthScoreCircleGauge score={score} color={colors.accentBlue} />
                    <View style={styles.scoreMeta}>
                      <Text style={styles.scoreMetaTitle}>Overall Health Score</Text>
                      <Text style={styles.scoreMetaSub}>
                        Calculated from real-time sleep, vitals stability, and active consistency logs.
                      </Text>
                    </View>
                  </View>

                  {subScores && (
                    <View style={styles.factorsGrid}>
                      {SCORE_FACTOR_META.map((meta) => {
                        const val = meta.subKeys.reduce((sum, k) => sum + ((subScores as any)[k] ?? 0), 0);
                        const pct = Math.round((val / meta.max) * 100);
                        let statusLabel = 'Good';
                        if (pct >= 90) statusLabel = 'Excellent';
                        else if (pct >= 75) statusLabel = 'Good';
                        else if (pct >= 50) statusLabel = 'Fair';
                        else statusLabel = 'Low';

                        return (
                          <View key={meta.key} style={styles.factorBox}>
                            <Text style={styles.factorLabel}>{meta.label}</Text>
                            <Text style={styles.factorValue}>{pct}%</Text>
                            <Text style={[styles.factorStatus, { color: meta.color }]}>{statusLabel}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </GlassCardView>
              </View>
            ) : (
              <View style={styles.section}>
                <GlassCardView style={styles.noDataCard}>
                  <Text style={styles.noDataText}>Health score not shared</Text>
                  <Text style={styles.noDataSub}>Ask your partner to enable health score sharing</Text>
                </GlassCardView>
              </View>
            )}

            {/* VITALS & RECOVERY */}
            {report?.permissions.vitals ? (
              <View style={styles.section}>
                <SectionHeader title="Vitals & Recovery Matrix" />
                <View style={styles.vitalsGrid}>
                  {/* Resting HR */}
                  <GlassCardView style={styles.vitalsBox}>
                    <View style={styles.vitalsTopRow}>
                      <View style={styles.vitalsIconRow}>
                        <HeartPulse size={14} color="#EF4444" />
                        <Text style={styles.vitalsLabel}>Resting HR</Text>
                      </View>
                      <Text style={[styles.vitalsStatus, { color: '#6B7280' }]} numberOfLines={1}>Not tracked</Text>
                    </View>
                    <Text style={styles.vitalsValue}>
                      <Text style={{ color: '#EF4444', fontWeight: Typography.bold, fontSize: Typography.lg }}>--</Text>
                      <Text style={styles.vitalsUnit}> bpm</Text>
                    </Text>
                  </GlassCardView>

                  {/* Sleep */}
                  <GlassCardView style={styles.vitalsBox}>
                    <View style={styles.vitalsTopRow}>
                      <View style={styles.vitalsIconRow}>
                        <Moon size={14} color="#8B5CF6" />
                        <Text style={styles.vitalsLabel}>Sleep</Text>
                      </View>
                      <Text style={[styles.vitalsStatus, { color: '#6B7280' }]}>
                        {report.vitals?.sleep?.latest_quality_label || 'No data'}
                      </Text>
                    </View>
                    <Text style={styles.vitalsValue}>
                      <Text style={{ color: '#8B5CF6', fontWeight: Typography.bold, fontSize: Typography.lg }}>
                        {report.vitals?.sleep?.avg_hours != null ? report.vitals.sleep.avg_hours : '--'}
                      </Text>
                      <Text style={styles.vitalsUnit}>
                        {report.vitals?.sleep?.avg_hours != null ? ' hr' : ''}
                      </Text>
                    </Text>
                  </GlassCardView>

                  {/* HRV Recovery */}
                  <GlassCardView style={styles.vitalsBox}>
                    <View style={styles.vitalsTopRow}>
                      <View style={styles.vitalsIconRow}>
                        <Zap size={14} color="#10B981" />
                        <Text style={styles.vitalsLabel}>HRV Recovery</Text>
                      </View>
                      <Text style={[styles.vitalsStatus, { color: '#6B7280' }]} numberOfLines={1}>Not tracked</Text>
                    </View>
                    <Text style={styles.vitalsValue}>
                      <Text style={{ color: '#10B981', fontWeight: Typography.bold, fontSize: Typography.lg }}>--</Text>
                      <Text style={styles.vitalsUnit}> ms</Text>
                    </Text>
                  </GlassCardView>

                  {/* Stress Index */}
                  <GlassCardView style={styles.vitalsBox}>
                    <View style={styles.vitalsTopRow}>
                      <View style={styles.vitalsIconRow}>
                        <Sparkles size={14} color="#F59E0B" />
                        <Text style={styles.vitalsLabel}>Stress Index</Text>
                      </View>
                      <Text style={[styles.vitalsStatus, { color: '#6B7280' }]}>
                        {report.vitals?.stress?.label || 'No data'}
                      </Text>
                    </View>
                    <Text style={styles.vitalsValue}>
                      <Text style={{ color: '#F59E0B', fontWeight: Typography.bold, fontSize: Typography.lg }}>
                        {report.vitals?.stress?.value != null ? Math.round(report.vitals.stress.value * 20) : '--'}
                      </Text>
                      <Text style={styles.vitalsUnit}> / 100</Text>
                    </Text>
                  </GlassCardView>
                </View>
              </View>
            ) : (
              <View style={styles.section}>
                <SectionHeader title="Vitals & Recovery Matrix" />
                <GlassCardView style={styles.noDataCard}>
                  <Text style={styles.noDataText}>Vitals data not shared</Text>
                  <Text style={styles.noDataSub}>Ask your partner to enable vitals sharing</Text>
                </GlassCardView>
              </View>
            )}

            {/* MEDICATIONS */}
            {report?.permissions.medications && report.medications && report.medications.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Medication Adherence" />
                <GlassCardView style={styles.card}>
                  {report.medications.map((med, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.mealItem,
                        idx === report.medications!.length - 1 && styles.borderBottomNone,
                      ]}>
                      <View style={med.taken_today ? styles.routineDoneIconBox : styles.routinePendingIconBox}>
                        {med.taken_today ? (
                          <CheckCircle2 size={18} color={colors.accentBlue} />
                        ) : (
                          <Clock size={18} color={colors.amber} />
                        )}
                      </View>
                      <View style={styles.mealMeta}>
                        <Text style={styles.mealTitle}>{med.name}</Text>
                        <Text style={styles.mealDesc}>
                          {med.dosage ? `${med.dosage} · ` : ''}{med.frequency || 'Daily'}
                          {med.taken_today ? ' · Taken today' : ' · Pending'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </GlassCardView>
              </View>
            )}

            {report?.permissions.medications && (!report.medications || report.medications.length === 0) && (
              <View style={styles.section}>
                <SectionHeader title="Medication Adherence" />
                <GlassCardView style={styles.noDataCard}>
                  <Text style={styles.noDataText}>No active medications</Text>
                </GlassCardView>
              </View>
            )}
          </>
        )}

        {/* ─── TAB: NUTRITION ─── */}
        {activeTab === 'nutrition' && (
          <>
            {report?.permissions.nutrition && report.nutrition?.calories ? (
              <>
                {/* CALORIE HERO */}
                <View style={styles.section}>
                  <GlassCardView style={styles.card}>
                    <View style={styles.calHeroRow}>
                      <View>
                        <Text style={styles.calBig}>{(report.nutrition!.calories?.current ?? 0).toLocaleString()} kcal</Text>
                        <Text style={styles.calSub}>Target: {(report.nutrition!.calories?.target ?? 2100).toLocaleString()} kcal</Text>
                      </View>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, ((report.nutrition!.calories?.current ?? 0) / (report.nutrition!.calories?.target ?? 2100)) * 100)}%`,
                          },
                        ]}
                      />
                    </View>

                    {/* MACROS */}
                    <View style={styles.macrosRow}>
                      {([
                        { label: 'Protein', data: report.nutrition!.protein, color: '#6B8AFF' },
                        { label: 'Carbs', data: report.nutrition!.carbs, color: '#FFB347' },
                        { label: 'Fats', data: report.nutrition!.fat, color: '#FF4D8D' },
                        { label: 'Fiber', data: report.nutrition!.fiber, color: '#10B981' },
                      ] as const).map(({ label, data, color }) => (
                        <View key={label} style={styles.macroBox}>
                          <Text style={styles.macroName}>{label}</Text>
                          <Text style={styles.macroVal}>{data?.current ?? 0}g</Text>
                          <Text style={[styles.macroPct, { color }]}>
                            {(data?.target ?? 0) > 0 ? Math.round(((data?.current ?? 0) / (data?.target ?? 1)) * 100) : 0}% target
                          </Text>
                        </View>
                      ))}
                    </View>
                  </GlassCardView>
                </View>

                {/* MEAL TIMELINE */}
                <View style={styles.section}>
                  <SectionHeader title="Shared Meal Feed" />
                  <GlassCardView style={styles.card}>
                    {(['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const).map((mealName, idx) => {
                      const mealIcons: Record<string, { Icon: typeof Coffee; color: string }> = {
                        Breakfast: { Icon: Coffee, color: colors.amber },
                        Lunch: { Icon: Salad, color: colors.accentBlue },
                        Snack: { Icon: Apple, color: colors.pink },
                        Dinner: { Icon: UtensilsCrossed, color: colors.teal },
                      };
                      const { Icon, color } = mealIcons[mealName];
                      const logged = report.nutrition!.meals?.find(
                        m => m.name.toLowerCase() === mealName.toLowerCase()
                      );

                      return (
                        <View
                          key={mealName}
                          style={[
                            styles.mealItem,
                            idx === 3 && styles.borderBottomNone,
                          ]}>
                          <View style={styles.mealIconBox}>
                            <Icon size={18} color={color} />
                          </View>
                          <View style={styles.mealMeta}>
                            <Text style={styles.mealTitle}>{mealName}</Text>
                            {logged ? (
                              <>
                                <Text style={styles.mealDesc}>{logged.items}</Text>
                                <Text style={styles.mealCalsText}>
                                  {logged.calories} kcal · {logged.protein}g Protein
                                </Text>
                              </>
                            ) : (
                              <Text style={styles.mealDesc}>Not logged yet</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </GlassCardView>
                </View>

                {/* HYDRATION */}
                <View style={styles.section}>
                  <GlassCardView style={styles.card}>
                    <View style={styles.rowBetween}>
                      <View style={styles.rowCenterGap12}>
                        <Droplets size={26} color={colors.blue} />
                        <View>
                          <Text style={styles.scoreMetaTitle}>Hydration Status</Text>
                          <Text style={styles.scoreMetaSub}>
                            {((report.nutrition!.water?.current_ml ?? 0) / 1000).toFixed(1)}L / {((report.nutrition!.water?.target_ml ?? 2500) / 1000).toFixed(1)}L Target
                          </Text>
                        </View>
                      </View>
                    </View>
                  </GlassCardView>
                </View>
              </>
            ) : (
              <View style={styles.section}>
                <GlassCardView style={styles.noDataCard}>
                  <Text style={styles.noDataText}>Nutrition data not shared</Text>
                  <Text style={styles.noDataSub}>Ask your partner to enable nutrition sharing</Text>
                </GlassCardView>
              </View>
            )}
          </>
        )}

        {/* ─── TAB: ACTIVITY ─── */}
        {activeTab === 'activity' && (
          <>
            {report?.permissions.activity && report.activity?.weekly ? (
              <>
                {/* VOLUME SPOTLIGHT */}
                <View style={styles.section}>
                  <GlassCardView style={styles.card}>
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.volVal}>
                          {(report.activity!.weekly!.total_volume_kg ?? 0).toLocaleString()} kg
                        </Text>
                        <Text style={styles.volSub}>Weekly Volume Lifted</Text>
                      </View>
                    </View>

                    {/* STATS GRID */}
                    <View style={styles.statBoxGrid}>
                      <View style={styles.statMiniBox}>
                        <Text style={styles.statMiniVal}>{report.activity!.weekly!.session_count ?? 0} Workouts</Text>
                        <Text style={styles.statMiniSub}>Sessions Logged</Text>
                      </View>
                      <View style={styles.statMiniBox}>
                        <Text style={styles.statMiniVal}>{report.activity!.weekly!.total_active_minutes ?? 0} mins</Text>
                        <Text style={styles.statMiniSub}>Active Duration</Text>
                      </View>
                      <View style={styles.statMiniBox}>
                        <Text style={styles.statMiniVal}>{(report.activity!.weekly!.total_calories ?? 0).toLocaleString()} kcal</Text>
                        <Text style={styles.statMiniSub}>Calories Burned</Text>
                      </View>
                      <View style={styles.statMiniBox}>
                        <Text style={styles.statMiniVal}>{(report.activity!.weekly!.avg_daily_steps ?? 0).toLocaleString()}</Text>
                        <Text style={styles.statMiniSub}>Avg Daily Steps</Text>
                      </View>
                    </View>
                  </GlassCardView>
                </View>

                {/* MUSCLE SPLIT */}
                <View style={styles.section}>
                  <SectionHeader title="Muscle Group Split" />
                  <GlassCardView style={styles.card}>
                    {muscleSplit.length > 0 ? (
                      <>
                        <View style={styles.muscleBar}>
                          {muscleSplit.map((m, idx) => (
                            <View
                              key={idx}
                              style={[styles.muscleSegment, { width: `${m.pct}%`, backgroundColor: m.color }]}
                            />
                          ))}
                        </View>
                        <View style={styles.muscleLegendRow}>
                          {muscleSplit.map((m, idx) => (
                            <View key={idx} style={styles.legendItem}>
                              <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                              <Text style={styles.legendText}>{m.name} ({m.pct}%)</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={[styles.muscleBar, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                        <View style={{ alignItems: 'center', marginTop: Spacing.sm }}>
                          <Text style={styles.noDataText}>No workout data yet</Text>
                        </View>
                      </>
                    )}
                  </GlassCardView>
                </View>

                {/* WORKOUT LOG */}
                {report?.permissions.workouts && (
                  <View style={styles.section}>
                    <SectionHeader title="Recent Workout Log" />
                    <GlassCardView style={styles.card}>
                      {report.workouts && report.workouts.length > 0 ? (
                        report.workouts.map((w, idx) => {
                          const isRun = w.plan_name?.toLowerCase().includes('run') || w.exercises?.some(e => e.muscle_group?.toLowerCase().includes('cardio'));
                          const IconComponent = isRun ? Footprints : Dumbbell;
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.workoutItem,
                                idx === report.workouts!.length - 1 && styles.borderBottomNone,
                              ]}>
                              <View style={styles.workoutIcon}>
                                <IconComponent size={20} color={colors.accentBlue} />
                              </View>
                              <View style={styles.workoutInfo}>
                                <Text style={styles.workoutTitle}>{w.plan_name || 'Workout'}</Text>
                                <Text style={styles.workoutMeta}>
                                  {w.day_name ? `${w.day_name} · ` : ''}
                                  {formatRelativeTime(w.started_at)} · {w.duration} min · {w.calories_burned} kcal
                                </Text>
                                {w.exercises && w.exercises.length > 0 && (
                                  <Text style={styles.workoutLift}>
                                    {w.exercises.slice(0, 2).map(e => e.exercise_name).join(', ')}
                                    {w.exercises.length > 2 ? ` +${w.exercises.length - 2} more` : ''}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <View style={{ paddingVertical: Spacing.lg, alignItems: 'center' }}>
                          <Text style={styles.noDataText}>No workouts logged this week</Text>
                          <Text style={styles.noDataSub}>Workouts will appear here once your partner logs training</Text>
                        </View>
                      )}
                    </GlassCardView>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.section}>
                <GlassCardView style={styles.noDataCard}>
                  <Text style={styles.noDataText}>Activity data not shared</Text>
                  <Text style={styles.noDataSub}>Ask your partner to enable activity sharing</Text>
                </GlassCardView>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCompareVisible(true)}
        activeOpacity={0.85}>
        <GitCompareArrows size={22} color={colors.white} />
      </TouchableOpacity>

      <HealthCompareModal
        visible={compareVisible}
        partnerName={partner?.name || 'Partner'}
        onClose={() => setCompareVisible(false)}
      />
    </View>
  );
}
