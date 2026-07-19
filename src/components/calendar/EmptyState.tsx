import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme/theme';

export default function EmptyState() {
  return (
    <View style={styles.agendaEmpty}>
      <Text style={styles.agendaEmptyIcon}>📅</Text>
      <Text style={styles.agendaEmptyText}>Nothing scheduled</Text>
      <Text style={styles.agendaEmptySubtext}>Enjoy your free day</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  agendaEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  agendaEmptyIcon: {
    fontSize: Typography.xxl,
    marginBottom: Spacing.sm,
  },
  agendaEmptyText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  agendaEmptySubtext: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
