import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { ArrowLeft } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';

interface Props {
  onBack: () => void;
  onNext: (feedback: string) => void;
  onSkip: () => void;
  step: number;
  totalSteps: number;
}

export default function FeedbackScreen({ onBack, onNext, onSkip, step, totalSteps }: Props) {
  const { theme } = useTheme();
  const [feedback, setFeedback] = useState('');

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
    skipBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    skipText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textSecondary },
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
    inputCard: {
      padding: Spacing.lg, marginBottom: Spacing.lg,
    },
    textInput: {
      backgroundColor: t.colors.bgCard,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      fontSize: Typography.base,
      color: t.colors.textPrimary,
      minHeight: 160,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: Typography.xs,
      color: t.colors.textMuted,
      textAlign: 'right',
      marginTop: Spacing.xs,
    },
    bottomRow: {
      position: 'absolute', bottom: 40, left: Spacing.base, right: Spacing.base,
      flexDirection: 'row', gap: Spacing.md,
    },
    skipBtnBottom: {
      flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.lg,
      backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.bgCardBorder,
      alignItems: 'center',
    },
    skipBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: t.colors.textSecondary },
    nextBtn: {
      flex: 2, paddingVertical: Spacing.md, borderRadius: Radius.lg,
      backgroundColor: t.colors.danger, alignItems: 'center',
    },
    nextBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#FFFFFF' },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Delete Account</Text>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.progressDot, i === step && styles.progressDotActive]} />
          ))}
        </View>

        <GlassCardView style={styles.headerCard}>
          <Text style={styles.headerTitle}>Help us improve</Text>
          <Text style={styles.headerSub}>
            Your feedback helps us make Cureto better. This is completely optional.
          </Text>
        </GlassCardView>

        <GlassCardView style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="What could we do better?"
            placeholderTextColor={theme.colors.textPlaceholder}
            value={feedback}
            onChangeText={setFeedback}
            maxLength={500}
            multiline
          />
          <Text style={styles.charCount}>{feedback.length}/500</Text>
        </GlassCardView>
      </ScrollView>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.skipBtnBottom} activeOpacity={0.7} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} activeOpacity={0.7} onPress={() => onNext(feedback)}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
