import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import { Dumbbell, ChevronRight, Trophy, TrendingUp, Flame, Star, Plus } from 'lucide-react-native';
import { GlassCardView } from '../../../components/SharedComponents';
import type { PersonalRecord } from '../../../types/activity';

interface PersonalRecordsCardProps {
  prs: PersonalRecord[];
  onViewAll?: () => void;
  onLogPR: () => void;
}

export function PersonalRecordsCard({ prs, onViewAll, onLogPR }: PersonalRecordsCardProps) {
  const styles = useStyles((theme: any) => ({
    prHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
    prHeaderTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    prHeaderSubtitle: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: 2 },
    prStatsCard: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.base, marginBottom: Spacing.xl },
    prStatItem: { alignItems: 'center', flex: 1 },
    prStatDivider: { width: 1, backgroundColor: theme.colors.bgCardBorder, marginVertical: Spacing.sm },
    prStatValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary, marginTop: Spacing.xs },
    prStatLabel: { fontSize: Typography.xs, color: theme.colors.textSecondary, marginTop: 2 },
    prSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    prSectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: theme.colors.textPrimary, letterSpacing: Typography.lsWide },
    prSectionAction: { flexDirection: 'row', alignItems: 'center' },
    prSectionActionText: { fontSize: Typography.sm, color: theme.colors.teal, fontWeight: Typography.medium, marginRight: 4 },
    prTimelineContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginVertical: Spacing.md, paddingHorizontal: Spacing.sm, position: 'relative' },
    prTimelineStep: { alignItems: 'center', width: 50, zIndex: 1 },
    prTimelineLine: { position: 'absolute', top: 6, left: 30, right: 30, height: 2, backgroundColor: theme.colors.bgCardBorder, zIndex: 0 },
    prTimelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.textMuted, borderWidth: 2, borderColor: theme.colors.bg, marginBottom: 8 },
    prTimelineDotActive: { width: 16, height: 16, borderRadius: 8, backgroundColor: theme.colors.bg, borderWidth: 3, borderColor: theme.colors.teal, marginBottom: 6, marginTop: -2 },
    prTimelineLabel: { fontSize: Typography.xs, color: theme.colors.textSecondary, textAlign: 'center' },
    prTimelineLabelActive: { color: theme.colors.teal, fontWeight: Typography.bold },
    prTimelineSub: { fontSize: 10, color: theme.colors.textMuted, textAlign: 'center', marginTop: 2 },
    prCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
    prCardIconWrap: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    prCardContent: { flex: 1 },
    prCardTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    prCardSubtitle: { fontSize: Typography.xs, color: theme.colors.textSecondary, marginTop: 2 },
    prCardRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    prCardWeight: { fontSize: Typography.lg, fontWeight: Typography.bold },
    prCardWeightUnit: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginLeft: 2, marginRight: Spacing.sm },
    prCardIncrease: { fontSize: Typography.xs, fontWeight: Typography.bold },
    prCardDate: { fontSize: 10, color: theme.colors.textMuted, marginTop: 4 },
    prLogBtn: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: theme.colors.teal + '40', borderStyle: 'dashed', marginTop: Spacing.sm, backgroundColor: theme.colors.teal + '15' },
    prLogBtnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    prLogBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.colors.teal, marginLeft: 8 },
  }));

  const totalPRs = prs.length;
  const now = new Date();
  const thisMonth = prs.filter(pr => {
    const d = new Date(pr.achieved_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeek = prs.filter(pr => new Date(pr.achieved_at) >= startOfWeek).length;
  const uniqueExercises = new Set(prs.map(pr => pr.exercise_name)).size;

  const prColors = [Colors.teal, '#A855F7', Colors.accentBlue, Colors.amber];

  return (
    <View style={{ marginBottom: Spacing.xl }}>
      <View style={styles.prHeaderRow}>
        <View>
          <Text style={styles.prHeaderTitle}>Personal Records</Text>
          <Text style={styles.prHeaderSubtitle}>Your strongest moments. Keep breaking them.</Text>
        </View>
      </View>

      <GlassCardView style={styles.prStatsCard}>
        <View style={styles.prStatItem}>
          <Trophy size={20} color={Colors.teal} />
          <Text style={styles.prStatValue}>{totalPRs}</Text>
          <Text style={styles.prStatLabel}>Total PRs</Text>
        </View>
        <View style={styles.prStatDivider} />
        <View style={styles.prStatItem}>
          <TrendingUp size={20} color={Colors.accentBlue} />
          <Text style={styles.prStatValue}>{thisMonth}</Text>
          <Text style={styles.prStatLabel}>This Month</Text>
        </View>
        <View style={styles.prStatDivider} />
        <View style={styles.prStatItem}>
          <Flame size={20} color={Colors.amber} />
          <Text style={styles.prStatValue}>{thisWeek}</Text>
          <Text style={styles.prStatLabel}>This Week</Text>
        </View>
        <View style={styles.prStatDivider} />
        <View style={styles.prStatItem}>
          <Star size={20} color={'#A855F7'} />
          <Text style={styles.prStatValue}>{uniqueExercises}</Text>
          <Text style={styles.prStatLabel}>Exercises</Text>
        </View>
      </GlassCardView>

      <View style={styles.prSectionHeader}>
        <Text style={styles.prSectionTitle}>PR Timeline</Text>
        <TouchableOpacity style={styles.prSectionAction} onPress={onViewAll}>
          <Text style={styles.prSectionActionText}>View All</Text>
          <ChevronRight size={16} color={Colors.teal} />
        </TouchableOpacity>
      </View>

      {(() => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthCounts: Record<string, number> = {};
        prs.forEach(pr => {
          const d = new Date(pr.achieved_at);
          const key = monthNames[d.getMonth()];
          monthCounts[key] = (monthCounts[key] || 0) + 1;
        });
        const recentMonths = monthNames.filter(m => monthCounts[m]).slice(-5);
        if (recentMonths.length === 0) return null;
        const currentMonth = monthNames[now.getMonth()];
        return (
          <View style={styles.prTimelineContainer}>
            <View style={styles.prTimelineLine} />
            {recentMonths.map((m) => {
              const isActive = m === currentMonth;
              return (
                <View key={m} style={styles.prTimelineStep}>
                  <View style={isActive ? styles.prTimelineDotActive : styles.prTimelineDot} />
                  <Text style={isActive ? [styles.prTimelineLabel, styles.prTimelineLabelActive] : styles.prTimelineLabel}>{m}</Text>
                  <Text style={isActive ? [styles.prTimelineSub, styles.prTimelineLabelActive] : styles.prTimelineSub}>{monthCounts[m]} PR{monthCounts[m] > 1 ? 's' : ''}</Text>
                </View>
              );
            })}
          </View>
        );
      })()}

      <View style={[styles.prSectionHeader, { marginTop: Spacing.xl }]}>
        <Text style={styles.prSectionTitle}>Recent PRs</Text>
        {prs.length > 5 && (
          <TouchableOpacity style={styles.prSectionAction} onPress={onViewAll}>
            <Text style={styles.prSectionActionText}>View All</Text>
            <ChevronRight size={16} color={Colors.teal} />
          </TouchableOpacity>
        )}
      </View>

      {prs.length === 0 ? (
        <GlassCardView style={styles.prCard}>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', paddingVertical: Spacing.md }}>
            No PRs logged yet. Tap the button below to log your first one.
          </Text>
        </GlassCardView>
      ) : (
        prs.slice(0, 5).map((pr, idx) => {
          const itemColor = prColors[idx % prColors.length];
          const dateStr = new Date(pr.achieved_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
          return (
            <GlassCardView key={pr.pr_id} style={styles.prCard}>
              <View style={[styles.prCardIconWrap, { backgroundColor: itemColor + '20' }]}>
                <Dumbbell size={20} color={itemColor} />
              </View>
              <View style={styles.prCardContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={styles.prCardTitle}>{pr.exercise_name}</Text>
                </View>
                <Text style={styles.prCardSubtitle}>{pr.reps} Rep Max</Text>
                <View style={styles.prCardRow}>
                  <Text style={[styles.prCardWeight, { color: itemColor }]}>{pr.weight}</Text>
                  <Text style={styles.prCardWeightUnit}>kg</Text>
                </View>
                {pr.description ? (
                  <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 }}>{pr.description}</Text>
                ) : null}
                <Text style={styles.prCardDate}>{dateStr}</Text>
              </View>
            </GlassCardView>
          );
        })
      )}

      <TouchableOpacity style={styles.prLogBtn} activeOpacity={0.7} onPress={onLogPR}>
        <View style={[styles.prLogBtnRow, { marginBottom: 0 }]}>
          <Plus size={16} color={Colors.teal} />
          <Text style={styles.prLogBtnText}>Log a New PR</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
