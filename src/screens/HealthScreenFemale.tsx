import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import {
  GlassCardView,
  SectionHeader,
  ProfileAvatarButton,
  NotificationIconButton,
} from '../components/SharedComponents';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';
import {
  InnerTabBar,
  HormoneRangeBar,
  QuickActionButton,
  SleepTrackerSection,
  MentalHealthSection,
  VitalsDashboardSection,
  AIHealthInsightsSection,
} from './HealthCommonSections';
import { useAuth } from '../providers/AuthProvider';

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HealthScreenFemale({
  onProfilePress,
  onNotificationsPress,
}: {
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
}) {
  const { onScroll } = useScrollVisibility();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPhase, setSelectedPhase] = useState('Luteal');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Cramps', 'Fatigue']);
  const [mood, setMood] = useState<number | null>(3);
  const [flow, setFlow] = useState<string>('Medium');
  const scrollRef = useRef<ScrollView>(null);

  const TABS = ['Overview', 'Hormones', 'Fertility'];

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTab]);
  const SYMPTOMS = [
    { label: 'Cramps', icon: '🤕' }, { label: 'Fatigue', icon: '😴' }, { label: 'Nausea', icon: '🤢' },
    { label: 'Brain fog', icon: '🧠' }, { label: 'Bloating', icon: '💧' }, { label: 'Irritability', icon: '😤' },
    { label: 'Headache', icon: '🤯' }, { label: 'Insomnia', icon: '🌙' }, { label: 'Cravings', icon: '🍫' },
    { label: 'Breast tenderness', icon: '🌸' }, { label: 'Energetic', icon: '⚡' }, { label: 'Depressed', icon: '🌧️' },
  ];
  const MOODS = [
    { emoji: '😢', label: 'Awful', value: 1 },
    { emoji: '😕', label: 'Bad', value: 2 },
    { emoji: '😐', label: 'Okay', value: 3 },
    { emoji: '😊', label: 'Good', value: 4 },
    { emoji: '😄', label: 'Great', value: 5 },
  ];
  const FLOWS = [
    { label: 'Spotting', icon: '💧' }, { label: 'Light', icon: '💧💧' },
    { label: 'Medium', icon: '💧💧💧' }, { label: 'Heavy', icon: '💧💧💧💧' }
  ];

  return (
    <View style={s.root}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.title}>Your Health</Text>
          <View style={s.headerActions}>
            <NotificationIconButton onPress={onNotificationsPress} />
            <ProfileAvatarButton
              onPress={onProfilePress}
              userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              avatarUrl={user?.user_metadata?.avatar_url}
            />
          </View>
        </View>

        <InnerTabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} accentColor={Colors.pink} />

        {activeTab === 'Overview' && (<>
            <SectionHeader title="Current Cycle" />
            <GlassCardView style={s.card}>
              <View style={s.cycleTopRow}>
                <View style={s.cycleRingWrap}>
                  <View style={[s.cycleRing, { borderColor: Colors.purple }]} />
                  <View style={s.cycleRingCenter}>
                    <Text style={s.ringDay}>Day 18</Text>
                    <Text style={s.ringSub}>of 28</Text>
                  </View>
                </View>
                <View style={s.cycleInfoWrap}>
                  <Text style={s.cyclePhaseLabel}>Current phase</Text>
                  <View style={s.phaseNameRow}>
                    <View style={[s.phaseDot, { backgroundColor: Colors.purple }]} />
                    <Text style={[s.phaseName, { color: Colors.purple }]}>Luteal phase</Text>
                  </View>
                  <View style={s.cycleStatsGrid}>
                    <Text style={s.cycleStatLabel}>Cycle day</Text>
                    <Text style={s.cycleStatVal}>18 / 28</Text>
                    <Text style={s.cycleStatLabel}>Next period</Text>
                    <Text style={[s.cycleStatVal, { color: Colors.pink }]}>10 days away</Text>
                    <Text style={s.cycleStatLabel}>Cycle length</Text>
                    <Text style={s.cycleStatVal}>28 days avg</Text>
                    <Text style={s.cycleStatLabel}>Period length</Text>
                    <Text style={s.cycleStatVal}>4 days avg</Text>
                  </View>
                </View>
              </View>

              <View style={s.phaseBtnRow}>
                <QuickActionButton icon="🩸" label="Menstrual" color={Colors.pink} active={selectedPhase === 'Menstrual'} onPress={() => setSelectedPhase('Menstrual')} />
                <View style={{ width: Spacing.sm }} />
                <QuickActionButton icon="🌸" label="Follicular" color={Colors.pink + 'AA'} active={selectedPhase === 'Follicular'} onPress={() => setSelectedPhase('Follicular')} />
                <View style={{ width: Spacing.sm }} />
                <QuickActionButton icon="✨" label="Ovulation" color={Colors.amber} active={selectedPhase === 'Ovulation'} onPress={() => setSelectedPhase('Ovulation')} />
                <View style={{ width: Spacing.sm }} />
                <QuickActionButton icon="🌙" label="Luteal" color={Colors.purple} active={selectedPhase === 'Luteal'} onPress={() => setSelectedPhase('Luteal')} />
              </View>
            </GlassCardView>

            <SectionHeader title="Next Cycle View" />
            <GlassCardView style={s.card}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.daysScroll}>
                {Array.from({ length: 16 }).map((_, i) => {
                  const day = i + 1;
                  const isPeriod = day <= 4;
                  const isOvulation = day >= 13 && day <= 15;
                  const isCurrent = day === 18;
                  let color = Colors.bgCardBorder;
                  let bg = 'transparent';
                  if (isPeriod) { color = Colors.pink; bg = Colors.pink; }
                  else if (isOvulation) { color = Colors.amber; bg = Colors.amber; }
                  return (
                    <View key={i} style={s.dayItemWrap}>
                      <View style={[s.dayCircle, { borderColor: color, backgroundColor: bg, borderWidth: isPeriod || isOvulation ? 0 : 1 }]}>
                        <Text style={[s.dayNum, { color: isPeriod || isOvulation ? Colors.bg : Colors.textSecondary }]}>{day}</Text>
                      </View>
                      {isPeriod && <View style={[s.dayDot, { backgroundColor: Colors.pink }]} />}
                      {isOvulation && <View style={[s.dayDot, { backgroundColor: Colors.amber }]} />}
                      {isCurrent && <Text style={{ color: Colors.purple, fontSize: 10 }}>✓</Text>}
                    </View>
                  );
                })}
              </ScrollView>
            </GlassCardView>

            <SectionHeader title="Log Today's Symptoms" />
            <GlassCardView style={s.card}>
              <Text style={s.promptText}>How are you feeling today?</Text>
              <View style={s.chipsWrap}>
                {SYMPTOMS.map((symptom, i) => {
                  const sel = selectedSymptoms.includes(symptom.label);
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        if (sel) setSelectedSymptoms(prev => prev.filter(s => s !== symptom.label));
                        else setSelectedSymptoms(prev => [...prev, symptom.label]);
                      }}
                      style={[s.chip, sel && { borderColor: Colors.pink, backgroundColor: Colors.pink + '20' }]}>
                      <Text style={s.chipIcon}>{symptom.icon}</Text>
                      <Text style={[s.chipLabel, sel && { color: Colors.pink, fontWeight: Typography.bold }]}>{symptom.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={s.divider} />
              <Text style={s.promptText}>Today's mood</Text>
              <View style={s.moodRow}>
                {MOODS.map(m => {
                  const sel = mood === m.value;
                  return (
                    <TouchableOpacity key={m.value} onPress={() => setMood(m.value)}
                      style={[s.moodBtn, sel && { backgroundColor: Colors.pink + '22', borderColor: Colors.pink }]}>
                      <Text style={[s.moodEmoji, sel && { fontSize: 30 }]}>{m.emoji}</Text>
                      <Text style={[s.moodLbl, sel && { color: Colors.pink, fontWeight: Typography.bold }]}>{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={s.divider} />
              <Text style={s.promptText}>Flow intensity <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: 'normal' }}>(available during period)</Text></Text>
              <View style={s.flowRow}>
                {FLOWS.map(f => {
                  const sel = flow === f.label;
                  return (
                    <TouchableOpacity key={f.label} onPress={() => setFlow(f.label)}
                      style={[s.flowBtn, sel && { backgroundColor: Colors.pink + '20', borderColor: Colors.pink }]}>
                      <Text style={s.flowIcon}>{f.icon}</Text>
                      <Text style={[s.flowLbl, sel && { color: Colors.pink }]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={s.saveLogBtn}>
                <Text style={s.saveLogText}>✓ Save today's log</Text>
              </TouchableOpacity>
            </GlassCardView>

            <SleepTrackerSection />
            <MentalHealthSection />
            <VitalsDashboardSection />
        </>)}

        {activeTab === 'Fertility' && (<>
            <SectionHeader title="Fertility Window" />
            <GlassCardView style={s.card}>
              <View style={s.fertHeader}>
                <View>
                  <Text style={s.fertTitle}>Ovulation passed</Text>
                  <Text style={s.fertSub}>Next fertile window predicted: Jul 9-14</Text>
                </View>
                <View style={[s.fertBadge, { backgroundColor: Colors.purple + '20', borderColor: Colors.purple + '55' }]}>
                  <Text style={[s.fertBadgeText, { color: Colors.purple }]}>% AI predicted</Text>
                </View>
              </View>
              <View style={s.fertGridRow}>
                <View style={[s.fertBox, { backgroundColor: Colors.pink + '15', borderColor: Colors.pink + '30' }]}>
                  <Text style={[s.fertBoxTitle, { color: Colors.pink }]}>Peak day was</Text>
                  <Text style={[s.fertBoxVal, { color: Colors.pink }]}>Jun 14</Text>
                  <Text style={s.fertBoxSub}>Ovulation day</Text>
                </View>
                <View style={[s.fertBox, { backgroundColor: Colors.amber + '15', borderColor: Colors.amber + '30' }]}>
                  <Text style={[s.fertBoxTitle, { color: Colors.amber }]}>Fertile window</Text>
                  <Text style={[s.fertBoxVal, { color: Colors.amber }]}>Jun 11-15</Text>
                  <Text style={s.fertBoxSub}>5-day window</Text>
                </View>
                <View style={[s.fertBox, { backgroundColor: Colors.purple + '15', borderColor: Colors.purple + '30' }]}>
                  <Text style={[s.fertBoxTitle, { color: Colors.purple }]}>Pregnancy chance</Text>
                  <Text style={[s.fertBoxVal, { color: Colors.purple }]}>Low</Text>
                  <Text style={s.fertBoxSub}>Post ovulation</Text>
                </View>
              </View>
            </GlassCardView>
        </>)}

        {activeTab === 'Hormones' && (<>
            <SectionHeader title="Hormone Health" />
            <GlassCardView style={s.card}>
              <View style={s.fertHeader}>
                <Text style={s.promptText}>Cycle phase hormones</Text>
                <View style={[s.fertBadge, { backgroundColor: Colors.purple + '20', borderColor: Colors.purple + '55' }]}>
                  <Text style={[s.fertBadgeText, { color: Colors.purple }]}>% AI Modeled</Text>
                </View>
              </View>
              <HormoneRangeBar label="Estrogen" value="High" status="Declining" statusColor={Colors.pink} currentPct={0.6} />
              <HormoneRangeBar label="Progesterone" value="Rising" status="Elevated" statusColor={Colors.purple} currentPct={0.8} />
              <HormoneRangeBar label="LH Surge" value="Low" status="Post-peak" statusColor={Colors.amber} currentPct={0.2} />
              <HormoneRangeBar label="Cortisol" value="Slightly High" status="Elevated" statusColor={Colors.amber} currentPct={0.7} />
              <HormoneRangeBar label="FSH" value="Normal" status="Normal" statusColor={Colors.success} currentPct={0.4} />

              <View style={s.infoBox}>
                <Text style={s.infoText}>💡 These are AI estimated values based on cycle day. For clinical accuracy, use a blood test or LH dips/ovulation swabs here.</Text>
              </View>
            </GlassCardView>
        </>)}

        {/* Common AI Insights at bottom of all tabs */}
        <View style={{ marginTop: Spacing.xl }}>
          <AIHealthInsightsSection mode="female" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, flexGrow: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  card: { padding: Spacing.base, marginBottom: Spacing.xl },

  cycleTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  cycleRingWrap: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cycleRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: Colors.bgCardBorder },
  cycleRingCenter: { alignItems: 'center', justifyContent: 'center' },
  ringDay: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  ringSub: { fontSize: Typography.xs, color: Colors.textMuted },
  cycleInfoWrap: { flex: 1, marginLeft: Spacing.lg },
  cyclePhaseLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  phaseNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  phaseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  phaseName: { fontSize: Typography.lg, fontWeight: Typography.bold },
  cycleStatsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cycleStatLabel: { width: '50%', fontSize: 10, color: Colors.textMuted, marginBottom: 2 },
  cycleStatVal: { width: '50%', fontSize: 10, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 2, textAlign: 'right' },

  phaseBtnRow: { flexDirection: 'row', gap: Spacing.sm },

  daysScroll: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  dayItemWrap: { alignItems: 'center', gap: 4 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 10, fontWeight: Typography.bold },
  dayDot: { width: 4, height: 4, borderRadius: 2 },

  promptText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.bgCardBorder },
  chipIcon: { fontSize: 14, marginRight: 6 },
  chipLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },

  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.lg },

  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  moodBtn: { alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: 'transparent', minWidth: 54 },
  moodEmoji: { fontSize: 26, marginBottom: 4 },
  moodLbl: { fontSize: 9, color: Colors.textMuted, fontWeight: Typography.medium },

  flowRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'space-between' },
  flowBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.bgCardBorder },
  flowIcon: { fontSize: 16, marginBottom: 4 },
  flowLbl: { fontSize: 10, color: Colors.textSecondary, fontWeight: Typography.medium },

  saveLogBtn: { backgroundColor: Colors.pink, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.xl },
  saveLogText: { color: Colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },

  fertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  fertTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  fertSub: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  fertBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  fertBadgeText: { fontSize: 9, fontWeight: Typography.bold },
  fertGridRow: { flexDirection: 'row', gap: Spacing.sm },
  fertBox: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
  fertBoxTitle: { fontSize: 10, fontWeight: Typography.semiBold, marginBottom: 4, textAlign: 'center' },
  fertBoxVal: { fontSize: Typography.lg, fontWeight: Typography.bold, marginBottom: 4, textAlign: 'center' },
  fertBoxSub: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  infoBox: { backgroundColor: Colors.amber + '10', borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.amber + '20' },
  infoText: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
});
