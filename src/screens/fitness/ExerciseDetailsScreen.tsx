import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Typography, Spacing, Radius, Colors } from '../../theme/theme';
import { useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';
import { BackButton } from '../../components/SharedComponents';
import * as activityService from '../../services/activityService';
import {
  EQUIPMENT_OPTIONS,
  MUSCLE_GROUP_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  type ExerciseEquipment,
  type MuscleGroup,
  type ExerciseType,
} from '../../types/activity';

interface ExerciseDetailsParams {
  planDayId: number;
  exerciseName?: string;
  equipment?: ExerciseEquipment;
  muscleGroup?: MuscleGroup;
  otherMuscles?: MuscleGroup[];
  exerciseType?: ExerciseType;
}

type PickerField = 'equipment' | 'muscle_group' | 'other_muscles' | 'exercise_type';

export default function ExerciseDetailsScreen({
  params,
  onBack,
  onExerciseAdded,
}: {
  params: ExerciseDetailsParams;
  onBack: () => void;
  onExerciseAdded?: () => void;
}) {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(params.exerciseName || '');
  const [equipment, setEquipment] = useState<ExerciseEquipment>(params.equipment || 'None');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(params.muscleGroup || null);
  const [otherMuscles, setOtherMuscles] = useState<MuscleGroup[]>(params.otherMuscles || []);
  const [exerciseType, setExerciseType] = useState<ExerciseType | null>(params.exerciseType || null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [saving, setSaving] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<PickerField | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const searchRef = useRef<TextInput>(null);

  const openPicker = (field: PickerField) => {
    setPickerField(field);
    setPickerSearch('');
    setPickerVisible(true);

  };

  const getPickerOptions = useCallback(() => {
    if (!pickerField) return [];
    if (pickerField === 'equipment') return [...EQUIPMENT_OPTIONS];
    if (pickerField === 'exercise_type') return [...EXERCISE_TYPE_OPTIONS];
    if (pickerField === 'muscle_group' || pickerField === 'other_muscles') return [...MUSCLE_GROUP_OPTIONS];
    return [];
  }, [pickerField]);

  const filteredOptions = getPickerOptions().filter(opt =>
    opt.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const handlePickerSelect = (value: string) => {
    if (pickerField === 'equipment') setEquipment(value as ExerciseEquipment);
    else if (pickerField === 'muscle_group') setMuscleGroup(value as MuscleGroup);
    else if (pickerField === 'exercise_type') setExerciseType(value as ExerciseType);
    else if (pickerField === 'other_muscles') {
      setOtherMuscles(prev =>
        prev.includes(value as MuscleGroup)
          ? prev.filter(m => m !== value)
          : [...prev, value as MuscleGroup]
      );
      return;
    }
    setPickerVisible(false);
  };

  const handleSave = async () => {
    if (!session?.access_token) return;
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an exercise name.');
      return;
    }
    if (!muscleGroup) {
      Alert.alert('Required', 'Please select a primary muscle group.');
      return;
    }
    if (!exerciseType) {
      Alert.alert('Required', 'Please select an exercise type.');
      return;
    }

    setSaving(true);
    try {
      await activityService.addExerciseToDay(session.access_token, {
        plan_day_id: params.planDayId,
        exercise_name: name.trim(),
        sets: parseInt(sets, 10) || 3,
        reps: parseInt(reps, 10) || 10,
        equipment,
        muscle_group: muscleGroup,
        other_muscles: otherMuscles.length > 0 ? otherMuscles : undefined,
        exercise_type: exerciseType,
      });
      if (onExerciseAdded) {
        onExerciseAdded();
      } else {
        onBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add exercise.');
    } finally {
      setSaving(false);
    }
  };

  const getPickerTitle = () => {
    if (pickerField === 'equipment') return 'Select Equipment';
    if (pickerField === 'muscle_group') return 'Select Muscle Group';
    if (pickerField === 'other_muscles') return 'Select Other Muscles';
    if (pickerField === 'exercise_type') return 'Select Exercise Type';
    return '';
  };

  const styles = useStyles((theme: any) => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingTop: insets.top + Spacing.xl,
      paddingBottom: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.xl, paddingBottom: insets.bottom + 100 },
    fieldGroup: { marginBottom: Spacing.xl },
    fieldLabel: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginBottom: Spacing.sm, fontWeight: Typography.semiBold },
    fieldInput: {
      backgroundColor: theme.colors.bgCardSolid,
      color: theme.colors.textPrimary,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      fontSize: Typography.base,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    pickerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.bgCardSolid,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    pickerValue: { fontSize: Typography.base, color: theme.colors.textPrimary },
    pickerPlaceholder: { fontSize: Typography.base, color: theme.colors.textMuted },
    pickerArrow: { fontSize: Typography.lg, color: theme.colors.textMuted },
    selectedBadge: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.accentBlueDim,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      gap: Spacing.xs,
    },
    badgeText: { fontSize: Typography.xs, color: theme.colors.accentBlue, fontWeight: Typography.semiBold },
    badgeRemove: { fontSize: Typography.sm, color: theme.colors.accentBlue },
    setsRow: { flexDirection: 'row', gap: Spacing.md },
    setsField: { flex: 1 },
    footer: {
      paddingHorizontal: Spacing.base,
      paddingBottom: insets.bottom + Spacing.base,
      paddingTop: Spacing.md,
    },
    saveBtn: {
      backgroundColor: theme.colors.accentBlue,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      opacity: 1,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: theme.colors.bg, fontWeight: Typography.bold, fontSize: Typography.base },
    // Picker modal styles
    pickerOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlayHeavy,
      justifyContent: 'flex-end',
    },
    pickerSheet: {
      backgroundColor: theme.colors.modalBg,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      maxHeight: '80%',
      paddingBottom: Spacing.base,
    },
    pickerHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.bgCardBorder,
      alignSelf: 'center',
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    pickerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    pickerDone: {
      fontSize: Typography.sm,
      color: theme.colors.accentBlue,
      fontWeight: Typography.bold,
      backgroundColor: theme.colors.accentBlueDim,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.xs + 2,
      borderRadius: Radius.sm,
      overflow: 'hidden',
    },
    pickerSearchContainer: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    pickerSearch: {
      backgroundColor: theme.colors.bgCardSolid,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm + 2,
      fontSize: Typography.base,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md + 4,
    },
    pickerItemSelected: {
      backgroundColor: theme.colors.accentBlueDim,
    },
    pickerItemText: { flex: 1, fontSize: Typography.base, color: theme.colors.textPrimary, fontWeight: Typography.medium },
    pickerItemSelectedText: { color: theme.colors.accentBlue, fontWeight: Typography.semiBold },
    pickerItemDivider: {
      height: 1,
      backgroundColor: theme.colors.textMuted + '50',
      marginHorizontal: Spacing.xl,
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} color={Colors.text} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Exercise Details</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Exercise Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Exercise Name</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Bench Press"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Equipment */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Equipment</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={() => openPicker('equipment')} activeOpacity={0.7}>
            <Text style={equipment === 'None' ? styles.pickerPlaceholder : styles.pickerValue}>
              {equipment}
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Muscle Group */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Primary Muscle Group</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={() => openPicker('muscle_group')} activeOpacity={0.7}>
            <Text style={muscleGroup ? styles.pickerValue : styles.pickerPlaceholder}>
              {muscleGroup || 'Select'}
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Other Muscles */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Other Muscles (optional)</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={() => openPicker('other_muscles')} activeOpacity={0.7}>
            <Text style={otherMuscles.length > 0 ? styles.pickerValue : styles.pickerPlaceholder}>
              {otherMuscles.length > 0 ? `${otherMuscles.length} selected` : 'Select'}
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>
          {otherMuscles.length > 0 && (
            <View style={styles.selectedBadge}>
              {otherMuscles.map(m => (
                <TouchableOpacity
                  key={m}
                  style={styles.badge}
                  onPress={() => setOtherMuscles(prev => prev.filter(x => x !== m))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.badgeText}>{m}</Text>
                  <Text style={styles.badgeRemove}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Exercise Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Exercise Type</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={() => openPicker('exercise_type')} activeOpacity={0.7}>
            <Text style={exerciseType ? styles.pickerValue : styles.pickerPlaceholder}>
              {exerciseType || 'Select'}
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sets & Reps */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Sets & Reps</Text>
          <View style={styles.setsRow}>
            <View style={styles.setsField}>
              <TextInput
                style={styles.fieldInput}
                value={sets}
                onChangeText={setSets}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor={Colors.textMuted}
                textAlign="center"
              />
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Text style={{ color: Colors.textMuted, fontSize: Typography.lg }}>×</Text>
            </View>
            <View style={styles.setsField}>
              <TextInput
                style={styles.fieldInput}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={Colors.textMuted}
                textAlign="center"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.bg} />
          ) : (
            <Text style={styles.saveBtnText}>Save Exercise</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
          style={styles.pickerOverlay}
        >
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{getPickerTitle()}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} activeOpacity={0.7}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            {pickerField !== 'equipment' && (
              <View style={styles.pickerSearchContainer}>
                <TextInput
                  ref={searchRef}
                  style={styles.pickerSearch}
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                  placeholder="Search..."
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            )}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingTop: Spacing.sm }}
              renderItem={({ item, index }) => {
                const isSelected =
                  (pickerField === 'equipment' && equipment === item) ||
                  (pickerField === 'muscle_group' && muscleGroup === item) ||
                  (pickerField === 'exercise_type' && exerciseType === item) ||
                  (pickerField === 'other_muscles' && otherMuscles.includes(item as MuscleGroup));
                return (
                  <>
                    <TouchableOpacity
                      style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                      onPress={() => handlePickerSelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemSelectedText]}>{item}</Text>
                      {isSelected && <Check size={20} color={Colors.accentBlue} strokeWidth={2.5} />}
                    </TouchableOpacity>
                    {index < filteredOptions.length - 1 && <View style={styles.pickerItemDivider} />}
                  </>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
