import { Reminder, ReminderSchedule, ReminderCategory, CATEGORY_META } from '../types/reminder';
import { Appointment } from '../types/appointment';
import type { CycleData, PeriodLog } from '../types/health';
import type { WorkoutPlanDays } from '../types/activity';
import { Colors } from '../theme/theme';

export interface CalendarEvent {
  id: string;
  type: 'medication' | 'water' | 'workout' | 'meal' | 'appointment' | 'sleep' | 'period' | 'custom';
  icon: string;
  title: string;
  subtitle?: string;
  time: string; // e.g. "08:00 AM" or "All day"
  color: string;
  completed?: boolean;
}

export type EventsLookup = Record<string, CalendarEvent[]>;

// Helper to format Date to YYYY-MM-DD in local time
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Convert HH:MM time string to 12h format (e.g., "14:30" -> "02:30 PM")
export function formatTime12h(hhmm: string): string {
  if (!hhmm) return 'All day';
  const parts = hhmm.split(':');
  if (parts.length < 2) return hhmm;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Preprocesses reminders, schedules, appointments, cycle data, and workout plan
 * into a YYYY-MM-DD lookup map.
 * Generates events for a window of -30 days to +60 days from the current date.
 */
export function generateEventsLookup(
  reminders: Reminder[],
  schedulesMap: Map<number, ReminderSchedule[]>,
  appointments: Appointment[],
  gender: string,
  cycleData: CycleData | null,
  periodLogs: PeriodLog[],
  workoutPlanDays: WorkoutPlanDays,
  baseDate: Date = new Date()
): EventsLookup {
  const lookup: EventsLookup = {};

  // Define window limits
  const startLimit = new Date(baseDate);
  startLimit.setDate(baseDate.getDate() - 30);
  const endLimit = new Date(baseDate);
  endLimit.setDate(baseDate.getDate() + 60);

  // Helper to add event to lookup map
  const addEvent = (dateStr: string, event: CalendarEvent) => {
    if (!lookup[dateStr]) {
      lookup[dateStr] = [];
    }
    // Prevent duplicate events
    if (!lookup[dateStr].some(e => e.id === event.id)) {
      lookup[dateStr].push(event);
    }
  };

  // ── 1. Process Period Days (from real data) ──
  if (gender === 'female') {
    // Build a set of dates that have confirmed period logs
    const confirmedDates = new Set<string>();
    for (const log of periodLogs) {
      if (log.period_start_date) {
        confirmedDates.add(formatDateString(new Date(log.period_start_date + 'T12:00:00')));
      }
    }

    // Add confirmed period days from logs
    for (const log of periodLogs) {
      const logDate = new Date(log.period_start_date + 'T12:00:00');
      const dateStr = formatDateString(logDate);
      if (logDate >= startLimit && logDate <= endLimit) {
        addEvent(dateStr, {
          id: `period_log_${log.period_id}`,
          type: 'period',
          icon: '🩸',
          title: 'Period Day',
          subtitle: log.flow_intensity ? `Day ${log.day_no} · ${log.flow_intensity}` : `Day ${log.day_no}`,
          time: 'All day',
          color: Colors.pink,
          completed: false,
        });
      }
    }

    // Add predicted period days from cycle data
    if (cycleData && cycleData.start_date && cycleData.cycle_length && cycleData.period_length) {
      const cycleStart = new Date(cycleData.start_date + 'T12:00:00');
      const cycleLen = cycleData.cycle_length;
      const periodLen = cycleData.period_length;

      // Generate cycle windows that overlap our calendar window
      // Go back far enough to cover past predictions, forward for future
      const maxCyclesBack = Math.ceil(90 / cycleLen) + 2;
      const maxCyclesForward = Math.ceil(90 / cycleLen) + 2;

      for (let i = -maxCyclesBack; i <= maxCyclesForward; i++) {
        const cycleStartIter = new Date(cycleStart);
        cycleStartIter.setDate(cycleStart.getDate() + i * cycleLen);

        // Generate days for this cycle's period
        for (let d = 0; d < periodLen; d++) {
          const periodDay = new Date(cycleStartIter);
          periodDay.setDate(cycleStartIter.getDate() + d);
          const dateStr = formatDateString(periodDay);

          // Only add if within window and not already a confirmed log
          if (periodDay >= startLimit && periodDay <= endLimit && !confirmedDates.has(dateStr)) {
            addEvent(dateStr, {
              id: `period_predicted_${dateStr}`,
              type: 'period',
              icon: '🩸',
              title: 'Period Day',
              subtitle: `Predicted · Day ${d + 1}`,
              time: 'All day',
              color: Colors.pink + '80',
              completed: false,
            });
          }
        }
      }
    }
  }

  // ── 2. Process Appointments ──
  for (const appt of appointments) {
    try {
      const apptDate = new Date(appt.date_with_time);
      const dateStr = formatDateString(apptDate);

      // Check if within window
      if (apptDate >= startLimit && apptDate <= endLimit) {
        const timeStr = apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        addEvent(dateStr, {
          id: `appt_${appt.appointment_id}`,
          type: 'appointment',
          icon: '🩺',
          title: `${appt.doctor_name} — ${appt.speciality}`,
          subtitle: appt.notes || undefined,
          time: timeStr,
          color: Colors.blue,
          completed: appt.status === 'COMPLETED',
        });
      }
    } catch (e) {
      console.warn('[CalendarHelpers] Error parsing appointment date:', e);
    }
  }

  // ── 3. Process Workout Plan Days ──
  if (workoutPlanDays.days.length > 0) {
    // Map day names to JS day indices (0=Sunday, 1=Monday, ..., 6=Saturday)
    const dayNameToIndex: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6,
    };
    const workoutDayIndices = new Set(
      workoutPlanDays.days.map(d => dayNameToIndex[d.day_name]).filter(v => v !== undefined)
    );

    // Iterate through calendar window and add workout events on matching days
    const iterDate = new Date(startLimit);
    while (iterDate <= endLimit) {
      if (workoutDayIndices.has(iterDate.getDay())) {
        const dateStr = formatDateString(iterDate);
        addEvent(dateStr, {
          id: `workout_plan_${dateStr}`,
          type: 'workout',
          icon: '💪',
          title: 'Workout Day',
          subtitle: workoutPlanDays.plan_name || undefined,
          time: 'All day',
          color: CATEGORY_META.workout.color,
          completed: false,
        });
      }
      iterDate.setDate(iterDate.getDate() + 1);
    }
  }

  // ── 4. Process Reminders & Schedules (excluding workouts) ──
  const allowedCategories = ['medication', 'health', 'appointment'];
  for (const reminder of reminders) {
    if (!allowedCategories.includes(reminder.category)) continue;

    const schedules = schedulesMap.get(reminder.reminder_id) || [];
    const meta = CATEGORY_META[reminder.category] || CATEGORY_META.general;

    for (const schedule of schedules) {
      if (!schedule.enabled) continue;

      const [hours, minutes] = schedule.notify_at.split(':').map(Number);

      if (!reminder.repeat) {
        // One-shot: schedule on start_date
        try {
          const [sy, sm, sd] = reminder.start_date.split('-').map(Number);
          const trigDate = new Date(sy, sm - 1, sd, hours, minutes);
          if (trigDate >= startLimit && trigDate <= endLimit) {
            const dateStr = formatDateString(trigDate);
            addEvent(dateStr, {
              id: `reminder_${reminder.reminder_id}_${schedule.reminder_schedule_id}`,
              type: reminder.category as any,
              icon: getCategoryIcon(reminder.category),
              title: reminder.title,
              subtitle: reminder.description || undefined,
              time: formatTime12h(schedule.notify_at),
              color: meta.color,
              completed: false,
            });
          }
        } catch {}
      } else {
        // Repeating reminder: iterate day-by-day in our window
        const iterDate = new Date(startLimit);
        const [sy, sm, sd] = reminder.start_date.split('-').map(Number);
        const startRaw = new Date(sy, sm - 1, sd, 0, 0, 0, 0);

        while (iterDate <= endLimit) {
          if (iterDate >= startRaw) {
            let matches = false;

            if (schedule.repeat_type === 'daily') {
              matches = !schedule.weekdays || schedule.weekdays.length === 0 || schedule.weekdays.includes(iterDate.getDay() as any);
            } else if (schedule.repeat_type === 'weekly') {
              matches = !schedule.weekdays || schedule.weekdays.length === 0 || schedule.weekdays.includes(iterDate.getDay() as any);
            } else if (schedule.repeat_type === 'interval') {
              if (schedule.interval_unit === 'hours') {
                matches = true;
              } else if (schedule.interval_unit === 'days') {
                const diffTime = Math.abs(iterDate.getTime() - startRaw.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                matches = diffDays % (schedule.repeat_interval || 1) === 0;
              }
            } else if (schedule.repeat_type === 'monthly') {
              matches = iterDate.getDate() === startRaw.getDate();
            }

            if (matches) {
              const dateStr = formatDateString(iterDate);

              if (schedule.repeat_type === 'interval' && schedule.interval_unit === 'hours') {
                const intervalHours = schedule.repeat_interval || 1;
                let currentHour = hours;
                while (currentHour < 24) {
                  const hhmm = `${String(currentHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                  addEvent(dateStr, {
                    id: `reminder_${reminder.reminder_id}_${schedule.reminder_schedule_id}_${hhmm}`,
                    type: reminder.category as any,
                    icon: '💧',
                    title: reminder.title,
                    subtitle: `${reminder.description || ''} (${formatTime12h(hhmm)})`,
                    time: formatTime12h(hhmm),
                    color: meta.color,
                    completed: false,
                  });
                  currentHour += intervalHours;
                }
              } else {
                addEvent(dateStr, {
                  id: `reminder_${reminder.reminder_id}_${schedule.reminder_schedule_id}`,
                  type: reminder.category as any,
                  icon: getCategoryIcon(reminder.category),
                  title: reminder.title,
                  subtitle: reminder.description || undefined,
                  time: formatTime12h(schedule.notify_at),
                  color: meta.color,
                  completed: false,
                });
              }
            }
          }
          iterDate.setDate(iterDate.getDate() + 1);
        }
      }
    }
  }

  // Sort events for each day by time
  for (const dateStr in lookup) {
    lookup[dateStr].sort((a, b) => {
      if (a.time === 'All day') return -1;
      if (b.time === 'All day') return 1;
      return a.time.localeCompare(b.time);
    });
  }

  return lookup;
}

function getCategoryIcon(cat: ReminderCategory): string {
  switch (cat) {
    case 'medication': return '💊';
    case 'water': return '💧';
    case 'workout': return '💪';
    case 'sleep': return '🌙';
    case 'nutrition': return '🍎';
    case 'health': return '❤️';
    case 'appointment': return '📅';
    default: return '🔔';
  }
}

/**
 * Generates react-native-calendars markings format.
 */
export function generateCalendarMarkings(
  eventsLookup: EventsLookup,
  selectedDateStr: string
): any {
  const markings: Record<string, any> = {};

  // Process dots for dates with events
  for (const dateStr in eventsLookup) {
    const events = eventsLookup[dateStr];
    if (events.length === 0) continue;

    // Get unique colors for dots
    const uniqueColors = Array.from(new Set(events.map(e => e.color))).slice(0, 4);
    const dots = uniqueColors.map((color, idx) => ({
      key: `dot_${idx}_${color}`,
      color: color,
      selectedDotColor: Colors.white,
    }));

    markings[dateStr] = {
      dots: dots,
    };
  }

  // Set today marking
  const todayStr = formatDateString(new Date());
  if (!markings[todayStr]) {
    markings[todayStr] = {};
  }
  markings[todayStr] = {
    ...markings[todayStr],
    customStyles: {
      container: {
        borderWidth: 1.5,
        borderColor: Colors.purple,
        backgroundColor: Colors.purple + '12',
      },
      text: {
        fontWeight: 'bold',
      },
    },
  };

  // Set selected date marking (merging custom styles and selected colors)
  if (!markings[selectedDateStr]) {
    markings[selectedDateStr] = {};
  }
  markings[selectedDateStr] = {
    ...markings[selectedDateStr],
    selected: true,
    selectedColor: Colors.teal,
    textColor: Colors.white,
  };

  return markings;
}
