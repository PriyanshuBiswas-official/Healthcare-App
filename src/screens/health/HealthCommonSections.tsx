import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import type { SleepLog, MoodLog } from '../../types/health';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { GlassCardView, SectionHeader, ProgressBar } from '../../components/SharedComponents';
import { useTheme, useStyles } from '../../providers/ThemeProvider';

// ═══════════════════════════════════════════════════════════════════════════════
// Shared modal styles — used by SleepLogModal, JournalModal
// ═══════════════════════════════════════════════════════════════════════════════
const useModalStyles = () => useStyles((theme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: theme.colors.overlayHeavy, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.modalBg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, paddingBottom: 40, borderWidth: 1, borderColor: theme.colors.bgCardBorder,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.textMuted, alignSelf: 'center', marginBottom: Spacing.lg },
  title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary, marginBottom: Spacing.base },
  note: { fontSize: Typography.sm, color: theme.colors.textMuted, marginBottom: Spacing.base },
  fieldLabel: { fontSize: Typography.sm, color: theme.colors.textSecondary, fontWeight: Typography.medium, marginBottom: Spacing.sm, marginTop: Spacing.md },
  input: { backgroundColor: theme.colors.bgCard, borderWidth: 1, borderColor: theme.colors.bgCardBorder, borderRadius: Radius.md, padding: Spacing.md, color: theme.colors.textPrimary, fontSize: Typography.base },
  chipsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs, flexWrap: 'wrap' },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: theme.colors.bgCardBorder },
  chipText: { fontSize: Typography.sm, color: theme.colors.textSecondary, fontWeight: Typography.medium },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, borderWidth: 1, borderColor: theme.colors.bgCardBorder },
  cancelText: { color: theme.colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semiBold },
  saveBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Radius.full },
  saveText: { color: theme.colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },
}));

// ═══════════════════════════════════════════════════════════════════════════════
// InnerTabBar — horizontal sub-navigation used inside both health screens
// ═══════════════════════════════════════════════════════════════════════════════
interface InnerTabBarProps {
  tabs: string[];
  active: string;
  onSelect: (tab: string) => void;
  accentColor?: string;
}
export const InnerTabBar: React.FC<InnerTabBarProps> = ({
  tabs, active, onSelect, accentColor,
}) => {
  const { theme } = useTheme();
  const itb = useStyles((t) => StyleSheet.create({
    wrapper: { marginBottom: Spacing.xl },
    row: {
      flexDirection: 'row',
      backgroundColor: t.colors.bgCard,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.lg,
      padding: 4
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: Radius.md
    },
    tabActive: {
      backgroundColor: t.colors.bgCardBorder,
    },
    label: {
      fontSize: Typography.sm,
      color: t.colors.textMuted,
      fontWeight: Typography.semiBold
    },
    labelActive: {
      color: t.colors.textPrimary
    },
  }));
  return (
    <View style={itb.wrapper}>
      <View style={itb.row}>
        {tabs.map(tab => {
          const isActive = active === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onSelect(tab)}
              activeOpacity={0.8}
              style={[
                itb.tab,
                isActive && itb.tabActive,
              ]}>
              <Text style={[itb.label, isActive && itb.labelActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HormoneRangeBar — zone-aware bar with marker dot
// ═══════════════════════════════════════════════════════════════════════════════
interface HormoneRangeBarProps {
  label: string;
  value: string;
  unit?: string;
  status: string;
  statusColor: string;
  currentPct: number;
}
export const HormoneRangeBar: React.FC<HormoneRangeBarProps> = ({
  label, value, unit, status, statusColor, currentPct,
}) => {
  const { theme } = useTheme();
  const hrb = useStyles((t) => StyleSheet.create({
    container: { marginBottom: Spacing.xl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    label: { fontSize: Typography.sm, color: t.colors.textSecondary, fontWeight: Typography.medium, flex: 1 },
    rightRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    value: { fontSize: Typography.sm, fontWeight: Typography.bold },
    badge: {
      paddingHorizontal: Spacing.sm, paddingVertical: 2,
      borderRadius: Radius.full, borderWidth: 1,
    },
    badgeText: { fontSize: 11, fontWeight: Typography.bold },
    trackWrap: { position: 'relative', height: 22 },
    track: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2, marginTop: 0 },
    zone: { height: '100%' },
    markerWrap: { position: 'absolute', top: -5, marginLeft: -10 },
    markerOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.bg },
    markerInner: { width: 10, height: 10, borderRadius: 5 },
    zoneLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
    zoneLabel: { fontSize: Typography.xs, color: t.colors.textMuted, flex: 1 },
  }));
  const clampedPct = Math.min(0.96, Math.max(0.04, currentPct));
  return (
    <View style={hrb.container}>
      <View style={hrb.header}>
        <Text style={hrb.label}>{label}</Text>
        <View style={hrb.rightRow}>
          <Text style={[hrb.value, { color: statusColor }]}>
            {value}{unit ? ` ${unit}` : ''}
          </Text>
          <View style={[hrb.badge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
            <Text style={[hrb.badgeText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>
      </View>
      <View style={hrb.trackWrap}>
        <View style={hrb.track}>
          <View style={[hrb.zone, { flex: 3, backgroundColor: theme.colors.danger + '38', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }]} />
          <View style={[hrb.zone, { flex: 4, backgroundColor: theme.colors.success + '38' }]} />
          <View style={[hrb.zone, { flex: 3, backgroundColor: theme.colors.amber + '38', borderTopRightRadius: 5, borderBottomRightRadius: 5 }]} />
        </View>
        <View style={[hrb.markerWrap, { left: `${clampedPct * 100}%` }]}>
          <View style={[hrb.markerOuter, { borderColor: statusColor }]}>
            <View style={[hrb.markerInner, { backgroundColor: statusColor }]} />
          </View>
        </View>
      </View>
      <View style={hrb.zoneLabelRow}>
        <Text style={[hrb.zoneLabel, { textAlign: 'left' }]}>Low</Text>
        <Text style={[hrb.zoneLabel, { textAlign: 'center' }]}>Normal</Text>
        <Text style={[hrb.zoneLabel, { textAlign: 'right' }]}>High</Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LogButton
// ═══════════════════════════════════════════════════════════════════════════════
export const LogButton: React.FC<{
  label: string; icon?: string; color?: string; onPress?: () => void;
}> = ({ label, icon = '✏️', color, onPress }) => {
  const { theme } = useTheme();
  const btnColor = color || theme.colors.teal;
  const logS = useStyles((t) => StyleSheet.create({
    btn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.base,
      borderRadius: Radius.full, borderWidth: 1,
    },
    icon: { fontSize: Typography.sm, marginRight: 6 },
    label: { fontSize: Typography.sm, fontWeight: Typography.semiBold },
  }));
  return (
    <TouchableOpacity
      style={[logS.btn, { borderColor: btnColor + '55', backgroundColor: btnColor + '14' }]}
      onPress={onPress} activeOpacity={0.7}>
      <Text style={logS.icon}>{icon}</Text>
      <Text style={[logS.label, { color: btnColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QuickActionButton
// ═══════════════════════════════════════════════════════════════════════════════
export const QuickActionButton: React.FC<{
  icon: React.ReactNode; label: string; color: string; onPress?: () => void; active?: boolean;
}> = ({ icon, label, color, onPress, active = false }) => {
  const { theme } = useTheme();
  const qab = useStyles((t) => StyleSheet.create({
    btn: {
      flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
      borderRadius: Radius.md, borderWidth: 1,
    },
    iconWrap: { marginBottom: 4 },
    label: { fontSize: Typography.xs, fontWeight: Typography.semiBold, textAlign: 'center' },
  }));
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        qab.btn,
        { borderColor: active ? color : theme.colors.bgCardBorder, backgroundColor: active ? color + '20' : theme.colors.bgCard },
      ]}>
      <View style={qab.iconWrap}>{icon}</View>
      <Text style={[qab.label, { color: active ? color : theme.colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MiniMetricCard
// ═══════════════════════════════════════════════════════════════════════════════
export const MiniMetricCard: React.FC<{
  icon: string; label: string; value: string; unit?: string; color: string; subtitle?: string;
}> = ({ icon, label, value, unit, color, subtitle }) => {
  const mmc = useStyles((theme) => StyleSheet.create({
    card: { padding: Spacing.md, flex: 1 },
    iconWrap: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    valueRow: { flexDirection: 'row', alignItems: 'baseline' },
    value: { fontSize: Typography.lg, fontWeight: Typography.extraBold },
    unit: { fontSize: Typography.xs, fontWeight: Typography.medium, marginLeft: 3 },
    label: { fontSize: Typography.xs, color: theme.colors.textSecondary, fontWeight: Typography.semiBold, marginTop: 3, textTransform: 'uppercase', letterSpacing: Typography.lsWide },
    subtitle: { fontSize: Typography.xs, color: theme.colors.textMuted, marginTop: 2 },
  }));
  return (
    <GlassCardView style={mmc.card} accentColor={color}>
      <View style={[mmc.iconWrap, { backgroundColor: color + '22' }]}>
        <Text style={{ fontSize: Typography.lg }}>{icon}</Text>
      </View>
      <View style={mmc.valueRow}>
        <Text style={[mmc.value, { color }]}>{value}</Text>
        {unit && <Text style={[mmc.unit, { color: color + 'AA' }]}>{unit}</Text>}
      </View>
      <Text style={mmc.label}>{label}</Text>
      {subtitle && <Text style={mmc.subtitle}>{subtitle}</Text>}
    </GlassCardView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SLEEP TRACKER SECTION
// ═══════════════════════════════════════════════════════════════════════════════
const QUALITY_LABELS: Record<number, string> = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great' };
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const SleepLogModal: React.FC<{ visible: boolean; onClose: () => void; onSave?: (data: { sleep_hr: number; sleep_quality: number }) => void }> = ({ visible, onClose, onSave }) => {
  const { theme } = useTheme();
  const [hours, setHours] = useState('7');
  const [quality, setQuality] = useState(3);
  const modalS = useModalStyles();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalS.overlay}>
        <View style={modalS.sheet}>
          <View style={modalS.handle} />
          <Text style={modalS.title}>Log Sleep</Text>
          <Text style={modalS.fieldLabel}>Hours slept</Text>
          <TextInput style={modalS.input} value={hours} onChangeText={setHours} keyboardType="decimal-pad" placeholder="7" placeholderTextColor={theme.colors.textMuted} />
          <Text style={modalS.fieldLabel}>Quality</Text>
          <View style={modalS.chipsRow}>
            {[1, 2, 3, 4].map(q => (
              <TouchableOpacity key={q} onPress={() => setQuality(q)}
                style={[modalS.chip, quality === q && { backgroundColor: theme.colors.accentBlue + '30', borderColor: theme.colors.accentBlue }]}>
                <Text style={[modalS.chipText, quality === q && { color: theme.colors.accentBlue }]}>{QUALITY_LABELS[q]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={modalS.actions}>
            <TouchableOpacity style={modalS.cancelBtn} onPress={onClose}><Text style={modalS.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[modalS.saveBtn, { backgroundColor: theme.colors.accentBlue }]} onPress={() => { onSave?.({ sleep_hr: parseFloat(hours) || 7, sleep_quality: quality }); onClose(); }}><Text style={modalS.saveText}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const SleepTrackerSection: React.FC<{ sleepLogs?: SleepLog[] }> = ({ sleepLogs = [] }) => {
  const { theme } = useTheme();
  const [showLog, setShowLog] = useState(false);

  const slp = useStyles((t) => StyleSheet.create({
    card: { padding: Spacing.base, marginBottom: Spacing.xl },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    summaryItem: { alignItems: 'center' },
    summaryVal: { fontSize: Typography.xl, fontWeight: Typography.extraBold, color: t.colors.textPrimary },
    summaryLbl: { fontSize: Typography.xs, color: t.colors.textMuted, marginTop: 2 },
    qualityBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1 },
    qualityText: { fontSize: Typography.sm, fontWeight: Typography.bold },
    chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, marginTop: Spacing.lg, marginBottom: Spacing.base },
    barCol: { flex: 1, alignItems: 'center' },
    barTrack: { width: 22, height: '100%', justifyContent: 'flex-end', borderRadius: 5, overflow: 'hidden', backgroundColor: t.colors.bgCardBorder, marginBottom: 4 },
    bar: { width: '100%', borderRadius: 5 },
    barLbl: { fontSize: 11, color: t.colors.textMuted, fontWeight: Typography.semiBold },
    barHrs: { fontSize: 10, color: t.colors.textSecondary, marginBottom: 2, fontWeight: Typography.medium },
    logRow: { alignItems: 'center', marginTop: Spacing.sm },
  }));

  const weekData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = sleepLogs.find(s => s.date === dateStr);
    return {
      day: DAY_LABELS[d.getDay()],
      hours: log?.sleep_hr ?? 0,
      quality: log?.sleep_quality ?? null,
      isToday: i === 6,
      hasData: !!log,
    };
  }), [sleepLogs]);

  const loggedDays = weekData.filter(d => d.hasData);
  const avg = loggedDays.length > 0
    ? (loggedDays.reduce((s, d) => s + d.hours, 0) / loggedDays.length).toFixed(1)
    : '—';
  const latestQuality = loggedDays.length > 0 ? loggedDays[loggedDays.length - 1].quality : null;
  const qualityLabel = latestQuality ? QUALITY_LABELS[latestQuality] ?? '—' : '—';
  const maxH = 9;

  const handleSave = async (data: { sleep_hr: number; sleep_quality: number }) => {
    // Parent will handle the actual save via HealthLogScreen
  };

  return (
    <>
      <SleepLogModal visible={showLog} onClose={() => setShowLog(false)} onSave={handleSave} />
      <SectionHeader title="Sleep" subtitle={loggedDays.length > 0 ? `${avg} hrs avg this week` : 'No sleep data yet'} />
      <GlassCardView style={slp.card}>
        <View style={slp.summaryRow}>
          <View style={slp.summaryItem}>
            <Text style={slp.summaryVal}>{avg}</Text>
            <Text style={slp.summaryLbl}>Avg hours</Text>
          </View>
          <View style={[slp.qualityBadge, { backgroundColor: theme.colors.accentBlue + '22', borderColor: theme.colors.accentBlue + '55' }]}>
            <Text style={[slp.qualityText, { color: theme.colors.accentBlue }]}>● {qualityLabel}</Text>
          </View>
          <View style={slp.summaryItem}>
            <Text style={slp.summaryVal}>{loggedDays.length}</Text>
            <Text style={slp.summaryLbl}>Days logged</Text>
          </View>
        </View>
        <View style={slp.chart}>
          {weekData.map((d, i) => {
            const pct = d.hasData ? d.hours / maxH : 0;
            const col = d.hours >= 7.5 ? theme.colors.accentBlue : d.hours >= 6.5 ? theme.colors.accentBlue + 'BB' : theme.colors.accentBlue + '66';
            return (
              <View key={`${d.day}-${i}`} style={slp.barCol}>
                <Text style={slp.barHrs}>{d.hasData ? `${d.hours}h` : '—'}</Text>
                <View style={slp.barTrack}>
                  <View style={[slp.bar, { height: `${pct * 100}%`, backgroundColor: d.hasData ? col : theme.colors.bgCardBorder, borderWidth: d.isToday ? 1 : 0, borderColor: theme.colors.accentBlue }]} />
                </View>
                <Text style={[slp.barLbl, d.isToday && { color: theme.colors.accentBlue, fontWeight: Typography.bold }]}>{d.day}</Text>
              </View>
            );
          })}
        </View>
      </GlassCardView>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MENTAL HEALTH SECTION
// ═══════════════════════════════════════════════════════════════════════════════
const MOODS = [
  { emoji: '😢', label: 'Awful', value: 1 },
  { emoji: '😕', label: 'Bad', value: 2 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😊', label: 'Good', value: 4 },
  { emoji: '😄', label: 'Great', value: 5 },
];
const ENERGY_MAP: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
const ENERGY_LABELS: Record<number, string> = { 1: 'Low', 2: 'Med', 3: 'High' };

const JournalModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const modalS = useModalStyles();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalS.overlay}>
        <View style={[modalS.sheet, { maxHeight: '65%' }]}>
          <View style={modalS.handle} />
          <Text style={modalS.title}>Journal Entry</Text>
          <Text style={modalS.fieldLabel}>How was your day?</Text>
          <TextInput
            style={[modalS.input, { height: 120, textAlignVertical: 'top' }]}
            multiline placeholder="Write your thoughts..." placeholderTextColor={theme.colors.textMuted} />
          <View style={modalS.actions}>
            <TouchableOpacity style={modalS.cancelBtn} onPress={onClose}><Text style={modalS.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[modalS.saveBtn, { backgroundColor: theme.colors.amber }]} onPress={onClose}><Text style={modalS.saveText}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const MentalHealthSection: React.FC<{ moodLogs?: MoodLog[] }> = ({ moodLogs = [] }) => {
  const { theme } = useTheme();
  const latestLog = moodLogs[moodLogs.length - 1];
  const rawStress = latestLog?.stress ?? 2;
  const stress = rawStress <= 2 ? 'Low' : rawStress <= 4 ? 'Moderate' : 'High';
  const stressLevel = rawStress;
  const stressColor = stress === 'Low' ? theme.colors.success : stress === 'Moderate' ? theme.colors.amber : theme.colors.danger;

  const mhs = useStyles((t) => StyleSheet.create({
    card: { padding: Spacing.base, marginBottom: Spacing.md },
    stressCard: { padding: Spacing.base, marginBottom: Spacing.md },
    weekCard: { padding: Spacing.base, marginBottom: Spacing.xl },
    prompt: { fontSize: Typography.base, color: t.colors.textPrimary, fontWeight: Typography.semiBold, textAlign: 'center', marginBottom: Spacing.md },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.xs, marginBottom: Spacing.md },
    moodCard: {
      flex: 1, alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: 4,
      borderRadius: Radius.md, borderWidth: 1.5, borderColor: t.colors.bgCardBorder,
      backgroundColor: t.colors.tooltipBg,
    },
    moodEmoji: { fontSize: Typography.xl, marginBottom: 5 },
    moodEmojiSel: { fontSize: Typography.xxl },
    moodCardLabel: { fontSize: Typography.xs, color: t.colors.textMuted, fontWeight: Typography.semiBold, textAlign: 'center' },
    moodSelectedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: t.colors.amber, marginTop: 4 },
    insightStrip: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.amber + '12',
      borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm,
      borderWidth: 1, borderColor: t.colors.amber + '25',
    },
    insightIcon: { fontSize: Typography.lg },
    insightText: { flex: 1, fontSize: Typography.xs, color: t.colors.textSecondary, lineHeight: 17 },
    stressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    stressTitle: { fontSize: Typography.sm, color: t.colors.textMuted, fontWeight: Typography.medium },
    stressValue: { fontSize: Typography.lg, fontWeight: Typography.extraBold },
    stressBadge: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1 },
    stressBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    meterRow: { flexDirection: 'row', gap: 4, height: 10, marginBottom: 6 },
    meterSeg: { flex: 1, height: '100%' },
    meterLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
    meterLabel: { fontSize: Typography.xs, color: t.colors.textMuted },
    stressBtnsRow: { flexDirection: 'row', gap: Spacing.sm },
    stressBtn: {
      flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
      borderRadius: Radius.full, borderWidth: 1, borderColor: t.colors.bgCardBorder,
    },
    stressBtnText: { fontSize: Typography.xs, color: t.colors.textMuted, fontWeight: Typography.medium },
    weekTitle: { fontSize: Typography.sm, color: t.colors.textSecondary, fontWeight: Typography.semiBold, marginBottom: Spacing.md },
    weekChartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, marginBottom: Spacing.md },
    weekCol: { flex: 1, alignItems: 'center' },
    weekBarTrack: { width: '70%', height: 70, backgroundColor: t.colors.bgCardBorder, borderRadius: 5, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 4 },
    weekBar: { width: '100%', borderRadius: 5 },
    weekEmoji: { fontSize: Typography.sm, marginBottom: 2 },
    weekDayLbl: { fontSize: Typography.xs, color: t.colors.textMuted },
    actRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  }));

  const weekData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = moodLogs.find(m => m.date === dateStr);
    const energyVal = log ? (ENERGY_MAP[log.energy_level] ?? 0) : 0;
    return {
      day: DAY_LABELS[d.getDay()],
      energyVal,
      label: energyVal > 0 ? ENERGY_LABELS[energyVal] : '—',
      isToday: i === 6,
      hasData: !!log && energyVal > 0,
    };
  }), [moodLogs]);

  const loggedDays = weekData.filter(d => d.hasData);
  const avgEnergy = loggedDays.length > 0
    ? ENERGY_LABELS[Math.round(loggedDays.reduce((s, d) => s + d.energyVal, 0) / loggedDays.length)]
    : '—';

  return (
    <>
      <SectionHeader title="Stress & Mood" subtitle="Today" />

      <GlassCardView style={mhs.stressCard}>
        <View style={mhs.stressHeaderRow}>
          <View>
            <Text style={mhs.stressTitle}>Stress Level</Text>
            <Text style={[mhs.stressValue, { color: stressColor }]}>{stress}</Text>
          </View>
          <View style={[mhs.stressBadge, { backgroundColor: stressColor + '22', borderColor: stressColor + '55' }]}>
            <Text style={[mhs.stressBadgeText, { color: stressColor }]}>● {stress}</Text>
          </View>
        </View>
        <View style={mhs.meterRow}>
          {[1, 2, 3, 4, 5].map(seg => {
            const segColor = seg <= 2 ? theme.colors.success : seg === 3 || seg === 4 ? theme.colors.amber : theme.colors.danger;
            const filled = seg <= stressLevel;
            return (
              <View
                key={seg}
                style={[
                  mhs.meterSeg,
                  { backgroundColor: filled ? segColor : segColor + '22' },
                  seg === 1 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                  seg === 5 && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                ]}
              />
            );
          })}
        </View>
        <View style={mhs.meterLabelRow}>
          <Text style={mhs.meterLabel}>Low</Text>
          <Text style={mhs.meterLabel}>Moderate</Text>
          <Text style={mhs.meterLabel}>High</Text>
        </View>
      </GlassCardView>

      <GlassCardView style={mhs.weekCard}>
        <Text style={mhs.weekTitle}>Weekly Energy Trend{loggedDays.length > 0 ? ` · Avg: ${avgEnergy}` : ''}</Text>
        <View style={mhs.weekChartRow}>
          {weekData.map((d, i) => {
            const pct = d.hasData ? (d.energyVal / 3) * 100 : 8;
            const barColor = d.energyVal === 3 ? theme.colors.success : d.energyVal === 2 ? theme.colors.amber : d.hasData ? theme.colors.pink : theme.colors.bgCardBorder;
            return (
              <View key={`${d.day}-${i}`} style={mhs.weekCol}>
                <View style={mhs.weekBarTrack}>
                  <View style={[mhs.weekBar, { height: `${pct}%`, backgroundColor: d.isToday ? barColor : barColor + 'AA' }]} />
                </View>
                <Text style={[mhs.weekEmoji, { opacity: d.hasData ? 1 : 0.3, color: d.hasData ? barColor : theme.colors.textMuted, fontWeight: d.hasData ? Typography.bold : Typography.regular }]}>
                  {d.hasData ? d.label : '·'}
                </Text>
                <Text style={[mhs.weekDayLbl, d.isToday && { color: theme.colors.amber, fontWeight: Typography.bold }]}>{d.day}</Text>
              </View>
            );
          })}
        </View>
      </GlassCardView>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI HEALTH INSIGHTS SECTION
// ═══════════════════════════════════════════════════════════════════════════════
const INSIGHTS = {
  female: {
    items: [
      { icon: '🌿', title: 'Luteal phase fatigue is normal', body: 'Your progesterone is elevated, causing fatigue. Prioritise sleep and reduce intense exercise. Try Magnesium-rich foods.' },
      { icon: '🔄', title: 'Cycle irregularity improving', body: 'Based on your 3-month data your cycle length has stabilised to 27–29 days. Stress levels are down — keep it up.' },
      { icon: '💧', title: 'Iron levels may be low', body: 'Post-period iron dip detected. Consider adding leafy greens, lentils, or a supplement. Pair with vitamin C for absorption.' },
    ],
    tagKey: 'pink' as const,
  },
  male: {
    items: [
      { icon: '💪', title: 'Testosterone is optimal', body: 'Your T-levels are in the top 25th percentile for your age group. Consistent sleep and resistance training are contributing.' },
      { icon: '📉', title: 'Cortisol trending elevated', body: 'Your stress markers are slightly elevated over the past week. Reduce caffeine after 2 PM and try a 10-min wind-down routine.' },
      { icon: '🏋️', title: 'Recovery window open', body: 'Your HRV is up 12% this week. This is a great time to push training intensity. Ensure protein intake stays above 1.6g/kg.' },
    ],
    tagKey: 'teal' as const,
  },
};

export const AIHealthInsightsSection: React.FC<{ mode: 'female' | 'male' }> = ({ mode }) => {
  const { theme } = useTheme();
  const data = INSIGHTS[mode];
  const tagColor = theme.colors[data.tagKey];

  const ai = useStyles((t) => StyleSheet.create({
    card: { padding: Spacing.base, marginBottom: Spacing.base },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base, paddingBottom: Spacing.base, borderBottomWidth: 1, borderBottomColor: t.colors.divider },
    iconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.colors.accentBlue + '30', alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: Typography.base, color: t.colors.accentBlue },
    label: { fontSize: 11, fontWeight: Typography.bold, color: t.colors.accentBlue, letterSpacing: 1.5 },
    date: { fontSize: Typography.xs, color: t.colors.textMuted, marginTop: 1 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.success, shadowColor: t.colors.success, shadowRadius: 6, shadowOpacity: 1, elevation: 4 },
    insightRow: { flexDirection: 'row', paddingVertical: Spacing.md, gap: Spacing.md },
    insightIcon: { fontSize: Typography.xl, marginTop: 2 },
    insightTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: t.colors.textPrimary, marginBottom: 4 },
    insightBody: { fontSize: Typography.sm, color: t.colors.textSecondary, lineHeight: 18 },
    cta: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: t.colors.divider },
    ctaText: { fontSize: Typography.sm, color: t.colors.accentBlue, fontWeight: Typography.semiBold },
  }));

  return (
    <>
      <SectionHeader title="AI Health Insights" />
      <GlassCardView style={[ai.card, { borderColor: theme.colors.accentBlue + '45', backgroundColor: theme.colors.accentBlueDim }]}>
        <View style={ai.cardHeader}>
          <View style={ai.iconWrap}><Text style={ai.iconText}>✦</Text></View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={ai.label}>AI HEALTH INSIGHTS</Text>
            <Text style={ai.date}>Updated today</Text>
          </View>
          <View style={ai.liveDot} />
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={[ai.insightRow, i < data.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.divider }]}>
            <Text style={ai.insightIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={ai.insightTitle}>{item.title}</Text>
              <Text style={ai.insightBody}>{item.body}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={ai.cta}>
          <Text style={ai.ctaText}>View full analysis →</Text>
        </TouchableOpacity>
      </GlassCardView>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PREVENTIVE CARE SECTION (male-specific)
// ═══════════════════════════════════════════════════════════════════════════════
const PREVENTIVE_ITEMS = [
  { icon: '🩺', label: 'Blood Pressure Check', detail: 'Last: Jan 10 · Next rec. Jan 25', status: 'Due Soon', statusColorKey: 'amber' as const },
  { icon: '🔬', label: 'Full Blood Panel', detail: 'Last: Jun 10 · Next rec. Dec 10', status: 'Up to Date', statusColorKey: 'success' as const },
  { icon: '👁️', label: 'Eye Examination', detail: 'Last: Jan 2025 · Rec. every year', status: 'Due', statusColorKey: 'danger' as const },
  { icon: '🦷', label: 'Dental Check', detail: 'Last: Mar 5 · Next rec. Sep 5', status: 'Up to Date', statusColorKey: 'success' as const },
  { icon: '🏥', label: 'STI / Sexual Health Panel', detail: 'Rec. annually if sexually active', status: 'Overdue', statusColorKey: 'danger' as const },
];

export const PreventiveCareSection: React.FC = () => {
  const { theme } = useTheme();

  const prev = useStyles((t) => StyleSheet.create({
    card: { marginBottom: Spacing.xl },
    row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
    iconWrap: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: t.colors.textPrimary },
    detail: { fontSize: Typography.xs, color: t.colors.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
    badgeText: { fontSize: 11, fontWeight: Typography.bold },
  }));

  return (
    <>
      <SectionHeader title="Preventive Care" subtitle="Recommended screenings" />
      <GlassCardView style={prev.card}>
        {PREVENTIVE_ITEMS.map((item, i) => {
          const itemColor = theme.colors[item.statusColorKey];
          return (
            <View key={i} style={[prev.row, i < PREVENTIVE_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.divider }]}>
              <View style={[prev.iconWrap, { backgroundColor: itemColor + '18' }]}>
                <Text style={{ fontSize: Typography.md }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={prev.label}>{item.label}</Text>
                <Text style={prev.detail}>{item.detail}</Text>
              </View>
              <TouchableOpacity style={[prev.badge, { backgroundColor: itemColor + '18', borderColor: itemColor + '55' }]}>
                <Text style={[prev.badgeText, { color: itemColor }]}>{item.status}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </GlassCardView>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Shared Modal Styles (kept for backward compat — internal components use useModalStyles)
// ═══════════════════════════════════════════════════════════════════════════════
// modalS is no longer exported as a static StyleSheet.
// Internal consumers use useModalStyles() hook above.
