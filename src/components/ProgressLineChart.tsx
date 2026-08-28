import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme, useStyles } from '../providers/ThemeProvider';
import { Typography, Spacing, Radius } from '../theme/theme';
import { GlassCardView } from './SharedComponents';

interface DataPoint {
  date: string;
  value: number;
}

interface ProgressLineChartProps {
  data: DataPoint[];
  height?: number;
}

const CHART_HEIGHT = 160;
const PADDING = { top: 16, right: 12, bottom: 24, left: 8 };

export default function ProgressLineChart({ data, height = CHART_HEIGHT }: ProgressLineChartProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const styles = useStyles((c: any) => ({
    container: { marginTop: Spacing.base },
    chartCard: { padding: Spacing.base, paddingBottom: Spacing.sm },
    chartTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.colors.textPrimary, marginBottom: 2 },
    chartSubtitle: { fontSize: Typography.xs, color: c.colors.textSecondary, marginBottom: Spacing.md },
    chartArea: { position: 'relative', height, overflow: 'hidden' },
    yLabels: { position: 'absolute', left: 0, top: PADDING.top, bottom: PADDING.bottom, width: 36, justifyContent: 'space-between' },
    yLabel: { fontSize: 9, color: c.colors.textMuted, textAlign: 'right', paddingRight: 4 },
    xLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 36 + PADDING.left, marginTop: 4 },
    xLabel: { fontSize: 9, color: c.colors.textMuted },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: c.colors.bgCardBorder },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.colors.teal },
    statLabel: { fontSize: Typography.xs, color: c.colors.textSecondary, marginTop: 2 },
    emptyText: { fontSize: Typography.sm, color: c.colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  }));

  if (!data || data.length < 2) {
    return (
      <View style={styles.container}>
        <GlassCardView style={styles.chartCard}>
          <Text style={styles.chartTitle}>Progress</Text>
          <Text style={styles.emptyText}>Log more sessions to see your progress chart.</Text>
        </GlassCardView>
      </View>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avgVal = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const range = maxVal - minVal || 1;

  // SVG dimensions — fill the chartArea width via viewBox
  const svgWidth = 300;
  const chartWidth = svgWidth - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  // Map data points to SVG coordinates
  const points = data.map((d, i) => {
    const x = PADDING.left + (i / (data.length - 1)) * chartWidth;
    const y = PADDING.top + chartHeight - ((d.value - minVal) / range) * chartHeight;
    return { x, y, value: d.value, date: d.date };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Gradient area polygon
  const areaPoints = [
    `${points[0].x},${PADDING.top + chartHeight}`,
    ...points.map(p => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${PADDING.top + chartHeight}`,
  ].join(' ');

  // Y-axis labels
  const yLabels = [1, 0.75, 0.5, 0.25, 0].map(frac => {
    const val = minVal + frac * range;
    return `${Math.round(val * 10) / 10}`;
  });

  // X-axis labels: first, middle, last
  const xLabels = [
    data[0].date.slice(5),
    data[Math.floor(data.length / 2)].date.slice(5),
    data[data.length - 1].date.slice(5),
  ];

  return (
    <View style={styles.container}>
      <GlassCardView style={styles.chartCard}>
        <Text style={styles.chartTitle}>Progress</Text>
        <Text style={styles.chartSubtitle}>Weight over last 3 months</Text>

        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yLabels}>
            {yLabels.map((label, i) => (
              <Text key={i} style={styles.yLabel}>{label}</Text>
            ))}
          </View>

          {/* SVG Chart */}
          <Svg
            width="100%"
            height={height}
            viewBox={`0 0 ${svgWidth} ${height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <Defs>
              <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.teal} stopOpacity="0.3" />
                <Stop offset="1" stopColor={colors.teal} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>

            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
              const y = PADDING.top + chartHeight - frac * chartHeight;
              return <Line key={i} x1={PADDING.left} y1={y} x2={svgWidth - PADDING.right} y2={y} stroke={colors.bgCardBorder} strokeWidth={0.5} />;
            })}

            {/* Gradient fill */}
            <Polyline points={areaPoints} fill="url(#areaGrad)" />

            {/* Line */}
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={colors.teal}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dots */}
            {points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.teal} stroke={colors.bg} strokeWidth={1.5} />
            ))}
          </Svg>
        </View>

        {/* X-axis labels */}
        <View style={styles.xLabels}>
          {xLabels.map((label, i) => (
            <Text key={i} style={styles.xLabel}>{label}</Text>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgVal}kg</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{maxVal}kg</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.length}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </View>
      </GlassCardView>
    </View>
  );
}
