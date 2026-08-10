import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography, Spacing, Radius } from '../theme/theme';
import { useStyles } from '../providers/ThemeProvider';
import { useReminders } from '../providers/ReminderContext';
import { useAppointments } from '../providers/AppointmentContext';
import { useAuth } from '../providers/AuthProvider';
import { GlassCardView } from './SharedComponents';
import {
  generateEventsLookup,
  generateCalendarMarkings,
  formatDateString,
  CalendarEvent,
} from '../utils/calendarHelpers';
import type { CycleData, PeriodLog } from '../types/health';
import type { WorkoutPlanDays } from '../types/activity';
import { getLatestCycle, getPeriodLogs } from '../services/healthService';
import { getCurrentWorkoutPlanDays } from '../services/activityService';
import CalendarView from './calendar/CalendarView';
import AgendaSection from './calendar/AgendaSection';

export default function HealthCalendar() {
  const { user, session } = useAuth();
  const { reminders, schedules } = useReminders();
  const { appointments } = useAppointments();
  const token = session?.access_token || '';

  // Local state for calendar navigation and selections
  const styles = useStyles((theme) => ({
    container: { paddingBottom: Spacing.sm },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    sectionSubtitle: { fontSize: Typography.xs, color: theme.colors.textMuted },
    togglePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.chipBg, paddingHorizontal: 12, borderRadius: Radius.full, borderWidth: 1, borderColor: theme.colors.bgCardBorder },
    toggleLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: theme.colors.textSecondary },
    toggleChevron: { fontSize: Typography.xs, color: theme.colors.teal },
    calendarContainer: { paddingVertical: Spacing.sm, paddingHorizontal: 0, marginBottom: Spacing.md },
  }));

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatDateString(new Date()));
  const [currentMonthStr, setCurrentMonthStr] = useState<string>(() => formatDateString(new Date()));
  const [expanded, setExpanded] = useState<boolean>(true);

  // Real data state
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [workoutPlanDays, setWorkoutPlanDays] = useState<WorkoutPlanDays>({ plan_name: null, days: [] });

  // Fetch cycle data, period logs, and workout plan days
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [cycle, logs, workoutDays] = await Promise.all([
          getLatestCycle(token).catch(() => null),
          getPeriodLogs(token).catch(() => []),
          getCurrentWorkoutPlanDays(token).catch(() => ({ plan_name: null, days: [] })),
        ]);
        setCycleData(cycle);
        setPeriodLogs(logs);
        setWorkoutPlanDays(workoutDays);
      } catch {
        // Silently fail — calendar will show no cycle/workout events
      }
    };

    fetchData();
  }, [token]);

  const gender = user?.user_metadata?.gender || 'female';

  // 1. Preprocess all event data into O(1) date lookup map
  const eventsLookup = useMemo(() => {
    return generateEventsLookup(
      reminders, schedules, appointments, gender,
      cycleData, periodLogs, workoutPlanDays,
    );
  }, [reminders, schedules, appointments, gender, cycleData, periodLogs, workoutPlanDays]);

  // 2. Generate calendar markedDates structure
  const markedDates = useMemo(() => {
    return generateCalendarMarkings(eventsLookup, selectedDateStr);
  }, [eventsLookup, selectedDateStr]);

  // 3. Get currently selected date object
  const selectedDate = useMemo(() => {
    return new Date(selectedDateStr + 'T00:00:00');
  }, [selectedDateStr]);

  // 4. Get events for selected day
  const selectedDayEvents = useMemo(() => {
    return eventsLookup[selectedDateStr] || [];
  }, [eventsLookup, selectedDateStr]);

  // Callbacks
  const handleDateSelect = useCallback((dateStr: string) => {
    setSelectedDateStr(dateStr);
  }, []);

  const handleMonthChange = useCallback((monthObj: { dateString: string }) => {
    setCurrentMonthStr(monthObj.dateString);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return (
    <View style={styles.container}>
      {/* Collapsible Header */}
      <TouchableOpacity style={styles.sectionHeader} onPress={handleToggleExpand} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Health Calendar</Text>
          <Text style={styles.sectionSubtitle}>Your schedule at a glance</Text>
        </View>
        <View style={styles.togglePill}>
          <Text style={styles.toggleLabel}>{expanded ? 'Week View' : 'Month View'}</Text>
          <Text style={styles.toggleChevron}>{expanded ? '▾' : '▴'}</Text>
        </View>
      </TouchableOpacity>

      {/* Plain Calendar Container */}
      <View style={styles.calendarContainer}>
        <CalendarView
          expanded={expanded}
          selectedDateStr={selectedDateStr}
          currentMonthStr={currentMonthStr}
          markedDates={markedDates}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
        />
      </View>

      {/* Agenda Card */}
      <AgendaSection selectedDate={selectedDate} events={selectedDayEvents} />
    </View>
  );
}
