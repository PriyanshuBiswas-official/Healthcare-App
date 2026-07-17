import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../config/api';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
}

interface Props {
  onBack: () => void;
  onSaved?: (section?: string) => void;
}

function formatDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function parseDateString(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export default function MedicationsScreen({ onBack, onSaved }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('');
  const [newStartDate, setNewStartDate] = useState<Date | null>(null);
  const [newEndDate, setNewEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Inline edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const [editStartDate, setEditStartDate] = useState<Date | null>(null);
  const [editEndDate, setEditEndDate] = useState<Date | null>(null);
  const [showEditStartPicker, setShowEditStartPicker] = useState(false);
  const [showEditEndPicker, setShowEditEndPicker] = useState(false);

  // ── Fetch Profile ───────────────────────────────────────

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.access_token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const meds = json.data.medications || [];
          setMedications(
            meds.map((m: any) => ({
              name: m.name || '',
              dosage: m.dosage || '',
              frequency: m.frequency || '',
              startDate: m.start_date || m.startDate || '',
              endDate: m.end_date || m.endDate || '',
            })),
          );
        }
      } catch (e) {
        console.warn('[Medications] Fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [session?.access_token]);

  // ── Date Picker Handlers ────────────────────────────────

  const onStartChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (selected) setNewStartDate(selected);
  };

  const onEndChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selected) setNewEndDate(selected);
  };

  const onEditStartChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowEditStartPicker(false);
    if (selected) setEditStartDate(selected);
  };

  const onEditEndChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowEditEndPicker(false);
    if (selected) setEditEndDate(selected);
  };

  // ── Save to Backend ─────────────────────────────────────

  const saveToBackend = async (updatedMeds: Medication[], updatedNoMeds: boolean) => {
    if (!session?.access_token) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/api/profile/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ medications: updatedMeds, noMedications: updatedNoMeds }),
      });
      const json = await res.json();
      if (json.success) {
        onSaved?.();
      } else {
        Alert.alert('Error', json.message || 'Failed to save');
      }
    } catch (e: any) {
      Alert.alert('Network Error', e.message || 'Unexpected error');
    } finally {
      setSaving(false);
    }
  };

  // ── Add Medication ──────────────────────────────────────

  const addMedication = async () => {
    if (!newName.trim()) {
      Alert.alert('Required', 'Medication name is required');
      return;
    }
    if (!newStartDate) {
      Alert.alert('Required', 'Start date is required');
      return;
    }
    const updated = [
      ...medications,
      {
        name: newName.trim(),
        dosage: newDosage.trim(),
        frequency: newFrequency.trim(),
        startDate: formatDateStr(newStartDate),
        endDate: newEndDate ? formatDateStr(newEndDate) : '',
      },
    ];
    setMedications(updated);
    setNewName('');
    setNewDosage('');
    setNewFrequency('');
    setNewStartDate(null);
    setNewEndDate(null);
    setShowAddForm(false);
    await saveToBackend(updated, false);
  };

  // ── Inline Edit ─────────────────────────────────────────

  const startInlineEdit = (index: number) => {
    const med = medications[index];
    setEditingIndex(index);
    setEditName(med.name);
    setEditDosage(med.dosage);
    setEditFrequency(med.frequency);
    setEditStartDate(parseDateString(med.startDate));
    setEditEndDate(parseDateString(med.endDate));
  };

  const cancelInlineEdit = () => {
    setEditingIndex(null);
    setEditName('');
    setEditDosage('');
    setEditFrequency('');
    setEditStartDate(null);
    setEditEndDate(null);
  };

  const saveInlineEdit = async () => {
    if (editingIndex === null) return;
    if (!editName.trim()) {
      Alert.alert('Required', 'Medication name is required');
      return;
    }
    if (!editStartDate) {
      Alert.alert('Required', 'Start date is required');
      return;
    }
    const updated = medications.map((med, i) =>
      i === editingIndex
        ? {
            name: editName.trim(),
            dosage: editDosage.trim(),
            frequency: editFrequency.trim(),
            startDate: formatDateStr(editStartDate),
            endDate: editEndDate ? formatDateStr(editEndDate) : '',
          }
        : med,
    );
    setMedications(updated);
    cancelInlineEdit();
    await saveToBackend(updated, false);
  };

  // ── Remove ──────────────────────────────────────────────

  const removeMedication = async (index: number) => {
    const updated = medications.filter((_, i) => i !== index);
    setMedications(updated);
    if (editingIndex === index) cancelInlineEdit();
    await saveToBackend(updated, false);
  };

  // ── Loading ─────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.amber} />
        </View>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Medications</Text>
        <TouchableOpacity
          style={styles.addTopBtn}
          onPress={() => {
            if (showAddForm) {
              setShowAddForm(false);
            } else {
              setEditingIndex(null);
              setShowAddForm(true);
            }
          }}
          activeOpacity={0.7}>
          <Text style={styles.addTopBtnText}>{showAddForm ? '✕' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {/* ── Add Medication Form ── */}
        {showAddForm && (
          <GlassCardView style={styles.card}>
            <Text style={styles.addTitle}>Add Medication</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Medication name *"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInput
                  style={styles.input}
                  value={newDosage}
                  onChangeText={setNewDosage}
                  placeholder="Dosage (e.g. 500mg)"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.halfField}>
                <TextInput
                  style={styles.input}
                  value={newFrequency}
                  onChangeText={setNewFrequency}
                  placeholder="Frequency"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TouchableOpacity style={styles.input} onPress={() => setShowStartPicker(true)} activeOpacity={0.7}>
                  <Text style={newStartDate ? styles.inputText : styles.inputPlaceholder}>
                    {newStartDate ? formatDisplayDate(newStartDate) : 'Start date *'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.halfField}>
                <TouchableOpacity style={styles.input} onPress={() => setShowEndPicker(true)} activeOpacity={0.7}>
                  <Text style={newEndDate ? styles.inputText : styles.inputPlaceholder}>
                    {newEndDate ? formatDisplayDate(newEndDate) : 'End date (optional)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={newStartDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartChange}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={newEndDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndChange}
                minimumDate={newStartDate || undefined}
              />
            )}

            <TouchableOpacity style={styles.addBtn} onPress={addMedication} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </GlassCardView>
        )}

        {/* ── Medications List ── */}
        <GlassCardView style={styles.card}>
          {medications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyText}>No medications recorded</Text>
              <Text style={styles.emptySub}>Tap + Add to add your medications</Text>
            </View>
          ) : (
            medications.map((med, i) => (
              <View key={i}>
                {editingIndex === i ? (
                  // ── Inline Edit ──
                  <View style={styles.inlineEditBlock}>
                    <TextInput
                      style={styles.input}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Medication name *"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <View style={styles.row}>
                      <View style={styles.halfField}>
                        <TextInput
                          style={styles.input}
                          value={editDosage}
                          onChangeText={setEditDosage}
                          placeholder="Dosage"
                          placeholderTextColor={Colors.textMuted}
                        />
                      </View>
                      <View style={styles.halfField}>
                        <TextInput
                          style={styles.input}
                          value={editFrequency}
                          onChangeText={setEditFrequency}
                          placeholder="Frequency"
                          placeholderTextColor={Colors.textMuted}
                        />
                      </View>
                    </View>
                    <View style={styles.row}>
                      <View style={styles.halfField}>
                        <TouchableOpacity style={styles.input} onPress={() => setShowEditStartPicker(true)} activeOpacity={0.7}>
                          <Text style={editStartDate ? styles.inputText : styles.inputPlaceholder}>
                            {editStartDate ? formatDisplayDate(editStartDate) : 'Start date *'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.halfField}>
                        <TouchableOpacity style={styles.input} onPress={() => setShowEditEndPicker(true)} activeOpacity={0.7}>
                          <Text style={editEndDate ? styles.inputText : styles.inputPlaceholder}>
                            {editEndDate ? formatDisplayDate(editEndDate) : 'End date (optional)'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {showEditStartPicker && (
                      <DateTimePicker
                        value={editStartDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onEditStartChange}
                      />
                    )}
                    {showEditEndPicker && (
                      <DateTimePicker
                        value={editEndDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onEditEndChange}
                        minimumDate={editStartDate || undefined}
                      />
                    )}

                    <View style={styles.inlineActions}>
                      <TouchableOpacity style={styles.inlineCancelBtn} onPress={cancelInlineEdit} activeOpacity={0.7}>
                        <Text style={styles.inlineCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.inlineSaveBtn} onPress={saveInlineEdit} activeOpacity={0.7}>
                        <Text style={styles.inlineSaveText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // ── Display Mode ──
                  <View style={styles.medRow}>
                    <View style={styles.medInfo}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDetail}>
                        {med.dosage}{med.frequency ? ` · ${med.frequency}` : ''}
                      </Text>
                      {(med.startDate || med.endDate) && (
                        <Text style={styles.medDate}>
                          {med.startDate}{med.endDate ? ` — ${med.endDate}` : ' — Present'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.medActions}>
                      <TouchableOpacity
                        onPress={() => startInlineEdit(i)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Pencil size={18} color={Colors.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeMedication(i)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.removeBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {i < medications.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </GlassCardView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  addTopBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addTopBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.amber,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 120,
  },
  card: { padding: Spacing.lg, marginBottom: Spacing.lg },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  medInfo: { flex: 1 },
  medName: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  medDetail: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  medDate: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  medActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  removeBtn: {
    fontSize: Typography.md,
    color: Colors.danger,
    padding: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  addTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputText: { fontSize: Typography.base, color: Colors.textPrimary },
  inputPlaceholder: { fontSize: Typography.base, color: Colors.textMuted },
  row: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1 },
  addBtn: {
    backgroundColor: Colors.amber + '20',
    borderWidth: 1,
    borderColor: Colors.amber + '50',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.amber,
  },
  inlineEditBlock: {
    paddingVertical: Spacing.sm,
  },
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  inlineCancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  inlineCancelText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
  },
  inlineSaveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.amber + '20',
    borderWidth: 1,
    borderColor: Colors.amber + '50',
  },
  inlineSaveText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.amber,
  },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: Typography.xxl, marginBottom: Spacing.md },
  emptyText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
