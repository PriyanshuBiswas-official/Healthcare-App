import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { ArrowLeft, Download, FileText, MessageCircle, Activity, User } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';

const DATA_ITEMS = [
  { icon: <User size={20} color="#3B82F6" />, label: 'Profile Information', desc: 'Name, email, medical details' },
  { icon: <Activity size={20} color="#00E5A0" />, label: 'Health Data', desc: 'Vitals, medications, allergies' },
  { icon: <MessageCircle size={20} color="#F59E0B" />, label: 'AI Chat History', desc: 'All your conversations with Cureto AI' },
  { icon: <FileText size={20} color="#8B5CF6" />, label: 'Documents', desc: 'Exported reports and records' },
];

interface Props {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  step: number;
  totalSteps: number;
}

export default function DataExportScreen({ onBack, onNext, onSkip, step, totalSteps }: Props) {
  const { theme } = useTheme();

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
    headerIcon: { marginBottom: Spacing.md },
    headerTitle: {
      fontSize: Typography.xl, fontWeight: Typography.bold, color: t.colors.textPrimary,
      marginBottom: Spacing.xs, textAlign: 'center',
    },
    headerSub: {
      fontSize: Typography.base, color: t.colors.textSecondary, textAlign: 'center',
    },
    dataCard: {
      padding: Spacing.lg, marginBottom: Spacing.md,
    },
    dataRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md,
    },
    dataRowLast: { marginBottom: 0 },
    dataLabel: {
      fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary,
    },
    dataDesc: {
      fontSize: Typography.sm, color: t.colors.textSecondary, marginTop: 2,
    },
    exportBtn: {
      marginTop: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.lg,
      backgroundColor: t.colors.blue + '20', borderWidth: 1, borderColor: t.colors.blue + '40',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    },
    exportBtnText: {
      fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.blue,
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

  const handleExport = () => {
    Alert.alert(
      'Export Requested',
      'Your data export will be prepared and sent to your email within 24 hours. This is a simulated feature for now.',
      [{ text: 'OK' }]
    );
  };

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
          <View style={styles.headerIcon}>
            <Download size={40} color={theme.colors.blue} />
          </View>
          <Text style={styles.headerTitle}>Download your data</Text>
          <Text style={styles.headerSub}>
            Before you go, you can request a copy of all your health data. This is completely optional.
          </Text>
        </GlassCardView>

        <GlassCardView style={styles.dataCard}>
          {DATA_ITEMS.map((item, i) => (
            <View key={item.label} style={[styles.dataRow, i === DATA_ITEMS.length - 1 && styles.dataRowLast]}>
              {item.icon}
              <View>
                <Text style={styles.dataLabel}>{item.label}</Text>
                <Text style={styles.dataDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.exportBtn} activeOpacity={0.7} onPress={handleExport}>
            <Download size={18} color={theme.colors.blue} />
            <Text style={styles.exportBtnText}>Request Data Export</Text>
          </TouchableOpacity>
        </GlassCardView>
      </ScrollView>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.skipBtnBottom} activeOpacity={0.7} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} activeOpacity={0.7} onPress={onNext}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
