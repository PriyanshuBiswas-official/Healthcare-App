import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'lucide-react-native';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import { GlassCardView, SectionHeader, ProgressBar, ProfileAvatarButton, NotificationIconButton } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import { useNotifications } from '../../providers/NotificationContext';
import * as dietService from '../../services/dietService';
import type { NutritionLog, NutritionGoal, WeeklyTrendDay, WeeklyWaterDay, MealType, MealSuggestion } from '../../types/diet';
import MealSuggestionDetailModal from '../../components/diet/MealSuggestionDetailModal';
import { posthog } from '../../config/posthog';

const MEAL_TYPE_OPTIONS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

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

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export default function CalorieScreen({ onProfilePress, onNotificationsPress }: { onProfilePress?: () => void; onNotificationsPress?: () => void }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { onScroll } = useScrollVisibility();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { unreadCount } = useNotifications();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toDateString(today), [today]);

  const MEAL_CATEGORIES: { key: MealType; name: string; icon: string; color: string }[] = useMemo(() => [
    { key: 'breakfast', name: 'Breakfast', icon: '☕', color: colors.amber },
    { key: 'lunch', name: 'Lunch', icon: '🥗', color: colors.teal },
    { key: 'snack', name: 'Snack', icon: '🍎', color: colors.pink },
    { key: 'dinner', name: 'Dinner', icon: '🌙', color: colors.textMuted },
  ], [colors.amber, colors.teal, colors.pink, colors.textMuted]);

  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [waterTotalMl, setWaterTotalMl] = useState(0);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendDay[]>([]);
  const [weeklyWaterTrend, setWeeklyWaterTrend] = useState<WeeklyWaterDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealSuggestion | null>(null);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMealType, setModalMealType] = useState<MealType>('breakfast');
  const [modalFood, setModalFood] = useState('');
  const [modalCalories, setModalCalories] = useState('');
  const [modalProtein, setModalProtein] = useState('');
  const [modalCarbs, setModalCarbs] = useState('');
  const [modalFat, setModalFat] = useState('');
  const [modalFiber, setModalFiber] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const [customWaterVisible, setCustomWaterVisible] = useState(false);
  const [customWaterText, setCustomWaterText] = useState('');

  const calorieGoal = goal?.calorie_goal ?? 0;
  const waterGoalMl = goal?.water_goal ?? 0;

  const [goalSetupVisible, setGoalSetupVisible] = useState(false);
  const [setupCalorieGoal, setSetupCalorieGoal] = useState('');
  const [setupWaterGoal, setSetupWaterGoal] = useState('');
  const [setupProteinGoal, setSetupProteinGoal] = useState('');
  const [setupCarbsGoal, setSetupCarbsGoal] = useState('');
  const [setupFatGoal, setSetupFatGoal] = useState('');
  const [setupFiberGoal, setSetupFiberGoal] = useState('');
  const [setupSaving, setSetupSaving] = useState(false);

  const totalCalories = useMemo(() => meals.reduce((sum, m) => sum + (m.calories || 0), 0), [meals]);
  const totalMacros = useMemo(() => ({
    protein: meals.reduce((sum, m) => sum + (m.protein || 0), 0),
    carbs: meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
    fat: meals.reduce((sum, m) => sum + (m.fat || 0), 0),
    fiber: meals.reduce((sum, m) => sum + (m.fiber || 0), 0),
  }), [meals]);

  const remaining = calorieGoal - totalCalories;
  const progress = calorieGoal > 0 ? totalCalories / calorieGoal : 0;

  const weeklyAvg = useMemo(() => {
    if (weeklyTrend.length === 0) return 0;
    const total = weeklyTrend.reduce((sum, d) => sum + d.val, 0);
    return Math.round(total / weeklyTrend.length);
  }, [weeklyTrend]);

  const weeklyWaterAvg = useMemo(() => {
    if (weeklyWaterTrend.length === 0) return 0;
    const total = weeklyWaterTrend.reduce((sum, d) => sum + d.val, 0);
    return Math.round(total / weeklyWaterTrend.length);
  }, [weeklyWaterTrend]);

  const mealsByType = useMemo(() => {
    const grouped: Record<MealType, NutritionLog[]> = {
      breakfast: [],
      lunch: [],
      snack: [],
      dinner: [],
    };
    for (const meal of meals) {
      const type = (meal.taken_as || '').toLowerCase() as MealType;
      if (grouped[type]) {
        grouped[type].push(meal);
      }
    }
    return grouped;
  }, [meals]);

  const styles = useStyles(t => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    scroll: { paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: t.colors.textPrimary, letterSpacing: -0.5 },
    sub: { fontSize: Typography.sm, color: t.colors.amber, marginTop: 4, fontWeight: Typography.medium },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    aiCard: { padding: Spacing.base, marginBottom: Spacing.lg },
    noGoalBanner: {
      backgroundColor: t.colors.amber + '15',
      borderWidth: 1,
      borderColor: t.colors.amber + '40',
      borderRadius: Radius.md,
      padding: Spacing.base,
      marginBottom: Spacing.lg,
    },
    iconWrapSm: { alignItems: 'center', justifyContent: 'center' },
    aiLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1.5 },
    aiText: { fontSize: Typography.sm, color: t.colors.textSecondary, lineHeight: 20 },
    photoUploadCard: { marginBottom: Spacing.lg, padding: Spacing.base },
    photoUploadArea: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: t.colors.teal + '60',
      backgroundColor: t.colors.teal + '10',
      borderRadius: Radius.lg,
      padding: Spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: t.colors.teal + '20', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
    photoUploadTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: t.colors.textPrimary, marginBottom: 4 },
    photoUploadSub: { fontSize: Typography.xs, color: t.colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },
    calorieCard: { padding: Spacing.lg, marginBottom: Spacing.xl },
    calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    gaugeWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
    gaugeCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    gaugeValue: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: t.colors.textPrimary },
    gaugeUnit: { fontSize: Typography.xs, color: t.colors.textMuted, marginTop: 2 },
    calorieStats: { flex: 1, marginLeft: Spacing.lg },
    calorieStat: { marginBottom: Spacing.xs },
    goalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    editBtn: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: t.colors.bgCardBorder, borderRadius: Radius.sm },
    editBtnText: { fontSize: Typography.xs, color: t.colors.textSecondary },
    editGoalRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    editGoalInput: { flex: 1, backgroundColor: t.colors.bg, color: t.colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.bold, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: t.colors.teal },
    saveGoalBtn: { marginLeft: 8, backgroundColor: t.colors.teal, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    saveGoalBtnText: { color: t.colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },
    calorieStatLabel: { fontSize: Typography.xs, color: t.colors.textSecondary, marginBottom: 2 },
    calorieStatVal: { fontSize: Typography.base, fontWeight: Typography.bold },
    calorieDivider: { height: 1, backgroundColor: t.colors.bgCardBorder, marginVertical: Spacing.xs },
    calorieProgressLabel: { fontSize: Typography.xs, color: t.colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
    macroCard: { padding: Spacing.base, marginBottom: Spacing.xl },
    macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    macroItem: { width: '47%', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.base },
    macroVal: { fontSize: Typography.lg, fontWeight: Typography.bold, marginBottom: 2 },
    macroLabel: { fontSize: Typography.xs, color: t.colors.textSecondary, marginBottom: Spacing.xs },
    macroTarget: { fontSize: Typography.xs, color: t.colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
    modalOverlay: { flex: 1, backgroundColor: t.colors.overlay, justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: t.colors.bgCardSolid,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.bgCardBorder, alignSelf: 'center', marginBottom: Spacing.base },
    modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary, marginBottom: Spacing.base },
    modalLabel: { fontSize: Typography.xs, color: t.colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
    modalInput: {
      backgroundColor: t.colors.bg,
      color: t.colors.textPrimary,
      fontSize: Typography.base,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      marginBottom: Spacing.xs,
    },
    customWaterBox: {
      backgroundColor: t.colors.bgCardSolid,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      marginHorizontal: Spacing.xl,
      marginTop: 'auto',
      marginBottom: Spacing.xl,
    },
  }));

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const [mealsRes, waterRes, goalRes, weeklyRes, weeklyWaterRes] = await Promise.all([
        dietService.getMealsForDate(session.access_token, todayStr),
        dietService.getWaterForDate(session.access_token, todayStr),
        dietService.getCalorieGoal(session.access_token),
        dietService.getWeeklyTrend(session.access_token, todayStr),
        dietService.getWeeklyWaterTrend(session.access_token, todayStr),
      ]);
      setMeals(mealsRes.meals);
      setWaterLogs(waterRes.logs);
      setWaterTotalMl(waterRes.total_ml);
      setGoal(goalRes);
      setWeeklyTrend(weeklyRes);
      setWeeklyWaterTrend(weeklyWaterRes);
      setTempGoal(String(goalRes?.calorie_goal ?? 0));
    } catch (e) {
      console.warn('[CalorieScreen] Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, todayStr]);

  const handleRefresh = useCallback(async () => {
    if (!session?.access_token) return;
    setRefreshing(true);
    const [mealsRes, waterRes, goalRes, weeklyRes, weeklyWaterRes] = await Promise.allSettled([
      dietService.getMealsForDate(session.access_token, todayStr),
      dietService.getWaterForDate(session.access_token, todayStr),
      dietService.getCalorieGoal(session.access_token),
      dietService.getWeeklyTrend(session.access_token, todayStr),
      dietService.getWeeklyWaterTrend(session.access_token, todayStr),
    ]);
    if (mealsRes.status === 'fulfilled') setMeals(mealsRes.value.meals);
    if (waterRes.status === 'fulfilled') {
      setWaterLogs(waterRes.value.logs);
      setWaterTotalMl(waterRes.value.total_ml);
    }
    if (goalRes.status === 'fulfilled') {
      setGoal(goalRes.value);
      setTempGoal(String(goalRes.value?.calorie_goal ?? 0));
    }
    if (weeklyRes.status === 'fulfilled') setWeeklyTrend(weeklyRes.value);
    if (weeklyWaterRes.status === 'fulfilled') setWeeklyWaterTrend(weeklyWaterRes.value);
    setRefreshing(false);
  }, [session?.access_token, todayStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading && goal === null) {
      setSetupCalorieGoal('');
      setSetupWaterGoal('');
      setSetupProteinGoal('');
      setSetupCarbsGoal('');
      setSetupFatGoal('');
      setSetupFiberGoal('');
      setGoalSetupVisible(true);
    }
  }, [loading, goal]);

  useEffect(() => {
    if (!session?.access_token) return;
    setSuggestionsLoading(true);
    dietService.getMealSuggestions(session.access_token, { maxCalories: 600, number: 4 })
      .then(res => setSuggestions(res.suggestions))
      .catch(() => { })
      .finally(() => setSuggestionsLoading(false));
  }, [session?.access_token]);

  const handleSaveGoalSetup = async () => {
    if (!session?.access_token) return;
    const calorie = parseInt(setupCalorieGoal, 10) || 0;
    const water = parseInt(setupWaterGoal, 10) || 0;
    setSetupSaving(true);
    try {
      const saved = await dietService.saveCalorieGoal(session.access_token, {
        calorie_goal: calorie,
        water_goal: water,
        protein_goal: parseInt(setupProteinGoal, 10) || 0,
        carbs_goal: parseInt(setupCarbsGoal, 10) || 0,
        fat_goal: parseInt(setupFatGoal, 10) || 0,
        fiber_goal: parseInt(setupFiberGoal, 10) || 0,
      });
      setGoal(saved);
      setTempGoal(String(calorie));
      setGoalSetupVisible(false);
    } catch (e) {
      console.warn('[CalorieScreen] Save goal setup failed:', e);
      Alert.alert('Error', 'Failed to save goals. Please try again.');
    } finally {
      setSetupSaving(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!session?.access_token) return;
    const parsed = parseInt(tempGoal, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setTempGoal(String(calorieGoal));
      setIsEditingGoal(false);
      return;
    }
    try {
      const saved = await dietService.saveCalorieGoal(session.access_token, { calorie_goal: parsed });
      setGoal(saved);
    } catch (e) {
      console.warn('[CalorieScreen] Save goal failed:', e);
      setTempGoal(String(calorieGoal));
    }
    setIsEditingGoal(false);
  };

  const handleLogWater = async (amountMl: number) => {
    if (!session?.access_token) return;
    try {
      await dietService.logWater(session.access_token, amountMl);
      const waterRes = await dietService.getWaterForDate(session.access_token, todayStr);
      setWaterLogs(waterRes.logs);
      setWaterTotalMl(waterRes.total_ml);
    } catch (e) {
      console.warn('[CalorieScreen] Log water failed:', e);
    }
  };

  const openMealModal = (mealType: MealType) => {
    setModalMealType(mealType);
    setModalFood('');
    setModalCalories('');
    setModalProtein('');
    setModalCarbs('');
    setModalFat('');
    setModalFiber('');
    setModalVisible(true);
  };

  const handleSaveMeal = async () => {
    if (!session?.access_token) return;
    if (!modalFood.trim()) {
      Alert.alert('Required', 'Please enter a food name.');
      return;
    }
    setModalSaving(true);
    try {
      const newMeal = await dietService.logMeal(session.access_token, {
        food: modalFood.trim(),
        taken_as: modalMealType,
        calories: parseInt(modalCalories, 10) || 0,
        protein: parseInt(modalProtein, 10) || 0,
        carbs: parseInt(modalCarbs, 10) || 0,
        fat: parseInt(modalFat, 10) || 0,
        fiber: parseInt(modalFiber, 10) || 0,
      });
      setMeals(prev => [...prev, newMeal]);
      posthog?.capture('meal_logged', { meal_type: modalMealType });
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save meal.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteMeal = async (nutritionId: number) => {
    if (!session?.access_token) return;
    try {
      await dietService.deleteMeal(session.access_token, nutritionId);
      setMeals(prev => prev.filter(m => m.nutrition_id !== nutritionId));
    } catch (e) {
      console.warn('[CalorieScreen] Delete meal failed:', e);
    }
  };

  const getMealTypeByTime = (): MealType => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 18) return 'snack';
    return 'dinner';
  };

  const handleLogSuggestionMeal = async (data: { food: string; calories: number; protein: number; carbs: number; fat: number; fiber: number }) => {
    if (!session?.access_token) return;
    try {
      const newMeal = await dietService.logMeal(session.access_token, {
        food: data.food,
        taken_as: getMealTypeByTime(),
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber,
      });
      setMeals(prev => [...prev, newMeal]);
      posthog?.capture('meal_logged', { meal_type: getMealTypeByTime(), source: 'ai_suggestion' });
    } catch (e) {
      console.warn('[CalorieScreen] Log suggestion meal failed:', e);
    }
  };

  const macros = [
    { label: 'Protein', val: totalMacros.protein, target: goal?.protein_goal ?? 120, unit: 'g', color: colors.teal },
    { label: 'Carbs', val: totalMacros.carbs, target: goal?.carbs_goal ?? 280, unit: 'g', color: colors.amber },
    { label: 'Fats', val: totalMacros.fat, target: goal?.fat_goal ?? 70, unit: 'g', color: colors.pink },
    { label: 'Fiber', val: totalMacros.fiber, target: goal?.fiber_goal ?? 25, unit: 'g', color: colors.accentBlue },
  ];

  const waterLiters = (waterTotalMl / 1000).toFixed(1);
  const waterGoalLiters = (waterGoalMl / 1000).toFixed(1);
  const waterPercent = waterGoalMl > 0 ? Math.round((waterTotalMl / waterGoalMl) * 100) : 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={onScroll} scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.teal, colors.pink]} tintColor={colors.teal} progressBackgroundColor={colors.bgCard} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Diet</Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationIconButton onPress={onNotificationsPress} unreadCount={unreadCount} />
            <ProfileAvatarButton
              onPress={onProfilePress}
              userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              avatarUrl={user?.user_metadata?.avatar_url}
            />
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.teal} />
          </View>
        ) : (
          <>
            {goal === null && (
              <TouchableOpacity
                onPress={() => {
                  setSetupCalorieGoal('');
                  setSetupWaterGoal('');
                  setSetupProteinGoal('');
                  setSetupCarbsGoal('');
                  setSetupFatGoal('');
                  setSetupFiberGoal('');
                  setGoalSetupVisible(true);
                }}
                style={styles.noGoalBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.iconWrapSm, { backgroundColor: colors.amber + '20', width: 36, height: 36, borderRadius: 18 }]}>
                    <Text style={{ fontSize: Typography.base }}>🎯</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary }}>Set up your diet goals</Text>
                    <Text style={{ fontSize: Typography.xs, color: colors.textSecondary, marginTop: 2 }}>Track calories, macros, and water intake</Text>
                  </View>
                  <Text style={{ fontSize: Typography.lg, color: colors.textMuted }}>›</Text>
                </View>
              </TouchableOpacity>
            )}

            <GlassCardView style={styles.calorieCard}>
              <View style={styles.calorieRow}>
                <View style={styles.gaugeWrap}>
                  {(() => {
                    const size = 140;
                    const stroke = 12;
                    const radius = (size - stroke) / 2;
                    const circumference = 2 * Math.PI * radius;
                    const clampedProgress = Math.min(progress, 1);
                    const offset = circumference - clampedProgress * circumference;
                    const color = progress > 1 ? colors.pink : colors.teal;
                    return (
                      <Svg width={size} height={size}>
                        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.bgCardBorder} strokeWidth={stroke} fill="none" />
                        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
                      </Svg>
                    );
                  })()}
                  <View style={styles.gaugeCenter}>
                    <Text style={styles.gaugeValue}>{totalCalories.toLocaleString()}</Text>
                    <Text style={styles.gaugeUnit}>kcal eaten</Text>
                  </View>
                </View>

                <View style={styles.calorieStats}>
                  <View style={styles.calorieStat}>
                    <View style={styles.goalHeaderRow}>
                      <Text style={styles.calorieStatLabel}>Goal</Text>
                      {!isEditingGoal && (
                        <TouchableOpacity onPress={() => setIsEditingGoal(true)} style={styles.editBtn}>
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {isEditingGoal ? (
                      <View style={styles.editGoalRow}>
                        <TextInput style={styles.editGoalInput} value={tempGoal} onChangeText={setTempGoal} keyboardType="number-pad" autoFocus />
                        <TouchableOpacity onPress={handleSaveGoal} style={styles.saveGoalBtn}>
                          <Text style={styles.saveGoalBtnText}>✓</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={[styles.calorieStatVal, { color: colors.textPrimary }]}>{calorieGoal.toLocaleString()}</Text>
                    )}
                  </View>
                  <View style={[styles.calorieDivider]} />
                  <View style={styles.calorieStat}>
                    <Text style={styles.calorieStatLabel}>Remaining</Text>
                    <Text style={[styles.calorieStatVal, { color: remaining > 0 ? colors.teal : colors.pink }]}>
                      {remaining > 0 ? remaining.toLocaleString() : `+${Math.abs(remaining)}`}
                    </Text>
                  </View>
                  <View style={[styles.calorieDivider]} />
                  <View style={styles.calorieStat}>
                    <Text style={styles.calorieStatLabel}>Burned</Text>
                    <Text style={[styles.calorieStatVal, { color: colors.amber }]}>0</Text>
                  </View>
                </View>
              </View>
            </GlassCardView>

            <SectionHeader title="Track Calorie with a photo" />
            <GlassCardView style={styles.photoUploadCard}>
              <TouchableOpacity style={styles.photoUploadArea}>
                <View style={styles.cameraIconWrap}>
                  <Camera size={28} color={colors.teal} strokeWidth={2} />
                </View>
                <Text style={styles.photoUploadTitle}>Scan meal with AI</Text>
                <Text style={styles.photoUploadSub}>Upload or take a photo to automatically log calories and macros.</Text>
              </TouchableOpacity>
            </GlassCardView>

            <SectionHeader title="Macronutrients" />
            <GlassCardView style={styles.macroCard}>
              <View style={styles.macroGrid}>
                {macros.map(m => {
                  const macroKey = m.label === 'Protein' ? 'protein'
                    : m.label === 'Carbs' ? 'carbs'
                    : m.label === 'Fats' ? 'fat'
                    : 'fiber';
                  const chartData = weeklyTrend.map(d => d[macroKey as keyof typeof d] as number);
                  const maxVal = Math.max(...chartData, 1);
                  const barH = 40;
                  const barW = 6;
                  const gap = 3;

                  return (
                    <View key={m.label} style={[styles.macroItem, { borderColor: m.color + '40', backgroundColor: m.color + '10' }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.macroVal, { color: m.color }]}>{m.val}{m.unit}</Text>
                          <Text style={styles.macroLabel}>{m.label}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap, height: barH, paddingBottom: 0 }}>
                          {chartData.map((v, i) => (
                            <View key={i} style={{ width: barW, height: v > 0 ? `${(v / maxVal) * 100}%` : 3, backgroundColor: m.color + '60', borderRadius: 2 }} />
                          ))}
                        </View>
                      </View>
                      <ProgressBar progress={m.target > 0 ? m.val / m.target : 0} color={m.color} height={4} style={{ marginTop: Spacing.xs }} />
                      <Text style={styles.macroTarget}>/ {m.target}{m.unit}</Text>
                    </View>
                  );
                })}
              </View>
            </GlassCardView>

            <SectionHeader title="TODAY'S MEALS" />
            <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
              {MEAL_CATEGORIES.map((cat) => {
                const catMeals = mealsByType[cat.key];
                const hasMeals = catMeals.length > 0;
                const totalCals = catMeals.reduce((s, m) => s + (m.calories || 0), 0);
                const foodNames = catMeals.map(m => m.food).join(', ');
                const timeStr = hasMeals ? formatTime(catMeals[catMeals.length - 1].logged_at) : null;

                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => openMealModal(cat.key)}
                    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.sm }, pressed && { opacity: 0.5 }]}>
                    <View style={[styles.iconWrapSm, { backgroundColor: hasMeals ? cat.color + '20' : colors.bgCardBorder, width: 44, height: 44, borderRadius: Radius.md }]}>
                      <Text style={{ fontSize: Typography.xl, opacity: hasMeals ? 1 : 0.5 }}>{cat.icon}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: hasMeals ? colors.textPrimary : colors.textSecondary }}>{cat.name}</Text>
                        {hasMeals && (
                          <View style={{ backgroundColor: colors.teal + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, marginLeft: Spacing.sm }}>
                            <Text style={{ fontSize: Typography.xs, color: colors.teal, fontWeight: Typography.bold }}>Logged</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: Typography.xs, color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
                        {hasMeals ? foodNames : 'Not logged yet - tap to log'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      {hasMeals ? (
                        <>
                          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary }}>{totalCals}</Text>
                          <Text style={{ fontSize: Typography.xs, color: colors.textMuted, marginTop: 2 }}>kcal · {timeStr}</Text>
                        </>
                      ) : (
                        <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: colors.bgCardBorder, borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: Typography.xs, color: colors.textPrimary, fontWeight: Typography.bold, marginRight: 4 }}>Log</Text>
                          <Text style={{ fontSize: Typography.sm, color: colors.textPrimary }}>↗</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </GlassCardView>

            <SectionHeader title="WEEKLY NUTRITION TREND" />
            <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary, marginBottom: Spacing.xl }}>Calorie intake <Text style={{ color: colors.textSecondary, fontWeight: Typography.regular }}>— past 7 days</Text></Text>

              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs }}>
                {weeklyTrend.map((day, idx) => (
                  <View key={idx} style={{ alignItems: 'center', width: '12%', height: '100%', justifyContent: 'flex-end' }}>
                    <View style={{ width: '100%', height: `${(day.val / 3000) * 100}%`, backgroundColor: day.today ? colors.accentBlue : day.val > 2000 ? colors.amber : colors.teal + '80', borderRadius: Radius.sm, minHeight: day.val > 0 ? 20 : 0 }} />
                    <Text style={{ fontSize: Typography.sm, color: day.today ? colors.accentBlue : colors.textSecondary, marginTop: Spacing.sm, fontWeight: day.today ? Typography.bold : Typography.regular }}>{day.day}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: colors.bgCardBorder, marginVertical: Spacing.md }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sm, color: colors.textSecondary }}>Avg this week: <Text style={{ color: colors.textPrimary, fontWeight: Typography.bold }}>{weeklyAvg.toLocaleString()} kcal</Text></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.teal + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: colors.teal + '50' }}>
                  <Text style={{ fontSize: Typography.xs, color: colors.teal, fontWeight: Typography.bold }}>✓ {weeklyAvg <= calorieGoal ? 'Within goal' : 'Over goal'}</Text>
                </View>
              </View>
            </GlassCardView>

            <SectionHeader title="WATER INTAKE" />
            <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontSize: Typography.xl, fontWeight: Typography.extraBold, color: colors.textPrimary }}>{waterLiters}</Text>
                    <Text style={{ fontSize: Typography.sm, color: colors.textMuted, marginLeft: 2 }}>/ {waterGoalLiters} L</Text>
                  </View>
                  <Text style={{ fontSize: Typography.xs, color: colors.textSecondary }}>{waterPercent}% of daily goal</Text>
                </View>
              </View>

              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.bgCardBorder, marginBottom: Spacing.sm, overflow: 'hidden' }}>
                <View style={{ height: '100%', borderRadius: 4, width: `${Math.min(waterPercent, 100)}%`, backgroundColor: colors.teal }} />
              </View>
              <Text style={{ fontSize: Typography.xs, color: colors.textMuted, marginBottom: Spacing.base, textAlign: 'right' }}>{waterTotalMl} / {waterGoalMl} ml</Text>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {[200, 250, 300, 500].map((ml) => (
                  <TouchableOpacity
                    key={ml}
                    onPress={() => handleLogWater(ml)}
                    style={{ flex: 1, backgroundColor: colors.bgCardBorder, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.bgCardBorder }}>
                    <Text style={{ fontSize: Typography.xs, color: colors.teal, fontWeight: Typography.bold }}>+{ml}</Text>
                    <Text style={{ fontSize: Typography.xs, color: colors.textMuted }}>ml</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => {
                  setCustomWaterText('');
                  setCustomWaterVisible(true);
                }}
                style={{ marginTop: Spacing.sm, borderWidth: 1, borderColor: colors.teal + '40', backgroundColor: colors.teal + '08', paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sm, color: colors.teal, fontWeight: Typography.semiBold }}>+ Custom amount</Text>
              </TouchableOpacity>
            </GlassCardView>

            <SectionHeader title="WEEKLY WATER TREND" />
            <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
                <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary }}>Water intake <Text style={{ color: colors.textSecondary, fontWeight: Typography.regular }}>— past 7 days</Text></Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs }}>
                {weeklyWaterTrend.map((day, idx) => (
                  <View key={idx} style={{ alignItems: 'center', width: '12%', height: '100%', justifyContent: 'flex-end' }}>
                    <View style={{ width: '100%', height: `${waterGoalMl > 0 ? Math.min((day.val / waterGoalMl) * 100, 100) : (day.val / 3000) * 100}%`, backgroundColor: day.today ? colors.accentBlue : colors.blue + '80', borderRadius: Radius.sm, minHeight: day.val > 0 ? 20 : 0 }} />
                    <Text style={{ fontSize: Typography.sm, color: day.today ? colors.accentBlue : colors.textSecondary, marginTop: Spacing.sm, fontWeight: day.today ? Typography.bold : Typography.regular }}>{day.day}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: colors.bgCardBorder, marginVertical: Spacing.md }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sm, color: colors.textSecondary }}>Avg this week: <Text style={{ color: colors.textPrimary, fontWeight: Typography.bold }}>{weeklyWaterAvg.toLocaleString()} ml</Text></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blue + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: colors.blue + '50' }}>
                  <Text style={{ fontSize: Typography.xs, color: colors.blue, fontWeight: Typography.bold }}>✓ {weeklyWaterAvg >= waterGoalMl ? 'Goal met' : `${waterGoalMl - weeklyWaterAvg} ml left`}</Text>
                </View>
              </View>
            </GlassCardView>

            <SectionHeader title="AI MEAL SUGGESTIONS" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl }}>
              {suggestionsLoading ? (
                <View style={{ width: '100%', alignItems: 'center', paddingVertical: Spacing.lg }}>
                  <ActivityIndicator size="small" color={colors.teal} />
                  <Text style={{ fontSize: Typography.xs, color: colors.textSecondary, marginTop: Spacing.sm }}>Fetching suggestions...</Text>
                </View>
              ) : suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <TouchableOpacity key={item.id || idx} onPress={() => setSelectedMeal(item)} activeOpacity={0.7} style={{ width: '48%', height: 220 }}>
                    <GlassCardView style={{ padding: Spacing.sm, flex: 1 }}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={{ height: 80, borderRadius: Radius.sm, marginBottom: Spacing.sm }} resizeMode="cover" />
                      ) : (
                        <View style={{ backgroundColor: colors.teal + '20', height: 80, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm }}>
                          <Text style={{ fontSize: Typography.xxl, color: colors.teal }}>🍽</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary, marginBottom: 4 }} numberOfLines={2}>{item.title}</Text>
                      <Text style={{ fontSize: Typography.xs, color: colors.textSecondary, marginBottom: Spacing.sm }} numberOfLines={1}>
                        {item.diets?.[0] || item.dishTypes?.[0] || 'Balanced meal'}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary }}>~{item.calories} <Text style={{ fontSize: Typography.xs, color: colors.textMuted, fontWeight: Typography.regular }}>kcal</Text></Text>
                        <View style={{ backgroundColor: colors.teal + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1, borderColor: colors.teal + '30' }}>
                          <Text style={{ fontSize: Typography.xs, color: colors.teal, fontWeight: Typography.bold }}>{item.protein}g P</Text>
                        </View>
                      </View>
                    </GlassCardView>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ width: '100%', alignItems: 'center', paddingVertical: Spacing.lg }}>
                  <Text style={{ fontSize: Typography.xs, color: colors.textSecondary }}>No suggestions available</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {modalVisible && <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(false)} style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Log Meal</Text>

              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base }}>
                {MEAL_TYPE_OPTIONS.map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setModalMealType(type)}
                    style={{
                      flex: 1,
                      paddingVertical: Spacing.sm,
                      borderRadius: Radius.md,
                      alignItems: 'center',
                      backgroundColor: modalMealType === type ? colors.teal + '20' : colors.bgCardBorder,
                      borderWidth: modalMealType === type ? 1 : 0,
                      borderColor: colors.teal,
                    }}>
                    <Text style={{ fontSize: Typography.xs, color: modalMealType === type ? colors.teal : colors.textSecondary, fontWeight: Typography.bold, textTransform: 'capitalize' }}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Food name *</Text>
              <TextInput style={styles.modalInput} value={modalFood} onChangeText={setModalFood} placeholder="e.g. Grilled chicken salad" placeholderTextColor={colors.textMuted} />

              <Text style={styles.modalLabel}>Calories (kcal)</Text>
              <TextInput style={styles.modalInput} value={modalCalories} onChangeText={setModalCalories} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Protein (g)</Text>
                  <TextInput style={styles.modalInput} value={modalProtein} onChangeText={setModalProtein} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Carbs (g)</Text>
                  <TextInput style={styles.modalInput} value={modalCarbs} onChangeText={setModalCarbs} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Fat (g)</Text>
                  <TextInput style={styles.modalInput} value={modalFat} onChangeText={setModalFat} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Fiber (g)</Text>
                  <TextInput style={styles.modalInput} value={modalFiber} onChangeText={setModalFiber} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: colors.bgCardBorder }}>
                  <Text style={{ fontSize: Typography.sm, color: colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveMeal}
                  disabled={modalSaving}
                  style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: colors.teal, opacity: modalSaving ? 0.6 : 1 }}>
                  {modalSaving ? (
                    <ActivityIndicator size="small" color={colors.bg} />
                  ) : (
                    <Text style={{ fontSize: Typography.sm, color: colors.bg, fontWeight: Typography.bold }}>Save Meal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>}

      {customWaterVisible && <Modal visible={customWaterVisible} animationType="fade" transparent>
        <TouchableOpacity activeOpacity={1} onPress={() => setCustomWaterVisible(false)} style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.customWaterBox}>
            <Text style={styles.modalTitle}>Add Water</Text>
            <Text style={styles.modalLabel}>Amount (ml)</Text>
            <TextInput style={styles.modalInput} value={customWaterText} onChangeText={setCustomWaterText} keyboardType="number-pad" placeholder="e.g. 300" placeholderTextColor={colors.textMuted} autoFocus />
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.base }}>
              <TouchableOpacity onPress={() => setCustomWaterVisible(false)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const ml = parseInt(customWaterText, 10);
                  if (ml > 0) {
                    handleLogWater(ml);
                    setCustomWaterVisible(false);
                  }
                }}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: colors.teal }}>
                <Text style={{ fontSize: Typography.sm, color: colors.bg, fontWeight: Typography.bold }}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>}

      {goalSetupVisible && <Modal visible={goalSetupVisible} animationType="slide" transparent>
        <TouchableOpacity activeOpacity={1} onPress={() => setGoalSetupVisible(false)} style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set Your Nutrition Goals</Text>
            <Text style={{ fontSize: Typography.sm, color: colors.textSecondary, marginBottom: Spacing.base }}>
              Set your daily goals to track your progress. You can update these anytime.
            </Text>

            <Text style={styles.modalLabel}>Calorie goal (kcal) *</Text>
            <TextInput style={styles.modalInput} value={setupCalorieGoal} onChangeText={setSetupCalorieGoal} keyboardType="number-pad" placeholder="e.g. 2500" placeholderTextColor={colors.textMuted} autoFocus />

            <Text style={styles.modalLabel}>Water goal (ml)</Text>
            <TextInput style={styles.modalInput} value={setupWaterGoal} onChangeText={setSetupWaterGoal} keyboardType="number-pad" placeholder="e.g. 2500" placeholderTextColor={colors.textMuted} />

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Protein (g)</Text>
                <TextInput style={styles.modalInput} value={setupProteinGoal} onChangeText={setSetupProteinGoal} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Carbs (g)</Text>
                <TextInput style={styles.modalInput} value={setupCarbsGoal} onChangeText={setSetupCarbsGoal} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Fat (g)</Text>
                <TextInput style={styles.modalInput} value={setupFatGoal} onChangeText={setSetupFatGoal} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Fiber (g)</Text>
                <TextInput style={styles.modalInput} value={setupFiberGoal} onChangeText={setSetupFiberGoal} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity
                onPress={() => setGoalSetupVisible(false)}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: colors.textSecondary, fontWeight: Typography.semiBold }}>Skip for now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveGoalSetup}
                disabled={setupSaving}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: colors.teal, opacity: setupSaving ? 0.6 : 1 }}>
                {setupSaving ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <Text style={{ fontSize: Typography.sm, color: colors.bg, fontWeight: Typography.bold }}>Save Goals</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>}

      <MealSuggestionDetailModal
        visible={!!selectedMeal}
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onLogMeal={handleLogSuggestionMeal}
      />
    </KeyboardAvoidingView>
  );
}
