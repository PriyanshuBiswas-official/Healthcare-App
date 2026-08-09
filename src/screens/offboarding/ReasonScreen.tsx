import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { ArrowLeft } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';

const REASONS = [
  { id: 'expensive', label: 'Too expensive', emoji: '💸' },
  { id: 'not-useful', label: 'Not useful for me', emoji: '🤷' },
  { id: 'alternative', label: 'Found a better alternative', emoji: '🔄' },
  { id: 'privacy', label: 'Privacy concerns', emoji: '🔒' },
  { id: 'unused', label: 'I just don\'t use it anymore', emoji: '👋' },
  { id: 'other', label: 'Other', emoji: '📝' },
];

interface Props {
  onBack: () => void;
  onNext: (reason: string) => void;
  step: number;
  totalSteps: number;
}

export default function ReasonScreen({ onBack, onNext, step, totalSteps }: Props) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

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
    headerCard: {
      padding: Spacing.lg, marginBottom: Spacing.lg, alignItems: 'center',
    },
    headerTitle: {
      fontSize: Typography.xl, fontWeight: Typography.bold, color: t.colors.textPrimary,
      marginBottom: Spacing.xs, textAlign: 'center',
    },
    headerSub: {
      fontSize: Typography.base, color: t.colors.textSecondary, textAlign: 'center',
    },
    reasonCard: {
      padding: Spacing.lg, marginBottom: Spacing.md,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderWidth: 2, borderColor: 'transparent',
    },
    reasonCardSelected: {
      borderColor: t.colors.danger,
      backgroundColor: t.colors.danger + '10',
    },
    reasonLeft: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    },
    reasonEmoji: { fontSize: 24 },
    reasonLabel: {
      fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary,
    },
    reasonIndicator: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2,
      borderColor: t.colors.bgCardBorder, alignItems: 'center', justifyContent: 'center',
    },
    reasonIndicatorSelected: {
      borderColor: t.colors.danger, backgroundColor: t.colors.danger,
    },
    reasonIndicatorDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF',
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

        <GlassCardView style={styles.headerCard}>
          <Text style={styles.headerTitle}>Why are you leaving?</Text>
          <Text style={styles.headerSub}>
            We'd love to know why so we can improve Cureto for everyone.
          </Text>
        </GlassCardView>

        {REASONS.map((reason) => {
          const isSelected = selected === reason.id;
          return (
            <TouchableOpacity
              key={reason.id}
              activeOpacity={0.7}
              onPress={() => setSelected(reason.id)}
            >
              <GlassCardView style={[styles.reasonCard, isSelected && styles.reasonCardSelected]}>
                <View style={styles.reasonLeft}>
                  <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
                  <Text style={styles.reasonLabel}>{reason.label}</Text>
                </View>
                <View style={[styles.reasonIndicator, isSelected && styles.reasonIndicatorSelected]}>
                  {isSelected && <View style={styles.reasonIndicatorDot} />}
                </View>
              </GlassCardView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextBtn, selected ? styles.nextBtnEnabled : styles.nextBtnDisabled]}
        activeOpacity={selected ? 0.7 : 1}
        onPress={() => selected && onNext(selected)}
        disabled={!selected}
      >
        <Text style={[styles.nextBtnText, !selected && styles.nextBtnTextDisabled]}>
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
}
