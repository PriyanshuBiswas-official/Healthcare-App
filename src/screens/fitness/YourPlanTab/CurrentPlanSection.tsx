import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import { ChevronRight, Dumbbell, Pencil } from 'lucide-react-native';
import { GlassCardView, SectionHeader } from '../../../components/SharedComponents';
import type { TodayExercise, WeeklyStats, WorkoutPlanDays } from '../../../types/activity';

function formatPlanDate(dateLike?: string | null): string {
  if (!dateLike) return 'Not set';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const WEEKDAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CurrentPlanSectionProps {
  workoutPlanDays: WorkoutPlanDays;
  currentPlanName: string;
  currentPlanDays: any[];
  dayName: string | null;
  exercises: TodayExercise[];
  weeklyStats: WeeklyStats | null;
  daysPerWeek: number;
  selectedPlanDayIndex: number | null;
  onSelectedPlanDayIndexChange: (index: number) => void;
  onShowWorkoutPreview: () => void;
  onOpenExplorePlans?: () => void;
  onOpenCustomPlan?: () => void;
}

export function CurrentPlanSection({
  workoutPlanDays,
  currentPlanName,
  currentPlanDays,
  dayName,
  exercises,
  weeklyStats,
  daysPerWeek,
  selectedPlanDayIndex,
  onSelectedPlanDayIndexChange,
  onShowWorkoutPreview,
  onOpenExplorePlans,
  onOpenCustomPlan,
}: CurrentPlanSectionProps) {
  const styles = useStyles((theme: any) => ({
    section: { marginBottom: Spacing.lg },
    card: { padding: Spacing.base, marginBottom: Spacing.sm },
    planCard: { padding: Spacing.base, marginBottom: Spacing.sm, overflow: 'hidden' },
    planCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    planCardContent: { flex: 1 },
    planEyebrow: { fontSize: Typography.xs, color: theme.colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: Typography.lsWide },
    planTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    planTitle: { fontSize: Typography.xl, fontWeight: Typography.extraBold, color: theme.colors.textPrimary, letterSpacing: -0.4, flexShrink: 1 },
    planEditBtn: { padding: 4 },
    planMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm, marginBottom: Spacing.sm },
    planMetaPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1 },
    planMetaText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    planDescription: { fontSize: Typography.sm, color: theme.colors.textSecondary, lineHeight: 20 },
    planStatsRow: { flexDirection: 'row', marginTop: Spacing.base, paddingTop: Spacing.base, borderTopWidth: 1, borderTopColor: theme.colors.bgCardBorder },
    planStat: { flex: 1, paddingHorizontal: Spacing.sm, gap: 4 },
    planStatDivider: { width: 1, backgroundColor: theme.colors.bgCardBorder, opacity: 0.9 },
    planStatLabel: { fontSize: Typography.xs, color: theme.colors.textSecondary },
    planStatValue: { fontSize: Typography.sm, color: theme.colors.textPrimary, fontWeight: Typography.bold },
    planActionsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
    planActionBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.bgCardBorder, backgroundColor: Colors.bgCardSolid, alignItems: 'center' },
    planActionText: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.textSecondary },
    weekRail: { marginHorizontal: -Spacing.sm, paddingHorizontal: Spacing.sm },
    weekCard: {
      width: Math.min(156, 350 * 0.38), minHeight: 158, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
      marginHorizontal: Spacing.sm, justifyContent: 'space-between', alignItems: 'center',
    },
    weekCardDay: { fontSize: Typography.xs, fontWeight: Typography.bold, color: theme.colors.accentBlue, textTransform: 'uppercase', letterSpacing: Typography.lsWide },
    weekCardName: { fontSize: Typography.base, fontWeight: Typography.bold, color: theme.colors.textPrimary, textAlign: 'center', marginTop: 4 },
    weekCardSub: { fontSize: Typography.xs, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 16 },
    weekCardIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bgCardBorder, marginVertical: 12 },
    weekCardFooter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.bgCardBorder, alignItems: 'center', justifyContent: 'center' },
    insightBox: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, marginTop: Spacing.sm },
    insightLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: Typography.lsWider, marginBottom: 4 },
    insightText: { fontSize: Typography.sm, color: theme.colors.textSecondary, lineHeight: 20 },
  }));

  const previewDay = currentPlanDays[selectedPlanDayIndex || 0] || (dayName ? currentPlanDays.find((d: any) => d.day_name === dayName) || null : null);
  const planDetails = workoutPlanDays as WorkoutPlanDays & {
    goal?: string | null;
    speciality?: string | null;
    specialty?: string | null;
    start_date?: string | null;
    started_on?: string | null;
    created_at?: string | null;
  };
  const planGoal = planDetails.goal || 'Build muscle';
  const planSpeciality = planDetails.speciality || planDetails.specialty || 'Strength training';
  const planStartedOn = formatPlanDate(planDetails.started_on || planDetails.start_date || planDetails.created_at);
  const workoutsCompleted = weeklyStats?.sessions ?? 0;
  const workoutsTarget = Math.max(daysPerWeek, workoutsCompleted);
  const totalVolume = exercises.reduce((total, exercise) => {
    return total + (exercise.logged_sets || []).reduce((setTotal, set) => {
      return setTotal + (Number(set.weight) || 0) * (Number(set.reps) || 0);
    }, 0);
  }, 0);
  const avgWorkoutTime = workoutsCompleted > 0 && weeklyStats
    ? Math.round(weeklyStats.total_time_minutes / workoutsCompleted)
    : 0;

  const openDay = (index: number) => {
    onSelectedPlanDayIndexChange(index);
    onShowWorkoutPreview();
  };

  const planDaysCountLabel = daysPerWeek > 0 ? `${daysPerWeek} day${daysPerWeek === 1 ? '' : 's'} / week` : 'No days yet';

  return (
    <View style={styles.section}>
      <SectionHeader title="Your Workout Plan" subtitle="Track your workout schedule and progress" />
      <GlassCardView style={[styles.planCard, { borderColor: Colors.teal + '40' }]}>
        <View style={styles.planCardTop}>
          <View style={styles.planCardContent}>
            <Text style={styles.planEyebrow}>Current Plan</Text>
            <View style={styles.planTitleRow}>
              <Text style={styles.planTitle} numberOfLines={2}>{currentPlanName}</Text>
            </View>

            <View style={styles.planMetaRow}>
              <View style={[styles.planMetaPill, { backgroundColor: Colors.teal + '16', borderColor: Colors.teal + '40' }]}>
                <Text style={[styles.planMetaText, { color: Colors.teal }]}>{planDaysCountLabel}</Text>
              </View>
              <View style={[styles.planMetaPill, { backgroundColor: Colors.accentBlue + '14', borderColor: Colors.accentBlue + '35' }]}>
                <Text style={[styles.planMetaText, { color: Colors.accentBlue }]}>{planSpeciality}</Text>
              </View>
              <View style={[styles.planMetaPill, { backgroundColor: Colors.bgCardBorder, borderColor: Colors.bgCardBorder }]}>
                <Text style={[styles.planMetaText, { color: Colors.textSecondary }]}>Ongoing</Text>
              </View>
            </View>

            <Text style={styles.planDescription}>
              Goal: {planGoal}
            </Text>
          </View>
          <TouchableOpacity style={styles.planEditBtn} activeOpacity={0.7} onPress={() => Alert.alert('Coming Soon', 'Workout plan editing is under development and will be available soon!')}>
            <Pencil size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.planStatsRow}>
          <View style={styles.planStat}>
            <Text style={styles.planStatLabel}>Schedule</Text>
            <Text style={styles.planStatValue}>{planDaysCountLabel}</Text>
          </View>
          <View style={styles.planStatDivider} />
          <View style={styles.planStat}>
            <Text style={styles.planStatLabel}>Goal</Text>
            <Text style={styles.planStatValue}>{planGoal}</Text>
          </View>
          <View style={styles.planStatDivider} />
          <View style={styles.planStat}>
            <Text style={styles.planStatLabel}>Started On</Text>
            <Text style={styles.planStatValue}>{planStartedOn}</Text>
          </View>
        </View>
      </GlassCardView>

      <View style={styles.planActionsRow}>
        <TouchableOpacity activeOpacity={0.7} style={styles.planActionBtn} onPress={() => onOpenCustomPlan?.()}>
          <Text style={styles.planActionText}>Custom Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={styles.planActionBtn} onPress={() => onOpenExplorePlans?.()}>
          <Text style={styles.planActionText}>Explore Plans</Text>
        </TouchableOpacity>
      </View>

      {(() => {
        const todayIndex = currentPlanDays.findIndex((d: any) => d.day_name === dayName);
        const todayPlanDay = todayIndex >= 0 ? currentPlanDays[todayIndex] : null;
        if (!todayPlanDay) return null;
        const todayExCount = todayPlanDay.exercises?.length ?? 0;
        return (
          <>
            <SectionHeader title="Today's Schedule" />
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => openDay(todayIndex)}
              style={{ marginBottom: Spacing.base }}
            >
              <GlassCardView style={[styles.card, { flexDirection: 'row', alignItems: 'center', marginBottom: 0 }]}>
                <View style={[styles.weekCardIcon, { marginRight: Spacing.md, marginVertical: 0 }]}>
                  <Dumbbell size={20} color={Colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.weekCardName, { textAlign: 'left', marginTop: 0 }]}>{todayPlanDay.day_name}</Text>
                  <Text style={[styles.weekCardSub, { textAlign: 'left', marginTop: 4 }]}>
                    {todayExCount > 0 ? `${todayExCount} exercise${todayExCount === 1 ? '' : 's'} planned` : 'No exercises yet'}
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.textSecondary} />
              </GlassCardView>
            </TouchableOpacity>
          </>
        );
      })()}

      <SectionHeader title="This Week's Schedule" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRail}>
        {currentPlanDays.length > 0 ? currentPlanDays.map((day: any, index: number) => {
          const isTodayDay = day.day_name === dayName;
          return (
            <TouchableOpacity
              key={`${day.day_no}-${day.day_name}`}
              activeOpacity={0.82}
              onPress={() => openDay(index)}>
              <GlassCardView style={styles.weekCard}>
                <Text style={styles.weekCardDay}>{WEEKDAY_ABBR[(day.day_no - 1) % 7]}</Text>
                <Text style={styles.weekCardName} numberOfLines={1}>{day.day_name}</Text>
                <View style={styles.weekCardIcon}>
                  <Dumbbell size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.weekCardSub}>
                  {isTodayDay ? `${exercises.length} today` : day.exercises ? `${day.exercises.length} exercises` : 'Workout day'}
                </Text>
                <View style={styles.weekCardFooter}>
                  <ChevronRight size={12} color={Colors.textSecondary} />
                </View>
              </GlassCardView>
            </TouchableOpacity>
          );
        }) : (
          <GlassCardView style={[styles.weekCard, { width: '100%', justifyContent: 'center' }]}>
            <Text style={styles.weekCardName}>No plan days yet</Text>
            <Text style={styles.weekCardSub}>Set up your schedule to populate this row.</Text>
          </GlassCardView>
        )}
      </ScrollView>

      <View style={[styles.section, { marginTop: Spacing.base }]}>
        <SectionHeader title="Plan Insights" />
        <GlassCardView style={[styles.planCard, { paddingVertical: Spacing.lg }]}>
          <View style={{ flexDirection: 'row' }}>
            <View style={styles.planStat}>
              <Text style={styles.planStatLabel}>Workouts</Text>
              <Text style={styles.planStatValue}>{workoutsCompleted} / {workoutsTarget}</Text>
            </View>
            <View style={styles.planStatDivider} />
            <View style={styles.planStat}>
              <Text style={styles.planStatLabel}>Total Volume</Text>
              <Text style={styles.planStatValue}>{Math.round(totalVolume).toLocaleString()} kg</Text>
            </View>
            <View style={styles.planStatDivider} />
            <View style={styles.planStat}>
              <Text style={styles.planStatLabel}>Avg. Time</Text>
              <Text style={styles.planStatValue}>{avgWorkoutTime} min</Text>
            </View>
          </View>
        </GlassCardView>
      </View>
    </View>
  );
}
