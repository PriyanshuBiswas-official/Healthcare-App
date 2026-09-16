import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Polyline,
  Line,
  Text as SvgText,
  G,
  Path,
} from 'react-native-svg';
import { X, Moon, Utensils, Scale, Activity } from 'lucide-react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HealthCompareModalProps {
  visible: boolean;
  partnerName: string;
  onClose: () => void;
}

const MOCK_COMPARE = {
  user: {
    name: 'You',
    sleep: {
      avgHours: 7.2, quality: 82, consistency: 75,
      trend: [6.5, 7.8, 7.0, 8.2, 7.5, 6.8, 7.2],
    },
    nutrition: {
      calories: 1950, calorieTarget: 2100,
      protein: 130, proteinTarget: 150,
      carbs: 200, carbsTarget: 220,
      fat: 58, fatTarget: 65,
      water: 2.3, waterTarget: 2.5,
    },
    weight: { current: 72.5, trend: [71.8, 72.0, 72.3, 72.1, 72.5, 72.4, 72.5] },
    healthScore: { total: 82, sleep: 85, nutrition: 78, activity: 80, hydration: 88, mood: 79 },
  },
  partner: {
    sleep: {
      avgHours: 8.1, quality: 90, consistency: 88,
      trend: [7.5, 8.0, 8.3, 7.8, 8.5, 8.1, 8.4],
    },
    nutrition: {
      calories: 1850, calorieTarget: 2100,
      protein: 135, proteinTarget: 150,
      carbs: 195, carbsTarget: 220,
      fat: 55, fatTarget: 65,
      water: 2.1, waterTarget: 2.5,
    },
    weight: { current: 65.2, trend: [65.0, 65.3, 65.1, 65.4, 65.2, 65.3, 65.2] },
    healthScore: { total: 88, sleep: 92, nutrition: 84, activity: 81, hydration: 85, mood: 90 },
  },
};

// ─── DOUBLE RING GAUGE (You outer, Partner inner) ───────────────────────────

const DoubleRingGauge: React.FC<{
  userVal: number; partnerVal: number; maxVal: number;
  label: string; unit: string;
  userColor: string; partnerColor: string;
  size?: number;
}> = ({ userVal, partnerVal, maxVal, label, unit, userColor, partnerColor, size = 90 }) => {
  const outerStroke = 7;
  const gap = 5;
  const innerStroke = 7;
  const outerRadius = (size - outerStroke) / 2;
  const innerRadius = outerRadius - outerStroke - gap;
  const outerCircum = 2 * Math.PI * outerRadius;
  const innerCircum = 2 * Math.PI * innerRadius;
  const userPct = Math.min(userVal / maxVal, 1);
  const partnerPct = Math.min(partnerVal / maxVal, 1);

  return (
    <View style={{ alignItems: 'center', width: (SCREEN_WIDTH - 80) / 3 }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id={`dr-outer-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={userColor} />
            <Stop offset="100%" stopColor={userColor + '80'} />
          </SvgLinearGradient>
          <SvgLinearGradient id={`dr-inner-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={partnerColor} />
            <Stop offset="100%" stopColor={partnerColor + '80'} />
          </SvgLinearGradient>
        </Defs>
        {/* Outer track */}
        <Circle cx={size / 2} cy={size / 2} r={outerRadius} stroke="rgba(255,255,255,0.06)" strokeWidth={outerStroke} fill="none" />
        {/* Outer fill (user) */}
        <Circle cx={size / 2} cy={size / 2} r={outerRadius} stroke={`url(#dr-outer-${label})`} strokeWidth={outerStroke} strokeDasharray={`${outerCircum} ${outerCircum}`} strokeDashoffset={outerCircum * (1 - userPct)} strokeLinecap="round" fill="none" />
        {/* Inner track */}
        <Circle cx={size / 2} cy={size / 2} r={innerRadius} stroke="rgba(255,255,255,0.06)" strokeWidth={innerStroke} fill="none" />
        {/* Inner fill (partner) */}
        <Circle cx={size / 2} cy={size / 2} r={innerRadius} stroke={`url(#dr-inner-${label})`} strokeWidth={innerStroke} strokeDasharray={`${innerCircum} ${innerCircum}`} strokeDashoffset={innerCircum * (1 - partnerPct)} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: Typography.extraBold, color: '#F0F4FF' }}>{userVal}<Text style={{ fontSize: 9, color: '#8B92B4' }}>{unit}</Text></Text>
        <Text style={{ fontSize: 11, fontWeight: Typography.bold, color: '#B0B8D1' }}>{partnerVal}<Text style={{ fontSize: 8, color: '#8B92B4' }}>{unit}</Text></Text>
      </View>
      <Text style={{ fontSize: 10, fontWeight: Typography.semiBold, color: '#8B92B4', marginTop: 4, textAlign: 'center' }}>{label}</Text>
    </View>
  );
};

// ─── SINGLE RING GAUGE ──────────────────────────────────────────────────────

const RingGauge: React.FC<{
  score: number; color: string; label: string; size?: number;
}> = ({ score, color, label, size = 80 }) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={color + '80'} />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={`url(#grad-${label})`} strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: Typography.extraBold, color: '#F0F4FF' }}>{score}</Text>
        <Text style={{ fontSize: 9, fontWeight: Typography.semiBold, color: '#8B92B4', marginTop: -2 }}>/ 100</Text>
      </View>
    </View>
  );
};

// ─── HORIZONTAL COMPARE BAR ─────────────────────────────────────────────────

const CompareBar: React.FC<{
  label: string; userVal: number; partnerVal: number; unit: string; maxVal: number;
  colors: { user: string; partner: string };
}> = ({ label, userVal, partnerVal, unit, maxVal, colors: c }) => {
  const barMax = SCREEN_WIDTH - 120;
  const userWidth = maxVal > 0 ? (userVal / maxVal) * barMax : 0;
  const partnerWidth = maxVal > 0 ? (partnerVal / maxVal) * barMax : 0;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: '#8B92B4', marginBottom: 6, textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
        <Text style={{ fontSize: Typography.xs, color: '#B0B8D1', width: 48 }}>You</Text>
        <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <View style={{ width: userWidth, height: '100%', borderRadius: 6, backgroundColor: c.user }} />
        </View>
        <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: '#F0F4FF', marginLeft: 8, minWidth: 48, textAlign: 'right' }}>{userVal}{unit}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: Typography.xs, color: '#B0B8D1', width: 48 }}>Partner</Text>
        <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <View style={{ width: partnerWidth, height: '100%', borderRadius: 6, backgroundColor: c.partner }} />
        </View>
        <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: '#F0F4FF', marginLeft: 8, minWidth: 48, textAlign: 'right' }}>{partnerVal}{unit}</Text>
      </View>
    </View>
  );
};

// ─── LINE CHART (dual overlaid) ─────────────────────────────────────────────

const CompareLineChart: React.FC<{
  userData: number[]; partnerData: number[]; userColor: string; partnerColor: string;
  minY?: number; maxY?: number;
}> = ({ userData, partnerData, userColor, partnerColor, minY: forceMinY, maxY: forceMaxY }) => {
  const svgW = SCREEN_WIDTH - 80;
  const svgH = 130;
  const pl = 8;
  const pr = 8;
  const pt = 10;
  const pb = 20;
  const pw = svgW - pl - pr;
  const ph = svgH - pt - pb;
  const allVals = [...userData, ...partnerData];
  const dataMinY = forceMinY ?? Math.min(...allVals) - 1;
  const dataMaxY = forceMaxY ?? Math.max(...allVals) + 1;
  const rangeY = dataMaxY - dataMinY || 1;
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const getX = (i: number, len: number) => pl + (i / Math.max(1, len - 1)) * pw;
  const getY = (v: number) => pt + ph - ((v - dataMinY) / rangeY) * ph;
  const userPoints = userData.map((v, i) => `${getX(i, userData.length)},${getY(v)}`).join(' ');
  const partnerPoints = partnerData.map((v, i) => `${getX(i, partnerData.length)},${getY(v)}`).join(' ');

  const makeAreaPath = (data: number[]) => {
    if (data.length === 0) return '';
    const first = `M ${getX(0, data.length)},${getY(data[0])}`;
    const lines = data.slice(1).map((v, i) => `L ${getX(i + 1, data.length)},${getY(v)}`).join(' ');
    return `${first} ${lines} L ${getX(data.length - 1, data.length)},${svgH - pb} L ${getX(0, data.length)},${svgH - pb} Z`;
  };

  return (
    <Svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      <Defs>
        <SvgLinearGradient id="userAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={userColor} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={userColor} stopOpacity={0.02} />
        </SvgLinearGradient>
        <SvgLinearGradient id="partnerAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={partnerColor} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={partnerColor} stopOpacity={0.02} />
        </SvgLinearGradient>
      </Defs>
      {[dataMinY, (dataMinY + dataMaxY) / 2, dataMaxY].map((v, i) => (
        <G key={`grid-${i}`}>
          <Line x1={pl} y1={getY(v)} x2={svgW - pr} y2={getY(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
          <SvgText x={pl - 2} y={getY(v) + 3} fill="#8B92B4" fontSize="8" textAnchor="end">{v.toFixed(1)}</SvgText>
        </G>
      ))}
      <Path d={makeAreaPath(userData)} fill="url(#userAreaGrad)" />
      <Path d={makeAreaPath(partnerData)} fill="url(#partnerAreaGrad)" />
      <Polyline points={userPoints} fill="none" stroke={userColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={partnerPoints} fill="none" stroke={partnerColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {userData.map((v, i) => (
        <Circle key={`ud-${i}`} cx={getX(i, userData.length)} cy={getY(v)} r={3} fill="#0F1729" stroke={userColor} strokeWidth={2} />
      ))}
      {partnerData.map((v, i) => (
        <Circle key={`pd-${i}`} cx={getX(i, partnerData.length)} cy={getY(v)} r={3} fill="#0F1729" stroke={partnerColor} strokeWidth={2} />
      ))}
      {dayLabels.map((label, i) => (
        <SvgText key={`dl-${i}`} x={getX(i, dayLabels.length)} y={svgH - 4} fill="#8B92B4" fontSize="8" textAnchor="middle">{label}</SvgText>
      ))}
    </Svg>
  );
};

// ─── COMPACT SCORE BAR ──────────────────────────────────────────────────────

const CompactScoreBar: React.FC<{
  label: string; userVal: number; partnerVal: number; maxVal: number;
  colors: { user: string; partner: string };
}> = ({ label, userVal, partnerVal, maxVal, colors: c }) => {
  const barMax = SCREEN_WIDTH - 140;
  const userWidth = maxVal > 0 ? (userVal / maxVal) * barMax : 0;
  const partnerWidth = maxVal > 0 ? (partnerVal / maxVal) * barMax : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: Typography.bold, color: '#8B92B4' }}>{label}</Text>
        <Text style={{ fontSize: 11, color: '#B0B8D1' }}>{userVal} vs {partnerVal}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <View style={{ width: userWidth, height: '100%', borderRadius: 3, backgroundColor: c.user }} />
        </View>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <View style={{ width: partnerWidth, height: '100%', borderRadius: 3, backgroundColor: c.partner }} />
        </View>
      </View>
    </View>
  );
};

// ─── MAIN MODAL ─────────────────────────────────────────────────────────────

export default function HealthCompareModal({ visible, partnerName, onClose }: HealthCompareModalProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const s = useStyles((t) => ({
    overlay: { flex: 1, backgroundColor: t.colors.overlayHeavy, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: t.colors.modalBg,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      maxHeight: '95%',
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.textMuted, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
    title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.chipBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.bgCardBorder },
    scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
    section: { marginBottom: Spacing.xl },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.base },
    sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: t.colors.textPrimary },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 4 },
    scoreLabel: { fontSize: Typography.xs, fontWeight: Typography.semiBold, color: t.colors.textMuted, textAlign: 'center', marginTop: 6 },
    doubleRingRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, marginBottom: Spacing.base },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: Typography.xs, color: t.colors.textSecondary, fontWeight: Typography.semiBold },
  }));

  const userColor = colors.accentBlue;
  const partnerColor = colors.pink;
  const d = MOCK_COMPARE;

  const sleepMax = Math.max(d.user.sleep.avgHours, d.partner.sleep.avgHours) + 1;
  const calMax = Math.max(d.user.nutrition.calorieTarget, d.partner.nutrition.calorieTarget) + 200;
  const sleepTrendAll = [...d.user.sleep.trend, ...d.partner.sleep.trend];
  const stMin = Math.min(...sleepTrendAll) - 0.5;
  const stMax = Math.max(...sleepTrendAll) + 0.5;
  const weightAll = [...d.user.weight.trend, ...d.partner.weight.trend];
  const wMin = Math.min(...weightAll) - 0.5;
  const wMax = Math.max(...weightAll) + 0.5;
  const scoreMax = 100;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={s.title}>You & {partnerName}</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            {/* Legend */}
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: userColor }]} />
                <Text style={s.legendText}>You</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: partnerColor }]} />
                <Text style={s.legendText}>{partnerName}</Text>
              </View>
            </View>

            {/* ── HEALTH SCORE ── */}
            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Activity size={16} color={colors.accentBlue} />
                <Text style={s.sectionTitle}>Health Score</Text>
              </View>
              <View style={s.scoreRow}>
                <View style={{ alignItems: 'center' }}>
                  <RingGauge score={d.user.healthScore.total} color={userColor} label="user-total" />
                  <Text style={s.scoreLabel}>You</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <RingGauge score={d.partner.healthScore.total} color={partnerColor} label="partner-total" />
                  <Text style={s.scoreLabel}>{partnerName}</Text>
                </View>
              </View>
            </View>

            {/* ── SLEEP ── */}
            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Moon size={16} color={colors.accentBlue} />
                <Text style={s.sectionTitle}>Sleep</Text>
              </View>
              <CompareLineChart userData={d.user.sleep.trend} partnerData={d.partner.sleep.trend} userColor={userColor} partnerColor={partnerColor} minY={stMin} maxY={stMax} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: Typography.xs, color: userColor, fontWeight: Typography.bold }}>You: {d.user.sleep.avgHours}h avg</Text>
                <Text style={{ fontSize: Typography.xs, color: partnerColor, fontWeight: Typography.bold }}>{partnerName}: {d.partner.sleep.avgHours}h avg</Text>
              </View>
              <CompareBar label="Quality" userVal={d.user.sleep.quality} partnerVal={d.partner.sleep.quality} unit="%" maxVal={100} colors={{ user: userColor, partner: partnerColor }} />
              <CompareBar label="Consistency" userVal={d.user.sleep.consistency} partnerVal={d.partner.sleep.consistency} unit="%" maxVal={100} colors={{ user: userColor, partner: partnerColor }} />
            </View>

            {/* ── NUTRITION ── */}
            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Utensils size={16} color={colors.amber} />
                <Text style={s.sectionTitle}>Nutrition</Text>
              </View>
              <CompareBar label="Calories" userVal={d.user.nutrition.calories} partnerVal={d.partner.nutrition.calories} unit=" kcal" maxVal={calMax} colors={{ user: userColor, partner: partnerColor }} />
              <View style={[s.doubleRingRow, { marginTop: 8 }]}>
                <DoubleRingGauge userVal={d.user.nutrition.protein} partnerVal={d.partner.nutrition.protein} maxVal={d.user.nutrition.proteinTarget} label="Protein" unit="g" userColor={userColor} partnerColor={partnerColor} />
                <DoubleRingGauge userVal={d.user.nutrition.carbs} partnerVal={d.partner.nutrition.carbs} maxVal={d.user.nutrition.carbsTarget} label="Carbs" unit="g" userColor={userColor} partnerColor={partnerColor} />
                <DoubleRingGauge userVal={d.user.nutrition.fat} partnerVal={d.partner.nutrition.fat} maxVal={d.user.nutrition.fatTarget} label="Fats" unit="g" userColor={userColor} partnerColor={partnerColor} />
              </View>
              <View style={{ marginTop: 12 }}>
                <CompareBar label="Water" userVal={d.user.nutrition.water} partnerVal={d.partner.nutrition.water} unit="L" maxVal={d.user.nutrition.waterTarget + 0.5} colors={{ user: userColor, partner: partnerColor }} />
              </View>
            </View>

            {/* ── WEIGHT TREND ── */}
            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Scale size={16} color={colors.teal} />
                <Text style={s.sectionTitle}>Weight Trend (7 days)</Text>
              </View>
              <CompareLineChart userData={d.user.weight.trend} partnerData={d.partner.weight.trend} userColor={userColor} partnerColor={partnerColor} minY={wMin} maxY={wMax} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
                <Text style={{ fontSize: Typography.xs, color: userColor, fontWeight: Typography.bold }}>You: {d.user.weight.current} kg</Text>
                <Text style={{ fontSize: Typography.xs, color: partnerColor, fontWeight: Typography.bold }}>{partnerName}: {d.partner.weight.current} kg</Text>
              </View>
            </View>

            {/* ── SCORE BREAKDOWN (compact) ── */}
            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Activity size={16} color={colors.pink} />
                <Text style={s.sectionTitle}>Score Breakdown</Text>
              </View>
              <CompactScoreBar label="Sleep" userVal={d.user.healthScore.sleep} partnerVal={d.partner.healthScore.sleep} maxVal={scoreMax} colors={{ user: userColor, partner: partnerColor }} />
              <CompactScoreBar label="Nutrition" userVal={d.user.healthScore.nutrition} partnerVal={d.partner.healthScore.nutrition} maxVal={scoreMax} colors={{ user: userColor, partner: partnerColor }} />
              <CompactScoreBar label="Activity" userVal={d.user.healthScore.activity} partnerVal={d.partner.healthScore.activity} maxVal={scoreMax} colors={{ user: userColor, partner: partnerColor }} />
              <CompactScoreBar label="Hydration" userVal={d.user.healthScore.hydration} partnerVal={d.partner.healthScore.hydration} maxVal={scoreMax} colors={{ user: userColor, partner: partnerColor }} />
              <CompactScoreBar label="Mood" userVal={d.user.healthScore.mood} partnerVal={d.partner.healthScore.mood} maxVal={scoreMax} colors={{ user: userColor, partner: partnerColor }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
