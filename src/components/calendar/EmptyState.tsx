import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing } from '../../theme/theme';
import { useStyles } from '../../providers/ThemeProvider';

export default function EmptyState() {
  const styles = useStyles((theme) => ({
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
      color: theme.colors.textPrimary,
    },
    agendaEmptySubtext: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
  }));

  return (
    <View style={styles.agendaEmpty}>
      <Text style={styles.agendaEmptyIcon}>📅</Text>
      <Text style={styles.agendaEmptyText}>Nothing scheduled</Text>
      <Text style={styles.agendaEmptySubtext}>Enjoy your free day</Text>
    </View>
  );
}
