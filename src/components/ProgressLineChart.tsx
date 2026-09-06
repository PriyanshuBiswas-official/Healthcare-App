import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme, useStyles } from '../providers/ThemeProvider';
import { Typography, Spacing, Radius } from '../theme/theme';

export interface DataPoint {
  date: string;
  max_weight?: number;
  total_reps?: number;
  max_reps?: number;
  total_volume?: number;
  value?: number;
}

type MetricKey = 'max_weight' | 'total_reps' | 'max_reps' | 'total_volume';

interface ProgressLineChartProps {
  data: DataPoint[];
  height?: number;
  loading?: boolean;
  exerciseType?: string;
  equipment?: string;
}

const CHART_HEIGHT = 200;

export default function ProgressLineChart({
  data,
  height = CHART_HEIGHT,
  loading,
  exerciseType,
  equipment,
}: ProgressLineChartProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const hasData = data && data.length > 0;
  const isBodyweight =
    equipment === 'None' ||
    exerciseType === 'Bodyweight Reps' ||
    (hasData && data.every(d => (d.max_weight || 0) === 0));
  const availableMetrics: { key: MetricKey; label: string; unit: string }[] = isBodyweight
    ? [
        { key: 'total_reps', label: 'Total Reps', unit: 'reps' },
        { key: 'max_reps', label: 'Max Reps', unit: 'reps' },
      ]
    : [
        { key: 'max_weight', label: 'Weight', unit: 'kg' },
        { key: 'total_reps', label: 'Reps', unit: 'reps' },
        { key: 'total_volume', label: 'Volume', unit: 'kg' },
      ];

  const [activeMetricKey, setActiveMetricKey] = useState<MetricKey>(
    isBodyweight ? 'total_reps' : 'max_weight'
  );

  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    setActiveMetricKey(isBodyweight ? 'total_reps' : 'max_weight');
  }, [isBodyweight]);

  const activeMetricConfig = availableMetrics.find(m => m.key === activeMetricKey) || availableMetrics[0];

  const styles = useStyles((c: any) => ({
    container: { marginTop: Spacing.lg },
    chartCard: { paddingBottom: Spacing.md },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    chartTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.colors.textPrimary },
    toggleContainer: { flexDirection: 'row', gap: 6 },
    togglePill: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: Radius.full,
      backgroundColor: c.colors.bgCardSolid,
      borderWidth: 1,
      borderColor: c.colors.bgCardBorder,
    },
    togglePillActive: {
      backgroundColor: c.colors.teal,
      borderColor: c.colors.teal,
    },
    togglePillText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: c.colors.textSecondary,
    },
    togglePillTextActive: {
      color: c.colors.bg,
      fontWeight: Typography.bold,
    },
    chartSubtitle: { fontSize: Typography.sm, color: c.colors.textSecondary, marginBottom: Spacing.md },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: Spacing.lg,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.colors.bgCardBorder,
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.colors.teal },
    statLabel: { fontSize: Typography.sm, color: c.colors.textSecondary, marginTop: 4 },
    hint: { fontSize: Typography.sm, color: c.colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  }));

  const getMetricValue = (d: DataPoint, key: MetricKey): number => {
    switch (key) {
      case 'max_weight':
        return d.max_weight ?? d.value ?? 0;
      case 'total_reps':
        return d.total_reps ?? d.value ?? 0;
      case 'max_reps':
        return d.max_reps ?? d.value ?? 0;
      case 'total_volume':
        return d.total_volume ?? 0;
      default:
        return d.value ?? 0;
    }
  };

  const values = hasData ? data.map(d => getMetricValue(d, activeMetricKey)) : [];
  const maxVal = hasData ? Math.max(...values) : 0;
  const avgVal = hasData
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    : 0;

  const noOfSections = 4;
  const chartMaxValue = hasData
    ? Math.max(10, Math.ceil((maxVal * 1.1) / noOfSections) * noOfSections)
    : 100;

  const chartData = hasData
    ? data.map((d, i) => ({
        value: getMetricValue(d, activeMetricKey),
        label:
          i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1
            ? d.date.slice(5)
            : undefined,
      }))
    : [{ value: 0 }];

  const subtitleText = `${activeMetricConfig.label} over last 3 months`;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setChartKey(prev => prev + 1)}
        style={styles.chartCard}
      >
        {/* Title & Metric Toggles Header */}
        <View style={styles.headerRow}>
          <Text style={styles.chartTitle}>Progress</Text>
          <View style={styles.toggleContainer}>
            {availableMetrics.map(m => {
              const isActive = m.key === activeMetricKey;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.togglePill, isActive && styles.togglePillActive]}
                  onPress={() => {
                    setActiveMetricKey(m.key);
                    setChartKey(prev => prev + 1);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.togglePillText, isActive && styles.togglePillTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.chartSubtitle}>{subtitleText}</Text>

        <View style={{ position: 'relative' }}>
          <LineChart
            key={chartKey}
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
            hideDataPoints={!hasData}
            rulesColor={colors.bgCardBorder}
            xAxisColor={colors.bgCardBorder}
            xAxisThickness={1}
            yAxisColor={colors.bgCardBorder}
            yAxisThickness={1}
            yAxisLabelWidth={44}
            hideYAxisText={!hasData}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            noOfSections={noOfSections}
            maxValue={chartMaxValue}
            showFractionalValues
            roundToDigits={1}
            disableScroll
            pointerConfig={
              hasData
                ? {
                    pointerStripHeight: height - 30,
                    pointerStripColor: colors.teal + '35',
                    pointerStripWidth: 1,
                    pointerColor: colors.teal,
                    radius: 4,
                    pointerLabelWidth: 54,
                    pointerLabelHeight: 24,
                    shiftPointerLabelY: -36,
                    pointerStripUptoDataPoint: true,
                    activatePointersOnLongPress: false,
                    persistPointer: true,
                    autoAdjustPointerLabelPosition: true,
                    pointerLabelComponent: (items: any[]) => {
                      const item = items[0];
                      if (!item || item.value === undefined) return null;
                      const val = item.value;
                      const unitStr = activeMetricConfig.unit !== 'reps' ? activeMetricConfig.unit : ' reps';
                      return (
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            backgroundColor: colors.bgCardSolid,
                            borderRadius: Radius.sm,
                            borderWidth: 1,
                            borderColor: colors.bgCardBorder,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                            elevation: 4,
                          }}
                        >
                          <Text style={{ color: colors.teal, fontSize: 10, fontWeight: '700' }}>
                            {val}{unitStr}
                          </Text>
                        </View>
                      );
                    },
                  }
                : undefined
            }
          />
          {loading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
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
              <Text style={styles.statValue}>
                {avgVal}
                {activeMetricConfig.unit !== 'reps' ? activeMetricConfig.unit : ''}
              </Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {maxVal}
                {activeMetricConfig.unit !== 'reps' ? activeMetricConfig.unit : ''}
              </Text>
              <Text style={styles.statLabel}>Best</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{data.length}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
