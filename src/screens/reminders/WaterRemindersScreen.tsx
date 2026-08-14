import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  InteractionManager,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Pencil, Check } from 'lucide-react-native';
import { GlassCardView, BackButton } from '../../components/SharedComponents';
import { useReminders } from '../../providers/ReminderContext';
import type { Reminder, ReminderSchedule } from '../../types/reminder';

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const INTERVAL_OPTIONS = [
  { label: 'Every 1 hour', value: 1 },
  { label: 'Every 2 hours', value: 2 },
  { label: 'Every 3 hours', value: 3 },
  { label: 'Every 4 hours', value: 4 },
  { label: 'Every 6 hours', value: 6 },
  { label: 'Every 8 hours', value: 8 },
  { label: 'Every 12 hours', value: 12 },
];

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function getIntervalLabel(interval: number): string {
  const opt = INTERVAL_OPTIONS.find(o => o.value === interval);
  return opt ? opt.label : `Every ${interval} hours`;
}

function getFireTimesPreview(startHHMM: string, intervalHours: number): string[] {
  const [h, m] = startHHMM.split(':').map(Number);
  const times: string[] = [];
  let currentH = h;
  while (currentH < 24) {
    times.push(`${String(currentH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentH += intervalHours;
  }
  return times;
}

function isIntervalValid(startHHMM: string, intervalHours: number): boolean {
  const [h] = startHHMM.split(':').map(Number);
  const fireTimes = getFireTimesPreview(startHHMM, intervalHours);
  return fireTimes.length >= 2 && fireTimes.length <= 12;
}

export default function WaterRemindersScreen({ onBack, onSaved }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getRemindersByCategory, addReminder, editReminder, removeReminder, addReminderSchedule, removeSchedule, fetchSchedules, getSchedulesForReminder } = useReminders();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Map<number, ReminderSchedule[]>>(new Map());

  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [intervalHours, setIntervalHours] = useState(2);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const items = getRemindersByCategory('water');
      setReminders(items);
      const newMap = new Map<number, ReminderSchedule[]>();
      for (const r of items) {
        const scheds = await fetchSchedules(r.reminder_id);
        newMap.set(r.reminder_id, scheds);
      }
      setSchedulesMap(newMap);
    } catch (err) {
      console.error('[WaterReminders] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [getRemindersByCategory, fetchSchedules]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => { loadData(); });
    return () => task.cancel();
  }, [loadData]);

  function resetForm() {
    setAmount('');
    setStartTime('08:00');
    setIntervalHours(2);
    setShowTimePicker(false);
    setShowAddForm(false);
    setEditingReminder(null);
  }

  const onTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) {
      const h = String(selected.getHours()).padStart(2, '0');
      const m = String(selected.getMinutes()).padStart(2, '0');
      setStartTime(`${h}:${m}`);
    }
  };

  const startEdit = (reminder: Reminder) => {
    const scheds = schedulesMap.get(reminder.reminder_id) || [];
    const sched = scheds[0];
    setEditingReminder(reminder);
    const amountMatch = reminder.title.match(/^(\d+)/);
    setAmount(amountMatch ? amountMatch[1] : '');
    if (sched) {
      setStartTime(sched.notify_at);
      setIntervalHours(sched.repeat_interval || 2);
    }
    setShowAddForm(true);
  };

  const handleAdd = async () => {
    if (!amount.trim()) {
      Alert.alert('Required', 'Enter an amount in ml');
      return;
    }
    if (!TIME_RE.test(startTime)) {
      Alert.alert('Invalid time', 'Time must be in HH:MM format');
      return;
    }
    if (!isIntervalValid(startTime, intervalHours)) {
      Alert.alert('Invalid interval', 'With this start time and interval, there must be at least 2 notifications before midnight');
      return;
    }
    try {
      setSaving(true);
      const reminder = await addReminder({
        category: 'water',
        title: `${amount.trim()} ml`,
        description: `${amount.trim()} ml every ${intervalHours}h`,
        start_date: new Date().toISOString().split('T')[0],
        repeat: true,
      });
      await addReminderSchedule(reminder.reminder_id, {
        notify_at: startTime,
        enabled: true,
        repeat_type: 'interval',
        repeat_interval: intervalHours,
        interval_unit: 'hours',
      }, reminder);
      resetForm();
      const scheds = await fetchSchedules(reminder.reminder_id);
      setReminders(prev => [reminder, ...prev]);
      setSchedulesMap(prev => {
        const next = new Map(prev);
        next.set(reminder.reminder_id, scheds);
        return next;
      });
      onSaved?.();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingReminder) return;
    if (!amount.trim()) {
      Alert.alert('Required', 'Enter an amount in ml');
      return;
    }
    if (!isIntervalValid(startTime, intervalHours)) {
      Alert.alert('Invalid interval', 'With this start time and interval, there must be at least 2 notifications before midnight');
      return;
    }
    try {
      setSaving(true);
      await editReminder(editingReminder.reminder_id, {
        title: `${amount.trim()} ml`,
      });

      const existing = getSchedulesForReminder(editingReminder.reminder_id);
      for (const s of existing) {
        await removeSchedule(s.reminder_schedule_id, editingReminder.reminder_id);
      }
      await addReminderSchedule(editingReminder.reminder_id, {
        notify_at: startTime,
        enabled: true,
        repeat_type: 'interval',
        repeat_interval: intervalHours,
        interval_unit: 'hours',
      }, editingReminder);

      resetForm();
      const scheds = await fetchSchedules(editingReminder.reminder_id);
      setReminders(prev => prev.map(r => r.reminder_id === editingReminder.reminder_id ? { ...r, title: `${amount.trim()} ml` } : r));
      setSchedulesMap(prev => {
        const next = new Map(prev);
        next.set(editingReminder.reminder_id, scheds);
        return next;
      });
      onSaved?.();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (reminder: Reminder) => {
    Alert.alert('Remove', `Remove "${reminder.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeReminder(reminder.reminder_id);
            setReminders(prev => prev.filter(r => r.reminder_id !== reminder.reminder_id));
            setSchedulesMap(prev => {
              const next = new Map(prev);
              next.delete(reminder.reminder_id);
              return next;
            });
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
      paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl, paddingBottom: Spacing.md,
    },
    pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    addTopBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    addTopBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.blue },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    card: { padding: Spacing.lg, marginBottom: Spacing.md },
    sectionLabel: {
      fontSize: Typography.xs, fontWeight: Typography.bold, color: theme.colors.textMuted,
      letterSpacing: 1, marginBottom: Spacing.md,
    },
    subLabel: {
      fontSize: Typography.xs, fontWeight: Typography.bold, color: theme.colors.textMuted,
      letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.bgCardSolid, borderWidth: 1, borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      fontSize: Typography.base, color: theme.colors.textPrimary, marginBottom: Spacing.sm,
    },
    timePickerBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: theme.colors.bgCardSolid, borderWidth: 1, borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      marginBottom: Spacing.sm,
    },
    timePickerText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    timePickerMilitary: { fontSize: Typography.sm, color: theme.colors.textMuted },
    intervalList: { marginBottom: Spacing.md },
    intervalRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    intervalRowSelected: { backgroundColor: theme.colors.blue + '10', marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md, borderRadius: Radius.md },
    intervalRowDisabled: { opacity: 0.4 },
    intervalLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    intervalRadio: {
      width: 20, height: 20, borderRadius: 10, borderWidth: 2,
      borderColor: theme.colors.textMuted, alignItems: 'center', justifyContent: 'center',
    },
    intervalRadioSelected: { borderColor: theme.colors.blue, backgroundColor: theme.colors.blue },
    intervalLabel: { fontSize: Typography.base, color: theme.colors.textPrimary },
    intervalLabelSelected: { fontWeight: Typography.semiBold },
    intervalLabelDisabled: { color: theme.colors.textMuted },
    intervalCount: { fontSize: Typography.sm, color: theme.colors.textMuted },
    previewRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md,
    },
    previewDot: {
      backgroundColor: theme.colors.blue + '15', borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    },
    previewTime: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: theme.colors.blue },
    saveBtn: {
      backgroundColor: theme.colors.blue, borderRadius: Radius.md,
      paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
    entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
    entryInfo: { flex: 1 },
    entryName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    entrySchedule: { fontSize: Typography.sm, color: theme.colors.blue, marginTop: 2 },
    entryActions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
    divider: { height: 1, backgroundColor: theme.colors.divider },
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
    emptyIcon: { fontSize: Typography.xxl, marginBottom: Spacing.md },
    emptyText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    emptySub: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: Spacing.xs },
  }));

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <BackButton onPress={onBack} color={theme.colors.textPrimary} />
          <Text style={styles.pageTitle}>Water Reminders</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.blue} />
        </View>
      </View>
    );
  }

  const fireTimes = getFireTimesPreview(startTime, intervalHours);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <BackButton onPress={onBack} color={theme.colors.textPrimary} />
        <Text style={styles.pageTitle}>Water Reminders</Text>
        <TouchableOpacity
          style={styles.addTopBtn}
          onPress={() => {
            if (showAddForm) {
              resetForm();
            } else {
              setShowAddForm(true);
            }
          }}
          activeOpacity={0.7}>
          <Text style={styles.addTopBtnText}>{showAddForm ? '✕' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {showAddForm && (
          <GlassCardView style={styles.card}>
            <Text style={styles.sectionLabel}>{editingReminder ? 'EDIT REMINDER' : 'NEW WATER REMINDER'}</Text>

            <Text style={styles.subLabel}>AMOUNT (ML)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 250"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
            />

            <Text style={styles.subLabel}>START TIME</Text>
            <TouchableOpacity
              style={styles.timePickerBtn}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}>
              <Text style={styles.timePickerText}>{formatTime12h(startTime)}</Text>
              <Text style={styles.timePickerMilitary}>{startTime}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const [h, m] = startTime.split(':').map(Number);
                  const d = new Date();
                  d.setHours(h, m, 0, 0);
                  return d;
                })()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            <Text style={styles.subLabel}>REPEAT INTERVAL</Text>
            <View style={styles.intervalList}>
              {INTERVAL_OPTIONS.map(opt => {
                const valid = isIntervalValid(startTime, opt.value);
                const selected = intervalHours === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.intervalRow,
                      selected && styles.intervalRowSelected,
                      !valid && styles.intervalRowDisabled,
                    ]}
                    onPress={() => valid && setIntervalHours(opt.value)}
                    activeOpacity={valid ? 0.7 : 1}>
                    <View style={styles.intervalLeft}>
                      <View style={[styles.intervalRadio, selected && styles.intervalRadioSelected]}>
                        {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.intervalLabel, selected && styles.intervalLabelSelected, !valid && styles.intervalLabelDisabled]}>
                        {opt.label}
                      </Text>
                    </View>
                    {valid && (
                      <Text style={styles.intervalCount}>
                        {getFireTimesPreview(startTime, opt.value).length}x/day
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.subLabel}>NOTIFICATIONS AT</Text>
            <View style={styles.previewRow}>
              {fireTimes.map(t => (
                <View key={t} style={styles.previewDot}>
                  <Text style={styles.previewTime}>{formatTime12h(t)}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={editingReminder ? handleUpdate : handleAdd}
              activeOpacity={0.7}
              disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editingReminder ? 'Save Changes' : 'Save Reminder'}</Text>
            </TouchableOpacity>
          </GlassCardView>
        )}

        <GlassCardView style={styles.card}>
          {reminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💧</Text>
              <Text style={styles.emptyText}>No water reminders</Text>
              <Text style={styles.emptySub}>Tap + Add to create one</Text>
            </View>
          ) : (
            reminders.map((reminder, i) => {
              const scheds = schedulesMap.get(reminder.reminder_id) || [];
              const sched = scheds[0];
              return (
                <View key={reminder.reminder_id}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{reminder.title}</Text>
                      {sched && (
                        <Text style={styles.entrySchedule}>
                          {formatTime12h(sched.notify_at)} · Every {sched.repeat_interval}h · {getFireTimesPreview(sched.notify_at, sched.repeat_interval).length}x/day
                        </Text>
                      )}
                    </View>
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        onPress={() => startEdit(reminder)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Pencil size={18} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemove(reminder)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Trash2 size={18} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {i < reminders.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
        </GlassCardView>
      </ScrollView>
    </View>
  );
}
