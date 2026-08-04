import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  RefreshControl,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Svg, { Circle, Rect, Line, Polyline, Defs, LinearGradient, Stop, Path, G, Text as SvgText } from 'react-native-svg';
import { Typography, Spacing, Radius } from '../../theme/theme';
import {
  GlassCardView,
  SectionHeader,
  ProfileAvatarButton,
  NotificationIconButton,
} from '../../components/SharedComponents';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import { useNotifications } from '../../providers/NotificationContext';
import {
  InnerTabBar,
  HormoneRangeBar,
  QuickActionButton,
  SleepTrackerSection,
  MentalHealthSection,
  VitalsDashboardSection,
  AIHealthInsightsSection,
} from './HealthCommonSections';
import { CyclePhaseVisualizer } from '../../components/CyclePhaseVisualizer';
import { useAuth } from '../../providers/AuthProvider';
import { usePreferences } from '../../providers/PreferencesContext';
import { HealthLogDraft } from './HealthLogScreen';
import {
  getPeriodLogs,
  getMoodLogs,
  getDischargeLogs,
  getSymptomsLogs,
  getInsights,
  getLatestCycle,
  getCycleHistory,
  getSleepLogs,
  getWeightLogs,
  saveWeightLog,
  saveCycle,
} from '../../services/healthService';
import type { PeriodLog, MoodLog, DischargeLog, SymptomsLog, CycleInsight, CycleData, CycleHistoryEntry, SleepLog, WeightEntry } from '../../types/health';
import { useTheme, useStyles } from '../../providers/ThemeProvider';

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

// ─── Helpers Components ───────────────────────────────────────────────────────
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function CycleAnalyticsChart({ cycleHistory }: { cycleHistory: CycleHistoryEntry[] }) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<number | null>(
    cycleHistory.length > 0 ? cycleHistory.length - 1 : null,
  );

  const data = cycleHistory.map(c => {
    const d = new Date(c.start_date);
    return {
      label: MONTH_SHORT[d.getMonth()],
      cycle: c.cycle_length,
      period: c.period_length,
    };
  });

  const isEmpty = data.length === 0;
  const svgWidth = 300;
  const svgHeight = 170;
  const pl = 30;
  const pr = 20;
  const pt = 16;
  const pb = 24;
  const pw = svgWidth - pl - pr;
  const ph = svgHeight - pt - pb;

  const cycleMin = isEmpty ? 24 : Math.min(...data.map(d => d.cycle)) - 2;
  const cycleMax = isEmpty ? 34 : Math.max(...data.map(d => d.cycle)) + 2;
  const periodMax = isEmpty ? 8 : Math.max(...data.map(d => d.period)) + 1;
  const barWidth = 18;
  const colW = data.length > 0 ? pw / data.length : pw;

  const getX = (i: number) => pl + (i + 0.5) * colW;
  const getPeriodY = (v: number) => svgHeight - pb - (v / periodMax) * ph;
  const getCycleY = (v: number) => svgHeight - pb - ((v - cycleMin) / (cycleMax - cycleMin)) * ph;

  const linePoints = data.map((d, i) => `${getX(i)},${getCycleY(d.cycle)}`).join(' ');

  if (isEmpty) {
    return (
      <View style={{ marginTop: 16, alignItems: 'center', paddingVertical: 30 }}>
        <Text style={{ fontSize: Typography.sm, color: theme.colors.textMuted }}>No cycle history yet. Log your periods to see trends.</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', gap: 20, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, backgroundColor: theme.colors.pink + '60', borderRadius: 2 }} />
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: Typography.medium }}>Period</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 2.5, backgroundColor: theme.colors.teal, borderRadius: 1 }} />
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: Typography.medium }}>Cycle</Text>
        </View>
      </View>

      <View>
        <Svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <Defs>
            <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.pink} stopOpacity={0.7} />
              <Stop offset="100%" stopColor={theme.colors.pink} stopOpacity={0.15} />
            </LinearGradient>
          </Defs>

          {[0, Math.round(periodMax / 2), periodMax].map((v) => {
            const y = getPeriodY(v);
            return (
              <G key={`grid-${v}`}>
                <Line x1={pl} y1={y} x2={svgWidth - pr} y2={y} stroke={theme.colors.divider} strokeWidth={0.8} />
                <SvgText x={pl - 6} y={y + 3.5} fill={theme.colors.textMuted} fontSize="9" textAnchor="end">
                  {v}
                </SvgText>
              </G>
            );
          })}

          {data.map((d, i) => {
            const cx = getX(i);
            const barY = getPeriodY(d.period);
            const barH = svgHeight - pb - barY;
            return (
              <Rect
                key={`bar-${i}`}
                x={cx - barWidth / 2}
                y={barY}
                width={barWidth}
                height={Math.max(0, barH)}
                fill={selected === i ? theme.colors.pink : 'url(#barGrad)'}
                opacity={selected !== null && selected !== i ? 0.4 : 1}
                rx={3}
              />
            );
          })}

          <Polyline points={linePoints} fill="none" stroke={theme.colors.teal} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={selected !== null ? 0.4 : 1} />

          {data.map((d, i) => (
            <Circle key={`dot-${i}`} cx={getX(i)} cy={getCycleY(d.cycle)} r={3.5} fill={theme.colors.bg} stroke={theme.colors.teal} strokeWidth={2} opacity={selected !== null && selected !== i ? 0.4 : 1} />
          ))}

          {data.map((d, i) => (
            <SvgText key={`lbl-${i}`} x={getX(i)} y={svgHeight - 6} fill={selected === i ? theme.colors.textPrimary : theme.colors.textSecondary} fontSize="11" fontWeight={selected === i ? 'bold' : '600'} textAnchor="middle">
              {d.label}
            </SvgText>
          ))}

          {selected !== null && data[selected] && (() => {
            const d = data[selected];
            const cx = getX(selected);
            const barY = getPeriodY(d.period);
            const tipW = 64;
            const tipH = 34;
            const tipX = Math.max(pl, Math.min(cx - tipW / 2, svgWidth - pr - tipW));
            const tipY = barY - tipH - 8;
            return (
              <G>
                <Rect x={tipX} y={tipY} width={tipW} height={tipH} rx={6} fill={theme.colors.modalBg} stroke={theme.colors.bgCardBorder} strokeWidth={1} />
                <SvgText x={tipX + 8} y={tipY + 13} fill={theme.colors.pink} fontSize="10" fontWeight="bold">
                  {d.period}d period
                </SvgText>
                <SvgText x={tipX + 8} y={tipY + 27} fill={theme.colors.teal} fontSize="10" fontWeight="bold">
                  {d.cycle}d cycle
                </SvgText>
              </G>
            );
          })()}
        </Svg>

        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' }}>
          {data.map((_, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => setSelected(prev => prev === i ? null : i)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function SleepCycleCorrelationChart({ sleepLogs, cycleData }: { sleepLogs: SleepLog[]; cycleData: CycleData | null }) {
  const { theme } = useTheme();

  const phaseData = useMemo(() => {
    if (!cycleData || sleepLogs.length === 0) return null;

    const cycleStart = new Date(cycleData.start_date).getTime();
    const cycleLen = cycleData.avg_cycle_length || 28;
    const periodEnd = Math.min(cycleData.period_length || 5, Math.round(cycleLen * 0.18));
    const ovStart = Math.round(cycleLen * 0.43);
    const ovEnd = Math.round(cycleLen * 0.54);

    const phaseSums: Record<string, { total: number; count: number }> = {
      Menstrual: { total: 0, count: 0 },
      Follicular: { total: 0, count: 0 },
      Ovulation: { total: 0, count: 0 },
      Luteal: { total: 0, count: 0 },
    };

    sleepLogs.forEach(log => {
      const logDate = new Date(log.date).getTime();
      const dayInCycle = ((logDate - cycleStart) / (1000 * 60 * 60 * 24)) % cycleLen;
      const day = dayInCycle >= 0 ? dayInCycle : dayInCycle + cycleLen;

      let phase: string;
      if (day <= periodEnd) phase = 'Menstrual';
      else if (day < ovStart) phase = 'Follicular';
      else if (day <= ovEnd) phase = 'Ovulation';
      else phase = 'Luteal';

      phaseSums[phase].total += log.sleep_hr;
      phaseSums[phase].count += 1;
    });

    return [
      { phase: 'Menstrual', hours: phaseSums.Menstrual.count > 0 ? +(phaseSums.Menstrual.total / phaseSums.Menstrual.count).toFixed(1) : 0, color: theme.colors.pink, count: phaseSums.Menstrual.count },
      { phase: 'Follicular', hours: phaseSums.Follicular.count > 0 ? +(phaseSums.Follicular.total / phaseSums.Follicular.count).toFixed(1) : 0, color: theme.colors.follicular, count: phaseSums.Follicular.count },
      { phase: 'Ovulation', hours: phaseSums.Ovulation.count > 0 ? +(phaseSums.Ovulation.total / phaseSums.Ovulation.count).toFixed(1) : 0, color: theme.colors.amber, count: phaseSums.Ovulation.count },
      { phase: 'Luteal', hours: phaseSums.Luteal.count > 0 ? +(phaseSums.Luteal.total / phaseSums.Luteal.count).toFixed(1) : 0, color: theme.colors.purple, count: phaseSums.Luteal.count },
    ];
  }, [sleepLogs, cycleData, theme]);

  const svgWidth = 320;
  const svgHeight = 160;
  const barPadding = 14;
  const barHeight = 20;
  const labelWidth = 85;
  const chartWidth = svgWidth - labelWidth - 50;

  const hasData = phaseData && phaseData.some((d: { count: number }) => d.count > 0);

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: Typography.sm, color: theme.colors.textSecondary, fontWeight: Typography.semiBold, marginBottom: 12 }}>
        Sleep Duration vs Cycle Phase
      </Text>
      {!hasData ? (
        <Text style={{ fontSize: Typography.sm, color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>
          Log sleep across different cycle phases to see correlation.
        </Text>
      ) : (
        <Svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          {phaseData!.map((d: { phase: string; hours: number; color: string; count: number }, i: number) => {
            const y = i * (barHeight + barPadding) + 10;
            const progressWidth = d.count > 0 ? (d.hours / 10) * chartWidth : 0;
            return (
              <G key={d.phase}>
                <SvgText
                  x={labelWidth - 10}
                  y={y + 14}
                  fill={theme.colors.textSecondary}
                  fontSize="12"
                  fontWeight="500"
                  textAnchor="end"
                >
                  {d.phase}
                </SvgText>
                <Rect
                  x={labelWidth}
                  y={y}
                  width={chartWidth}
                  height={barHeight}
                  fill={theme.colors.bgCardBorder}
                  rx={barHeight / 2}
                />
                <Rect
                  x={labelWidth}
                  y={y}
                  width={progressWidth}
                  height={barHeight}
                  fill={d.color}
                  rx={barHeight / 2}
                />
                <SvgText
                  x={labelWidth + progressWidth + 8}
                  y={y + 14}
                  fill={theme.colors.textPrimary}
                  fontSize="12"
                  fontWeight="bold"
                >
                  {d.count > 0 ? `${d.hours} hrs` : '—'}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

function WeightFluctuationChart({
  weightLogs,
  cycleData,
  onLogWeight,
}: {
  weightLogs: WeightEntry[];
  cycleData: CycleData | null;
  onLogWeight: () => void;
}) {
  const { theme } = useTheme();
  const svgWidth = 300;
  const svgHeight = 160;
  const pl = 30;
  const pr = 16;
  const pt = 20;
  const pb = 24;
  const pw = svgWidth - pl - pr;
  const ph = svgHeight - pt - pb;

  const hasData = weightLogs.length >= 2;

  const latest = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;
  const prev = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2] : null;
  const change = latest && prev ? +(latest.weight_kg - prev.weight_kg).toFixed(1) : 0;

  const getX = (i: number) => pl + (i / Math.max(1, weightLogs.length - 1)) * pw;

  const minW = hasData ? Math.min(...weightLogs.map(w => w.weight_kg)) - 1 : 60;
  const maxW = hasData ? Math.max(...weightLogs.map(w => w.weight_kg)) + 1 : 80;
  const getY = (v: number) => pt + ph - ((v - minW) / (maxW - minW)) * ph;

  const linePoints = weightLogs.map((w, i) => `${getX(i)},${getY(w.weight_kg)}`).join(' ');

  const areaPath = hasData
    ? `M ${getX(0)},${getY(weightLogs[0].weight_kg)} ` +
    weightLogs.slice(1).map((w, i) => `L ${getX(i + 1)},${getY(w.weight_kg)}`).join(' ') +
    ` L ${getX(weightLogs.length - 1)},${svgHeight - pb} L ${getX(0)},${svgHeight - pb} Z`
    : '';

  const phaseBands = useMemo(() => {
    if (!cycleData || weightLogs.length === 0) return [];
    const cycleStart = new Date(cycleData.start_date).getTime();
    const cycleLen = cycleData.avg_cycle_length || 28;
    const periodEnd = Math.round(cycleLen * 0.18);
    const ovStart = Math.round(cycleLen * 0.43);
    const ovEnd = Math.round(cycleLen * 0.54);

    const bands: { start: number; end: number; color: string }[] = [];
    const logStart = new Date(weightLogs[0].date).getTime();
    const logEnd = new Date(weightLogs[weightLogs.length - 1].date).getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    let cycleDay = cycleStart;
    while (cycleDay < logEnd + cycleLen * dayMs) {
      const phases = [
        { start: 0, end: periodEnd, color: theme.colors.pink },
        { start: periodEnd, end: ovStart, color: theme.colors.follicular },
        { start: ovStart, end: ovEnd, color: theme.colors.amber },
        { start: ovEnd, end: cycleLen, color: theme.colors.purple },
      ];
      for (const phase of phases) {
        const pStart = cycleDay + phase.start * dayMs;
        const pEnd = cycleDay + phase.end * dayMs;
        if (pEnd > logStart && pStart < logEnd) {
          const x1 = Math.max(pl, pl + ((pStart - logStart) / (logEnd - logStart)) * pw);
          const x2 = Math.min(pl + pw, pl + ((pEnd - logStart) / (logEnd - logStart)) * pw);
          if (x2 > x1) {
            bands.push({ start: x1, end: x2, color: phase.color });
          }
        }
      }
      cycleDay += cycleLen * dayMs;
    }
    return bands;
  }, [weightLogs, cycleData, theme]);

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View>
          {latest && (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ fontSize: Typography.xl, fontWeight: Typography.extraBold, color: theme.colors.textPrimary }}>
                {latest.weight_kg}
              </Text>
              <Text style={{ fontSize: Typography.sm, color: theme.colors.textSecondary, fontWeight: Typography.medium }}>kg</Text>
              {change !== 0 && (
                <Text style={{ fontSize: Typography.sm, color: change > 0 ? theme.colors.amber : theme.colors.success, fontWeight: Typography.bold }}>
                  {change > 0 ? '+' : ''}{change}
                </Text>
              )}
            </View>
          )}
          <Text style={{ fontSize: Typography.xs, color: theme.colors.textMuted, marginTop: 2 }}>
            {weightLogs.length} entries logged
          </Text>
        </View>
        <TouchableOpacity
          onPress={onLogWeight}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.colors.teal + '18', borderWidth: 1, borderColor: theme.colors.teal + '50' }}>
          <Text style={{ fontSize: Typography.sm, color: theme.colors.teal, fontWeight: Typography.semiBold }}>+ Log</Text>
        </TouchableOpacity>
      </View>

      {!hasData ? (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ fontSize: Typography.sm, color: theme.colors.textMuted }}>Log your weight to see the fluctuation chart.</Text>
        </View>
      ) : (
        <Svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <Defs>
            <LinearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.teal} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={theme.colors.teal} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {phaseBands.map((band, i) => (
            <Rect key={`pb-${i}`} x={band.start} y={pt} width={band.end - band.start} height={ph} fill={band.color} opacity={0.06} />
          ))}

          {[minW, (minW + maxW) / 2, maxW].map((v, i) => {
            const y = getY(v);
            return (
              <G key={`yg-${i}`}>
                <Line x1={pl} y1={y} x2={svgWidth - pr} y2={y} stroke={theme.colors.divider} strokeWidth={0.6} />
                <SvgText x={pl - 5} y={y + 3} fill={theme.colors.textMuted} fontSize="9" textAnchor="end">
                  {v.toFixed(0)}
                </SvgText>
              </G>
            );
          })}

          <Path d={areaPath} fill="url(#weightAreaGrad)" />

          <Polyline points={linePoints} fill="none" stroke={theme.colors.teal} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {weightLogs.map((w, i) => (
            <Circle key={`wd-${i}`} cx={getX(i)} cy={getY(w.weight_kg)} r={3} fill={theme.colors.bg} stroke={theme.colors.teal} strokeWidth={2} />
          ))}

          {weightLogs.map((w, i) => {
            const show = weightLogs.length <= 7 || i % Math.ceil(weightLogs.length / 7) === 0 || i === weightLogs.length - 1;
            if (!show) return null;
            const d = new Date(w.date);
            return (
              <SvgText key={`wl-${i}`} x={getX(i)} y={svgHeight - 6} fill={theme.colors.textMuted} fontSize="9" textAnchor="middle">
                {MONTH_SHORT[d.getMonth()]} {d.getDate()}
              </SvgText>
            );
          })}
        </Svg>
      )}
    </View>
  );
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
  const { theme } = useTheme();
  const { onScroll } = useScrollVisibility();
  const { user, session } = useAuth();
  const { hideVitals } = usePreferences();
  const { unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPhase, setSelectedPhase] = useState('Luteal');
  const [hasTodayLog, setHasTodayLog] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // ── Data state ──────────────────────────────────────────────────────────
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [dischargeLogs, setDischargeLogs] = useState<DischargeLog[]>([]);
  const [symptomsLogs, setSymptomsLogs] = useState<SymptomsLog[]>([]);
  const [insights, setInsights] = useState<CycleInsight[]>([]);
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [cycleHistory, setCycleHistory] = useState<CycleHistoryEntry[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Cycle setup modal state ──────────────────────────────────────────────
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [setupStartDate, setSetupStartDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [setupCycleLength, setSetupCycleLength] = useState('28');
  const [setupPeriodLength, setSetupPeriodLength] = useState('5');
  const [setupRegularity, setSetupRegularity] = useState<'regular' | 'irregular' | 'not_sure'>('not_sure');
  const [savingCycle, setSavingCycle] = useState(false);

  // ── Weight log modal state ─────────────────────────────────────────────
  const [showWeightLog, setShowWeightLog] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  // ── Styles ─────────────────────────────────────────────────────────────
  const s = useStyles((t) => StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },
    scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, flexGrow: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: t.colors.textPrimary },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    card: { padding: Spacing.base, marginBottom: Spacing.xl },
    logCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.colors.pink + '18',
      borderWidth: 1,
      borderColor: t.colors.pink + '45',
      borderRadius: Radius.lg,
      padding: Spacing.base,
      marginBottom: Spacing.xl,
    },
    logCtaCopy: { flex: 1, paddingRight: Spacing.md },
    logCtaTitle: { fontSize: Typography.md, color: t.colors.textPrimary, fontWeight: Typography.bold },
    logCtaSub: { fontSize: Typography.xs, color: t.colors.textSecondary, marginTop: 3 },
    logCtaIcon: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', textAlign: 'center', lineHeight: 33, backgroundColor: t.colors.pink, color: t.colors.bg, fontSize: Typography.xl, fontWeight: Typography.bold },
    cycleTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
    cycleRingWrap: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cycleRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: t.colors.bgCardBorder },
    cycleRingCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    ringDay: { fontSize: Typography.base, fontWeight: Typography.bold, color: t.colors.textPrimary },
    ringSub: { fontSize: Typography.micro, color: t.colors.textSecondary },
    cycleInfoWrap: { flex: 1, marginLeft: Spacing.lg },
    cyclePhaseLabel: { fontSize: Typography.xs, color: t.colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
    phaseNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    phaseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    phaseName: { fontSize: Typography.xl, fontWeight: Typography.extraBold },
    cycleStatsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    cycleStatLabel: { width: '50%', fontSize: Typography.xs, color: t.colors.textMuted, marginBottom: 2 },
    cycleStatVal: { width: '50%', fontSize: Typography.xs, fontWeight: Typography.bold, color: t.colors.textPrimary, marginBottom: 2, textAlign: 'right' },
    phaseBtnRow: { flexDirection: 'row', gap: Spacing.sm },
    phaseGap: { width: Spacing.sm },

    trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
    trendTitle: { fontSize: Typography.base, color: t.colors.textPrimary, fontWeight: Typography.bold },
    trendSub: { fontSize: Typography.xs, color: t.colors.textMuted, marginTop: 2 },
    trendScore: { fontSize: Typography.sm, color: t.colors.pink, fontWeight: Typography.bold },
    moodChart: { flexDirection: 'row', alignItems: 'flex-end', height: 92, gap: Spacing.sm },
    chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    moodTrack: { width: '100%', height: 68, borderRadius: Radius.sm, backgroundColor: t.colors.bgCardBorder, justifyContent: 'flex-end', overflow: 'hidden' },
    moodBar: { width: '100%', borderRadius: Radius.sm },
    chartLabel: { fontSize: Typography.xs, color: t.colors.textMuted, marginTop: 5, fontWeight: Typography.semiBold },
    softDivider: { height: 1, backgroundColor: t.colors.divider, marginVertical: Spacing.lg },
    flowTrendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
    flowTrendItem: { flex: 1, alignItems: 'center' },
    flowTrack: { width: 26, height: 64, borderRadius: Radius.sm, backgroundColor: t.colors.bgCardBorder, justifyContent: 'flex-end', overflow: 'hidden' },
    flowTrendFill: { width: '100%', backgroundColor: t.colors.pink },
    signalRow: { flexDirection: 'row', alignItems: 'center' },
    signalIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.purple + '20' },
    signalIconText: { color: t.colors.purple, fontSize: Typography.lg },
    signalCopy: { flex: 1, marginLeft: Spacing.md },
    signalTitle: { fontSize: Typography.base, color: t.colors.textPrimary, fontWeight: Typography.bold },
    signalText: { fontSize: Typography.xs, color: t.colors.textSecondary, lineHeight: 18, marginTop: 3 },
    patternGrid: { flexDirection: 'row', gap: Spacing.sm },
    patternItem: { flex: 1, borderWidth: 1, borderColor: t.colors.bgCardBorder, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: t.colors.bgCard },
    patternLabel: { fontSize: Typography.xs, color: t.colors.textMuted, textTransform: 'uppercase', marginBottom: 5 },
    patternValue: { fontSize: Typography.sm, color: t.colors.textPrimary, fontWeight: Typography.bold },
    promptText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary, marginBottom: Spacing.md },
    fertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
    fertTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: t.colors.textPrimary },
    fertSub: { fontSize: Typography.xs, color: t.colors.textMuted, marginTop: 2 },
    fertBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
    fertBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    fertGridRow: { flexDirection: 'row', gap: Spacing.sm },
    fertBox: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
    fertBoxTitle: { fontSize: Typography.xs, fontWeight: Typography.semiBold, marginBottom: 4, textAlign: 'center' },
    fertBoxVal: { fontSize: Typography.lg, fontWeight: Typography.bold, marginBottom: 4, textAlign: 'center' },
    fertBoxSub: { fontSize: Typography.xs, color: t.colors.textMuted, textAlign: 'center' },
    infoBox: { backgroundColor: t.colors.amber + '10', borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: t.colors.amber + '20' },
    infoText: { fontSize: Typography.xs, color: t.colors.textSecondary, lineHeight: 18 },
    aiWrap: { marginTop: Spacing.xl },
    bottomSpace: { height: 100 },

    // Cycle Setup Banner
    cycleSetupBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.pink + '18',
      borderWidth: 1,
      borderColor: t.colors.pink + '45',
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
      backgroundColor: t.colors.pink + '22',
      marginRight: Spacing.md,
    },
    cycleSetupBannerCopy: { flex: 1 },
    cycleSetupBannerTitle: { fontSize: Typography.md, color: t.colors.textPrimary, fontWeight: Typography.bold },
    cycleSetupBannerSub: { fontSize: Typography.xs, color: t.colors.textSecondary, marginTop: 2 },
    cycleSetupBannerArrow: { fontSize: Typography.xxl, color: t.colors.pink, fontWeight: Typography.bold, marginLeft: Spacing.sm },

    // Cycle Setup Modal
    modalOverlay: { flex: 1, backgroundColor: t.colors.overlayHeavy, justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: t.colors.modalBg,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.xl,
      paddingBottom: 40,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.textMuted, alignSelf: 'center', marginBottom: Spacing.lg },
    modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary, marginBottom: Spacing.xs },
    modalSubtitle: { fontSize: Typography.sm, color: t.colors.textMuted, marginBottom: Spacing.lg },
    modalLabel: { fontSize: Typography.sm, color: t.colors.textSecondary, fontWeight: Typography.medium, marginBottom: Spacing.sm, marginTop: Spacing.md },
    modalInput: {
      backgroundColor: t.colors.bgCard,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.md,
      padding: Spacing.md,
      color: t.colors.textPrimary,
      fontSize: Typography.base,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.xl },
    modalCancelBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, borderWidth: 1, borderColor: t.colors.bgCardBorder },
    modalCancelText: { color: t.colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semiBold },
    modalSaveBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, backgroundColor: t.colors.pink, alignItems: 'center', minWidth: 80 },
    modalSaveText: { color: t.colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },
    regularityRow: { flexDirection: 'row', gap: Spacing.sm },
    regularityBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      backgroundColor: t.colors.bgCard,
    },
    regularityBtnActive: { borderColor: t.colors.pink, backgroundColor: t.colors.pink + '18' },
    regularityBtnText: { fontSize: Typography.sm, color: t.colors.textSecondary, fontWeight: Typography.medium },
    regularityBtnTextActive: { color: t.colors.pink },
  }));

  // ── Fetch data on mount ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    setLoading(true);
    try {
      const safe = async <T,>(p: Promise<T>): Promise<T | null> => {
        try { return await p; } catch { return null; }
      };
      const [periods, moods, discharges, symptoms, ins, cycle, hist, sleeps, weights] = await Promise.all([
        safe(getPeriodLogs(token)),
        safe(getMoodLogs(token)),
        safe(getDischargeLogs(token)),
        safe(getSymptomsLogs(token)),
        safe(getInsights(token)),
        safe(getLatestCycle(token)),
        safe(getCycleHistory(token)),
        safe(getSleepLogs(token)),
        safe(getWeightLogs(token)),
      ]);
      setPeriodLogs(periods ?? []);
      setMoodLogs(moods ?? []);
      const today = new Date().toISOString().split('T')[0];
      setHasTodayLog((moods ?? []).some((log: any) => log.date === today));
      setDischargeLogs(discharges ?? []);
      setSymptomsLogs(symptoms ?? []);
      setInsights(ins ?? []);
      setCycleHistory(hist ?? []);
      setSleepLogs(sleeps ?? []);
      setWeightLogs(weights ?? []);
      if (cycle) setCycleData(cycle);
    } catch (err) {
      console.error('[HealthScreenFemale] Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const handleRefresh = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    setRefreshing(true);
    const safe = async <T,>(p: Promise<T>): Promise<T | null> => {
      try { return await p; } catch { return null; }
    };
    const [periods, moods, discharges, symptoms, ins, cycle, hist, sleeps, weights] = await Promise.all([
      safe(getPeriodLogs(token)),
      safe(getMoodLogs(token)),
      safe(getDischargeLogs(token)),
      safe(getSymptomsLogs(token)),
      safe(getInsights(token)),
      safe(getLatestCycle(token)),
      safe(getCycleHistory(token)),
      safe(getSleepLogs(token)),
      safe(getWeightLogs(token)),
    ]);
    setPeriodLogs(periods ?? []);
    setMoodLogs(moods ?? []);
    const today = new Date().toISOString().split('T')[0];
    setHasTodayLog((moods ?? []).some((log: any) => log.date === today));
    setDischargeLogs(discharges ?? []);
    setSymptomsLogs(symptoms ?? []);
    setInsights(ins ?? []);
    setCycleHistory(hist ?? []);
    setSleepLogs(sleeps ?? []);
    setWeightLogs(weights ?? []);
    if (cycle) setCycleData(cycle);
    setRefreshing(false);
  }, [session?.access_token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // ── Handle weight log save ──────────────────────────────────────────────
  const handleWeightLogSave = async () => {
    const token = session?.access_token;
    if (!token || !weightInput) return;
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) return;
    setSavingWeight(true);
    try {
      await saveWeightLog(token, { weight_kg: weight });
      setShowWeightLog(false);
      setWeightInput('');
      const updated = await getWeightLogs(token);
      setWeightLogs(updated);
    } catch (err: any) {
      console.error('[HealthScreenFemale] Failed to save weight:', err);
      Alert.alert('Save failed', err?.message || 'Could not save weight. Please try again.');
    } finally {
      setSavingWeight(false);
    }
  };

  // ── Cycle data from backend ──────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const cycleLength = cycleData?.avg_cycle_length || 28;
  const periodLen = cycleData?.period_length || 5;
  const cycleDay = cycleData?.current_cycle_day || 1;
  const currentPhase = cycleData?.current_phase || 'Menstrual';
  const phaseColor = cycleData?.phase_color || theme.colors.pink;
  const daysUntilNextPeriod = cycleData?.days_until_next_period || cycleLength;

  // ── Compute mood trend (last 7 days) ───────────────────────────────────
  const moodTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = SHORT_DAYS[d.getDay()];
    const log = moodLogs.find(m => m.date === dateStr);
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

  // ── Fertility data from insights ────────────────────────────────────────
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
      { label: 'Estrogen', value: 'Low', status: 'N/A', statusColor: theme.colors.amber, currentPct: 0 },
      { label: 'Progesterone', value: 'Low', status: 'N/A', statusColor: theme.colors.amber, currentPct: 0 },
      { label: 'LH Surge', value: 'Low', status: 'N/A', statusColor: theme.colors.success, currentPct: 0 },
      { label: 'Cortisol', value: 'Normal', status: 'N/A', statusColor: theme.colors.success, currentPct: 0 },
      { label: 'FSH', value: 'Normal', status: 'N/A', statusColor: theme.colors.success, currentPct: 0 },
    ];
    return [
      { label: 'Estrogen', value: h.estrogen.value, status: h.estrogen.status, statusColor: theme.colors.pink, currentPct: h.estrogen.pct },
      { label: 'Progesterone', value: h.progesterone.value, status: h.progesterone.status, statusColor: theme.colors.purple, currentPct: h.progesterone.pct },
      { label: 'LH Surge', value: h.lh_surge.value, status: h.lh_surge.status, statusColor: theme.colors.amber, currentPct: h.lh_surge.pct },
      { label: 'Cortisol', value: h.cortisol.value, status: h.cortisol.status, statusColor: theme.colors.success, currentPct: h.cortisol.pct },
      { label: 'FSH', value: h.fsh.value, status: h.fsh.status, statusColor: theme.colors.pink, currentPct: h.fsh.pct },
    ];
  })();

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTab]);

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.pink} />
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
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.teal, theme.colors.pink]} tintColor={theme.colors.teal} progressBackgroundColor={theme.colors.bgCard} />}>
        <View style={s.header}>
          <Text style={s.title}>Your Health</Text>
          <View style={s.headerActions}>
            <NotificationIconButton onPress={onNotificationsPress} unreadCount={unreadCount} />
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
              <Text style={{ fontSize: Typography.lg }}>🩸</Text>
            </View>
            <View style={s.cycleSetupBannerCopy}>
              <Text style={s.cycleSetupBannerTitle}>Set up your cycle</Text>
              <Text style={s.cycleSetupBannerSub}>Enter your last period start date to see accurate cycle tracking</Text>
            </View>
            <Text style={s.cycleSetupBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        <InnerTabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} accentColor={theme.colors.pink} />

        {/* Health log banner */}
        {lastHealthLog || hasTodayLog ? (
          <TouchableOpacity style={[s.logCta, { borderColor: theme.colors.success + '45', backgroundColor: theme.colors.success + '12' }]} onPress={onOpenHealthLog} activeOpacity={0.85}>
            <View style={[s.logCtaCopy, { flex: 1 }]}>
              <Text style={[s.logCtaTitle, { color: theme.colors.success }]}>Log added today</Text>
              <Text style={s.logCtaSub}>Tap here to view or edit your entry</Text>
            </View>
            <Text style={[s.logCtaIcon, { backgroundColor: theme.colors.success + '22', color: theme.colors.success }]}>✓</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.logCta} onPress={onOpenHealthLog} activeOpacity={0.85}>
            <View style={s.logCtaCopy}>
              <Text style={s.logCtaTitle}>Log today&apos;s health</Text>
              <Text style={s.logCtaSub}>Mood, flow, discharge, symptoms, sleep and vitals</Text>
            </View>
            <Text style={s.logCtaIcon}>+</Text>
          </TouchableOpacity>
        )}

        {activeTab === 'Overview' && (
          <>
            <SectionHeader title="Current Cycle" />
            <GlassCardView style={s.card}>
              <View style={s.cycleTopRow}>
                <View style={s.cycleRingWrap}>
                  <Svg width={120} height={120} viewBox="0 0 120 120">
                    <Defs>
                      <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor={phaseColor} stopOpacity={1} />
                        <Stop offset="100%" stopColor={phaseColor} stopOpacity={0.55} />
                      </LinearGradient>
                    </Defs>
                    <Circle
                      cx={60}
                      cy={60}
                      r={50}
                      stroke={phaseColor}
                      strokeWidth={1.5}
                      fill="none"
                      opacity={0.25}
                    />
                    <Circle
                      cx={60}
                      cy={60}
                      r={48}
                      stroke={theme.colors.bgCardBorder}
                      strokeWidth={6}
                      fill="none"
                    />
                    <Circle
                      cx={60}
                      cy={60}
                      r={48}
                      stroke="url(#ringGrad)"
                      strokeWidth={8}
                      fill="none"
                      strokeDasharray={301.6}
                      strokeDashoffset={301.6 * (1 - Math.min(cycleDay, cycleLength) / cycleLength)}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                  </Svg>
                  <View style={s.cycleRingCenter}>
                    <Text style={s.ringDay}>Day {cycleDay}</Text>
                    <Text style={s.ringSub}>of {cycleDay > cycleLength ? `${cycleLength}+` : cycleLength}</Text>
                  </View>
                </View>
                <View style={s.cycleInfoWrap}>
                  <Text style={s.cyclePhaseLabel}>Current phase</Text>
                  <View style={s.phaseNameRow}>
                    <View style={[s.phaseDot, { backgroundColor: phaseColor }]} />
                    <Text style={[s.phaseName, { color: phaseColor }]}>{currentPhase}</Text>
                  </View>
                  <View style={s.cycleStatsGrid}>
                    <Text style={s.cycleStatLabel}>Cycle day</Text>
                    <Text style={s.cycleStatVal}>{cycleDay} / {cycleDay > cycleLength ? `${cycleLength}+` : cycleLength}</Text>
                    <Text style={s.cycleStatLabel}>Next period</Text>
                    <Text style={[s.cycleStatVal, { color: theme.colors.pink }]}>{daysUntilNextPeriod <= 0 ? 'Overdue' : `${daysUntilNextPeriod} days away`}</Text>
                    <Text style={s.cycleStatLabel}>Cycle length</Text>
                    <Text style={s.cycleStatVal}>{cycleLength} days</Text>
                    <Text style={s.cycleStatLabel}>Period length</Text>
                    <Text style={s.cycleStatVal}>{periodLen} days</Text>
                  </View>
                </View>
              </View>

              <View style={s.phaseBtnRow}>
                <QuickActionButton icon="🩸" label="Menstrual" color={theme.colors.pink} active={selectedPhase === 'Menstrual'} onPress={() => setSelectedPhase('Menstrual')} />
                <View style={s.phaseGap} />
                <QuickActionButton icon="🌸" label="Follicular" color={theme.colors.pink + 'AA'} active={selectedPhase === 'Follicular'} onPress={() => setSelectedPhase('Follicular')} />
                <View style={s.phaseGap} />
                <QuickActionButton icon="✨" label="Ovulation" color={theme.colors.amber} active={selectedPhase === 'Ovulation'} onPress={() => setSelectedPhase('Ovulation')} />
                <View style={s.phaseGap} />
                <QuickActionButton icon="🌙" label="Luteal" color={theme.colors.purple} active={selectedPhase === 'Luteal'} onPress={() => setSelectedPhase('Luteal')} />
              </View>
            </GlassCardView>

            <SectionHeader title="Hormone Cycle" subtitle="Tap any day · Predicted model" />
            <View style={{ marginHorizontal: -Spacing.base }}>
              <CyclePhaseVisualizer cycleLength={cycleLength} currentDay={cycleDay} startDate={cycleData?.start_date} />
            </View>

            <SectionHeader title="Cycle Analytics" subtitle="Flow & history trends" />
            <GlassCardView style={s.card}>
              <View style={s.trendHeader}>
                <View>
                  <Text style={s.trendTitle}>Flow Pattern</Text>
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

              <View style={s.softDivider} />

              <Text style={[s.trendTitle, { marginBottom: 2 }]}>Cycle History Analytics</Text>
              <Text style={s.trendSub}>Cycle length vs period length (last 6 cycles)</Text>
              <CycleAnalyticsChart cycleHistory={cycleHistory} />
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

            <SleepTrackerSection sleepLogs={sleepLogs} />

            <SectionHeader title="Sleep Phase Analytics" subtitle="Correlation with cycle" />
            <GlassCardView style={s.card}>
              <SleepCycleCorrelationChart sleepLogs={sleepLogs} cycleData={cycleData} />
            </GlassCardView>

            <SectionHeader title="Mood & Stress Trends" subtitle="Daily stability metrics" />
            <GlassCardView style={s.card}>
              <View style={s.trendHeader}>
                <View>
                  <Text style={s.trendTitle}>Mood Stability</Text>
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
                            backgroundColor: i === moodTrend.length - 1 ? theme.colors.pink : theme.colors.pink + '70',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[s.chartLabel, i === moodTrend.length - 1 && { color: theme.colors.pink }]}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </GlassCardView>

            <MentalHealthSection moodLogs={moodLogs} />

            {!hideVitals && <VitalsDashboardSection />}
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
                <View style={[s.fertBadge, { backgroundColor: theme.colors.purple + '20', borderColor: theme.colors.purple + '55' }]}>
                  <Text style={[s.fertBadgeText, { color: theme.colors.purple }]}>% AI predicted</Text>
                </View>
              </View>
              {fertilityData ? (
                <View style={s.fertGridRow}>
                  <View style={[s.fertBox, { backgroundColor: theme.colors.pink + '15', borderColor: theme.colors.pink + '30' }]}>
                    <Text style={[s.fertBoxTitle, { color: theme.colors.pink }]}>Ovulation day</Text>
                    <Text style={[s.fertBoxVal, { color: theme.colors.pink }]}>{fertilityData.ovulationDay}</Text>
                    <Text style={s.fertBoxSub}>Peak fertility</Text>
                  </View>
                  <View style={[s.fertBox, { backgroundColor: theme.colors.amber + '15', borderColor: theme.colors.amber + '30' }]}>
                    <Text style={[s.fertBoxTitle, { color: theme.colors.amber }]}>Fertile window</Text>
                    <Text style={[s.fertBoxVal, { color: theme.colors.amber }]}>{fertilityData.fertileStart}-{fertilityData.fertileEnd}</Text>
                    <Text style={s.fertBoxSub}>5-day window</Text>
                  </View>
                  <View style={[s.fertBox, { backgroundColor: theme.colors.purple + '15', borderColor: theme.colors.purple + '30' }]}>
                    <Text style={[s.fertBoxTitle, { color: theme.colors.purple }]}>Pregnancy chance</Text>
                    <Text style={[s.fertBoxVal, { color: theme.colors.purple }]}>{fertilityData.pregnancyChance}</Text>
                    <Text style={s.fertBoxSub}>{fertilityData.isOvulationPassed ? 'Post ovulation' : 'Pre ovulation'}</Text>
                  </View>
                </View>
              ) : (
                <View style={s.fertGridRow}>
                  <View style={[s.fertBox, { backgroundColor: theme.colors.bgCardBorder + '50', borderColor: theme.colors.bgCardBorder }]}>
                    <Text style={[s.fertBoxTitle, { color: theme.colors.textMuted }]}>No data</Text>
                    <Text style={[s.fertBoxVal, { color: theme.colors.textMuted }]}>—</Text>
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
                <View style={[s.fertBadge, { backgroundColor: theme.colors.purple + '20', borderColor: theme.colors.purple + '55' }]}>
                  <Text style={[s.fertBadgeText, { color: theme.colors.purple }]}>% AI Modeled</Text>
                </View>
              </View>
              {hormoneBars.map(h => (
                <HormoneRangeBar key={h.label} {...h} />
              ))}

              <View style={s.infoBox}>
                <Text style={s.infoText}>These are AI estimated values based on cycle day {cycleDay}. For clinical accuracy, use a blood test or LH dips/ovulation swabs here.</Text>
              </View>
            </GlassCardView>

            <SectionHeader title="Weight Fluctuation" subtitle="Track changes over time" />
            <GlassCardView style={s.card}>
              <WeightFluctuationChart
                weightLogs={weightLogs}
                cycleData={cycleData}
                onLogWeight={() => {
                  setWeightInput(weightLogs.length > 0 ? String(weightLogs[weightLogs.length - 1].weight_kg) : '');
                  setShowWeightLog(true);
                }}
              />
            </GlassCardView>

            <View style={s.aiWrap}>
              <AIHealthInsightsSection mode="female" />
            </View>
          </>
        )}

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
            <TouchableOpacity
              style={s.modalInput}
              onPress={() => setShowStartDatePicker(true)}
              activeOpacity={0.7}>
              <Text style={{ color: setupStartDate ? theme.colors.text : theme.colors.textMuted, fontSize: Typography.md }}>
                {setupStartDate || 'Select date'}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={setupStartDate ? new Date(setupStartDate + 'T00:00:00') : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_: DateTimePickerEvent, selected?: Date) => {
                  if (Platform.OS === 'android') setShowStartDatePicker(false);
                  if (selected) {
                    const y = selected.getFullYear();
                    const m = String(selected.getMonth() + 1).padStart(2, '0');
                    const d = String(selected.getDate()).padStart(2, '0');
                    setSetupStartDate(`${y}-${m}-${d}`);
                  }
                }}
              />
            )}

            <Text style={s.modalLabel}>Average cycle length (days)</Text>
            <TextInput
              style={s.modalInput}
              value={setupCycleLength}
              onChangeText={setSetupCycleLength}
              placeholder="28"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
            />

            <Text style={s.modalLabel}>Average period length (days)</Text>
            <TextInput
              style={s.modalInput}
              value={setupPeriodLength}
              onChangeText={setSetupPeriodLength}
              placeholder="5"
              placeholderTextColor={theme.colors.textMuted}
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
                  <ActivityIndicator color={theme.colors.bg} size="small" />
                ) : (
                  <Text style={s.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weight Log Modal */}
      <Modal visible={showWeightLog} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Log Weight</Text>
            <Text style={s.modalSubtitle}>Track your weight over time</Text>

            <Text style={s.modalLabel}>Weight (kg)</Text>
            <TextInput
              style={s.modalInput}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="e.g. 65.5"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowWeightLog(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSaveBtn, savingWeight && { opacity: 0.6 }]}
                onPress={handleWeightLogSave}
                disabled={savingWeight || !weightInput}>
                {savingWeight ? (
                  <ActivityIndicator color={theme.colors.bg} size="small" />
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
