import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import * as activityService from '../../../services/activityService';

interface EditExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  session: any;
  exerciseId: number | null;
  exerciseName: string;
  sets: string;
  reps: string;
}

export function EditExerciseModal({ visible, onClose, onSaved, session, exerciseId, exerciseName, sets, reps }: EditExerciseModalProps) {
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

  const [editExName, setEditExName] = useState(exerciseName);
  const [editExSets, setEditExSets] = useState(sets);
  const [editExReps, setEditExReps] = useState(reps);
  const [editExSaving, setEditExSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setEditExName(exerciseName);
      setEditExSets(sets);
      setEditExReps(reps);
    }
  }, [visible, exerciseName, sets, reps]);

  const handleUpdateExercise = async () => {
    if (!session?.access_token || !exerciseId) return;
    if (!editExName.trim()) {
      Alert.alert('Required', 'Please enter an exercise name.');
      return;
    }
    setEditExSaving(true);
    try {
      await activityService.updateExercise(session.access_token, {
        exercise_id: exerciseId,
        exercise_name: editExName.trim(),
        sets: parseInt(editExSets, 10) || 3,
        reps: parseInt(editExReps, 10) || 10,
      });
      onClose();
      onSaved();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update exercise.');
    } finally {
      setEditExSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Exercise', 'Are you sure you want to remove this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!session?.access_token || !exerciseId) return;
          try {
            await activityService.deleteExercise(session.access_token, exerciseId);
            onClose();
            onSaved();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to delete exercise.');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
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

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpdateExercise}
              disabled={editExSaving}
              style={[styles.modalSaveBtn, { backgroundColor: Colors.accentBlue }, editExSaving && { opacity: 0.6 }]}>
              {editExSaving ? (
                <ActivityIndicator size="small" color={Colors.bg} />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleDelete}
            style={{ alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.danger + '30', marginTop: Spacing.md }}>
            <Text style={{ fontSize: Typography.sm, color: Colors.danger, fontWeight: Typography.semiBold }}>Delete this exercise</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
