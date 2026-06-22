import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface Medication { id: string; name: string; dosage: string; frequency: string }

interface Props {
  initialData?: { medications: Medication[] };
  onSave: (data: { medications: Medication[] }) => void;
  onBack: () => void;
}

const FREQUENCY_OPTIONS = ['Once daily', 'Twice daily', 'Three times daily', 'As needed'];

let nextId = Date.now();
const uid = () => String(nextId++);

export default function MedicationsSection({ initialData, onSave, onBack }: Props) {
  const [medications, setMedications] = useState<Medication[]>(initialData?.medications ?? []);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('');

  const addMedication = () => {
    if (!newName.trim()) return;
    setMedications(prev => [
      ...prev,
      { id: uid(), name: newName.trim(), dosage: newDosage.trim(), frequency: newFrequency },
    ]);
    setNewName('');
    setNewDosage('');
    setNewFrequency('');
  };

  const removeMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const hasData = medications.length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Medications</Text>
      <Text style={styles.subheading}>What medications are you currently taking?</Text>

      {medications.map(m => (
        <View key={m.id} style={styles.medCard}>
          <View style={styles.medInfo}>
            <Text style={styles.medName}>{m.name}</Text>
            <Text style={styles.medDetail}>
              {m.dosage}{m.frequency ? ` · ${m.frequency}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => removeMedication(m.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.addField}>
        <Text style={styles.fieldLabel}>Medication Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Ibuprofen"
          placeholderTextColor={Colors.textMuted}
          value={newName}
          onChangeText={setNewName}
        />
      </View>

      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Dosage</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 200mg"
            placeholderTextColor={Colors.textMuted}
            value={newDosage}
            onChangeText={setNewDosage}
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>Frequency</Text>
      <View style={styles.chipRow}>
        {FREQUENCY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, newFrequency === opt && styles.chipActive]}
            onPress={() => setNewFrequency(newFrequency === opt ? '' : opt)}
            activeOpacity={0.7}>
            <Text style={[styles.chipText, newFrequency === opt && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addMedication} activeOpacity={0.7}>
        <Text style={styles.addBtnText}>+ Add Medication</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !hasData && styles.saveBtnDisabled]}
          onPress={() => onSave({ medications })}
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
  medCard: {
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
  medInfo: { flex: 1 },
  medName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  medDetail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
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
  addRow: { marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  chip: {
    paddingHorizontal: Spacing.md,
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
