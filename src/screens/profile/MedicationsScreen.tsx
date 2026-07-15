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
} from 'react-native';
import { Colors, Typography, Spacing, Radius, GlassCard } from '../../theme/theme';
import { ArrowLeft } from 'lucide-react-native';
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
  onSaved?: () => void;
}

export default function MedicationsScreen({ onBack, onSaved }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [noMedications, setNoMedications] = useState(false);

  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

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
          setNoMedications(json.data.on_medications === false && meds.length === 0);
        }
      } catch (e) {
        console.warn('[Medications] Fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [session?.access_token]);

  const addMedication = () => {
    if (!newName.trim()) return;
    setMedications(prev => [
      ...prev,
      {
        name: newName.trim(),
        dosage: newDosage.trim(),
        frequency: newFrequency.trim(),
        startDate: newStart.trim(),
        endDate: newEnd.trim(),
      },
    ]);
    setNewName('');
    setNewDosage('');
    setNewFrequency('');
    setNewStart('');
    setNewEnd('');
  };

  const removeMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!session?.access_token) return;
    if (!noMedications && medications.length === 0) {
      Alert.alert('Validation', 'Add at least one medication or select "Not on any medications"');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ medications, noMedications }),
      });
      const json = await res.json();
      if (json.success) {
        setEditing(false);
        onSaved?.();
        Alert.alert('Saved', 'Medications updated');
      } else {
        Alert.alert('Error', json.message || 'Failed to save');
      }
    } catch (e: any) {
      Alert.alert('Network Error', e.message || 'Unexpected error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.amber} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Medications</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => (editing ? handleSave() : setEditing(true))}
          activeOpacity={0.7}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.amber} />
          ) : (
            <Text style={[styles.editBtnText, editing && styles.editBtnSave]}>
              {editing ? 'Save' : 'Edit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {editing ? (
          <>
            <TouchableOpacity
              style={[styles.noMedsCard, noMedications && styles.noMedsCardSelected]}
              onPress={() => {
                setNoMedications(!noMedications);
                if (!noMedications) setMedications([]);
              }}
              activeOpacity={0.7}>
              <View style={styles.noMedsLeft}>
                <Text style={styles.noMedsIcon}>✅</Text>
                <View>
                  <Text style={[styles.noMedsTitle, noMedications && { color: Colors.amber }]}>
                    Not on any medications
                  </Text>
                  <Text style={styles.noMedsSub}>
                    {noMedications ? 'Selected — you can still add below' : 'Tap if this applies'}
                  </Text>
                </View>
              </View>
              <View style={[styles.check, noMedications && styles.checkSelected]}>
                {noMedications && <Text style={styles.checkMark}>✓</Text>}
              </View>
            </TouchableOpacity>

            {!noMedications && (
              <>
                {medications.length > 0 && (
                  <GlassCardView style={styles.card}>
                    {medications.map((med, i) => (
                      <View key={i}>
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
                          <TouchableOpacity
                            onPress={() => removeMedication(i)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={styles.removeBtn}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        {i < medications.length - 1 && <View style={styles.divider} />}
                      </View>
                    ))}
                  </GlassCardView>
                )}

                <GlassCardView style={styles.card}>
                  <Text style={styles.addTitle}>Add Medication</Text>
                  <TextInput
                    style={styles.input}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Medication name"
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
                      <TextInput
                        style={styles.input}
                        value={newStart}
                        onChangeText={setNewStart}
                        placeholder="Start date"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                    <View style={styles.halfField}>
                      <TextInput
                        style={styles.input}
                        value={newEnd}
                        onChangeText={setNewEnd}
                        placeholder="End date (blank = present)"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.addBtn} onPress={addMedication} activeOpacity={0.7}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </GlassCardView>
              </>
            )}
          </>
        ) : (
          <GlassCardView style={styles.card}>
            {noMedications && medications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💊</Text>
                <Text style={styles.emptyText}>No active medications</Text>
                <Text style={styles.emptySub}>You indicated you are not on any medications</Text>
              </View>
            ) : medications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💊</Text>
                <Text style={styles.emptyText}>No medications recorded</Text>
                <Text style={styles.emptySub}>Tap Edit to add your medications</Text>
              </View>
            ) : (
              medications.map((med, i) => (
                <View key={i}>
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
                  </View>
                  {i < medications.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </GlassCardView>
        )}
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
  backIcon: { fontSize: Typography.lg, color: Colors.textPrimary },
  pageTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  editBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.amber,
  },
  editBtnSave: { color: Colors.success },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 120,
  },
  card: { padding: Spacing.lg, marginBottom: Spacing.lg },
  noMedsCard: {
    ...GlassCard,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noMedsCardSelected: {
    backgroundColor: Colors.amber + '15',
    borderColor: Colors.amber + '40',
  },
  noMedsLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  noMedsIcon: { fontSize: Typography.lg, marginRight: Spacing.md },
  noMedsTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  noMedsSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  checkMark: { fontSize: Typography.sm, color: Colors.bg, fontWeight: Typography.bold },
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
