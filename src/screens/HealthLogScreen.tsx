import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import { GlassCardView } from '../components/SharedComponents';
import { saveMoodLog } from '../services/healthService';
import { savePeriodLog } from '../services/healthService';
import { saveDischargeLog } from '../services/healthService';
import { saveSymptomsLog } from '../services/healthService';
import { saveSleepLog } from '../services/healthService';
import { getPeriodLogs } from '../services/healthService';

export interface HealthLogDraft {
  createdAt: string;
  mood: string;
  energyLevel: string;
  stress: number;
  focusLevel: number;
  libido: number;
  gotPeriod: boolean;
  flowIntensity: string;
  periodDay: number;
  flowColor: string;
  cramps: string;
  clots: string;
  discharge: string;
  texture: string;
  dischargeColor: string;
  dischargeAmount: number;
  symptoms: Array<{ symptom: string; severity: number }>;
  sleepHours: string;
  sleepQuality: string;
  heartRate: string;
  bloodPressure: string;
  notes: string;
}

interface HealthLogScreenProps {
  onBack: () => void;
  onSave?: (log: HealthLogDraft) => void;
  token?: string;
}

const MOODS = [
  { emoji: '😢', label: 'Awful' },
  { emoji: '😕', label: 'Bad' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😊', label: 'Good' },
  { emoji: '😄', label: 'Great' },
];

const FLOWS = ['Spotting', 'Light', 'Medium', 'Heavy'];
const FLOW_COLORS = ['Clear', 'Bright red', 'Dark red', 'Brown', 'Pink'];
const CRAMPS_OPTIONS = ['None', 'Mild', 'Moderate', 'Severe'];
const CLOTS_OPTIONS = ['None', 'Small', 'Large'];
const DISCHARGE_TYPES = ['Dry', 'Sticky', 'Creamy', 'Watery', 'Egg white'];
const DISCHARGE_TEXTURES = ['None', 'Thin', 'Thick', 'Stretchy', 'Clumpy'];
const DISCHARGE_COLORS = ['Clear', 'White', 'Creamy', 'Yellow', 'Brown', 'Pink', 'Red'];
const DISCHARGE_AMOUNTS = ['None', 'Light', 'Medium', 'Heavy'];
const LEVEL_OPTIONS = [
  { label: 'Low', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'High', value: 3 },
];
const SLEEP_QUALITIES = ['Poor', 'Fair', 'Good', 'Great'];
const SYMPTOMS = [
  'Cramps',
  'Fatigue',
  'Nausea',
  'Brain fog',
  'Bloating',
  'Headache',
  'Cravings',
  'Breast tenderness',
  'Energetic',
  'Low mood',
];
const SEVERITY_OPTIONS = [
  { label: 'Mild', value: 1 },
  { label: 'Moderate', value: 2 },
  { label: 'Severe', value: 3 },
];

export default function HealthLogScreen({ onBack, onSave, token }: HealthLogScreenProps) {
  const [mood, setMood] = useState('Okay');
  const [energyLevel, setEnergyLevel] = useState('Medium');
  const [stress, setStress] = useState(2);
  const [focusLevel, setFocusLevel] = useState(2);
  const [libido, setLibido] = useState(2);
  const [gotPeriod, setGotPeriod] = useState(false);
  const [flowIntensity, setFlowIntensity] = useState('Light');
  const [periodDay, setPeriodDay] = useState(1);
  const [flowColor, setFlowColor] = useState('Bright red');
  const [cramps, setCramps] = useState('None');
  const [clots, setClots] = useState('None');
  const [discharge, setDischarge] = useState('Creamy');
  const [texture, setTexture] = useState('Thin');
  const [dischargeColor, setDischargeColor] = useState('White');
  const [dischargeAmount, setDischargeAmount] = useState(1);
  const [symptoms, setSymptoms] = useState<Array<{symptom: string; severity: number}>>([
    { symptom: 'Fatigue', severity: 1 },
  ]);
  const [sleepHours, setSleepHours] = useState('7.2');
  const [sleepQuality, setSleepQuality] = useState('Good');
  const [heartRate, setHeartRate] = useState('72');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev => {
      const exists = prev.find(s => s.symptom === symptom);
      if (exists) return prev.filter(s => s.symptom !== symptom);
      return [...prev, { symptom, severity: 1 }];
    });
  };

  const setSymptomSeverity = (symptom: string, severity: number) => {
    setSymptoms(prev => prev.map(s => s.symptom === symptom ? { ...s, severity } : s));
  };

  // Auto-fill period state from latest period log
  useEffect(() => {
    if (!token) return;
    getPeriodLogs(token).then(logs => {
      if (!logs || logs.length === 0) return;
      const latest = logs[logs.length - 1];
      if (!latest.period_start_date) return;
      const start = new Date(latest.period_start_date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      // Auto-toggle on if period started within last 7 days
      if (diffDays >= 0 && diffDays <= 6) {
        setGotPeriod(true);
        setPeriodDay(diffDays + 1);
        if (latest.flow_intensity) setFlowIntensity(latest.flow_intensity);
        if (latest.Flow_color) setFlowColor(latest.Flow_color);
        if (latest.cramps) setCramps(latest.cramps);
        if (latest.clots) setClots(latest.clots);
      }
    }).catch(() => {});
  }, [token]);

  const handleSave = async () => {
    const draft: HealthLogDraft = {
      createdAt: new Date().toISOString(),
      mood,
      energyLevel,
      stress,
      focusLevel,
      libido,
      gotPeriod,
      flowIntensity,
      periodDay,
      flowColor,
      cramps,
      clots,
      discharge,
      texture,
      dischargeColor,
      dischargeAmount,
      symptoms,
      sleepHours,
      sleepQuality,
      heartRate,
      bloodPressure,
      notes,
    };

    // Always call local save callback for immediate UI feedback
    onSave?.(draft);

    // If token available, persist to backend
    if (token) {
      setSaving(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        // Compute period_start_date: if user is on day N today, period started (N-1) days ago
        const periodStartDate = new Date();
        periodStartDate.setDate(periodStartDate.getDate() - (periodDay - 1));
        const periodStartStr = periodStartDate.toISOString().split('T')[0];

        await Promise.all([
          saveMoodLog(token, {
            mood,
            energy_level: energyLevel,
            stress,
            focus_level: focusLevel,
            libido,
            date: today,
          }),
          gotPeriod ? savePeriodLog(token, {
            date: today,
            period_start_date: periodStartStr,
            day_no: periodDay,
            flow_intensity: flowIntensity,
            Flow_color: flowColor,
            cramps,
            clots,
          }) : Promise.resolve(),
          saveDischargeLog(token, {
            discharge_type: discharge,
            texture,
            color: dischargeColor,
            amount: dischargeAmount,
            date: today,
          }),
          saveSymptomsLog(token, { symptoms, date: today }),
          saveSleepLog(token, { sleep_hr: parseFloat(sleepHours) || 7, sleep_quality: SLEEP_QUALITIES.indexOf(sleepQuality) + 1, date: today }),
        ]);
      } catch (err: any) {
        console.error('[HealthLogScreen] Failed to save to backend:', err);
        Alert.alert('Save failed', 'Your log was saved locally but could not sync to the server.');
      } finally {
        setSaving(false);
      }
    }

    if (!onSave) onBack();
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={s.backText}>‹</Text>
          </TouchableOpacity>
          <View style={s.headerCopy}>
            <Text style={s.title}>Log Health</Text>
            <Text style={s.subtitle}>Today&apos;s cycle, mood, sleep and vitals</Text>
          </View>
        </View>

        <GlassCardView style={s.card}>
          <Text style={s.sectionTitle}>Mood</Text>
          <View style={s.moodRow}>
            {MOODS.map(item => {
              const active = mood === item.label;
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => setMood(item.label)}
                  style={[s.moodBtn, active && s.moodBtnActive]}>
                  <Text style={s.moodEmoji}>{item.emoji}</Text>
                  <Text style={[s.moodLabel, active && s.moodLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[s.fieldLabel, { marginTop: Spacing.md }]}>Energy level</Text>
          <View style={s.segmentRow}>
            {LEVEL_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setEnergyLevel(opt.label)}
                style={[s.segment, energyLevel === opt.label && s.segmentActive]}>
                <Text style={[s.segmentText, energyLevel === opt.label && s.segmentTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Stress</Text>
          <View style={s.segmentRow}>
            {LEVEL_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setStress(opt.value)}
                style={[s.segment, stress === opt.value && s.segmentActive]}>
                <Text style={[s.segmentText, stress === opt.value && s.segmentTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Focus</Text>
          <View style={s.segmentRow}>
            {LEVEL_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setFocusLevel(opt.value)}
                style={[s.segment, focusLevel === opt.value && s.segmentActive]}>
                <Text style={[s.segmentText, focusLevel === opt.value && s.segmentTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Libido</Text>
          <View style={s.segmentRow}>
            {LEVEL_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setLibido(opt.value)}
                style={[s.segment, libido === opt.value && s.segmentActive]}>
                <Text style={[s.segmentText, libido === opt.value && s.segmentTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCardView>

        <GlassCardView style={s.card}>
          <Text style={s.sectionTitle}>Period</Text>
          <View style={s.toggleRow}>
            <Text style={s.fieldLabel}>Got my period today</Text>
            <TouchableOpacity
              onPress={() => setGotPeriod(!gotPeriod)}
              style={[s.toggle, gotPeriod && s.toggleActive]}>
              <View style={[s.toggleKnob, gotPeriod && s.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {gotPeriod && (
            <>
              <Text style={s.fieldLabel}>Flow intensity</Text>
              <View style={s.segmentRow}>
                {FLOWS.map(item => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setFlowIntensity(item)}
                    style={[s.segment, flowIntensity === item && s.segmentActive]}>
                    <Text style={[s.segmentText, flowIntensity === item && s.segmentTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>Which day of your period?</Text>
              <View style={s.segmentRow}>
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setPeriodDay(day)}
                    style={[s.segment, periodDay === day && s.segmentActive]}>
                    <Text style={[s.segmentText, periodDay === day && s.segmentTextActive]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.hintText}>Period started {periodDay === 1 ? 'today' : `${periodDay - 1} day${periodDay - 1 > 1 ? 's' : ''} ago`}</Text>

              <Text style={s.fieldLabel}>Flow color</Text>
              <View style={s.segmentRow}>
                {FLOW_COLORS.map(item => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setFlowColor(item)}
                    style={[s.segment, flowColor === item && s.segmentActive]}>
                    <Text style={[s.segmentText, flowColor === item && s.segmentTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>Cramps</Text>
              <View style={s.segmentRow}>
                {CRAMPS_OPTIONS.map(item => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setCramps(item)}
                    style={[s.segment, cramps === item && s.segmentActive]}>
                    <Text style={[s.segmentText, cramps === item && s.segmentTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>Clots</Text>
              <View style={s.segmentRow}>
                {CLOTS_OPTIONS.map(item => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setClots(item)}
                    style={[s.segment, clots === item && s.segmentActive]}>
                    <Text style={[s.segmentText, clots === item && s.segmentTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </GlassCardView>

        <GlassCardView style={s.card}>
          <Text style={s.sectionTitle}>Discharge</Text>
          <Text style={s.fieldLabel}>Discharge type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalChips}>
            {DISCHARGE_TYPES.map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => setDischarge(item)}
                style={[s.pill, discharge === item && s.pillActive]}>
                <Text style={[s.pillText, discharge === item && s.pillTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.fieldLabel}>Texture</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalChips}>
            {DISCHARGE_TEXTURES.map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => setTexture(item)}
                style={[s.pill, texture === item && { borderColor: Colors.teal, backgroundColor: Colors.teal + '18' }]}>
                <Text style={[s.pillText, texture === item && { color: Colors.teal }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.fieldLabel}>Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalChips}>
            {DISCHARGE_COLORS.map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => setDischargeColor(item)}
                style={[s.pill, dischargeColor === item && { borderColor: Colors.amber, backgroundColor: Colors.amber + '18' }]}>
                <Text style={[s.pillText, dischargeColor === item && { color: Colors.amber }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.fieldLabel}>Amount</Text>
          <View style={s.segmentRow}>
            {DISCHARGE_AMOUNTS.map((label, i) => (
              <TouchableOpacity
                key={label}
                onPress={() => setDischargeAmount(i)}
                style={[s.segment, dischargeAmount === i && s.segmentActive]}>
                <Text style={[s.segmentText, dischargeAmount === i && s.segmentTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCardView>

        <GlassCardView style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.sectionTitle}>Symptoms</Text>
            <Text style={s.countText}>{symptoms.length} selected</Text>
          </View>
          <View style={s.symptomGrid}>
            {SYMPTOMS.map(item => {
              const active = symptoms.some(s => s.symptom === item);
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleSymptom(item)}
                  style={[s.symptomChip, active && s.symptomChipActive]}>
                  <Text style={[s.symptomText, active && s.symptomTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {symptoms.length > 0 && (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={s.fieldLabel}>Set severity for each</Text>
              {symptoms.map(({ symptom, severity }) => (
                <View key={symptom} style={s.symptomSeverityRow}>
                  <Text style={s.symptomSeverityLabel}>{symptom}</Text>
                  <View style={s.symptomSeverityChips}>
                    {SEVERITY_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setSymptomSeverity(symptom, opt.value)}
                        style={[
                          s.severityChip,
                          severity === opt.value && s.severityChipActive,
                        ]}>
                        <Text
                          style={[
                            s.severityChipText,
                            severity === opt.value && s.severityChipTextActive,
                          ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCardView>

        <GlassCardView style={s.card}>
          <Text style={s.sectionTitle}>Sleep</Text>
          <View style={s.inputRow}>
            <View style={s.inputGroup}>
              <Text style={s.fieldLabel}>Hours</Text>
              <TextInput
                value={sleepHours}
                onChangeText={setSleepHours}
                keyboardType="decimal-pad"
                placeholder="7.5"
                placeholderTextColor={Colors.textMuted}
                style={s.input}
              />
            </View>
            <View style={s.inputGroup}>
              <Text style={s.fieldLabel}>Quality</Text>
              <View style={s.qualityRow}>
                {SLEEP_QUALITIES.map(item => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setSleepQuality(item)}
                    style={[s.qualityChip, sleepQuality === item && s.qualityChipActive]}>
                    <Text style={[s.qualityText, sleepQuality === item && s.qualityTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </GlassCardView>

        <GlassCardView style={s.card}>
          <Text style={s.sectionTitle}>Vitals</Text>
          <View style={s.inputRow}>
            <View style={s.inputGroup}>
              <Text style={s.fieldLabel}>Heart rate</Text>
              <TextInput
                value={heartRate}
                onChangeText={setHeartRate}
                keyboardType="numeric"
                placeholder="72"
                placeholderTextColor={Colors.textMuted}
                style={s.input}
              />
            </View>
            <View style={s.inputGroup}>
              <Text style={s.fieldLabel}>Blood pressure</Text>
              <TextInput
                value={bloodPressure}
                onChangeText={setBloodPressure}
                placeholder="120/80"
                placeholderTextColor={Colors.textMuted}
                style={s.input}
              />
            </View>
          </View>
        </GlassCardView>

        <GlassCardView style={s.card}>
          <Text style={s.sectionTitle}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Anything you want to remember about today?"
            placeholderTextColor={Colors.textMuted}
            style={[s.input, s.notesInput]}
          />
        </GlassCardView>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={s.saveText}>Save log</Text>
          )}
        </TouchableOpacity>
        <View style={s.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  backText: { color: Colors.textPrimary, fontSize: 34, lineHeight: 34 },
  headerCopy: { flex: 1, marginLeft: Spacing.md },
  title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },
  card: { padding: Spacing.base, marginBottom: Spacing.base },
  sectionTitle: { fontSize: Typography.md, color: Colors.textPrimary, fontWeight: Typography.bold, marginBottom: Spacing.md },
  moodRow: { flexDirection: 'row', gap: Spacing.sm },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
  },
  moodBtnActive: { borderColor: Colors.pink, backgroundColor: Colors.pink + '18' },
  moodEmoji: { fontSize: 24, marginBottom: 3 },
  moodLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: Typography.semiBold },
  moodLabelActive: { color: Colors.pink },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semiBold, marginBottom: Spacing.sm },
  segmentRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  segment: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
  },
  segmentActive: { borderColor: Colors.pink, backgroundColor: Colors.pink + '18' },
  segmentText: { fontSize: 10, color: Colors.textSecondary, fontWeight: Typography.semiBold },
  segmentTextActive: { color: Colors.pink },
  hintText: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: Spacing.sm, marginBottom: Spacing.md },
  horizontalChips: { gap: Spacing.sm, paddingRight: Spacing.base },
  pill: {
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
  },
  pillActive: { borderColor: Colors.purple, backgroundColor: Colors.purple + '18' },
  pillText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semiBold },
  pillTextActive: { color: Colors.purple },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countText: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semiBold, marginBottom: Spacing.md },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  symptomChip: {
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
  },
  symptomChipActive: { borderColor: Colors.pink, backgroundColor: Colors.pink + '18' },
  symptomText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semiBold },
  symptomTextActive: { color: Colors.pink },
  symptomSeverityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCardBorder,
  },
  symptomSeverityLabel: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.semiBold },
  symptomSeverityChips: { flexDirection: 'row', gap: Spacing.xs },
  severityChip: {
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  severityChipActive: { borderColor: Colors.pink, backgroundColor: Colors.pink + '18' },
  severityChipText: { fontSize: 10, color: Colors.textSecondary, fontWeight: Typography.semiBold },
  severityChipTextActive: { color: Colors.pink },
  inputRow: { flexDirection: 'row', gap: Spacing.md },
  inputGroup: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  qualityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  qualityChip: {
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
  },
  qualityChipActive: { borderColor: Colors.purple, backgroundColor: Colors.purple + '18' },
  qualityText: { fontSize: 10, color: Colors.textSecondary, fontWeight: Typography.semiBold },
  qualityTextActive: { color: Colors.purple },
  notesInput: { minHeight: 110, textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgCardBorder,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: { backgroundColor: Colors.pink },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textMuted,
  },
  toggleKnobActive: { alignSelf: 'flex-end', backgroundColor: Colors.bg },
  saveBtn: {
    backgroundColor: Colors.pink,
    borderRadius: Radius.full,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveText: { color: Colors.bg, fontSize: Typography.base, fontWeight: Typography.bold },
  bottomSpace: { height: 48 },
});
