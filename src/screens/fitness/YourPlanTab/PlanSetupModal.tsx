import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import * as activityService from '../../../services/activityService';
import type { PlanDayInput } from '../../../services/activityService';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface PlanSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  session: any;
}

export function PlanSetupModal({ visible, onClose, onSaved, session }: PlanSetupModalProps) {
  const styles = useStyles((theme: any) => ({
    modalOverlay: { flex: 1, backgroundColor: theme.colors.overlayHeavy, justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: theme.colors.modalBg,
      borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
      padding: Spacing.xl, paddingBottom: 40,
      borderWidth: 1, borderColor: theme.colors.bgCardBorder,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.textMuted, alignSelf: 'center', marginBottom: Spacing.lg },
    modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary, marginBottom: Spacing.xs },
    modalLabel: { fontSize: Typography.sm, color: theme.colors.textSecondary, fontWeight: Typography.medium, marginBottom: Spacing.sm, marginTop: Spacing.md },
    modalInput: {
      backgroundColor: theme.colors.bgCard, borderWidth: 1, borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.md, padding: Spacing.md, color: theme.colors.textPrimary, fontSize: Typography.base,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.xl },
    modalCancelBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, borderWidth: 1, borderColor: theme.colors.bgCardBorder },
    modalCancelText: { color: theme.colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semiBold },
    modalSaveBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, backgroundColor: theme.colors.teal, alignItems: 'center', minWidth: 80 },
    modalSaveText: { color: theme.colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },
  }));

  const [planStep, setPlanStep] = useState(1);
  const [planNameInput, setPlanNameInput] = useState('');
  const [planGoal, setPlanGoal] = useState('');
  const [planDaysPerWeek, setPlanDaysPerWeek] = useState('4');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayExercises, setDayExercises] = useState<Record<number, { name: string; sets: string; reps: string; weight: string }[]>>({});
  const [planSaving, setPlanSaving] = useState(false);

  const resetModal = () => {
    setPlanStep(1);
    setPlanNameInput('');
    setPlanGoal('');
    setPlanDaysPerWeek('4');
    setSelectedDays([]);
    setDayExercises({});
    setPlanSaving(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

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

      resetModal();
      onSaved();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create plan.');
    } finally {
      setPlanSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} onPress={handleClose} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.base }}>
            {[1, 2, 3].map(s => (
              <View key={s} style={{ width: planStep === s ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: planStep === s ? Colors.accentBlue : Colors.bgCardBorder }} />
            ))}
          </View>

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
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={handleClose} style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPlanStep(2)} style={styles.modalSaveBtn}>
                  <Text style={styles.modalSaveText}>Next</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

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
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setPlanStep(1)} style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPlanStep(3)} style={styles.modalSaveBtn}>
                  <Text style={styles.modalSaveText}>Next</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

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
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setPlanStep(2)} style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSavePlan}
                  disabled={planSaving}
                  style={[styles.modalSaveBtn, { backgroundColor: Colors.accentBlue }, planSaving && { opacity: 0.6 }]}>
                  {planSaving ? (
                    <ActivityIndicator size="small" color={Colors.bg} />
                  ) : (
                    <Text style={styles.modalSaveText}>Save Plan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
