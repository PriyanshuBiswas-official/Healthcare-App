import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { ArrowLeft, TriangleAlert, Check } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';

const CONSEQUENCES = [
  'All your health data will be permanently deleted',
  'Your AI chat history will be erased',
  'Medication and allergy records will be lost',
  'Profile and personal information will be removed',
  'This action cannot be undone',
];

interface Props {
  onBack: () => void;
  onNext: () => void;
  step: number;
  totalSteps: number;
}

export default function WarningScreen({ onBack, onNext, step, totalSteps }: Props) {
  const { theme } = useTheme();
  const [acknowledged, setAcknowledged] = useState(false);

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: Radius.md, backgroundColor: t.colors.bgCard,
      borderWidth: 1, borderColor: t.colors.bgCardBorder, alignItems: 'center', justifyContent: 'center',
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
    warningBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: t.colors.danger + '15', borderWidth: 1, borderColor: t.colors.danger + '30',
      borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
    },
    warningBannerText: {
      flex: 1, fontSize: Typography.base, fontWeight: Typography.semiBold,
      color: t.colors.danger,
    },
    headerTitle: {
      fontSize: Typography.xl, fontWeight: Typography.bold, color: t.colors.textPrimary,
      marginBottom: Spacing.xs, textAlign: 'center',
    },
    headerSub: {
      fontSize: Typography.base, color: t.colors.textSecondary, textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    consequenceCard: {
      padding: Spacing.lg, marginBottom: Spacing.md,
    },
    consequenceItem: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md,
    },
    consequenceItemLast: { marginBottom: 0 },
    consequenceIcon: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: t.colors.danger + '20', alignItems: 'center', justifyContent: 'center',
    },
    consequenceText: {
      flex: 1, fontSize: Typography.base, color: t.colors.textPrimary,
    },
    checkboxRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      marginTop: Spacing.lg, padding: Spacing.lg,
      backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.lg,
    },
    checkbox: {
      width: 24, height: 24, borderRadius: Radius.sm, borderWidth: 2,
      borderColor: t.colors.bgCardBorder, alignItems: 'center', justifyContent: 'center',
    },
    checkboxChecked: {
      borderColor: t.colors.danger, backgroundColor: t.colors.danger,
    },
    checkboxLabel: {
      flex: 1, fontSize: Typography.base, color: t.colors.textPrimary,
    },
    nextBtn: {
      position: 'absolute', bottom: 40, left: Spacing.base, right: Spacing.base,
      paddingVertical: Spacing.md, borderRadius: Radius.lg,
      alignItems: 'center',
    },
    nextBtnEnabled: { backgroundColor: t.colors.danger },
    nextBtnDisabled: { backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.bgCardBorder },
    nextBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#FFFFFF' },
    nextBtnTextDisabled: { color: t.colors.textSecondary },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Delete Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.progressDot, i === step && styles.progressDotActive]} />
          ))}
        </View>

        <View style={styles.warningBanner}>
          <TriangleAlert size={24} color={theme.colors.danger} />
          <Text style={styles.warningBannerText}>This action is permanent and cannot be undone</Text>
        </View>

        <Text style={styles.headerTitle}>What you'll lose</Text>
        <Text style={styles.headerSub}>
          Once your account is deleted, the following data will be permanently removed:
        </Text>

        <GlassCardView style={styles.consequenceCard}>
          {CONSEQUENCES.map((item, i) => (
            <View key={i} style={[styles.consequenceItem, i === CONSEQUENCES.length - 1 && styles.consequenceItemLast]}>
              <View style={styles.consequenceIcon}>
                <TriangleAlert size={12} color={theme.colors.danger} />
              </View>
              <Text style={styles.consequenceText}>{item}</Text>
            </View>
          ))}
        </GlassCardView>

        <TouchableOpacity
          style={styles.checkboxRow}
          activeOpacity={0.7}
          onPress={() => setAcknowledged(!acknowledged)}
        >
          <View style={[styles.checkbox, acknowledged && styles.checkboxChecked]}>
            {acknowledged && <Check size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand that this action is permanent and cannot be reversed
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextBtn, acknowledged ? styles.nextBtnEnabled : styles.nextBtnDisabled]}
        activeOpacity={acknowledged ? 0.7 : 1}
        onPress={() => acknowledged && onNext()}
        disabled={!acknowledged}
      >
        <Text style={[styles.nextBtnText, !acknowledged && styles.nextBtnTextDisabled]}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}
