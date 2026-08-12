import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { GlassCardView, BackButton } from '../../components/SharedComponents';
import { posthog } from '../../config/posthog';

interface Props {
  onBack: () => void;
  onDelete: () => void;
  step: number;
  totalSteps: number;
}

export default function ConfirmScreen({ onBack, onDelete, step, totalSteps }: Props) {
  const { theme } = useTheme();
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText.toUpperCase() === 'DELETE';

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
    },
    pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    progressRow: {
      flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl,
    },
    progressDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: t.colors.bgCardBorder,
    },
    progressDotActive: {
      backgroundColor: t.colors.danger,
    },
    dangerIcon: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: t.colors.danger + '15', borderWidth: 2, borderColor: t.colors.danger + '30',
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center', marginBottom: Spacing.lg,
    },
    headerTitle: {
      fontSize: Typography.xl, fontWeight: Typography.bold, color: t.colors.textPrimary,
      marginBottom: Spacing.xs, textAlign: 'center',
    },
    headerSub: {
      fontSize: Typography.base, color: t.colors.textSecondary, textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    inputCard: {
      padding: Spacing.lg, marginBottom: Spacing.lg,
    },
    inputLabel: {
      fontSize: Typography.sm, fontWeight: Typography.semiBold, color: t.colors.textSecondary,
      marginBottom: Spacing.sm, textAlign: 'center',
    },
    textInput: {
      backgroundColor: t.colors.bgCard,
      borderWidth: 1,
      borderColor: isConfirmed ? t.colors.danger : t.colors.bgCardBorder,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: isConfirmed ? t.colors.danger : t.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: 2,
    },
    hint: {
      fontSize: Typography.xs, color: t.colors.textMuted, textAlign: 'center',
      marginTop: Spacing.sm,
    },
    deleteBtn: {
      position: 'absolute', bottom: 40, left: Spacing.base, right: Spacing.base,
      paddingVertical: Spacing.md, borderRadius: Radius.lg,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    },
    deleteBtnEnabled: { backgroundColor: t.colors.danger },
    deleteBtnDisabled: { backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.bgCardBorder },
    deleteBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#FFFFFF' },
    deleteBtnTextDisabled: { color: t.colors.textSecondary },
  }));

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'This is a simulated feature. In the future, this will permanently delete your account and all associated data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            posthog?.capture('account_deletion_requested');
            onDelete();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <BackButton onPress={onBack} color={theme.colors.textPrimary} />
        <Text style={styles.pageTitle}>Delete Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.progressDot, i === step && styles.progressDotActive]} />
          ))}
        </View>

        <View style={styles.dangerIcon}>
          <Trash2 size={32} color={theme.colors.danger} />
        </View>

        <Text style={styles.headerTitle}>Final confirmation</Text>
        <Text style={styles.headerSub}>
          Type "DELETE" below to permanently delete your account. This action cannot be undone.
        </Text>

        <GlassCardView style={styles.inputCard}>
          <Text style={styles.inputLabel}>Type DELETE to confirm</Text>
          <TextInput
            style={styles.textInput}
            placeholder="DELETE"
            placeholderTextColor={theme.colors.textPlaceholder}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            {isConfirmed ? '✓ You can now delete your account' : 'Please type DELETE in capital letters'}
          </Text>
        </GlassCardView>
      </ScrollView>

      <TouchableOpacity
        style={[styles.deleteBtn, isConfirmed ? styles.deleteBtnEnabled : styles.deleteBtnDisabled]}
        activeOpacity={isConfirmed ? 0.7 : 1}
        onPress={() => isConfirmed && handleDelete()}
        disabled={!isConfirmed}
      >
        <Trash2 size={18} color={isConfirmed ? '#FFFFFF' : theme.colors.textSecondary} />
        <Text style={[styles.deleteBtnText, !isConfirmed && styles.deleteBtnTextDisabled]}>
          Delete My Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}
