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

interface SleepEntry {
  bedtime: string;
  wakeTime: string;
  targetHours: string;
}

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

export default function SleepRemindersScreen({ onBack, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [newBedtime, setNewBedtime] = useState('');
  const [newWakeTime, setNewWakeTime] = useState('');
  const [newTarget, setNewTarget] = useState('');

  const addEntry = () => {
    if (!newBedtime.trim()) return;
    setEntries(prev => [
      ...prev,
      { bedtime: newBedtime.trim(), wakeTime: newWakeTime.trim(), targetHours: newTarget.trim() },
    ]);
    setNewBedtime('');
    setNewWakeTime('');
    setNewTarget('');
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setEditing(false);
    onSaved?.();
    Alert.alert('Saved', 'Sleep reminders updated');
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Sleep Reminders</Text>
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
                        <Text style={styles.entryName}>Bedtime: {entry.bedtime}</Text>
                        <Text style={styles.entryDetail}>
                          Wake: {entry.wakeTime}{entry.targetHours ? ` · Target: ${entry.targetHours} hrs` : ''}
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
              <Text style={styles.addTitle}>Add Sleep Reminder</Text>
              <TextInput
                style={styles.input}
                value={newBedtime}
                onChangeText={setNewBedtime}
                placeholder="Bedtime (e.g. 10:30 PM)"
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={newWakeTime}
                onChangeText={setNewWakeTime}
                placeholder="Wake time (e.g. 06:30 AM)"
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={newTarget}
                onChangeText={setNewTarget}
                placeholder="Target hours (e.g. 8)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
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
                <Text style={styles.emptyIcon}>🌙</Text>
                <Text style={styles.emptyText}>No sleep reminders</Text>
                <Text style={styles.emptySub}>Tap Edit to set bedtime and wake reminders</Text>
              </View>
            ) : (
              entries.map((entry, i) => (
                <View key={i}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>Bedtime: {entry.bedtime}</Text>
                      <Text style={styles.entryDetail}>
                        Wake: {entry.wakeTime}{entry.targetHours ? ` · Target: ${entry.targetHours} hrs` : ''}
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
    color: Colors.purple,
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
    backgroundColor: Colors.purple + '20',
    borderWidth: 1,
    borderColor: Colors.purple + '50',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.purple,
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
