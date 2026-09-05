import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import { Check } from 'lucide-react-native';
import { BackButton } from '../../../components/SharedComponents';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as activityService from '../../../services/activityService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LogPRModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  session: any;
  allPlanExercises: { id: number; name: string }[];
}

export function LogPRModal({ visible, onClose, onSaved, session, allPlanExercises }: LogPRModalProps) {
  const insets = useSafeAreaInsets();
  const styles = useStyles((theme: any) => ({
    prModalOverlay: { flex: 1, backgroundColor: theme.colors.bg },
    prModalHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.base, paddingBottom: Spacing.base,
      borderBottomWidth: 1, borderBottomColor: theme.colors.bgCardBorder,
    },
    prModalHeaderCenter: { flex: 1, alignItems: 'center' },
    prModalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    prModalBody: { flex: 1, padding: Spacing.lg },
    prModalLabel: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: theme.colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
    prModalInput: {
      backgroundColor: theme.colors.bgCard, color: theme.colors.textPrimary, fontSize: Typography.base,
      borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      borderWidth: 1, borderColor: theme.colors.bgCardBorder,
    },
    prModalDateBtn: {
      backgroundColor: theme.colors.bgCard, borderRadius: Radius.md,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      borderWidth: 1, borderColor: theme.colors.bgCardBorder,
    },
    prPickerRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: theme.colors.bgCard, borderRadius: Radius.md,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      borderWidth: 1, borderColor: theme.colors.bgCardBorder,
    },
    prPickerValue: { fontSize: Typography.base, color: theme.colors.textPrimary },
    prPickerPlaceholder: { fontSize: Typography.base, color: theme.colors.textMuted },
    prPickerArrow: { fontSize: Typography.lg, color: theme.colors.textMuted },
    prPickerOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
    prPickerSheet: {
      backgroundColor: theme.colors.bgCardSolid,
      borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
      maxHeight: '80%', paddingBottom: Spacing.base,
    },
    prPickerHandle: {
      width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.bgCardBorder,
      alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm,
    },
    prPickerHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: theme.colors.bgCardBorder,
    },
    prPickerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    prPickerDone: { fontSize: Typography.sm, color: theme.colors.teal, fontWeight: Typography.bold },
    prPickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md + 4 },
    prPickerItemSelected: { backgroundColor: theme.colors.bgCardBorder + '40' },
    prPickerItemText: { flex: 1, fontSize: Typography.base, color: theme.colors.textPrimary, fontWeight: Typography.medium },
    prPickerItemSelectedText: { color: theme.colors.teal, fontWeight: Typography.semiBold },
    prPickerDivider: { height: 1, backgroundColor: theme.colors.bgCardBorder, marginLeft: Spacing.xl },
    prModalFooter: {
      flexDirection: 'row', gap: Spacing.md,
      paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.base,
      borderTopWidth: 1, borderTopColor: theme.colors.bgCardBorder,
    },
  }));

  const [prExerciseId, setPrExerciseId] = useState<number | null>(null);
  const [prWeight, setPrWeight] = useState('');
  const [prReps, setPrReps] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [prDateObj, setPrDateObj] = useState<Date>(new Date());
  const [showPRDatePicker, setShowPRDatePicker] = useState(false);
  const [prSaving, setPrSaving] = useState(false);
  const [exPickerVisible, setExPickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setPrExerciseId(null);
      setPrWeight('');
      setPrReps('');
      setPrDescription('');
      setPrDateObj(new Date());
      setShowPRDatePicker(false);
      setExPickerVisible(false);
    }
  }, [visible]);

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
      onClose();
      onSaved();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to log PR.');
    } finally {
      setPrSaving(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.prModalOverlay}>
          <View style={[styles.prModalHeader, { paddingTop: insets.top + Spacing.sm }]}>
            <BackButton onPress={onClose} color={Colors.textPrimary} />
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
              onPress={onClose}
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

      <Modal visible={exPickerVisible} animationType="slide" transparent>
        <TouchableOpacity activeOpacity={1} onPress={() => setExPickerVisible(false)} style={styles.prPickerOverlay}>
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
    </>
  );
}
