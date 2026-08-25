import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { useStyles } from '../../providers/ThemeProvider';
import { ChevronRight, Dumbbell, Check, Pencil, Trophy, Target } from 'lucide-react-native';
import { GlassCardView, Chip, ProgressBar, ProfileAvatarButton, NotificationIconButton, ActivityProgressCard, LoadingSpinner, SectionHeader } from '../../components/SharedComponents';
import { WeeklyChart } from '../../components/WeeklyChart';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../providers/NotificationContext';
import { TabName } from '../../navigation/TabBar';
import { useAuth } from '../../providers/AuthProvider';
import * as activityService from '../../services/activityService';
import type { ActivitySummary, TodayExercise, WeeklyDay, WeeklyStats, PersonalRecord, ActivityGoal } from '../../types/activity';
import type { PlanDayInput } from '../../services/activityService';

const { width } = Dimensions.get('window');

type Segment = 'Overview' | 'Your Plan' | 'PRs';

const SEGMENTS: Segment[] = ['Overview', 'Your Plan', 'PRs'];

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

export default function FitnessScreen({ onProfilePress, onNotificationsPress, onOpenAI, onOpenWorkoutLog }: { onProfilePress?: () => void; onNotificationsPress?: () => void; onOpenAI?: (from?: TabName) => void; onOpenWorkoutLog?: (exercise: any) => void }) {
  const { onScroll } = useScrollVisibility();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { unreadCount } = useNotifications();
  const [activeSegment, setActiveSegment] = useState<Segment>('Overview');
  const [activeFilter, setActiveFilter] = useState('All');

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toDateString(today), [today]);

  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [exercises, setExercises] = useState<TodayExercise[]>([]);
  const [dayName, setDayName] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [planDayId, setPlanDayId] = useState<number | null>(null);
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDay[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [activityGoal, setActivityGoal] = useState<ActivityGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Plan setup modal state ─────────────────────────────────
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [planStep, setPlanStep] = useState(1);
  const [planNameInput, setPlanNameInput] = useState('');
  const [planGoal, setPlanGoal] = useState('');
  const [planDaysPerWeek, setPlanDaysPerWeek] = useState('4');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayExercises, setDayExercises] = useState<Record<number, { name: string; sets: string; reps: string; weight: string }[]>>({});
  const [planSaving, setPlanSaving] = useState(false);

  // ── Add exercise modal state ─────────────────────────────────
  const [addExModalVisible, setAddExModalVisible] = useState(false);
  const [addExName, setAddExName] = useState('');
  const [addExSets, setAddExSets] = useState('3');
  const [addExReps, setAddExReps] = useState('10');
  const [addExWeight, setAddExWeight] = useState('');
  const [addExRest, setAddExRest] = useState('');
  const [addExSaving, setAddExSaving] = useState(false);

  // ── Edit exercise modal state ─────────────────────────────────
  const [editExModalVisible, setEditExModalVisible] = useState(false);
  const [editExId, setEditExId] = useState<number | null>(null);
  const [editExName, setEditExName] = useState('');
  const [editExSets, setEditExSets] = useState('3');
  const [editExReps, setEditExReps] = useState('10');
  const [editExWeight, setEditExWeight] = useState('');
  const [editExRest, setEditExRest] = useState('');
  const [editExSaving, setEditExSaving] = useState(false);

  // ── Activity log modal state ─────────────────────────────────
  const [logActivityVisible, setLogActivityVisible] = useState(false);
  const [logDistance, setLogDistance] = useState('');
  const [logActiveMin, setLogActiveMin] = useState('');
  const [logOtherActivity, setLogOtherActivity] = useState('');
  const [logOtherCalories, setLogOtherCalories] = useState('');
  const [logSaving, setLogSaving] = useState(false);

  // ── Goal setup modal state ─────────────────────────────────
  const [goalSetupVisible, setGoalSetupVisible] = useState(false);
  const [goalBurn, setGoalBurn] = useState('400');
  const [goalExercise, setGoalExercise] = useState('60');
  const [goalSteps, setGoalSteps] = useState('10000');
  const [goalSaving, setGoalSaving] = useState(false);

  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const [summaryRes, workoutRes, weeklyRes, prsRes, goalRes] = await Promise.all([
        activityService.getTodaySummary(session.access_token, todayStr),
        activityService.getTodayWorkout(session.access_token, todayStr),
        activityService.getWeeklyStats(session.access_token, todayStr),
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
      setPrs(prsRes);
      setActivityGoal(goalRes);
    } catch (e) {
      console.warn('[FitnessScreen] Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, todayStr]);

  const handleRefresh = useCallback(async () => {
    if (!session?.access_token) return;
    setRefreshing(true);
    const [summaryRes, workoutRes, weeklyRes, prsRes, goalRes] = await Promise.allSettled([
      activityService.getTodaySummary(session.access_token, todayStr),
      activityService.getTodayWorkout(session.access_token, todayStr),
      activityService.getWeeklyStats(session.access_token, todayStr),
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
    if (prsRes.status === 'fulfilled') setPrs(prsRes.value);
    if (goalRes.status === 'fulfilled') setActivityGoal(goalRes.value);
    setRefreshing(false);
  }, [session?.access_token, todayStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToday = activeSegment === 'Overview';
  const showYourPlan = activeSegment === 'Your Plan' || showToday;
  const showPRs = activeSegment === 'PRs';

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

  const handleAddExercise = async () => {
    if (!session?.access_token || !planDayId) return;
    if (!addExName.trim()) {
      Alert.alert('Required', 'Please enter an exercise name.');
      return;
    }
    setAddExSaving(true);
    try {
      await activityService.addExerciseToDay(session.access_token, {
        plan_day_id: planDayId,
        exercise_name: addExName.trim(),
        sets: parseInt(addExSets, 10) || 3,
        reps: parseInt(addExReps, 10) || 10,
        target_weight: addExWeight ? parseInt(addExWeight, 10) : undefined,
        rest: addExRest ? parseInt(addExRest, 10) : undefined,
      });
      setAddExModalVisible(false);
      setAddExName('');
      setAddExSets('3');
      setAddExReps('10');
      setAddExWeight('');
      setAddExRest('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add exercise.');
    } finally {
      setAddExSaving(false);
    }
  };

  const handleUpdateExercise = async () => {
    if (!session?.access_token || !editExId) return;
    if (!editExName.trim()) {
      Alert.alert('Required', 'Please enter an exercise name.');
      return;
    }
    setEditExSaving(true);
    try {
      await activityService.updateExercise(session.access_token, {
        exercise_id: editExId,
        exercise_name: editExName.trim(),
        sets: parseInt(editExSets, 10) || 3,
        reps: parseInt(editExReps, 10) || 10,
        target_weight: editExWeight ? parseInt(editExWeight, 10) : undefined,
        rest: editExRest ? parseInt(editExRest, 10) : undefined,
      });
      setEditExModalVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update exercise.');
    } finally {
      setEditExSaving(false);
    }
  };

  const openEditExercise = (ex: TodayExercise) => {
    setEditExId(ex.exercise_id);
    setEditExName(ex.exercise_name);
    setEditExSets(String(ex.target_sets));
    setEditExReps(String(ex.target_reps));
    setEditExWeight(ex.target_weight ? String(ex.target_weight) : '');
    setEditExRest(ex.rest_seconds ? String(ex.rest_seconds) : '');
    setEditExModalVisible(true);
  };

  const handleLogActivity = async () => {
    if (!session?.access_token) return;
    const dist = parseFloat(logDistance) || 0;
    const actMin = parseInt(logActiveMin, 10) || 0;
    const otherCal = parseInt(logOtherCalories, 10) || 0;
    if (dist === 0 && actMin === 0 && !logOtherActivity.trim() && otherCal === 0) {
      Alert.alert('Required', 'Please enter distance, active minutes, or activity details.');
      return;
    }
    setLogSaving(true);
    try {
      await activityService.logActivity(session.access_token, {
        distance: dist || undefined,
        active_min: actMin || undefined,
        calories_burnt: otherCal || undefined,
        other_activities: logOtherActivity.trim() || undefined,
        other_act_calorie_burn: otherCal || undefined,
      });
      setLogActivityVisible(false);
      setLogDistance('');
      setLogActiveMin('');
      setLogOtherActivity('');
      setLogOtherCalories('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to log activity.');
    } finally {
      setLogSaving(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!session?.access_token) return;
    setGoalSaving(true);
    try {
      await activityService.saveActivityGoal(session.access_token, {
        calorie_burn_goal: parseInt(goalBurn, 10) || 400,
        exercise_min_goal: parseInt(goalExercise, 10) || 60,
        steps_goal: parseInt(goalSteps, 10) || 10000,
      });
      setGoalSetupVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save goal.');
    } finally {
      setGoalSaving(false);
    }
  };

  const handleOpenLogActivity = async () => {
    if (session?.access_token) {
      try {
        const existing = await activityService.getTodayActivityLog(session.access_token, todayStr);
        if (existing) {
          setLogDistance(existing.distance ? String(existing.distance) : '');
          setLogActiveMin(existing.active_min ? String(existing.active_min) : '');
          setLogOtherActivity(existing.other_activities || '');
          setLogOtherCalories(existing.other_act_calorie_burn ? String(existing.other_act_calorie_burn) : '');
        }
      } catch (e) {
        console.warn('[FitnessScreen] Failed to prefill activity log:', e);
      }
    }
    setLogActivityVisible(true);
  };

  const estimatedSteps = logDistance ? Math.round((parseFloat(logDistance) || 0) * 1312) : 0;
  const styles = useStyles((theme: any) => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.xl,
    },
    headerLeft: { flex: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    dateText: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    title: {
      fontSize: Typography.xxl,
      fontWeight: Typography.extraBold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    segmented: {
      flexDirection: 'row',
      backgroundColor: theme.colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      padding: 4,
      marginBottom: Spacing.xl,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    segmentBtnActive: {
      backgroundColor: theme.colors.bgCardBorder,
    },
    segmentText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: theme.colors.textMuted,
    },
    segmentTextActive: {
      color: theme.colors.textPrimary,
    },
    section: { marginBottom: Spacing.lg },
    card: { padding: Spacing.base, marginBottom: Spacing.base },
    setupBanner: {
      backgroundColor: theme.colors.accentBlue + '15',
      borderWidth: 1,
      borderColor: theme.colors.accentBlue + '40',
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
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.colors.textMuted,
      letterSpacing: Typography.lsWider,
    },
    sectionAction: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.colors.accentBlue,
      letterSpacing: Typography.lsWide,
    },
    ringsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base },
    ringsVisual: { marginRight: Spacing.lg, width: 110, height: 110 },
    ringsSvgWrap: { width: 110, height: 110 },
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
      color: theme.colors.textSecondary,
    },
    filterScroll: { marginBottom: Spacing.md },
    exerciseCard: { padding: Spacing.base, marginBottom: Spacing.sm },
    exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    exerciseIconWrap: {
      width: 40,
      height: 40,
      borderRadius: Radius.sm,
      backgroundColor: theme.colors.accentBlue + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseTitleWrap: { flex: 1, marginLeft: Spacing.md },
    exerciseName: {
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
      color: theme.colors.textPrimary,
    },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    tag: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    tagText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    topSet: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      fontWeight: Typography.medium,
    },
    setsRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: Spacing.xs, marginTop: Spacing.sm },
    setChip: {
      backgroundColor: theme.colors.bgCardBorder,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    setChipText: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      fontWeight: Typography.medium,
    },
    addExerciseBtn: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.teal + '60',
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.sm,
      backgroundColor: theme.colors.teal + '08',
    },
    addExerciseText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: theme.colors.teal,
    },
    coachRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
    coachAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.accentBlue + '25',
      borderWidth: 2,
      borderColor: theme.colors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    coachName: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
    },
    coachSub: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
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
      color: theme.colors.textSecondary,
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
      backgroundColor: theme.colors.bgCardBorder,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    aiActionText: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      fontWeight: Typography.medium,
    },
    aiInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgCardBorder,
      borderRadius: Radius.full,
      paddingLeft: Spacing.base,
      paddingRight: 4,
      paddingVertical: 4,
    },
    aiInput: {
      flex: 1,
      fontSize: Typography.sm,
      color: theme.colors.textPrimary,
      paddingVertical: Spacing.sm,
    },
    aiSendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiSendIcon: {
      fontSize: Typography.md,
      color: theme.colors.bg,
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
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
    },
    chartSubtitle: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      marginBottom: Spacing.md,
      marginTop: -Spacing.sm,
    },
    barChart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 100,
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.sm,
    },
    barCol: { alignItems: 'center', flex: 1 },
    bar: {
      width: Math.min(36, (width - 60) / 7),
      borderRadius: Radius.sm,
      minHeight: 8,
    },
    barLabel: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
      marginTop: Spacing.sm,
      fontWeight: Typography.medium,
    },
    prRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    prRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    prExercise: {
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
      color: theme.colors.textPrimary,
    },
    prDate: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    prRight: { alignItems: 'flex-end' },
    prValue: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
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
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      letterSpacing: Typography.lsWider,
      marginBottom: 4,
    },
    insightText: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: theme.colors.bgCardSolid,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.bgCardBorder, alignSelf: 'center', marginBottom: Spacing.base },
    modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary, marginBottom: Spacing.sm },
    modalLabel: { fontSize: Typography.xs, color: theme.colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
    modalInput: {
      backgroundColor: theme.colors.bg,
      color: theme.colors.textPrimary,
      fontSize: Typography.base,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      marginBottom: Spacing.xs,
    },
  }));
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

  function DailyProgressCard({ summary, goal, onLogActivity }: { summary: ActivitySummary | null; goal: ActivityGoal | null; onLogActivity: () => void }) {
    const burnTarget = goal?.calorie_burn_goal || 0;
    const exerciseTarget = goal?.exercise_min_goal || 0;
    const stepsTarget = goal?.steps_goal || 0;

    const burnProgress = summary && burnTarget > 0 ? Math.min(summary.calories_burned / burnTarget, 1) : 0;
    const exerciseProgress = summary && exerciseTarget > 0 ? Math.min(summary.exercise_minutes / exerciseTarget, 1) : 0;
    const stepsProgress = summary && stepsTarget > 0 ? Math.min(summary.steps / stepsTarget, 1) : 0;

    const rings = [
      { label: 'Burn', current: summary?.calories_burned ?? 0, target: burnTarget, unit: 'kcal', color: Colors.pink, progress: burnProgress },
      { label: 'Exercise', current: summary?.exercise_minutes ?? 0, target: exerciseTarget, unit: 'min', color: Colors.accentBlue, progress: exerciseProgress },
      { label: 'Steps', current: summary?.steps ?? 0, target: stepsTarget, unit: 'steps', color: Colors.teal, progress: stepsProgress },
    ];

    return (
      <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.md }}>
          <SectionHeader title="Daily Progress" subtitle="Your daily activity rings" />
          <TouchableOpacity onPress={onLogActivity} style={{ backgroundColor: Colors.teal + '20', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Radius.sm }} activeOpacity={0.7}>
            <Text style={{ fontSize: Typography.xs, color: Colors.teal, fontWeight: Typography.semiBold }}>+ Log Activity</Text>
          </TouchableOpacity>
        </View>
        <GlassCardView style={styles.card}>
          <ActivityProgressCard
            steps={summary?.steps ?? 0} stepsTarget={stepsTarget}
            exercise={summary?.exercise_minutes ?? 0} exerciseTarget={exerciseTarget}
            calories={summary?.calories_burned ?? 0} caloriesTarget={burnTarget}
          />
        </GlassCardView>
      </>
    );
  }

  function TodaysWorkout({
    exercises,
    dayName,
    planName,
    planDayId,
    activeFilter,
    setActiveFilter,
    onSetupPlan,
    onAddExercise,
    onEditExercise,
    onLogExercise,
  }: {
    exercises: TodayExercise[];
    dayName: string | null;
    planName: string | null;
    planDayId: number | null;
    activeFilter: string;
    setActiveFilter: (f: string) => void;
    onSetupPlan: () => void;
    onAddExercise: () => void;
    onEditExercise: (ex: TodayExercise) => void;
    onLogExercise: (exercise: any) => void;
  }) {
    if (exercises.length === 0) {
      return (
        <>
          <SectionLabel title="TODAY'S WORKOUT" action={dayName?.toUpperCase() || ''} />
          <GlassCardView style={styles.card}>
            <View style={{ paddingVertical: Spacing.lg, alignItems: 'center' }}>
              <Dumbbell size={Typography.xxl} color={Colors.textSecondary} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm }}>
                {planName ? `No workout planned for ${dayName || 'today'}` : 'No workout plan set up yet'}
              </Text>
              {!planName && (
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

    const displayExercises =
      activeFilter === 'All'
        ? exercises
        : exercises.filter(e => e.exercise_name.toLowerCase().includes(activeFilter.toLowerCase()));

    return (
      <>
        <SectionLabel title="TODAY'S WORKOUT" action={dayName?.toUpperCase() || ''} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {MUSCLE_FILTERS.map(g => (
            <Chip key={g} label={g} selected={activeFilter === g} color={Colors.accentBlue} onPress={() => setActiveFilter(g)} />
          ))}
        </ScrollView>
        {displayExercises.map((ex) => {
          const loggedSets = ex.logged_sets || [];
          const hasLogged = loggedSets.length > 0;
          const topWeight = loggedSets.length > 0 ? Math.max(...loggedSets.map(s => s.weight || 0)) : 0;
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
                    {topWeight > 0 && (
                      <Text style={styles.topSet}>{topWeight}kg top set</Text>
                    )}
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
                          <Text style={styles.setChipText}>Set {i + 1}: {ex.target_weight || '?'}kg × {ex.target_reps}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {!hasLogged && ex.last_performance && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, backgroundColor: Colors.accentBlue + '10', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}>
                      <Text style={{ fontSize: Typography.xs, color: Colors.accentBlue, fontWeight: Typography.semiBold, marginRight: Spacing.xs }}>
                        Last:
                      </Text>
                      <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary }}>
                        {ex.last_performance.weight}kg × {ex.last_performance.reps}
                      </Text>
                      <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginHorizontal: 4 }}>·</Text>
                      <Text style={{ fontSize: Typography.xs, color: ex.last_performance.completed ? Colors.teal : Colors.amber }}>
                        {ex.last_performance.sets_completed}/{ex.last_performance.sets_total} sets
                      </Text>
                      {ex.last_performance.completed && ex.target_weight && ex.target_weight > ex.last_performance.weight && (
                        <>
                          <ChevronRight size={14} color={Colors.textSecondary} strokeWidth={2} style={{ marginHorizontal: 2 }} />
                          <Text style={{ fontSize: Typography.xs, color: Colors.teal, fontWeight: Typography.semiBold }}>
                            Try {ex.target_weight}kg
                          </Text>
                        </>
                      )}
                      {ex.last_performance.completed && (!ex.target_weight || ex.target_weight <= ex.last_performance.weight) && (
                        <>
                          <ChevronRight size={14} color={Colors.textSecondary} strokeWidth={2} style={{ marginHorizontal: 2 }} />
                          <Text style={{ fontSize: Typography.xs, color: Colors.teal, fontWeight: Typography.semiBold }}>
                            Try {ex.last_performance.weight + 2.5}kg
                          </Text>
                        </>
                      )}
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
        {planDayId && (
          <TouchableOpacity
            onPress={onAddExercise}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, marginTop: Spacing.xs, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.accentBlue + '50', borderStyle: 'dashed', backgroundColor: Colors.accentBlue + '08' }}
            activeOpacity={0.7}>
            <Text style={{ fontSize: Typography.md, marginRight: Spacing.xs, color: Colors.accentBlue }}>+</Text>
            <Text style={{ fontSize: Typography.sm, color: Colors.accentBlue, fontWeight: Typography.semiBold }}>Add Exercise</Text>
          </TouchableOpacity>
        )}
      </>
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
        <View style={styles.barChart}>
          {days.map((bar, i) => {
            const barVal = maxVal > 0 ? bar.calories / maxVal : 0;
            const barColor = bar.is_today ? Colors.accentBlue : bar.calories > 0 ? Colors.teal + '90' : Colors.bgCardBorder;
            return (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: Math.max(maxBarH * barVal, 8), backgroundColor: barColor }]} />
                <Text style={[styles.barLabel, bar.is_today && { color: Colors.accentBlue, fontWeight: Typography.bold }]}>{bar.day}</Text>
              </View>
            );
          })}
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
            <Trophy size={Typography.xxl} color={Colors.textSecondary} />
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

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.teal, Colors.pink]} tintColor={Colors.teal} progressBackgroundColor={Colors.bgCard} />}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Activity & Gym</Text>
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

        {/* No Data Setup Banner */}
        {showSetupBanner && (
          <TouchableOpacity style={styles.setupBanner} activeOpacity={0.8} onPress={openPlanModal}>
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
          <TouchableOpacity style={styles.setupBanner} activeOpacity={0.8} onPress={() => setGoalSetupVisible(true)}>
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
            {showToday && <DailyProgressCard summary={summary} goal={activityGoal} onLogActivity={handleOpenLogActivity} />}

            {showYourPlan && (
              <View style={styles.section}>
                <TodaysWorkout
                  exercises={exercises}
                  dayName={dayName}
                  planName={planName}
                  planDayId={planDayId}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  onSetupPlan={() => setPlanModalVisible(true)}
                  onAddExercise={() => setAddExModalVisible(true)}
                  onEditExercise={openEditExercise}
                  onLogExercise={(ex) => onOpenWorkoutLog && onOpenWorkoutLog(ex)}
                />
              </View>
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
                  <WeeklyChart
                    data={weeklyDays.map(d => d.steps)}
                    labels={weeklyDays.map(d => d.day)}
                    color={Colors.teal}
                  />
                </View>
                <View style={styles.section}>
                  <SectionHeader title="Active Minutes" subtitle={`${weeklyDays[weeklyDays.length - 1]?.duration ?? 0} today · avg ${Math.round(weeklyDays.reduce((s, d) => s + d.duration, 0) / weeklyDays.length)}`} />
                  <WeeklyChart
                    data={weeklyDays.map(d => d.duration)}
                    labels={weeklyDays.map(d => d.day)}
                    color={Colors.accentBlue}
                  />
                </View>
                <View style={styles.section}>
                  <SectionHeader title="Calories Burned" subtitle={`${weeklyDays[weeklyDays.length - 1]?.calories.toLocaleString() ?? '0'} today · avg ${Math.round(weeklyDays.reduce((s, d) => s + d.calories, 0) / weeklyDays.length).toLocaleString()}`} />
                  <WeeklyChart
                    data={weeklyDays.map(d => d.calories)}
                    labels={weeklyDays.map(d => d.day)}
                    color={Colors.pink}
                  />
                </View>
              </>
            )}

            {showPRs && (
              <View style={styles.section}>
                <PersonalRecordsCard prs={prs} />
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Plan Setup Modal ───────────────────────────────── */}
      {planModalVisible && <Modal visible={planModalVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPlanModalVisible(false)}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Step indicator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.base }}>
              {[1, 2, 3].map(s => (
                <View key={s} style={{ width: planStep === s ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: planStep === s ? Colors.accentBlue : Colors.bgCardBorder }} />
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
                        backgroundColor: planDaysPerWeek === d ? Colors.accentBlue + '20' : Colors.bgCardBorder,
                        borderWidth: planDaysPerWeek === d ? 1 : 0, borderColor: Colors.accentBlue,
                      }}>
                      <Text style={{ fontSize: Typography.sm, color: planDaysPerWeek === d ? Colors.accentBlue : Colors.textSecondary, fontWeight: Typography.bold }}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
                  <TouchableOpacity onPress={() => setPlanModalVisible(false)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                    <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setPlanStep(2)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.accentBlue }}>
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
                      borderColor: selectedDays.includes(i) ? Colors.accentBlue : Colors.textMuted,
                      backgroundColor: selectedDays.includes(i) ? Colors.accentBlue : 'transparent',
                    }}>
                      {selectedDays.includes(i) && <Text style={{ fontSize: Typography.xs, color: Colors.bg, fontWeight: Typography.bold }}>✓</Text>}
                    </View>
                    <Text style={{ fontSize: Typography.base, color: Colors.textPrimary, marginLeft: Spacing.md, fontWeight: selectedDays.includes(i) ? Typography.bold : Typography.regular }}>{name}</Text>
                  </TouchableOpacity>
                ))}
                <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
                  <TouchableOpacity onPress={() => setPlanStep(1)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                    <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setPlanStep(3)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.accentBlue }}>
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
                      <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.accentBlue, marginBottom: Spacing.sm }}>{DAY_NAMES[dayIndex]}</Text>
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
                            <Text style={{ fontSize: Typography.md, color: Colors.pink }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity onPress={() => addExerciseToDay(dayIndex)} style={{ paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.accentBlue + '40', borderRadius: Radius.sm, backgroundColor: Colors.accentBlue + '08' }}>
                        <Text style={{ fontSize: Typography.xs, color: Colors.accentBlue, fontWeight: Typography.bold }}>+ Add exercise</Text>
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
                    style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.accentBlue, opacity: planSaving ? 0.6 : 1 }}>
                    {planSaving ? (
                      <ActivityIndicator size="small" color={Colors.bg} />
                    ) : (
                      <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Save Plan</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>}

      {/* ── Add Exercise Modal ───────────────────────────────── */}
      {addExModalVisible && <Modal visible={addExModalVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setAddExModalVisible(false)}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Exercise</Text>

            <Text style={styles.modalLabel}>Exercise name *</Text>
            <TextInput
              style={styles.modalInput}
              value={addExName}
              onChangeText={setAddExName}
              placeholder="e.g. Bench Press"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Sets</Text>
                <TextInput style={styles.modalInput} value={addExSets} onChangeText={setAddExSets} keyboardType="number-pad" placeholder="3" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Reps</Text>
                <TextInput style={styles.modalInput} value={addExReps} onChangeText={setAddExReps} keyboardType="number-pad" placeholder="10" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Weight (kg)</Text>
                <TextInput style={styles.modalInput} value={addExWeight} onChangeText={setAddExWeight} keyboardType="number-pad" placeholder="optional" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Rest (sec)</Text>
                <TextInput style={styles.modalInput} value={addExRest} onChangeText={setAddExRest} keyboardType="number-pad" placeholder="optional" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity
                onPress={() => setAddExModalVisible(false)}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddExercise}
                disabled={addExSaving}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.accentBlue, opacity: addExSaving ? 0.6 : 1 }}>
                {addExSaving ? (
                  <ActivityIndicator size="small" color={Colors.bg} />
                ) : (
                  <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Add Exercise</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>}

      {/* ── Edit Exercise Modal ───────────────────────────────── */}
      {editExModalVisible && <Modal visible={editExModalVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setEditExModalVisible(false)}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Exercise</Text>

            <Text style={styles.modalLabel}>Exercise name *</Text>
            <TextInput
              style={styles.modalInput}
              value={editExName}
              onChangeText={setEditExName}
              placeholder="e.g. Bench Press"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Sets</Text>
                <TextInput style={styles.modalInput} value={editExSets} onChangeText={setEditExSets} keyboardType="number-pad" placeholder="3" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Reps</Text>
                <TextInput style={styles.modalInput} value={editExReps} onChangeText={setEditExReps} keyboardType="number-pad" placeholder="10" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Weight (kg)</Text>
                <TextInput style={styles.modalInput} value={editExWeight} onChangeText={setEditExWeight} keyboardType="number-pad" placeholder="optional" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Rest (sec)</Text>
                <TextInput style={styles.modalInput} value={editExRest} onChangeText={setEditExRest} keyboardType="number-pad" placeholder="optional" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity
                onPress={() => setEditExModalVisible(false)}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateExercise}
                disabled={editExSaving}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.accentBlue, opacity: editExSaving ? 0.6 : 1 }}>
                {editExSaving ? (
                  <ActivityIndicator size="small" color={Colors.bg} />
                ) : (
                  <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Delete Exercise', 'Are you sure you want to remove this exercise?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      if (!session?.access_token || !editExId) return;
                      try {
                        await activityService.deleteExercise(session.access_token, editExId);
                        setEditExModalVisible(false);
                        fetchData();
                      } catch (e: any) {
                        Alert.alert('Error', e?.message || 'Failed to delete exercise.');
                      }
                    },
                  },
                ]);
              }}
              style={{ alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.danger + '30', marginTop: Spacing.md }}>
              <Text style={{ fontSize: Typography.sm, color: Colors.danger, fontWeight: Typography.semiBold }}>Delete this exercise</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>}

      {/* ── Log Activity Modal ───────────────────────────────── */}
      <Modal visible={logActivityVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setLogActivityVisible(false)}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Log Activity</Text>

            <Text style={styles.modalLabel}>Distance (km)</Text>
            <TextInput
              style={styles.modalInput}
              value={logDistance}
              onChangeText={setLogDistance}
              keyboardType="decimal-pad"
              placeholder="e.g. 3.5"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            {estimatedSteps > 0 && (
              <Text style={{ fontSize: Typography.xs, color: Colors.teal, marginTop: 4 }}>
                ≈ {estimatedSteps.toLocaleString()} steps estimated
              </Text>
            )}

            <Text style={styles.modalLabel}>Active minutes (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={logActiveMin}
              onChangeText={setLogActiveMin}
              keyboardType="number-pad"
              placeholder="e.g. 30"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.modalLabel}>Other activity (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={logOtherActivity}
              onChangeText={setLogOtherActivity}
              placeholder="e.g. cycling, swimming"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.modalLabel}>Other activity calories (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={logOtherCalories}
              onChangeText={setLogOtherCalories}
              keyboardType="number-pad"
              placeholder="e.g. 200"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity
                onPress={() => setLogActivityVisible(false)}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogActivity}
                disabled={logSaving}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.teal, opacity: logSaving ? 0.6 : 1 }}>
                {logSaving ? (
                  <ActivityIndicator size="small" color={Colors.bg} />
                ) : (
                  <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Log Activity</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Activity Goal Setup Modal ─────────────────────────── */}
      <Modal visible={goalSetupVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setGoalSetupVisible(false)}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set Activity Goals</Text>
            <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.base }}>
              Define your daily targets. You can update these anytime.
            </Text>

            <Text style={styles.modalLabel}>Calorie burn goal (kcal)</Text>
            <TextInput
              style={styles.modalInput}
              value={goalBurn}
              onChangeText={setGoalBurn}
              keyboardType="number-pad"
              placeholder="e.g. 400"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={styles.modalLabel}>Exercise goal (minutes)</Text>
            <TextInput
              style={styles.modalInput}
              value={goalExercise}
              onChangeText={setGoalExercise}
              keyboardType="number-pad"
              placeholder="e.g. 60"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.modalLabel}>Steps goal</Text>
            <TextInput
              style={styles.modalInput}
              value={goalSteps}
              onChangeText={setGoalSteps}
              keyboardType="number-pad"
              placeholder="e.g. 10000"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity
                onPress={() => setGoalSetupVisible(false)}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveGoal}
                disabled={goalSaving}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.teal, opacity: goalSaving ? 0.6 : 1 }}>
                {goalSaving ? (
                  <ActivityIndicator size="small" color={Colors.bg} />
                ) : (
                  <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Save Goals</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
