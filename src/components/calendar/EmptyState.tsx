import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing } from '../../theme/theme';
import { useStyles, useTheme } from '../../providers/ThemeProvider';
import { Calendar } from 'lucide-react-native';

export default function EmptyState() {
  const { theme } = useTheme();
  const styles = useStyles((theme) => ({
    agendaEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xl,
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
      <Calendar size={36} color={theme.colors.textMuted} />
      <Text style={[styles.agendaEmptyText, { marginTop: Spacing.sm }]}>Nothing scheduled</Text>
      <Text style={styles.agendaEmptySubtext}>Enjoy your free day</Text>
    </View>
  );
}
