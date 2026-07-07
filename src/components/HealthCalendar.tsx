import React, { useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';

// ── Helpers ────────────────────────────────────────────────────────────────
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();
  const prevNumDays = new Date(year, month, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevNumDays - i), isCurrentMonth: false });
  }
  for (let i = 1; i <= numDays; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }
  return days;
};

const getWeekDays = (date: Date) => {
  const currentDay = date.getDay();
  const sunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - currentDay);
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    days.push({ date: d, isCurrentMonth: d.getMonth() === date.getMonth() });
  }
  return days;
};

const getEventsForDate = (date: Date, isCurrentMonth: boolean, expanded: boolean, gender: string) => {
  if (expanded && !isCurrentMonth) return [];

  const list: { type: string; icon: string; label: string }[] = [];
  const dayNum = date.getDate();
  const monthNum = date.getMonth();
  const dayOfWeek = date.getDay();

  if (gender === 'female' && dayNum >= 12 && dayNum <= 16) {
    list.push({ type: 'period', icon: '🩸', label: 'Menstrual Period Day' });
  }

  if (dayNum === 7 || (dayNum === 12 && monthNum === 4)) {
    list.push({ type: 'appointment', icon: '👨‍⚕️', label: 'Doctor Appointment: Dr. Sharma at 04:30 PM' });
  } else if (dayNum === 22) {
    list.push({ type: 'appointment', icon: '🦷', label: 'Dentist Checkup at 10:00 AM' });
  }

  if (dayOfWeek === 1 || dayOfWeek === 4) {
    list.push({ type: 'workout', icon: '💪', label: 'Workout: Push Day Split' });
  } else if (dayOfWeek === 2 || dayOfWeek === 5) {
    list.push({ type: 'workout', icon: '🏃‍♂️', label: 'Workout: Pull Day Split' });
  } else if (dayOfWeek === 3 || dayOfWeek === 6) {
    list.push({ type: 'workout', icon: '🦵', label: 'Workout: Legs Day Split' });
  } else {
    list.push({ type: 'workout', icon: '🧘', label: 'Active Recovery & Stretching' });
  }

  list.push({ type: 'medication', icon: '💊', label: 'Vitamin D3 (08:00 AM) & Metformin (08:00 PM)' });

  return list;
};

// ── Calendar Day Cell (memoized) ───────────────────────────────────────────
interface DayCellProps {
  item: { date: Date; isCurrentMonth: boolean };
  isSelected: boolean;
  isToday: boolean;
  events: { type: string; icon: string; label: string }[];
  onSelect: (date: Date) => void;
}

const CalendarDayCell = React.memo(({ item, isSelected, isToday, events, onSelect }: DayCellProps) => (
  <TouchableOpacity
    style={styles.calendarDayCell}
    activeOpacity={0.7}
    onPress={() => onSelect(item.date)}
  >
    <View style={[
      styles.calendarDayCircle,
      isToday && styles.calendarTodayCircle,
      isSelected && styles.calendarSelectedCircle,
    ]}>
      <Text style={[
        styles.calendarDayNumber,
        !item.isCurrentMonth && styles.calendarOtherMonthNumber,
        isSelected && styles.calendarSelectedNumber,
      ]}>
        {item.date.getDate()}
      </Text>

      {item.isCurrentMonth && events.length > 0 && (
        <View style={styles.calendarIndicatorContainer}>
          {events.slice(0, 3).map((evt, eIdx) => {
            let dotColor = Colors.teal;
            if (evt.type === 'period') dotColor = Colors.pink;
            else if (evt.type === 'appointment') dotColor = Colors.blue;
            else if (evt.type === 'medication') dotColor = Colors.amber;

            return (
              <View key={eIdx} style={[styles.calendarDot, { backgroundColor: dotColor }]} />
            );
          })}
        </View>
      )}
    </View>
  </TouchableOpacity>
), (prev, next) =>
  prev.isSelected === next.isSelected &&
  prev.isToday === next.isToday &&
  prev.item.date.getTime() === next.item.date.getTime() &&
  prev.item.isCurrentMonth === next.item.isCurrentMonth &&
  prev.events === next.events
);

// ── Main Calendar Component ────────────────────────────────────────────────
interface HealthCalendarProps {
  selectedDate: Date;
  currentMonth: Date;
  expanded: boolean;
  gender: string;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onToggleExpand: () => void;
}

const HealthCalendar = ({
  selectedDate,
  currentMonth,
  expanded,
  gender,
  onDateSelect,
  onMonthChange,
  onToggleExpand,
}: HealthCalendarProps) => {
  const swipeRef = useRef({ startX: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (_, g) => { swipeRef.current.startX = g.x0; },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > 50) {
          const direction = g.dx < 0 ? 1 : -1;
          onMonthChange(new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + direction,
            1
          ));
        }
      },
    })
  ).current;

  const today = useMemo(() => new Date(), []);

  const displayedDays = useMemo(
    () => expanded ? getDaysInMonth(currentMonth) : getWeekDays(selectedDate),
    [expanded, currentMonth, selectedDate]
  );

  const eventsMap = useMemo(() => {
    const map = new Map<number, { type: string; icon: string; label: string }[]>();
    for (const day of displayedDays) {
      map.set(day.date.getTime(), getEventsForDate(day.date, day.isCurrentMonth, expanded, gender));
    }
    return map;
  }, [displayedDays, expanded, gender]);

  const handleDaySelect = useCallback((date: Date) => {
    onDateSelect(date);
    if (date.getMonth() !== currentMonth.getMonth()) {
      onMonthChange(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [onDateSelect, onMonthChange, currentMonth]);

  const handlePrevMonth = useCallback(() => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }, [onMonthChange, currentMonth]);

  const handleNextMonth = useCallback(() => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }, [onMonthChange, currentMonth]);

  return (
    <View style={styles.container}>
      {/* Toggle header */}
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggleExpand} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Health Calendar</Text>
          <Text style={styles.sectionSubtitle}>Your schedule at a glance</Text>
        </View>
        <View style={styles.togglePill}>
          <Text style={styles.toggleLabel}>{expanded ? 'Week' : 'Month'}</Text>
          <Text style={styles.toggleChevron}>{expanded ? '▾' : '▴'}</Text>
        </View>
      </TouchableOpacity>

      {/* Swipeable calendar body */}
      <View {...panResponder.panHandlers}>
        <View style={styles.calendarHeader}>
          <View>
            <Text style={styles.calendarMonthYear}>
              {currentMonth.toLocaleString('en-US', { month: 'long' })}
            </Text>
            <Text style={styles.calendarYearSub}>{currentMonth.getFullYear()}</Text>
          </View>

          {expanded && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.calendarNavBtn} onPress={handlePrevMonth}>
                <Text style={styles.calendarNavBtnText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarNavBtn} onPress={handleNextMonth}>
                <Text style={styles.calendarNavBtnText}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.calendarWeekdayRow}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
            <Text key={idx} style={styles.calendarWeekdayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {displayedDays.map((item, idx) => (
            <CalendarDayCell
              key={item.date.getTime()}
              item={item}
              isSelected={isSameDay(item.date, selectedDate)}
              isToday={isSameDay(item.date, today)}
              events={eventsMap.get(item.date.getTime()) ?? []}
              onSelect={handleDaySelect}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default React.memo(HealthCalendar, (prev, next) =>
  prev.selectedDate.getTime() === next.selectedDate.getTime() &&
  prev.currentMonth.getTime() === next.currentMonth.getTime() &&
  prev.expanded === next.expanded &&
  prev.gender === next.gender
);

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  toggleLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  toggleChevron: {
    fontSize: Typography.xs,
    color: Colors.teal,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  calendarMonthYear: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    letterSpacing: Typography.lsTight,
    lineHeight: 32,
  },
  calendarYearSub: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    marginTop: 2,
  },
  calendarNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  calendarNavBtnText: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    lineHeight: 20,
    fontWeight: Typography.bold,
  },
  calendarWeekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  calendarWeekdayText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: Typography.lsWide,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 4,
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
  },
  calendarSelectedCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.teal + '25',
    borderWidth: 1.5,
    borderColor: Colors.teal,
  },
  calendarDayNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
  },
  calendarSelectedNumber: {
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  calendarOtherMonthNumber: {
    color: Colors.textMuted + '33',
  },
  calendarTodayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: Colors.purple,
    backgroundColor: Colors.purple + '12',
  },
  calendarIndicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    gap: 3,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
