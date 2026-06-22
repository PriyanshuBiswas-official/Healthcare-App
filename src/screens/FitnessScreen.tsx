import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/theme';
import { GlassCardView, Chip, ProgressBar, ProfileAvatarButton, NotificationIconButton } from '../components/SharedComponents';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';
import { TabName } from '../navigation/TabBar';
import { useAuth } from '../providers/AuthProvider';

const { width } = Dimensions.get('window');

type Segment = 'Today' | 'Weekly' | 'Workouts' | 'PRs';

const SEGMENTS: Segment[] = ['Today', 'Weekly', 'Workouts', 'PRs'];

const ACTIVITY_RINGS = [
  { label: 'Burn', current: 120, target: 400, unit: 'kcal', color: Colors.pink, progress: 0.3 },
  { label: 'Exercise', current: 15, target: 60, unit: 'min', color: Colors.purple, progress: 0.25 },
  { label: 'Steps', current: 6147, target: 10000, unit: 'steps', color: Colors.teal, progress: 0.615 },
];

const VITAL_STATS = [
  { label: 'resting bpm', value: '47' },
  { label: 'peak bpm', value: '142' },
  { label: 'distance', value: '3.2 km' },
];

const MUSCLE_FILTERS = ['All', 'Chest', 'Shoulders', 'Triceps', 'Core'];

const EXERCISES = [
  {
    name: 'Bench Press',
    icon: '🏋️',
    tags: [{ label: 'New', color: Colors.teal }, { label: 'Hypertrophy', color: Colors.purple }],
    sets: ['Set 1: 60kg × 12', 'Set 2: 70kg × 10', 'Set 3: 75kg × 8'],
    topSet: '75kg top set',
    group: 'Chest',
  },
  {
    name: 'Incline DB Press',
    icon: '💪',
    tags: [{ label: 'Hypertrophy', color: Colors.purple }],
    sets: ['Set 1: 22kg × 12', 'Set 2: 24kg × 10'],
    topSet: '24kg top set',
    group: 'Chest',
  },
  {
    name: 'Cable Fly',
    icon: '🔗',
    tags: [{ label: 'Stretching', color: Colors.amber }],
    sets: ['Set 1: 15kg × 15', 'Set 2: 17.5kg × 12'],
    topSet: '17.5kg top set',
    group: 'Chest',
  },
  {
    name: 'Tricep Pushdown',
    icon: '⬇️',
    tags: [{ label: 'Hypertrophy', color: Colors.purple }],
    sets: ['Set 1: 25kg × 15', 'Set 2: 30kg × 12'],
    topSet: '30kg top set',
    group: 'Triceps',
  },
];

const WEEKLY_BARS = [
  { day: 'M', val: 0.45, color: Colors.purple },
  { day: 'T', val: 0.7, color: Colors.purple },
  { day: 'W', val: 0.55, color: Colors.amber },
  { day: 'T', val: 0.85, color: Colors.pink },
  { day: 'F', val: 0.6, color: Colors.purple },
  { day: 'S', val: 0.35, color: Colors.teal },
  { day: 'S', val: 0.2, color: Colors.textMuted },
];

const WEEKLY_STATS = [
  { label: 'sessions', value: '5' },
  { label: 'total time', value: '3.2h' },
  { label: 'kcal burned', value: '1,640' },
  { label: 'total steps', value: '28,400' },
];

const PERSONAL_RECORDS = [
  { exercise: 'Bench Press', date: 'Jan 8', value: '85 kg', delta: '+5kg', color: Colors.teal },
  { exercise: 'Squat', date: 'Jan 5', value: '120 kg', delta: '+10kg', color: Colors.teal },
  { exercise: 'Deadlift', date: 'Dec 28', value: '140 kg', delta: '+7.5kg', color: Colors.teal },
  { exercise: '5K Run', date: 'Dec 20', value: '24:30', delta: '-1:30', color: Colors.amber },
];

const MUSCLE_BALANCE = [
  { muscle: 'Chest', level: 'High', progress: 0.9, color: Colors.pink },
  { muscle: 'Back', level: 'Mid', progress: 0.55, color: Colors.amber },
  { muscle: 'Legs', level: 'Low', progress: 0.25, color: Colors.danger },
  { muscle: 'Shoulders', level: 'Mid', progress: 0.6, color: Colors.amber },
  { muscle: 'Arms', level: 'High', progress: 0.85, color: Colors.pink },
  { muscle: 'Core', level: 'Low', progress: 0.2, color: Colors.danger },
];

const AI_MESSAGES = [
  { text: 'Great volume on bench today! Your RPE looked controlled — keep the same load next session.', color: Colors.purple },
  { text: 'Heart rate peaked at 142 bpm during set 3. Consider a longer rest before your top set.', color: Colors.amber },
];

function SectionLabel({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {action && <Text style={styles.sectionAction}>{action}</Text>}
    </View>
  );
}

function SegmentedControl({
  segments,
  active,
  onChange,
}: {
  segments: Segment[];
  active: Segment;
  onChange: (s: Segment) => void;
}) {
  return (
    <View style={styles.segmented}>
      {segments.map(seg => (
        <TouchableOpacity
          key={seg}
          style={[styles.segmentBtn, active === seg && styles.segmentBtnActive]}
          onPress={() => onChange(seg)}
          activeOpacity={0.8}>
          <Text style={[styles.segmentText, active === seg && styles.segmentTextActive]}>{seg}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ActivityRingsCard() {
  const ringScore = 220;
  return (
    <GlassCardView style={styles.card}>
      <SectionLabel title="ACTIVITY RINGS" />
      <View style={styles.ringsRow}>
        <View style={styles.ringsVisual}>
          <View style={[styles.ringOuter, { borderColor: Colors.pink + '40' }]}>
            <View style={[styles.ringMid, { borderColor: Colors.purple + '50' }]}>
              <View style={[styles.ringInner, { borderColor: Colors.teal + '60' }]}>
                <Text style={styles.ringScore}>{ringScore}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.ringsMetrics}>
          {ACTIVITY_RINGS.map(ring => (
            <View key={ring.label} style={styles.ringMetric}>
              <View style={styles.ringMetricHeader}>
                <Text style={[styles.ringMetricLabel, { color: ring.color }]}>{ring.label}</Text>
                <Text style={styles.ringMetricVal}>
                  {ring.current.toLocaleString()} / {ring.target.toLocaleString()} {ring.unit}
                </Text>
              </View>
              <ProgressBar progress={ring.progress} color={ring.color} height={5} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.vitalRow}>
        {VITAL_STATS.map(v => (
          <View key={v.label} style={styles.vitalPill}>
            <Text style={styles.vitalVal}>{v.value}</Text>
            <Text style={styles.vitalLabel}>{v.label}</Text>
          </View>
        ))}
      </View>
    </GlassCardView>
  );
}

function TodaysWorkout({
  activeFilter,
  setActiveFilter,
}: {
  activeFilter: string;
  setActiveFilter: (f: string) => void;
}) {
  const displayExercises =
    activeFilter === 'All'
      ? EXERCISES
      : EXERCISES.filter(e => e.group === activeFilter);

  return (
    <>
      <SectionLabel title="TODAY'S WORKOUT" action="PUSH DAY" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {MUSCLE_FILTERS.map(g => (
          <Chip key={g} label={g} selected={activeFilter === g} color={Colors.purple} onPress={() => setActiveFilter(g)} />
        ))}
      </ScrollView>
      {displayExercises.map((ex, i) => (
        <GlassCardView key={i} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseIconWrap}>
              <Text style={{ fontSize: 18 }}>{ex.icon}</Text>
            </View>
            <View style={styles.exerciseTitleWrap}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <View style={styles.tagRow}>
                {ex.tags.map(tag => (
                  <View key={tag.label} style={[styles.tag, { backgroundColor: tag.color + '20', borderColor: tag.color + '50' }]}>
                    <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.topSet}>{ex.topSet}</Text>
          </View>
          <View style={styles.setsRow}>
            {ex.sets.map(set => (
              <View key={set} style={styles.setChip}>
                <Text style={styles.setChipText}>{set}</Text>
              </View>
            ))}
          </View>
        </GlassCardView>
      ))}
      <TouchableOpacity style={styles.addExerciseBtn} activeOpacity={0.8}>
        <Text style={styles.addExerciseText}>+ Add exercise</Text>
      </TouchableOpacity>
    </>
  );
}

function AITrainerCard({ onOpenAI }: { onOpenAI?: () => void }) {
  return (
    <GlassCardView style={styles.card} accentColor={Colors.purple}>
      <SectionLabel title="Ask AI about your workout" />
      <View style={{ paddingVertical: Spacing.sm }}>
        <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.sm }}>
          Get quick tips, workout swaps, or recovery advice from AI.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: Colors.purple, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md, alignSelf: 'stretch', width: '100%', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => onOpenAI && onOpenAI('Activity')}
          activeOpacity={0.9}>
          <Text style={{ color: Colors.bg, fontWeight: Typography.bold }}>Ask AI</Text>
        </TouchableOpacity>
      </View>
    </GlassCardView>
  );
}

function WeeklyActivityCard() {
  const maxBarH = 80;
  return (
    <GlassCardView style={styles.card}>
      <View style={styles.weeklyHeader}>
        <SectionLabel title="WEEKLY ACTIVITY" />
        <View style={[styles.streakBadge, { backgroundColor: Colors.teal + '20', borderColor: Colors.teal + '50' }]}>
          <Text style={[styles.streakBadgeText, { color: Colors.teal }]}>4 day streak</Text>
        </View>
      </View>
      <Text style={styles.chartSubtitle}>Volume this week</Text>
      <View style={styles.barChart}>
        {WEEKLY_BARS.map((bar, i) => (
          <View key={i} style={styles.barCol}>
            <View style={[styles.bar, { height: maxBarH * bar.val, backgroundColor: bar.color + '90' }]} />
            <Text style={styles.barLabel}>{bar.day}</Text>
          </View>
        ))}
      </View>
      <View style={styles.weeklyStatsGrid}>
        {WEEKLY_STATS.map(stat => (
          <View key={stat.label} style={styles.weeklyStat}>
            <Text style={styles.weeklyStatVal}>{stat.value}</Text>
            <Text style={styles.weeklyStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </GlassCardView>
  );
}

function PersonalRecordsCard() {
  return (
    <GlassCardView style={styles.card}>
      <View style={styles.weeklyHeader}>
        <SectionLabel title="PERSONAL RECORDS" />
        <View style={[styles.streakBadge, { backgroundColor: Colors.amber + '20', borderColor: Colors.amber + '50' }]}>
          <Text style={[styles.streakBadgeText, { color: Colors.amber }]}>this month</Text>
        </View>
      </View>
      <Text style={styles.chartSubtitle}>Lifetime PRs</Text>
      {PERSONAL_RECORDS.map((pr, i) => (
        <View key={i} style={[styles.prRow, i < PERSONAL_RECORDS.length - 1 && styles.prRowBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.prExercise}>{pr.exercise}</Text>
            <Text style={styles.prDate}>{pr.date}</Text>
          </View>
          <View style={styles.prRight}>
            <Text style={styles.prValue}>{pr.value}</Text>
            <Text style={[styles.prDelta, { color: pr.color }]}>{pr.delta}</Text>
          </View>
        </View>
      ))}
    </GlassCardView>
  );
}

function MuscleBalanceCard() {
  return (
    <GlassCardView style={styles.card}>
      <SectionLabel title="MUSCLE BALANCE THIS WEEK" />
      <Text style={styles.chartSubtitle}>Volume balance</Text>
      {MUSCLE_BALANCE.map((m, i) => (
        <View key={m.muscle} style={styles.balanceRow}>
          <View style={styles.balanceLabelRow}>
            <Text style={styles.balanceMuscle}>{m.muscle}</Text>
            <Text style={[styles.balanceLevel, { color: m.color }]}>{m.level}</Text>
          </View>
          <ProgressBar progress={m.progress} color={m.color} height={6} />
        </View>
      ))}
      <View style={[styles.insightBox, { backgroundColor: Colors.amber + '15', borderColor: Colors.amber + '40' }]}>
        <Text style={styles.insightText}>
          AI suggests adding a leg day and core session to balance your push-heavy week.
        </Text>
      </View>
    </GlassCardView>
  );
}

function RecoveryCard() {
  return (
    <GlassCardView style={styles.card}>
      <SectionLabel title="RECOVERY STATUS" />
      <View style={styles.recoveryGrid}>
        <View style={[styles.recoveryMini, { borderColor: Colors.teal + '40' }]}>
          <Text style={styles.recoveryMiniLabel}>HRV STATUS</Text>
          <Text style={[styles.recoveryMiniVal, { color: Colors.teal }]}>68 ms</Text>
        </View>
        <View style={[styles.recoveryMini, { borderColor: Colors.pink + '40' }]}>
          <Text style={styles.recoveryMiniLabel}>SORENESS</Text>
          <Text style={[styles.recoveryMiniVal, { color: Colors.pink }]}>Chest / Delts</Text>
        </View>
      </View>
      <View style={[styles.insightBox, { backgroundColor: Colors.purple + '15', borderColor: Colors.purple + '40' }]}>
        <Text style={[styles.insightLabel, { color: Colors.purple }]}>AI recovery tips</Text>
        <Text style={styles.insightText}>
          Prioritize 7.5+ hours sleep tonight. Reduce intensity on shoulders if soreness persists.
        </Text>
      </View>
    </GlassCardView>
  );
}

export default function FitnessScreen({ onProfilePress, onNotificationsPress, onOpenAI }: { onProfilePress?: () => void; onNotificationsPress?: () => void; onOpenAI?: (from?: TabName) => void }) {
  const { onScroll } = useScrollVisibility();
  const { user } = useAuth();
  const [activeSegment, setActiveSegment] = useState<Segment>('Today');
  const [activeFilter, setActiveFilter] = useState('All');

  const showToday = activeSegment === 'Today';
  const showWeekly = activeSegment === 'Weekly' || showToday;
  const showWorkouts = activeSegment === 'Workouts' || showToday;
  const showPRs = activeSegment === 'PRs' || showToday;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>Wednesday, Jan 11</Text>
            <Text style={styles.title}>Activity & Gym</Text>
          </View>
          <View style={styles.headerRight}>
            <NotificationIconButton onPress={onNotificationsPress} />
            <ProfileAvatarButton
              onPress={onProfilePress}
              userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              avatarUrl={user?.user_metadata?.avatar_url}
            />
          </View>
        </View>

        <SegmentedControl segments={SEGMENTS} active={activeSegment} onChange={setActiveSegment} />

        {showToday && <ActivityRingsCard />}

        {showWorkouts && (
          <View style={styles.section}>
            <TodaysWorkout activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
          </View>
        )}

        {showToday && (
          <View style={styles.section}>
            <AITrainerCard onOpenAI={() => onOpenAI && onOpenAI('Activity')} />
          </View>
        )}

        {showWeekly && (
          <View style={styles.section}>
            <WeeklyActivityCard />
          </View>
        )}

        {showPRs && (
          <View style={styles.section}>
            <PersonalRecordsCard />
          </View>
        )}

        {(showWeekly || showToday) && (
          <View style={styles.section}>
            <MuscleBalanceCard />
          </View>
        )}

        {(showToday || activeSegment === 'Weekly') && (
          <View style={styles.section}>
            <RecoveryCard />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: Colors.bgCardBorder,
    ...Shadows.card,
  },
  segmentText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
  },
  section: { marginBottom: Spacing.lg },
  card: { padding: Spacing.base, marginBottom: Spacing.base },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  sectionAction: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.purple,
    letterSpacing: 0.5,
  },
  ringsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base },
  ringsVisual: { marginRight: Spacing.lg },
  ringOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMid: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: Typography.lg,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
  },
  ringsMetrics: { flex: 1, gap: Spacing.sm },
  ringMetric: { marginBottom: Spacing.xs },
  ringMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ringMetricLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  ringMetricVal: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  vitalRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  vitalPill: {
    flex: 1,
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  vitalVal: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  vitalLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  filterScroll: { marginBottom: Spacing.md },
  exerciseCard: { padding: Spacing.base, marginBottom: Spacing.sm },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  exerciseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitleWrap: { flex: 1, marginLeft: Spacing.md },
  exerciseName: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagText: { fontSize: 9, fontWeight: Typography.bold },
  topSet: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  setChip: {
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
  },
  setChipText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  addExerciseBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.teal + '60',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.teal + '08',
  },
  addExerciseText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.teal,
  },
  coachRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.purple + '25',
    borderWidth: 2,
    borderColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  coachName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  coachSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aiBubble: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  aiBubbleText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  aiActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  aiActionPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCardBorder,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  aiActionText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingLeft: Spacing.base,
    paddingRight: 4,
    paddingVertical: 4,
  },
  aiInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  aiSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSendIcon: {
    fontSize: 18,
    color: Colors.bg,
    fontWeight: Typography.bold,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streakBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  streakBadgeText: {
    fontSize: 9,
    fontWeight: Typography.bold,
  },
  chartSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  barCol: { alignItems: 'center', flex: 1 },
  bar: {
    width: Math.min(28, (width - 80) / 9),
    borderRadius: Radius.sm,
    minHeight: 8,
  },
  barLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontWeight: Typography.medium,
  },
  weeklyStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.base,
  },
  weeklyStat: {
    width: '47%',
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  weeklyStatVal: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  weeklyStatLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  prRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  prExercise: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  prDate: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  prRight: { alignItems: 'flex-end' },
  prValue: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  prDelta: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    marginTop: 2,
  },
  balanceRow: { marginBottom: Spacing.md },
  balanceLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  balanceMuscle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  balanceLevel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  insightBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  insightText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  recoveryGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  recoveryMini: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    backgroundColor: Colors.bgCard,
  },
  recoveryMiniLabel: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  recoveryMiniVal: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
});
