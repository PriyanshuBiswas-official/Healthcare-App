import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import * as activityService from '../../services/activityService';
import { WorkoutSet } from '../../types/activity';
import { posthog } from '../../config/posthog';
import { markWorkoutLogged } from './FitnessScreen';
import { PREDEFINED_EXERCISES } from '../../data/predefinedExercises';
import ProgressLineChart from '../../components/ProgressLineChart';
import { ChevronDown, Play, Info, Pencil } from 'lucide-react-native';

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
  equipment: string | null;
  muscle_group: string | null;
  exercise_type: string | null;
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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isCompleted = exercise.completed;
  const loggedSets = exercise.logged_sets || [];
  const colors = theme.colors;

  // Look up exercise in predefined list for instructions
  const predefined = PREDEFINED_EXERCISES.find(
    e => e.name.toLowerCase() === exercise.exercise_name.toLowerCase()
  );

  // Progress chart data (real data from backend)
  const [progressData, setProgressData] = useState<{ date: string; value: number }[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    setProgressLoading(true);
    activityService.getExerciseProgress(session.access_token, exercise.exercise_id)
      .then(setProgressData)
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  }, [session?.access_token, exercise.exercise_id]);

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
      weight: '',
      reps: String(exercise.target_reps),
    }));
  });
  const [saving, setSaving] = useState(false);
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

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
      posthog?.capture('workout_logged', {
        set_count: sets.filter(set => (parseFloat(set.weight) || 0) > 0 || (parseInt(set.reps, 10) || 0) > 0).length,
        workout_completed: allCompleted,
      });
      markWorkoutLogged();
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
      markWorkoutLogged();
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

  const styles = useStyles((c: any) => ({
    root: { flex: 1, backgroundColor: c.colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingTop: insets.top + Spacing.lg,
      paddingBottom: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: c.colors.bgCardBorder,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: c.colors.textPrimary },
    headerSub: { fontSize: Typography.sm, color: c.colors.textSecondary, marginTop: 4 },
    completedBadge: {
      backgroundColor: c.colors.teal + '20',
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    completedBadgeText: { fontSize: Typography.xs, color: c.colors.teal, fontWeight: Typography.bold },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.base, paddingBottom: 100 },

    // ── How to Perform ──
    howToCard: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    howToHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    howToTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.colors.textPrimary },
    howToTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
    howToTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.colors.accentBlue + '15',
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      gap: 4,
    },
    howToTagText: { fontSize: Typography.xs, color: c.colors.accentBlue, fontWeight: Typography.semiBold },
    tutorialBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.colors.teal + '15',
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    tutorialBtnText: { fontSize: Typography.sm, color: c.colors.teal, fontWeight: Typography.semiBold },
    instructionsList: { gap: Spacing.sm },
    instructionRow: { flexDirection: 'row', gap: Spacing.sm },
    instructionNum: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.colors.teal + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    instructionNumText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: c.colors.teal },
    instructionText: { flex: 1, fontSize: Typography.sm, color: c.colors.textSecondary, lineHeight: 20 },

    // ── Sets Table ──
    completedBanner: {
      backgroundColor: c.colors.teal + '15',
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.base,
      borderWidth: 1,
      borderColor: c.colors.teal + '30',
    },
    completedBannerText: { fontSize: Typography.base, color: c.colors.teal, fontWeight: Typography.semiBold, textAlign: 'center' },
    setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    setRowEditing: { backgroundColor: c.colors.accentBlue + '10', borderRadius: Radius.sm, padding: Spacing.xs, marginBottom: Spacing.sm },
    setRowHeader: { marginBottom: Spacing.md },
    setHeader: { fontSize: Typography.sm, color: c.colors.textSecondary, fontWeight: Typography.semiBold, textAlign: 'center' },
    setNum: { alignItems: 'center', justifyContent: 'center' },
    setNumText: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.colors.accentBlue },
    setInput: {
      backgroundColor: c.colors.bgCardSolid,
      color: c.colors.textPrimary,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.base,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: c.colors.bgCardBorder,
    },
    setValue: {
      backgroundColor: c.colors.bgCardSolid,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    setValueText: { fontSize: Typography.base, color: c.colors.textPrimary },
    editBtn: { padding: Spacing.xs },
    editBtnText: { fontSize: Typography.sm },
    editSaveBtn: {
      backgroundColor: c.colors.teal,
      borderRadius: Radius.sm,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 4,
    },
    editSaveBtnText: { color: c.colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },
    editCancelBtn: {
      backgroundColor: c.colors.bgCardBorder,
      borderRadius: Radius.sm,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editCancelBtnText: { color: c.colors.textSecondary, fontSize: Typography.sm },

    // ── Footer ──
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.base,
      paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.base,
      backgroundColor: c.colors.bg,
      borderTopWidth: 1,
      borderTopColor: c.colors.bgCardBorder,
    },
    saveBtn: {
      backgroundColor: c.colors.teal,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
  }));

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={onBack} color={colors.textPrimary} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{exercise.exercise_name}</Text>
          {exercise.exercise_type && (
            <Text style={styles.headerSub}>{exercise.exercise_type}</Text>
          )}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ── Progress Chart ── */}
        {progressData.length > 0 && (
          <ProgressLineChart data={progressData} loading={progressLoading} />
        )}

        {/* ── How to Perform ── */}
        {predefined && (
          <View style={styles.howToCard}>
            <TouchableOpacity
              onPress={() => setShowInstructions(!showInstructions)}
              activeOpacity={0.6}
              style={styles.howToHeader}
            >
              <Text style={styles.howToTitle}>How to Perform</Text>
              <View style={{ transform: [{ rotate: showInstructions ? '180deg' : '0deg' }] }}>
                <ChevronDown size={22} color={colors.textPrimary} />
              </View>
            </TouchableOpacity>

            {/* Tags */}
            <View style={styles.howToTags}>
              {exercise.muscle_group && (
                <View style={styles.howToTag}>
                  <Info size={12} color={colors.accentBlue} />
                  <Text style={styles.howToTagText}>{exercise.muscle_group}</Text>
                </View>
              )}
              {exercise.equipment && exercise.equipment !== 'None' && (
                <View style={[styles.howToTag, { backgroundColor: colors.pink + '15' }]}>
                  <Text style={[styles.howToTagText, { color: colors.pink }]}>{exercise.equipment}</Text>
                </View>
              )}
            </View>

            {/* Video Tutorial Button */}
            {predefined.videoUrl && (
              <TouchableOpacity
                style={styles.tutorialBtn}
                onPress={() => Linking.openURL(predefined.videoUrl!)}
                activeOpacity={0.7}
              >
                <Play size={16} color={colors.teal} fill={colors.teal} />
                <Text style={styles.tutorialBtnText}>Watch Tutorial</Text>
              </TouchableOpacity>
            )}

            {/* Instructions */}
            {showInstructions && predefined.instructions && (
              <View style={styles.instructionsList}>
                {predefined.instructions.map((step, i) => (
                  <View key={i} style={styles.instructionRow}>
                    <View style={styles.instructionNum}>
                      <Text style={styles.instructionNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Sets Table ── */}
        <View style={{ marginTop: Spacing.xl }}>
        {isCompleted ? (
          <>
            <View style={styles.completedBanner}>
              <Text style={styles.completedBannerText}>All sets logged for today. Tap a set to edit.</Text>
            </View>

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
                        placeholderTextColor={colors.textMuted}
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
                        placeholderTextColor={colors.textMuted}
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
                        <Pencil size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
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
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 6 }}>
                  <TextInput
                    style={styles.setInput}
                    value={set.reps}
                    onChangeText={(v) => updateSet(i, 'reps', v)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            ))}
          </>
        )}
        </View>
      </ScrollView>

      {/* Save / Done Button */}
      <View style={styles.footer}>
        {isCompleted ? (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.saveBtn, { backgroundColor: colors.teal }]}
            activeOpacity={0.8}>
            <Text style={{ color: colors.bg, fontWeight: Typography.bold, fontSize: Typography.lg }}>
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
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <Text style={{ color: colors.bg, fontWeight: Typography.bold, fontSize: Typography.lg }}>
                Save Sets
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
