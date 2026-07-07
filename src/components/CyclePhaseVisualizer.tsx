import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { GlassCardView } from './SharedComponents';
import { Colors, Radius, Spacing, Typography } from '../theme/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────────────────────
const COL_WIDTH = 32;   // column width for each day
const CURVE_H = 180;  // height of the hormone curve chart
const LINE_W = 2.0;  // line stroke thickness
const DOT_R = 3;    // normal dot radius at each data point
const DOT_R_SEL = 5.5;  // dot radius when that day is selected
const DAY_ROW_H = 36;   // height of the day-number label row (date + weekday)
const PHASE_BAR_H = 38;   // height of the phase label bar
const SUBDIVISIONS = 8;    // Catmull-Rom sub-segments per day interval

const { width: screenWidth } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type HormoneKey = 'fsh' | 'lh' | 'estrogen' | 'progesterone';

interface HormoneFrame {
  fsh: number;
  lh: number;
  estrogen: number;
  progesterone: number;
}

interface Point { x: number; y: number }
interface Dot { x: number; y: number; day: number }

interface HormoneRenderData {
  key: HormoneKey;
  label: string;
  color: string;
  pathData: string;
  areaPathData: string;
  dots: Dot[];
}

export interface CyclePhaseVisualizerProps {
  cycleLength?: number;
  currentDay?: number;
  startDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hormone config
// ─────────────────────────────────────────────────────────────────────────────
const HORMONES: { key: HormoneKey; label: string; color: string }[] = [
  { key: 'fsh', label: 'FSH', color: Colors.follicular },
  { key: 'lh', label: 'LH', color: Colors.purple },
  { key: 'estrogen', label: 'Estrogen', color: Colors.pink },
  { key: 'progesterone', label: 'Progesterone', color: Colors.success },
];

// ─────────────────────────────────────────────────────────────────────────────
// Hormone curve generation (adapts to any cycle length)
// ─────────────────────────────────────────────────────────────────────────────
function bell(x: number, center: number, width: number, amp: number): number {
  return amp * Math.exp(-0.5 * Math.pow((x - center) / width, 2));
}

function buildHormoneData(cycleLength: number): HormoneFrame[] {
  const ovDay = cycleLength * 0.50;   // ovulation at ~50 % through cycle
  const lutPeak = cycleLength * 0.75;   // progesterone peak at ~75 %
  return Array.from({ length: cycleLength }, (_, i) => {
    const d = i + 1;
    return {
      fsh: Math.min(1,
        bell(d, ovDay - 1, cycleLength * 0.10, 0.62) + 0.15,
      ),
      lh: Math.min(1,
        bell(d, ovDay, cycleLength * 0.035, 0.88) + 0.10,
      ),
      estrogen: Math.min(1,
        bell(d, ovDay - 1, cycleLength * 0.12, 0.82) +
        bell(d, lutPeak, cycleLength * 0.10, 0.38) + 0.10,
      ),
      progesterone: Math.min(1,
        d > ovDay
          ? bell(d, lutPeak, cycleLength * 0.12, 0.90) + 0.05
          : 0.05,
      ),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Catmull-Rom spline helpers
// ─────────────────────────────────────────────────────────────────────────────
function catmullRom(
  p0: number, p1: number, p2: number, p3: number, t: number,
): number {
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-compute pixel positions for all hormones using SVG path data
// ─────────────────────────────────────────────────────────────────────────────
function buildChartData(
  hormoneData: HormoneFrame[],
  cycleLength: number,
): HormoneRenderData[] {
  return HORMONES.map(h => {
    const dots: Dot[] = [];
    const points: Point[] = [];

    const ys = hormoneData.map(f => (1 - f[h.key]) * (CURVE_H - 20) + 10);
    const cx0 = COL_WIDTH / 2;

    for (let i = 0; i < cycleLength; i++) {
      dots.push({ x: cx0 + i * COL_WIDTH, y: ys[i], day: i + 1 });
    }

    // Generate subdivided spline points
    for (let i = 0; i < cycleLength - 1; i++) {
      const p0y = ys[Math.max(0, i - 1)];
      const p1y = ys[i];
      const p2y = ys[i + 1];
      const p3y = ys[Math.min(cycleLength - 1, i + 2)];

      for (let s = 0; s < SUBDIVISIONS; s++) {
        const t = s / SUBDIVISIONS;
        const x = cx0 + i * COL_WIDTH + t * COL_WIDTH;
        const y = catmullRom(p0y, p1y, p2y, p3y, t);
        points.push({ x, y });
      }
    }
    // Add the final point
    points.push({ x: cx0 + (cycleLength - 1) * COL_WIDTH, y: ys[cycleLength - 1] });

    // Format path strings
    let pathData = '';
    if (points.length > 0) {
      pathData = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    const firstX = points[0]?.x ?? 0;
    const lastX = points[points.length - 1]?.x ?? 0;
    const areaPathData = pathData ? `${pathData} L ${lastX} ${CURVE_H} L ${firstX} ${CURVE_H} Z` : '';

    return { ...h, pathData, areaPathData, dots };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase helpers
// ─────────────────────────────────────────────────────────────────────────────
function getPhase(
  day: number,
  menEnd: number,
  ovStart: number,
  ovEnd: number,
): { name: string; color: string; description: string } {
  if (day <= menEnd) {
    return {
      name: 'Menstruation', color: Colors.pink,
      description: 'Uterine lining sheds. Estrogen and progesterone are at their lowest, triggering bleeding.',
    };
  }
  if (day < ovStart) {
    return {
      name: 'Follicular', color: Colors.follicular,
      description: 'FSH stimulates follicle growth. Rising estrogen boosts energy, focus, and mood.',
    };
  }
  if (day <= ovEnd) {
    return {
      name: 'Ovulation', color: Colors.amber,
      description: 'LH surges, triggering egg release. This is the peak fertility window of the cycle.',
    };
  }
  return {
    name: 'Luteal', color: Colors.purple,
    description: 'Progesterone dominates. The body prepares for potential pregnancy; PMS may appear late.',
  };
}

function levelLabel(v: number): string {
  if (v < 0.25) { return 'Low'; }
  if (v < 0.55) { return 'Mod'; }
  if (v < 0.80) { return 'High'; }
  return 'Peak';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const CyclePhaseVisualizer: React.FC<CyclePhaseVisualizerProps> = ({
  cycleLength = 28,
  currentDay = 18,
  startDate,
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeHormones, setActiveHormones] = useState<Set<HormoneKey>>(
    new Set<HormoneKey>(['fsh', 'lh', 'estrogen', 'progesterone']),
  );

  const scrollRef = useRef<ScrollView>(null);

  // ── Compute calendar dates from start_date ───────────────────────────
  const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayLabels = useMemo(() => {
    const base = startDate ? new Date(startDate) : new Date();
    return Array.from({ length: cycleLength }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return {
        date: d.getDate(),
        month: d.getMonth(),
        dayAbbr: DAY_ABBR[d.getDay()],
      };
    });
  }, [startDate, cycleLength]);

  // ── Derived phase boundaries (scale with cycle length) ────────────────────
  const menEnd = Math.min(5, Math.round(cycleLength * 0.18));
  const ovStart = Math.round(cycleLength * 0.43);
  const ovEnd = Math.round(cycleLength * 0.54);

  // ── Data ─────────────────────────────────────────────────────────────────
  const hormoneData = useMemo(() => buildHormoneData(cycleLength), [cycleLength]);
  const chartData = useMemo(
    () => buildChartData(hormoneData, cycleLength),
    [hormoneData, cycleLength],
  );

  // ── Layout ───────────────────────────────────────────────────────────────
  const totalWidth = cycleLength * COL_WIDTH;

  const phaseBands = [
    { label: 'Menstruation', start: 0, end: menEnd, color: Colors.pink },
    { label: 'Follicular', start: menEnd, end: ovStart, color: Colors.follicular },
    { label: 'Ovulation', start: ovStart, end: ovEnd, color: Colors.amber },
    { label: 'Luteal', start: ovEnd, end: cycleLength, color: Colors.purple },
  ];

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const focusDay = selectedDay ?? currentDay;
  const focusPhase = getPhase(focusDay, menEnd, ovStart, ovEnd);

  // ── Countdown ─────────────────────────────────────────────────────────────
  const daysToNextPeriod = cycleLength - currentDay;
  const rawDaysToOv = ovStart - currentDay;
  const daysToNextOvulation = rawDaysToOv > 0
    ? rawDaysToOv
    : cycleLength - currentDay + ovStart;

  // Auto-scroll to center the today line
  useEffect(() => {
    const timer = setTimeout(() => {
      const targetX = (currentDay - 1) * COL_WIDTH + COL_WIDTH / 2 - (screenWidth - 32) / 2;
      scrollRef.current?.scrollTo({ x: Math.max(0, targetX), animated: false });
    }, 150);
    return () => clearTimeout(timer);
  }, [currentDay, screenWidth]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleHormone = useCallback((key: HormoneKey) => {
    setActiveHormones(prev => {
      const next = new Set(prev);
      if (next.has(key) && next.size > 1) { next.delete(key); }
      else { next.add(key); }
      return next;
    });
  }, []);

  const handleColPress = useCallback((day: number) => {
    setSelectedDay(prev => (prev === day ? null : day));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <GlassCardView style={cv.card}>

      {/* ── Legend pills ───────────────────────────────────────────────────── */}
      <View style={cv.legendRow}>
        {HORMONES.map(h => {
          const active = activeHormones.has(h.key);
          return (
            <TouchableOpacity
              key={h.key}
              onPress={() => toggleHormone(h.key)}
              activeOpacity={0.75}
              style={[
                cv.legendPill,
                active
                  ? { borderColor: h.color + '80', backgroundColor: h.color + '18' }
                  : { borderColor: Colors.bgCardBorder },
              ]}>
              <View style={[cv.legendSwatch, { backgroundColor: active ? h.color : Colors.textMuted }]} />
              <Text style={[cv.legendLabel, { color: active ? h.color : Colors.textMuted }]}>
                {h.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Horizontal scroll area — chart + day labels + phase bar ─────────── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="normal">

        <View style={{ width: totalWidth }}>

          {/* Chart canvas */}
          <View style={[cv.chartWrap, { width: totalWidth, height: CURVE_H }]}>

            {/* Phase background bands */}
            {phaseBands.map(band => (
              <View
                key={band.label}
                pointerEvents="none"
                style={[
                  cv.phaseBandBg,
                  {
                    left: (band.start / cycleLength) * totalWidth,
                    width: ((band.end - band.start) / cycleLength) * totalWidth,
                    backgroundColor: band.color + '14',
                    borderRightColor: band.color + '35',
                  },
                ]}
              />
            ))}

            {/* Svg drawing curves and areas */}
            <Svg style={StyleSheet.absoluteFill} width={totalWidth} height={CURVE_H}>
              <Defs>
                {HORMONES.map(h => (
                  <LinearGradient key={`grad-${h.key}`} id={`grad-${h.key}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={h.color} stopOpacity={0.25} />
                    <Stop offset="100%" stopColor={h.color} stopOpacity={0.00} />
                  </LinearGradient>
                ))}
              </Defs>

              {chartData.map(h => {
                const visible = activeHormones.has(h.key);
                if (!visible) { return null; }
                return (
                  <React.Fragment key={h.key}>
                    {/* Area under curve */}
                    <Path d={h.areaPathData} fill={`url(#grad-${h.key})`} />
                    {/* Curve line */}
                    <Path d={h.pathData} stroke={h.color} strokeWidth={LINE_W} fill="none" opacity={0.9} strokeLinecap="round" />
                    {/* Interactive dots */}
                    {h.dots.map(dot => {
                      const sel = selectedDay === dot.day;
                      if (!sel) return null;
                      return (
                        <Circle
                          key={`dot-sel-${dot.day}`}
                          cx={dot.x}
                          cy={dot.y}
                          r={DOT_R_SEL}
                          fill={h.color}
                          stroke={Colors.white}
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </Svg>

            {/* ── Tappable invisible column overlays ──────────────────────── */}
            {Array.from({ length: cycleLength }, (_, i) => {
              const day = i + 1;
              const isSelected = selectedDay === day;
              const isCurrent = day === currentDay;
              return (
                <TouchableOpacity
                  key={day}
                  activeOpacity={0.5}
                  onPress={() => handleColPress(day)}
                  style={[
                    cv.colTouch,
                    {
                      left: i * COL_WIDTH,
                      width: COL_WIDTH,
                      backgroundColor: isSelected
                        ? Colors.listItemBg
                        : isCurrent
                          ? Colors.tooltipBg
                          : 'transparent',
                    },
                  ]}
                />
              );
            })}

            {/* ── Today needle ─────────────────────────────────────────────── */}
            <View
              pointerEvents="none"
              style={[
                cv.needle,
                { left: (currentDay - 1) * COL_WIDTH + COL_WIDTH / 2 },
              ]}>
              <View style={cv.needleBubble}>
                <Text style={cv.needleBubbleText}>Today</Text>
              </View>
              <View style={cv.needleLine} />
            </View>

          </View>{/* end chartWrap */}


          {/* ── Day labels row — every single day ──────────────────────────── */}
          <View style={[cv.dayLabelsRow, { width: totalWidth }]}>
            {dayLabels.map((label, i) => {
              const day = i + 1;
              const isSelected = selectedDay === day;
              const isCurrent = day === currentDay;
              return (
                <View key={day} style={[cv.dayLabelWrap, { width: COL_WIDTH }]}>
                  <View
                    style={[
                      cv.tick,
                      isCurrent && { backgroundColor: Colors.amber },
                      isSelected && { backgroundColor: Colors.textSecondary },
                    ]}
                  />
                  <Text
                    style={[
                      cv.dayLabelDate,
                      isCurrent && { color: Colors.amber, fontWeight: Typography.bold },
                      isSelected && { color: Colors.textPrimary, fontWeight: Typography.semiBold },
                    ]}>
                    {label.date}
                  </Text>
                  <Text
                    style={[
                      cv.dayLabelAbbr,
                      isCurrent && { color: Colors.amber },
                      isSelected && { color: Colors.textSecondary },
                    ]}>
                    {label.dayAbbr}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ── Phase label bar ─────────────────────────────────────────────── */}
          <View style={cv.phaseLabelBar}>
            {phaseBands.map(band => {
              const w = ((band.end - band.start) / cycleLength) * totalWidth;
              return (
                <View
                  key={band.label}
                  style={[
                    cv.phaseLabelChunk,
                    {
                      width: w,
                      backgroundColor: band.color + '22',
                      borderColor: band.color + '45',
                    },
                  ]}>
                  <Text
                    style={[cv.phaseLabelText, { color: band.color }]}
                    numberOfLines={1}>
                    {band.label}
                  </Text>
                </View>
              );
            })}
          </View>

        </View>{/* end totalWidth wrapper */}
      </ScrollView>

      {/* ── Tooltip — outside scroll, always visible ──────────────────────────── */}
      <View style={[cv.tooltip, { borderColor: focusPhase.color + '50' }]}>
        <View style={cv.tooltipHeader}>
          <View style={[cv.tooltipDot, { backgroundColor: focusPhase.color }]} />
          <Text style={[cv.tooltipPhaseName, { color: focusPhase.color }]}>
            {focusPhase.name}
          </Text>
          <Text style={cv.tooltipDayLabel}>
            {selectedDay != null
              ? `· Day ${selectedDay}`
              : `· Day ${currentDay} (today)`}
          </Text>
          {selectedDay != null && (
            <TouchableOpacity
              onPress={() => setSelectedDay(null)}
              style={cv.tooltipDismissBtn}>
              <Text style={cv.tooltipDismissX}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={cv.tooltipDesc}>{focusPhase.description}</Text>
        <View style={cv.tooltipHormoneRow}>
          {HORMONES.map(h => {
            const val = hormoneData[focusDay - 1]?.[h.key] ?? 0;
            return (
              <View key={h.key} style={cv.tooltipHormoneItem}>
                <Text style={[cv.tooltipHormoneLevel, { color: h.color }]}>
                  {levelLabel(val)}
                </Text>
                <Text style={cv.tooltipHormoneKey}>{h.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Countdown strip ───────────────────────────────────────────────────── */}
      <View style={cv.countdownStrip}>
        <View style={cv.countdownItem}>
          <Text style={[cv.countdownVal, { color: Colors.pink }]}>
            {daysToNextPeriod}
          </Text>
          <Text style={cv.countdownLbl}>{'Days to\nNext Period'}</Text>
        </View>
        <View style={cv.countdownDivider} />
        <View style={cv.countdownItem}>
          <Text style={[cv.countdownVal, { color: Colors.amber }]}>
            {daysToNextOvulation}
          </Text>
          <Text style={cv.countdownLbl}>{'Days to\nOvulation'}</Text>
        </View>
        <View style={cv.countdownDivider} />
        <View style={cv.countdownItem}>
          <Text style={[cv.countdownVal, { color: Colors.purple }]}>
            Day {currentDay}
          </Text>
          <Text style={cv.countdownLbl}>{'Current\nCycle Day'}</Text>
        </View>
      </View>

    </GlassCardView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const cv = StyleSheet.create({
  card: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.sm,
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },

  // ── Legend ────────────────────────────────────────────────────────────────
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 5,
  },
  legendSwatch: {
    width: 16,
    height: 2,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
  },

  // ── Chart ─────────────────────────────────────────────────────────────────
  chartWrap: {
    height: CURVE_H,
    position: 'relative',
    overflow: 'visible',
  },
  phaseBandBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
  },
  colTouch: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },

  // ── Needle ────────────────────────────────────────────────────────────────
  needle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    width: 1,
  },
  needleBubble: {
    backgroundColor: Colors.amber + '22',
    borderWidth: 1,
    borderColor: Colors.amber + '80',
    borderRadius: Radius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 2,
    // Keep bubble visible even though needle is 1dp wide
    marginLeft: -16,
    width: 36,
    alignItems: 'center',
  },
  needleBubbleText: {
    fontSize: Typography.micro,
    color: Colors.amber,
    fontWeight: Typography.bold,
  },
  needleLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: Colors.amber,
    opacity: 0.65,
  },

  // ── Day labels ────────────────────────────────────────────────────────────
  dayLabelsRow: {
    flexDirection: 'row',
    height: DAY_ROW_H,
    alignItems: 'center',
    marginTop: 4,
  },
  dayLabelWrap: {
    alignItems: 'center',
    gap: 1,
  },
  tick: {
    width: 1.5,
    height: 4,
    borderRadius: 1,
    backgroundColor: Colors.bgCardBorder,
  },
  dayLabelDate: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.semiBold,
    textAlign: 'center',
  },
  dayLabelAbbr: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── Phase bar ─────────────────────────────────────────────────────────────
  phaseLabelBar: {
    flexDirection: 'row',
    height: PHASE_BAR_H,
    gap: 2,
    marginTop: Spacing.xs,
  },
  phaseLabelChunk: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  phaseLabelText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    textAlign: 'center',
  },

  // ── Tooltip ───────────────────────────────────────────────────────────────
  tooltip: {
    backgroundColor: Colors.tooltipBg,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 5,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  tooltipPhaseName: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  tooltipDayLabel: {
    flex: 1,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  tooltipDismissBtn: {
    padding: 3,
  },
  tooltipDismissX: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  tooltipDesc: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  tooltipHormoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tooltipHormoneItem: {
    alignItems: 'center',
    flex: 1,
  },
  tooltipHormoneLevel: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  tooltipHormoneKey: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },

  // ── Countdown ─────────────────────────────────────────────────────────────
  countdownStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  countdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  countdownVal: {
    fontSize: Typography.lg,
    fontWeight: Typography.extraBold,
  },
  countdownLbl: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 14,
  },
  countdownDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.divider,
  },
});
