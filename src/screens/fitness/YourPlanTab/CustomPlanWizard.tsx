import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  BackHandler,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import { BackButton } from '../../../components/SharedComponents';
import { ChevronRight, Check, Dumbbell, Plus, Trash2 } from 'lucide-react-native';
import * as activityService from '../../../services/activityService';
import type { WorkoutPlanDay } from '../../../types/activity';
import { useAuth } from '../../../providers/AuthProvider';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CustomPlanWizardProps {
  visible: boolean;
  onBack: () => void;
  onSaved: () => void;
  onOpenAddExercise: (planDayId: number) => void;
  currentPlanName?: string;
  planDays: WorkoutPlanDay[];
  refreshKey?: number;
}

export function CustomPlanWizard({ visible, onBack, onSaved, onOpenAddExercise, currentPlanName, planDays, refreshKey }: CustomPlanWizardProps) {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useStyles((theme: any) => ({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.bg,
      zIndex: 100,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingTop: insets.top + Spacing.sm,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    headerPlaceholder: { width: 40 },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: Spacing.base,
    },
    stepDot: {
      height: 8,
      borderRadius: 4,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: 120,
    },
    title: {
      fontSize: Typography.xl,
      fontWeight: Typography.extraBold,
      color: theme.colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      marginBottom: Spacing.xl,
      lineHeight: 20,
    },
    label: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      fontWeight: Typography.medium,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    input: {
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.md,
      padding: Spacing.md,
      color: theme.colors.textPrimary,
      fontSize: Typography.base,
    },
    chipRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    chip: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      alignItems: 'center',
      borderWidth: 1,
    },
    chipText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
    },
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    dayCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayText: {
      fontSize: Typography.base,
      color: theme.colors.textPrimary,
      marginLeft: Spacing.md,
      fontWeight: Typography.regular,
    },
    dayTextSelected: {
      fontWeight: Typography.bold,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: Spacing.lg,
      paddingBottom: insets.bottom + Spacing.base,
      paddingTop: Spacing.base,
      backgroundColor: theme.colors.bg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.bgCardBorder,
    },
    footerBtn: {
      paddingVertical: Spacing.md,
      borderRadius: Radius.full,
      alignItems: 'center',
    },
    footerBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
    },
    dayCard: {
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      marginBottom: Spacing.md,
    },
    dayCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    dayCardName: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    dayCardBadge: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      backgroundColor: theme.colors.bgCardBorder,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.full,
      fontWeight: Typography.medium,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder + '80',
    },
    exerciseIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.accentBlue + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
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
    exerciseDelete: {
      padding: Spacing.xs,
    },
    addExerciseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.accentBlue + '40',
      borderRadius: Radius.md,
      backgroundColor: theme.colors.accentBlue + '08',
      marginTop: Spacing.sm,
      gap: Spacing.xs,
    },
    addExerciseText: {
      fontSize: Typography.sm,
      color: theme.colors.accentBlue,
      fontWeight: Typography.bold,
    },
    emptyDayText: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.md,
      fontStyle: 'italic',
    },
    reviewSection: {
      marginBottom: Spacing.lg,
    },
    reviewLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: Typography.lsWide,
      marginBottom: Spacing.sm,
    },
    reviewValue: {
      fontSize: Typography.base,
      color: theme.colors.textPrimary,
      fontWeight: Typography.medium,
    },
    reviewPillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    reviewPill: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    reviewPillText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
    },
    reviewDayCard: {
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      marginBottom: Spacing.sm,
    },
    reviewDayName: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    reviewExerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    reviewExerciseName: {
      flex: 1,
      fontSize: Typography.sm,
      color: theme.colors.textPrimary,
    },
    reviewExerciseMeta: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
    },
    reviewAddExerciseLink: {
      fontSize: Typography.sm,
      color: theme.colors.accentBlue,
      fontWeight: Typography.semiBold,
      textAlign: 'center',
      paddingVertical: Spacing.sm,
    },
    activatingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
    },
  }));

  const [step, setStep] = useState(1);
  const [planName, setPlanName] = useState('');
  const [planGoal, setPlanGoal] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('4');
  const [selectedDayIndices, setSelectedDayIndices] = useState<number[]>([0, 1, 2, 3]);
  const [createdPlanDays, setCreatedPlanDays] = useState<WorkoutPlanDay[]>([]);
  const [localPlanDays, setLocalPlanDays] = useState<WorkoutPlanDay[]>([]);
  const displayDays = localPlanDays.length > 0 ? localPlanDays : planDays.length > 0 ? planDays : createdPlanDays;
  const [planId, setPlanId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [activating, setActivating] = useState(false);

  const fetchPlanDays = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await activityService.getCurrentWorkoutPlanDays(session.access_token);
      setLocalPlanDays(res.days || []);
    } catch (e) {
      console.warn('[CustomPlanWizard] fetchPlanDays failed:', e);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (visible && refreshKey !== undefined && refreshKey > 0) {
      fetchPlanDays();
    }
  }, [visible, refreshKey, fetchPlanDays]);

  const resetWizard = useCallback(() => {
    setStep(1);
    setPlanName('');
    setPlanGoal('');
    setDaysPerWeek('4');
    setSelectedDayIndices([0, 1, 2, 3]);
    setCreatedPlanDays([]);
    setLocalPlanDays([]);
    setPlanId(null);
    setCreating(false);
    setActivating(false);
  }, []);

  useEffect(() => {
    if (visible) resetWizard();
  }, [visible, resetWizard]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [visible, step, onBack]);

  const toggleDay = (dayIndex: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDayIndices(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const updateDaysPerWeek = (count: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDaysPerWeek(count);
    const num = parseInt(count, 10);
    setSelectedDayIndices(prev => {
      if (prev.length > num) return prev.slice(0, num);
      return prev;
    });
  };

  const handleCreatePlan = async () => {
    if (!session?.access_token) return;
    if (!planName.trim()) {
      Alert.alert('Required', 'Please enter a plan name.');
      return;
    }
    if (selectedDayIndices.length === 0) {
      Alert.alert('Required', 'Please select at least one workout day.');
      return;
    }

    const doCreate = async () => {
      setCreating(true);
      try {
        const days: activityService.PlanDayInput[] = selectedDayIndices.map((dayIndex) => ({
          day_no: dayIndex === 6 ? 7 : dayIndex + 1,
          day_name: DAY_NAMES[dayIndex],
          exercises: [],
        }));

        const result = await activityService.createWorkoutPlan(session.access_token, {
          plan_name: planName.trim(),
          goal: planGoal.trim() || undefined,
          days_per_week: parseInt(daysPerWeek, 10) || selectedDayIndices.length,
          days,
        });

        const planDaysRes = await activityService.getCurrentWorkoutPlanDays(session.access_token);
        setCreatedPlanDays(planDaysRes.days || []);
        setLocalPlanDays(planDaysRes.days || []);
        setPlanId(result?.plan_id || null);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStep(2);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to create plan.');
      } finally {
        setCreating(false);
      }
    };

    if (currentPlanName && currentPlanName !== 'Current Plan') {
      Alert.alert(
        'Replace Current Plan?',
        `This will replace your existing workout plan "${currentPlanName}". Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'destructive', onPress: doCreate },
        ]
      );
    } else {
      doCreate();
    }
  };

  const handleDeleteExercise = async (exerciseId: number) => {
    if (!session?.access_token) return;
    try {
      await activityService.deleteExercise(session.access_token, exerciseId);
      setCreatedPlanDays(prev =>
        prev.map(day => ({
          ...day,
          exercises: (day.exercises || []).filter(ex => ex.exercise_id !== exerciseId),
        }))
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to delete exercise.');
    }
  };

  const handleBack = async () => {
    if (step > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep(s => s - 1);
      return;
    }
    const totalExercises = displayDays.reduce((sum, d) => sum + (d.exercises?.length || 0), 0);
    if (totalExercises === 0 && session?.access_token) {
      try {
        await activityService.deleteWorkoutPlan(session.access_token);
      } catch (e: any) {
        console.warn('[CustomPlanWizard] Failed to delete empty plan:', e?.message);
      }
      onSaved();
    }
    onBack();
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      onSaved();
      onBack();
    } finally {
      setActivating(false);
    }
  };

  const confirmActivation = () => {
    Alert.alert(
      'Replace Current Plan?',
      currentPlanName
        ? `This will replace your existing workout plan "${currentPlanName}". This action cannot be undone.`
        : 'This will become your active workout plan.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', style: 'destructive', onPress: handleActivate },
      ]
    );
  };

  const canProceedStep2 = displayDays.some(day => (day.exercises || []).length > 0);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map(s => (
        <View
          key={s}
          style={[
            styles.stepDot,
            {
              width: step === s ? 24 : 8,
              backgroundColor: step === s ? Colors.accentBlue : Colors.bgCardBorder,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.title}>Create Workout Plan</Text>
      <Text style={styles.subtitle}>Set up your plan basics. You can add exercises next.</Text>

      <Text style={styles.label}>Plan name *</Text>
      <TextInput
        style={styles.input}
        value={planName}
        onChangeText={setPlanName}
        placeholder="e.g. PPL Split"
        placeholderTextColor={Colors.textMuted}
        autoFocus
      />

      <Text style={styles.label}>Goal</Text>
      <TextInput
        style={styles.input}
        value={planGoal}
        onChangeText={setPlanGoal}
        placeholder="e.g. Build muscle, lose fat"
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.label}>Days per week</Text>
      <View style={styles.chipRow}>
        {['3', '4', '5', '6'].map(d => (
          <TouchableOpacity
            key={d}
            onPress={() => updateDaysPerWeek(d)}
            style={[
              styles.chip,
              {
                backgroundColor: daysPerWeek === d ? Colors.accentBlue + '20' : 'transparent',
                borderColor: daysPerWeek === d ? Colors.accentBlue : Colors.bgCardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: daysPerWeek === d ? Colors.accentBlue : Colors.textSecondary },
              ]}
            >
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Select training days</Text>
      {DAY_NAMES.map((name, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => toggleDay(i)}
          style={styles.dayRow}
        >
          <View
            style={[
              styles.dayCheckbox,
              {
                borderColor: selectedDayIndices.includes(i) ? Colors.accentBlue : Colors.textMuted,
                backgroundColor: selectedDayIndices.includes(i) ? Colors.accentBlue : 'transparent',
              },
            ]}
          >
            {selectedDayIndices.includes(i) && (
              <Check size={12} color={Colors.bg} strokeWidth={3} />
            )}
          </View>
          <Text
            style={[
              styles.dayText,
              selectedDayIndices.includes(i) && styles.dayTextSelected,
            ]}
          >
            {name}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.title}>Add Exercises</Text>
      <Text style={styles.subtitle}>
        {planName} — Tap a day to add exercises.
      </Text>

        {displayDays.map((day) => {
        const dayExercises = day.exercises || [];
        return (
          <View key={day.plan_days_id || day.day_name} style={styles.dayCard}>
            <View style={styles.dayCardHeader}>
              <Text style={styles.dayCardName}>{day.day_name}</Text>
              <Text style={styles.dayCardBadge}>
                {dayExercises.length} exercise{dayExercises.length === 1 ? '' : 's'}
              </Text>
            </View>

            {dayExercises.length === 0 ? (
              <Text style={styles.emptyDayText}>No exercises added yet</Text>
            ) : (
              dayExercises.map((ex) => (
                <View key={ex.exercise_id} style={styles.exerciseRow}>
                  <View style={styles.exerciseIcon}>
                    <Dumbbell size={14} color={Colors.accentBlue} />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName} numberOfLines={1}>{ex.exercise_name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {ex.sets} sets × {ex.reps} reps
                      {ex.muscle_group ? ` · ${ex.muscle_group}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.exerciseDelete}
                    onPress={() => {
                      Alert.alert(
                        'Delete Exercise',
                        `Remove "${ex.exercise_name}" from ${day.day_name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteExercise(ex.exercise_id) },
                        ]
                      );
                    }}
                  >
                    <Trash2 size={16} color={Colors.pink} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {day.plan_days_id && (
              <TouchableOpacity
                style={styles.addExerciseBtn}
                onPress={() => onOpenAddExercise(day.plan_days_id!)}
              >
                <Plus size={16} color={Colors.accentBlue} />
                <Text style={styles.addExerciseText}>Add Exercise</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.title}>Review Plan</Text>
      <Text style={styles.subtitle}>Make sure everything looks right before activating.</Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Plan Name</Text>
        <Text style={styles.reviewValue}>{planName}</Text>
      </View>

      {planGoal ? (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Goal</Text>
          <Text style={styles.reviewValue}>{planGoal}</Text>
        </View>
      ) : null}

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Schedule</Text>
        <View style={styles.reviewPillRow}>
          <View style={[styles.reviewPill, { backgroundColor: Colors.accentBlue + '15', borderColor: Colors.accentBlue + '40' }]}>
            <Text style={[styles.reviewPillText, { color: Colors.accentBlue }]}>
              {daysPerWeek} days / week
            </Text>
          </View>
          <View style={[styles.reviewPill, { backgroundColor: Colors.teal + '15', borderColor: Colors.teal + '40' }]}>
            <Text style={[styles.reviewPillText, { color: Colors.teal }]}>
              {displayDays.reduce((sum, d) => sum + (d.exercises?.length || 0), 0)} exercises total
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Workout Days</Text>
      {displayDays.map((day) => {
          const dayExercises = day.exercises || [];
          return (
            <View key={day.plan_days_id || day.day_name} style={styles.reviewDayCard}>
              <Text style={styles.reviewDayName}>{day.day_name}</Text>
              {dayExercises.length === 0 ? (
                <TouchableOpacity onPress={() => setStep(2)}>
                  <Text style={styles.reviewAddExerciseLink}>+ Add exercises</Text>
                </TouchableOpacity>
              ) : (
                dayExercises.map((ex) => (
                  <View key={ex.exercise_id} style={styles.reviewExerciseRow}>
                    <Text style={styles.reviewExerciseName} numberOfLines={1}>{ex.exercise_name}</Text>
                    <Text style={styles.reviewExerciseMeta}>{ex.sets}×{ex.reps}</Text>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </View>
    </>
  );

  const renderFooter = () => {
    if (step === 1) {
      return (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: Colors.accentBlue }]}
            onPress={handleCreatePlan}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color={Colors.bg} />
            ) : (
              <Text style={[styles.footerBtnText, { color: Colors.bg }]}>Create Plan</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              { backgroundColor: canProceedStep2 ? Colors.accentBlue : Colors.bgCardBorder },
            ]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setStep(3);
            }}
            disabled={!canProceedStep2}
          >
            <Text
              style={[
                styles.footerBtnText,
                { color: canProceedStep2 ? Colors.bg : Colors.textMuted },
              ]}
            >
              Review Plan
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 3) {
      return (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: Colors.accentBlue }]}
            onPress={confirmActivation}
            disabled={activating}
          >
            {activating ? (
              <ActivityIndicator size="small" color={Colors.bg} />
            ) : (
              <Text style={[styles.footerBtnText, { color: Colors.bg }]}>Activate Plan</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <BackButton
            color={Colors.textPrimary}
            onPress={handleBack}
          />
          <Text style={styles.headerTitle}>Custom Plan</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {renderStepIndicator()}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        {renderFooter()}
      </SafeAreaView>

      {activating && (
        <View style={styles.activatingOverlay}>
          <ActivityIndicator size="large" color={Colors.accentBlue} />
          <Text style={{ color: Colors.textPrimary, marginTop: Spacing.base, fontSize: Typography.base }}>
            Activating plan...
          </Text>
        </View>
      )}
      </View>
    </Modal>
  );
}


