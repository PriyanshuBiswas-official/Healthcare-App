import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface Props {
  gender: string;
  initialData?: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  onBack: () => void;
}

function isValidDate(d: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return false;
  const [day, month, year] = d.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) return false;
  const now = new Date();
  if (date > now) return false;
  return true;
}

export default function GenderSpecificSection({ gender, initialData, onSave, onBack }: Props) {
  const isFemale = gender?.toLowerCase() === 'female';

  if (isFemale) {
    return <FemaleSection initialData={initialData} onSave={onSave} onBack={onBack} />;
  }
  return <MaleSection initialData={initialData} onSave={onSave} onBack={onBack} />;
}

function FemaleSection({ initialData, onSave, onBack }: Omit<Props, 'gender'>) {
  const [lastPeriod, setLastPeriod] = useState(initialData?.lastPeriod ?? '');
  const [cycleLength, setCycleLength] = useState(initialData?.cycleLength ?? '');
  const [periodLength, setPeriodLength] = useState(initialData?.periodLength ?? '');
  const [isRegular, setIsRegular] = useState(initialData?.isRegular ?? true);

  const canSave = lastPeriod.length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Cycle Tracking</Text>
      <Text style={styles.subheading}>Help us predict your cycles and fertility windows</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Last Period Start Date</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={Colors.textMuted}
          value={lastPeriod}
          onChangeText={setLastPeriod}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Cycle Length (days)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 28"
          placeholderTextColor={Colors.textMuted}
          value={cycleLength}
          onChangeText={setCycleLength}
          keyboardType="numeric"
          maxLength={3}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Period Length (days)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5"
          placeholderTextColor={Colors.textMuted}
          value={periodLength}
          onChangeText={setPeriodLength}
          keyboardType="numeric"
          maxLength={2}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Is your cycle regular?</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, isRegular && styles.chipActive]}
            onPress={() => setIsRegular(true)}
            activeOpacity={0.7}>
            <Text style={[styles.chipText, isRegular && styles.chipTextActive]}>Regular</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, !isRegular && styles.chipActive]}
            onPress={() => setIsRegular(false)}
            activeOpacity={0.7}>
            <Text style={[styles.chipText, !isRegular && styles.chipTextActive]}>Irregular</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={() => onSave({ lastPeriod, cycleLength, periodLength, isRegular })}
          disabled={!canSave}
          activeOpacity={0.8}>
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save and Continue</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MaleSection({ initialData, onSave, onBack }: Omit<Props, 'gender'>) {
  const [testosteroneLevel, setTestosteroneLevel] = useState(initialData?.testosteroneLevel ?? '');
  const [screeningDate, setScreeningDate] = useState(initialData?.screeningDate ?? '');

  const testNum = parseFloat(testosteroneLevel);
  const testosteroneValid = testosteroneLevel.length === 0 || (!isNaN(testNum) && testNum >= 100 && testNum <= 2000);
  const screeningValid = screeningDate.length === 0 || isValidDate(screeningDate);
  const hasData = testosteroneLevel.length > 0 || screeningDate.length > 0;
  const canSave = hasData && testosteroneValid && screeningValid;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Male Health</Text>
      <Text style={styles.subheading}>Track key health markers</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Testosterone Level (ng/dL)</Text>
        <TextInput
          style={[styles.input, testosteroneLevel.length > 0 && !testosteroneValid && styles.inputError]}
          placeholder="e.g. 600"
          placeholderTextColor={Colors.textMuted}
          value={testosteroneLevel}
          onChangeText={(t) => setTestosteroneLevel(t.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          maxLength={4}
        />
        <Text style={styles.hint}>Normal range: 300–1000 ng/dL</Text>
        {testosteroneLevel.length > 0 && !testosteroneValid && (
          <Text style={styles.errorText}>Must be 100–2000 ng/dL</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Last Prostate Screening Date</Text>
        <TextInput
          style={[styles.input, screeningDate.length > 0 && !screeningValid && styles.inputError]}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={Colors.textMuted}
          value={screeningDate}
          onChangeText={(t) => setScreeningDate(t.replace(/[^0-9/]/g, ''))}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        {screeningDate.length > 0 && !screeningValid && (
          <Text style={styles.errorText}>Enter a valid date (DD/MM/YYYY)</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !hasData && styles.saveBtnDisabled]}
          onPress={() => onSave({ testosteroneLevel, screeningDate })}
          disabled={!hasData}
          activeOpacity={0.8}>
          <Text style={[styles.saveText, !hasData && styles.saveTextDisabled]}>Save and Continue</Text>
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
  hint: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
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
