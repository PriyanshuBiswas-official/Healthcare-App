import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface BasicInfoData {
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
}

interface Props {
  initialData?: BasicInfoData;
  onSave: (data: BasicInfoData) => void;
  onBack: () => void;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

function isValidDate(d: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return false;
  const [day, month, year] = d.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) return false;
  const now = new Date();
  if (date > now) return false;
  const age = now.getFullYear() - year - (now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day) ? 1 : 0);
  return age >= 10 && age <= 120;
}

export default function BasicInfoSection({ initialData, onSave, onBack }: Props) {
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.dateOfBirth ?? '');
  const [gender, setGender] = useState(initialData?.gender ?? '');
  const [height, setHeight] = useState(initialData?.height ?? '');
  const [weight, setWeight] = useState(initialData?.weight ?? '');

  const dobValid = dateOfBirth.length > 0 && isValidDate(dateOfBirth);
  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);
  const heightValid = height.length > 0 && !isNaN(heightNum) && heightNum >= 50 && heightNum <= 300;
  const weightValid = weight.length > 0 && !isNaN(weightNum) && weightNum >= 20 && weightNum <= 500;
  const canSave = dobValid && gender.length > 0 && heightValid && weightValid;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Basic Information</Text>
      <Text style={styles.subheading}>Help us personalise your health plan</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={[styles.input, dateOfBirth.length > 0 && !dobValid && styles.inputError]}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={Colors.textMuted}
          value={dateOfBirth}
          onChangeText={(t) => setDateOfBirth(t.replace(/[^0-9/]/g, ''))}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        {dateOfBirth.length > 0 && !dobValid && (
          <Text style={styles.errorText}>Enter a valid date (DD/MM/YYYY, age 10–120)</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, gender === opt && styles.chipActive]}
              onPress={() => setGender(opt)}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, gender === opt && styles.chipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={[styles.input, height.length > 0 && !heightValid && styles.inputError]}
          placeholder="e.g. 175"
          placeholderTextColor={Colors.textMuted}
          value={height}
          onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          maxLength={5}
        />
        {height.length > 0 && !heightValid && (
          <Text style={styles.errorText}>Must be 50–300 cm</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={[styles.input, weight.length > 0 && !weightValid && styles.inputError]}
          placeholder="e.g. 70"
          placeholderTextColor={Colors.textMuted}
          value={weight}
          onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          maxLength={5}
        />
        {weight.length > 0 && !weightValid && (
          <Text style={styles.errorText}>Must be 20–500 kg</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={() => onSave({ dateOfBirth, gender, height, weight })}
          disabled={!canSave}
          activeOpacity={0.8}>
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save and Continue</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: {
    fontSize: Typography.lg,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  field: { marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.base,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  inputError: {
    borderColor: Colors.danger + '80',
  },
  errorText: {
    fontSize: Typography.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.bgCard,
  },
  chipActive: {
    borderColor: Colors.teal,
    backgroundColor: Colors.tealDim,
  },
  chipText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  chipTextActive: { color: Colors.teal },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  backBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
  },
  backText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.teal,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.bg,
  },
  saveTextDisabled: { opacity: 0.6 },
});
