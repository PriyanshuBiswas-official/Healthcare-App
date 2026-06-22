import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface ContactData {
  name: string;
  phone: string;
  relationship: string;
}

interface Props {
  initialData?: ContactData;
  onSave: (data: ContactData) => void;
  onBack: () => void;
}

const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Other',
];

export default function EmergencyContactSection({ initialData, onSave, onBack }: Props) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [relationship, setRelationship] = useState(initialData?.relationship ?? '');

  const phoneDigits = phone.replace(/[^0-9]/g, '');
  const phoneValid = phoneDigits.length >= 7 && phoneDigits.length <= 15;
  const canSave = name.length > 0 && phoneValid && relationship.length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Emergency Contact</Text>
      <Text style={styles.subheading}>Who should we contact in case of emergency?</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Contact name"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[styles.input, phone.length > 0 && !phoneValid && styles.inputError]}
          placeholder="+91 XXXXX XXXXX"
          placeholderTextColor={Colors.textMuted}
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9+\-\s()]/g, ''))}
          keyboardType="phone-pad"
          maxLength={15}
        />
        {phone.length > 0 && !phoneValid && (
          <Text style={styles.errorText}>Enter a valid phone number (7–15 digits)</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Relationship</Text>
        <View style={styles.chipRow}>
          {RELATIONSHIP_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, relationship === opt && styles.chipActive]}
              onPress={() => setRelationship(relationship === opt ? '' : opt)}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, relationship === opt && styles.chipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={() => onSave({ name, phone, relationship })}
          disabled={!canSave}
          activeOpacity={0.8}>
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save and Continue</Text>
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
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
