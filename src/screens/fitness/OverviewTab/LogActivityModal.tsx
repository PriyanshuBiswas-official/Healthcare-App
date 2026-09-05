import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import * as activityService from '../../../services/activityService';

interface LogActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  session: any;
  prefilledData?: { distance?: string; activeMin?: string; otherActivity?: string; otherCalories?: string } | null;
}

export function LogActivityModal({ visible, onClose, onSaved, session, prefilledData }: LogActivityModalProps) {
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

  const [logDistance, setLogDistance] = useState(prefilledData?.distance || '');
  const [logActiveMin, setLogActiveMin] = useState(prefilledData?.activeMin || '');
  const [logOtherActivity, setLogOtherActivity] = useState(prefilledData?.otherActivity || '');
  const [logOtherCalories, setLogOtherCalories] = useState(prefilledData?.otherCalories || '');
  const [logSaving, setLogSaving] = useState(false);

  const estimatedSteps = logDistance ? Math.round((parseFloat(logDistance) || 0) * 1312) : 0;

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
      setLogDistance('');
      setLogActiveMin('');
      setLogOtherActivity('');
      setLogOtherCalories('');
      onClose();
      onSaved();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to log activity.');
    } finally {
      setLogSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
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

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogActivity}
              disabled={logSaving}
              style={[styles.modalSaveBtn, logSaving && { opacity: 0.6 }]}>
              {logSaving ? (
                <ActivityIndicator size="small" color={Colors.bg} />
              ) : (
                <Text style={styles.modalSaveText}>Log Activity</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
