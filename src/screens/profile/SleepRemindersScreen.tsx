import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { ArrowLeft } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';
import { useReminders } from '../../providers/ReminderContext';
import type { Reminder, ReminderSchedule } from '../../types/reminder';

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

export default function SleepRemindersScreen({ onBack, onSaved }: Props) {
  const { getRemindersByCategory, addReminder, removeReminder, addReminderSchedule, fetchSchedules } = useReminders();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Map<number, ReminderSchedule[]>>(new Map());

  const [newBedtime, setNewBedtime] = useState('');
  const [newWakeTime, setNewWakeTime] = useState('');
  const [newTarget, setNewTarget] = useState('');

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

  const handleAdd = async () => {
    if (!newBedtime.trim()) return;
    try {
      setSaving(true);
      const desc = [newWakeTime.trim() ? `Wake: ${newWakeTime.trim()}` : '', newTarget.trim() ? `Target: ${newTarget.trim()} hrs` : ''].filter(Boolean).join(' · ');
      const reminder = await addReminder({
        category: 'sleep',
        title: `Bedtime: ${newBedtime.trim()}`,
        description: desc || undefined,
        start_date: new Date().toISOString().split('T')[0],
        repeat: true,
      });
      // Parse HH:MM from bedtime string for schedule
      const timeMatch = newBedtime.trim().match(/(\d{1,2}):?(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const mins = timeMatch[2] || '00';
        if (timeMatch[3] && timeMatch[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (timeMatch[3] && timeMatch[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
        const notifyTime = `${hours.toString().padStart(2, '0')}:${mins}`;
        const schedule = await addReminderSchedule(reminder.reminder_id, { notify_at: notifyTime, enabled: true }, reminder);
        setSchedulesMap(prev => { const next = new Map(prev); next.set(reminder.reminder_id, [schedule]); return next; });
      }
      setReminders(prev => prev.some(r => r.reminder_id === reminder.reminder_id) ? prev : [reminder, ...prev]);
      setNewBedtime(''); setNewWakeTime(''); setNewTarget('');
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
    if (!newBedtime.trim()) {
      setEditing(false);
      onSaved?.();
      return;
    }
    try {
      setSaving(true);
      const desc = [newWakeTime.trim() ? `Wake: ${newWakeTime.trim()}` : '', newTarget.trim() ? `Target: ${newTarget.trim()} hrs` : ''].filter(Boolean).join(' · ');
      const reminder = await addReminder({
        category: 'sleep',
        title: `Bedtime: ${newBedtime.trim()}`,
        description: desc || undefined,
        start_date: new Date().toISOString().split('T')[0],
        repeat: true,
      });
      const timeMatch = newBedtime.trim().match(/(\d{1,2}):?(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const mins = timeMatch[2] || '00';
        if (timeMatch[3] && timeMatch[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (timeMatch[3] && timeMatch[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
        const notifyTime = `${hours.toString().padStart(2, '0')}:${mins}`;
        const schedule = await addReminderSchedule(reminder.reminder_id, { notify_at: notifyTime, enabled: true }, reminder);
        setSchedulesMap(prev => { const next = new Map(prev); next.set(reminder.reminder_id, [schedule]); return next; });
      }
      setReminders(prev => prev.some(r => r.reminder_id === reminder.reminder_id) ? prev : [reminder, ...prev]);
      setNewBedtime(''); setNewWakeTime(''); setNewTarget('');
      Alert.alert('Saved', 'Sleep reminder added');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save reminder');
    } finally {
      setSaving(false);
      setEditing(false);
      onSaved?.();
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}><ArrowLeft size={22} color={Colors.text} strokeWidth={2} /></TouchableOpacity>
          <Text style={styles.pageTitle}>Sleep Reminders</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.purple} /></View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}><ArrowLeft size={22} color={Colors.text} strokeWidth={2} /></TouchableOpacity>
        <Text style={styles.pageTitle}>Sleep Reminders</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => (editing ? handleSave() : setEditing(true))} activeOpacity={0.7}>
          <Text style={[styles.editBtnText, editing && styles.editBtnSave]}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {editing && (
          <GlassCardView style={styles.card}>
            <Text style={styles.addTitle}>Add Sleep Reminder</Text>
            <TextInput style={styles.input} value={newBedtime} onChangeText={setNewBedtime} placeholder="Bedtime (e.g. 22:30)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={newWakeTime} onChangeText={setNewWakeTime} placeholder="Wake time (e.g. 06:30)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={newTarget} onChangeText={setNewTarget} placeholder="Target hours (e.g. 8)" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />
            <TouchableOpacity style={[styles.addBtn, saving && styles.addBtnDisabled]} onPress={handleAdd} activeOpacity={0.7} disabled={saving}>
              <Text style={styles.addBtnText}>{saving ? 'Adding...' : '+ Add'}</Text>
            </TouchableOpacity>
          </GlassCardView>
        )}

        <GlassCardView style={styles.card}>
          {reminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌙</Text>
              <Text style={styles.emptyText}>No sleep reminders</Text>
              <Text style={styles.emptySub}>Tap Edit to set bedtime and wake reminders</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  editBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.purple },
  editBtnSave: { color: Colors.success },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
  card: { padding: Spacing.lg, marginBottom: Spacing.lg },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  entryInfo: { flex: 1 },
  entryName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  entryDetail: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  removeBtn: { fontSize: Typography.md, color: Colors.danger, padding: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.divider },
  addTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  input: { backgroundColor: Colors.bgCardSolid, borderWidth: 1, borderColor: Colors.bgCardBorder, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.sm },
  addBtn: { backgroundColor: Colors.purple + '20', borderWidth: 1, borderColor: Colors.purple + '50', borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.purple },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: Typography.xxl, marginBottom: Spacing.md },
  emptyText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  emptySub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
});
