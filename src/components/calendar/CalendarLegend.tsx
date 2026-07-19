import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

export default function CalendarLegend() {
  const legends = [
    { label: 'Medication', color: Colors.teal },
    { label: 'Water', color: Colors.blue },
    { label: 'Workout', color: Colors.purple },
    { label: 'Appointment', color: Colors.blue },
    { label: 'Period', color: Colors.pink },
  ];

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

const styles = StyleSheet.create({
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
    color: Colors.textMuted,
  },
});
