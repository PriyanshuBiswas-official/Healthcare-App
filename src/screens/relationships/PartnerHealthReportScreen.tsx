import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
import { GlassCardView, SectionHeader, BackButton } from '../../components/SharedComponents';

interface PartnerHealthReportScreenProps {
  _relationshipId?: string;
  onBack: () => void;
}

type TabType = 'health' | 'nutrition' | 'activity';

// ─── HARDCODED PREVIEW DATA ───
const MOCK_PARTNER = {
  name: 'Sarah Jenkins',
  avatar: 'S',
  relation: 'Partner & Gym Buddy',
  healthScore: 88,
  scoreStatus: 'Optimal Recovery',
};

const MOCK_HEALTH_DATA = {
  scoreFactors: [
    { label: 'Sleep Quality', score: '92%', status: 'Optimal', color: '#6B8AFF' },
    { label: 'Vitals Stability', score: '95%', status: 'Excellent', color: '#3B82F6' },
    { label: 'Habit Consistency', score: '84%', status: 'Good', color: '#FFB347' },
    { label: 'Activity Load', score: '81%', status: 'Balanced', color: '#8B5CF6' },
  ],
  vitals: [
    { label: 'Resting HR', value: '62 bpm', status: 'Normal Range', icon: HeartPulse, color: '#FF4D8D' },
    { label: 'Sleep Arch.', value: '7h 45m', status: '88% Deep & REM', icon: Moon, color: '#8B5CF6' },
    { label: 'HRV Recovery', value: '58 ms', status: 'High Readiness', icon: Zap, color: '#6B8AFF' },
    { label: 'Stress Index', value: '22 / 100', status: 'Low Stress', icon: Sparkles, color: '#FFB347' },
  ],
  routine: [
    { name: 'Multivitamin & Omega-3', time: '8:30 AM', done: true },
    { name: 'Hydration Target (2.5L)', time: 'Ongoing (2.1L)', done: false },
    { name: 'Post-Workout Stretch', time: '10:15 AM', done: true },
  ],
};

const MOCK_NUTRITION_DATA = {
  calories: 1850,
  calorieTarget: 2100,

  protein: { current: 135, target: 150, unit: 'g', pct: 90, color: '#6B8AFF' },
  carbs: { current: 195, target: 220, unit: 'g', pct: 88, color: '#FFB347' },
  fat: { current: 55, target: 65, unit: 'g', pct: 84, color: '#FF4D8D' },
  fiber: { current: 22, target: 30, unit: 'g', pct: 73, color: '#10B981' },
  meals: [
    {
      time: '8:15 AM',
      name: 'Breakfast',
      item: 'Avocado Toast, 2 Eggs & Green Tea',
      cals: 420,
      protein: '22g Protein',
    },
    {
      time: '1:30 PM',
      name: 'Lunch',
      item: 'Grilled Chicken Quinoa Bowl & Almonds',
      cals: 680,
      protein: '48g Protein',
    },
    {
      time: '5:00 PM',
      name: 'Snack',
      item: 'Whey Protein Shake & Banana',
      cals: 280,
      protein: '32g Protein',
    },
    {
      time: '8:00 PM',
      name: 'Dinner',
      item: 'Baked Salmon & Roasted Veggies',
      cals: 470,
      protein: '33g Protein',
    },
  ],
  water: { current: 2.1, target: 2.5, unit: 'L' },
};

const MOCK_ACTIVITY_DATA = {
  totalVolumeKg: 14250,
  volumeGrowth: '+12% vs last week',
  sessionsThisWeek: 5,
  activeMinsThisWeek: 285,
  totalCaloriesBurned: 2450,
  avgDailySteps: 8240,
  muscleSplit: [
    { name: 'Legs & Glutes', pct: 38, color: '#3B82F6' },
    { name: 'Chest & Triceps', pct: 32, color: '#6B8AFF' },
    { name: 'Back & Biceps', pct: 20, color: '#8B5CF6' },
    { name: 'Core & Cardio', pct: 10, color: '#FFB347' },
  ],
  workouts: [
    {
      title: 'Hypertrophy Leg Day',
      time: 'Today · 9:00 AM',
      duration: '55 min',
      cals: 480,
      volume: '6,400 kg',
      topLift: 'Barbell Back Squat (4 x 8 @ 85kg)',
      icon: Dumbbell,
    },
    {
      title: 'Upper Body Push Focus',
      time: 'Yesterday · 5:30 PM',
      duration: '45 min',
      cals: 390,
      volume: '4,850 kg',
      topLift: 'Dumbbell Incline Press (4 x 10 @ 24kg)',
      icon: Dumbbell,
    },
    {
      title: '5K Interval Conditioning Run',
      time: '2 days ago',
      duration: '26 min',
      cals: 310,
      volume: '5.2 km',
      topLift: 'Avg Pace 5:00/km · Avg HR 156 bpm',
      icon: Footprints,
    },
  ],
};

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

// ─── SVG CIRCULAR HEALTH SCORE GAUGE ───
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

export default function PartnerHealthReportScreen({
  _relationshipId,
  onBack,
}: PartnerHealthReportScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = theme.colors;

  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [compareVisible, setCompareVisible] = useState(false);

  const styles = useStyles(t => ({
    root: {
      flex: 1,
      backgroundColor: t.colors.bg,
    },

    // ─── TOP NAVIGATION HEADER (SAFE AREA RESPECTED) ───
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

    // ─── SOCIAL PROFILE HERO CARD ───
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

    // Reactions Bar
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

    // ─── SEGMENTED PILL TAB BAR ───
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

    // ─── CARDS & SECTIONS ───
    section: {
      marginBottom: Spacing.base,
    },
    card: {
      padding: Spacing.base,
      borderRadius: Radius.lg,
    },

    // Health Score Hero layout
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

    // Factors Grid
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
    factorValRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
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

    // Vitals Grid
    vitalsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    vitalCard: {
      width: '48.5%',
      padding: Spacing.md,
      borderRadius: Radius.lg,
    },
    vitalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    vitalIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vitalTitle: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      fontWeight: Typography.medium,
    },
    vitalVal: {
      fontSize: Typography.md,
      fontWeight: Typography.extraBold,
      color: t.colors.textPrimary,
    },
    vitalStatus: {
      fontSize: 10,
      color: t.colors.blue,
      marginTop: 4,
      fontWeight: Typography.medium,
    },

    // Nutrition Tab
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

    // Meal timeline items
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

    // Activity Tab Spotlight
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

    // Muscle Group split bar
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

    // Workout log
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
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ─── TOP NAVIGATION HEADER (SAFE AREA RESPECTED) ─── */}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ─── COMPACT HORIZONTAL PROFILE CARD ─── */}
        <GlassCardView style={styles.socialProfileCard}>
          {/* Avatar left, name & relation beside */}
          <View style={styles.profileCardTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{MOCK_PARTNER.avatar}</Text>
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.partnerNameText}>{MOCK_PARTNER.name}</Text>
              <Text style={styles.partnerRelationText}>{MOCK_PARTNER.relation}</Text>
            </View>
          </View>

          {/* Quick Reactions Bar below */}
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
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'health' && styles.tabActive]}
            onPress={() => setActiveTab('health')}>
            <Text style={[styles.tabText, activeTab === 'health' && styles.tabTextActive]}>
              Health
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'nutrition' && styles.tabActive]}
            onPress={() => setActiveTab('nutrition')}>
            <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextActive]}>
              Nutrition
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'activity' && styles.tabActive]}
            onPress={() => setActiveTab('activity')}>
            <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
              Activity
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: HEALTH
        ────────────────────────────────────────────────────────────── */}
        {activeTab === 'health' && (
          <>
            {/* HERO: SVG HEALTH SCORE RING GAUGE */}
            <View style={styles.section}>
              <GlassCardView style={styles.card}>
                <View style={styles.scoreRow}>
                  <HealthScoreCircleGauge score={MOCK_PARTNER.healthScore} color={colors.accentBlue} />
                  <View style={styles.scoreMeta}>
                    <Text style={styles.scoreMetaTitle}>Overall Health Score</Text>
                    <Text style={styles.scoreMetaSub}>
                      Calculated from real-time sleep, vitals stability, and active consistency logs.
                    </Text>
                  </View>
                </View>

                {/* Score Factor Breakdown */}
                <View style={styles.factorsGrid}>
                  {MOCK_HEALTH_DATA.scoreFactors.map((f, idx) => (
                    <View key={idx} style={styles.factorBox}>
                      <Text style={styles.factorLabel}>{f.label}</Text>
                      <Text style={styles.factorValue}>{f.score}</Text>
                      <Text style={[styles.factorStatus, { color: f.color }]}>{f.status}</Text>
                    </View>
                  ))}
                </View>
              </GlassCardView>
            </View>

            {/* VITALS & RECOVERY MATRIX */}
            <View style={styles.section}>
              <SectionHeader title="Vitals & Recovery Matrix" />
              <View style={styles.vitalsGrid}>
                {MOCK_HEALTH_DATA.vitals.map((v, idx) => {
                  const IconComp = v.icon;
                  return (
                    <GlassCardView key={idx} style={styles.vitalCard}>
                      <View style={styles.vitalHeader}>
                        <View style={[styles.vitalIconWrap, { backgroundColor: v.color + '20' }]}>
                          <IconComp size={15} color={v.color} />
                        </View>
                        <Text style={styles.vitalTitle}>{v.label}</Text>
                      </View>
                      <Text style={styles.vitalVal}>{v.value}</Text>
                      <Text style={[styles.vitalStatus, { color: v.color }]}>{v.status}</Text>
                    </GlassCardView>
                  );
                })}
              </View>
            </View>

            {/* SHARED ROUTINE & MEDS ADHERENCE */}
            <View style={styles.section}>
              <SectionHeader title="Medication Adherence" />
              <GlassCardView style={styles.card}>
                {MOCK_HEALTH_DATA.routine.map((r, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.mealItem,
                      idx === MOCK_HEALTH_DATA.routine.length - 1 && styles.borderBottomNone,
                    ]}>
                    <View style={r.done ? styles.routineDoneIconBox : styles.routinePendingIconBox}>
                      {r.done ? (
                        <CheckCircle2 size={18} color={colors.accentBlue} />
                      ) : (
                        <Clock size={18} color={colors.amber} />
                      )}
                    </View>
                    <View style={styles.mealMeta}>
                      <Text style={styles.mealTitle}>{r.name}</Text>
                      <Text style={styles.mealDesc}>{r.time}</Text>
                    </View>
                  </View>
                ))}
              </GlassCardView>
            </View>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: NUTRITION
        ────────────────────────────────────────────────────────────── */}
        {activeTab === 'nutrition' && (
          <>
            {/* HERO: CALORIE INTAKE & BALANCE */}
            <View style={styles.section}>
              <GlassCardView style={styles.card}>
                <View style={styles.calHeroRow}>
                  <View>
                    <Text style={styles.calBig}>
                      {MOCK_NUTRITION_DATA.calories.toLocaleString()} kcal
                    </Text>
                    <Text style={styles.calSub}>
                      Target: {MOCK_NUTRITION_DATA.calorieTarget.toLocaleString()} kcal
                    </Text>
                  </View>

                </View>

                {/* Calorie Bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          100,
                          (MOCK_NUTRITION_DATA.calories / MOCK_NUTRITION_DATA.calorieTarget) * 100
                        )}%`,
                      },
                    ]}
                  />
                </View>

                {/* Macro Split Cards */}
                <View style={styles.macrosRow}>
                  <View style={styles.macroBox}>
                    <Text style={styles.macroName}>Protein</Text>
                    <Text style={styles.macroVal}>
                      {MOCK_NUTRITION_DATA.protein.current}
                      {MOCK_NUTRITION_DATA.protein.unit}
                    </Text>
                    <Text style={[styles.macroPct, { color: MOCK_NUTRITION_DATA.protein.color }]}>
                      {MOCK_NUTRITION_DATA.protein.pct}% target
                    </Text>
                  </View>

                  <View style={styles.macroBox}>
                    <Text style={styles.macroName}>Carbs</Text>
                    <Text style={styles.macroVal}>
                      {MOCK_NUTRITION_DATA.carbs.current}
                      {MOCK_NUTRITION_DATA.carbs.unit}
                    </Text>
                    <Text style={[styles.macroPct, { color: MOCK_NUTRITION_DATA.carbs.color }]}>
                      {MOCK_NUTRITION_DATA.carbs.pct}% target
                    </Text>
                  </View>

                  <View style={styles.macroBox}>
                    <Text style={styles.macroName}>Fats</Text>
                    <Text style={styles.macroVal}>
                      {MOCK_NUTRITION_DATA.fat.current}
                      {MOCK_NUTRITION_DATA.fat.unit}
                    </Text>
                    <Text style={[styles.macroPct, { color: MOCK_NUTRITION_DATA.fat.color }]}>
                      {MOCK_NUTRITION_DATA.fat.pct}% target
                    </Text>
                  </View>

                  <View style={styles.macroBox}>
                    <Text style={styles.macroName}>Fiber</Text>
                    <Text style={styles.macroVal}>
                      {MOCK_NUTRITION_DATA.fiber.current}
                      {MOCK_NUTRITION_DATA.fiber.unit}
                    </Text>
                    <Text style={[styles.macroPct, { color: MOCK_NUTRITION_DATA.fiber.color }]}>
                      {MOCK_NUTRITION_DATA.fiber.pct}% target
                    </Text>
                  </View>
                </View>
              </GlassCardView>
            </View>

            {/* SHARED MEAL TIMELINE */}
            <View style={styles.section}>
              <SectionHeader title="Shared Meal Feed" />
              <GlassCardView style={styles.card}>
                {MOCK_NUTRITION_DATA.meals.map((m, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.mealItem,
                      idx === MOCK_NUTRITION_DATA.meals.length - 1 && styles.borderBottomNone,
                    ]}>
                    <View style={styles.mealIconBox}>
                      {(() => {
                        const mealIcons: Record<string, { Icon: typeof Coffee; color: string }> = {
                          Breakfast: { Icon: Coffee, color: colors.amber },
                          Lunch: { Icon: Salad, color: colors.accentBlue },
                          Snack: { Icon: Apple, color: colors.pink },
                          Dinner: { Icon: UtensilsCrossed, color: colors.teal },
                        };
                        const meal = mealIcons[m.name] || { Icon: Utensils, color: colors.amber };
                        return <meal.Icon size={18} color={meal.color} />;
                      })()}
                    </View>
                    <View style={styles.mealMeta}>
                      <Text style={styles.mealTitle}>
                        {m.name} · <Text style={styles.mealTime}>{m.time}</Text>
                      </Text>
                      <Text style={styles.mealDesc}>{m.item}</Text>
                      <Text style={styles.mealCalsText}>
                        {m.cals} kcal · {m.protein}
                      </Text>
                    </View>
                  </View>
                ))}
              </GlassCardView>
            </View>

            {/* HYDRATION CARD */}
            <View style={styles.section}>
              <GlassCardView style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.rowCenterGap12}>
                    <Droplets size={26} color={colors.blue} />
                    <View>
                      <Text style={styles.scoreMetaTitle}>Hydration Status</Text>
                      <Text style={styles.scoreMetaSub}>
                        {MOCK_NUTRITION_DATA.water.current}L / {MOCK_NUTRITION_DATA.water.target}L Target
                      </Text>
                    </View>
                  </View>
                </View>
              </GlassCardView>
            </View>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: ACTIVITY
        ────────────────────────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <>
            {/* HERO: SPOTLIGHT VOLUME & SESSIONS */}
            <View style={styles.section}>
              <GlassCardView style={styles.card}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.volVal}>
                      {MOCK_ACTIVITY_DATA.totalVolumeKg.toLocaleString()} kg
                    </Text>
                    <Text style={styles.volSub}>Weekly Volume Lifted</Text>
                  </View>
                  <View style={styles.growthBadge}>
                    <TrendingUp size={13} color={colors.accentBlue} />
                    <Text style={styles.growthText}>{MOCK_ACTIVITY_DATA.volumeGrowth}</Text>
                  </View>
                </View>

                {/* Sub Stats Row */}
                <View style={styles.statBoxGrid}>
                  <View style={styles.statMiniBox}>
                    <Text style={styles.statMiniVal}>
                      {MOCK_ACTIVITY_DATA.sessionsThisWeek} Workouts
                    </Text>
                    <Text style={styles.statMiniSub}>Sessions Logged</Text>
                  </View>

                  <View style={styles.statMiniBox}>
                    <Text style={styles.statMiniVal}>
                      {MOCK_ACTIVITY_DATA.activeMinsThisWeek} mins
                    </Text>
                    <Text style={styles.statMiniSub}>Active Duration</Text>
                  </View>

                  <View style={styles.statMiniBox}>
                    <Text style={styles.statMiniVal}>
                      {MOCK_ACTIVITY_DATA.totalCaloriesBurned} kcal
                    </Text>
                    <Text style={styles.statMiniSub}>Calories Burned</Text>
                  </View>

                  <View style={styles.statMiniBox}>
                    <Text style={styles.statMiniVal}>
                      {MOCK_ACTIVITY_DATA.avgDailySteps.toLocaleString()}
                    </Text>
                    <Text style={styles.statMiniSub}>Avg Daily Steps</Text>
                  </View>
                </View>
              </GlassCardView>
            </View>

            {/* TRAINING MUSCLE SPLIT */}
            <View style={styles.section}>
              <SectionHeader title="Muscle Group Split" />
              <GlassCardView style={styles.card}>
                <View style={styles.muscleBar}>
                  {MOCK_ACTIVITY_DATA.muscleSplit.map((m, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.muscleSegment,
                        { width: `${m.pct}%`, backgroundColor: m.color },
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.muscleLegendRow}>
                  {MOCK_ACTIVITY_DATA.muscleSplit.map((m, idx) => (
                    <View key={idx} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                      <Text style={styles.legendText}>
                        {m.name} ({m.pct}%)
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCardView>
            </View>

            {/* RECENT WORKOUT LOG FEED */}
            <View style={styles.section}>
              <SectionHeader title="Recent Workout Log" />
              <GlassCardView style={styles.card}>
                {MOCK_ACTIVITY_DATA.workouts.map((w, idx) => {
                  const IconComponent = w.icon;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.workoutItem,
                        idx === MOCK_ACTIVITY_DATA.workouts.length - 1 && styles.borderBottomNone,
                      ]}>
                      <View style={styles.workoutIcon}>
                        <IconComponent size={20} color={colors.accentBlue} />
                      </View>
                      <View style={styles.workoutInfo}>
                        <Text style={styles.workoutTitle}>{w.title}</Text>
                        <Text style={styles.workoutMeta}>
                          {w.time} · {w.duration} · {w.cals} kcal · Vol: {w.volume}
                        </Text>
                        <Text style={styles.workoutLift}>Top Set: {w.topLift}</Text>
                      </View>
                    </View>
                  );
                })}
              </GlassCardView>
            </View>

          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCompareVisible(true)}
        activeOpacity={0.85}>
        <GitCompareArrows size={22} color={colors.white} />
      </TouchableOpacity>

      <HealthCompareModal
        visible={compareVisible}
        partnerName={MOCK_PARTNER.name}
        onClose={() => setCompareVisible(false)}
      />
    </View>
  );
}
