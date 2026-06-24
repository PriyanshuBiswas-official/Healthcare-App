import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';
import { GlassCardView, SectionHeader, ProgressBar, ProfileAvatarButton, NotificationIconButton } from '../components/SharedComponents';
import { useAuth } from '../providers/AuthProvider';
import * as dietService from '../services/dietService';
import type { NutritionLog, NutritionGoal, WeeklyTrendDay, MealType } from '../types/diet';

// ── Meal category definitions ────────────────────────────────

const MEAL_CATEGORIES: { key: MealType; name: string; icon: string; color: string }[] = [
  { key: 'breakfast', name: 'Breakfast', icon: '☕', color: Colors.amber },
  { key: 'lunch', name: 'Lunch', icon: '🥗', color: Colors.teal },
  { key: 'snack', name: 'Snack', icon: '🍎', color: Colors.pink },
  { key: 'dinner', name: 'Dinner', icon: '🌙', color: Colors.textMuted },
];

const MEAL_TYPE_OPTIONS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

// ── AI Suggestions (hardcoded for now) ──────────────────────

const AI_SUGGESTIONS = [
  { title: 'Baked salmon & broccoli', tags: ['High protein', 'omega-3', 'low carb'], calories: 490, highlight: '38g protein', icon: '🐟', type: 'AI pick', color: Colors.teal },
  { title: 'Lentil soup & roti', tags: ['Low GI', 'high fibre', 'gut friendly'], calories: 420, highlight: '24g fibre', icon: '🍲', type: 'Diabetic', color: Colors.purple },
  { title: 'Egg fried brown rice', tags: ['Balanced macros', '15 min prep'], calories: 510, highlight: '28g protein', icon: '🥚', type: 'Quick', color: Colors.amber },
  { title: 'Tofu stir fry & noodles', tags: ['Plant-based', 'iron rich', 'anti-inflammatory'], calories: 460, highlight: '22g protein', icon: '🍃', type: 'Vegan', color: Colors.pink },
];

// ── Helpers ──────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────

export default function CalorieScreen({ onProfilePress, onNotificationsPress }: { onProfilePress?: () => void; onNotificationsPress?: () => void }) {
  const { onScroll } = useScrollVisibility();
  const { user, session } = useAuth();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toDateString(today), [today]);

  // ── Data state ─────────────────────────────────────────────
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [waterTotalMl, setWaterTotalMl] = useState(0);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendDay[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Goal edit state ────────────────────────────────────────
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');

  // ── Modal state ────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMealType, setModalMealType] = useState<MealType>('breakfast');
  const [modalFood, setModalFood] = useState('');
  const [modalCalories, setModalCalories] = useState('');
  const [modalProtein, setModalProtein] = useState('');
  const [modalCarbs, setModalCarbs] = useState('');
  const [modalFat, setModalFat] = useState('');
  const [modalFiber, setModalFiber] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  // ── Custom water modal state ────────────────────────────────
  const [customWaterVisible, setCustomWaterVisible] = useState(false);
  const [customWaterText, setCustomWaterText] = useState('');

  // ── Computed values ────────────────────────────────────────
  const calorieGoal = goal?.calorie_goal ?? 0;
  const waterGoalMl = goal?.water_goal ?? 0;

  // ── First-time goal setup modal ────────────────────────────
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

  // ── Group meals by taken_as ────────────────────────────────
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

  // ── Data fetching ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const [mealsRes, waterRes, goalRes, weeklyRes] = await Promise.all([
        dietService.getMealsForDate(session.access_token, todayStr),
        dietService.getWaterForDate(session.access_token, todayStr),
        dietService.getCalorieGoal(session.access_token),
        dietService.getWeeklyTrend(session.access_token, todayStr),
      ]);
      setMeals(mealsRes.meals);
      setWaterLogs(waterRes.logs);
      setWaterTotalMl(waterRes.total_ml);
      setGoal(goalRes);
      setWeeklyTrend(weeklyRes);
      setTempGoal(String(goalRes?.calorie_goal ?? 0));
    } catch (e) {
      console.warn('[CalorieScreen] Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, todayStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Show goal setup for first-time users ───────────────────
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

  // ── Handle goal setup save ─────────────────────────────────
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

  // ── Goal save ──────────────────────────────────────────────
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

  // ── Water logging ──────────────────────────────────────────
  const handleLogWater = async (amountMl: number) => {
    if (!session?.access_token) return;
    try {
      const log = await dietService.logWater(session.access_token, amountMl);
      setWaterLogs(prev => [...prev, log]);
      setWaterTotalMl(prev => prev + amountMl);
    } catch (e) {
      console.warn('[CalorieScreen] Log water failed:', e);
    }
  };

  // ── Meal logging modal ─────────────────────────────────────
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
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save meal.');
    } finally {
      setModalSaving(false);
    }
  };

  // ── Delete meal ────────────────────────────────────────────
  const handleDeleteMeal = async (nutritionId: number) => {
    if (!session?.access_token) return;
    try {
      await dietService.deleteMeal(session.access_token, nutritionId);
      setMeals(prev => prev.filter(m => m.nutrition_id !== nutritionId));
    } catch (e) {
      console.warn('[CalorieScreen] Delete meal failed:', e);
    }
  };

  // ── Render ─────────────────────────────────────────────────

  const macros = [
    { label: 'Protein', val: totalMacros.protein, target: goal?.protein_goal ?? 120, unit: 'g', color: Colors.teal },
    { label: 'Carbs', val: totalMacros.carbs, target: goal?.carbs_goal ?? 280, unit: 'g', color: Colors.amber },
    { label: 'Fats', val: totalMacros.fat, target: goal?.fat_goal ?? 70, unit: 'g', color: Colors.pink },
    { label: 'Fiber', val: totalMacros.fiber, target: goal?.fiber_goal ?? 25, unit: 'g', color: Colors.purple },
  ];

  const waterLiters = (waterTotalMl / 1000).toFixed(1);
  const waterGoalLiters = (waterGoalMl / 1000).toFixed(1);
  const waterPercent = waterGoalMl > 0 ? Math.round((waterTotalMl / waterGoalMl) * 100) : 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Diet</Text>
            <Text style={styles.sub}>{formatDateHeader(today)}</Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationIconButton onPress={onNotificationsPress} />
            <ProfileAvatarButton
              onPress={onProfilePress}
              userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              avatarUrl={user?.user_metadata?.avatar_url}
            />
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.teal} />
          </View>
        ) : (
          <>
            {/* No Goals Banner */}
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
                  <View style={[styles.iconWrapSm, { backgroundColor: Colors.amber + '20', width: 36, height: 36, borderRadius: 18 }]}>
                    <Text style={{ fontSize: 16 }}>🎯</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary }}>Set up your diet goals</Text>
                    <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 }}>Track calories, macros, and water intake</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: Colors.textMuted }}>›</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* AI Nutrition Insight */}
            <GlassCardView style={styles.aiCard} accentColor={Colors.amber}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                <View style={[styles.iconWrapSm, { backgroundColor: Colors.amber + '20' }]}>
                  <Text style={{ fontSize: 14 }}>✦</Text>
                </View>
                <Text style={[styles.aiLabel, { color: Colors.amber, marginLeft: Spacing.sm, marginBottom: 0 }]}>AI NUTRITION INSIGHT</Text>
              </View>
              <Text style={styles.aiText}>
                Your protein intake is 32% below your daily goal. Adding a protein shake or an egg-white omelette at dinner could close the gap. Fiber is also trending low this week — consider adding spinach or flaxseed to your meals.
              </Text>
            </GlassCardView>

            {/* Calorie Ring Card */}
            <GlassCardView style={styles.calorieCard}>
              <View style={styles.calorieRow}>
                <View style={styles.gaugeWrap}>
                  {(() => {
                    const size = 140;
                    const stroke = 12;
                    const inner = size - stroke * 2;
                    const clampedProgress = Math.min(progress, 1);
                    const color = progress > 1 ? Colors.pink : Colors.teal;
                    const rightDeg = Math.min(clampedProgress * 360, 180);
                    const leftDeg = clampedProgress > 0.5 ? Math.min((clampedProgress - 0.5) * 360, 180) : 0;
                    return (
                      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.bgCardBorder, overflow: 'hidden' }}>
                        {/* Right half */}
                        <View style={{ position: 'absolute', top: 0, right: 0, width: size / 2, height: size, overflow: 'hidden' }}>
                          <View style={{
                            width: size / 2,
                            height: size,
                            borderRadius: size / 2,
                            backgroundColor: color,
                            transform: [{ rotate: `${rightDeg - 180}deg` }],
                            transformOrigin: 'left center',
                          }} />
                        </View>
                        {/* Left half */}
                        <View style={{ position: 'absolute', top: 0, left: 0, width: size / 2, height: size, overflow: 'hidden' }}>
                          <View style={{
                            width: size / 2,
                            height: size,
                            borderRadius: size / 2,
                            backgroundColor: color,
                            transform: [{ rotate: `${leftDeg}deg` }],
                            transformOrigin: 'right center',
                          }} />
                        </View>
                        {/* Inner circle (background) */}
                        <View style={{ position: 'absolute', top: stroke, left: stroke, width: inner, height: inner, borderRadius: inner / 2, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={styles.gaugeValue}>{totalCalories.toLocaleString()}</Text>
                          <Text style={styles.gaugeUnit}>kcal eaten</Text>
                        </View>
                      </View>
                    );
                  })()}
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
                        <TextInput
                          style={styles.editGoalInput}
                          value={tempGoal}
                          onChangeText={setTempGoal}
                          keyboardType="number-pad"
                          autoFocus
                        />
                        <TouchableOpacity onPress={handleSaveGoal} style={styles.saveGoalBtn}>
                          <Text style={styles.saveGoalBtnText}>✓</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={[styles.calorieStatVal, { color: Colors.textPrimary }]}>{calorieGoal.toLocaleString()}</Text>
                    )}
                  </View>
                  <View style={[styles.calorieDivider]} />
                  <View style={styles.calorieStat}>
                    <Text style={styles.calorieStatLabel}>Remaining</Text>
                    <Text style={[styles.calorieStatVal, { color: remaining > 0 ? Colors.teal : Colors.pink }]}>
                      {remaining > 0 ? remaining.toLocaleString() : `+${Math.abs(remaining)}`}
                    </Text>
                  </View>
                  <View style={[styles.calorieDivider]} />
                  <View style={styles.calorieStat}>
                    <Text style={styles.calorieStatLabel}>Burned</Text>
                    <Text style={[styles.calorieStatVal, { color: Colors.amber }]}>0</Text>
                  </View>
                </View>
              </View>
              <ProgressBar progress={progress} color={progress > 1 ? Colors.pink : Colors.teal} height={8} style={{ marginTop: Spacing.md }} />
              <Text style={styles.calorieProgressLabel}>{Math.round(progress * 100)}% of daily goal</Text>
            </GlassCardView>

            {/* Track Calorie with a Photo */}
            <SectionHeader title="Track Calorie with a photo" />
            <GlassCardView style={styles.photoUploadCard}>
              <TouchableOpacity style={styles.photoUploadArea}>
                <View style={styles.cameraIconWrap}>
                  <Text style={{ fontSize: 28 }}>📷</Text>
                </View>
                <Text style={styles.photoUploadTitle}>Scan meal with AI</Text>
                <Text style={styles.photoUploadSub}>Upload or take a photo to automatically log calories and macros.</Text>
              </TouchableOpacity>
            </GlassCardView>

            {/* Macros */}
            <SectionHeader title="Macronutrients" />
            <GlassCardView style={styles.macroCard}>
              <View style={styles.macroGrid}>
                {macros.map(m => (
                  <View key={m.label} style={[styles.macroItem, { borderColor: m.color + '40', backgroundColor: m.color + '10' }]}>
                    <Text style={[styles.macroVal, { color: m.color }]}>{m.val}{m.unit}</Text>
                    <Text style={styles.macroLabel}>{m.label}</Text>
                    <ProgressBar progress={m.target > 0 ? m.val / m.target : 0} color={m.color} height={4} style={{ marginTop: Spacing.xs }} />
                    <Text style={styles.macroTarget}>/ {m.target}{m.unit}</Text>
                  </View>
                ))}
              </View>
            </GlassCardView>

            {/* TODAY'S MEALS */}
            <SectionHeader title="TODAY'S MEALS" />
            <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
              {MEAL_CATEGORIES.map((cat, index) => {
                const catMeals = mealsByType[cat.key];
                const hasMeals = catMeals.length > 0;
                const totalCals = catMeals.reduce((s, m) => s + (m.calories || 0), 0);
                const foodNames = catMeals.map(m => m.food).join(', ');
                const timeStr = hasMeals ? formatTime(catMeals[catMeals.length - 1].logged_at) : null;

                return (
                  <View key={cat.key}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.sm }}>
                      <View style={[styles.iconWrapSm, { backgroundColor: hasMeals ? cat.color + '20' : Colors.bgCardBorder, width: 44, height: 44, borderRadius: Radius.md }]}>
                        <Text style={{ fontSize: 22, opacity: hasMeals ? 1 : 0.5 }}>{cat.icon}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: hasMeals ? Colors.textPrimary : Colors.textSecondary }}>{cat.name}</Text>
                          {hasMeals && (
                            <View style={{ backgroundColor: Colors.teal + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, marginLeft: Spacing.sm }}>
                              <Text style={{ fontSize: 10, color: Colors.teal, fontWeight: Typography.bold }}>Logged</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
                          {hasMeals ? foodNames : 'Not logged yet - AI suggestion ready'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        {hasMeals ? (
                          <>
                            <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary }}>{totalCals}</Text>
                            <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 2 }}>kcal · {timeStr}</Text>
                          </>
                        ) : (
                          <TouchableOpacity
                            onPress={() => openMealModal(cat.key)}
                            style={{ paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: Colors.bgCardBorder, borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: Typography.xs, color: Colors.textPrimary, fontWeight: Typography.bold, marginRight: 4 }}>Log</Text>
                            <Text style={{ fontSize: 12, color: Colors.textPrimary }}>↗</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {index < MEAL_CATEGORIES.length - 1 && <View style={{ height: 1, backgroundColor: Colors.bgCardBorder, marginVertical: Spacing.xs }} />}
                  </View>
                );
              })}
            </GlassCardView>

            {/* WATER INTAKE */}
            <SectionHeader title="WATER INTAKE" />
            <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontSize: Typography.xl, fontWeight: Typography.extraBold, color: Colors.textPrimary }}>{waterLiters}</Text>
                    <Text style={{ fontSize: Typography.sm, color: Colors.textMuted, marginLeft: 2 }}>/ {waterGoalLiters} L</Text>
                  </View>
                  <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary }}>{waterPercent}% of daily goal</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.teal + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.teal + '30' }}>
                  <Text style={{ fontSize: 12, marginRight: 6 }}>💧</Text>
                  <Text style={{ fontSize: 10, color: Colors.teal, fontWeight: Typography.bold }}>{waterTotalMl} ml</Text>
                </View>
              </View>

              {/* Water progress bar */}
              <View style={{ height: 8, borderRadius: 4, backgroundColor: Colors.bgCardBorder, marginBottom: Spacing.sm, overflow: 'hidden' }}>
                <View style={{ height: '100%', borderRadius: 4, width: `${Math.min(waterPercent, 100)}%`, backgroundColor: Colors.teal }} />
              </View>
              <Text style={{ fontSize: 10, color: Colors.textMuted, marginBottom: Spacing.base, textAlign: 'right' }}>{waterTotalMl} / {waterGoalMl} ml</Text>

              {/* Quick add buttons */}
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {[200, 250, 300, 500].map((ml) => (
                  <TouchableOpacity
                    key={ml}
                    onPress={() => handleLogWater(ml)}
                    style={{ flex: 1, backgroundColor: Colors.bgCardBorder, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.bgCardBorder }}>
                    <Text style={{ fontSize: 11, color: Colors.teal, fontWeight: Typography.bold }}>+{ml}</Text>
                    <Text style={{ fontSize: 9, color: Colors.textMuted }}>ml</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom amount */}
              <TouchableOpacity
                onPress={() => {
                  setCustomWaterText('');
                  setCustomWaterVisible(true);
                }}
                style={{ marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.teal + '40', backgroundColor: Colors.teal + '08', paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.teal, fontWeight: Typography.semiBold }}>+ Custom amount</Text>
              </TouchableOpacity>
            </GlassCardView>

            {/* AI MEAL SUGGESTIONS */}
            <SectionHeader title="AI MEAL SUGGESTIONS - DINNER" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl, justifyContent: 'space-between' }}>
              {AI_SUGGESTIONS.map((item, idx) => (
                <GlassCardView key={idx} style={{ width: '48.5%', padding: Spacing.sm, marginBottom: Spacing.sm }}>
                  <View style={{ backgroundColor: item.color + '20', height: 70, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }}>
                    <Text style={{ fontSize: 32 }}>{item.icon}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary, flex: 1, marginRight: Spacing.xs, lineHeight: 18 }} numberOfLines={2}>{item.title}</Text>
                    <View style={{ backgroundColor: Colors.bgCardBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full }}>
                      <Text style={{ fontSize: 9, color: item.color, fontWeight: Typography.bold }}>{item.type}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 10, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 14 }} numberOfLines={2}>
                    {item.tags.join(' - ')}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary }}>~{item.calories} <Text style={{ fontSize: 10, color: Colors.textMuted, fontWeight: 'normal' }}>kcal</Text></Text>
                    <View style={{ backgroundColor: item.color + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1, borderColor: item.color + '30' }}>
                      <Text style={{ fontSize: 9, color: item.color, fontWeight: Typography.bold }}>{item.highlight}</Text>
                    </View>
                  </View>
                </GlassCardView>
              ))}
            </View>

            {/* WEEKLY NUTRITION TREND */}
            <SectionHeader title="WEEKLY NUTRITION TREND" />
            <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
                <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary }}>Calorie intake <Text style={{ color: Colors.textSecondary, fontWeight: 'normal' }}>— past 7 days</Text></Text>
                <View style={{ backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.purple, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, marginRight: 4 }}>✦</Text>
                  <Text style={{ fontSize: 10, color: Colors.purple, fontWeight: Typography.bold }}>AI analyzed Today</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs }}>
                {weeklyTrend.map((day, idx) => (
                  <View key={idx} style={{ alignItems: 'center', width: '12%', height: '100%', justifyContent: 'flex-end' }}>
                    <View style={{ width: '100%', height: `${(day.val / 3000) * 100}%`, backgroundColor: day.today ? Colors.purple : day.val > 2000 ? Colors.amber : Colors.teal + '80', borderRadius: Radius.sm, minHeight: 20 }} />
                    <Text style={{ fontSize: 12, color: day.today ? Colors.purple : Colors.textSecondary, marginTop: Spacing.sm, fontWeight: day.today ? Typography.bold : 'normal' }}>{day.day}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: Colors.bgCardBorder, marginVertical: Spacing.md }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary }}>Avg this week: <Text style={{ color: Colors.textPrimary, fontWeight: Typography.bold }}>{weeklyAvg.toLocaleString()} kcal</Text></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.teal + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.teal + '50' }}>
                  <Text style={{ fontSize: 10, color: Colors.teal, fontWeight: Typography.bold }}>✓ {weeklyAvg <= calorieGoal ? 'Within goal' : 'Over goal'}</Text>
                </View>
              </View>
            </GlassCardView>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Meal Logging Modal ─────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Log Meal</Text>

            {/* Meal type selector */}
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
                    backgroundColor: modalMealType === type ? Colors.teal + '20' : Colors.bgCardBorder,
                    borderWidth: modalMealType === type ? 1 : 0,
                    borderColor: Colors.teal,
                  }}>
                  <Text style={{ fontSize: Typography.xs, color: modalMealType === type ? Colors.teal : Colors.textSecondary, fontWeight: Typography.bold, textTransform: 'capitalize' }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Food name */}
            <Text style={styles.modalLabel}>Food name *</Text>
            <TextInput
              style={styles.modalInput}
              value={modalFood}
              onChangeText={setModalFood}
              placeholder="e.g. Grilled chicken salad"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Calories */}
            <Text style={styles.modalLabel}>Calories (kcal)</Text>
            <TextInput
              style={styles.modalInput}
              value={modalCalories}
              onChangeText={setModalCalories}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Macros row */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Protein (g)</Text>
                <TextInput style={styles.modalInput} value={modalProtein} onChangeText={setModalProtein} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Carbs (g)</Text>
                <TextInput style={styles.modalInput} value={modalCarbs} onChangeText={setModalCarbs} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Fat (g)</Text>
                <TextInput style={styles.modalInput} value={modalFat} onChangeText={setModalFat} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Fiber (g)</Text>
                <TextInput style={styles.modalInput} value={modalFiber} onChangeText={setModalFiber} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveMeal}
                disabled={modalSaving}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.teal, opacity: modalSaving ? 0.6 : 1 }}>
                {modalSaving ? (
                  <ActivityIndicator size="small" color={Colors.bg} />
                ) : (
                  <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Save Meal</Text>
                )}
              </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Custom Water Modal ────────────────────────────────── */}
      <Modal visible={customWaterVisible} animationType="fade" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCustomWaterVisible(false)}
          style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.customWaterBox}>
            <Text style={styles.modalTitle}>Add Water</Text>
            <Text style={styles.modalLabel}>Amount (ml)</Text>
            <TextInput
              style={styles.modalInput}
              value={customWaterText}
              onChangeText={setCustomWaterText}
              keyboardType="number-pad"
              placeholder="e.g. 300"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.base }}>
              <TouchableOpacity onPress={() => setCustomWaterVisible(false)} style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const ml = parseInt(customWaterText, 10);
                  if (ml > 0) {
                    handleLogWater(ml);
                    setCustomWaterVisible(false);
                  }
                }}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.teal }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Goal Setup Modal (first-time users) ──────────────── */}
      <Modal visible={goalSetupVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setGoalSetupVisible(false)}
          style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set Your Nutrition Goals</Text>
            <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.base }}>
              Set your daily goals to track your progress. You can update these anytime.
            </Text>

            <Text style={styles.modalLabel}>Calorie goal (kcal) *</Text>
            <TextInput
              style={styles.modalInput}
              value={setupCalorieGoal}
              onChangeText={setSetupCalorieGoal}
              keyboardType="number-pad"
              placeholder="e.g. 2500"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={styles.modalLabel}>Water goal (ml)</Text>
            <TextInput
              style={styles.modalInput}
              value={setupWaterGoal}
              onChangeText={setSetupWaterGoal}
              keyboardType="number-pad"
              placeholder="e.g. 2500"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Protein (g)</Text>
                <TextInput style={styles.modalInput} value={setupProteinGoal} onChangeText={setSetupProteinGoal} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Carbs (g)</Text>
                <TextInput style={styles.modalInput} value={setupCarbsGoal} onChangeText={setSetupCarbsGoal} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Fat (g)</Text>
                <TextInput style={styles.modalInput} value={setupFatGoal} onChangeText={setSetupFatGoal} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Fiber (g)</Text>
                <TextInput style={styles.modalInput} value={setupFiberGoal} onChangeText={setSetupFiberGoal} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity
                onPress={() => setGoalSetupVisible(false)}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.bgCardBorder }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>Skip for now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveGoalSetup}
                disabled={setupSaving}
                style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.teal, opacity: setupSaving ? 0.6 : 1 }}>
                {setupSaving ? (
                  <ActivityIndicator size="small" color={Colors.bg} />
                ) : (
                  <Text style={{ fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold }}>Save Goals</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: Typography.sm, color: Colors.amber, marginTop: 4, fontWeight: Typography.medium },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  aiCard: { padding: Spacing.base, marginBottom: Spacing.lg },
  noGoalBanner: {
    backgroundColor: Colors.amber + '15',
    borderWidth: 1,
    borderColor: Colors.amber + '40',
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  iconWrapSm: { alignItems: 'center', justifyContent: 'center' },
  aiLabel: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1.5 },
  aiText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },

  photoUploadCard: { marginBottom: Spacing.lg, padding: Spacing.base },
  photoUploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.teal + '60',
    backgroundColor: Colors.teal + '10',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.teal + '20', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  photoUploadTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  photoUploadSub: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },

  calorieCard: { padding: Spacing.lg, marginBottom: Spacing.xl },
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gaugeWrap: { width: 140, height: 140 },
  gaugeValue: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary },
  gaugeUnit: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  calorieStats: { flex: 1, marginLeft: Spacing.lg },
  calorieStat: { marginBottom: Spacing.xs },
  goalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editBtn: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: Colors.bgCardBorder, borderRadius: Radius.sm },
  editBtnText: { fontSize: 10, color: Colors.textSecondary },
  editGoalRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  editGoalInput: { flex: 1, backgroundColor: Colors.bg, color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.bold, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.teal },
  saveGoalBtn: { marginLeft: 8, backgroundColor: Colors.teal, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveGoalBtnText: { color: Colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },
  calorieStatLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: 2 },
  calorieStatVal: { fontSize: Typography.base, fontWeight: Typography.bold },
  calorieDivider: { height: 1, backgroundColor: Colors.bgCardBorder, marginVertical: Spacing.xs },
  calorieProgressLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },

  macroCard: { padding: Spacing.base, marginBottom: Spacing.xl },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  macroItem: { width: '47%', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.base },
  macroVal: { fontSize: Typography.lg, fontWeight: Typography.bold, marginBottom: 2 },
  macroLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: Spacing.xs },
  macroTarget: { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.bgCardSolid,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.bgCardBorder, alignSelf: 'center', marginBottom: Spacing.base },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.base },
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
  customWaterBox: {
    backgroundColor: Colors.bgCardSolid,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
});
