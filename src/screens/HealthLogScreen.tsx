import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import { GlassCardView } from '../components/SharedComponents';

export interface HealthLogDraft {
  createdAt: string;
  mood: string;
  flow: string;
  discharge: string;
  symptoms: string[];
  sleepHours: string;
  sleepQuality: string;
  heartRate: string;
  bloodPressure: string;
  notes: string;
}

interface HealthLogScreenProps {
  onBack: () => void;
  onSave?: (log: HealthLogDraft) => void;
}

const MOODS = [
  { emoji: '😢', label: 'Awful' },
  { emoji: '😕', label: 'Bad' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😊', label: 'Good' },
  { emoji: '😄', label: 'Great' },
];

const FLOWS = ['None', 'Spotting', 'Light', 'Medium', 'Heavy'];
const DISCHARGE_TYPES = ['Dry', 'Sticky', 'Creamy', 'Watery', 'Egg white'];
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

export default function HealthLogScreen({ onBack, onSave }: HealthLogScreenProps) {
  const [mood, setMood] = useState('Okay');
  const [flow, setFlow] = useState('None');
  const [discharge, setDischarge] = useState('Creamy');
  const [symptoms, setSymptoms] = useState<string[]>(['Fatigue']);
  const [sleepHours, setSleepHours] = useState('7.2');
  const [sleepQuality, setSleepQuality] = useState('Good');
  const [heartRate, setHeartRate] = useState('72');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [notes, setNotes] = useState('');

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(item => item !== symptom)
        : [...prev, symptom],
    );
  };

  const handleSave = () => {
    onSave?.({
      createdAt: new Date().toISOString(),
      mood,
      flow,
      discharge,
      symptoms,
      sleepHours,
      sleepQuality,
      heartRate,
      bloodPressure,
      notes,
    });
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
        </GlassCardView>

        <GlassCardView style={s.card}>
          <Text style={s.sectionTitle}>Cycle Details</Text>
          <Text style={s.fieldLabel}>Flow</Text>
          <View style={s.segmentRow}>
            {FLOWS.map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => setFlow(item)}
                style={[s.segment, flow === item && s.segmentActive]}>
                <Text style={[s.segmentText, flow === item && s.segmentTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Discharge</Text>
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
        </GlassCardView>

        <GlassCardView style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.sectionTitle}>Symptoms</Text>
            <Text style={s.countText}>{symptoms.length} selected</Text>
          </View>
          <View style={s.symptomGrid}>
            {SYMPTOMS.map(item => {
              const active = symptoms.includes(item);
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

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={s.saveText}>Save log</Text>
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
