import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, GlassCard, Shadows } from '../theme/theme';
import { GlassCardView, SectionHeader, CircularRing, StatPill, ProgressBar } from '../components/SharedComponents';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';



const RINGS = [
  { label: 'Calories', value: '1,840', unit: 'kcal', color: Colors.teal, progress: 0.72 },
  { label: 'Water', value: '1.4', unit: 'L', color: Colors.pink, progress: 0.56 },
  { label: 'Steps', value: '7.2K', unit: 'steps', color: Colors.amber, progress: 0.65 },
];

const AI_TIPS = [
  "Your caloric intake is trending lower on rest days. Consider a small protein-rich snack before bed tonight.",
  "Great workout streak! You've hit the gym 4 days in a row. Make sure to prioritize recovery tomorrow.",
  "Hydration is slightly below average this week. Try keeping a water bottle at your desk as a reminder.",
];

const UPCOMING = [
  { time: '10:00 AM', title: 'Dr. Priya Sharma', subtitle: 'Gynecologist · Apollo Clinic', color: Colors.pink, icon: '🏥' },
  { time: '06:30 PM', title: 'Upper Body Strength', subtitle: 'Chest · Shoulders · Triceps', color: Colors.teal, icon: '💪' },
];

export default function DashboardScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, pulseAnim, slideAnim]);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={useScrollVisibility().onScroll} scrollEventThrottle={16}>
        {/* Header */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good Morning 👋</Text>
              <Text style={styles.subGreeting}>Here's your health summary</Text>
            </View>
            <TouchableOpacity style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Progress Rings */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <GlassCardView style={styles.ringsCard}>
            <View style={styles.ringsRow}>
              {RINGS.map(ring => (
                <CircularRing
                  key={ring.label}
                  size={88}
                  strokeWidth={7}
                  progress={ring.progress}
                  color={ring.color}
                  label={ring.label}
                  value={ring.value}
                  unit={ring.unit}
                />
              ))}
            </View>
          </GlassCardView>
        </Animated.View>

        {/* AI Insight */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Animated.View style={[styles.aiCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconWrap}>
                <Text style={styles.aiIcon}>✦</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.aiLabel}>AI HEALTH INSIGHT</Text>
                <Text style={styles.aiDate}>Today · Jun 10</Text>
              </View>
              <View style={styles.aiLiveDot} />
            </View>
            <Text style={styles.aiTip}>{AI_TIPS[0]}</Text>
            <TouchableOpacity style={styles.aiAction}>
              <Text style={styles.aiActionText}>View full analysis →</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <StatPill label="Streak" value="12 days" color={Colors.amber} />
          <StatPill label="Cycle Day" value="Day 14" color={Colors.pink} />
          <StatPill label="Avg Sleep" value="7.2 hrs" color={Colors.purple} />
        </View>

        {/* Today's Plan */}
        <SectionHeader title="Today's Plan" action="See all" />
        {UPCOMING.map((item, i) => (
          <GlassCardView key={i} style={styles.planCard} accentColor={item.color}>
            <View style={styles.planRow}>
              <View style={[styles.planIconWrap, { backgroundColor: item.color + '22' }]}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{item.title}</Text>
                <Text style={styles.planSub}>{item.subtitle}</Text>
              </View>
              <View style={[styles.planTime, { borderColor: item.color + '55', backgroundColor: item.color + '15' }]}>
                <Text style={[styles.planTimeText, { color: item.color }]}>{item.time}</Text>
              </View>
            </View>
          </GlassCardView>
        ))}

        {/* Macro Summary */}
        <SectionHeader title="Macros Today" subtitle="1,840 / 2,500 kcal" />
        <GlassCardView style={styles.macroCard}>
          {[
            { label: 'Protein', val: '82g', target: '120g', color: Colors.teal, prog: 0.68 },
            { label: 'Carbs', val: '210g', target: '280g', color: Colors.amber, prog: 0.75 },
            { label: 'Fat', val: '54g', target: '70g', color: Colors.pink, prog: 0.77 },
          ].map(m => (
            <View key={m.label} style={styles.macroRow}>
              <Text style={styles.macroLabel}>{m.label}</Text>
              <View style={{ flex: 1, marginHorizontal: Spacing.md }}>
                <ProgressBar progress={m.prog} color={m.color} height={7} />
              </View>
              <Text style={[styles.macroVal, { color: m.color }]}>{m.val}</Text>
              <Text style={styles.macroTarget}> / {m.target}</Text>
            </View>
          ))}
        </GlassCardView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.teal + '30',
    borderWidth: 2,
    borderColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.teal,
  },
  avatarText: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.teal },
  ringsCard: { padding: Spacing.lg, marginBottom: Spacing.base },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  aiCard: {
    ...GlassCard,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderColor: Colors.purple + '50',
    backgroundColor: Colors.purpleDim,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  aiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.purple + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIcon: { fontSize: 18, color: Colors.purple },
  aiLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.purple,
    letterSpacing: 1.5,
  },
  aiDate: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  aiLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowRadius: 6,
    shadowOpacity: 1,
    elevation: 4,
  },
  aiTip: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  aiAction: {},
  aiActionText: { fontSize: Typography.sm, color: Colors.purple, fontWeight: Typography.semiBold },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  planCard: { padding: Spacing.base, marginBottom: Spacing.md },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planIconWrap: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  planInfo: { flex: 1 },
  planTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  planSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 3 },
  planTime: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  planTimeText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  macroCard: { padding: Spacing.base, marginBottom: Spacing.base },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  macroLabel: {
    width: 55,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  macroVal: { fontSize: Typography.sm, fontWeight: Typography.bold },
  macroTarget: { fontSize: Typography.xs, color: Colors.textMuted },
});
