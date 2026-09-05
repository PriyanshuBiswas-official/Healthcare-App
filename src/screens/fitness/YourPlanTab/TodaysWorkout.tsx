import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles, useTheme } from '../../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell, Check, Pencil } from 'lucide-react-native';
import { GlassCardView, SectionHeader, BackButton } from '../../../components/SharedComponents';
import { WorkoutTimer } from '../../../components/WorkoutTimer';
import { useWorkoutTimer } from '../../../hooks/useWorkoutTimer';
import type { TodayExercise } from '../../../types/activity';

interface TodaysWorkoutProps {
  exercises: TodayExercise[];
  dayName: string | null;
  planName: string | null;
  planDayId: number | null;
  onSetupPlan: () => void;
  onAddExercise: () => void;
  onEditExercise: (ex: TodayExercise) => void;
  onLogExercise: (exercise: any) => void;
  onStartSession?: () => void;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showAddExercise?: boolean;
  startSessionMode?: boolean;
}

export function TodaysWorkout({
  exercises,
  dayName,
  planName,
  planDayId,
  onSetupPlan,
  onAddExercise,
  onEditExercise,
  onLogExercise,
  onStartSession,
  title = "Today's Workout",
  subtitle,
  showHeader = true,
  showAddExercise = true,
  startSessionMode = false,
}: TodaysWorkoutProps) {
  const styles = useStyles((theme: any) => ({
    card: { padding: Spacing.base, marginBottom: Spacing.sm },
    exerciseCard: { padding: Spacing.base, marginBottom: Spacing.sm },
    exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    exerciseIconWrap: {
      width: 40, height: 40, borderRadius: Radius.sm,
      backgroundColor: theme.colors.accentBlue + '20',
      alignItems: 'center', justifyContent: 'center',
    },
    exerciseTitleWrap: { flex: 1, marginLeft: Spacing.md },
    exerciseName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    tag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
    tagText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    setsRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: Spacing.xs, marginTop: Spacing.sm },
    setChip: { backgroundColor: theme.colors.bgCardBorder, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
    setChipText: { fontSize: Typography.xs, color: theme.colors.textSecondary, fontWeight: Typography.medium },
  }));

  if (exercises.length === 0) {
    return (
      <>
        {showHeader && <SectionHeader title={title} subtitle={subtitle || dayName || undefined} />}
        <GlassCardView style={styles.card}>
          <View style={{ paddingVertical: Spacing.lg, alignItems: 'center' }}>
            <Dumbbell size={Typography.xxl} color={Colors.textSecondary} />
            <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm }}>
              {planName ? `No workout planned for ${dayName || 'today'}` : 'No workout plan set up yet'}
            </Text>
            {!planName && showAddExercise && (
              <TouchableOpacity
                onPress={onSetupPlan}
                style={{ marginTop: Spacing.md, backgroundColor: Colors.accentBlue, paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.xl, borderRadius: Radius.md }}
                activeOpacity={0.8}>
                <Text style={{ color: Colors.bg, fontWeight: Typography.bold, fontSize: Typography.sm }}>Set Up Workout Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCardView>
      </>
    );
  }

  return (
    <>
      {showHeader && <SectionHeader title={title} subtitle={subtitle || dayName || undefined} />}
      {exercises.map((ex) => {
        const loggedSets = ex.logged_sets || [];
        const hasLogged = loggedSets.length > 0;
        const isCompleted = ex.completed;

        return (
          <View key={ex.exercise_id} style={{ position: 'relative' }}>
            <TouchableOpacity onPress={() => onLogExercise(ex)} activeOpacity={0.7}>
              <GlassCardView style={[styles.exerciseCard, isCompleted && { borderColor: Colors.teal + '40', borderWidth: 1 }]}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseIconWrap}>
                    {isCompleted ? <Check size={Typography.md} color={Colors.teal} /> : <Dumbbell size={Typography.md} color={Colors.textSecondary} />}
                  </View>
                  <View style={styles.exerciseTitleWrap}>
                    <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
                    <View style={styles.tagRow}>
                      <View style={[styles.tag, { backgroundColor: Colors.teal + '20', borderColor: Colors.teal + '50' }]}>
                        <Text style={[styles.tagText, { color: Colors.teal }]}>{ex.target_sets}×{ex.target_reps}</Text>
                      </View>
                      {isCompleted ? (
                        <View style={[styles.tag, { backgroundColor: Colors.teal + '30', borderColor: Colors.teal + '60' }]}>
                          <Text style={[styles.tagText, { color: Colors.teal, fontWeight: Typography.bold }]}>Completed</Text>
                        </View>
                      ) : hasLogged ? (
                        <View style={[styles.tag, { backgroundColor: Colors.accentBlue + '20', borderColor: Colors.accentBlue + '50' }]}>
                          <Text style={[styles.tagText, { color: Colors.accentBlue }]}>Logged</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
                {hasLogged ? (
                  <View style={styles.setsRow}>
                    {loggedSets.map(set => (
                      <View key={set.set_id} style={styles.setChip}>
                        <Text style={styles.setChipText}>
                          Set {set.set_no}: {set.weight}kg × {set.reps}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.setsRow}>
                    {Array.from({ length: ex.target_sets }).map((_, i) => (
                      <View key={i} style={styles.setChip}>
                        <Text style={styles.setChipText}>Set {i + 1}: {ex.target_reps} reps</Text>
                      </View>
                    ))}
                  </View>
                )}
              </GlassCardView>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onEditExercise(ex)} style={{ position: 'absolute', top: Spacing.base, right: Spacing.base, padding: Spacing.xs, zIndex: 1 }} activeOpacity={0.6}>
              <Pencil size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        );
      })}
      {planDayId && showAddExercise && (
        <TouchableOpacity
          onPress={startSessionMode ? (onStartSession || onAddExercise) : onAddExercise}
          style={startSessionMode
            ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: Spacing.md, marginTop: Spacing.xs, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.teal + '30', backgroundColor: Colors.tealDim }
            : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: Spacing.md, marginTop: Spacing.xs, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.accentBlue + '50', borderStyle: 'dashed', backgroundColor: Colors.accentBlue + '08' }}
          activeOpacity={0.7}>
          {startSessionMode ? (
            <Text style={{ fontSize: Typography.sm, color: Colors.teal, fontWeight: Typography.bold }}>Start Session</Text>
          ) : (
            <>
              <Text style={{ fontSize: Typography.md, marginRight: Spacing.xs, color: Colors.accentBlue }}>+</Text>
              <Text style={{ fontSize: Typography.sm, color: Colors.accentBlue, fontWeight: Typography.semiBold }}>Add Exercise</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </>
  );
}

// ── Workout Preview Overlay ──────────────────────────────────

interface WorkoutPreviewOverlayProps {
  visible: boolean;
  onClose: () => void;
  dayName: string | null;
  planName: string | null;
  exercises: TodayExercise[];
  planDayExercises: TodayExercise[];
  selectedDayName: string | null;
  planDayId: number | null;
  onSetupPlan: () => void;
  onAddExercise: (dayId: number) => void;
  onEditExercise: (ex: TodayExercise) => void;
  onLogExercise: (exercise: any) => void;
}

export function WorkoutPreviewOverlay({
  visible,
  onClose,
  dayName,
  planName,
  exercises,
  planDayExercises,
  selectedDayName,
  planDayId,
  onSetupPlan,
  onAddExercise,
  onEditExercise,
  onLogExercise,
}: WorkoutPreviewOverlayProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const timer = useWorkoutTimer();

  const styles = useStyles((t: any) => ({
    overlay: { flex: 1, backgroundColor: t.colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.lg, paddingBottom: Spacing.base,
      borderBottomWidth: 1, borderBottomColor: t.colors.bgCardBorder,
    },
    titleWrap: { flex: 1, paddingHorizontal: Spacing.md, alignItems: 'center' },
    title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary, textAlign: 'center' },
    subtitle: { fontSize: Typography.sm, color: t.colors.textSecondary, marginTop: 2, textAlign: 'center' },
    spacer: { width: 44, height: 44 },
    content: { padding: Spacing.base, paddingBottom: 100 },
  }));

  if (!visible) return null;

  const displayExercises = selectedDayName === dayName ? exercises : planDayExercises;

  return (
    <View style={[styles.overlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }]}>
      <View style={styles.header}>
        <BackButton onPress={() => { onClose(); }} color={Colors.textPrimary} />
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{selectedDayName || dayName || ''} Workout</Text>
          <Text style={styles.subtitle}>{planName}</Text>
        </View>
        <View style={styles.spacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <WorkoutTimer
          status={timer.status}
          formatted={timer.formatted}
          onStart={timer.start}
          onPause={timer.pause}
          onResume={timer.resume}
          onStop={timer.stop}
        />
        <TodaysWorkout
          exercises={displayExercises}
          dayName={selectedDayName}
          planName={planName}
          planDayId={planDayId}
          onSetupPlan={onSetupPlan}
          onAddExercise={() => planDayId && onAddExercise(planDayId)}
          onEditExercise={onEditExercise}
          onLogExercise={onLogExercise}
          title="Exercises"
          subtitle={undefined}
          showHeader={false}
          showAddExercise={true}
        />
      </ScrollView>
    </View>
  );
}
