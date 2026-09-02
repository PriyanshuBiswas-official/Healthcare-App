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
  BackHandler,
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
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Module-level flag: set by WorkoutLogScreen when sets are logged
let _workoutLogged = false;
export function markWorkoutLogged() { _workoutLogged = true; }
import * as activityService from '../../services/activityService';
import type { ActivitySummary, TodayExercise, WeeklyDay, WeeklyStats, PersonalRecord, ActivityGoal, WorkoutPlanDays } from '../../types/activity';
import type { PlanDayInput } from '../../services/activityService';

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

function formatPlanDate(dateLike?: string | null): string {
  if (!dateLike) return 'Not set';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FitnessScreen({ onProfilePress, onNotificationsPress, onOpenAI, onOpenWorkoutLog, onOpenAddExercise, onOpenAllPRs }: { onProfilePress?: () => void; onNotificationsPress?: () => void; onOpenAI?: (from?: TabName) => void; onOpenWorkoutLog?: (exercise: any) => void; onOpenAddExercise?: (planDayId: number) => void; onOpenAllPRs?: () => void }) {
  const { onScroll } = useScrollVisibility();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { unreadCount } = useNotifications();
  const [activeSegment, setActiveSegment] = useState<Segment>('Overview');
  const [loading, setLoading] = useState(true);

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
  const [selectedPlanDayIndex, setSelectedPlanDayIndex] = useState<number | null>(null);
  const [showWorkoutPreview, setShowWorkoutPreview] = useState(false);

  // ── Plan setup modal state ─────────────────────────────────
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [planStep, setPlanStep] = useState(1);
  const [planNameInput, setPlanNameInput] = useState('');
  const [planGoal, setPlanGoal] = useState('');
  const [planDaysPerWeek, setPlanDaysPerWeek] = useState('4');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayExercises, setDayExercises] = useState<Record<number, { name: string; sets: string; reps: string; weight: string }[]>>({});
  const [planSaving, setPlanSaving] = useState(false);

  // ── Edit exercise modal state ─────────────────────────────────
  const [editExModalVisible, setEditExModalVisible] = useState(false);
  const [editExId, setEditExId] = useState<number | null>(null);
  const [editExName, setEditExName] = useState('');
  const [editExSets, setEditExSets] = useState('3');
  const [editExReps, setEditExReps] = useState('10');
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

  // ── Log PR modal state ─────────────────────────────────
  const [logPRVisible, setLogPRVisible] = useState(false);
  const [prExerciseId, setPrExerciseId] = useState<number | null>(null);
  const [prWeight, setPrWeight] = useState('');
  const [prReps, setPrReps] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [prDateObj, setPrDateObj] = useState<Date>(new Date());
  const [showPRDatePicker, setShowPRDatePicker] = useState(false);
  const [prSaving, setPrSaving] = useState(false);
  const [exPickerVisible, setExPickerVisible] = useState(false);

  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    if (planDaysRes.status === 'fulfilled') {
      setWorkoutPlanDays(planDaysRes.value);
    }
    if (prsRes.status === 'fulfilled') setPrs(prsRes.value);
    if (goalRes.status === 'fulfilled') setActivityGoal(goalRes.value);
    setRefreshing(false);
  }, [session?.access_token, todayStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (_workoutLogged) {
        _workoutLogged = false;
        fetchData();
      }
    }, [fetchData])
  );

  // Intercept Android hardware back button when workout preview is open
  useEffect(() => {
    if (!showWorkoutPreview) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowWorkoutPreview(false);
      return true; // prevent default (navigating away)
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
  const selectedPlanDay =
    selectedPlanDayIndex !== null ? currentPlanDays[selectedPlanDayIndex] || null : null;

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

  const onPRDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPRDatePicker(false);
    if (selected) setPrDateObj(selected);
  };

  const handleLogPR = async () => {
    if (!session?.access_token || !prExerciseId) return;
    if (!prWeight.trim() || !prReps.trim()) {
      Alert.alert('Required', 'Please enter weight and reps.');
      return;
    }
    setPrSaving(true);
    try {
      const achievedAt = new Date(prDateObj);
      achievedAt.setHours(12, 0, 0, 0);
      await activityService.createPersonalRecord(session.access_token, {
        exercise_id: prExerciseId,
        weight: parseFloat(prWeight),
        reps: parseInt(prReps, 10),
        description: prDescription.trim() || undefined,
        achieved_at: achievedAt.toISOString(),
      });
      setLogPRVisible(false);
      setPrExerciseId(null);
      setPrWeight('');
      setPrReps('');
      setPrDescription('');
      setPrDateObj(new Date());
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to log PR.');
    } finally {
      setPrSaving(false);
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
    // Full-screen PR modal
    prModalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    prModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    prModalHeaderCenter: { flex: 1, alignItems: 'center' },
    prModalTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
    },
    prModalBody: {
      flex: 1,
      padding: Spacing.lg,
    },
    prModalLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: Spacing.sm,
      marginTop: Spacing.lg,
    },
    prModalInput: {
      backgroundColor: theme.colors.bgCard,
      color: theme.colors.textPrimary,
      fontSize: Typography.base,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    prModalDateBtn: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    prPickerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.bgCard,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    prPickerValue: { fontSize: Typography.base, color: theme.colors.textPrimary },
    prPickerPlaceholder: { fontSize: Typography.base, color: theme.colors.textMuted },
    prPickerArrow: { fontSize: Typography.lg, color: theme.colors.textMuted },
    prPickerOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'flex-end',
    },
    prPickerSheet: {
      backgroundColor: theme.colors.bgCardSolid,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      maxHeight: '80%',
      paddingBottom: Spacing.base,
    },
    prPickerHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.bgCardBorder,
      alignSelf: 'center',
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    prPickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    prPickerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    prPickerDone: {
      fontSize: Typography.sm,
      color: theme.colors.teal,
      fontWeight: Typography.bold,
    },
    prPickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md + 4,
    },
    prPickerItemSelected: {
      backgroundColor: theme.colors.bgCardBorder + '40',
    },
    prPickerItemText: { flex: 1, fontSize: Typography.base, color: theme.colors.textPrimary, fontWeight: Typography.medium },
    prPickerItemSelectedText: { color: theme.colors.teal, fontWeight: Typography.semiBold },
    prPickerDivider: {
      height: 1,
      backgroundColor: theme.colors.bgCardBorder,
      marginLeft: Spacing.xl,
    },
    prModalFooter: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      paddingTop: Spacing.base,
      borderTopWidth: 1,
      borderTopColor: theme.colors.bgCardBorder,
    },
    planCard: {
      padding: Spacing.base,
      marginBottom: Spacing.sm,
      overflow: 'hidden',
    },
    planActionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.base,
    },
    planActionBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: Colors.bgCardBorder,
      backgroundColor: Colors.bgCardSolid,
      alignItems: 'center',
    },
    planActionText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: Colors.textSecondary,
    },
    planCardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    planCardContent: {
      flex: 1,
    },
    planEyebrow: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: Typography.lsWide,
    },
    planTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    planTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.extraBold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
      flexShrink: 1,
    },
    planEditBtn: {
      padding: 4,
    },
    planMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    planMetaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    planMetaText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
    },
    planDescription: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    planStatsRow: {
      flexDirection: 'row',
      marginTop: Spacing.base,
      paddingTop: Spacing.base,
      borderTopWidth: 1,
      borderTopColor: theme.colors.bgCardBorder,
    },
    planStat: {
      flex: 1,
      paddingHorizontal: Spacing.sm,
      gap: 4,
    },
    planStatDivider: {
      width: 1,
      backgroundColor: theme.colors.bgCardBorder,
      opacity: 0.9,
    },
    planStatLabel: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
    },
    planStatValue: {
      fontSize: Typography.sm,
      color: theme.colors.textPrimary,
      fontWeight: Typography.bold,
    },
    weekRail: {
      marginHorizontal: -Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    weekCard: {
      width: Math.min(156, width * 0.38),
      minHeight: 158,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      marginHorizontal: Spacing.sm,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    weekCardDay: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.colors.accentBlue,
      textTransform: 'uppercase',
      letterSpacing: Typography.lsWide,
    },
    weekCardName: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginTop: 4,
    },
    weekCardSub: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 16,
    },
    weekCardIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bgCardBorder,
      marginVertical: 12,
    },
    weekCardFooter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.bgCardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    workoutOverlay: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    workoutOverlayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingTop: insets.top + Spacing.lg,
      paddingBottom: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    workoutOverlayTitleWrap: {
      flex: 1,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    workoutOverlayTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    workoutOverlaySub: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    workoutOverlaySpacer: {
      width: 44,
      height: 44,
    },
    workoutOverlayContent: {
      padding: Spacing.base,
      paddingBottom: 100,
    },
    prHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    prHeaderTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
    },
    prHeaderSubtitle: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    prDropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    prDropdownText: {
      fontSize: Typography.sm,
      color: theme.colors.textPrimary,
      marginRight: 4,
      fontWeight: Typography.medium,
    },
    prStatsCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: Spacing.base,
      marginBottom: Spacing.xl,
    },
    prStatItem: {
      alignItems: 'center',
      flex: 1,
    },
    prStatDivider: {
      width: 1,
      backgroundColor: theme.colors.bgCardBorder,
      marginVertical: Spacing.sm,
    },
    prStatValue: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
      marginTop: Spacing.xs,
    },
    prStatLabel: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    prSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    prSectionTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
    },
    prSectionAction: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    prSectionActionText: {
      fontSize: Typography.sm,
      color: theme.colors.teal,
      fontWeight: Typography.medium,
      marginRight: 4,
    },
    prTimelineContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      position: 'relative',
    },
    prTimelineStep: {
      alignItems: 'center',
      width: 50,
      zIndex: 1,
    },
    prTimelineLine: {
      position: 'absolute',
      top: 6,
      left: 30,
      right: 30,
      height: 2,
      backgroundColor: theme.colors.bgCardBorder,
      zIndex: 0,
    },
    prTimelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.textMuted,
      borderWidth: 2,
      borderColor: theme.colors.bg,
      marginBottom: 8,
    },
    prTimelineDotActive: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.bg,
      borderWidth: 3,
      borderColor: theme.colors.teal,
      marginBottom: 6,
      marginTop: -2,
    },
    prTimelineLabel: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    prTimelineLabelActive: {
      color: theme.colors.teal,
      fontWeight: Typography.bold,
    },
    prTimelineSub: {
      fontSize: 10,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    prCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    prCardIconWrap: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    prCardContent: {
      flex: 1,
    },
    prCardTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
    },
    prCardSubtitle: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    prCardRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: 4,
    },
    prCardWeight: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
    },
    prCardWeightUnit: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      marginLeft: 2,
      marginRight: Spacing.sm,
    },
    prCardIncrease: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
    },
    prCardDate: {
      fontSize: 10,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    prCardBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.full,
      borderWidth: 1,
      position: 'absolute',
      top: 0,
      right: 0,
    },
    prCardBadgeText: {
      fontSize: 8,
      fontWeight: Typography.bold,
      marginLeft: 2,
    },
    prLogBtn: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: theme.colors.teal + '40',
      borderStyle: 'dashed',
      marginTop: Spacing.sm,
      backgroundColor: theme.colors.teal + '15',
    },
    prLogBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    prLogBtnText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: theme.colors.teal,
      marginLeft: 8,
    },
    prLogBtnSub: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
    },
  }));
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
    onSetupPlan,
    onAddExercise,
    onEditExercise,
    onLogExercise,
    title = "Today's Workout",
    subtitle = dayName || undefined,
    showHeader = true,
    showAddExercise = true,
  }: {
    exercises: TodayExercise[];
    dayName: string | null;
    planName: string | null;
    planDayId: number | null;
    onSetupPlan: () => void;
    onAddExercise: () => void;
    onEditExercise: (ex: TodayExercise) => void;
    onLogExercise: (exercise: any) => void;
    title?: string;
    subtitle?: string;
    showHeader?: boolean;
    showAddExercise?: boolean;
  }) {
    if (exercises.length === 0) {
      return (
        <>
          {showHeader && <SectionHeader title={title} subtitle={subtitle} />}
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

    const displayExercises = exercises;

    return (
      <>
        {showHeader && <SectionHeader title={title} subtitle={subtitle} />}
        {displayExercises.map((ex) => {
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
                      {ex.last_performance.completed && (
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
        {planDayId && showAddExercise && (
          <TouchableOpacity
            onPress={onAddExercise}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: Spacing.md, marginTop: Spacing.xs, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.accentBlue + '50', borderStyle: 'dashed', backgroundColor: Colors.accentBlue + '08' }}
            activeOpacity={0.7}>
            <Text style={{ fontSize: Typography.md, marginRight: Spacing.xs, color: Colors.accentBlue }}>+</Text>
            <Text style={{ fontSize: Typography.sm, color: Colors.accentBlue, fontWeight: Typography.semiBold }}>Add Exercise</Text>
          </TouchableOpacity>
        )}
      </>
    );
  }

  function CurrentPlanSection() {
    const planDays = currentPlanDays;
    const previewDay = selectedPlanDay || (dayName ? planDays.find(d => d.day_name === dayName) || null : null);
    const previewLabel = previewDay?.day_name || dayName || 'Choose a day';
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
      setSelectedPlanDayIndex(index);
      setShowWorkoutPreview(true);
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
            <TouchableOpacity style={styles.planEditBtn} activeOpacity={0.7}>
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
          <TouchableOpacity activeOpacity={0.7} style={styles.planActionBtn}>
            <Text style={styles.planActionText}>Custom Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.planActionBtn}>
            <Text style={styles.planActionText}>Explore Plans</Text>
          </TouchableOpacity>
        </View>

        {/* ── Today's Schedule card ─────────────────────────── */}
        {(() => {
          const todayIndex = planDays.findIndex(d => d.day_name === dayName);
          const todayPlanDay = todayIndex >= 0 ? planDays[todayIndex] : null;
          if (!todayPlanDay) return null;
          const todayExCount = todayPlanDay.exercises?.length ?? 0;
          return (
            <>
              <SectionHeader title="Today's Schedule" />
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => {
                  setSelectedPlanDayIndex(todayIndex);
                  setShowWorkoutPreview(true);
                }}
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
          {planDays.length > 0 ? planDays.map((day, index) => {
            const isTodayDay = day.day_name === dayName;
            return (
              <TouchableOpacity
                key={`${day.day_no}-${day.day_name}`}
                activeOpacity={0.82}
                onPress={() => openDay(index)}>
                <GlassCardView style={styles.weekCard}>
                  <Text style={styles.weekCardDay}>{day.day_name.slice(0, 3)}</Text>
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

        {/* workout preview overlay is rendered at root level */}
      </View>
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

  function PersonalRecordsCard({ prs, onViewAll }: { prs: PersonalRecord[]; onViewAll?: () => void }) {
    const totalPRs = prs.length;
    const now = new Date();
    const thisMonth = prs.filter(pr => {
      const d = new Date(pr.achieved_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const thisWeek = prs.filter(pr => new Date(pr.achieved_at) >= startOfWeek).length;
    const uniqueExercises = new Set(prs.map(pr => pr.exercise_name)).size;

    const prColors = [Colors.teal, '#A855F7', Colors.accentBlue, Colors.amber];

    return (
      <View style={{ marginBottom: Spacing.xl }}>
        <View style={styles.prHeaderRow}>
          <View>
            <Text style={styles.prHeaderTitle}>Personal Records</Text>
            <Text style={styles.prHeaderSubtitle}>Your strongest moments. Keep breaking them.</Text>
          </View>
        </View>

        <GlassCardView style={styles.prStatsCard}>
          <View style={styles.prStatItem}>
            <Trophy size={20} color={Colors.teal} />
            <Text style={styles.prStatValue}>{totalPRs}</Text>
            <Text style={styles.prStatLabel}>Total PRs</Text>
          </View>
          <View style={styles.prStatDivider} />
          <View style={styles.prStatItem}>
            <TrendingUp size={20} color={Colors.accentBlue} />
            <Text style={styles.prStatValue}>{thisMonth}</Text>
            <Text style={styles.prStatLabel}>This Month</Text>
          </View>
          <View style={styles.prStatDivider} />
          <View style={styles.prStatItem}>
            <Flame size={20} color={Colors.amber} />
            <Text style={styles.prStatValue}>{thisWeek}</Text>
            <Text style={styles.prStatLabel}>This Week</Text>
          </View>
          <View style={styles.prStatDivider} />
          <View style={styles.prStatItem}>
            <Star size={20} color={'#A855F7'} />
            <Text style={styles.prStatValue}>{uniqueExercises}</Text>
            <Text style={styles.prStatLabel}>Exercises</Text>
          </View>
        </GlassCardView>

        <View style={styles.prSectionHeader}>
          <Text style={styles.prSectionTitle}>PR Timeline</Text>
          <TouchableOpacity style={styles.prSectionAction} onPress={onViewAll}>
            <Text style={styles.prSectionActionText}>View All</Text>
            <ChevronRight size={16} color={Colors.teal} />
          </TouchableOpacity>
        </View>

        {(() => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthCounts: Record<string, number> = {};
          prs.forEach(pr => {
            const d = new Date(pr.achieved_at);
            const key = monthNames[d.getMonth()];
            monthCounts[key] = (monthCounts[key] || 0) + 1;
          });
          const recentMonths = monthNames.filter(m => monthCounts[m]).slice(-5);
          if (recentMonths.length === 0) return null;
          const currentMonth = monthNames[now.getMonth()];
          return (
            <View style={styles.prTimelineContainer}>
              <View style={styles.prTimelineLine} />
              {recentMonths.map((m) => {
                const isActive = m === currentMonth;
                return (
                  <View key={m} style={styles.prTimelineStep}>
                    <View style={isActive ? styles.prTimelineDotActive : styles.prTimelineDot} />
                    <Text style={isActive ? [styles.prTimelineLabel, styles.prTimelineLabelActive] : styles.prTimelineLabel}>{m}</Text>
                    <Text style={isActive ? [styles.prTimelineSub, styles.prTimelineLabelActive] : styles.prTimelineSub}>{monthCounts[m]} PR{monthCounts[m] > 1 ? 's' : ''}</Text>
                  </View>
                );
              })}
            </View>
          );
        })()}

        <View style={[styles.prSectionHeader, { marginTop: Spacing.xl }]}>
          <Text style={styles.prSectionTitle}>Recent PRs</Text>
          {prs.length > 5 && (
            <TouchableOpacity style={styles.prSectionAction} onPress={onViewAll}>
              <Text style={styles.prSectionActionText}>View All</Text>
              <ChevronRight size={16} color={Colors.teal} />
            </TouchableOpacity>
          )}
        </View>

        {prs.length === 0 ? (
          <GlassCardView style={styles.prCard}>
            <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', paddingVertical: Spacing.md }}>
              No PRs logged yet. Tap the button below to log your first one.
            </Text>
          </GlassCardView>
        ) : (
          prs.slice(0, 5).map((pr, idx) => {
            const itemColor = prColors[idx % prColors.length];
            const dateStr = new Date(pr.achieved_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <GlassCardView key={pr.pr_id} style={styles.prCard}>
                <View style={[styles.prCardIconWrap, { backgroundColor: itemColor + '20' }]}>
                  <Dumbbell size={20} color={itemColor} />
                </View>
                <View style={styles.prCardContent}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={styles.prCardTitle}>{pr.exercise_name}</Text>
                  </View>
                  <Text style={styles.prCardSubtitle}>{pr.reps} Rep Max</Text>
                  <View style={styles.prCardRow}>
                    <Text style={[styles.prCardWeight, { color: itemColor }]}>{pr.weight}</Text>
                    <Text style={styles.prCardWeightUnit}>kg</Text>
                  </View>
                  {pr.description ? (
                    <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 }}>{pr.description}</Text>
                  ) : null}
                  <Text style={styles.prCardDate}>{dateStr}</Text>
                </View>
              </GlassCardView>
            );
          })
        )}

        <TouchableOpacity style={styles.prLogBtn} activeOpacity={0.7} onPress={() => setLogPRVisible(true)}>
          <View style={[styles.prLogBtnRow, { marginBottom: 0 }]}>
            <Plus size={16} color={Colors.teal} />
            <Text style={styles.prLogBtnText}>Log a New PR</Text>
          </View>
        </TouchableOpacity>
      </View>
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

            {showTodayWorkout && (
              <View style={styles.section}>
                <TodaysWorkout
                  exercises={exercises}
                  dayName={dayName}
                  planName={planName}
                  planDayId={planDayId}
                  onSetupPlan={() => setPlanModalVisible(true)}
                  onAddExercise={() => planDayId && onOpenAddExercise && onOpenAddExercise(planDayId)}
                  onEditExercise={openEditExercise}
                  onLogExercise={(ex) => onOpenWorkoutLog && onOpenWorkoutLog(ex)}
                />
              </View>
            )}

            {showYourPlan && <CurrentPlanSection />}

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
                <PersonalRecordsCard prs={prs} onViewAll={onOpenAllPRs} />
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Workout Preview Overlay ──────────────────────────── */}
      {showWorkoutPreview && (
        <View style={[styles.workoutOverlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }]}>
          <View style={styles.workoutOverlayHeader}>
            <BackButton onPress={() => setShowWorkoutPreview(false)} color={Colors.textPrimary} />
            <View style={styles.workoutOverlayTitleWrap}>
              <Text style={styles.workoutOverlayTitle}>{selectedPlanDay?.day_name || dayName || ''} Workout</Text>
              <Text style={styles.workoutOverlaySub}>{currentPlanName}</Text>
            </View>
            <View style={styles.workoutOverlaySpacer} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.workoutOverlayContent}>
            <TodaysWorkout
              exercises={selectedPlanDay?.day_name === dayName ? exercises : (selectedPlanDay?.exercises || [])}
              dayName={selectedPlanDay?.day_name || dayName}
              planName={planName}
              planDayId={selectedPlanDay?.plan_days_id || planDayId}
              onSetupPlan={() => setPlanModalVisible(true)}
              onAddExercise={() => {
                const dayId = selectedPlanDay?.plan_days_id || planDayId;
                if (dayId && onOpenAddExercise) onOpenAddExercise(dayId);
              }}
              onEditExercise={openEditExercise}
              onLogExercise={(ex) => onOpenWorkoutLog && onOpenWorkoutLog(ex)}
              title="Exercises"
              subtitle={undefined}
              showHeader={false}
              showAddExercise={true}
            />
          </ScrollView>
        </View>
      )}

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

      {/* ── Log PR Modal ─────────────────────────── */}
      {logPRVisible && (
        <Modal visible={logPRVisible} animationType="slide" transparent>
          <View style={styles.prModalOverlay}>
            <View style={[styles.prModalHeader, { paddingTop: insets.top + Spacing.sm }]}>
              <BackButton onPress={() => setLogPRVisible(false)} color={Colors.textPrimary} />
              <View style={styles.prModalHeaderCenter}>
                <Text style={styles.prModalTitle}>Log a New PR</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.prModalBody} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.prModalLabel}>Exercise</Text>
              {allPlanExercises.length > 0 ? (
                <TouchableOpacity style={styles.prPickerRow} onPress={() => setExPickerVisible(true)} activeOpacity={0.7}>
                  <Text style={prExerciseId ? styles.prPickerValue : styles.prPickerPlaceholder}>
                    {prExerciseId ? allPlanExercises.find(e => e.id === prExerciseId)?.name : 'Select exercise'}
                  </Text>
                  <Text style={styles.prPickerArrow}>›</Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary }}>
                  Set up a workout plan first to log PRs.
                </Text>
              )}

              <Text style={styles.prModalLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.prModalInput}
                value={prWeight}
                onChangeText={setPrWeight}
                keyboardType="decimal-pad"
                placeholder="e.g. 100"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.prModalLabel}>Reps</Text>
              <TextInput
                style={styles.prModalInput}
                value={prReps}
                onChangeText={setPrReps}
                keyboardType="number-pad"
                placeholder="e.g. 1"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.prModalLabel}>Date</Text>
              <TouchableOpacity
                style={styles.prModalDateBtn}
                onPress={() => setShowPRDatePicker(true)}
                activeOpacity={0.7}>
                <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm }}>
                  {prDateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
              {showPRDatePicker && (
                <DateTimePicker
                  value={prDateObj}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onPRDateChange}
                  maximumDate={new Date()}
                />
              )}

              <Text style={styles.prModalLabel}>Note (optional)</Text>
              <TextInput
                style={[styles.prModalInput, { minHeight: 80, textAlignVertical: 'top' }]}
                value={prDescription}
                onChangeText={setPrDescription}
                placeholder="e.g. new 1RM!"
                placeholderTextColor={Colors.textMuted}
                multiline
              />
            </ScrollView>

            <View style={styles.prModalFooter}>
              <TouchableOpacity
                onPress={() => setLogPRVisible(false)}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogPR}
                disabled={prSaving || !prExerciseId}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.teal, opacity: prSaving || !prExerciseId ? 0.6 : 1 }}>
                {prSaving ? (
                  <ActivityIndicator size="small" color={Colors.bg} />
                ) : (
                  <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Log PR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Exercise Picker Modal ─────────────────────────── */}
      <Modal visible={exPickerVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setExPickerVisible(false)}
          style={styles.prPickerOverlay}>
          <View style={styles.prPickerSheet}>
            <View style={styles.prPickerHandle} />
            <View style={styles.prPickerHeader}>
              <Text style={styles.prPickerTitle}>Select Exercise</Text>
              <TouchableOpacity onPress={() => setExPickerVisible(false)} activeOpacity={0.7}>
                <Text style={styles.prPickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            {allPlanExercises.map((ex, idx) => (
              <React.Fragment key={ex.id}>
                <TouchableOpacity
                  style={[styles.prPickerItem, prExerciseId === ex.id && styles.prPickerItemSelected]}
                  onPress={() => {
                    setPrExerciseId(ex.id);
                    setExPickerVisible(false);
                  }}
                  activeOpacity={0.7}>
                  <Text style={[styles.prPickerItemText, prExerciseId === ex.id && styles.prPickerItemSelectedText]}>
                    {ex.name}
                  </Text>
                  {prExerciseId === ex.id && <Check size={20} color={Colors.teal} strokeWidth={2.5} />}
                </TouchableOpacity>
                {idx < allPlanExercises.length - 1 && <View style={styles.prPickerDivider} />}
              </React.Fragment>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
