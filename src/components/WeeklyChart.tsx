import React, { useMemo } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { Radius, Spacing, Typography } from '../theme/theme';
import { useTheme, useStyles } from '../providers/ThemeProvider';
import { GlassCardView } from './SharedComponents';

const { width: screenWidth } = Dimensions.get('window');
const CHART_HEIGHT = 120;
const BAR_RADIUS = 6;

interface WeeklyChartProps {
  data: number[];
  labels: string[];
  color: string;
}

export function WeeklyChart({
  data,
  labels,
  color,
}: WeeklyChartProps) {
  const { theme } = useTheme();
  const styles = useStyles(styleCreator);

  const chartWidth = screenWidth - Spacing.base * 2 - Spacing.base * 2;

  const { barHeight, todayIndex, maxVal } = useMemo(() => {
    const max = Math.max(...data, 1);
    return {
      barHeight: CHART_HEIGHT,
      todayIndex: data.length - 1,
      maxVal: max,
    };
  }, [data]);

  const barCount = data.length;
  const gap = 10;
  const totalGaps = (barCount - 1) * gap;
  const barWidth = (chartWidth - totalGaps) / barCount;

  return (
    <GlassCardView style={styles.card}>
      <View style={[styles.barContainer, { height: barHeight }]}>
        {data.map((val, i) => {
          const h = maxVal > 0 ? (val / maxVal) * (barHeight - 8) : 0;
          const isToday = i === todayIndex;
          const barColor = isToday ? color : val > 0 ? color + '50' : theme.colors.bgCardBorder;
          return (
            <View key={i} style={[styles.barCol, { width: barWidth }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(h, 4),
                    backgroundColor: barColor,
                    borderRadius: BAR_RADIUS,
                    opacity: isToday ? 1 : val > 0 ? 0.7 : 0.3,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {labels.map((label, i) => (
          <Text
            key={i}
            style={[
              styles.dayLabel,
              { width: barWidth },
              i === todayIndex && { color, fontWeight: Typography.bold },
            ]}>
            {label}
          </Text>
        ))}
      </View>
    </GlassCardView>
  );
}

const styleCreator = (theme: any) =>
  StyleSheet.create({
    card: {
      padding: Spacing.base,
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.lg,
    },
    barContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    barCol: {
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    bar: {
      width: '100%',
    },
    labelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
    },
    dayLabel: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
      fontWeight: Typography.semiBold,
      textAlign: 'center',
    },
  });
