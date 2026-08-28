import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Typography, Spacing, Radius, Colors } from '../../theme/theme';
import { useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../components/SharedComponents';
import { Search, Plus } from 'lucide-react-native';

export default function AddExerciseScreen({
  onSelectPredefined,
  onCreateCustom,
  onBack,
}: {
  onSelectPredefined: () => void;
  onCreateCustom: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  const styles = useStyles((theme: any) => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingTop: insets.top + Spacing.xl,
      paddingBottom: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.xxl,
      gap: Spacing.lg,
    },
    optionCard: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      padding: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    optionIcon: {
      width: 56,
      height: 56,
      borderRadius: Radius.lg,
      backgroundColor: theme.colors.accentBlueDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionInfo: { flex: 1 },
    optionTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    optionDesc: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      lineHeight: Typography.sm * Typography.lhRelaxed,
    },
    optionArrow: { fontSize: Typography.xl, color: theme.colors.textMuted },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} color={Colors.text} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add Exercise</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={onSelectPredefined}
          activeOpacity={0.7}
        >
          <View style={styles.optionIcon}>
            <Search size={26} color={Colors.accentBlue} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Select Predefined Exercise</Text>
            <Text style={styles.optionDesc}>
              Browse our database of exercises filtered by muscle group and equipment
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={onCreateCustom}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: Colors.tealDim }]}>
            <Plus size={26} color={Colors.teal} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Create Custom Exercise</Text>
            <Text style={styles.optionDesc}>
              Create your own exercise with custom name, equipment, and muscle group settings
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
