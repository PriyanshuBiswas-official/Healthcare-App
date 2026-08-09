import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { ArrowLeft, Check, TriangleAlert } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../config/api';

const COMMON_ALLERGIES = [
  'Penicillin', 'Aspirin', 'Peanuts', 'Shellfish', 'Milk', 'Eggs',
  'Soy', 'Gluten', 'Dust Mites', 'Pollen', 'Pet Dander', 'Latex',
];

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

export default function AllergiesScreen({ onBack, onSaved }: Props) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [noAllergies, setNoAllergies] = useState(false);
  const [customAllergy, setCustomAllergy] = useState('');

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: Radius.md, backgroundColor: t.colors.bgCard,
      borderWidth: 1, borderColor: t.colors.bgCardBorder, alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { fontSize: Typography.lg, color: t.colors.textPrimary },
    pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary },
    editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    editBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.danger },
    editBtnSave: { color: t.colors.success },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    card: { padding: Spacing.lg, marginBottom: Spacing.lg },
    noAllergyCard: {
      backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    noAllergyCardSelected: { backgroundColor: t.colors.danger + '15', borderColor: t.colors.danger + '40' },
    noAllergyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    noAllergyIcon: { fontSize: Typography.lg, marginRight: Spacing.md },
    noAllergyTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary },
    noAllergySub: { fontSize: Typography.xs, color: t.colors.textSecondary, marginTop: 2 },
    check: {
      width: 24, height: 24, borderRadius: 12, borderWidth: 2,
      borderColor: t.colors.bgCardBorder, alignItems: 'center', justifyContent: 'center',
    },
    checkSelected: { backgroundColor: t.colors.danger, borderColor: t.colors.danger },
    checkMark: { fontSize: 14, color: t.colors.bg, fontWeight: Typography.bold },
    sectionTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary, marginBottom: Spacing.md },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    tag: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.danger + '20',
      borderWidth: 1, borderColor: t.colors.danger + '50', borderRadius: Radius.full,
      paddingLeft: Spacing.md, paddingVertical: Spacing.xs + 2,
    },
    tagText: { fontSize: Typography.sm, fontWeight: Typography.medium, color: t.colors.danger },
    tagRemove: { fontSize: Typography.sm, color: t.colors.danger, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: {
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm + 2,
      borderRadius: Radius.full, backgroundColor: t.colors.bgCardSolid,
      borderWidth: 1, borderColor: t.colors.bgCardBorder,
    },
    chipSelected: { backgroundColor: t.colors.danger + '20', borderColor: t.colors.danger + '60' },
    chipText: { fontSize: Typography.sm, fontWeight: Typography.medium, color: t.colors.textSecondary },
    chipTextSelected: { color: t.colors.danger },
    customRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    input: {
      backgroundColor: t.colors.bgCardSolid, borderWidth: 1, borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      fontSize: Typography.base, color: t.colors.textPrimary,
    },
    customAddBtn: {
      backgroundColor: t.colors.danger + '20', borderWidth: 1, borderColor: t.colors.danger + '50',
      borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    },
    customAddBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.danger },
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
    emptyIcon: { fontSize: Typography.xxl, marginBottom: Spacing.md },
    emptyText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary },
    emptySub: { fontSize: Typography.sm, color: t.colors.textSecondary, marginTop: Spacing.xs },
    allergyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
    allergyDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.md },
    allergyText: { fontSize: Typography.base, fontWeight: Typography.medium, color: t.colors.textPrimary },
    divider: { height: 1, backgroundColor: t.colors.divider },
  }));

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.access_token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const raw = json.data.allergies || '';
          const parsed = typeof raw === 'string'
            ? raw.split(',').map((s: string) => s.trim()).filter(Boolean)
            : Array.isArray(raw) ? raw : [];
          setAllergies(parsed);
        }
      } catch (e) {
        console.warn('[Allergies] Fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [session?.access_token]);

  const toggleAllergy = (value: string) => {
    setAllergies(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value],
    );
  };

  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    if (!allergies.includes(customAllergy.trim())) {
      setAllergies(prev => [...prev, customAllergy.trim()]);
    }
    setCustomAllergy('');
  };

  const removeAllergy = (value: string) => {
    setAllergies(prev => prev.filter(a => a !== value));
  };

  const handleSave = async () => {
    if (!session?.access_token) return;
    if (!noAllergies && allergies.length === 0) {
      Alert.alert('Validation', 'Select at least one allergy or choose "No known allergies"');
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
        body: JSON.stringify({ allergies, noAllergies }),
      });
      const json = await res.json();
      if (json.success) {
        setEditing(false);
        onSaved?.();
        Alert.alert('Saved', 'Allergies updated');
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
          <ActivityIndicator size="large" color={theme.colors.danger} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={theme.colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Allergies</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => (editing ? handleSave() : setEditing(true))}
          activeOpacity={0.7}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.danger} />
          ) : (
            <Text style={[styles.editBtnText, editing && styles.editBtnSave]}>
              {editing ? 'Save' : 'Edit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {editing ? (
          <>
            <TouchableOpacity
              style={[styles.noAllergyCard, noAllergies && styles.noAllergyCardSelected]}
              onPress={() => { setNoAllergies(!noAllergies); if (!noAllergies) setAllergies([]); }}
              activeOpacity={0.7}>
              <View style={styles.noAllergyLeft}>
                <Check size={20} color={noAllergies ? theme.colors.danger : theme.colors.teal} />
                <View>
                  <Text style={[styles.noAllergyTitle, noAllergies && { color: theme.colors.danger }]}>
                    No known allergies
                  </Text>
                  <Text style={styles.noAllergySub}>
                    {noAllergies ? 'Selected' : 'Tap if this applies'}
                  </Text>
                </View>
              </View>
              <View style={[styles.check, noAllergies && styles.checkSelected]}>
                {noAllergies && <Text style={styles.checkMark}>✓</Text>}
              </View>
            </TouchableOpacity>

            {!noAllergies && (
              <>
                {allergies.length > 0 && (
                  <GlassCardView style={styles.card}>
                    <Text style={styles.sectionTitle}>Active Allergies</Text>
                    <View style={styles.tagRow}>
                      {allergies.map((a, i) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>{a}</Text>
                          <TouchableOpacity onPress={() => removeAllergy(a)}>
                            <Text style={styles.tagRemove}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </GlassCardView>
                )}

                <GlassCardView style={styles.card}>
                  <Text style={styles.sectionTitle}>Common Allergies</Text>
                  <View style={styles.chipGrid}>
                    {COMMON_ALLERGIES.map(opt => {
                      const isSelected = allergies.includes(opt);
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.chip, isSelected && styles.chipSelected]}
                          onPress={() => toggleAllergy(opt)}
                          activeOpacity={0.7}>
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </GlassCardView>

                <GlassCardView style={styles.card}>
                  <Text style={styles.sectionTitle}>Custom Allergy</Text>
                  <View style={styles.customRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={customAllergy}
                      onChangeText={setCustomAllergy}
                      placeholder="Type an allergy..."
                      placeholderTextColor={theme.colors.textMuted}
                      onSubmitEditing={addCustomAllergy}
                    />
                    <TouchableOpacity style={styles.customAddBtn} onPress={addCustomAllergy} activeOpacity={0.7}>
                      <Text style={styles.customAddBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCardView>
              </>
            )}
          </>
        ) : (
          <GlassCardView style={styles.card}>
            {noAllergies ? (
              <View style={styles.emptyState}>
                <TriangleAlert size={40} color={theme.colors.amber} />
                <Text style={styles.emptyText}>No known allergies</Text>
                <Text style={styles.emptySub}>You indicated you have no known allergies</Text>
              </View>
            ) : allergies.length === 0 ? (
              <View style={styles.emptyState}>
                <TriangleAlert size={40} color={theme.colors.amber} />
                <Text style={styles.emptyText}>No allergies recorded</Text>
                <Text style={styles.emptySub}>Tap Edit to add your allergies</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.sectionTitle}>Active Allergies</Text>
                {allergies.map((a, i) => (
                  <View key={i}>
                    <View style={styles.allergyRow}>
                      <View style={[styles.allergyDot, { backgroundColor: theme.colors.danger }]} />
                      <Text style={styles.allergyText}>{a}</Text>
                    </View>
                    {i < allergies.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            )}
          </GlassCardView>
        )}
      </ScrollView>
    </View>
  );
}
