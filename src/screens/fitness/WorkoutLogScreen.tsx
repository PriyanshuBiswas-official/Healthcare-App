import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { useAuth } from '../../providers/AuthProvider';
import * as activityService from '../../services/activityService';
import { WorkoutSet } from '../../types/activity';

interface SetEntry {
  set_no: number;
  weight: string;
  reps: string;
}

interface WorkoutLogExercise {
  exercise_id: number;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
  completed: boolean;
  logged_sets: WorkoutSet[];
  last_performance: {
    weight: number;
    reps: number;
    completed: boolean;
    sets_completed: number;
    sets_total: number;
  } | null;
}

export default function WorkoutLogScreen({
  exercise,
  onBack,
}: {
  exercise: WorkoutLogExercise;
  onBack: () => void;
}) {
  const { session } = useAuth();
  const isCompleted = exercise.completed;
  const loggedSets = exercise.logged_sets || [];

  const suggestedWeight = exercise.last_performance
    ? exercise.last_performance.completed
      ? (exercise.target_weight && exercise.target_weight > exercise.last_performance.weight
          ? exercise.target_weight
          : exercise.last_performance.weight + 2.5)
      : exercise.last_performance.weight
    : exercise.target_weight || 0;

  const suggestedReps = exercise.last_performance
    ? exercise.last_performance.completed
      ? exercise.target_reps
      : exercise.last_performance.reps
    : exercise.target_reps;

  // In logging mode: pre-fill with suggestions. In edit mode: pre-fill with logged values.
  const [sets, setSets] = useState<SetEntry[]>(() => {
    if (isCompleted && loggedSets.length > 0) {
      return loggedSets.map(s => ({
        set_no: s.set_no,
        weight: String(s.weight || ''),
        reps: String(s.reps || ''),
      }));
    }
    return Array.from({ length: exercise.target_sets }, (_, i) => ({
      set_no: i + 1,
      weight: String(Math.round(suggestedWeight * 10) / 10),
      reps: String(suggestedReps),
    }));
  });
  const [saving, setSaving] = useState(false);
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  // ── Rest Timer ───────────────────────────────────────
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerDisplay, setTimerDisplay] = useState('1:30');
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          const next = prev - 1;
          const m = Math.floor(next / 60);
          const s = next % 60;
          setTimerDisplay(`${m}:${String(s).padStart(2, '0')}`);
          if (next <= 0) {
            setTimerRunning(false);
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  // ── Save new sets (logging mode) ─────────────────────
  const handleSave = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    try {
      let allCompleted = true;
      for (const set of sets) {
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps, 10) || 0;
        if (w > 0 || r > 0) {
          const result = await activityService.logWorkoutSet(session.access_token, {
            exercise_id: exercise.exercise_id,
            set_no: set.set_no,
            weight: w,
            reps: r,
          });
          if (!result.completed) allCompleted = false;
        }
      }
      if (allCompleted) {
        Alert.alert('Exercise Complete', 'All sets logged for today!', [{ text: 'OK', onPress: onBack }]);
      } else {
        onBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to log sets');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit an existing set (edit mode) ─────────────────
  const handleEditSave = async (setId: number) => {
    if (!session?.access_token) return;
    const w = parseFloat(editWeight) || 0;
    const r = parseInt(editReps, 10) || 0;
    if (w <= 0 && r <= 0) {
      Alert.alert('Error', 'Weight or reps must be greater than 0');
      return;
    }
    try {
      await activityService.editWorkoutSet(session.access_token, setId, { weight: w, reps: r });
      setEditingSetId(null);
      onBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to edit set');
    }
  };

  const startEdit = (set: WorkoutSet) => {
    setEditingSetId(set.set_id);
    setEditWeight(String(set.weight || ''));
    setEditReps(String(set.reps || ''));
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: Typography.xl, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{exercise.exercise_name}</Text>
          <Text style={styles.headerSub}>
            Target: {exercise.target_sets}×{exercise.target_reps}
            {exercise.target_weight ? ` @ ${exercise.target_weight}kg` : ''}
          </Text>
        </View>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✅ Done</Text>
          </View>
        )}
      </View>

      {/* Last Performance Hint — only when not completed */}
      {!isCompleted && exercise.last_performance && (
        <View style={styles.lastHint}>
          <Text style={styles.lastHintTitle}>Last Session</Text>
          <Text style={styles.lastHintText}>
            {exercise.last_performance.weight}kg × {exercise.last_performance.reps} ·{' '}
            {exercise.last_performance.sets_completed}/{exercise.last_performance.sets_total} sets
            {exercise.last_performance.completed ? ' ✓' : ''}
          </Text>
          {exercise.last_performance.completed && (
            <Text style={styles.suggestionText}>
              Suggested: {Math.round(suggestedWeight * 10) / 10}kg
            </Text>
          )}
        </View>
      )}

      {/* Sets */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isCompleted ? (
          <>
            {/* Completed banner */}
            <View style={styles.completedBanner}>
              <Text style={styles.completedBannerText}>All sets logged for today. Tap a set to edit.</Text>
            </View>

            {/* Header row for edit mode */}
            <View style={[styles.setRow, styles.setRowHeader]}>
              <Text style={[styles.setHeader, { width: 50 }]}>Set</Text>
              <Text style={[styles.setHeader, { flex: 1, textAlign: 'center' }]}>Weight (kg)</Text>
              <Text style={[styles.setHeader, { flex: 1, textAlign: 'center' }]}>Reps</Text>
              <View style={{ width: 60 }} />
            </View>

            {loggedSets.map(set => {
              const isEditing = editingSetId === set.set_id;
              return (
                <View key={set.set_id} style={[styles.setRow, isEditing && styles.setRowEditing]}>
                  <View style={[styles.setNum, { width: 50 }]}>
                    <Text style={styles.setNumText}>{set.set_no}</Text>
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 6 }}>
                    {isEditing ? (
                      <TextInput
                        style={styles.setInput}
                        value={editWeight}
                        onChangeText={setEditWeight}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                      />
                    ) : (
                      <View style={styles.setValue}>
                        <Text style={styles.setValueText}>{set.weight}kg</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 6 }}>
                    {isEditing ? (
                      <TextInput
                        style={styles.setInput}
                        value={editReps}
                        onChangeText={setEditReps}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                      />
                    ) : (
                      <View style={styles.setValue}>
                        <Text style={styles.setValueText}>{set.reps}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ width: 60, alignItems: 'center' }}>
                    {isEditing ? (
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity onPress={() => handleEditSave(set.set_id)} style={styles.editSaveBtn} activeOpacity={0.7}>
                          <Text style={styles.editSaveBtnText}>✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingSetId(null)} style={styles.editCancelBtn} activeOpacity={0.7}>
                          <Text style={styles.editCancelBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => startEdit(set)} style={styles.editBtn} activeOpacity={0.7}>
                        <Text style={styles.editBtnText}>✏️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            {/* Header row for logging mode */}
            <View style={[styles.setRow, styles.setRowHeader]}>
              <Text style={[styles.setHeader, { width: 50 }]}>Set</Text>
              <Text style={[styles.setHeader, { flex: 1, textAlign: 'center' }]}>Weight (kg)</Text>
              <Text style={[styles.setHeader, { flex: 1, textAlign: 'center' }]}>Reps</Text>
            </View>

            {sets.map((set, i) => (
              <View key={i} style={styles.setRow}>
                <View style={[styles.setNum, { width: 50 }]}>
                  <Text style={styles.setNumText}>{set.set_no}</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 6 }}>
                  <TextInput
                    style={styles.setInput}
                    value={set.weight}
                    onChangeText={(v) => updateSet(i, 'weight', v)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 6 }}>
                  <TextInput
                    style={styles.setInput}
                    value={set.reps}
                    onChangeText={(v) => updateSet(i, 'reps', v)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Rest Timer */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>Rest Timer</Text>
        <Text style={styles.timerDisplay}>{timerDisplay}</Text>
        <View style={styles.timerButtons}>
          {[30, 60, 90, 120].map(sec => (
            <TouchableOpacity
              key={sec}
              onPress={() => {
                setTimerSeconds(sec);
                const m = Math.floor(sec / 60);
                const s = sec % 60;
                setTimerDisplay(`${m}:${String(s).padStart(2, '0')}`);
              }}
              style={[styles.timerPreset, timerSeconds === sec && styles.timerPresetActive]}
              activeOpacity={0.7}>
              <Text style={[styles.timerPresetText, timerSeconds === sec && { color: Colors.bg }]}>{sec}s</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => {
            if (timerRunning) {
              setTimerRunning(false);
              if (intervalRef.current) clearInterval(intervalRef.current);
            } else {
              if (timerSeconds === 0) {
                setTimerSeconds(90);
                setTimerDisplay('1:30');
              }
              setTimerRunning(true);
            }
          }}
          style={[styles.timerToggle, { backgroundColor: timerRunning ? Colors.danger : Colors.teal }]}
          activeOpacity={0.8}>
          <Text style={{ color: Colors.bg, fontWeight: Typography.bold, fontSize: Typography.sm }}>
            {timerRunning ? 'Stop' : 'Start Timer'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Save / Done Button */}
      <View style={styles.footer}>
        {isCompleted ? (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.saveBtn, { backgroundColor: Colors.teal }]}
            activeOpacity={0.8}>
            <Text style={{ color: Colors.bg, fontWeight: Typography.bold, fontSize: Typography.base }}>
              Done
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}
            activeOpacity={0.8}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.bg} />
            ) : (
              <Text style={{ color: Colors.bg, fontWeight: Typography.bold, fontSize: Typography.base }}>
                Save Sets
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCardBorder,
  },
  backBtn: { marginRight: Spacing.md, padding: Spacing.xs },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  headerSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  completedBadge: {
    backgroundColor: Colors.teal + '20',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  completedBadgeText: { fontSize: Typography.xs, color: Colors.teal, fontWeight: Typography.bold },
  lastHint: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.purple + '10',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.purple + '30',
  },
  lastHintTitle: { fontSize: Typography.xs, fontWeight: Typography.semiBold, color: Colors.purple, marginBottom: 4 },
  lastHintText: { fontSize: Typography.sm, color: Colors.textSecondary },
  suggestionText: { fontSize: Typography.sm, color: Colors.teal, fontWeight: Typography.semiBold, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base },
  completedBanner: {
    backgroundColor: Colors.teal + '15',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.teal + '30',
  },
  completedBannerText: { fontSize: Typography.sm, color: Colors.teal, fontWeight: Typography.semiBold, textAlign: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  setRowEditing: {
    backgroundColor: Colors.purple + '10',
    borderRadius: Radius.sm,
    padding: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  setRowHeader: { marginBottom: Spacing.md },
  setHeader: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semiBold, textAlign: 'center' },
  setNum: { alignItems: 'center', justifyContent: 'center' },
  setNumText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.purple },
  setInput: {
    backgroundColor: Colors.bgCardSolid,
    color: Colors.textPrimary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  setValue: {
    backgroundColor: Colors.bgCardSolid,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  setValueText: { fontSize: Typography.sm, color: Colors.textPrimary },
  editBtn: { padding: Spacing.xs },
  editBtnText: { fontSize: Typography.sm },
  editSaveBtn: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.sm,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  editSaveBtnText: { color: Colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },
  editCancelBtn: {
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.sm,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelBtnText: { color: Colors.textSecondary, fontSize: Typography.sm },
  timerSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.bgCardBorder,
  },
  timerLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semiBold, marginBottom: Spacing.xs },
  timerDisplay: { fontSize: 40, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  timerButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  timerPreset: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCardBorder,
  },
  timerPresetActive: { backgroundColor: Colors.purple },
  timerPresetText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semiBold },
  timerToggle: {
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  footer: {
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.bgCardBorder,
  },
  saveBtn: {
    backgroundColor: Colors.teal,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
