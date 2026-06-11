import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';
import { GlassCardView, SectionHeader, ProgressBar } from '../components/SharedComponents';

const MEALS = [
  {
    name: 'Breakfast',
    icon: '☕',
    color: Colors.amber,
    calories: 520,
    items: ['Oatmeal with berries', 'Greek yogurt', 'Black coffee'],
  },
  {
    name: 'Lunch',
    icon: '🥗',
    color: Colors.teal,
    calories: 680,
    items: ['Grilled chicken salad', 'Whole grain bread', 'Sparkling water'],
  },
  {
    name: 'Dinner',
    icon: '🍽️',
    color: Colors.purple,
    calories: 490,
    items: ['Salmon with veggies', 'Brown rice', 'Herbal tea'],
  },
  {
    name: 'Snacks',
    icon: '🥜',
    color: Colors.pink,
    calories: 150,
    items: ['Mixed nuts', 'Apple'],
  },
];

const MACROS = [
  { label: 'Protein', val: 82, target: 120, unit: 'g', color: Colors.teal },
  { label: 'Carbs', val: 210, target: 280, unit: 'g', color: Colors.amber },
  { label: 'Fats', val: 54, target: 70, unit: 'g', color: Colors.pink },
  { label: 'Fiber', val: 18, target: 25, unit: 'g', color: Colors.purple },
];

const WATER_GLASSES = 8;

export default function CalorieScreen() {
  const [waterCount, setWaterCount] = useState(4);
  const [expandedMeal, setExpandedMeal] = useState<string | null>('Lunch');

  const totalCalories = MEALS.reduce((s, m) => s + m.calories, 0);
  const calorieGoal = 2500;
  const remaining = calorieGoal - totalCalories;
  const progress = totalCalories / calorieGoal;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={useScrollVisibility().onScroll} scrollEventThrottle={16}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Diet</Text>
          <Text style={styles.sub}>Tuesday, June 10</Text>
        </View>

        {/* Calorie Ring Card */}
        <GlassCardView style={styles.calorieCard}>
          <View style={styles.calorieRow}>
            {/* Central Gauge */}
            <View style={styles.gaugeWrap}>
              <View style={[styles.gaugeOuter, { borderColor: Colors.bgCardBorder }]}>
                <View style={[styles.gaugeInner, { borderColor: Colors.teal + '60' }]}>
                  <Text style={styles.gaugeValue}>{totalCalories.toLocaleString()}</Text>
                  <Text style={styles.gaugeUnit}>kcal eaten</Text>
                </View>
              </View>
              {/* Progress arc overlay */}
              <View style={[styles.gaugeProgress, {
                borderTopColor: Colors.teal,
                borderRightColor: progress > 0.5 ? Colors.teal : 'transparent',
              }]} />
            </View>

            {/* Side stats */}
            <View style={styles.calorieStats}>
              <View style={styles.calorieStat}>
                <Text style={styles.calorieStatLabel}>Goal</Text>
                <Text style={[styles.calorieStatVal, { color: Colors.textPrimary }]}>{calorieGoal.toLocaleString()}</Text>
              </View>
              <View style={[styles.calorieDivider]} />
              <View style={styles.calorieStat}>
                <Text style={styles.calorieStatLabel}>Remaining</Text>
                <Text style={[styles.calorieStatVal, { color: remaining > 0 ? Colors.teal : Colors.pink }]}>
                  {remaining > 0 ? remaining.toLocaleString() : `+${Math.abs(remaining)}`}
                </Text>
              </View>
              <View style={[styles.calorieDivider]} />
              <View style={styles.calorieStat}>
                <Text style={styles.calorieStatLabel}>Burned</Text>
                <Text style={[styles.calorieStatVal, { color: Colors.amber }]}>420</Text>
              </View>
            </View>
          </View>
          <ProgressBar progress={progress} color={progress > 1 ? Colors.pink : Colors.teal} height={8} style={{ marginTop: Spacing.md }} />
          <Text style={styles.calorieProgressLabel}>{Math.round(progress * 100)}% of daily goal</Text>
        </GlassCardView>

        {/* Macros */}
        <SectionHeader title="Macronutrients" />
        <GlassCardView style={styles.macroCard}>
          <View style={styles.macroGrid}>
            {MACROS.map(m => (
              <View key={m.label} style={[styles.macroItem, { borderColor: m.color + '40', backgroundColor: m.color + '10' }]}>
                <Text style={[styles.macroVal, { color: m.color }]}>{m.val}{m.unit}</Text>
                <Text style={styles.macroLabel}>{m.label}</Text>
                <ProgressBar progress={m.val / m.target} color={m.color} height={4} style={{ marginTop: Spacing.xs }} />
                <Text style={styles.macroTarget}>/ {m.target}{m.unit}</Text>
              </View>
            ))}
          </View>
        </GlassCardView>

        {/* Water Intake */}
        <SectionHeader title="Hydration" subtitle={`${waterCount} / ${WATER_GLASSES} glasses`} />
        <GlassCardView style={styles.waterCard} accentColor={Colors.teal}>
          <View style={styles.waterGlasses}>
            {Array.from({ length: WATER_GLASSES }).map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setWaterCount(i + 1)}
                style={styles.waterGlass}>
                <Text style={{ fontSize: 24, opacity: i < waterCount ? 1 : 0.25 }}>💧</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ProgressBar progress={waterCount / WATER_GLASSES} color={Colors.teal} height={6} style={{ marginTop: Spacing.md }} />
          <Text style={styles.waterLabel}>{(waterCount * 250) / 1000}L of 2L daily goal</Text>
        </GlassCardView>

        {/* Meals */}
        <SectionHeader title="Meals" action="+ Add food" />
        {MEALS.map(meal => (
          <GlassCardView key={meal.name} style={styles.mealCard}>
            <TouchableOpacity
              style={styles.mealHeader}
              onPress={() => setExpandedMeal(expandedMeal === meal.name ? null : meal.name)}>
              <View style={[styles.mealIcon, { backgroundColor: meal.color + '20' }]}>
                <Text style={{ fontSize: 20 }}>{meal.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealItemCount}>{meal.items.length} items</Text>
              </View>
              <View style={[styles.mealCal, { borderColor: meal.color + '50', backgroundColor: meal.color + '15' }]}>
                <Text style={[styles.mealCalText, { color: meal.color }]}>{meal.calories}</Text>
                <Text style={[styles.mealCalUnit, { color: meal.color + 'AA' }]}>kcal</Text>
              </View>
              <Text style={styles.mealChevron}>{expandedMeal === meal.name ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expandedMeal === meal.name && (
              <View style={styles.mealItems}>
                {meal.items.map((item, j) => (
                  <View key={j} style={styles.mealItem}>
                    <View style={[styles.mealItemDot, { backgroundColor: meal.color }]} />
                    <Text style={styles.mealItemText}>{item}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.addItemBtn}>
                  <Text style={[styles.addItemText, { color: meal.color }]}>+ Add item to {meal.name}</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCardView>
        ))}

        {/* AI Nutrition Insight */}
        <GlassCardView style={styles.aiCard} accentColor={Colors.amber}>
          <Text style={[styles.aiLabel, { color: Colors.amber }]}>✦ AI NUTRITION INSIGHT</Text>
          <Text style={styles.aiText}>
            Your protein intake is 32% below your daily goal. Adding a protein shake or an egg-white omelette at dinner could close the gap. Fiber is also trending low this week — consider adding spinach or flaxseed to your meals.
          </Text>
        </GlassCardView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: Typography.sm, color: Colors.amber, marginTop: 4, fontWeight: Typography.medium },
  calorieCard: { padding: Spacing.lg, marginBottom: Spacing.xl },
  calorieRow: { flexDirection: 'row', alignItems: 'center' },
  gaugeWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  gaugeOuter: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 10, alignItems: 'center', justifyContent: 'center',
  },
  gaugeInner: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 6, alignItems: 'center', justifyContent: 'center',
  },
  gaugeProgress: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderWidth: 10, borderColor: 'transparent',
    borderTopColor: Colors.teal,
    transform: [{ rotate: '45deg' }],
  },
  gaugeValue: { fontSize: Typography.md, fontWeight: Typography.extraBold, color: Colors.textPrimary },
  gaugeUnit: { fontSize: 9, color: Colors.textSecondary },
  calorieStats: { flex: 1, marginLeft: Spacing.xl },
  calorieStat: { marginBottom: Spacing.sm },
  calorieStatLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  calorieStatVal: { fontSize: Typography.lg, fontWeight: Typography.bold },
  calorieDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.xs },
  calorieProgressLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'right' },
  macroCard: { padding: Spacing.base, marginBottom: Spacing.xl },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  macroItem: {
    flex: 1, minWidth: '45%', padding: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1,
  },
  macroVal: { fontSize: Typography.lg, fontWeight: Typography.extraBold },
  macroLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  macroTarget: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },
  waterCard: { padding: Spacing.base, marginBottom: Spacing.xl },
  waterGlasses: { flexDirection: 'row', justifyContent: 'space-around' },
  waterGlass: { padding: Spacing.xs },
  waterLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  mealCard: { padding: Spacing.base, marginBottom: Spacing.md },
  mealHeader: { flexDirection: 'row', alignItems: 'center' },
  mealIcon: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  mealName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  mealItemCount: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  mealCal: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm, borderWidth: 1, marginRight: Spacing.sm },
  mealCalText: { fontSize: Typography.md, fontWeight: Typography.bold },
  mealCalUnit: { fontSize: 9 },
  mealChevron: { fontSize: 10, color: Colors.textMuted },
  mealItems: { paddingTop: Spacing.md, paddingLeft: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Spacing.md },
  mealItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  mealItemDot: { width: 6, height: 6, borderRadius: 3, marginRight: Spacing.sm },
  mealItemText: { fontSize: Typography.sm, color: Colors.textSecondary },
  addItemBtn: { marginTop: Spacing.xs },
  addItemText: { fontSize: Typography.sm, fontWeight: Typography.semiBold },
  aiCard: { padding: Spacing.base, marginBottom: Spacing.base },
  aiLabel: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1.5, marginBottom: Spacing.sm },
  aiText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
});
