import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Calendar, WeekCalendar, CalendarProvider } from 'react-native-calendars';
import { Typography, Spacing } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';

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
  const { theme } = useTheme();

  const styles = useStyles((theme) => StyleSheet.create({
    container: { width: '100%', overflow: 'hidden' },
    calendar: { paddingLeft: 0, paddingRight: 0, backgroundColor: 'transparent' },
    arrowButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.chipBg, alignItems: 'center', justifyContent: 'center' },
    arrow: { fontSize: 22, color: theme.colors.teal, fontWeight: '600', marginTop: -2 },
  }));

  const calendarTheme = useMemo(() => ({
    calendarBackground: 'transparent',
    textSectionTitleColor: theme.colors.textMuted,
    selectedDayBackgroundColor: theme.colors.teal,
    selectedDayTextColor: theme.colors.white,
    todayTextColor: theme.colors.accentBlue,
    dayTextColor: theme.colors.textPrimary,
    textDisabledColor: theme.colors.textMuted + '40',
    dotColor: theme.colors.teal,
    selectedDotColor: theme.colors.white,
    arrowColor: 'transparent',
    monthTextColor: theme.colors.textPrimary,
    indicatorColor: theme.colors.teal,
    textDayFontSize: 16,
    textDayLineHeight: 60,
    textMonthFontSize: Typography.md,
    textDayHeaderFontSize: Typography.xs,
    textDayFontWeight: '600' as const,
    textMonthFontWeight: Typography.bold as '700',
    textDayHeaderFontWeight: '700' as const,
  }), [theme]);

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
