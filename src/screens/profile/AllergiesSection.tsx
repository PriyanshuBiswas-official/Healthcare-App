import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface Allergy { id: string; name: string; severity: string }

interface Props {
  initialData?: { allergies: Allergy[] };
  onSave: (data: { allergies: Allergy[] }) => void;
  onBack: () => void;
}

const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];

let nextId = Date.now();
const uid = () => String(nextId++);

const SEVERITY_COLORS: Record<string, string> = {
  Mild: Colors.teal,
  Moderate: Colors.amber,
  Severe: Colors.danger,
};

export default function AllergiesSection({ initialData, onSave, onBack }: Props) {
  const [allergies, setAllergies] = useState<Allergy[]>(initialData?.allergies ?? []);
  const [newName, setNewName] = useState('');
  const [newSeverity, setNewSeverity] = useState('Mild');

  const addAllergy = () => {
    if (!newName.trim()) return;
    setAllergies(prev => [
      ...prev,
      { id: uid(), name: newName.trim(), severity: newSeverity },
    ]);
    setNewName('');
    setNewSeverity('Mild');
  };

  const removeAllergy = (id: string) => {
    setAllergies(prev => prev.filter(a => a.id !== id));
  };

  const hasData = allergies.length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Allergies</Text>
      <Text style={styles.subheading}>List any drug or food allergies</Text>

      {allergies.map(a => {
        const sevColor = SEVERITY_COLORS[a.severity] ?? Colors.textMuted;
        return (
          <View key={a.id} style={styles.allergyCard}>
            <View style={styles.allergyInfo}>
              <Text style={styles.allergyName}>{a.name}</Text>
              <View style={[styles.severityBadge, { backgroundColor: sevColor + '20', borderColor: sevColor + '50' }]}>
                <Text style={[styles.severityText, { color: sevColor }]}>{a.severity}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeAllergy(a.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.addField}>
        <Text style={styles.fieldLabel}>Allergy Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Penicillin, Peanuts"
          placeholderTextColor={Colors.textMuted}
          value={newName}
          onChangeText={setNewName}
        />
      </View>

      <Text style={styles.fieldLabel}>Severity</Text>
      <View style={styles.chipRow}>
        {SEVERITY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, newSeverity === opt && styles.chipActive]}
            onPress={() => setNewSeverity(opt)}
            activeOpacity={0.7}>
            <Text style={[styles.chipText, newSeverity === opt && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addAllergy} activeOpacity={0.7}>
        <Text style={styles.addBtnText}>+ Add Allergy</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !hasData && styles.saveBtnDisabled]}
          onPress={() => onSave({ allergies })}
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
  allergyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  allergyInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  allergyName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  severityText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  removeIcon: { fontSize: 14, color: Colors.danger, marginLeft: Spacing.sm },
  addField: { marginBottom: Spacing.md },
  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
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
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  chipTextActive: { color: Colors.teal },
  addBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.teal + '50',
    backgroundColor: Colors.tealDim,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  addBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.teal,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm },
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
  },
});
