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
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';
import { useReminders } from '../../providers/ReminderContext';
import type { Reminder, ReminderSchedule } from '../../types/reminder';

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function SleepRemindersScreen({ onBack, onSaved }: Props) {
  const { theme } = useTheme();
  const { getRemindersByCategory, addReminder, removeReminder, editReminder, addReminderSchedule, removeSchedule, fetchSchedules, getSchedulesForReminder } = useReminders();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Map<number, ReminderSchedule[]>>(new Map());

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTargetSleep, setNewTargetSleep] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const items = getRemindersByCategory('sleep');
      setReminders(items);
      const newMap = new Map<number, ReminderSchedule[]>();
      for (const r of items) {
        const scheds = await fetchSchedules(r.reminder_id);
        newMap.set(r.reminder_id, scheds);
      }
      setSchedulesMap(newMap);
    } catch (err) {
      console.error('[SleepReminders] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [getRemindersByCategory, fetchSchedules]);

  useEffect(() => { loadData(); }, [loadData]);

  function resetForm() {
    setNewTargetSleep('');
    setTimes([]);
    setShowTimePicker(false);
    setShowAddForm(false);
    setEditingReminder(null);
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

  const onTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) {
      const h = String(selected.getHours()).padStart(2, '0');
      const m = String(selected.getMinutes()).padStart(2, '0');
      addTimeToList(`${h}:${m}`);
    }
  };

  const startEdit = (reminder: Reminder) => {
    const scheds = schedulesMap.get(reminder.reminder_id) || [];
    setEditingReminder(reminder);
    const targetMatch = reminder.description?.match(/Target:\s*(.+?)(?:\s*hrs?)?$/i);
    setNewTargetSleep(targetMatch ? targetMatch[1].trim() : reminder.description || '');
    setTimes(scheds.map(s => s.notify_at).sort());
    setShowAddForm(true);
  };

  const handleAdd = async () => {
    if (times.length === 0) {
      Alert.alert('Required', 'Add at least one notification time');
      return;
    }
    try {
      setSaving(true);
      const desc = newTargetSleep.trim() ? `Target: ${newTargetSleep.trim()} hrs` : undefined;
      const reminder = await addReminder({
        category: 'sleep',
        title: 'Sleep Reminder',
        description: desc,
        start_date: new Date().toISOString().split('T')[0],
        repeat: true,
      });
      for (const t of times) {
        await addReminderSchedule(reminder.reminder_id, {
          notify_at: t,
          enabled: true,
          repeat_type: 'daily',
          repeat_interval: 1,
          interval_unit: 'days',
        }, reminder);
      }
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
    if (times.length === 0) {
      Alert.alert('Required', 'Add at least one notification time');
      return;
    }
    try {
      setSaving(true);
      const desc = newTargetSleep.trim() ? `Target: ${newTargetSleep.trim()} hrs` : undefined;
      await editReminder(editingReminder.reminder_id, {
        description: desc,
        repeat: true,
      });

      const existing = getSchedulesForReminder(editingReminder.reminder_id);
      for (const s of existing) {
        await removeSchedule(s.reminder_schedule_id, editingReminder.reminder_id);
      }
      for (const t of times) {
        await addReminderSchedule(editingReminder.reminder_id, {
          notify_at: t,
          enabled: true,
          repeat_type: 'daily',
          repeat_interval: 1,
          interval_unit: 'days',
        }, editingReminder);
      }

      resetForm();
      const scheds = await fetchSchedules(editingReminder.reminder_id);
      setReminders(prev => prev.map(r => r.reminder_id === editingReminder.reminder_id ? { ...r, description: desc || null } : r));
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
      paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: Radius.md,
      backgroundColor: theme.colors.bgCard, borderWidth: 1, borderColor: theme.colors.bgCardBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    addTopBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    addTopBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.purple },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    card: { padding: Spacing.lg, marginBottom: Spacing.md },
    sectionLabel: {
      fontSize: Typography.xs, fontWeight: Typography.bold, color: theme.colors.textMuted,
      letterSpacing: 1, marginBottom: Spacing.md,
    },
    subLabel: {
      fontSize: Typography.xs, fontWeight: Typography.bold, color: theme.colors.textMuted,
      letterSpacing: 0.5, marginBottom: Spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.bgCardSolid, borderWidth: 1, borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      fontSize: Typography.base, color: theme.colors.textPrimary, marginBottom: Spacing.sm,
    },
    timeList: { marginBottom: Spacing.md },
    timeRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    timeRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    timeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.purple },
    timeValue: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    timeMilitary: { fontSize: Typography.sm, color: theme.colors.textMuted },
    emptyTimes: { fontSize: Typography.sm, color: theme.colors.textMuted, fontStyle: 'italic', marginBottom: Spacing.md },
    addTimeBtn: {
      backgroundColor: theme.colors.purple + '15', borderWidth: 1, borderColor: theme.colors.purple + '40',
      borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center',
    },
    addTimeBtnText: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: theme.colors.purple },
    hintText: {
      fontSize: Typography.xs, color: theme.colors.textMuted, fontStyle: 'italic',
      textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm,
    },
    saveBtn: {
      backgroundColor: theme.colors.purple, borderRadius: Radius.md,
      paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#fff' },
    entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
    entryInfo: { flex: 1 },
    entryName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    entryDetail: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: 2 },
    entrySchedule: { fontSize: Typography.sm, color: theme.colors.purple, marginTop: 2 },
    entryNoSchedule: { fontSize: Typography.sm, color: theme.colors.textMuted, marginTop: 2, fontStyle: 'italic' },
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
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color={theme.colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Sleep Reminders</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.purple} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={theme.colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Sleep Reminders</Text>
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
            <Text style={styles.sectionLabel}>{editingReminder ? 'EDIT REMINDER' : 'NEW SLEEP REMINDER'}</Text>

            <Text style={styles.subLabel}>TARGET SLEEP TIME (HOURS)</Text>
            <TextInput
              style={styles.input}
              value={newTargetSleep}
              onChangeText={setNewTargetSleep}
              placeholder="e.g. 8"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
            />

            <Text style={styles.subLabel}>NOTIFICATION TIMES</Text>
            {times.length > 0 && (
              <View style={styles.timeList}>
                {times.map(t => (
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

            <Text style={styles.hintText}>Repeats every day at the set time</Text>

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
              <Text style={styles.emptyIcon}>🌙</Text>
              <Text style={styles.emptyText}>No sleep reminders</Text>
              <Text style={styles.emptySub}>Tap + Add to create one</Text>
            </View>
          ) : (
            reminders.map((reminder, i) => {
              const scheds = schedulesMap.get(reminder.reminder_id) || [];
              return (
                <View key={reminder.reminder_id}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{reminder.title}</Text>
                      {reminder.description && (
                        <Text style={styles.entryDetail}>{reminder.description}</Text>
                      )}
                      {scheds.length > 0 ? (
                        <Text style={styles.entrySchedule}>
                          {scheds.map(s => formatTime12h(s.notify_at)).join(', ')}
                        </Text>
                      ) : (
                        <Text style={styles.entryNoSchedule}>No times set</Text>
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
