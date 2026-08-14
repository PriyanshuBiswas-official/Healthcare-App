import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  InteractionManager,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCardView, BackButton, LoadingSpinner } from '../../components/SharedComponents';
import { useReminders } from '../../providers/ReminderContext';
import type { Reminder, ReminderSchedule } from '../../types/reminder';

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function WorkoutsRemindersScreen({ onBack, onSaved }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getRemindersByCategory, addReminder, removeReminder, addReminderSchedule, fetchSchedules } = useReminders();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Map<number, ReminderSchedule[]>>(new Map());

  const [newType, setNewType] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDays, setNewDays] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const workoutReminders = getRemindersByCategory('workout');
      setReminders(workoutReminders);
      const newMap = new Map<number, ReminderSchedule[]>();
      for (const r of workoutReminders) {
        const scheds = await fetchSchedules(r.reminder_id);
        newMap.set(r.reminder_id, scheds);
      }
      setSchedulesMap(newMap);
    } catch (err) {
      console.error('[WorkoutsReminders] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [getRemindersByCategory, fetchSchedules]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => { loadData(); });
    return () => task.cancel();
  }, [loadData]);

  const handleAdd = async () => {
    if (!newType.trim()) return;
    if (newTime.trim() && !TIME_RE.test(newTime.trim())) { Alert.alert('Invalid time', 'Time must be in HH:MM format (e.g. 09:00)'); return; }
    try {
      setSaving(true);
      const desc = [newDuration.trim(), newDays.trim()].filter(Boolean).join(' · ');
      const reminder = await addReminder({
        category: 'workout',
        title: newType.trim(),
        description: desc || undefined,
        start_date: new Date().toISOString().split('T')[0],
        repeat: true,
      });
      if (newTime.trim()) {
        const schedule = await addReminderSchedule(reminder.reminder_id, {
          notify_at: newTime.trim(),
          enabled: true,
          repeat_type: 'daily',
          repeat_interval: 1,
          interval_unit: 'days',
        }, reminder);
        setSchedulesMap(prev => {
          const next = new Map(prev);
          next.set(reminder.reminder_id, [schedule]);
          return next;
        });
      }
      setReminders(prev => prev.some(r => r.reminder_id === reminder.reminder_id) ? prev : [reminder, ...prev]);
      setNewType(''); setNewDuration(''); setNewTime(''); setNewDays('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (reminder: Reminder) => {
    try {
      await removeReminder(reminder.reminder_id);
      setReminders(prev => prev.filter(r => r.reminder_id !== reminder.reminder_id));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove');
    }
  };

  const handleSave = async () => {
    if (!newType.trim()) {
      setEditing(false);
      onSaved?.();
      return;
    }
    try {
      setSaving(true);
      if (newTime.trim() && !TIME_RE.test(newTime.trim())) { Alert.alert('Invalid time', 'Time must be in HH:MM format (e.g. 09:00)'); return; }
      const desc = [newDuration.trim(), newDays.trim()].filter(Boolean).join(' · ');
      const reminder = await addReminder({
        category: 'workout',
        title: newType.trim(),
        description: desc || undefined,
        start_date: new Date().toISOString().split('T')[0],
        repeat: true,
      });
      if (newTime.trim()) {
        const schedule = await addReminderSchedule(reminder.reminder_id, {
          notify_at: newTime.trim(),
          enabled: true,
          repeat_type: 'daily',
          repeat_interval: 1,
          interval_unit: 'days',
        }, reminder);
        setSchedulesMap(prev => {
          const next = new Map(prev);
          next.set(reminder.reminder_id, [schedule]);
          return next;
        });
      }
      setReminders(prev => prev.some(r => r.reminder_id === reminder.reminder_id) ? prev : [reminder, ...prev]);
      setNewType(''); setNewDuration(''); setNewTime(''); setNewDays('');
      Alert.alert('Saved', 'Workout reminder added');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save reminder');
    } finally {
      setSaving(false);
      setEditing(false);
      onSaved?.();
    }
  };

  const styles = useStyles(theme => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl, paddingBottom: Spacing.md },
    pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    editBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.pink },
    editBtnSave: { color: theme.colors.success },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    card: { padding: Spacing.lg, marginBottom: Spacing.lg },
    entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
    entryInfo: { flex: 1 },
    entryName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    entryDetail: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: 2 },
    removeBtn: { fontSize: Typography.md, color: theme.colors.danger, padding: Spacing.sm },
    divider: { height: 1, backgroundColor: theme.colors.divider },
    addTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary, marginBottom: Spacing.md },
    input: { backgroundColor: theme.colors.bgCardSolid, borderWidth: 1, borderColor: theme.colors.bgCardBorder, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Typography.base, color: theme.colors.textPrimary, marginBottom: Spacing.sm },
    addBtn: { backgroundColor: theme.colors.pink + '20', borderWidth: 1, borderColor: theme.colors.pink + '50', borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
    addBtnDisabled: { opacity: 0.6 },
    addBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.pink },
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
          <Text style={styles.pageTitle}>Workout Reminders</Text>
          <View style={{ width: 60 }} />
        </View>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <BackButton onPress={onBack} color={theme.colors.textPrimary} />
        <Text style={styles.pageTitle}>Workout Reminders</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => (editing ? handleSave() : setEditing(true))} activeOpacity={0.7}>
          <Text style={[styles.editBtnText, editing && styles.editBtnSave]}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {editing && (
          <GlassCardView style={styles.card}>
            <Text style={styles.addTitle}>Add Workout Reminder</Text>
            <TextInput style={styles.input} value={newType} onChangeText={setNewType} placeholder="Workout type (e.g. Strength Training)" placeholderTextColor={theme.colors.textMuted} />
            <TextInput style={styles.input} value={newDuration} onChangeText={setNewDuration} placeholder="Duration (e.g. 45 min)" placeholderTextColor={theme.colors.textMuted} />
            <TextInput style={styles.input} value={newTime} onChangeText={setNewTime} placeholder="Time (HH:MM)" placeholderTextColor={theme.colors.textMuted} />
            <TextInput style={styles.input} value={newDays} onChangeText={setNewDays} placeholder="Days (e.g. Mon, Wed, Fri)" placeholderTextColor={theme.colors.textMuted} />
            <TouchableOpacity style={[styles.addBtn, saving && styles.addBtnDisabled]} onPress={handleAdd} activeOpacity={0.7} disabled={saving}>
              <Text style={styles.addBtnText}>{saving ? 'Adding...' : '+ Add'}</Text>
            </TouchableOpacity>
          </GlassCardView>
        )}

        <GlassCardView style={styles.card}>
          {reminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💪</Text>
              <Text style={styles.emptyText}>No workout reminders</Text>
              <Text style={styles.emptySub}>Tap Edit to schedule workout reminders</Text>
            </View>
          ) : (
            reminders.map((reminder, i) => {
              const scheds = schedulesMap.get(reminder.reminder_id) || [];
              const timeStr = scheds.map(s => s.notify_at).join(', ');
              return (
                <View key={reminder.reminder_id}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{reminder.title}</Text>
                      <Text style={styles.entryDetail}>{timeStr}{reminder.description ? ` · ${reminder.description}` : ''}</Text>
                    </View>
                    {editing && (
                      <TouchableOpacity onPress={() => handleRemove(reminder)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.removeBtn}>✕</Text>
                      </TouchableOpacity>
                    )}
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
