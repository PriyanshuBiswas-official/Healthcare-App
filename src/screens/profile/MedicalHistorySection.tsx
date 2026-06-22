import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface Condition { id: string; name: string }
interface Surgery { id: string; name: string; year: string }

interface Props {
  initialData?: { conditions: Condition[]; surgeries: Surgery[] };
  onSave: (data: { conditions: Condition[]; surgeries: Surgery[] }) => void;
  onBack: () => void;
}

let nextId = Date.now();
const uid = () => String(nextId++);

export default function MedicalHistorySection({ initialData, onSave, onBack }: Props) {
  const [conditions, setConditions] = useState<Condition[]>(initialData?.conditions ?? []);
  const [surgeries, setSurgeries] = useState<Surgery[]>(initialData?.surgeries ?? []);
  const [newCondition, setNewCondition] = useState('');
  const [newSurgeryName, setNewSurgeryName] = useState('');
  const [newSurgeryYear, setNewSurgeryYear] = useState('');

  const addCondition = () => {
    if (!newCondition.trim()) return;
    setConditions(prev => [...prev, { id: uid(), name: newCondition.trim() }]);
    setNewCondition('');
  };

  const removeCondition = (id: string) => {
    setConditions(prev => prev.filter(c => c.id !== id));
  };

  const addSurgery = () => {
    if (!newSurgeryName.trim()) return;
    setSurgeries(prev => [...prev, { id: uid(), name: newSurgeryName.trim(), year: newSurgeryYear.trim() }]);
    setNewSurgeryName('');
    setNewSurgeryYear('');
  };

  const removeSurgery = (id: string) => {
    setSurgeries(prev => prev.filter(s => s.id !== id));
  };

  const hasData = conditions.length > 0 || surgeries.length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Medical History</Text>
      <Text style={styles.subheading}>Any conditions or surgeries we should know about?</Text>

      <Text style={styles.sectionTitle}>Conditions</Text>
      {conditions.map(c => (
        <View key={c.id} style={styles.tagRow}>
          <Text style={styles.tagText}>{c.name}</Text>
          <TouchableOpacity onPress={() => removeCondition(c.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Add condition..."
          placeholderTextColor={Colors.textMuted}
          value={newCondition}
          onChangeText={setNewCondition}
          onSubmitEditing={addCondition}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addCondition} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Surgeries</Text>
      {surgeries.map(s => (
        <View key={s.id} style={styles.tagRow}>
          <Text style={styles.tagText}>{s.name}{s.year ? ` (${s.year})` : ''}</Text>
          <TouchableOpacity onPress={() => removeSurgery(s.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 2 }]}
          placeholder="Surgery name"
          placeholderTextColor={Colors.textMuted}
          value={newSurgeryName}
          onChangeText={setNewSurgeryName}
        />
        <TextInput
          style={[styles.input, { flex: 1, marginLeft: Spacing.sm }]}
          placeholder="Year"
          placeholderTextColor={Colors.textMuted}
          value={newSurgeryYear}
          onChangeText={setNewSurgeryYear}
          keyboardType="numeric"
          maxLength={4}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addSurgery} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !hasData && styles.saveBtnDisabled]}
          onPress={() => onSave({ conditions, surgeries })}
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
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  tagText: { fontSize: Typography.sm, color: Colors.textPrimary, flex: 1 },
  removeIcon: { fontSize: 14, color: Colors.danger, marginLeft: Spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.tealDim,
    borderWidth: 1,
    borderColor: Colors.teal + '50',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  addBtnText: { fontSize: 20, color: Colors.teal, fontWeight: Typography.bold },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
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
