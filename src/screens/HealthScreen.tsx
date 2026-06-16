import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import { GlassCardView, SectionHeader, Chip, StatPill, ProfileAvatarButton } from '../components/SharedComponents';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';

const { width } = Dimensions.get('window');

const CYCLE_DAYS = Array.from({ length: 35 }, (_, i) => i + 1);

type DayType = 'period' | 'fertile' | 'ovulation' | 'predicted' | 'today' | 'normal';

function getDayType(day: number): DayType {
  if (day === 14) return 'today';
  if (day >= 1 && day <= 5) return 'period';
  if (day === 14) return 'ovulation';
  if (day >= 12 && day <= 16) return 'fertile';
  if (day >= 28 && day <= 30) return 'predicted';
  return 'normal';
}

const DAY_COLORS: Record<DayType, string> = {
  period: Colors.pink,
  fertile: Colors.teal,
  ovulation: Colors.amber,
  predicted: Colors.pink + '80',
  today: Colors.purple,
  normal: 'transparent',
};

const SYMPTOMS = [
  { icon: '😴', label: 'Fatigue' },
  { icon: '🤕', label: 'Cramps' },
  { icon: '😊', label: 'Good Mood' },
  { icon: '😤', label: 'Irritable' },
  { icon: '🤢', label: 'Nausea' },
  { icon: '💧', label: 'Bloating' },
  { icon: '🌙', label: 'Poor Sleep' },
  { icon: '⚡', label: 'High Energy' },
  { icon: '🍫', label: 'Cravings' },
  { icon: '💔', label: 'Tender Breasts' },
];

const FLOW_LEVELS = ['None', 'Light', 'Medium', 'Heavy'];

export default function CycleScreen({ onProfilePress }: { onProfilePress?: () => void }) {
  const { onScroll } = useScrollVisibility();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Cramps', 'Fatigue']);
  const [selectedFlow, setSelectedFlow] = useState('Medium');
  const [selectedDay, setSelectedDay] = useState(14);

  const toggleSymptom = (label: string) =>
    setSelectedSymptoms(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cycle Tracker</Text>
            <Text style={styles.sub}>Cycle Day 14 · Ovulation Phase</Text>
          </View>
          <ProfileAvatarButton onPress={onProfilePress} />
        </View>

        {/* Phase Status Banner */}
        <View style={styles.phaseBanner}>
          <View style={[styles.phaseIndicator, { backgroundColor: Colors.amber + '25', borderColor: Colors.amber + '60' }]}>
            <Text style={{ fontSize: 22 }}>🌟</Text>
            <View style={{ marginLeft: Spacing.md }}>
              <Text style={[styles.phaseTitle, { color: Colors.amber }]}>Ovulation Phase</Text>
              <Text style={styles.phaseSub}>Peak fertility window · Days 12–16</Text>
            </View>
          </View>
        </View>

        {/* Cycle Calendar */}
        <SectionHeader title="Cycle Calendar" subtitle="June 2026" />
        <GlassCardView style={styles.calendarCard}>
          <View style={styles.legendRow}>
            {[
              { color: Colors.pink, label: 'Period' },
              { color: Colors.teal, label: 'Fertile' },
              { color: Colors.amber, label: 'Ovulation' },
              { color: Colors.purple, label: 'Today' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.calGrid}>
            {CYCLE_DAYS.map(day => {
              const type = getDayType(day);
              const isSelected = day === selectedDay;
              const isToday = day === 14;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.dayCell,
                    type !== 'normal' && { backgroundColor: DAY_COLORS[type] + '30', borderColor: DAY_COLORS[type] },
                    isSelected && { borderWidth: 2 },
                    isToday && styles.todayCell,
                  ]}>
                  <Text style={[styles.dayText, type !== 'normal' && { color: DAY_COLORS[type] }, isToday && { color: Colors.purple, fontWeight: '700' }]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCardView>

        {/* Cycle Stats */}
        <View style={styles.statsRow}>
          <StatPill label="Avg Length" value="28 days" color={Colors.pink} />
          <StatPill label="Last Period" value="Jun 1" color={Colors.purple} />
          <StatPill label="Next Period" value="Jun 29" color={Colors.amber} />
        </View>

        {/* Flow Level */}
        <SectionHeader title="Flow Level Today" />
        <GlassCardView style={styles.flowCard}>
          <View style={styles.flowRow}>
            {FLOW_LEVELS.map((level, i) => (
              <TouchableOpacity
                key={level}
                onPress={() => setSelectedFlow(level)}
                style={[
                  styles.flowBtn,
                  selectedFlow === level && { backgroundColor: Colors.pink + '30', borderColor: Colors.pink },
                ]}>
                <View style={styles.flowDrops}>
                  {Array.from({ length: i + 1 }).map((_, j) => (
                    <Text key={j} style={[styles.flowDrop, { opacity: selectedFlow === level ? 1 : 0.3 }]}>
                      💧
                    </Text>
                  ))}
                </View>
                <Text style={[styles.flowLabel, selectedFlow === level && { color: Colors.pink }]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCardView>

        {/* Symptoms */}
        <SectionHeader title="Symptoms Today" subtitle={`${selectedSymptoms.length} logged`} />
        <GlassCardView style={styles.symptomsCard}>
          <View style={styles.chipsWrap}>
            {SYMPTOMS.map(s => (
              <Chip
                key={s.label}
                label={s.label}
                icon={s.icon}
                selected={selectedSymptoms.includes(s.label)}
                color={Colors.pink}
                onPress={() => toggleSymptom(s.label)}
              />
            ))}
          </View>
        </GlassCardView>

        {/* Predictions */}
        <SectionHeader title="AI Cycle Insights" />
        <GlassCardView style={styles.insightCard} accentColor={Colors.pink}>
          <Text style={styles.insightText}>
            ✦ Based on your 3-month cycle data, your next period is predicted to start around{' '}
            <Text style={{ color: Colors.pink, fontWeight: '700' }}>June 29</Text>. Consider scheduling light workouts and higher iron intake during days 1–5.
          </Text>
          <View style={{ height: Spacing.md }} />
          <View style={styles.predictionBar}>
            {[
              { label: 'Menstrual', width: 0.16, color: Colors.pink },
              { label: 'Follicular', width: 0.28, color: Colors.purple },
              { label: 'Ovulation', width: 0.12, color: Colors.amber },
              { label: 'Luteal', width: 0.44, color: Colors.teal },
            ].map(p => (
              <View key={p.label} style={[styles.phaseBar, { flex: p.width, backgroundColor: p.color + 'CC' }]} />
            ))}
          </View>
          <View style={styles.phaseLabels}>
            {['Menstrual', 'Follicular', 'Ovulation', 'Luteal'].map(l => (
              <Text key={l} style={styles.phaseBarLabel}>{l}</Text>
            ))}
          </View>
        </GlassCardView>

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
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: Typography.sm, color: Colors.pink, marginTop: 4, fontWeight: Typography.medium },
  phaseBanner: { marginBottom: Spacing.xl },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  phaseTitle: { fontSize: Typography.md, fontWeight: Typography.bold },
  phaseSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  calendarCard: { padding: Spacing.base, marginBottom: Spacing.base },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: Typography.xs, color: Colors.textSecondary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  dayCell: {
    width: (width - Spacing.base * 2 - Spacing.base * 2 - 34) / 7,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayText: { fontSize: Typography.xs, color: Colors.textMuted },
  todayCell: { borderColor: Colors.purple, borderWidth: 2, backgroundColor: Colors.purpleDim },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  flowCard: { padding: Spacing.base, marginBottom: Spacing.xl },
  flowRow: { flexDirection: 'row', justifyContent: 'space-around' },
  flowBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    minWidth: 70,
  },
  flowDrops: { flexDirection: 'row', marginBottom: Spacing.xs },
  flowDrop: { fontSize: 12 },
  flowLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  symptomsCard: { padding: Spacing.base, marginBottom: Spacing.xl },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  insightCard: { padding: Spacing.base, marginBottom: Spacing.base },
  insightText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  predictionBar: { flexDirection: 'row', height: 10, borderRadius: Radius.full, overflow: 'hidden', gap: 2 },
  phaseBar: { borderRadius: Radius.full },
  phaseLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  phaseBarLabel: { fontSize: 9, color: Colors.textMuted },
});
