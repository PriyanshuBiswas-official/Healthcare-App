import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
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
  MiniMetricCard,
  SleepTrackerSection,
  MentalHealthSection,
  VitalsDashboardSection,
  PreventiveCareSection,
  AIHealthInsightsSection,
} from './HealthCommonSections';
import { useAuth } from '../providers/AuthProvider';
import { getSleepLogs, getMoodLogs } from '../services/healthService';
import type { SleepLog, MoodLog } from '../types/health';

const { width } = Dimensions.get('window');

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HealthScreenMale({
  onProfilePress,
  onNotificationsPress,
}: {
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
}) {
  const { onScroll } = useScrollVisibility();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const TABS = ['Overview', 'Hormones', 'Vitals'];

  const { session } = useAuth();

  const fetchData = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    try {
      const sleeps = await getSleepLogs(token).catch(() => null);
      const moods = await getMoodLogs(token).catch(() => null);
      if (sleeps) setSleepLogs(sleeps);
      if (moods) setMoodLogs(moods);
    } catch {}
  }, [session?.access_token]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

        <InnerTabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} accentColor={Colors.teal} />

        {activeTab === 'Overview' && (<>
            <SectionHeader title="Health Score" />
            <GlassCardView style={s.card}>
              <View style={s.scoreTopRow}>
                <View style={s.gaugeWrap}>
                  <View style={s.gaugeTrack} />
                  <View style={s.gaugeFill} />
                  <Text style={s.gaugeScore}>78</Text>
                  <Text style={s.gaugeTotal}>/ 100</Text>
                </View>
                <View style={s.scoreInfoWrap}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={s.scoreTitle}>Good health</Text>
                    <View style={s.scorePtsBadge}><Text style={s.scorePtsText}>↑ 3 pts</Text></View>
                  </View>
                  <Text style={s.scoreDesc}>All normal across hormones, vitals, sleep, activity and nutrition.</Text>
                  <View style={s.scoreTagsRow}>
                    <View style={s.scoreTag}><Text style={s.scoreTagText}>Cardiovascular ✓</Text></View>
                    <View style={s.scoreTag}><Text style={s.scoreTagText}>Testosterone ✓</Text></View>
                    <View style={s.scoreTag}><Text style={s.scoreTagText}>Sleep ✓</Text></View>
                  </View>
                </View>
              </View>

              <View style={s.quickStatsRow}>
                <View style={s.qStatBox}>
                  <Text style={s.qStatVal}>72</Text>
                  <Text style={s.qStatLbl}>RHR bpm</Text>
                </View>
                <View style={s.qStatBox}>
                  <Text style={s.qStatVal}>110/75</Text>
                  <Text style={s.qStatLbl}>BP</Text>
                </View>
                <View style={s.qStatBox}>
                  <Text style={s.qStatVal}>22.4</Text>
                  <Text style={s.qStatLbl}>BMI</Text>
                </View>
                <View style={s.qStatBox}>
                  <Text style={s.qStatVal}>14.2%</Text>
                  <Text style={s.qStatLbl}>Avg BF</Text>
                </View>
              </View>
            </GlassCardView>

            <SectionHeader title="Prostate & Reproductive Health" />
            <View style={s.rowGrid}>
              <GlassCardView style={[s.card, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={s.cardMiniLabel}>PSA SCORE</Text>
                <Text style={s.cardBigVal}>0.9<Text style={s.cardUnit}> ng/mL</Text></Text>
                <Text style={s.cardSubVal}>✓ Normal range</Text>
              </GlassCardView>
              <GlassCardView style={[s.card, { flex: 1, marginLeft: Spacing.sm }]}>
                <Text style={s.cardMiniLabel}>SPERM HEALTH</Text>
                <Text style={[s.cardBigVal, { color: Colors.teal }]}>Good</Text>
                <Text style={s.cardSubVal}>Last checked May</Text>
              </GlassCardView>
            </View>

            <MentalHealthSection moodLogs={moodLogs} />
            <SleepTrackerSection sleepLogs={sleepLogs} />
            <PreventiveCareSection />
        </>)}

        {activeTab === 'Hormones' && (<>
            <SectionHeader title="Testosterone & Hormones" />
            <GlassCardView style={s.card}>
              <View style={s.fertHeader}>
                <View>
                  <Text style={s.promptText}>Total testosterone</Text>
                  <Text style={s.cardMiniLabel}>Last tested: Jun 10 · Via blood panel</Text>
                </View>
                <View style={[s.fertBadge, { backgroundColor: Colors.success + '20', borderColor: Colors.success + '55' }]}>
                  <Text style={[s.fertBadgeText, { color: Colors.success }]}>✓ Normal range</Text>
                </View>
              </View>

              <View style={s.tBarContainer}>
                <View style={s.tBarLabels}>
                  <Text style={s.tBarEdge}>300 ng/dL</Text>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={s.tBarCenterVal}>620 ng/dL</Text>
                    <Text style={s.tBarCenterSub}>Optimal range</Text>
                  </View>
                  <Text style={s.tBarEdge}>1000 ng/dL</Text>
                </View>
                <View style={s.tBarTrack}>
                  <View style={s.tBarFill} />
                  <View style={s.tBarMarker} />
                </View>
                <View style={s.tBarLimits}>
                  <Text style={[s.tBarLimitTxt, { color: Colors.pink }]}>Low</Text>
                  <Text style={[s.tBarLimitTxt, { color: Colors.amber }]}>High</Text>
                </View>
              </View>

              <HormoneRangeBar label="Free testosterone" value="Normal" status="Normal" statusColor={Colors.success} currentPct={0.5} />
              <HormoneRangeBar label="DHEA-S" value="Normal" status="Normal" statusColor={Colors.success} currentPct={0.6} />
              <HormoneRangeBar label="LH (Luteinizing)" value="Normal" status="Normal" statusColor={Colors.success} currentPct={0.4} />
              <HormoneRangeBar label="Cortisol" value="Elevated" status="Elevated ↑" statusColor={Colors.amber} currentPct={0.8} />
              <HormoneRangeBar label="Estradiol (E2)" value="Low Normal" status="Low Normal" statusColor={Colors.success} currentPct={0.2} />
              <HormoneRangeBar label="PSA (prostate)" value="0.9" unit="ng/mL" status="Optimal ✓" statusColor={Colors.success} currentPct={0.1} />

              <View style={s.infoBox}>
                <Text style={s.infoText}>💡 Elevated cortisol can suppress testosterone over time. AI recommends reviewing sleep quality and stress load. Upload latest lab report for precise tracking.</Text>
              </View>
            </GlassCardView>
        </>)}

        {activeTab === 'Vitals' && (<>
            <SectionHeader title="Cardiovascular Risk" />
            <GlassCardView style={s.card}>
              <View style={s.fertHeader}>
                <Text style={s.promptText}>10-year heart risk</Text>
                <View style={[s.fertBadge, { backgroundColor: Colors.success + '20', borderColor: Colors.success + '55' }]}>
                  <Text style={[s.fertBadgeText, { color: Colors.success }]}>Low risk · 4%</Text>
                </View>
              </View>

              <View style={s.gridRow}>
                <View style={s.gridItem}>
                  <Text style={s.cardMiniLabel}>LDL CHOLESTEROL</Text>
                  <Text style={s.gridVal}>98 <Text style={s.gridUnit}>mg/dL</Text></Text>
                  <Text style={[s.gridStat, { color: Colors.success }]}>Optimal</Text>
                </View>
                <View style={s.gridItem}>
                  <Text style={s.cardMiniLabel}>HDL CHOLESTEROL</Text>
                  <Text style={s.gridVal}>58 <Text style={s.gridUnit}>mg/dL</Text></Text>
                  <Text style={[s.gridStat, { color: Colors.success }]}>Good</Text>
                </View>
              </View>
              <View style={s.gridRow}>
                <View style={s.gridItem}>
                  <Text style={s.cardMiniLabel}>TRIGLYCERIDES</Text>
                  <Text style={s.gridVal}>142 <Text style={s.gridUnit}>mg/dL</Text></Text>
                  <Text style={[s.gridStat, { color: Colors.amber }]}>Borderline</Text>
                </View>
                <View style={s.gridItem}>
                  <Text style={s.cardMiniLabel}>BLOOD GLUCOSE</Text>
                  <Text style={s.gridVal}>94 <Text style={s.gridUnit}>mg/dL</Text></Text>
                  <Text style={[s.gridStat, { color: Colors.success }]}>Normal</Text>
                </View>
              </View>

              <View style={s.infoBox}>
                <Text style={s.infoText}>⚠️ Triglycerides are slightly elevated. AI links this to your recent high-carb diet days. Reducing refined carbs and increasing omega-3 intake can help lower it within 4-6 weeks.</Text>
              </View>
            </GlassCardView>

            <VitalsDashboardSection />
        </>)}

        {/* Common AI Insights at bottom of all tabs */}
        <View style={{ marginTop: Spacing.xl }}>
          <AIHealthInsightsSection mode="male" />
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

  scoreTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  gaugeWrap: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  gaugeTrack: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: Colors.bgCardBorder, borderBottomColor: 'transparent', transform: [{ rotate: '-45deg' }] },
  gaugeFill: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: Colors.teal, borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '-45deg' }] },
  gaugeScore: { fontSize: 32, fontWeight: Typography.extraBold, color: Colors.textPrimary },
  gaugeTotal: { fontSize: 10, color: Colors.textMuted, marginTop: -4 },

  scoreInfoWrap: { flex: 1, marginLeft: Spacing.lg },
  scoreTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  scorePtsBadge: { backgroundColor: Colors.success + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  scorePtsText: { color: Colors.success, fontSize: 10, fontWeight: Typography.bold },
  scoreDesc: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: Spacing.sm },
  scoreTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scoreTag: { backgroundColor: Colors.teal + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  scoreTagText: { fontSize: 9, color: Colors.teal, fontWeight: Typography.medium },

  quickStatsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: Spacing.md },
  qStatBox: { alignItems: 'center' },
  qStatVal: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  qStatLbl: { fontSize: 10, color: Colors.textMuted },

  rowGrid: { flexDirection: 'row', marginBottom: Spacing.xl },
  cardMiniLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  cardBigVal: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary },
  cardUnit: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textSecondary },
  cardSubVal: { fontSize: Typography.xs, color: Colors.success, marginTop: 4, fontWeight: Typography.medium },

  fertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  promptText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary, marginBottom: 2 },
  fertBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  fertBadgeText: { fontSize: 9, fontWeight: Typography.bold },

  tBarContainer: { marginBottom: Spacing.xl, marginTop: Spacing.sm },
  tBarLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  tBarEdge: { fontSize: 10, color: Colors.textMuted },
  tBarCenterVal: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.teal },
  tBarCenterSub: { fontSize: 10, color: Colors.teal },
  tBarTrack: { height: 12, backgroundColor: Colors.bgCardBorder, borderRadius: 6, position: 'relative' },
  tBarFill: { position: 'absolute', left: '15%', right: '15%', height: '100%', backgroundColor: Colors.teal + '40', borderRadius: 6 },
  tBarMarker: { position: 'absolute', left: '55%', top: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.teal, borderWidth: 3, borderColor: Colors.bg },
  tBarLimits: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tBarLimitTxt: { fontSize: 9, fontWeight: Typography.bold },

  gridRow: { flexDirection: 'row', marginBottom: Spacing.base },
  gridItem: { flex: 1, backgroundColor: Colors.bgCardBorder + '50', padding: Spacing.md, borderRadius: Radius.md, marginRight: Spacing.sm },
  gridVal: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  gridUnit: { fontSize: Typography.xs, color: Colors.textMuted },
  gridStat: { fontSize: Typography.sm, fontWeight: Typography.semiBold, marginTop: 4 },

  infoBox: { backgroundColor: Colors.amber + '10', borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.amber + '20' },
  infoText: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
});
