import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import { Dumbbell, ChevronRight, Trophy, Calendar, Flame, Star, Plus } from 'lucide-react-native';
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
    prTimelineLabel: { fontSize: Typography.xs, fontWeight: Typography.semiBold, color: theme.colors.textSecondary, textAlign: 'center' },
    prTimelineLabelActive: { color: theme.colors.teal, fontWeight: Typography.bold },
    prTimelineSub: { fontSize: 11, fontWeight: Typography.medium, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 2 },
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
    prEmptyCard: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
    prEmptyTitle: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: theme.colors.textPrimary, textAlign: 'center' },
    prEmptySub: { fontSize: Typography.xs, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 16 },
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
          <Calendar size={20} color={Colors.accentBlue} />
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
        if (prs.length === 0) {
          return (
            <View style={styles.prTimelineContainer}>
              <View style={styles.prTimelineLine} />
            </View>
          );
        }

        // 1. Filter PRs within 365 days window
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const activePRs = prs
          .filter(pr => new Date(pr.achieved_at) >= oneYearAgo)
          .sort((a, b) => new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime());

        if (activePRs.length === 0) return null;

        // 2. Assess month span across active PRs
        const uniqueMonthKeys = new Set(
          activePRs.map(pr => {
            const d = new Date(pr.achieved_at);
            return `${d.getFullYear()}-${d.getMonth()}`;
          })
        );
        const monthsSpanned = uniqueMonthKeys.size;
        const currentYear = now.getFullYear();

        interface TimelineNode {
          id: string;
          label: string;
          sub: string;
          isLatest: boolean;
        }

        let nodes: TimelineNode[] = [];

        // MODE 1: Daily / Date Mode (sparse data <= 6 PRs OR all PRs in 1 month)
        if (activePRs.length <= 6 || monthsSpanned === 1) {
          const groupedByDate: Record<string, PersonalRecord[]> = {};
          activePRs.forEach(pr => {
            const dStr = pr.achieved_at.slice(0, 10);
            if (!groupedByDate[dStr]) groupedByDate[dStr] = [];
            groupedByDate[dStr].push(pr);
          });

          const sortedDates = Object.keys(groupedByDate).sort().slice(-6);
          nodes = sortedDates.map(dStr => {
            const items = groupedByDate[dStr];
            const d = new Date(dStr + 'T12:00:00Z');
            const label = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
            const sub = `${items.length} PR${items.length > 1 ? 's' : ''}`;

            return { id: dStr, label, sub, isLatest: false };
          });
        }
        // MODE 2: Weekly Mode (2 to 3 months spanned)
        else if (monthsSpanned <= 3) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const groupedByWeek: Record<string, { label: string; count: number }> = {};

          activePRs.forEach(pr => {
            const d = new Date(pr.achieved_at);
            const weekNum = Math.ceil(d.getDate() / 7);
            const key = `${d.getFullYear()}-${d.getMonth()}-W${weekNum}`;
            const label = `${monthNames[d.getMonth()]} W${weekNum}`;
            if (!groupedByWeek[key]) {
              groupedByWeek[key] = { label, count: 0 };
            }
            groupedByWeek[key].count += 1;
          });

          const sortedWeekKeys = Object.keys(groupedByWeek).sort().slice(-6);
          nodes = sortedWeekKeys.map(k => ({
            id: k,
            label: groupedByWeek[k].label,
            sub: `${groupedByWeek[k].count} PR${groupedByWeek[k].count > 1 ? 's' : ''}`,
            isLatest: false,
          }));
        }
        // MODE 3: Monthly Mode (4+ months spanned)
        else {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const groupedByMonth: Record<string, { label: string; count: number }> = {};

          activePRs.forEach(pr => {
            const d = new Date(pr.achieved_at);
            const year = d.getFullYear();
            const key = `${year}-${String(d.getMonth()).padStart(2, '0')}`;
            const monthStr = monthNames[d.getMonth()];
            const label = year !== currentYear ? `${monthStr} '${String(year).slice(-2)}` : monthStr;

            if (!groupedByMonth[key]) {
              groupedByMonth[key] = { label, count: 0 };
            }
            groupedByMonth[key].count += 1;
          });

          const sortedMonthKeys = Object.keys(groupedByMonth).sort().slice(-6);
          nodes = sortedMonthKeys.map(k => ({
            id: k,
            label: groupedByMonth[k].label,
            sub: `${groupedByMonth[k].count} PR${groupedByMonth[k].count > 1 ? 's' : ''}`,
            isLatest: false,
          }));
        }

        if (nodes.length > 0) {
          nodes[nodes.length - 1].isLatest = true;
        }

        return (
          <View style={styles.prTimelineContainer}>
            <View style={styles.prTimelineLine} />
            {nodes.map(node => (
              <View key={node.id} style={styles.prTimelineStep}>
                <View style={node.isLatest ? styles.prTimelineDotActive : styles.prTimelineDot} />
                <Text
                  style={
                    node.isLatest
                      ? [styles.prTimelineLabel, styles.prTimelineLabelActive]
                      : styles.prTimelineLabel
                  }
                >
                  {node.label}
                </Text>
                <Text
                  style={
                    node.isLatest
                      ? [styles.prTimelineSub, styles.prTimelineLabelActive]
                      : styles.prTimelineSub
                  }
                >
                  {node.sub}
                </Text>
              </View>
            ))}
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
        <GlassCardView style={styles.prEmptyCard}>
          <Trophy size={28} color={Colors.textMuted} />
          <Text style={[styles.prEmptyTitle, { marginTop: Spacing.sm }]}>No PRs logged yet</Text>
          <Text style={styles.prEmptySub}>Tap the button below to log your first one.</Text>
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
