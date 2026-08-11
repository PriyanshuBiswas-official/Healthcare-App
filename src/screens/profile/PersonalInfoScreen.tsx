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
import { GlassCardView, BackButton } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../config/api';

interface ProfileData {
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  date_of_birth?: string;
  blood_group?: string;
}

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PersonalInfoScreen({ onBack, onSaved }: Props) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    pageTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    editBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
      color: t.colors.teal,
    },
    editBtnSave: { color: t.colors.success },
    scroll: {
      paddingHorizontal: Spacing.base,
      paddingBottom: 120,
    },
    card: { padding: Spacing.lg, marginBottom: Spacing.lg },
    field: { marginBottom: Spacing.lg },
    label: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: t.colors.textSecondary,
      marginBottom: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: Typography.lsWide,
    },
    value: {
      fontSize: Typography.md,
      fontWeight: Typography.medium,
      color: t.colors.textPrimary,
    },
    input: {
      backgroundColor: t.colors.bgCardSolid,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: Typography.base,
      color: t.colors.textPrimary,
    },
    genderRow: { flexDirection: 'row', gap: Spacing.sm },
    genderChip: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm + 2,
      borderRadius: Radius.full,
      backgroundColor: t.colors.bgCardSolid,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
    },
    genderChipSelected: {
      backgroundColor: t.colors.teal + '20',
      borderColor: t.colors.teal + '60',
    },
    genderChipText: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: t.colors.textSecondary,
    },
    genderChipTextSelected: { color: t.colors.teal },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    statLabel: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    statInput: {
      backgroundColor: t.colors.bgCardSolid,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: Typography.sm,
      color: t.colors.textPrimary,
      textAlign: 'center',
      marginTop: Spacing.xs,
      width: 70,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: t.colors.divider,
    },
    bloodRow: { flexDirection: 'row', gap: Spacing.sm },
    bloodChip: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm + 2,
      borderRadius: Radius.full,
      backgroundColor: t.colors.bgCardSolid,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
    },
    bloodChipSelected: {
      backgroundColor: t.colors.danger + '20',
      borderColor: t.colors.danger + '60',
    },
    bloodChipText: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: t.colors.textSecondary,
    },
    bloodChipTextSelected: { color: t.colors.danger },
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
            const d: ProfileData = json.data;
            setName(d.name || '');
            setDateOfBirth(d.date_of_birth || '');
            setGender(d.gender || '');
            setHeight(d.height ? String(d.height) : '');
            setWeight(d.weight ? String(d.weight) : '');
            setBloodGroup(d.blood_group || '');
          }
        } catch (e) {
          console.warn('[PersonalInfo] Fetch failed:', e);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    });
    return () => task.cancel();
  }, [session?.access_token]);

  const bmi = (() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) return (w / ((h / 100) ** 2)).toFixed(1);
    return '--';
  })();

  const handleSave = async () => {
    if (!session?.access_token) return;
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          displayName: name.trim(),
          dateOfBirth: dateOfBirth.trim(),
          gender,
          heightCm: height.trim(),
          weightKg: weight.trim(),
          bloodGroup,
          units: 'metric',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditing(false);
        onSaved?.();
        Alert.alert('Saved', 'Personal information updated');
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
          <ActivityIndicator size="large" color={theme.colors.teal} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <BackButton onPress={onBack} color={theme.colors.textPrimary} />
        <Text style={styles.pageTitle}>Personal Information</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => (editing ? handleSave() : setEditing(true))}
          activeOpacity={0.7}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.teal} />
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
        <GlassCardView style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={theme.colors.textMuted}
              />
            ) : (
              <Text style={styles.value}>{name || '--'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{session?.user?.email || '--'}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date of Birth</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textMuted}
              />
            ) : (
              <Text style={styles.value}>{dateOfBirth || '--'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            {editing ? (
              <View style={styles.genderRow}>
                {['male', 'female', 'other'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipSelected]}
                    onPress={() => setGender(g)}>
                    <Text style={[styles.genderChipText, gender === g && styles.genderChipTextSelected]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.value}>{gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '--'}</Text>
            )}
          </View>
        </GlassCardView>

        <GlassCardView style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{height ? `${height} cm` : '--'}</Text>
              <Text style={styles.statLabel}>Height</Text>
              {editing && (
                <TextInput
                  style={styles.statInput}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="cm"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="decimal-pad"
                />
              )}
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weight ? `${weight} kg` : '--'}</Text>
              <Text style={styles.statLabel}>Weight</Text>
              {editing && (
                <TextInput
                  style={styles.statInput}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="kg"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="decimal-pad"
                />
              )}
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bmi}</Text>
              <Text style={styles.statLabel}>BMI</Text>
            </View>
          </View>
        </GlassCardView>

        <GlassCardView style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Blood Group</Text>
            {editing ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bloodRow}>
                {BLOOD_GROUPS.map(bg => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodChip, bloodGroup === bg && styles.bloodChipSelected]}
                    onPress={() => setBloodGroup(bg)}>
                    <Text style={[styles.bloodChipText, bloodGroup === bg && styles.bloodChipTextSelected]}>
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.value}>{bloodGroup || '--'}</Text>
            )}
          </View>
        </GlassCardView>
      </ScrollView>
    </View>
  );
}
