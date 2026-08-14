import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { GlassCardView, BackButton } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../config/api';

const DIET_TYPES = [
  { key: 'Non-Vegetarian', label: 'Non-Vegetarian', sub: 'Eats all meat & animal products' },
  { key: 'Vegetarian', label: 'Vegetarian', sub: 'No meat, may eat eggs & dairy' },
  { key: 'Eggetarian', label: 'Eggetarian', sub: 'No meat, eats eggs & dairy' },
  { key: 'Vegan', label: 'Vegan', sub: 'No animal products at all' },
];

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

export default function DietTypeScreen({ onBack, onSaved }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = theme.colors;
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [foodRestrictions, setFoodRestrictions] = useState('');

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl, paddingBottom: Spacing.md,
    },
    pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary },
    editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    editBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.danger },
    editBtnSave: { color: t.colors.success },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    card: { padding: Spacing.lg, marginBottom: Spacing.lg },
    sectionTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary, marginBottom: Spacing.md },
    grid: { gap: Spacing.sm },
    option: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.bgCardSolid,
      borderWidth: 1, borderColor: t.colors.bgCardBorder, borderRadius: Radius.lg,
      padding: Spacing.lg, marginBottom: Spacing.sm,
    },
    optionSelected: { backgroundColor: t.colors.teal + '15', borderColor: t.colors.teal + '60' },
    optionIcon: {
      width: 24, height: 24, borderRadius: 12, borderWidth: 2,
      borderColor: t.colors.bgCardBorder, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
    },
    optionIconSelected: { backgroundColor: t.colors.teal, borderColor: t.colors.teal },
    optionTextWrap: { flex: 1 },
    optionLabel: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary },
    optionSub: { fontSize: Typography.xs, color: t.colors.textSecondary, marginTop: 2 },
    inputLabel: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: t.colors.textSecondary, marginBottom: Spacing.sm },
    input: {
      backgroundColor: t.colors.bgCardSolid, borderWidth: 1, borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      fontSize: Typography.base, color: t.colors.textPrimary, minHeight: 80, textAlignVertical: 'top',
    },
    currentBadge: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.teal + '15',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full,
      alignSelf: 'flex-start', marginBottom: Spacing.md,
    },
    currentBadgeText: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: t.colors.teal },
    currentLabel: { fontSize: Typography.sm, color: t.colors.textSecondary, marginBottom: Spacing.sm },
    currentType: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary, marginBottom: Spacing.lg },
    currentRestrictions: { fontSize: Typography.sm, color: t.colors.textSecondary, lineHeight: 22 },
  }));

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      const fetchProfile = async () => {
        if (!session?.access_token) return;
        try {
          const res = await fetch(`${API_BASE_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const json = await res.json();
          if (json.success && json.data) {
            const raw = json.data as any;
            setSelectedType(raw.diet_type || '');
            setFoodRestrictions(raw.food_restrictions || '');
          }
        } catch (e) {
          console.warn('[DietType] Fetch failed:', e);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    });
    return () => task.cancel();
  }, [session?.access_token]);

  const handleSave = async () => {
    if (!session?.access_token) return;
    if (!selectedType) {
      Alert.alert('Required', 'Please select a diet type');
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
        body: JSON.stringify({
          dietType: selectedType,
          dietaryRestrictions: foodRestrictions.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditing(false);
        onSaved?.();
        Alert.alert('Saved', 'Diet preferences updated');
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
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <BackButton onPress={onBack} color={colors.textPrimary} />
        <Text style={styles.pageTitle}>Diet Type</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => (editing ? handleSave() : setEditing(true))}
          activeOpacity={0.7}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.teal} />
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
            <GlassCardView style={styles.card}>
              <Text style={styles.sectionTitle}>Diet Type</Text>
              <View style={styles.grid}>
                {DIET_TYPES.map(opt => {
                  const isSelected = selectedType === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => setSelectedType(opt.key)}
                      activeOpacity={0.7}>
                      <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                        {isSelected && <Check size={14} color={colors.bg} />}
                      </View>
                      <View style={styles.optionTextWrap}>
                        <Text style={styles.optionLabel}>{opt.label}</Text>
                        <Text style={styles.optionSub}>{opt.sub}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassCardView>

            <GlassCardView style={styles.card}>
              <Text style={styles.inputLabel}>Food Restrictions (optional)</Text>
              <TextInput
                style={styles.input}
                value={foodRestrictions}
                onChangeText={setFoodRestrictions}
                placeholder="e.g. No spicy food, lactose intolerant, gluten-free..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </GlassCardView>
          </>
        ) : (
          <GlassCardView style={styles.card}>
            {!selectedType ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                <Text style={{ fontSize: Typography.base, fontWeight: Typography.semiBold, color: colors.textPrimary, marginBottom: Spacing.xs }}>No diet type set</Text>
                <Text style={{ fontSize: Typography.sm, color: colors.textSecondary }}>Tap Edit to select your diet type</Text>
              </View>
            ) : (
              <>
                <Text style={styles.currentLabel}>Your diet type</Text>
                <Text style={styles.currentType}>{selectedType}</Text>
                {foodRestrictions ? (
                  <>
                    <Text style={styles.currentLabel}>Food restrictions</Text>
                    <Text style={styles.currentRestrictions}>{foodRestrictions}</Text>
                  </>
                ) : null}
              </>
            )}
          </GlassCardView>
        )}
      </ScrollView>
    </View>
  );
}
