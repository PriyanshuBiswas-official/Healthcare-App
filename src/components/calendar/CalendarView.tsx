import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Calendar, WeekCalendar, CalendarProvider } from 'react-native-calendars';
import { Colors, Typography, Spacing } from '../../theme/theme';

interface CalendarViewProps {
  expanded: boolean;
  selectedDateStr: string;
  currentMonthStr: string;
  markedDates: any;
  onDateSelect: (dateStr: string) => void;
  onMonthChange: (dateObj: { dateString: string; month: number; year: number }) => void;
}

export default function CalendarView({
  expanded,
  selectedDateStr,
  currentMonthStr,
  markedDates,
  onDateSelect,
  onMonthChange,
}: CalendarViewProps) {
  const calendarTheme = useMemo(() => ({
    calendarBackground: 'transparent',
    textSectionTitleColor: Colors.textMuted,
    selectedDayBackgroundColor: Colors.teal,
    selectedDayTextColor: Colors.white,
    todayTextColor: Colors.purple,
    dayTextColor: Colors.textPrimary,
    textDisabledColor: Colors.textMuted + '40',
    dotColor: Colors.teal,
    selectedDotColor: Colors.white,
    arrowColor: 'transparent',
    monthTextColor: Colors.textPrimary,
    indicatorColor: Colors.teal,
    textDayFontSize: 16,
    textDayLineHeight: 60,
    textMonthFontSize: Typography.md,
    textDayHeaderFontSize: Typography.xs,
    textDayFontWeight: '600' as const,
    textMonthFontWeight: Typography.bold as '700',
    textDayHeaderFontWeight: '700' as const,
  }), []);

  const handleDayPress = (day: { dateString: string }) => {
    onDateSelect(day.dateString);
  };

  const handleMonthChange = (month: { dateString: string; month: number; year: number }) => {
    onMonthChange(month);
  };

  const renderArrow = (direction: string) => (
    <View style={styles.arrowButton}>
      <Text style={styles.arrow}>{direction === 'left' ? '‹' : '›'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {expanded ? (
        <Calendar
          current={currentMonthStr}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          theme={calendarTheme}
          firstDay={0}
          enableSwipeMonths={false}
          renderArrow={renderArrow}
          style={styles.calendar}
        />
      ) : (
        <CalendarProvider date={selectedDateStr}>
          <WeekCalendar
            markedDates={markedDates}
            markingType="multi-dot"
            onDayPress={handleDayPress}
            theme={calendarTheme}
            firstDay={0}
            style={styles.calendar}
          />
        </CalendarProvider>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  calendar: {
    paddingLeft: 0,
    paddingRight: 0,
    backgroundColor: 'transparent',
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 22,
    color: Colors.teal,
    fontWeight: '600',
    marginTop: -2,
  },
});
