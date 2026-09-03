import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Typography, Spacing, Radius, Colors } from '../../theme/theme';
import { useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../providers/AuthProvider';
import { BackButton, GlassCardView } from '../../components/SharedComponents';
import { Dumbbell } from 'lucide-react-native';
import * as activityService from '../../services/activityService';
import type { PersonalRecord } from '../../types/activity';

const PR_COLORS = [Colors.teal, '#A855F7', Colors.accentBlue, Colors.amber];

export default function AllPRsScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    setLoading(true);
    activityService.getPersonalRecords(session.access_token)
      .then(setPrs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.access_token]);

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
    scroll: {
      flex: 1,
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.lg,
    },
    prCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: Radius.lg,
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    prIconWrap: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    prContent: { flex: 1 },
    prTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    prSubtitle: { fontSize: Typography.xs, color: theme.colors.textSecondary, marginTop: 2 },
    prWeight: { fontSize: Typography.lg, fontWeight: Typography.bold },
    prWeightUnit: { fontSize: Typography.xs, color: theme.colors.textSecondary, marginLeft: 2 },
    prDate: { fontSize: Typography.xs, color: theme.colors.textSecondary, marginTop: 4 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
    emptyText: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: Spacing.md },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} color={Colors.text} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>All Personal Records</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.teal} />
        </View>
      ) : prs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Dumbbell size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No PRs logged yet.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {prs.map((pr, idx) => {
            const color = PR_COLORS[idx % PR_COLORS.length];
            const dateStr = new Date(pr.achieved_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <View key={pr.pr_id} style={styles.prCard}>
                <View style={[styles.prIconWrap, { backgroundColor: color + '20' }]}>
                  <Dumbbell size={22} color={color} />
                </View>
                <View style={styles.prContent}>
                  <Text style={styles.prTitle}>{pr.exercise_name}</Text>
                  <Text style={styles.prSubtitle}>{pr.reps} Rep Max</Text>
                  {pr.description ? (
                    <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 }}>{pr.description}</Text>
                  ) : null}
                  <Text style={styles.prDate}>{dateStr}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={[styles.prWeight, { color }]}>{pr.weight}</Text>
                  <Text style={styles.prWeightUnit}>kg</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
