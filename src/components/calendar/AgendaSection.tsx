import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { CalendarEvent } from '../../utils/calendarHelpers';
import { GlassCardView, SectionHeader } from '../SharedComponents';
import EmptyState from './EmptyState';

interface AgendaSectionProps {
  selectedDate: Date;
  events: CalendarEvent[];
}

interface GroupedEvent {
  id: string;
  type: string;
  icon: string;
  title: string;
  subtitle?: string;
  times: string[];
  color: string;
}

function groupEvents(events: CalendarEvent[]): GroupedEvent[] {
  const map = new Map<string, GroupedEvent>();
  for (const evt of events) {
    const key = `${evt.title}__${evt.type}`;
    const existing = map.get(key);
    if (existing) {
      existing.times.push(evt.time);
    } else {
      map.set(key, {
        id: evt.id,
        type: evt.type,
        icon: evt.icon,
        title: evt.title,
        subtitle: evt.subtitle,
        times: [evt.time],
        color: evt.color,
      });
    }
  }
  return Array.from(map.values());
}

export default function AgendaSection({ selectedDate, events }: AgendaSectionProps) {
  const grouped = useMemo(() => groupEvents(events), [events]);
  const dateTitle = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const getBadgeText = (type: string) => {
    switch (type) {
      case 'period': return 'Period';
      case 'appointment': return 'Appointment';
      case 'workout': return 'Workout';
      case 'medication': return 'Medication';
      case 'water': return 'Water';
      case 'sleep': return 'Sleep';
      case 'nutrition': return 'Nutrition';
      case 'health': return 'Health';
      default: return 'Reminder';
    }
  };

  return (
    <View style={styles.container}>
      <SectionHeader title={`Agenda — ${dateTitle}`} />
      
      <GlassCardView style={styles.agendaCard}>
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.list}>
            {grouped.map((group) => (
              <View key={group.id} style={styles.eventRow}>
                <View style={[styles.eventAccentDot, { backgroundColor: group.color }]} />
                <View style={styles.eventIconWrap}>
                  <Text style={styles.eventIcon}>{group.icon}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventLabel}>{group.title}</Text>
                  {group.times.map((t, i) => (
                    <Text key={i} style={styles.eventTime}>
                      {t}
                      {group.subtitle ? ` · ${group.subtitle}` : ''}
                    </Text>
                  ))}
                </View>
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>{getBadgeText(group.type)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </GlassCardView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  agendaCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  list: {
    gap: Spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  eventAccentDot: {
    width: 4,
    height: 24,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  eventIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  eventIcon: {
    fontSize: Typography.base,
  },
  eventInfo: {
    flex: 1,
  },
  eventLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  eventTime: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  eventBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  eventBadgeText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    fontWeight: Typography.bold,
  },
});
