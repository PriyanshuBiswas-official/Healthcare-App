import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/theme';
import { GlassCardView, Chip, ProgressBar, ProfileAvatarButton, NotificationIconButton } from '../components/SharedComponents';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';
import { TabName } from '../navigation/TabBar';
import { useAuth } from '../providers/AuthProvider';
import * as activityService from '../services/activityService';
import type { ActivitySummary, TodayExercise, WeeklyDay, WeeklyStats, PersonalRecord } from '../types/activity';
import type { PlanDayInput } from '../services/activityService';

const { width } = Dimensions.get('window');

type Segment = 'Today' | 'Weekly' | 'Workouts' | 'PRs';

const SEGMENTS: Segment[] = ['Today', 'Weekly', 'Workouts', 'PRs'];

const MUSCLE_FILTERS = ['All', 'Chest', 'Shoulders', 'Triceps', 'Core'];

function formatDateHeader(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function SectionLabel({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {action && <Text style={styles.sectionAction}>{action}</Text>}
    </View>
  );
}

function SegmentedControl({
  segments,
  active,
  onChange,
}: {
  segments: Segment[];
  active: Segment;
  onChange: (s: Segment) => void;
}) {
  return (
    <View style={styles.segmented}>
      {segments.map(seg => (
        <TouchableOpacity
          key={seg}
          style={[styles.segmentBtn, active === seg && styles.segmentBtnActive]}
          onPress={() => onChange(seg)}
          activeOpacity={0.8}>
          <Text style={[styles.segmentText, active === seg && styles.segmentTextActive]}>{seg}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ActivityRingsCard({ summary }: { summary: ActivitySummary | null }) {
  const burnTarget = 400;
  const exerciseTarget = 60;
  const stepsTarget = 10000;

  const burnProgress = summary ? Math.min(summary.calories_burned / burnTarget, 1) : 0;
  const exerciseProgress = summary ? Math.min(summary.exercise_minutes / exerciseTarget, 1) : 0;
  const stepsProgress = summary ? Math.min(summary.steps / stepsTarget, 1) : 0;

  const ringScore = Math.round((burnProgress + exerciseProgress + stepsProgress) / 3 * 100);

  const rings = [
    { label: 'Burn', current: summary?.calories_burned ?? 0, target: burnTarget, unit: 'kcal', color: Colors.pink, progress: burnProgress },
    { label: 'Exercise', current: summary?.exercise_minutes ?? 0, target: exerciseTarget, unit: 'min', color: Colors.purple, progress: exerciseProgress },
    { label: 'Steps', current: summary?.steps ?? 0, target: stepsTarget, unit: 'steps', color: Colors.teal, progress: stepsProgress },
  ];

  return (
    <GlassCardView style={styles.card}>
      <SectionLabel title="ACTIVITY RINGS" />
      <View style={styles.ringsRow}>
        <View style={styles.ringsVisual}>
          <View style={[styles.ringOuter, { borderColor: Colors.pink + '40' }]}>
            <View style={[styles.ringMid, { borderColor: Colors.purple + '50' }]}>
              <View style={[styles.ringInner, { borderColor: Colors.teal + '60' }]}>
                <Text style={styles.ringScore}>{ringScore}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.ringsMetrics}>
          {rings.map(ring => (
            <View key={ring.label} style={styles.ringMetric}>
              <View style={styles.ringMetricHeader}>
                <Text style={[styles.ringMetricLabel, { color: ring.color }]}>{ring.label}</Text>
                <Text style={styles.ringMetricVal}>
                  {ring.current.toLocaleString()} / {ring.target.toLocaleString()} {ring.unit}
                </Text>
              </View>
              <ProgressBar progress={ring.progress} color={ring.color} height={5} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.vitalRow}>
        <View style={styles.vitalPill}>
          <Text style={styles.vitalVal}>{summary?.distance ?? 0}</Text>
          <Text style={styles.vitalLabel}>distance (m)</Text>
        </View>
        <View style={styles.vitalPill}>
          <Text style={styles.vitalVal}>{summary?.steps?.toLocaleString() ?? '0'}</Text>
          <Text style={styles.vitalLabel}>total steps</Text>
        </View>
        <View style={styles.vitalPill}>
          <Text style={styles.vitalVal}>{summary?.calories_burned?.toLocaleString() ?? '0'}</Text>
          <Text style={styles.vitalLabel}>kcal burned</Text>
        </View>
      </View>
    </GlassCardView>
  );
}

function TodaysWorkout({
  exercises,
  dayName,
  planName,
  activeFilter,
  setActiveFilter,
}: {
  exercises: TodayExercise[];
  dayName: string | null;
  planName: string | null;
  activeFilter: string;
  setActiveFilter: (f: string) => void;
}) {
  if (exercises.length === 0) {
    return (
      <>
        <SectionLabel title="TODAY'S WORKOUT" action={dayName?.toUpperCase() || ''} />
        <GlassCardView style={styles.card}>
          <View style={{ paddingVertical: Spacing.lg, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: Spacing.sm }}>🏋️</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm }}>
              {planName ? `No workout planned for ${dayName || 'today'}` : 'No workout plan set up yet'}
            </Text>
          </View>
        </GlassCardView>
      </>
    );
  }

  const displayExercises =
    activeFilter === 'All'
      ? exercises
      : exercises.filter(e => e.exercise_name.toLowerCase().includes(activeFilter.toLowerCase()));

  return (
    <>
      <SectionLabel title="TODAY'S WORKOUT" action={dayName?.toUpperCase() || ''} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {MUSCLE_FILTERS.map(g => (
          <Chip key={g} label={g} selected={activeFilter === g} color={Colors.purple} onPress={() => setActiveFilter(g)} />
        ))}
      </ScrollView>
      {displayExercises.map((ex) => {
        const loggedSets = ex.logged_sets || [];
        const hasLogged = loggedSets.length > 0;
        const topWeight = loggedSets.length > 0 ? Math.max(...loggedSets.map(s => s.weight || 0)) : 0;

        return (
          <GlassCardView key={ex.exercise_id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIconWrap}>
                <Text style={{ fontSize: 18 }}>💪</Text>
              </View>
              <View style={styles.exerciseTitleWrap}>
                <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
                <View style={styles.tagRow}>
                  <View style={[styles.tag, { backgroundColor: Colors.teal + '20', borderColor: Colors.teal + '50' }]}>
                    <Text style={[styles.tagText, { color: Colors.teal }]}>{ex.target_sets}×{ex.target_reps}</Text>
                  </View>
                  {hasLogged && (
                    <View style={[styles.tag, { backgroundColor: Colors.purple + '20', borderColor: Colors.purple + '50' }]}>
                      <Text style={[styles.tagText, { color: Colors.purple }]}>Logged</Text>
                    </View>
                  )}
                </View>
              </View>
              {topWeight > 0 && (
                <Text style={styles.topSet}>{topWeight}kg top set</Text>
              )}
            </View>
            {hasLogged ? (
              <View style={styles.setsRow}>
                {loggedSets.map(set => (
                  <View key={set.set_id} style={[styles.setChip, set.completed && { backgroundColor: Colors.teal + '20' }]}>
                    <Text style={[styles.setChipText, set.completed && { color: Colors.teal }]}>
                      Set {set.set_no}: {set.weight}kg × {set.reps}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.setsRow}>
                {Array.from({ length: ex.target_sets }).map((_, i) => (
                  <View key={i} style={styles.setChip}>
                    <Text style={styles.setChipText}>Set {i + 1}: {ex.target_weight || '?'}kg × {ex.target_reps}</Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCardView>
        );
      })}
    </>
  );
}

function AITrainerCard({ onOpenAI }: { onOpenAI?: (from?: string) => void }) {
  return (
    <GlassCardView style={styles.card} accentColor={Colors.purple}>
      <SectionLabel title="Ask AI about your workout" />
      <View style={{ paddingVertical: Spacing.sm }}>
        <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.sm }}>
          Get quick tips, workout swaps, or recovery advice from AI.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: Colors.purple, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md, alignSelf: 'stretch', width: '100%', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => onOpenAI && onOpenAI('Activity')}
          activeOpacity={0.9}>
          <Text style={{ color: Colors.bg, fontWeight: Typography.bold }}>Ask AI</Text>
        </TouchableOpacity>
      </View>
    </GlassCardView>
  );
}

function WeeklyActivityCard({ days, stats }: { days: WeeklyDay[]; stats: WeeklyStats | null }) {
  const maxBarH = 80;
  const maxVal = useMemo(() => {
    if (days.length === 0) return 1;
    return Math.max(...days.map(d => d.calories), 1);
  }, [days]);

  const totalDays = days.filter(d => d.calories > 0 || d.steps > 0).length;

  return (
    <GlassCardView style={styles.card}>
      <View style={styles.weeklyHeader}>
        <SectionLabel title="WEEKLY ACTIVITY" />
        {totalDays > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: Colors.teal + '20', borderColor: Colors.teal + '50' }]}>
            <Text style={[styles.streakBadgeText, { color: Colors.teal }]}>{totalDays} day streak</Text>
          </View>
        )}
      </View>
      <Text style={styles.chartSubtitle}>Volume this week</Text>
      <View style={styles.barChart}>
        {days.map((bar, i) => {
          const barVal = maxVal > 0 ? bar.calories / maxVal : 0;
          const barColor = bar.is_today ? Colors.purple : bar.calories > 0 ? Colors.teal + '90' : Colors.bgCardBorder;
          return (
            <View key={i} style={styles.barCol}>
              <View style={[styles.bar, { height: Math.max(maxBarH * barVal, 8), backgroundColor: barColor }]} />
              <Text style={[styles.barLabel, bar.is_today && { color: Colors.purple, fontWeight: Typography.bold }]}>{bar.day}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.weeklyStatsGrid}>
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatVal}>{stats?.sessions ?? 0}</Text>
          <Text style={styles.weeklyStatLabel}>sessions</Text>
        </View>
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatVal}>{stats ? formatDuration(stats.total_time_minutes) : '0h'}</Text>
          <Text style={styles.weeklyStatLabel}>total time</Text>
        </View>
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatVal}>{stats?.kcal_burned?.toLocaleString() ?? '0'}</Text>
          <Text style={styles.weeklyStatLabel}>kcal burned</Text>
        </View>
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatVal}>{stats?.total_steps?.toLocaleString() ?? '0'}</Text>
          <Text style={styles.weeklyStatLabel}>total steps</Text>
        </View>
      </View>
    </GlassCardView>
  );
}

function PersonalRecordsCard({ prs }: { prs: PersonalRecord[] }) {
  if (prs.length === 0) {
    return (
      <GlassCardView style={styles.card}>
        <SectionLabel title="PERSONAL RECORDS" />
        <View style={{ paddingVertical: Spacing.lg, alignItems: 'center' }}>
          <Text style={{ fontSize: 32, marginBottom: Spacing.sm }}>🏆</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm }}>No personal records yet</Text>
        </View>
      </GlassCardView>
    );
  }

  return (
    <GlassCardView style={styles.card}>
      <View style={styles.weeklyHeader}>
        <SectionLabel title="PERSONAL RECORDS" />
        <View style={[styles.streakBadge, { backgroundColor: Colors.amber + '20', borderColor: Colors.amber + '50' }]}>
          <Text style={[styles.streakBadgeText, { color: Colors.amber }]}>lifetime</Text>
        </View>
      </View>
      <Text style={styles.chartSubtitle}>Your best lifts</Text>
      {prs.map((pr, i) => (
        <View key={pr.pr_id} style={[styles.prRow, i < prs.length - 1 && styles.prRowBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.prExercise}>{pr.exercise_name}</Text>
            <Text style={styles.prDate}>{new Date(pr.achieved_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.prRight}>
            <Text style={styles.prValue}>{pr.weight}kg × {pr.reps}</Text>
            {pr.description && (
              <Text style={[styles.prDelta, { color: Colors.teal }]}>{pr.description}</Text>
            )}
          </View>
        </View>
      ))}
    </GlassCardView>
  );
}

function RecoveryCard() {
  return (
    <GlassCardView style={styles.card}>
      <SectionLabel title="RECOVERY STATUS" />
      <View style={styles.recoveryGrid}>
        <View style={[styles.recoveryMini, { borderColor: Colors.teal + '40' }]}>
          <Text style={styles.recoveryMiniLabel}>HRV STATUS</Text>
          <Text style={[styles.recoveryMiniVal, { color: Colors.teal }]}>68 ms</Text>
        </View>
        <View style={[styles.recoveryMini, { borderColor: Colors.pink + '40' }]}>
          <Text style={styles.recoveryMiniLabel}>SORENESS</Text>
          <Text style={[styles.recoveryMiniVal, { color: Colors.pink }]}>Chest / Delts</Text>
        </View>
      </View>
      <View style={[styles.insightBox, { backgroundColor: Colors.purple + '15', borderColor: Colors.purple + '40' }]}>
        <Text style={[styles.insightLabel, { color: Colors.purple }]}>AI recovery tips</Text>
        <Text style={styles.insightText}>
          Prioritize 7.5+ hours sleep tonight. Reduce intensity on shoulders if soreness persists.
        </Text>
      </View>
    </GlassCardView>
  );
}

export default function FitnessScreen({ onProfilePress, onNotificationsPress, onOpenAI }: { onProfilePress?: () => void; onNotificationsPress?: () => void; onOpenAI?: (from?: TabName) => void }) {
  const { onScroll } = useScrollVisibility();
  const { user, session } = useAuth();
  const [activeSegment, setActiveSegment] = useState<Segment>('Today');
  const [activeFilter, setActiveFilter] = useState('All');

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toDateString(today), [today]);

  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [exercises, setExercises] = useState<TodayExercise[]>([]);
  const [dayName, setDayName] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDay[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Plan setup modal state ─────────────────────────────────
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [planStep, setPlanStep] = useState(1);
  const [planNameInput, setPlanNameInput] = useState('');
  const [planGoal, setPlanGoal] = useState('');
  const [planDaysPerWeek, setPlanDaysPerWeek] = useState('4');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayExercises, setDayExercises] = useState<Record<number, { name: string; sets: string; reps: string; weight: string }[]>>({});
  const [planSaving, setPlanSaving] = useState(false);

  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const [summaryRes, workoutRes, weeklyRes, prsRes] = await Promise.all([
        activityService.getTodaySummary(session.access_token, todayStr),
        activityService.getTodayWorkout(session.access_token, todayStr),
        activityService.getWeeklyStats(session.access_token, todayStr),
        activityService.getPersonalRecords(session.access_token),
      ]);
      setSummary(summaryRes);
      setExercises(workoutRes.exercises);
      setDayName(workoutRes.day_name);
      setPlanName(workoutRes.plan_name);
      setWeeklyDays(weeklyRes.days);
      setWeeklyStats(weeklyRes.stats);
      setPrs(prsRes);
    } catch (e) {
      console.warn('[FitnessScreen] Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, todayStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToday = activeSegment === 'Today';
  const showWeekly = activeSegment === 'Weekly' || showToday;
  const showWorkouts = activeSegment === 'Workouts' || showToday;
  const showPRs = activeSegment === 'PRs' || showToday;

  const hasNoPlan = !loading && !planName;
  const hasNoData = !loading && !summary?.steps && !summary?.calories_burned && exercises.length === 0 && weeklyStats?.sessions === 0;
  const showSetupBanner = hasNoPlan && hasNoData;

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex].sort()
    );
  };

  const addExerciseToDay = (dayIndex: number) => {
    setDayExercises(prev => ({
      ...prev,
      [dayIndex]: [...(prev[dayIndex] || []), { name: '', sets: '3', reps: '10', weight: '' }],
    }));
  };

  const updateExercise = (dayIndex: number, exIndex: number, field: string, value: string) => {
    setDayExercises(prev => ({
      ...prev,
      [dayIndex]: (prev[dayIndex] || []).map((ex, i) => i === exIndex ? { ...ex, [field]: value } : ex),
    }));
  };

  const removeExercise = (dayIndex: number, exIndex: number) => {
    setDayExercises(prev => ({
      ...prev,
      [dayIndex]: (prev[dayIndex] || []).filter((_, i) => i !== exIndex),
    }));
  };

  const resetPlanModal = () => {
    setPlanStep(1);
    setPlanNameInput('');
    setPlanGoal('');
    setPlanDaysPerWeek('4');
    setSelectedDays([]);
    setDayExercises({});
    setPlanSaving(false);
  };

  const openPlanModal = () => {
    resetPlanModal();
    setPlanModalVisible(true);
  };

  const handleSavePlan = async () => {
    if (!session?.access_token) return;
    if (!planNameInput.trim()) {
      Alert.alert('Required', 'Please enter a plan name.');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Required', 'Please select at least one workout day.');
      return;
    }

    setPlanSaving(true);
    try {
      const days: PlanDayInput[] = selectedDays.map((dayIndex, i) => ({
        day_no: dayIndex + 1,
        day_name: DAY_NAMES[dayIndex],
        exercises: (dayExercises[dayIndex] || [])
          .filter(ex => ex.name.trim())
          .map((ex, j) => ({
            exercise_name: ex.name.trim(),
            exercise_order: j + 1,
            sets: parseInt(ex.sets, 10) || 3,
            reps: parseInt(ex.reps, 10) || 10,
            target_weight: ex.weight ? parseInt(ex.weight, 10) : null,
          })),
      }));

      await activityService.createWorkoutPlan(session.access_token, {
        plan_name: planNameInput.trim(),
        goal: planGoal.trim() || undefined,
        days_per_week: parseInt(planDaysPerWeek, 10) || selectedDays.length,
        days,
      });

      setPlanModalVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create plan.');
    } finally {
      setPlanSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>{formatDateHeader(today)}</Text>
            <Text style={styles.title}>Activity & Gym</Text>
          </View>
          <View style={styles.headerRight}>
            <NotificationIconButton onPress={onNotificationsPress} />
            <ProfileAvatarButton
              onPress={onProfilePress}
              userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              avatarUrl={user?.user_metadata?.avatar_url}
            />
          </View>
        </View>

        <SegmentedControl segments={SEGMENTS} active={activeSegment} onChange={setActiveSegment} />

        {/* No Data Setup Banner */}
        {showSetupBanner && (
          <TouchableOpacity style={styles.setupBanner} activeOpacity={0.8} onPress={openPlanModal}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.setupBannerIcon, { backgroundColor: Colors.purple + '20' }]}>
                <Text style={{ fontSize: 16 }}>💪</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary }}>Set up your workout plan</Text>
                <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 }}>Create a plan to track exercises, log sets, and monitor your progress</Text>
              </View>
              <Text style={{ fontSize: 18, color: Colors.textMuted }}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.teal} />
          </View>
        ) : (
          <>
            {showToday && <ActivityRingsCard summary={summary} />}

            {showWorkouts && (
              <View style={styles.section}>
                <TodaysWorkout
                  exercises={exercises}
                  dayName={dayName}
                  planName={planName}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                />
              </View>
            )}

            {showToday && (
              <View style={styles.section}>
                <AITrainerCard onOpenAI={() => onOpenAI && onOpenAI('Activity')} />
              </View>
            )}

            {showWeekly && (
              <View style={styles.section}>
                <WeeklyActivityCard days={weeklyDays} stats={weeklyStats} />
              </View>
            )}

            {showPRs && (
              <View style={styles.section}>
                <PersonalRecordsCard prs={prs} />
              </View>
            )}

            {(showToday || activeSegment === 'Weekly') && (
              <View style={styles.section}>
                <RecoveryCard />
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Plan Setup Modal ───────────────────────────────── */}
      <Modal visible={planModalVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPlanModalVisible(false)}
          style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
        {/* Step indicator */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.base }}>
          {[1, 2, 3].map(s => (
            <View key={s} style={{ width: planStep === s ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: planStep === s ? Colors.purple : Colors.bgCardBorder }} />
          ))}
        </View>

        {/* Step 1: Plan basics */}
        {planStep === 1 && (
          <>
            <Text style={styles.modalTitle}>Create Workout Plan</Text>
            <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.base }}>
              Set up your plan basics. You can add exercises next.
            </Text>
            <Text style={styles.modalLabel}>Plan name *</Text>
            <TextInput
              style={styles.modalInput}
              value={planNameInput}
              onChangeText={setPlanNameInput}
              placeholder="e.g. PPL Split"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <Text style={styles.modalLabel}>Goal</Text>
            <TextInput
              style={styles.modalInput}
              value={planGoal}
              onChangeText={setPlanGoal}
              placeholder="e.g. Build muscle, lose fat"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.modalLabel}>Days per week</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {['3', '4', '5', '6'].map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setPlanDaysPerWeek(d)}
                  style={{
                    flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center',
                    backgroundColor: planDaysPerWeek === d ? Colors.purple + '20' : Colors.bgCardBorder,
                    borderWidth: planDaysPerWeek === d ? 1 : 0, borderColor: Colors.purple,
                  }}>
                  <Text style={{ fontSize: Typography.sm, color: planDaysPerWeek === d ? Colors.purple : Colors.textSecondary, fontWeight: Typography.bold }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity onPress={() => setPlanModalVisible(false)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPlanStep(2)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.purple }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Next</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Step 2: Select days */}
        {planStep === 2 && (
          <>
            <Text style={styles.modalTitle}>Select Workout Days</Text>
            <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.base }}>
              Tap the days you plan to train.
            </Text>
            {DAY_NAMES.map((name, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => toggleDay(i)}
                style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
                  borderBottomWidth: 1, borderBottomColor: Colors.divider,
                }}>
                <View style={{
                  width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
                  borderColor: selectedDays.includes(i) ? Colors.purple : Colors.textMuted,
                  backgroundColor: selectedDays.includes(i) ? Colors.purple : 'transparent',
                }}>
                  {selectedDays.includes(i) && <Text style={{ fontSize: 12, color: Colors.bg, fontWeight: Typography.bold }}>✓</Text>}
                </View>
                <Text style={{ fontSize: Typography.base, color: Colors.textPrimary, marginLeft: Spacing.md, fontWeight: selectedDays.includes(i) ? Typography.bold : Typography.regular }}>{name}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity onPress={() => setPlanStep(1)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPlanStep(3)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.purple }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Next</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Step 3: Add exercises per day */}
        {planStep === 3 && (
          <>
            <Text style={styles.modalTitle}>Add Exercises</Text>
            <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.base }}>
              Add exercises for each day. You can skip and add later.
            </Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {selectedDays.map(dayIndex => (
                <View key={dayIndex} style={{ marginBottom: Spacing.base }}>
                  <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.purple, marginBottom: Spacing.sm }}>{DAY_NAMES[dayIndex]}</Text>
                  {(dayExercises[dayIndex] || []).map((ex, exIndex) => (
                    <View key={exIndex} style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, alignItems: 'center' }}>
                      <TextInput
                        style={[styles.modalInput, { flex: 2, marginBottom: 0 }]}
                        value={ex.name}
                        onChangeText={v => updateExercise(dayIndex, exIndex, 'name', v)}
                        placeholder="Exercise"
                        placeholderTextColor={Colors.textMuted}
                      />
                      <TextInput
                        style={[styles.modalInput, { flex: 0.6, marginBottom: 0, textAlign: 'center' }]}
                        value={ex.sets}
                        onChangeText={v => updateExercise(dayIndex, exIndex, 'sets', v)}
                        keyboardType="number-pad"
                        placeholder="Sets"
                        placeholderTextColor={Colors.textMuted}
                      />
                      <TextInput
                        style={[styles.modalInput, { flex: 0.6, marginBottom: 0, textAlign: 'center' }]}
                        value={ex.reps}
                        onChangeText={v => updateExercise(dayIndex, exIndex, 'reps', v)}
                        keyboardType="number-pad"
                        placeholder="Reps"
                        placeholderTextColor={Colors.textMuted}
                      />
                      <TouchableOpacity onPress={() => removeExercise(dayIndex, exIndex)} style={{ padding: 4 }}>
                        <Text style={{ fontSize: 16, color: Colors.pink }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity onPress={() => addExerciseToDay(dayIndex)} style={{ paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.purple + '40', borderRadius: Radius.sm, backgroundColor: Colors.purple + '08' }}>
                    <Text style={{ fontSize: Typography.xs, color: Colors.purple, fontWeight: Typography.bold }}>+ Add exercise</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.base }}>
              <TouchableOpacity onPress={() => setPlanStep(2)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePlan}
                disabled={planSaving}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.purple, opacity: planSaving ? 0.6 : 1 }}>
                {planSaving ? (
                  <ActivityIndicator size="small" color={Colors.bg} />
                ) : (
                  <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Save Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: Colors.bgCardBorder,
    ...Shadows.card,
  },
  segmentText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
  },
  section: { marginBottom: Spacing.lg },
  card: { padding: Spacing.base, marginBottom: Spacing.base },
  setupBanner: {
    backgroundColor: Colors.purple + '15',
    borderWidth: 1,
    borderColor: Colors.purple + '40',
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  setupBannerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  sectionAction: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.purple,
    letterSpacing: 0.5,
  },
  ringsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base },
  ringsVisual: { marginRight: Spacing.lg },
  ringOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMid: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: Typography.lg,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
  },
  ringsMetrics: { flex: 1, gap: Spacing.sm },
  ringMetric: { marginBottom: Spacing.xs },
  ringMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ringMetricLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  ringMetricVal: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  vitalRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  vitalPill: {
    flex: 1,
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  vitalVal: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  vitalLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  filterScroll: { marginBottom: Spacing.md },
  exerciseCard: { padding: Spacing.base, marginBottom: Spacing.sm },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  exerciseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitleWrap: { flex: 1, marginLeft: Spacing.md },
  exerciseName: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagText: { fontSize: 9, fontWeight: Typography.bold },
  topSet: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  setChip: {
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
  },
  setChipText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  addExerciseBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.teal + '60',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.teal + '08',
  },
  addExerciseText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.teal,
  },
  coachRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.purple + '25',
    borderWidth: 2,
    borderColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  coachName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  coachSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aiBubble: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  aiBubbleText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  aiActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  aiActionPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCardBorder,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  aiActionText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingLeft: Spacing.base,
    paddingRight: 4,
    paddingVertical: 4,
  },
  aiInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  aiSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSendIcon: {
    fontSize: 18,
    color: Colors.bg,
    fontWeight: Typography.bold,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streakBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  streakBadgeText: {
    fontSize: 9,
    fontWeight: Typography.bold,
  },
  chartSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  barCol: { alignItems: 'center', flex: 1 },
  bar: {
    width: Math.min(28, (width - 80) / 9),
    borderRadius: Radius.sm,
    minHeight: 8,
  },
  barLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontWeight: Typography.medium,
  },
  weeklyStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.base,
  },
  weeklyStat: {
    width: '47%',
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  weeklyStatVal: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  weeklyStatLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  prRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  prExercise: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  prDate: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  prRight: { alignItems: 'flex-end' },
  prValue: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  prDelta: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    marginTop: 2,
  },
  insightBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  insightText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  recoveryGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  recoveryMini: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    backgroundColor: Colors.bgCard,
  },
  recoveryMiniLabel: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  recoveryMiniVal: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.bgCardSolid,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
  },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  modalLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  modalInput: {
    backgroundColor: Colors.bg,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    marginBottom: Spacing.xs,
  },
});
