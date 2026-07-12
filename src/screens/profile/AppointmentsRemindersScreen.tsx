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

export default function AppointmentsRemindersScreen({ onBack, onSaved }: Props) {
  const { getRemindersByCategory, addReminder, removeReminder, addReminderSchedule, fetchSchedules } = useReminders();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Map<number, ReminderSchedule[]>>(new Map());

  const [newDoctor, setNewDoctor] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newDateTime, setNewDateTime] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const items = getRemindersByCategory('appointment');
      setReminders(items);
      const newMap = new Map<number, ReminderSchedule[]>();
      for (const r of items) {
        const scheds = await fetchSchedules(r.reminder_id);
        newMap.set(r.reminder_id, scheds);
      }
      setSchedulesMap(newMap);
    } catch (err) {
      console.error('[AppointmentsReminders] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [getRemindersByCategory, fetchSchedules]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!newDoctor.trim()) return;
    try {
      setSaving(true);
      const desc = [newSpecialty.trim(), newLocation.trim()].filter(Boolean).join(' · ');
      const reminder = await addReminder({
        category: 'appointment',
        title: newDoctor.trim(),
        description: desc || undefined,
        start_date: newDateTime.trim() || new Date().toISOString().split('T')[0],
        repeat: false,
      });
      if (newDateTime.trim()) {
        const schedule = await addReminderSchedule(reminder.reminder_id, {
          notify_at: '09:00',
          enabled: true,
        }, reminder);
        setSchedulesMap(prev => {
          const next = new Map(prev);
          next.set(reminder.reminder_id, [schedule]);
          return next;
        });
      }
      setReminders(prev => prev.some(r => r.reminder_id === reminder.reminder_id) ? prev : [reminder, ...prev]);
      setNewDoctor(''); setNewSpecialty(''); setNewDateTime(''); setNewLocation('');
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
    if (!newDoctor.trim()) {
      setEditing(false);
      onSaved?.();
      return;
    }
    try {
      setSaving(true);
      const desc = [newSpecialty.trim(), newLocation.trim()].filter(Boolean).join(' · ');
      const reminder = await addReminder({
        category: 'appointment',
        title: newDoctor.trim(),
        description: desc || undefined,
        start_date: newDateTime.trim() || new Date().toISOString().split('T')[0],
        repeat: false,
      });
      if (newDateTime.trim()) {
        const schedule = await addReminderSchedule(reminder.reminder_id, {
          notify_at: '09:00',
          enabled: true,
        }, reminder);
        setSchedulesMap(prev => {
          const next = new Map(prev);
          next.set(reminder.reminder_id, [schedule]);
          return next;
        });
      }
      setReminders(prev => prev.some(r => r.reminder_id === reminder.reminder_id) ? prev : [reminder, ...prev]);
      setNewDoctor(''); setNewSpecialty(''); setNewDateTime(''); setNewLocation('');
      Alert.alert('Saved', 'Appointment reminder added');
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
          <Text style={styles.pageTitle}>Appointments</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.teal} /></View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}><ArrowLeft size={22} color={Colors.text} strokeWidth={2} /></TouchableOpacity>
        <Text style={styles.pageTitle}>Appointments</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => (editing ? handleSave() : setEditing(true))} activeOpacity={0.7}>
          <Text style={[styles.editBtnText, editing && styles.editBtnSave]}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {editing && (
          <GlassCardView style={styles.card}>
            <Text style={styles.addTitle}>Add Appointment Reminder</Text>
            <TextInput style={styles.input} value={newDoctor} onChangeText={setNewDoctor} placeholder="Doctor name" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={newSpecialty} onChangeText={setNewSpecialty} placeholder="Specialty (e.g. Cardiologist)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={newDateTime} onChangeText={setNewDateTime} placeholder="Date & time (e.g. 2025-07-20 10:30)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={newLocation} onChangeText={setNewLocation} placeholder="Location (optional)" placeholderTextColor={Colors.textMuted} />
            <TouchableOpacity style={[styles.addBtn, saving && styles.addBtnDisabled]} onPress={handleAdd} activeOpacity={0.7} disabled={saving}>
              <Text style={styles.addBtnText}>{saving ? 'Adding...' : '+ Add'}</Text>
            </TouchableOpacity>
          </GlassCardView>
        )}

        <GlassCardView style={styles.card}>
          {reminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏥</Text>
              <Text style={styles.emptyText}>No appointment reminders</Text>
              <Text style={styles.emptySub}>Tap Edit to add upcoming appointments</Text>
            </View>
          ) : (
            reminders.map((reminder, i) => {
              const scheds = schedulesMap.get(reminder.reminder_id) || [];
              return (
                <View key={reminder.reminder_id}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{reminder.title}</Text>
                      <Text style={styles.entryDetail}>{reminder.description || ''}{reminder.start_date ? ` · ${reminder.start_date}` : ''}</Text>
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
  editBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.teal },
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
  addBtn: { backgroundColor: Colors.teal + '20', borderWidth: 1, borderColor: Colors.teal + '50', borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.teal },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: Typography.xxl, marginBottom: Spacing.md },
  emptyText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  emptySub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
});
