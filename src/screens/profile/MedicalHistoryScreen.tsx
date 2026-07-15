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

const MEDICAL_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'PCOS',
  'Thyroid Disorder',
  'Asthma',
  'Heart Condition',
  'Other',
  'None',
];

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

export default function MedicalHistoryScreen({ onBack, onSaved }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [otherCondition, setOtherCondition] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.access_token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const raw = json.data.medical_conditions || json.data.conditions || '';
          const parsed = typeof raw === 'string'
            ? raw.split(',').map((s: string) => s.trim()).filter(Boolean)
            : Array.isArray(raw) ? raw : [];
          setConditions(parsed);
        }
      } catch (e) {
        console.warn('[MedicalHistory] Fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [session?.access_token]);

  const toggleCondition = (value: string) => {
    setConditions(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value],
    );
  };

  const handleSave = async () => {
    if (!session?.access_token) return;
    if (conditions.length === 0) {
      Alert.alert('Validation', 'Please select at least one option');
      return;
    }
    if (conditions.includes('Other') && !otherCondition.trim()) {
      Alert.alert('Validation', 'Please specify your condition');
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
        body: JSON.stringify({ medicalConditions: conditions }),
      });
      const json = await res.json();
      if (json.success) {
        setEditing(false);
        onSaved?.();
        Alert.alert('Saved', 'Medical history updated');
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
          <ActivityIndicator size="large" color={Colors.pink} />
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
        <Text style={styles.pageTitle}>Medical History</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => (editing ? handleSave() : setEditing(true))}
          activeOpacity={0.7}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.pink} />
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
        <Text style={styles.sectionSub}>
          {editing ? 'Tap to select your conditions' : 'Your recorded conditions'}
        </Text>

        {editing ? (
          <GlassCardView style={styles.card}>
            <View style={styles.chipGrid}>
              {MEDICAL_CONDITIONS.map(opt => {
                const isSelected = conditions.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleCondition(opt)}
                    activeOpacity={0.7}>
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {conditions.includes('Other') && (
              <TextInput
                style={[styles.input, { marginTop: Spacing.md }]}
                value={otherCondition}
                onChangeText={setOtherCondition}
                placeholder="Specify other condition"
                placeholderTextColor={Colors.textMuted}
              />
            )}
          </GlassCardView>
        ) : (
          <GlassCardView style={styles.card}>
            {conditions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No conditions recorded</Text>
                <Text style={styles.emptySub}>Tap Edit to add your medical conditions</Text>
              </View>
            ) : (
              conditions.map((condition, i) => (
                <View key={i}>
                  <View style={styles.conditionRow}>
                    <View style={[styles.conditionDot, { backgroundColor: Colors.pink }]} />
                    <Text style={styles.conditionText}>{condition}</Text>
                  </View>
                  {i < conditions.length - 1 && <View style={styles.divider} />}
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
    color: Colors.pink,
  },
  editBtnSave: { color: Colors.success },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 120,
  },
  sectionSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  card: { padding: Spacing.lg, marginBottom: Spacing.lg },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  chipSelected: {
    backgroundColor: Colors.pink + '20',
    borderColor: Colors.pink + '60',
  },
  chipText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
  chipTextSelected: { color: Colors.pink },
  input: {
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
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
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  conditionText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});
