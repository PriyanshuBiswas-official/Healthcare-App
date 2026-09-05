import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import * as activityService from '../../../services/activityService';

interface GoalSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  session: any;
  isEditing: boolean;
  existingGoal?: { calorie_burn_goal?: number; exercise_min_goal?: number; steps_goal?: number } | null;
}

export function GoalSetupModal({ visible, onClose, onSaved, session, isEditing, existingGoal }: GoalSetupModalProps) {
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
    modalSubtitle: { fontSize: Typography.sm, color: theme.colors.textMuted, marginBottom: Spacing.lg },
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

  const [goalBurn, setGoalBurn] = useState('400');
  const [goalExercise, setGoalExercise] = useState('60');
  const [goalSteps, setGoalSteps] = useState('10000');
  const [goalSaving, setGoalSaving] = useState(false);

  useEffect(() => {
    if (visible && existingGoal) {
      setGoalBurn(String(existingGoal.calorie_burn_goal || ''));
      setGoalExercise(String(existingGoal.exercise_min_goal || ''));
      setGoalSteps(String(existingGoal.steps_goal || ''));
    } else if (visible) {
      setGoalBurn('400');
      setGoalExercise('60');
      setGoalSteps('10000');
    }
  }, [visible, existingGoal]);

  const handleSaveGoal = async () => {
    if (!session?.access_token) return;
    setGoalSaving(true);
    try {
      await activityService.saveActivityGoal(session.access_token, {
        calorie_burn_goal: parseInt(goalBurn, 10) || 400,
        exercise_min_goal: parseInt(goalExercise, 10) || 60,
        steps_goal: parseInt(goalSteps, 10) || 10000,
      });
      onClose();
      onSaved();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save goal.');
    } finally {
      setGoalSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Activity Goals' : 'Set Activity Goals'}</Text>
          <Text style={styles.modalSubtitle}>
            {isEditing ? 'Update your daily activity targets.' : 'Define your daily targets. You can update these anytime.'}
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

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveGoal}
              disabled={goalSaving}
              style={[styles.modalSaveBtn, goalSaving && { opacity: 0.6 }]}>
              {goalSaving ? (
                <ActivityIndicator size="small" color={Colors.bg} />
              ) : (
                <Text style={styles.modalSaveText}>Save Goals</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
