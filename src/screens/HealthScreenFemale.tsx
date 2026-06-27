import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
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
import { CyclePhaseVisualizer } from '../components/CyclePhaseVisualizer';
import { useAuth } from '../providers/AuthProvider';
import { HealthLogDraft } from './HealthLogScreen';
import {
  getPeriodLogs,
  getMoodLogs,
  getDischargeLogs,
  getSymptomsLogs,
  getInsights,
  getLatestCycle,
  getSleepLogs,
  saveCycle,
} from '../services/healthService';
import type { PeriodLog, MoodLog, DischargeLog, SymptomsLog, CycleInsight, CycleData, SleepLog } from '../types/health';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MOOD_VALUE_MAP: Record<string, number> = {
  Awful: 1, Bad: 2, Okay: 3, Good: 4, Great: 5,
};

function daysBetween(a: string, b: string): number {
  const dA = new Date(a);
  const dB = new Date(b);
  return Math.round((dB.getTime() - dA.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleString('default', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

function getMoodValue(mood: string): number {
  return MOOD_VALUE_MAP[mood] ?? 3;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPhase, setSelectedPhase] = useState('Luteal');
  const scrollRef = useRef<ScrollView>(null);

  // ── Data state ──────────────────────────────────────────────────────────
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [dischargeLogs, setDischargeLogs] = useState<DischargeLog[]>([]);
  const [symptomsLogs, setSymptomsLogs] = useState<SymptomsLog[]>([]);
  const [insights, setInsights] = useState<CycleInsight[]>([]);
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Cycle setup modal state ──────────────────────────────────────────────
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [setupStartDate, setSetupStartDate] = useState('');
  const [setupCycleLength, setSetupCycleLength] = useState('28');
  const [setupPeriodLength, setSetupPeriodLength] = useState('5');
  const [setupRegularity, setSetupRegularity] = useState<'regular' | 'irregular' | 'not_sure'>('not_sure');
  const [savingCycle, setSavingCycle] = useState(false);

  // ── Fetch data on mount ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    setLoading(true);
    try {
      const safe = async <T,>(p: Promise<T>): Promise<T | null> => {
        try { return await p; } catch { return null; }
      };
      const [periods, moods, discharges, symptoms, ins, cycle, sleeps] = await Promise.all([
        safe(getPeriodLogs(token)),
        safe(getMoodLogs(token)),
        safe(getDischargeLogs(token)),
        safe(getSymptomsLogs(token)),
        safe(getInsights(token)),
        safe(getLatestCycle(token)),
        safe(getSleepLogs(token)),
      ]);
      setPeriodLogs(periods ?? []);
      setMoodLogs(moods ?? []);
      setDischargeLogs(discharges ?? []);
      setSymptomsLogs(symptoms ?? []);
      setInsights(ins ?? []);
      setSleepLogs(sleeps ?? []);
      if (cycle) setCycleData(cycle);
    } catch (err) {
      console.error('[HealthScreenFemale] Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when returning from health log (lastHealthLog changes)
  useEffect(() => {
    if (lastHealthLog) fetchData();
  }, [lastHealthLog, fetchData]);

  // ── Handle cycle setup save ──────────────────────────────────────────────
  const handleCycleSetupSave = async () => {
    const token = session?.access_token;
    if (!token || !setupStartDate) return;
    setSavingCycle(true);
    try {
      const saved = await saveCycle(token, {
        start_date: setupStartDate,
        cycle_length: parseInt(setupCycleLength, 10) || 28,
        avg_cycle_length: parseInt(setupCycleLength, 10) || 28,
        period_length: parseInt(setupPeriodLength, 10) || 5,
        regularity: setupRegularity,
      });
      setCycleData(saved);
      setShowCycleSetup(false);
      fetchData();
    } catch (err: any) {
      console.error('[HealthScreenFemale] Failed to save cycle:', err);
      Alert.alert('Save failed', err?.message || 'Could not save cycle data. Please try again.');
    } finally {
      setSavingCycle(false);
    }
  };

  // ── Cycle data from backend ──────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const cycleLength = cycleData?.avg_cycle_length || 28;
  const periodLen = cycleData?.period_length || 5;
  const cycleDay = cycleData?.current_cycle_day || 1;
  const currentPhase = cycleData?.current_phase || 'Menstrual';
  const phaseColor = cycleData?.phase_color || Colors.pink;
  const daysUntilNextPeriod = cycleData?.days_until_next_period || cycleLength;

  // ── Compute mood trend (last 7 days) ───────────────────────────────────
  const moodTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = SHORT_DAYS[d.getDay()];
    const log = moodLogs.find(m => m.date === dateStr);
    // Also check lastHealthLog for today
    const isToday = i === 6;
    const mood = isToday && lastHealthLog?.mood ? lastHealthLog.mood : log?.mood;
    const value = mood ? getMoodValue(mood) : 0;
    return { day: isToday ? 'Today' : dayLabel, value, label: mood ?? '' };
  });
  const latestMood = lastHealthLog?.mood ?? moodLogs[moodLogs.length - 1]?.mood ?? 'Okay';

  // ── Compute flow trend from last period ─────────────────────────────────
  const flowTrend = (() => {
    if (periodLogs.length === 0) {
      return [
        { day: 'D1', value: 4 }, { day: 'D2', value: 3 }, { day: 'D3', value: 2 },
        { day: 'D4', value: 1 }, { day: 'D5', value: 0 },
      ];
    }
    const latestPeriodDate = periodLogs[0].period_start_date;
    const logsForPeriod = periodLogs
      .filter(p => p.period_start_date === latestPeriodDate)
      .sort((a, b) => a.day_no - b.day_no);
    if (logsForPeriod.length === 0) {
      return [
        { day: 'D1', value: 4 }, { day: 'D2', value: 3 }, { day: 'D3', value: 2 },
        { day: 'D4', value: 1 }, { day: 'D5', value: 0 },
      ];
    }
    const flowMap: Record<string, number> = { Heavy: 4, Medium: 3, Light: 2, Spotting: 1, None: 0 };
    return logsForPeriod.map(p => ({
      day: `D${p.day_no}`,
      value: flowMap[p.flow_intensity ?? ''] ?? 2,
    }));
  })();

  // ── Latest symptoms & discharge ─────────────────────────────────────────
  const topSymptoms = (() => {
    if (lastHealthLog?.symptoms?.length) return lastHealthLog.symptoms.slice(0, 3).map(s => s.symptom);
    if (symptomsLogs.length > 0) {
      return symptomsLogs.slice(0, 3).map(s => s.symptom);
    }
    return ['No data yet'];
  })();
  const latestDischarge = lastHealthLog?.discharge ?? dischargeLogs[0]?.discharge_type ?? 'Not logged';
  const latestFlow = lastHealthLog?.flowIntensity ?? periodLogs[0]?.flow_intensity ?? 'None';

  // ── Fertility data from insights (insights predict future windows) ──────
  const latestInsight = insights.length > 0 ? insights[0] : null;
  const fertilityData = latestInsight ? {
    fertileStart: formatDateShort(latestInsight.predict_fertile_start),
    fertileEnd: formatDateShort(latestInsight.predict_fertile_end),
    ovulationDay: formatDateShort(latestInsight.predict_ovulation_start),
    isOvulationPassed: new Date(latestInsight.predict_ovulation_end) < new Date(),
    pregnancyChance: daysBetween(latestInsight.predict_ovulation_end, today) <= 2 ? 'High' : 'Low',
  } : null;

  // ── Hormone data from backend ──────────────────────────────────────────
  const hormoneBars = (() => {
    const h = cycleData?.hormone_snapshot;
    if (!h) return [
      { label: 'Estrogen', value: 'Low', status: 'N/A', statusColor: Colors.amber, currentPct: 0 },
      { label: 'Progesterone', value: 'Low', status: 'N/A', statusColor: Colors.amber, currentPct: 0 },
      { label: 'LH Surge', value: 'Low', status: 'N/A', statusColor: Colors.success, currentPct: 0 },
      { label: 'Cortisol', value: 'Normal', status: 'N/A', statusColor: Colors.success, currentPct: 0 },
      { label: 'FSH', value: 'Normal', status: 'N/A', statusColor: Colors.success, currentPct: 0 },
    ];
    return [
      { label: 'Estrogen', value: h.estrogen.value, status: h.estrogen.status, statusColor: Colors.pink, currentPct: h.estrogen.pct },
      { label: 'Progesterone', value: h.progesterone.value, status: h.progesterone.status, statusColor: Colors.purple, currentPct: h.progesterone.pct },
      { label: 'LH Surge', value: h.lh_surge.value, status: h.lh_surge.status, statusColor: Colors.amber, currentPct: h.lh_surge.pct },
      { label: 'Cortisol', value: h.cortisol.value, status: h.cortisol.status, statusColor: Colors.success, currentPct: h.cortisol.pct },
      { label: 'FSH', value: h.fsh.value, status: h.fsh.status, statusColor: Colors.pink, currentPct: h.fsh.pct },
    ];
  })();

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTab]);

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.pink} />
      </View>
    );
  }

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

        {!cycleData && !loading && (
          <TouchableOpacity style={s.cycleSetupBanner} activeOpacity={0.85} onPress={() => setShowCycleSetup(true)}>
            <View style={s.cycleSetupBannerIcon}>
              <Text style={{ fontSize: 20 }}>🩸</Text>
            </View>
            <View style={s.cycleSetupBannerCopy}>
              <Text style={s.cycleSetupBannerTitle}>Set up your cycle</Text>
              <Text style={s.cycleSetupBannerSub}>Enter your last period start date to see accurate cycle tracking</Text>
            </View>
            <Text style={s.cycleSetupBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

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
                    <Text style={s.ringDay}>Day {cycleDay}</Text>
                    <Text style={s.ringSub}>of {cycleLength}</Text>
                  </View>
                </View>
                <View style={s.cycleInfoWrap}>
                  <Text style={s.cyclePhaseLabel}>Current phase</Text>
                  <View style={s.phaseNameRow}>
                    <View style={[s.phaseDot, { backgroundColor: phaseColor }]} />
                    <Text style={[s.phaseName, { color: phaseColor }]}>{currentPhase} phase</Text>
                  </View>
                  <View style={s.cycleStatsGrid}>
                    <Text style={s.cycleStatLabel}>Cycle day</Text>
                    <Text style={s.cycleStatVal}>{cycleDay} / {cycleLength}</Text>
                    <Text style={s.cycleStatLabel}>Next period</Text>
                    <Text style={[s.cycleStatVal, { color: Colors.pink }]}>{daysUntilNextPeriod} days away</Text>
                    <Text style={s.cycleStatLabel}>Cycle length</Text>
                    <Text style={s.cycleStatVal}>{cycleLength} days</Text>
                    <Text style={s.cycleStatLabel}>Period length</Text>
                    <Text style={s.cycleStatVal}>{periodLen} days</Text>
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

            <SectionHeader title="Hormone Cycle" subtitle="Tap any day · Predicted model" />
            <CyclePhaseVisualizer cycleLength={cycleLength} currentDay={cycleDay} />

            <SectionHeader title="Health Trends" subtitle={lastHealthLog ? 'Updated from latest log' : 'Insights from recent logs'} />
            <GlassCardView style={s.card}>
              <View style={s.trendHeader}>
                <View>
                  <Text style={s.trendTitle}>Mood stability</Text>
                  <Text style={s.trendSub}>Based on last 7 days of logging</Text>
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
                            height: item.value > 0 ? `${item.value * 18}%` : '8%',
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
                  <Text style={s.trendSub}>Last period logged</Text>
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
                  <Text style={s.signalText}>Consistent with {currentPhase.toLowerCase()} phase. Watch for changes in color, smell, or discomfort.</Text>
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
                  <Text style={s.patternValue}>{fertilityData?.isOvulationPassed ? 'Post ovulation' : currentPhase === 'Ovulation' ? 'Fertile window' : 'Not fertile'}</Text>
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

            <SleepTrackerSection sleepLogs={sleepLogs} />
            <MentalHealthSection moodLogs={moodLogs} />
            <VitalsDashboardSection />
          </>
        )}

        {activeTab === 'Fertility' && (
          <>
            <SectionHeader title="Fertility Window" />
            <GlassCardView style={s.card}>
              <View style={s.fertHeader}>
                <View>
                  <Text style={s.fertTitle}>{fertilityData?.isOvulationPassed ? 'Ovulation passed' : 'Fertile window approaching'}</Text>
                  <Text style={s.fertSub}>{fertilityData ? `Next fertile window: ${fertilityData.fertileStart} - ${fertilityData.fertileEnd}` : 'Log your cycle to see predictions'}</Text>
                </View>
                <View style={[s.fertBadge, { backgroundColor: Colors.purple + '20', borderColor: Colors.purple + '55' }]}>
                  <Text style={[s.fertBadgeText, { color: Colors.purple }]}>% AI predicted</Text>
                </View>
              </View>
              {fertilityData ? (
                <View style={s.fertGridRow}>
                  <View style={[s.fertBox, { backgroundColor: Colors.pink + '15', borderColor: Colors.pink + '30' }]}>
                    <Text style={[s.fertBoxTitle, { color: Colors.pink }]}>Ovulation day</Text>
                    <Text style={[s.fertBoxVal, { color: Colors.pink }]}>{fertilityData.ovulationDay}</Text>
                    <Text style={s.fertBoxSub}>Peak fertility</Text>
                  </View>
                  <View style={[s.fertBox, { backgroundColor: Colors.amber + '15', borderColor: Colors.amber + '30' }]}>
                    <Text style={[s.fertBoxTitle, { color: Colors.amber }]}>Fertile window</Text>
                    <Text style={[s.fertBoxVal, { color: Colors.amber }]}>{fertilityData.fertileStart}-{fertilityData.fertileEnd}</Text>
                    <Text style={s.fertBoxSub}>5-day window</Text>
                  </View>
                  <View style={[s.fertBox, { backgroundColor: Colors.purple + '15', borderColor: Colors.purple + '30' }]}>
                    <Text style={[s.fertBoxTitle, { color: Colors.purple }]}>Pregnancy chance</Text>
                    <Text style={[s.fertBoxVal, { color: Colors.purple }]}>{fertilityData.pregnancyChance}</Text>
                    <Text style={s.fertBoxSub}>{fertilityData.isOvulationPassed ? 'Post ovulation' : 'Pre ovulation'}</Text>
                  </View>
                </View>
              ) : (
                <View style={s.fertGridRow}>
                  <View style={[s.fertBox, { backgroundColor: Colors.bgCardBorder + '50', borderColor: Colors.bgCardBorder }]}>
                    <Text style={[s.fertBoxTitle, { color: Colors.textMuted }]}>No data</Text>
                    <Text style={[s.fertBoxVal, { color: Colors.textMuted }]}>—</Text>
                    <Text style={s.fertBoxSub}>Log your cycle to see predictions</Text>
                  </View>
                </View>
              )}
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
              {hormoneBars.map(h => (
                <HormoneRangeBar key={h.label} {...h} />
              ))}

              <View style={s.infoBox}>
                <Text style={s.infoText}>These are AI estimated values based on cycle day {cycleDay}. For clinical accuracy, use a blood test or LH dips/ovulation swabs here.</Text>
              </View>
            </GlassCardView>
          </>
        )}

        <View style={s.aiWrap}>
          <AIHealthInsightsSection mode="female" />
        </View>

        <View style={s.bottomSpace} />
      </ScrollView>

      {/* Cycle Setup Modal */}
      <Modal visible={showCycleSetup} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Set Up Cycle Tracking</Text>
            <Text style={s.modalSubtitle}>Enter your last period start date to get accurate predictions</Text>

            <Text style={s.modalLabel}>Last period start date</Text>
            <TextInput
              style={s.modalInput}
              value={setupStartDate}
              onChangeText={setSetupStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={s.modalLabel}>Average cycle length (days)</Text>
            <TextInput
              style={s.modalInput}
              value={setupCycleLength}
              onChangeText={setSetupCycleLength}
              placeholder="28"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />

            <Text style={s.modalLabel}>Average period length (days)</Text>
            <TextInput
              style={s.modalInput}
              value={setupPeriodLength}
              onChangeText={setSetupPeriodLength}
              placeholder="5"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />

            <Text style={s.modalLabel}>Cycle regularity</Text>
            <View style={s.regularityRow}>
              {([['regular', 'Regular'], ['irregular', 'Irregular'], ['not_sure', 'Not sure']] as const).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setSetupRegularity(val)}
                  style={[s.regularityBtn, setupRegularity === val && s.regularityBtnActive]}>
                  <Text style={[s.regularityBtnText, setupRegularity === val && s.regularityBtnTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowCycleSetup(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSaveBtn, savingCycle && { opacity: 0.6 }]}
                onPress={handleCycleSetupSave}
                disabled={savingCycle || !setupStartDate}>
                {savingCycle ? (
                  <ActivityIndicator color={Colors.bg} size="small" />
                ) : (
                  <Text style={s.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const TABS = ['Overview', 'Hormones', 'Fertility'];

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

  // Cycle Setup Banner
  cycleSetupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pink + '18',
    borderWidth: 1,
    borderColor: Colors.pink + '45',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  cycleSetupBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.pink + '22',
    marginRight: Spacing.md,
  },
  cycleSetupBannerCopy: { flex: 1 },
  cycleSetupBannerTitle: { fontSize: Typography.md, color: Colors.textPrimary, fontWeight: Typography.bold },
  cycleSetupBannerSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  cycleSetupBannerArrow: { fontSize: 28, color: Colors.pink, fontWeight: Typography.bold, marginLeft: Spacing.sm },

  // Cycle Setup Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#111322',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  modalSubtitle: { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
  modalLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium, marginBottom: Spacing.sm, marginTop: Spacing.md },
  modalInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.xl },
  modalCancelBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.bgCardBorder },
  modalCancelText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semiBold },
  modalSaveBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, backgroundColor: Colors.pink, alignItems: 'center', minWidth: 80 },
  modalSaveText: { color: Colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },
  regularityRow: { flexDirection: 'row', gap: Spacing.sm },
  regularityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.bgCard,
  },
  regularityBtnActive: { borderColor: Colors.pink, backgroundColor: Colors.pink + '18' },
  regularityBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  regularityBtnTextActive: { color: Colors.pink },
});
