import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Alert,
  RefreshControl,
  BackHandler,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { useStyles } from '../../providers/ThemeProvider';
import { ChevronRight, Dumbbell, Check, Pencil, Trophy, Target, TrendingUp, Flame, Star, Plus, BarChart2 } from 'lucide-react-native';
import { GlassCardView, ProgressBar, ProfileAvatarButton, NotificationIconButton, ActivityProgressCard, LoadingSpinner, SectionHeader, BackButton } from '../../components/SharedComponents';
import { WeeklyChart } from '../../components/WeeklyChart';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../providers/NotificationContext';
import { TabName } from '../../navigation/TabBar';
import { useAuth } from '../../providers/AuthProvider';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

let _workoutLogged = false;
export function markWorkoutLogged() { _workoutLogged = true; }
let _exerciseAdded = false;
export function markExerciseAdded() { _exerciseAdded = true; }
import * as activityService from '../../services/activityService';
import type { ActivitySummary, TodayExercise, WeeklyDay, WeeklyStats, PersonalRecord, ActivityGoal, WorkoutPlanDays } from '../../types/activity';

import { TodaysWorkout, WorkoutPreviewOverlay } from './YourPlanTab/TodaysWorkout';
import { PersonalRecordsCard } from './YourPRsTab/PersonalRecordsCard';
import { CurrentPlanSection } from './YourPlanTab/CurrentPlanSection';
import { PlanSetupModal } from './YourPlanTab/PlanSetupModal';
import { EditExerciseModal } from './OverviewTab/EditExerciseModal';
import { LogActivityModal } from './OverviewTab/LogActivityModal';
import { GoalSetupModal } from './OverviewTab/GoalSetupModal';
import { LogPRModal } from './YourPRsTab/LogPRModal';
import { CustomPlanWizard } from './YourPlanTab/CustomPlanWizard';

const { width } = Dimensions.get('window');

type Segment = 'Overview' | 'Your Plan' | 'Your PRs';

const SEGMENTS: Segment[] = ['Overview', 'Your Plan', 'Your PRs'];

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

export default function FitnessScreen({ route, onProfilePress, onNotificationsPress, onOpenAI, onOpenWorkoutLog, onOpenAddExercise, onOpenAllPRs, onOpenExplorePlans }: { route?: any; onProfilePress?: () => void; onNotificationsPress?: () => void; onOpenAI?: (from?: TabName) => void; onOpenWorkoutLog?: (exercise: any) => void; onOpenAddExercise?: (planDayId: number) => void; onOpenAllPRs?: () => void; onOpenExplorePlans?: () => void }) {
  const { onScroll } = useScrollVisibility();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { unreadCount } = useNotifications();
  const [activeSegment, setActiveSegment] = useState<Segment>('Overview');
  const [loading, setLoading] = useState(true);
  const [creatingRestDay, setCreatingRestDay] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toDateString(today), [today]);

  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [exercises, setExercises] = useState<TodayExercise[]>([]);
  const [dayName, setDayName] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [planDayId, setPlanDayId] = useState<number | null>(null);
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDay[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [workoutPlanDays, setWorkoutPlanDays] = useState<WorkoutPlanDays>({ plan_name: null, days: [] });
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [activityGoal, setActivityGoal] = useState<ActivityGoal | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const isTabActive = useIsFocused();
  const [selectedPlanDayIndex, setSelectedPlanDayIndex] = useState<number | null>(null);
  const [showWorkoutPreview, setShowWorkoutPreview] = useState(false);

  // Open workout preview when navigating from notification
  useEffect(() => {
    if (route?.params?.openWorkoutPreview) {
      setShowWorkoutPreview(true);
    }
  }, [route?.params?.openWorkoutPreview]);

  // Modal visibility states
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [editExModalVisible, setEditExModalVisible] = useState(false);
  const [logActivityVisible, setLogActivityVisible] = useState(false);
  const [goalSetupVisible, setGoalSetupVisible] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [logPRVisible, setLogPRVisible] = useState(false);
  const [customPlanVisible, setCustomPlanVisible] = useState(false);
  const [wizardRefreshKey, setWizardRefreshKey] = useState(0);

  // Edit exercise prefilled data
  const [editExId, setEditExId] = useState<number | null>(null);
  const [editExName, setEditExName] = useState('');
  const [editExSets, setEditExSets] = useState('3');
  const [editExReps, setEditExReps] = useState('10');

  // Log activity prefilled data
  const [logActivityPrefill, setLogActivityPrefill] = useState<{ distance?: string; activeMin?: string; otherActivity?: string; otherCalories?: string } | null>(null);

  const allPlanExercises = useMemo(() => {
    const map = new Map<number, string>();
    for (const day of workoutPlanDays.days) {
      for (const ex of day.exercises || []) {
        map.set(ex.exercise_id, ex.exercise_name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [workoutPlanDays]);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const [summaryRes, workoutRes, weeklyRes, planDaysRes, prsRes, goalRes] = await Promise.all([
        activityService.getTodaySummary(session.access_token, todayStr),
        activityService.getTodayWorkout(session.access_token, todayStr),
        activityService.getWeeklyStats(session.access_token, todayStr),
        activityService.getCurrentWorkoutPlanDays(session.access_token),
        activityService.getPersonalRecords(session.access_token),
        activityService.getActivityGoal(session.access_token),
      ]);
      setSummary(summaryRes);
      setExercises(workoutRes.exercises);
      setDayName(workoutRes.day_name);
      setPlanName(workoutRes.plan_name);
      setPlanDayId(workoutRes.plan_day_id);
      setWeeklyDays(weeklyRes.days);
      setWeeklyStats(weeklyRes.stats);
      setWorkoutPlanDays(planDaysRes);
      setPrs(prsRes);
      setActivityGoal(goalRes);
      setWizardRefreshKey(k => k + 1);
    } catch (e) {
      console.warn('[FitnessScreen] Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, todayStr]);

  const handleRefresh = useCallback(async () => {
    if (!session?.access_token) return;
    setRefreshing(true);
    const [summaryRes, workoutRes, weeklyRes, planDaysRes, prsRes, goalRes] = await Promise.allSettled([
      activityService.getTodaySummary(session.access_token, todayStr),
      activityService.getTodayWorkout(session.access_token, todayStr),
      activityService.getWeeklyStats(session.access_token, todayStr),
      activityService.getCurrentWorkoutPlanDays(session.access_token),
      activityService.getPersonalRecords(session.access_token),
      activityService.getActivityGoal(session.access_token),
    ]);
    if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
    if (workoutRes.status === 'fulfilled') {
      setExercises(workoutRes.value.exercises);
      setDayName(workoutRes.value.day_name);
      setPlanName(workoutRes.value.plan_name);
      setPlanDayId(workoutRes.value.plan_day_id);
    }
    if (weeklyRes.status === 'fulfilled') {
      setWeeklyDays(weeklyRes.value.days);
      setWeeklyStats(weeklyRes.value.stats);
    }
    if (planDaysRes.status === 'fulfilled') setWorkoutPlanDays(planDaysRes.value);
    if (prsRes.status === 'fulfilled') setPrs(prsRes.value);
    if (goalRes.status === 'fulfilled') setActivityGoal(goalRes.value);
    setRefreshing(false);
  }, [session?.access_token, todayStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (_workoutLogged || _exerciseAdded || customPlanVisible) {
        _workoutLogged = false;
        _exerciseAdded = false;
        fetchData();
      }
    }, [fetchData, customPlanVisible])
  );

  useEffect(() => {
    if (!showWorkoutPreview) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowWorkoutPreview(false);
      return true;
    });
    return () => sub.remove();
  }, [showWorkoutPreview]);

  const showToday = activeSegment === 'Overview';
  const showYourPlan = activeSegment === 'Your Plan';
  const showTodayWorkout = activeSegment === 'Overview';
  const showPRs = activeSegment === 'Your PRs';

  const currentPlanName = workoutPlanDays.plan_name || planName || 'Current Plan';
  const currentPlanDays = workoutPlanDays.days || [];
  const daysPerWeek = currentPlanDays.length;

  useEffect(() => {
    if (currentPlanDays.length === 0) {
      setSelectedPlanDayIndex(null);
      setShowWorkoutPreview(false);
      return;
    }
    const matchedTodayIndex = dayName
      ? currentPlanDays.findIndex(day => day.day_name === dayName)
      : -1;
    setSelectedPlanDayIndex(prev => {
      if (prev !== null && prev < currentPlanDays.length) return prev;
      if (matchedTodayIndex >= 0) return matchedTodayIndex;
      return 0;
    });
  }, [currentPlanDays, dayName]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [isTabActive, fadeAnim, slideAnim]);

  const hasNoPlan = !loading && !planName;
  const hasNoData = !loading && !summary?.steps && !summary?.calories_burned && exercises.length === 0 && weeklyStats?.sessions === 0;
  const showSetupBanner = hasNoPlan && hasNoData;

  const openEditExercise = (ex: TodayExercise) => {
    setEditExId(ex.exercise_id);
    setEditExName(ex.exercise_name);
    setEditExSets(String(ex.target_sets));
    setEditExReps(String(ex.target_reps));
    setEditExModalVisible(true);
  };

  const handleOpenLogActivity = async () => {
    if (session?.access_token) {
      try {
        const existing = await activityService.getTodayActivityLog(session.access_token, todayStr);
        if (existing) {
          setLogActivityPrefill({
            distance: existing.distance ? String(existing.distance) : '',
            activeMin: existing.active_min ? String(existing.active_min) : '',
            otherActivity: existing.other_activities || '',
            otherCalories: existing.other_act_calorie_burn ? String(existing.other_act_calorie_burn) : '',
          });
        } else {
          setLogActivityPrefill(null);
        }
      } catch (e) {
        console.warn('[FitnessScreen] Failed to prefill activity log:', e);
        setLogActivityPrefill(null);
      }
    }
    setLogActivityVisible(true);
  };

  const styles = useStyles((theme: any) => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
    headerLeft: { flex: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: theme.colors.textPrimary, letterSpacing: -0.5 },
    segmented: {
      flexDirection: 'row', backgroundColor: theme.colors.bgCard, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: theme.colors.bgCardBorder, padding: 4, marginBottom: Spacing.xl,
    },
    segmentBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
    segmentBtnActive: { backgroundColor: theme.colors.bgCardBorder },
    segmentText: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: theme.colors.textMuted },
    segmentTextActive: { color: theme.colors.textPrimary },
    section: { marginBottom: Spacing.lg },
    card: { padding: Spacing.base, marginBottom: Spacing.base },
    setupBanner: {
      backgroundColor: theme.colors.accentBlue + '15', borderWidth: 1, borderColor: theme.colors.accentBlue + '40',
      borderRadius: Radius.md, padding: Spacing.base, marginBottom: Spacing.lg,
    },
    setupBannerIcon: { alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 18 },
    exerciseCard: { padding: Spacing.base, marginBottom: Spacing.sm },
    exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    exerciseIconWrap: {
      width: 40, height: 40, borderRadius: Radius.sm,
      backgroundColor: theme.colors.accentBlue + '20',
      alignItems: 'center', justifyContent: 'center',
    },
    exerciseTitleWrap: { flex: 1, marginLeft: Spacing.md },
    exerciseName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, paddingHorizontal: Spacing.sm },
    barCol: { alignItems: 'center', flex: 1 },
    bar: { width: Math.min(36, (width - 60) / 7), borderRadius: Radius.sm, minHeight: 8 },
    barLabel: { fontSize: Typography.xs, color: theme.colors.textMuted, fontWeight: Typography.semiBold, textAlign: 'center' },
    barLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm, paddingHorizontal: Spacing.sm },
  }));

  function SegmentedControl({ segments, active, onChange }: { segments: Segment[]; active: Segment; onChange: (s: Segment) => void }) {
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

  function DailyProgressCard({ summary, goal, onLogActivity, onEditGoals }: { summary: ActivitySummary | null; goal: ActivityGoal | null; onLogActivity: () => void; onEditGoals: () => void }) {
    const burnTarget = goal?.calorie_burn_goal || 0;
    const exerciseTarget = goal?.exercise_min_goal || 0;
    const stepsTarget = goal?.steps_goal || 0;

    return (
      <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.md }}>
          <SectionHeader
            title="Daily Progress"
            subtitle="Your daily activity rings"
            rightElement={
              <TouchableOpacity onPress={onLogActivity} style={{ backgroundColor: Colors.teal + '20', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Radius.sm }} activeOpacity={0.7}>
                <Text style={{ fontSize: Typography.xs, color: Colors.teal, fontWeight: Typography.semiBold }}>+ Log Activity</Text>
              </TouchableOpacity>
            }
          />
        </View>
        <GlassCardView style={[styles.card, { position: 'relative' }]}>
          {goal && (
            <TouchableOpacity
              onPress={onEditGoals}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
              style={{ position: 'absolute', top: Spacing.md, right: Spacing.md, zIndex: 1 }}>
              <Pencil size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          <ActivityProgressCard
            steps={summary?.steps ?? 0} stepsTarget={stepsTarget}
            exercise={summary?.exercise_minutes ?? 0} exerciseTarget={exerciseTarget}
            calories={summary?.calories_burned ?? 0} caloriesTarget={burnTarget}
          />
        </GlassCardView>
      </>
    );
  }

  function WeeklyActivityCard({ days, stats }: { days: WeeklyDay[]; stats: WeeklyStats | null }) {
    const maxBarH = 120;
    const maxVal = useMemo(() => {
      if (days.length === 0) return 1;
      return Math.max(...days.map(d => d.calories), 1);
    }, [days]);

    return (
      <GlassCardView style={styles.card}>
        <View style={styles.barChart}>
          {days.map((bar, i) => {
            const barVal = maxVal > 0 ? bar.calories / maxVal : 0;
            const barColor = bar.calories > 0 ? Colors.teal : Colors.bgCardBorder;
            return (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: Math.max(maxBarH * barVal, 4), backgroundColor: barColor, opacity: bar.calories > 0 ? 0.85 : 0.3 }]} />
              </View>
            );
          })}
        </View>
        <View style={styles.barLabelsRow}>
          {days.map((bar, i) => (
            <Text key={i} style={[styles.barLabel, { width: Math.min(36, (width - 60) / 7) }]}>{bar.day}</Text>
          ))}
        </View>
      </GlassCardView>
    );
  }

  const selectedPlanDay = selectedPlanDayIndex !== null ? currentPlanDays[selectedPlanDayIndex] || null : null;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.teal, Colors.pink]} tintColor={Colors.teal} progressBackgroundColor={Colors.bgCard} />}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Activity</Text>
          </View>
          <View style={styles.headerRight}>
            <NotificationIconButton onPress={onNotificationsPress} unreadCount={unreadCount} />
            <ProfileAvatarButton
              onPress={onProfilePress}
              userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              avatarUrl={user?.user_metadata?.avatar_url}
            />
          </View>
        </View>

        <SegmentedControl segments={SEGMENTS} active={activeSegment} onChange={setActiveSegment} />

        {showSetupBanner && (
          <TouchableOpacity style={styles.setupBanner} activeOpacity={0.8} onPress={() => setPlanModalVisible(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.setupBannerIcon, { backgroundColor: Colors.accentBlue + '20' }]}>
                <Dumbbell size={Typography.md} color={Colors.accentBlue} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary }}>Set up your workout plan</Text>
                <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 }}>Create a plan to track exercises, log sets, and monitor your progress</Text>
              </View>
              <ChevronRight size={Typography.md} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}

        {!activityGoal && !loading && (
          <TouchableOpacity style={styles.setupBanner} activeOpacity={0.8} onPress={() => { setIsEditingGoals(false); setGoalSetupVisible(true); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.setupBannerIcon, { backgroundColor: Colors.teal + '20' }]}>
                <Target size={Typography.md} color={Colors.teal} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary }}>Set your activity goals</Text>
                <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 }}>Define daily targets for calories burned, exercise minutes, and steps</Text>
              </View>
              <ChevronRight size={Typography.md} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {showToday && <DailyProgressCard summary={summary} goal={activityGoal} onLogActivity={handleOpenLogActivity} onEditGoals={() => {
              setIsEditingGoals(true);
              setGoalSetupVisible(true);
            }} />}

            {showTodayWorkout && (
              <View style={styles.section}>
                <TodaysWorkout
                  exercises={exercises}
                  dayName={dayName}
                  planName={planName}
                  planDayId={planDayId}
                  onSetupPlan={() => setPlanModalVisible(true)}
                  onAddExercise={async () => {
                    if (planDayId) {
                      onOpenAddExercise && onOpenAddExercise(planDayId);
                    } else if (dayName && session?.access_token) {
                      setCreatingRestDay(true);
                      try {
                        const newDay = await activityService.addPlanDay(session.access_token, dayName);
                        setPlanDayId(newDay.plan_days_id);
                        onOpenAddExercise && onOpenAddExercise(newDay.plan_days_id);
                      } catch (e: any) {
                        Alert.alert('Error', e?.message || 'Failed to create workout day');
                      } finally {
                        setCreatingRestDay(false);
                      }
                    }
                  }}
                  onEditExercise={openEditExercise}
                  onLogExercise={(ex) => onOpenWorkoutLog && onOpenWorkoutLog(ex)}
                  startSessionMode
                  onStartSession={() => {
                    const todayIdx = currentPlanDays.findIndex((d: any) => d.day_name === dayName);
                    if (todayIdx >= 0) setSelectedPlanDayIndex(todayIdx);
                    setShowWorkoutPreview(true);
                  }}
                />
              </View>
            )}

            {showYourPlan && (
              <CurrentPlanSection
                workoutPlanDays={workoutPlanDays}
                currentPlanName={currentPlanName}
                currentPlanDays={currentPlanDays}
                dayName={dayName}
                exercises={exercises}
                weeklyStats={weeklyStats}
                daysPerWeek={daysPerWeek}
                selectedPlanDayIndex={selectedPlanDayIndex}
                onSelectedPlanDayIndexChange={setSelectedPlanDayIndex}
                onShowWorkoutPreview={() => setShowWorkoutPreview(true)}
                onOpenExplorePlans={onOpenExplorePlans}
                onOpenCustomPlan={() => setCustomPlanVisible(true)}
              />
            )}

            {showToday && (
              <View style={styles.section}>
                <SectionHeader title="Weekly Activity" subtitle={`${weeklyStats?.sessions ?? 0} sessions · ${weeklyStats ? formatDuration(weeklyStats.total_time_minutes) : '0h'} total time`} />
                <WeeklyActivityCard days={weeklyDays} stats={weeklyStats} />
              </View>
            )}

            {showToday && weeklyDays.length > 0 && (
              <>
                <View style={styles.section}>
                  <SectionHeader title="Steps" subtitle={`${weeklyDays[weeklyDays.length - 1]?.steps.toLocaleString() ?? '0'} today · avg ${Math.round(weeklyDays.reduce((s, d) => s + d.steps, 0) / weeklyDays.length).toLocaleString()}`} />
                  <WeeklyChart data={weeklyDays.map(d => d.steps)} labels={weeklyDays.map(d => d.day)} color={Colors.teal} />
                </View>
                <View style={styles.section}>
                  <SectionHeader title="Active Minutes" subtitle={`${weeklyDays[weeklyDays.length - 1]?.duration ?? 0} today · avg ${Math.round(weeklyDays.reduce((s, d) => s + d.duration, 0) / weeklyDays.length)}`} />
                  <WeeklyChart data={weeklyDays.map(d => d.duration)} labels={weeklyDays.map(d => d.day)} color={Colors.accentBlue} />
                </View>
                <View style={styles.section}>
                  <SectionHeader title="Calories Burned" subtitle={`${weeklyDays[weeklyDays.length - 1]?.calories.toLocaleString() ?? '0'} today · avg ${Math.round(weeklyDays.reduce((s, d) => s + d.calories, 0) / weeklyDays.length).toLocaleString()}`} />
                  <WeeklyChart data={weeklyDays.map(d => d.calories)} labels={weeklyDays.map(d => d.day)} color={Colors.pink} />
                </View>
              </>
            )}

            {showPRs && (
              <View style={styles.section}>
                <PersonalRecordsCard prs={prs} onViewAll={onOpenAllPRs} onLogPR={() => setLogPRVisible(true)} />
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Workout Preview Overlay */}
      <WorkoutPreviewOverlay
        visible={showWorkoutPreview}
        onClose={() => setShowWorkoutPreview(false)}
        dayName={dayName}
        planName={planName}
        exercises={exercises}
        planDayExercises={selectedPlanDay?.exercises || []}
        selectedDayName={selectedPlanDay?.day_name || dayName}
        planDayId={selectedPlanDay?.plan_days_id || planDayId}
        onSetupPlan={() => setPlanModalVisible(true)}
        onAddExercise={(dayId) => onOpenAddExercise && onOpenAddExercise(dayId)}
        onEditExercise={openEditExercise}
        onLogExercise={(ex) => onOpenWorkoutLog && onOpenWorkoutLog(ex)}
      />

      {/* Modals */}
      <PlanSetupModal
        visible={planModalVisible}
        onClose={() => setPlanModalVisible(false)}
        onSaved={fetchData}
        session={session}
      />

      <EditExerciseModal
        visible={editExModalVisible}
        onClose={() => setEditExModalVisible(false)}
        onSaved={fetchData}
        session={session}
        exerciseId={editExId}
        exerciseName={editExName}
        sets={editExSets}
        reps={editExReps}
      />

      <LogActivityModal
        visible={logActivityVisible}
        onClose={() => setLogActivityVisible(false)}
        onSaved={fetchData}
        session={session}
        prefilledData={logActivityPrefill}
      />

      <GoalSetupModal
        visible={goalSetupVisible}
        onClose={() => { setGoalSetupVisible(false); setIsEditingGoals(false); }}
        onSaved={fetchData}
        session={session}
        isEditing={isEditingGoals}
        existingGoal={activityGoal}
      />

      <LogPRModal
        visible={logPRVisible}
        onClose={() => setLogPRVisible(false)}
        onSaved={fetchData}
        session={session}
        allPlanExercises={allPlanExercises}
      />

      <CustomPlanWizard
        visible={customPlanVisible}
        onBack={() => setCustomPlanVisible(false)}
        onSaved={fetchData}
        onOpenAddExercise={(planDayId) => onOpenAddExercise && onOpenAddExercise(planDayId)}
        currentPlanName={currentPlanName}
        planDays={currentPlanDays}
        refreshKey={wizardRefreshKey}
      />
    </View>
  );
}
