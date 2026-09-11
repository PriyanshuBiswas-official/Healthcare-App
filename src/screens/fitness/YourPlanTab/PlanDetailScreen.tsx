import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Typography, Spacing, Radius, Colors } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, GlassCardView } from '../../../components/SharedComponents';
import type { LibraryWorkoutPlan } from '../../../data/libraryWorkoutPlans';
import { Calendar, Check } from 'lucide-react-native';

function getMuscleGroupIcon(muscleGroup: string | null): string {
  const icons: Record<string, string> = {
    Chest: '🫁', Shoulders: '🏋️', Lats: '🔙', 'Lower Back': '🔙',
    Biceps: '💪', Triceps: '💪', Glutes: '🍑', Hamstrings: '🦵',
    Abdominals: '🫁', Calves: '🦵', Cardio: '❤️',
  };
  return icons[muscleGroup || ''] || '🏋️';
}

export default function PlanDetailScreen({
  plan,
  onBack,
  onActivatePlan,
}: {
  plan: LibraryWorkoutPlan;
  onBack: () => void;
  onActivatePlan: (plan: LibraryWorkoutPlan) => void;
}) {
  const insets = useSafeAreaInsets();

  const handleActivate = () => {
    Alert.alert(
      'Activate Plan',
      `This will set "${plan.plan_name}" as your current workout plan. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'default',
          onPress: () => onActivatePlan(plan),
        },
      ],
    );
  };

  const styles = useStyles((theme: any) => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingTop: insets.top + Spacing.xl,
      paddingBottom: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    scrollContent: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.lg,
      paddingBottom: 120,
    },
    overviewCard: {
      padding: Spacing.base,
      marginBottom: Spacing.lg,
    },
    planName: {
      fontSize: Typography.xxl,
      fontWeight: Typography.extraBold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    planDescription: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: Spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    daysBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: Radius.full,
      backgroundColor: Colors.amberDim,
      borderWidth: 1,
      borderColor: Colors.amber + '30',
    },
    daysText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: Colors.amber,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginBottom: Spacing.md,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: Spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
      backgroundColor: 'rgba(107,138,255,0.08)',
      borderColor: 'rgba(107,138,255,0.20)',
    },
    chipText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: '#8B9CC4',
    },
    daySection: {
      marginBottom: Spacing.lg,
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    dayBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.amberDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayBadgeText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: Colors.amber,
    },
    dayTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
    },
    dayCard: {
      padding: Spacing.md,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    exerciseRowLast: {
      borderBottomWidth: 0,
    },
    exerciseIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      backgroundColor: theme.colors.bgCardSolid,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    exerciseIconText: {
      fontSize: Typography.base,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: theme.colors.textPrimary,
    },
    exerciseMeta: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    exerciseSets: {
      alignItems: 'flex-end',
    },
    exerciseSetsText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
    },
    exerciseRepsText: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.md,
      paddingBottom: insets.bottom + Spacing.md,
      backgroundColor: theme.colors.bg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.bgCardBorder,
    },
    activateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.amber,
      paddingVertical: Spacing.md + 2,
      borderRadius: Radius.md,
      gap: Spacing.sm,
      shadowColor: Colors.amber,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    activateBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: '#000000',
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} color={Colors.text} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{plan.plan_name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Overview */}
        <GlassCardView style={styles.overviewCard}>
          <View style={styles.topRow}>
            <Text style={styles.planName}>{plan.plan_name}</Text>
            <View style={styles.daysBadge}>
              <Calendar size={12} color={Colors.amber} />
              <Text style={styles.daysText}>{plan.days_per_week}d / wk</Text>
            </View>
          </View>

          <Text style={styles.planDescription}>{plan.description}</Text>

          <View style={styles.divider} />

          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{plan.goal}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{plan.best_for}</Text>
            </View>
          </View>
        </GlassCardView>

        {/* Day-by-Day Breakdown */}
        {plan.days.map((day, dayIndex) => (
          <View key={`${day.day_no}-${day.day_name}`} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>{dayIndex + 1}</Text>
              </View>
              <Text style={styles.dayTitle}>{day.day_name}</Text>
            </View>

            <GlassCardView style={styles.dayCard}>
              {day.exercises.map((exercise, exIndex) => {
                const isLast = exIndex === day.exercises.length - 1;
                return (
                  <View
                    key={`${exercise.exercise_name}-${exIndex}`}
                    style={[styles.exerciseRow, isLast && styles.exerciseRowLast]}
                  >
                    <View style={styles.exerciseIcon}>
                      <Text style={styles.exerciseIconText}>
                        {getMuscleGroupIcon(exercise.muscle_group)}
                      </Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.equipment === 'None' ? 'Bodyweight' : exercise.equipment}
                        {exercise.muscle_group ? ` · ${exercise.muscle_group}` : ''}
                      </Text>
                    </View>
                    <View style={styles.exerciseSets}>
                      <Text style={styles.exerciseSetsText}>{exercise.sets} × {exercise.reps}</Text>
                      <Text style={styles.exerciseRepsText}>sets × reps</Text>
                    </View>
                  </View>
                );
              })}
            </GlassCardView>
          </View>
        ))}
      </ScrollView>

      {/* Activate Plan Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.activateBtn}
          onPress={handleActivate}
        >
          <Check size={20} color="#000000" strokeWidth={3} />
          <Text style={styles.activateBtnText}>Activate Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
