import React, { useEffect, useRef, useState } from 'react';
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
import { HealthLogDraft } from './HealthLogScreen';

export default function HealthScreenFemale({
  onProfilePress,
  onNotificationsPress,
  onOpenHealthLog,
  lastHealthLog,
}: {
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
  onOpenHealthLog?: () => void;
  lastHealthLog?: HealthLogDraft | null;
}) {
  const { onScroll } = useScrollVisibility();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPhase, setSelectedPhase] = useState('Luteal');
  const scrollRef = useRef<ScrollView>(null);

  const TABS = ['Overview', 'Hormones', 'Fertility'];
  const moodTrend = [
    { day: 'M', value: 4, label: 'Good' },
    { day: 'T', value: 3, label: 'Okay' },
    { day: 'W', value: 3, label: 'Okay' },
    { day: 'T', value: 5, label: 'Great' },
    { day: 'F', value: 4, label: 'Good' },
    { day: 'S', value: 2, label: 'Bad' },
    {
      day: 'Today',
      value: lastHealthLog?.mood === 'Great' ? 5 : lastHealthLog?.mood === 'Good' ? 4 : lastHealthLog?.mood === 'Bad' ? 2 : 3,
      label: lastHealthLog?.mood ?? 'Okay',
    },
  ];
  const flowTrend = [
    { day: 'D1', value: 4 },
    { day: 'D2', value: 3 },
    { day: 'D3', value: 2 },
    { day: 'D4', value: 1 },
    { day: 'D5', value: 0 },
  ];
  const topSymptoms = lastHealthLog?.symptoms?.length
    ? lastHealthLog.symptoms.slice(0, 3)
    : ['Fatigue', 'Cramps', 'Cravings'];
  const latestDischarge = lastHealthLog?.discharge ?? 'Creamy';
  const latestMood = lastHealthLog?.mood ?? moodTrend[moodTrend.length - 1].label;
  const latestFlow = lastHealthLog?.flow ?? 'None';

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTab]);

  return (
    <View style={s.root}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}>
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

        {activeTab === 'Overview' && (
          <>
            <TouchableOpacity style={s.logCta} onPress={onOpenHealthLog} activeOpacity={0.85}>
              <View style={s.logCtaCopy}>
                <Text style={s.logCtaTitle}>Log today&apos;s health</Text>
                <Text style={s.logCtaSub}>Mood, flow, discharge, symptoms, sleep and vitals</Text>
              </View>
              <Text style={s.logCtaIcon}>+</Text>
            </TouchableOpacity>

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
                <View style={s.phaseGap} />
                <QuickActionButton icon="🌸" label="Follicular" color={Colors.pink + 'AA'} active={selectedPhase === 'Follicular'} onPress={() => setSelectedPhase('Follicular')} />
                <View style={s.phaseGap} />
                <QuickActionButton icon="✨" label="Ovulation" color={Colors.amber} active={selectedPhase === 'Ovulation'} onPress={() => setSelectedPhase('Ovulation')} />
                <View style={s.phaseGap} />
                <QuickActionButton icon="🌙" label="Luteal" color={Colors.purple} active={selectedPhase === 'Luteal'} onPress={() => setSelectedPhase('Luteal')} />
              </View>
            </GlassCardView>

            <SectionHeader title="Next Cycle View" subtitle="Predicted · 28-day cycle" />
            <GlassCardView style={s.cycleViewCard}>
              {/* Phase legend pills */}
              <View style={s.phaseLegendRow}>
                {[
                  { label: 'Period', color: Colors.pink },
                  { label: 'Follicular', color: '#7EC8E3' },
                  { label: 'Ovulation', color: Colors.amber },
                  { label: 'Luteal', color: Colors.purple },
                ].map(p => (
                  <View key={p.label} style={[s.legendPill, { backgroundColor: p.color + '22', borderColor: p.color + '55' }]}>
                    <View style={[s.legendDot, { backgroundColor: p.color }]} />
                    <Text style={[s.legendText, { color: p.color }]}>{p.label}</Text>
                  </View>
                ))}
              </View>

              {/* Day timeline strip */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.timelineScroll}>
                <View>
                  {/* Phase color band */}
                  <View style={s.phaseBand}>
                    {/* Period band: days 1-5 */}
                    <View style={[s.bandSegment, { width: 5 * 38, backgroundColor: Colors.pink + '40', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }]} />
                    {/* Follicular band: days 6-12 */}
                    <View style={[s.bandSegment, { width: 7 * 38, backgroundColor: '#7EC8E3' + '33' }]} />
                    {/* Ovulation band: days 13-15 */}
                    <View style={[s.bandSegment, { width: 3 * 38, backgroundColor: Colors.amber + '40' }]} />
                    {/* Luteal band: days 16-28 */}
                    <View style={[s.bandSegment, { width: 13 * 38, backgroundColor: Colors.purple + '30', borderTopRightRadius: 10, borderBottomRightRadius: 10 }]} />
                  </View>

                  {/* Day circles row */}
                  <View style={s.timelineDaysRow}>
                    {Array.from({ length: 28 }).map((_, i) => {
                      const day = i + 1;
                      const isPeriod = day <= 5;
                      const isFollicular = day >= 6 && day <= 12;
                      const isOvulation = day >= 13 && day <= 15;
                      const isLuteal = day >= 16;
                      const isCurrent = day === 18;
                      const isNextPeriod = day === 1; // start of next visible
                      let circleColor = Colors.bgCardBorder;
                      let textColor = Colors.textMuted;
                      let bgColor = 'transparent';
                      if (isPeriod) { circleColor = Colors.pink; bgColor = Colors.pink + 'CC'; textColor = '#fff'; }
                      else if (isOvulation) { circleColor = Colors.amber; bgColor = Colors.amber + 'CC'; textColor = Colors.bg; }
                      else if (isFollicular) { circleColor = '#7EC8E3'; }
                      else if (isLuteal) { circleColor = Colors.purple; }
                      return (
                        <View key={i} style={[s.tlDayWrap, isCurrent && s.tlDayCurrent]}>
                          {isCurrent && <View style={s.currentNeedle} />}
                          <View style={[
                            s.tlCircle,
                            { borderColor: circleColor, backgroundColor: bgColor },
                            isCurrent && { borderWidth: 2.5, borderColor: Colors.purple, backgroundColor: Colors.purple + 'CC' },
                          ]}>
                            <Text style={[s.tlDayNum, { color: isCurrent ? '#fff' : textColor }]}>
                              {isCurrent ? '●' : day}
                            </Text>
                          </View>
                          {/* Phase icon under key days */}
                          {day === 1 && <Text style={s.phaseIcon}>🩸</Text>}
                          {day === 13 && <Text style={s.phaseIcon}>✨</Text>}
                          {day === 18 && <Text style={[s.phaseIcon, { color: Colors.purple }]}>Now</Text>}
                          {day === 28 && <Text style={s.phaseIcon}>🔄</Text>}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Countdown strip */}
              <View style={s.countdownStrip}>
                <View style={s.countdownItem}>
                  <Text style={[s.countdownVal, { color: Colors.pink }]}>10</Text>
                  <Text style={s.countdownLbl}>Days to{`\n`}Next Period</Text>
                </View>
                <View style={s.countdownDivider} />
                <View style={s.countdownItem}>
                  <Text style={[s.countdownVal, { color: Colors.amber }]}>21</Text>
                  <Text style={s.countdownLbl}>Days to{`\n`}Ovulation</Text>
                </View>
                <View style={s.countdownDivider} />
                <View style={s.countdownItem}>
                  <Text style={[s.countdownVal, { color: Colors.purple }]}>Day 18</Text>
                  <Text style={s.countdownLbl}>Current{`\n`}Cycle Day</Text>
                </View>
              </View>
            </GlassCardView>

            <SectionHeader title="Health Trends" subtitle={lastHealthLog ? 'Updated from latest log' : 'Insights from recent logs'} />
            <GlassCardView style={s.card}>
              <View style={s.trendHeader}>
                <View>
                  <Text style={s.trendTitle}>Mood stability</Text>
                  <Text style={s.trendSub}>Mostly steady with one low-energy day</Text>
                </View>
                <Text style={s.trendScore}>{latestMood}</Text>
              </View>
              <View style={s.moodChart}>
                {moodTrend.map((item, i) => (
                  <View key={`${item.day}-${i}`} style={s.chartCol}>
                    <View style={s.moodTrack}>
                      <View
                        style={[
                          s.moodBar,
                          {
                            height: `${item.value * 18}%`,
                            backgroundColor: i === moodTrend.length - 1 ? Colors.pink : Colors.pink + '70',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[s.chartLabel, i === moodTrend.length - 1 && { color: Colors.pink }]}>{item.day}</Text>
                  </View>
                ))}
              </View>

              <View style={s.softDivider} />

              <View style={s.trendHeader}>
                <View>
                  <Text style={s.trendTitle}>Flow pattern</Text>
                  <Text style={s.trendSub}>Last period tapered normally across 5 days</Text>
                </View>
                <Text style={s.trendScore}>{latestFlow}</Text>
              </View>
              <View style={s.flowTrendRow}>
                {flowTrend.map(item => (
                  <View key={item.day} style={s.flowTrendItem}>
                    <View style={s.flowTrack}>
                      <View style={[s.flowTrendFill, { height: `${Math.max(8, item.value * 22)}%` }]} />
                    </View>
                    <Text style={s.chartLabel}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </GlassCardView>

            <SectionHeader title="Cycle Signals" />
            <GlassCardView style={s.card}>
              <View style={s.signalRow}>
                <View style={s.signalIcon}>
                  <Text style={s.signalIconText}>●</Text>
                </View>
                <View style={s.signalCopy}>
                  <Text style={s.signalTitle}>{latestDischarge} discharge</Text>
                  <Text style={s.signalText}>Consistent with luteal phase. Watch for changes in color, smell, or discomfort.</Text>
                </View>
              </View>
              <View style={s.softDivider} />
              <View style={s.patternGrid}>
                <View style={s.patternItem}>
                  <Text style={s.patternLabel}>Common symptoms</Text>
                  <Text style={s.patternValue}>{topSymptoms.join(', ')}</Text>
                </View>
                <View style={s.patternItem}>
                  <Text style={s.patternLabel}>Fertility status</Text>
                  <Text style={s.patternValue}>Post ovulation</Text>
                </View>
              </View>
            </GlassCardView>

            <SectionHeader title="Partner Sharing" subtitle="Cycle and health visibility" />
            <GlassCardView style={s.partnerCard}>
              <View style={s.partnerHeader}>
                <View style={s.partnerAvatar}>
                  <Text style={s.partnerAvatarText}>♡</Text>
                </View>
                <View style={s.partnerTitleWrap}>
                  <Text style={s.partnerTitle}>Partner access not connected</Text>
                  <Text style={s.partnerSub}>Future sharing can show cycle phase, mood and symptom summaries.</Text>
                </View>
              </View>
              <View style={s.partnerStatusRow}>
                <Text style={s.partnerStatusText}>Sharing off</Text>
                <Text style={s.partnerStatusMeta}>Private by default</Text>
              </View>
            </GlassCardView>

            <SleepTrackerSection />
            <MentalHealthSection />
            <VitalsDashboardSection />
          </>
        )}

        {activeTab === 'Fertility' && (
          <>
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
          </>
        )}

        {activeTab === 'Hormones' && (
          <>
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
          </>
        )}

        <View style={s.aiWrap}>
          <AIHealthInsightsSection mode="female" />
        </View>

        <View style={s.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  card: { padding: Spacing.base, marginBottom: Spacing.xl },
  partnerCard: { padding: Spacing.base, marginBottom: Spacing.xl, borderColor: Colors.pink + '22' },
  logCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.pink + '18',
    borderWidth: 1,
    borderColor: Colors.pink + '45',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  logCtaCopy: { flex: 1, paddingRight: Spacing.md },
  logCtaTitle: { fontSize: Typography.md, color: Colors.textPrimary, fontWeight: Typography.bold },
  logCtaSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 3 },
  logCtaIcon: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', textAlign: 'center', lineHeight: 33, backgroundColor: Colors.pink, color: Colors.bg, fontSize: 26, fontWeight: Typography.bold },
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
  phaseGap: { width: Spacing.sm },
  // ── Next Cycle View redesign ──────────────────────────────────────────────
  cycleViewCard: { padding: Spacing.base, marginBottom: Spacing.xl, overflow: 'hidden' },
  phaseLegendRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.md },
  legendPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: Typography.semiBold },
  timelineScroll: { paddingBottom: Spacing.xs },
  phaseBand: { flexDirection: 'row', height: 8, marginBottom: 6 },
  bandSegment: { height: '100%' },
  timelineDaysRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
  tlDayWrap: { width: 38, alignItems: 'center', paddingVertical: Spacing.xs },
  tlDayCurrent: {},
  currentNeedle: { position: 'absolute', top: 0, width: 2, height: '100%', backgroundColor: Colors.purple, opacity: 0.6, borderRadius: 1 },
  tlCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tlDayNum: { fontSize: 9, fontWeight: Typography.bold },
  phaseIcon: { fontSize: 9, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  countdownStrip: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  countdownItem: { flex: 1, alignItems: 'center' },
  countdownVal: { fontSize: Typography.lg, fontWeight: Typography.extraBold },
  countdownLbl: { fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 2, lineHeight: 13 },
  countdownDivider: { width: 1, height: 36, backgroundColor: Colors.divider },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  trendTitle: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.bold },
  trendSub: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  trendScore: { fontSize: Typography.sm, color: Colors.pink, fontWeight: Typography.bold },
  moodChart: { flexDirection: 'row', alignItems: 'flex-end', height: 92, gap: Spacing.sm },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  moodTrack: { width: '100%', height: 68, borderRadius: Radius.sm, backgroundColor: Colors.bgCardBorder, justifyContent: 'flex-end', overflow: 'hidden' },
  moodBar: { width: '100%', borderRadius: Radius.sm },
  chartLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 5, fontWeight: Typography.semiBold },
  softDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.lg },
  flowTrendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  flowTrendItem: { flex: 1, alignItems: 'center' },
  flowTrack: { width: 26, height: 64, borderRadius: Radius.sm, backgroundColor: Colors.bgCardBorder, justifyContent: 'flex-end', overflow: 'hidden' },
  flowTrendFill: { width: '100%', backgroundColor: Colors.pink },
  signalRow: { flexDirection: 'row', alignItems: 'center' },
  signalIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.purple + '20' },
  signalIconText: { color: Colors.purple, fontSize: 18 },
  signalCopy: { flex: 1, marginLeft: Spacing.md },
  signalTitle: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.bold },
  signalText: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18, marginTop: 3 },
  patternGrid: { flexDirection: 'row', gap: Spacing.sm },
  patternItem: { flex: 1, borderWidth: 1, borderColor: Colors.bgCardBorder, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: Colors.bgCard },
  patternLabel: { fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 5 },
  patternValue: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.bold },
  partnerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  partnerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.pink + '22' },
  partnerAvatarText: { fontSize: 22, color: Colors.pink, fontWeight: Typography.bold },
  partnerTitleWrap: { flex: 1, marginLeft: Spacing.md },
  partnerTitle: { fontSize: Typography.md, color: Colors.textPrimary, fontWeight: Typography.bold },
  partnerSub: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 17 },
  partnerStatusRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: Spacing.md },
  partnerStatusText: { fontSize: Typography.sm, color: Colors.pink, fontWeight: Typography.bold },
  partnerStatusMeta: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semiBold },
  promptText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary, marginBottom: Spacing.md },
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
  aiWrap: { marginTop: Spacing.xl },
  bottomSpace: { height: 100 },
});
