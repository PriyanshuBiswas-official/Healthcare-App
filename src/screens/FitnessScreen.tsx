import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/theme';
import { GlassCardView, SectionHeader, Chip, ProgressBar } from '../components/SharedComponents';

const WORKOUTS = [
  {
    name: 'Upper Body Power',
    tag: 'Today',
    tagColor: Colors.teal,
    duration: '55 min',
    calories: '420',
    icon: '🏋️',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8', weight: '80 kg', done: true },
      { name: 'Overhead Press', sets: 3, reps: '10', weight: '50 kg', done: true },
      { name: 'Lat Pulldown', sets: 4, reps: '12', weight: '65 kg', done: false },
      { name: 'Tricep Dips', sets: 3, reps: '15', weight: 'BW', done: false },
    ],
  },
];

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders'];

export default function FitnessScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [exercises, setExercises] = useState(WORKOUTS[0].exercises);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const toggleExercise = (i: number) => {
    const updated = [...exercises];
    updated[i] = { ...updated[i], done: !updated[i].done };
    setExercises(updated);
  };

  const doneCnt = exercises.filter(e => e.done).length;
  const progress = doneCnt / exercises.length;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gym Tracker</Text>
          <Text style={styles.sub}>Week 3 · Push Day</Text>
        </View>

        {/* Weekly Streak */}
        <GlassCardView style={styles.streakCard}>
          <Text style={styles.streakLabel}>WEEKLY ACTIVITY</Text>
          <View style={styles.streakDays}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <View key={i} style={styles.streakDayWrap}>
                <View style={[
                  styles.streakDot,
                  i < 4 && { backgroundColor: Colors.teal, ...Shadows.teal },
                  i === 4 && { backgroundColor: Colors.amber, borderWidth: 2, borderColor: Colors.amber },
                ]} />
                <Text style={[styles.streakDayLabel, i < 4 && { color: Colors.teal }]}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: Spacing.md }}>
            <View style={styles.streakStatRow}>
              <Text style={styles.streakStatLabel}>This week</Text>
              <Text style={[styles.streakStatVal, { color: Colors.teal }]}>4 / 5 sessions</Text>
            </View>
            <ProgressBar progress={0.8} color={Colors.teal} height={6} style={{ marginTop: Spacing.xs }} />
          </View>
        </GlassCardView>

        {/* Workout Timer */}
        <GlassCardView style={styles.timerCard} accentColor={Colors.teal}>
          <Text style={styles.timerTitle}>Workout Timer</Text>
          <Text style={styles.timerDisplay}>{formatTime(seconds)}</Text>
          <View style={styles.timerBtns}>
            <TouchableOpacity
              style={[styles.timerBtn, { backgroundColor: timerRunning ? Colors.pink + '30' : Colors.teal + '30', borderColor: timerRunning ? Colors.pink : Colors.teal }]}
              onPress={() => setTimerRunning(r => !r)}>
              <Text style={{ fontSize: 22 }}>{timerRunning ? '⏸' : '▶️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timerBtn, { backgroundColor: Colors.bgCardBorder, borderColor: Colors.bgCardBorder }]}
              onPress={() => { setSeconds(0); setTimerRunning(false); }}>
              <Text style={{ fontSize: 22 }}>🔄</Text>
            </TouchableOpacity>
          </View>
        </GlassCardView>

        {/* Muscle Group Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {MUSCLE_GROUPS.map(g => (
            <Chip
              key={g}
              label={g}
              selected={activeFilter === g}
              color={Colors.teal}
              onPress={() => setActiveFilter(g)}
            />
          ))}
        </ScrollView>

        {/* Today's Workout */}
        <SectionHeader
          title="Today's Workout"
          subtitle={`${doneCnt} / ${exercises.length} complete`}
        />
        <GlassCardView style={styles.workoutHeader}>
          <View style={styles.workoutTop}>
            <View style={styles.workoutIconWrap}>
              <Text style={{ fontSize: 30 }}>{WORKOUTS[0].icon}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.workoutName}>{WORKOUTS[0].name}</Text>
              <View style={styles.workoutMeta}>
                <Text style={styles.workoutMetaText}>⏱ {WORKOUTS[0].duration}</Text>
                <Text style={styles.workoutMetaText}>  🔥 {WORKOUTS[0].calories} kcal</Text>
              </View>
            </View>
            <View style={[styles.workoutTag, { backgroundColor: Colors.teal + '25', borderColor: Colors.teal + '60' }]}>
              <Text style={[styles.workoutTagText, { color: Colors.teal }]}>{WORKOUTS[0].tag}</Text>
            </View>
          </View>
          <ProgressBar progress={progress} color={Colors.teal} height={6} style={{ marginTop: Spacing.md }} />
          <Text style={styles.workoutProgress}>{Math.round(progress * 100)}% complete</Text>
        </GlassCardView>

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          {exercises.map((ex, i) => (
            <GlassCardView key={i} style={[styles.exCard, ex.done && { borderColor: Colors.teal + '50' }]}>
              <View style={styles.exRow}>
                <TouchableOpacity
                  onPress={() => toggleExercise(i)}
                  style={[styles.exCheck, ex.done && { backgroundColor: Colors.teal, borderColor: Colors.teal }]}>
                  {ex.done && <Text style={styles.exCheckMark}>✓</Text>}
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={[styles.exName, ex.done && { color: Colors.teal }]}>{ex.name}</Text>
                  <Text style={styles.exDetail}>
                    {ex.sets} sets · {ex.reps} reps · {ex.weight}
                  </Text>
                </View>
                <View style={[styles.exSetBadge, { backgroundColor: ex.done ? Colors.teal + '20' : Colors.bgCardBorder }]}>
                  <Text style={[styles.exSetText, { color: ex.done ? Colors.teal : Colors.textMuted }]}>{ex.sets}×{ex.reps}</Text>
                </View>
              </View>
            </GlassCardView>
          ))}
        </View>

        {/* AI Recommendation */}
        <GlassCardView style={styles.aiCard} accentColor={Colors.purple}>
          <Text style={[styles.aiLabel, { color: Colors.purple }]}>✦ AI TRAINER RECOMMENDATION</Text>
          <Text style={styles.aiText}>
            Your bench press volume is up 12% this week. Consider adding a deload day next week to prevent overtraining and maximize hypertrophy gains.
          </Text>
        </GlassCardView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: Typography.sm, color: Colors.teal, marginTop: 4, fontWeight: Typography.medium },
  streakCard: { padding: Spacing.base, marginBottom: Spacing.base },
  streakLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: Spacing.md },
  streakDays: { flexDirection: 'row', justifyContent: 'space-around' },
  streakDayWrap: { alignItems: 'center', gap: Spacing.xs },
  streakDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgCardBorder,
  },
  streakDayLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.medium },
  streakStatRow: { flexDirection: 'row', justifyContent: 'space-between' },
  streakStatLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  streakStatVal: { fontSize: Typography.sm, fontWeight: Typography.bold },
  timerCard: { padding: Spacing.lg, marginBottom: Spacing.xl, alignItems: 'center' },
  timerTitle: { fontSize: Typography.sm, color: Colors.textSecondary, letterSpacing: 1.2, marginBottom: Spacing.sm },
  timerDisplay: { fontSize: 52, fontWeight: Typography.extraBold, color: Colors.teal, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  timerBtns: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.lg },
  timerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterScroll: { marginBottom: Spacing.xl },
  workoutHeader: { padding: Spacing.base, marginBottom: Spacing.md },
  workoutTop: { flexDirection: 'row', alignItems: 'center' },
  workoutIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.teal + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutName: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  workoutMeta: { flexDirection: 'row', marginTop: 4 },
  workoutMetaText: { fontSize: Typography.xs, color: Colors.textSecondary },
  workoutTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  workoutTagText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  workoutProgress: { fontSize: Typography.xs, color: Colors.teal, marginTop: Spacing.xs, textAlign: 'right' },
  exerciseList: { gap: Spacing.sm, marginBottom: Spacing.xl },
  exCard: { padding: Spacing.base },
  exRow: { flexDirection: 'row', alignItems: 'center' },
  exCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exCheckMark: { color: Colors.bg, fontSize: 12, fontWeight: Typography.bold },
  exName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  exDetail: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  exSetBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  exSetText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  aiCard: { padding: Spacing.base, marginBottom: Spacing.base },
  aiLabel: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1.5, marginBottom: Spacing.sm },
  aiText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
});
