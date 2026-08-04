import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import {
  getMedications,
  createMedicationReminder,
  updateMedicationReminder,
  deleteMedicationReminder,
  toggleMedicationReminder,
} from '../../types/medication';
import type { Medication } from '../../types/medication';
import type { ReminderSchedule } from '../../types/reminder';

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getSchedules(med: Medication): ReminderSchedule[] {
  return (med.reminder as any)?.schedules || med.schedules || [];
}

function formatTimes(schedules: ReminderSchedule[]): string {
  if (schedules.length === 0) return 'No reminders set';
  return schedules.map(s => s.notify_at).join(', ');
}

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MedicationsRemindersScreen({ onBack, onSaved }: Props) {
  const { theme } = useTheme();
  const { session } = useAuth();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [times, setTimes] = useState<string[]>([]);
  const [repeat, setRepeat] = useState(true);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadData = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const data = await getMedications(session.access_token);
      setMedications(data);
    } catch (err) {
      console.error('[MedicationReminders] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => { loadData(); }, [loadData]);

  function resetForm() {
    setSelectedMed(null);
    setTimes([]);
    setRepeat(true);
    setSelectedWeekdays([]);
    setStartDate(new Date());
    setShowDatePicker(false);
    setShowTimePicker(false);
  }

  function addTimeToList(time: string) {
    const t = time.trim();
    if (!TIME_RE.test(t)) {
      Alert.alert('Invalid time', 'Time must be in HH:MM format (e.g. 09:00)');
      return;
    }
    if (times.includes(t)) {
      Alert.alert('Duplicate', 'This time is already added');
      return;
    }
    setTimes([...times, t].sort());
  }

  function removeTimeFromList(time: string) {
    setTimes(times.filter(t => t !== time));
  }

  const onStartDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setStartDate(selected);
  };

  const onTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) {
      const h = String(selected.getHours()).padStart(2, '0');
      const m = String(selected.getMinutes()).padStart(2, '0');
      addTimeToList(`${h}:${m}`);
    }
  };

  const tapMedication = (med: Medication) => {
    setSelectedMed(med);
    const schedules = getSchedules(med);
    if (med.reminder && schedules.length > 0) {
      setTimes(schedules.map(s => s.notify_at).sort());
      setRepeat(med.reminder.repeat);
      if (med.reminder.start_date) {
        const d = new Date(med.reminder.start_date + 'T00:00:00');
        if (!isNaN(d.getTime())) setStartDate(d);
      }
    } else {
      setTimes([]);
      setRepeat(true);
      setStartDate(new Date());
    }
    setSelectedWeekdays([]);
    setShowTimePicker(false);
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!selectedMed || !session?.access_token) return;
    if (times.length === 0) {
      Alert.alert('Required', 'Add at least one notification time');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        times,
        repeat,
        weekdays: repeat && selectedWeekdays.length > 0 ? selectedWeekdays : undefined,
        start_date: startDate.toISOString().split('T')[0],
        repeat_type: repeat ? (selectedWeekdays.length > 0 ? 'weekly' : 'daily') : null,
        repeat_interval: repeat ? 1 : 0,
        interval_unit: repeat ? (selectedWeekdays.length > 0 ? 'weeks' : 'days') : null,
      };

      if (selectedMed.reminder) {
        await updateMedicationReminder(session.access_token, selectedMed.id, payload);
      } else {
        await createMedicationReminder(session.access_token, selectedMed.id, payload);
      }

      resetForm();
      const updatedData = await getMedications(session.access_token);
      setMedications(updatedData);
      onSaved?.();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (med: Medication) => {
    if (!med.reminder || !session?.access_token) return;
    Alert.alert('Remove Reminder', `Remove all notifications for ${med.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMedicationReminder(session.access_token!, med.id);
            if (selectedMed?.id === med.id) resetForm();
            const updatedData = await getMedications(session.access_token!);
            setMedications(updatedData);
            onSaved?.();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to remove');
          }
        },
      },
    ]);
  };

  const styles = useStyles(theme => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: Radius.md,
      backgroundColor: theme.colors.bgCard, borderWidth: 1, borderColor: theme.colors.bgCardBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    card: { padding: Spacing.lg, marginBottom: Spacing.md },
    sectionLabel: {
      fontSize: Typography.xs, fontWeight: Typography.bold, color: theme.colors.textMuted,
      letterSpacing: 1, marginBottom: Spacing.sm,
    },
    medName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    medDetail: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: 4 },
    datePickerBtn: {
      backgroundColor: theme.colors.bgCardSolid, borderWidth: 1, borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    datePickerText: { fontSize: Typography.base, color: theme.colors.textPrimary },
    timeList: { marginBottom: Spacing.md },
    timeRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    timeRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    timeDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: theme.colors.amber,
    },
    timeValue: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    timeMilitary: { fontSize: Typography.sm, color: theme.colors.textMuted },
    emptyTimes: { fontSize: Typography.sm, color: theme.colors.textMuted, fontStyle: 'italic', marginBottom: Spacing.md },
    addTimeBtn: {
      backgroundColor: theme.colors.amber + '15', borderWidth: 1, borderColor: theme.colors.amber + '40',
      borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center',
    },
    addTimeBtnText: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: theme.colors.amber },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
    toggle: {
      width: 48, height: 28, borderRadius: 14, backgroundColor: theme.colors.bgCardBorder,
      justifyContent: 'center', paddingHorizontal: 3,
    },
    toggleActive: { backgroundColor: theme.colors.amber },
    toggleKnob: {
      width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
    },
    toggleKnobActive: { alignSelf: 'flex-end' },
    toggleLabel: { fontSize: Typography.base, color: theme.colors.textPrimary, flex: 1 },
    weekdayRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.md },
    weekdayBtn: {
      flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm,
      borderWidth: 1, borderColor: theme.colors.bgCardBorder, alignItems: 'center',
    },
    weekdayBtnActive: { backgroundColor: theme.colors.amber + '20', borderColor: theme.colors.amber + '50' },
    weekdayText: { fontSize: Typography.xs, color: theme.colors.textMuted, fontWeight: Typography.semiBold },
    weekdayTextActive: { color: theme.colors.amber },
    saveBtn: {
      backgroundColor: theme.colors.amber, borderRadius: Radius.md,
      paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
    entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
    entryInfo: { flex: 1 },
    entryName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    entryDetail: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: 2 },
    entrySchedule: { fontSize: Typography.sm, color: theme.colors.amber, marginTop: 2 },
    entryNoReminder: { fontSize: Typography.sm, color: theme.colors.textMuted, marginTop: 2, fontStyle: 'italic' },
    chevron: { fontSize: Typography.lg, color: theme.colors.textMuted, paddingLeft: Spacing.sm },
    divider: { height: 1, backgroundColor: theme.colors.divider },
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
    emptyIcon: { fontSize: Typography.xxl, marginBottom: Spacing.md },
    emptyText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    emptySub: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  }));

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color={theme.colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Medications</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.amber} />
        </View>
      </View>
    );
  }

  if (selectedMed) {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={resetForm} activeOpacity={0.7}>
            <ArrowLeft size={22} color={theme.colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{selectedMed.name}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <GlassCardView style={styles.card}>
            <Text style={styles.sectionLabel}>MEDICATION</Text>
            <Text style={styles.medName}>{selectedMed.name}</Text>
            {(selectedMed.dosage || selectedMed.frequency) && (
              <Text style={styles.medDetail}>
                {[selectedMed.dosage, selectedMed.frequency].filter(Boolean).join(' · ')}
              </Text>
            )}
          </GlassCardView>

          <GlassCardView style={styles.card}>
            <Text style={styles.sectionLabel}>START DATE</Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}>
              <Text style={styles.datePickerText}>{formatDisplayDate(startDate)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartDateChange}
              />
            )}
          </GlassCardView>

          <GlassCardView style={styles.card}>
            <Text style={styles.sectionLabel}>NOTIFICATION TIMES</Text>

            {times.length > 0 && (
              <View style={styles.timeList}>
                {times.map((t, i) => (
                  <View key={t} style={styles.timeRow}>
                    <View style={styles.timeRowLeft}>
                      <View style={styles.timeDot} />
                      <Text style={styles.timeValue}>{formatTime12h(t)}</Text>
                      <Text style={styles.timeMilitary}>{t}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeTimeFromList(t)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Trash2 size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {times.length === 0 && (
              <Text style={styles.emptyTimes}>No times added yet</Text>
            )}

            <TouchableOpacity
              style={styles.addTimeBtn}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}>
              <Text style={styles.addTimeBtnText}>+ Add Time</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}
          </GlassCardView>

          <GlassCardView style={styles.card}>
            <Text style={styles.sectionLabel}>REPEAT</Text>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setRepeat(!repeat)}
              activeOpacity={0.7}>
              <View style={[styles.toggle, repeat && styles.toggleActive]}>
                <View style={[styles.toggleKnob, repeat && styles.toggleKnobActive]} />
              </View>
              <Text style={styles.toggleLabel}>{repeat ? 'Repeat' : 'Once'}</Text>
            </TouchableOpacity>

            {repeat && (
              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.weekdayBtn, selectedWeekdays.includes(idx) && styles.weekdayBtnActive]}
                    onPress={() => {
                      setSelectedWeekdays(prev =>
                        prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                      );
                    }}
                    activeOpacity={0.7}>
                    <Text style={[styles.weekdayText, selectedWeekdays.includes(idx) && styles.weekdayTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </GlassCardView>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Reminder'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={theme.colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Medications</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassCardView style={styles.card}>
          {medications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyText}>No medications found</Text>
              <Text style={styles.emptySub}>Add medications in your Health Profile first</Text>
            </View>
          ) : (
            medications.map((med, i, arr) => {
              const schedules = getSchedules(med);
              const hasReminder = !!med.reminder;

              return (
                <View key={med.id}>
                  <TouchableOpacity
                    style={styles.entryRow}
                    onPress={() => tapMedication(med)}
                    activeOpacity={0.7}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{med.name}</Text>
                      <Text style={styles.entryDetail}>
                        {[med.dosage, med.frequency].filter(Boolean).join(' · ')}
                      </Text>
                      {hasReminder ? (
                        <Text style={styles.entrySchedule}>
                          {formatTimes(schedules)}
                        </Text>
                      ) : (
                        <Text style={styles.entryNoReminder}>Tap to set up reminders</Text>
                      )}
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
        </GlassCardView>
      </ScrollView>
    </View>
  );
}
