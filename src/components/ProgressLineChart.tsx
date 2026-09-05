import React from 'react';
import { View, Text, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme, useStyles } from '../providers/ThemeProvider';
import { Typography, Spacing } from '../theme/theme';

interface DataPoint {
  date: string;
  value: number;
}

interface ProgressLineChartProps {
  data: DataPoint[];
  height?: number;
  loading?: boolean;
}

const CHART_HEIGHT = 200;

export default function ProgressLineChart({ data, height = CHART_HEIGHT, loading }: ProgressLineChartProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const styles = useStyles((c: any) => ({
    container: { marginTop: Spacing.lg },
    chartCard: { paddingBottom: Spacing.md },
    chartTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.colors.textPrimary, marginBottom: 4 },
    chartSubtitle: { fontSize: Typography.sm, color: c.colors.textSecondary, marginBottom: Spacing.md },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: c.colors.bgCardBorder },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.colors.teal },
    statLabel: { fontSize: Typography.sm, color: c.colors.textSecondary, marginTop: 4 },
    hint: { fontSize: Typography.sm, color: c.colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  }));

  const hasData = data && data.length > 0;
  const values = hasData ? data.map(d => d.value) : [];
  const maxVal = hasData ? Math.max(...values) : 0;
  const avgVal = hasData
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    : 0;

  const noOfSections = 4;
  const chartMaxValue = hasData
    ? Math.ceil((maxVal * 1.1) / noOfSections) * noOfSections
    : 100;

  const chartData = hasData
    ? data.map((d, i) => ({
        value: d.value,
        label: i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1
          ? d.date.slice(5)
          : undefined,
      }))
    : [{ value: 0 }];

  return (
    <View style={styles.container}>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Progress</Text>
        <Text style={styles.chartSubtitle}>Weight over last 3 months</Text>

        <View style={{ position: 'relative' }}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 64}
          height={height}
          color={colors.teal}
          thickness={2}
          curved
          areaChart
          startFillColor={colors.teal}
          endFillColor={colors.teal}
          startOpacity={0.3}
          endOpacity={0.02}
          dataPointsColor={colors.teal}
          dataPointsRadius={3}
          dataPointsStrokeColor={colors.bg}
          dataPointsStrokeWidth={1.5}
          hideDataPoints={!hasData}
          rulesColor={colors.bgCardBorder}
          xAxisColor={colors.bgCardBorder}
          xAxisThickness={1}
          yAxisColor={colors.bgCardBorder}
          yAxisThickness={1}
          yAxisLabelWidth={44}
          hideYAxisLabels={!hasData}
          yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
          noOfSections={noOfSections}
          maxValue={chartMaxValue}
          showFractionalValues
          roundToDigits={1}
          disableScroll
          pointerConfig={hasData ? {
            pointerStripHeight: height - 30,
            pointerStripColor: colors.bgCardBorder,
            pointerStripWidth: 1,
            pointerColor: colors.teal,
            activatePointersOnLongPress: false,
            autoPointerText: false,
          } : undefined}
        />
        {loading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color={colors.teal} />
          </View>
        )}
        </View>

        {!hasData && (
          <Text style={styles.hint}>Start logging to see your progress.</Text>
        )}

        {hasData && (
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
        )}
      </View>
    </View>
  );
}
