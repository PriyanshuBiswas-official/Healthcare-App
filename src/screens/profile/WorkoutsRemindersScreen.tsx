import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { ArrowLeft } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';

interface WorkoutEntry {
  type: string;
  duration: string;
  time: string;
  days: string;
}

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

export default function WorkoutsRemindersScreen({ onBack, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [newType, setNewType] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDays, setNewDays] = useState('');

  const addEntry = () => {
    if (!newType.trim()) return;
    setEntries(prev => [
      ...prev,
      { type: newType.trim(), duration: newDuration.trim(), time: newTime.trim(), days: newDays.trim() },
    ]);
    setNewType('');
    setNewDuration('');
    setNewTime('');
    setNewDays('');
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setEditing(false);
    onSaved?.();
    Alert.alert('Saved', 'Workout reminders updated');
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Workout Reminders</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => (editing ? handleSave() : setEditing(true))}
          activeOpacity={0.7}>
          <Text style={[styles.editBtnText, editing && styles.editBtnSave]}>
            {editing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {editing ? (
          <>
            {entries.length > 0 && (
              <GlassCardView style={styles.card}>
                {entries.map((entry, i) => (
                  <View key={i}>
                    <View style={styles.entryRow}>
                      <View style={styles.entryInfo}>
                        <Text style={styles.entryName}>{entry.type}</Text>
                        <Text style={styles.entryDetail}>
                          {entry.duration}{entry.time ? ` · ${entry.time}` : ''}{entry.days ? ` · ${entry.days}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeEntry(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.removeBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    {i < entries.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </GlassCardView>
            )}

            <GlassCardView style={styles.card}>
              <Text style={styles.addTitle}>Add Workout Reminder</Text>
              <TextInput
                style={styles.input}
                value={newType}
                onChangeText={setNewType}
                placeholder="Workout type (e.g. Strength Training)"
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={newDuration}
                onChangeText={setNewDuration}
                placeholder="Duration (e.g. 45 min)"
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={newTime}
                onChangeText={setNewTime}
                placeholder="Time (e.g. 07:00 AM)"
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={newDays}
                onChangeText={setNewDays}
                placeholder="Days (e.g. Mon, Wed, Fri)"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addEntry} activeOpacity={0.7}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </GlassCardView>
          </>
        ) : (
          <GlassCardView style={styles.card}>
            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💪</Text>
                <Text style={styles.emptyText}>No workout reminders</Text>
                <Text style={styles.emptySub}>Tap Edit to schedule workout reminders</Text>
              </View>
            ) : (
              entries.map((entry, i) => (
                <View key={i}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{entry.type}</Text>
                      <Text style={styles.entryDetail}>
                        {entry.duration}{entry.time ? ` · ${entry.time}` : ''}{entry.days ? ` · ${entry.days}` : ''}
                      </Text>
                    </View>
                  </View>
                  {i < entries.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </GlassCardView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  editBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.pink,
  },
  editBtnSave: { color: Colors.success },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
  card: { padding: Spacing.lg, marginBottom: Spacing.lg },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  entryInfo: { flex: 1 },
  entryName: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  entryDetail: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: { fontSize: Typography.md, color: Colors.danger, padding: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.divider },
  addTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  addBtn: {
    backgroundColor: Colors.pink + '20',
    borderWidth: 1,
    borderColor: Colors.pink + '50',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.pink,
  },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: Typography.xxl, marginBottom: Spacing.md },
  emptyText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  emptySub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
});
