import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';
import { useAppointments } from '../../providers/AppointmentContext';
import { scheduleAppointmentNotifications, cancelAppointmentNotifications } from '../../services/notificationService';
import type { Appointment, AppointmentStatus } from '../../types/appointment';

interface Props {
  onBack: () => void;
  onSaved?: () => void;
}

type ScreenMode = 'list' | 'add' | 'edit';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  UPCOMING: Colors.teal,
  COMPLETED: Colors.success || '#4CAF50',
  CANCELLED: Colors.danger || '#F44336',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function ensureDrPrefix(name: string): string {
  const trimmed = name.trim();
  if (/^dr\.?\s/i.test(trimmed)) {
    return 'Dr. ' + trimmed.replace(/^dr\.?\s*/i, '');
  }
  return 'Dr. ' + trimmed;
}

export default function AppointmentsRemindersScreen({ onBack, onSaved }: Props) {
  const { appointments, isLoading, fetchAppointments, addAppointment, editAppointment, removeAppointment, updateStatus } = useAppointments();

  const [mode, setMode] = useState<ScreenMode>('list');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);

  const [doctorName, setDoctorName] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');

  const [dateObj, setDateObj] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [remind1d, setRemind1d] = useState(true);
  const [remind2h, setRemind2h] = useState(true);
  const [remindCustom, setRemindCustom] = useState(false);
  const [customDateObj, setCustomDateObj] = useState<Date | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Auto-deselect remind_1d if appointment is < 1 day away
  const isLessThan1DayAway = useMemo(() => {
    if (!dateObj) return false;
    return dateObj.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  }, [dateObj]);

  useEffect(() => {
    if (isLessThan1DayAway && remind1d) {
      setRemind1d(false);
    }
  }, [isLessThan1DayAway]);

  // ── Form Reset ──────────────────────────────────────────

  function resetForm() {
    setDoctorName('');
    setSpeciality('');
    setNotes('');
    setLocation('');
    setRemind1d(true);
    setRemind2h(true);
    setRemindCustom(false);
    setCustomDateObj(null);
    setDateObj(null);
    setEditingAppointment(null);
    setMode('list');
  }

  // ── Edit Pre-fill ───────────────────────────────────────

  function startEdit(appt: Appointment) {
    setEditingAppointment(appt);
    setDoctorName(appt.doctor_name.replace(/^Dr\.?\s*/i, ''));
    setSpeciality(appt.speciality);
    setDateObj(new Date(appt.date_with_time));
    setLocation(appt.location || '');
    setNotes(appt.notes || '');
    setRemind1d(appt.remind_1d);
    setRemind2h(appt.remind_2h);
    setRemindCustom(!!appt.remind_custom);
    setCustomDateObj(appt.remind_custom ? new Date(appt.remind_custom) : null);
    setMode('edit');
  }

  // ── Date/Time Handlers ──────────────────────────────────

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) {
      const updated = new Date(dateObj || new Date());
      updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setDateObj(updated);
    }
  };

  const onTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) {
      const updated = new Date(dateObj || new Date());
      updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setDateObj(updated);
    }
  };

  const onCustomDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowCustomDatePicker(false);
    if (selected) {
      const base = customDateObj || new Date();
      const updated = new Date(base);
      updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setCustomDateObj(updated);
    }
  };

  const onCustomTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowCustomTimePicker(false);
    if (selected) {
      const base = customDateObj || new Date();
      const updated = new Date(base);
      updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setCustomDateObj(updated);
    }
  };

  // ── Add / Edit Handlers ─────────────────────────────────

  function validateForm(): boolean {
    if (!doctorName.trim()) { Alert.alert('Required', 'Doctor name is required'); return false; }
    if (!speciality.trim()) { Alert.alert('Required', 'Speciality is required'); return false; }
    if (!dateObj) { Alert.alert('Required', 'Please select a date and time'); return false; }

    const now = Date.now();
    if (dateObj.getTime() <= now) { Alert.alert('Invalid', 'Date & time must be in the future'); return false; }

    if (remindCustom) {
      if (!customDateObj) { Alert.alert('Required', 'Please select a custom reminder date & time'); return false; }
      if (customDateObj.getTime() <= now) { Alert.alert('Invalid', 'Custom reminder time must be in the future'); return false; }
      if (customDateObj.getTime() >= dateObj.getTime()) { Alert.alert('Invalid', 'Custom reminder must be before the appointment'); return false; }
    }

    return true;
  }

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const appointment = await addAppointment({
        doctor_name: ensureDrPrefix(doctorName),
        speciality: speciality.trim(),
        date_with_time: dateObj!.toISOString(),
        notes: notes.trim() || undefined,
        location: location.trim() || undefined,
        remind_1d: remind1d && !isLessThan1DayAway,
        remind_2h: remind2h,
        remind_custom: remindCustom && customDateObj ? customDateObj.toISOString() : undefined,
      });

      await scheduleAppointmentNotifications(appointment);
      resetForm();
      Alert.alert('Added', 'Appointment saved');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!validateForm() || !editingAppointment) return;

    try {
      setSaving(true);
      const updated = await editAppointment(editingAppointment.appointment_id, {
        doctor_name: ensureDrPrefix(doctorName),
        speciality: speciality.trim(),
        date_with_time: dateObj!.toISOString(),
        notes: notes.trim() || undefined,
        location: location.trim() || undefined,
        remind_1d: remind1d && !isLessThan1DayAway,
        remind_2h: remind2h,
        remind_custom: remindCustom && customDateObj ? customDateObj.toISOString() : undefined,
      });

      await cancelAppointmentNotifications(editingAppointment.appointment_id);
      await scheduleAppointmentNotifications(updated);

      resetForm();
      Alert.alert('Updated', 'Appointment updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update appointment');
    } finally {
      setSaving(false);
    }
  };

  // ── Status / Delete Handlers ────────────────────────────

  const handleStatusChange = async (appt: Appointment, status: AppointmentStatus) => {
    try {
      await updateStatus(appt.appointment_id, status);
      if (status === 'CANCELLED') {
        await cancelAppointmentNotifications(appt.appointment_id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (appt: Appointment) => {
    Alert.alert('Delete', `Remove appointment with ${appt.doctor_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeAppointment(appt.appointment_id);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  // ── Loading State ───────────────────────────────────────

  if (isLoading) {
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

  // ── Render ──────────────────────────────────────────────

  const upcoming = appointments.filter(a => a.status === 'UPCOMING');
  const history = appointments.filter(a => a.status !== 'UPCOMING');

  return (
    <View style={styles.root}>
      {/* ── TopBar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>
          {mode === 'list' ? 'Appointments' : mode === 'add' ? 'New Appointment' : 'Edit Appointment'}
        </Text>
        {mode === 'list' ? (
          <TouchableOpacity style={styles.topBtn} onPress={() => setMode('add')} activeOpacity={0.7}>
            <Text style={styles.topBtnAdd}>+ Add</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.topBtn} onPress={resetForm} activeOpacity={0.7}>
            <Text style={styles.topBtnCancel}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Form (add / edit) ── */}
      {mode !== 'list' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <GlassCardView style={styles.card}>
            <TextInput style={styles.input} value={doctorName} onChangeText={setDoctorName} placeholder="Doctor name *" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.input} value={speciality} onChangeText={setSpeciality} placeholder="Speciality *" placeholderTextColor={Colors.textMuted} />

            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
              <Text style={dateObj ? styles.inputText : styles.inputPlaceholder}>
                {dateObj ? dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Select date *'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
              <Text style={dateObj ? styles.inputText : styles.inputPlaceholder}>
                {dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select time *'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker value={dateObj || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} minimumDate={new Date()} />
            )}
            {showTimePicker && (
              <DateTimePicker value={dateObj || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />
            )}

            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Location (optional)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={[styles.input, styles.inputMultiline]} value={notes} onChangeText={setNotes} placeholder="Notes (optional)" placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} />

            {/* Checkboxes */}
            <View style={styles.checkboxSection}>
              <TouchableOpacity
                style={[styles.checkboxRow, isLessThan1DayAway && styles.checkboxDisabled]}
                onPress={() => { if (!isLessThan1DayAway) setRemind1d(!remind1d); }}
                activeOpacity={isLessThan1DayAway ? 1 : 0.7}
                disabled={isLessThan1DayAway}
              >
                <View style={[styles.checkbox, remind1d && styles.checkboxChecked]}>
                  {remind1d && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkboxLabel, isLessThan1DayAway && styles.checkboxLabelDisabled]}>
                  Remind 1 day before{isLessThan1DayAway ? ' (too soon)' : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setRemind2h(!remind2h)} activeOpacity={0.7}>
                <View style={[styles.checkbox, remind2h && styles.checkboxChecked]}>
                  {remind2h && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remind 2 hours before</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setRemindCustom(!remindCustom);
                  if (!remindCustom && !customDateObj && dateObj) {
                    const def = new Date(dateObj.getTime() - 60 * 60 * 1000);
                    if (def.getTime() > Date.now()) setCustomDateObj(def);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, remindCustom && styles.checkboxChecked]}>
                  {remindCustom && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Custom reminder time</Text>
              </TouchableOpacity>

              {remindCustom && (
                <View style={styles.customReminderBlock}>
                  <TouchableOpacity style={styles.input} onPress={() => setShowCustomDatePicker(true)} activeOpacity={0.7}>
                    <Text style={customDateObj ? styles.inputText : styles.inputPlaceholder}>
                      {customDateObj ? customDateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Select date *'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.input} onPress={() => setShowCustomTimePicker(true)} activeOpacity={0.7}>
                    <Text style={customDateObj ? styles.inputText : styles.inputPlaceholder}>
                      {customDateObj ? customDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select time *'}
                    </Text>
                  </TouchableOpacity>
                  {showCustomDatePicker && (
                    <DateTimePicker value={customDateObj || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onCustomDateChange} minimumDate={new Date()} />
                  )}
                  {showCustomTimePicker && (
                    <DateTimePicker value={customDateObj || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onCustomTimeChange} />
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.addBtn, saving && styles.addBtnDisabled]}
              onPress={mode === 'add' ? handleAdd : handleEdit}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={styles.addBtnText}>{saving ? 'Saving...' : mode === 'add' ? '+ Add Appointment' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </GlassCardView>
        </ScrollView>
      )}

      {/* ── Appointment List ── */}
      {mode === 'list' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <GlassCardView style={styles.card}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {upcoming.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>No upcoming appointments</Text>
              </View>
            ) : (
              upcoming.map((appt, i, arr) => (
                <View key={appt.appointment_id}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{appt.doctor_name}</Text>
                      <Text style={styles.entryDetail}>{appt.speciality}{appt.location ? ` · ${appt.location}` : ''}</Text>
                      <Text style={styles.entryTime}>{formatDate(appt.date_with_time)}</Text>
                      {appt.notes ? <Text style={styles.entryNotes}>{appt.notes}</Text> : null}
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity onPress={() => handleStatusChange(appt, 'COMPLETED')} hitSlop={styles.hitSlop}>
                        <Text style={styles.completeBtn}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleStatusChange(appt, 'CANCELLED')} hitSlop={styles.hitSlop}>
                        <Text style={styles.cancelBtn}>⊘</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => startEdit(appt)} hitSlop={styles.hitSlop} style={styles.editIconBtn}>
                        <Pencil size={18} color={Colors.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(appt)} hitSlop={styles.hitSlop}>
                        <Text style={styles.removeBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </GlassCardView>

          {history.length > 0 && (
            <GlassCardView style={styles.card}>
              <Text style={styles.sectionTitle}>History</Text>
              {history.map((appt, i, arr) => (
                <View key={appt.appointment_id}>
                  <View style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{appt.doctor_name}</Text>
                      <Text style={styles.entryDetail}>{appt.speciality} · {formatDate(appt.date_with_time)}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={[styles.statusText, { color: STATUS_COLORS[appt.status] }]}>{appt.status}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(appt)} hitSlop={styles.hitSlop}>
                      <Text style={styles.removeBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  {i < arr.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCardView>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  topBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  topBtnAdd: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.teal },
  topBtnCancel: { fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.danger },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
  card: { padding: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  input: { backgroundColor: Colors.bgCardSolid, borderWidth: 1, borderColor: Colors.bgCardBorder, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.sm },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  inputText: { fontSize: Typography.base, color: Colors.textPrimary },
  inputPlaceholder: { fontSize: Typography.base, color: Colors.textMuted },
  checkboxSection: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm + 2, gap: Spacing.sm },
  checkboxDisabled: { opacity: 0.45 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  checkmark: { fontSize: 14, color: '#fff', fontWeight: Typography.bold },
  checkboxLabel: { fontSize: Typography.base, color: Colors.textPrimary, flex: 1 },
  checkboxLabelDisabled: { color: Colors.textMuted },
  customReminderBlock: { marginTop: Spacing.xs, paddingLeft: 34 },
  addBtn: { backgroundColor: Colors.teal + '20', borderWidth: 1, borderColor: Colors.teal + '50', borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.teal },
  entryRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.md },
  entryInfo: { flex: 1 },
  entryName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  entryDetail: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  entryTime: { fontSize: Typography.sm, color: Colors.teal, marginTop: 2 },
  entryNotes: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  completeBtn: { fontSize: Typography.lg, color: Colors.success || '#4CAF50', padding: Spacing.xs },
  cancelBtn: { fontSize: Typography.lg, color: Colors.amber || '#FFB347', padding: Spacing.xs },
  editIconBtn: { padding: Spacing.xs },
  removeBtn: { fontSize: Typography.md, color: Colors.danger, padding: Spacing.sm },
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  divider: { height: 1, backgroundColor: Colors.divider },
  statusBadge: { marginTop: 4 },
  statusText: { fontSize: Typography.xs, fontWeight: Typography.semiBold },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: Typography.xxl, marginBottom: Spacing.md },
  emptyText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
});
