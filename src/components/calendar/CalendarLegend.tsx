import React from 'react';
import { View, Text } from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';

export default function CalendarLegend() {
  const { theme } = useTheme();

  const legends = [
    { label: 'Medication', color: theme.colors.teal },
    { label: 'Water', color: theme.colors.blue },
    { label: 'Workout', color: theme.colors.accentBlue },
    { label: 'Appointment', color: theme.colors.blue },
    { label: 'Period', color: theme.colors.pink },
  ];

  const styles = useStyles((theme) => ({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.base,
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
      justifyContent: 'center',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
    },
  }));

  return (
    <View style={styles.container}>
      {legends.map((item, idx) => (
        <View key={idx} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
