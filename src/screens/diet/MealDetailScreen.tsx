import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Plus, ChevronRight, Trash2, Copy, Bookmark, Coffee, Salad, Apple, UtensilsCrossed } from 'lucide-react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BackButton } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import * as dietService from '../../services/dietService';
import type { MealType, NutritionLog } from '../../types/diet';

type Props = {
  navigation: any;
  route: { params: { mealType: MealType; date: string } };
};

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Salad,
  snack: Apple,
  dinner: UtensilsCrossed,
};

const MACRO_COLORS = {
  carbs: '#FBB724',
  fat: '#F472B6',
  protein: '#6B8AFF',
};

export default function MealDetailScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const mealType = route.params?.mealType || 'breakfast';
  const date = route.params?.date || new Date().toISOString().split('T')[0];

  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchMeals = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await dietService.getMealsForDate(session.access_token, date);
      const filtered = (res.meals || []).filter(m => m.taken_as === mealType);
      setMeals(filtered);
    } catch {
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, date, mealType]);

  useFocusEffect(
    useCallback(() => {
      fetchMeals();
    }, [fetchMeals])
  );

  const handleDelete = useCallback(async (nutritionId: number) => {
    if (!session?.access_token) return;
    Alert.alert('Delete Meal', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(nutritionId);
          try {
            await dietService.deleteMeal(session.access_token, nutritionId);
            setMeals(prev => prev.filter(m => m.nutrition_id !== nutritionId));
          } catch {
            Alert.alert('Error', 'Failed to delete meal.');
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  }, [session?.access_token]);

  const totals = useMemo(() => {
    return meals.reduce((acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
      fiber: acc.fiber + (m.fiber || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, [meals]);

  const totalMacros = totals.protein + totals.carbs + totals.fat;
  const proteinPct = totalMacros > 0 ? Math.round((totals.protein / totalMacros) * 100) : 0;
  const carbsPct = totalMacros > 0 ? Math.round((totals.carbs / totalMacros) * 100) : 0;
  const fatPct = totalMacros > 0 ? Math.round((totals.fat / totalMacros) * 100) : 0;

  const ringSize = 120;
  const ringStroke = 10;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;

  // Calculate arc lengths — always sums to full circle
  const carbsArc = totalMacros > 0 ? (totals.carbs / totalMacros) * ringCircumference : 0;
  const fatArc = totalMacros > 0 ? (totals.fat / totalMacros) * ringCircumference : 0;
  const proteinArc = totalMacros > 0 ? (totals.protein / totalMacros) * ringCircumference : 0;

  // Each segment: dash = arc length, gap = rest of circle
  // Rotation positions each segment after the previous one
  const carbsRotation = -90;
  const fatRotation = carbsRotation + (carbsArc / ringCircumference) * 360;
  const proteinRotation = fatRotation + (fatArc / ringCircumference) * 360;

  const s = useStyles((t) => StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingTop: insets.top + Spacing.sm,
      paddingBottom: Spacing.sm,
    },
    headerTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    headerSpacer: { width: 40 },
    summaryCard: {
      backgroundColor: t.colors.bgCardSolid,
      marginHorizontal: Spacing.base,
      marginTop: Spacing.sm,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
    },
    summaryTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    ringContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringCalories: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    ringUnit: {
      fontSize: 9,
      color: t.colors.textSecondary,
      marginTop: -2,
    },
    macrosContainer: {
      flex: 1,
      gap: Spacing.sm,
    },
    macroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    macroLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    macroDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    macroLabel: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
    },
    macroRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    macroPct: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.textSecondary,
      minWidth: 32,
      textAlign: 'right',
    },
    macroGrams: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      minWidth: 36,
    },
    actionRow: {
      flexDirection: 'row',
      marginTop: Spacing.base,
      gap: Spacing.sm,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      gap: 6,
    },
    actionBtnText: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      fontWeight: Typography.medium,
    },
    mealCard: {
      backgroundColor: t.colors.bgCardSolid,
      marginHorizontal: Spacing.base,
      marginTop: Spacing.sm,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      flexDirection: 'row',
      alignItems: 'center',
    },
    mealCardLeft: {
      flex: 1,
    },
    mealCardName: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    mealCardDetails: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      marginTop: 4,
    },
    mealCardRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    deleteBtn: {
      padding: 6,
    },
    logMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: Spacing.base,
      marginTop: Spacing.xl,
      marginBottom: Spacing.xxxl,
      paddingVertical: Spacing.md,
      borderRadius: Radius.full,
      backgroundColor: t.colors.accentBlue,
      gap: 6,
    },
    logMoreBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.bg,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.xxxl,
      paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: Spacing.base,
    },
    emptyTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    emptyText: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  }));

  const renderMealItem = useCallback(({ item }: { item: NutritionLog }) => (
    <View style={s.mealCard}>
      <View style={s.mealCardLeft}>
        <Text style={s.mealCardName}>{item.food}</Text>
        <Text style={s.mealCardDetails}>
          {item.serving_size || 'No serving size'}{item.calories ? ` · ${item.calories} cal` : ''}
        </Text>
      </View>
      <View style={s.mealCardRight}>
        {deleting === item.nutrition_id ? (
          <ActivityIndicator size="small" color={colors.accentBlue} />
        ) : (
          <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.nutrition_id)}>
            <Trash2 size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </View>
  ), [deleting, colors, handleDelete, s]);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <BackButton onPress={() => navigation.goBack()} color={colors.textPrimary} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {React.createElement(MEAL_ICONS[mealType], { size: 20, color: colors.textPrimary })}
          <Text style={s.headerTitle}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
        </View>
        <View style={s.headerSpacer} />
      </View>

      <FlatList
        data={meals}
        keyExtractor={(item) => String(item.nutrition_id)}
        renderItem={renderMealItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListHeaderComponent={
          <>
            {/* MyFitnessPal-style Summary Card */}
            <View style={s.summaryCard}>
              <View style={s.summaryTop}>
                {/* Multi-segment ring */}
                <View style={s.ringContainer}>
                  <Svg width={ringSize} height={ringSize}>
                    {/* Background ring */}
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      stroke={colors.bgCardBorder}
                      strokeWidth={ringStroke}
                      fill="none"
                    />
                    {/* Carbs segment */}
                    {carbsArc > 0 && (
                      <Circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={ringRadius}
                        stroke={MACRO_COLORS.carbs}
                        strokeWidth={ringStroke}
                        fill="none"
                        strokeDasharray={`${carbsArc} ${ringCircumference - carbsArc}`}
                        strokeLinecap="butt"
                        transform={`rotate(${carbsRotation} ${ringSize / 2} ${ringSize / 2})`}
                      />
                    )}
                    {/* Fat segment */}
                    {fatArc > 0 && (
                      <Circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={ringRadius}
                        stroke={MACRO_COLORS.fat}
                        strokeWidth={ringStroke}
                        fill="none"
                        strokeDasharray={`${fatArc} ${ringCircumference - fatArc}`}
                        strokeLinecap="butt"
                        transform={`rotate(${fatRotation} ${ringSize / 2} ${ringSize / 2})`}
                      />
                    )}
                    {/* Protein segment */}
                    {proteinArc > 0 && (
                      <Circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={ringRadius}
                        stroke={MACRO_COLORS.protein}
                        strokeWidth={ringStroke}
                        fill="none"
                        strokeDasharray={`${proteinArc} ${ringCircumference - proteinArc}`}
                        strokeLinecap="butt"
                        transform={`rotate(${proteinRotation} ${ringSize / 2} ${ringSize / 2})`}
                      />
                    )}
                  </Svg>
                  <View style={s.ringCenter}>
                    <Text style={s.ringCalories}>{totals.calories}</Text>
                    <Text style={s.ringUnit}>cal</Text>
                  </View>
                </View>

                {/* Macro stats */}
                <View style={s.macrosContainer}>
                  <View style={s.macroRow}>
                    <View style={s.macroLeft}>
                      <View style={[s.macroDot, { backgroundColor: MACRO_COLORS.carbs }]} />
                      <Text style={s.macroLabel}>Carbs</Text>
                    </View>
                    <View style={s.macroRight}>
                      <Text style={s.macroPct}>{carbsPct}%</Text>
                      <Text style={[s.macroGrams, { color: MACRO_COLORS.carbs }]}>{totals.carbs}g</Text>
                    </View>
                  </View>
                  <View style={s.macroRow}>
                    <View style={s.macroLeft}>
                      <View style={[s.macroDot, { backgroundColor: MACRO_COLORS.fat }]} />
                      <Text style={s.macroLabel}>Fat</Text>
                    </View>
                    <View style={s.macroRight}>
                      <Text style={s.macroPct}>{fatPct}%</Text>
                      <Text style={[s.macroGrams, { color: MACRO_COLORS.fat }]}>{totals.fat}g</Text>
                    </View>
                  </View>
                  <View style={s.macroRow}>
                    <View style={s.macroLeft}>
                      <View style={[s.macroDot, { backgroundColor: MACRO_COLORS.protein }]} />
                      <Text style={s.macroLabel}>Protein</Text>
                    </View>
                    <View style={s.macroRight}>
                      <Text style={s.macroPct}>{proteinPct}%</Text>
                      <Text style={[s.macroGrams, { color: MACRO_COLORS.protein }]}>{totals.protein}g</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action buttons */}
              <View style={s.actionRow}>
                <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
                  <Copy size={14} color={colors.textSecondary} />
                  <Text style={s.actionBtnText}>Copy from</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
                  <Bookmark size={14} color={colors.textSecondary} />
                  <Text style={s.actionBtnText}>Save as</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loading && (
              <ActivityIndicator size="small" color={colors.accentBlue} style={{ paddingVertical: Spacing.xl }} />
            )}

            {!loading && meals.length === 0 && (
              <View style={s.emptyContainer}>
                <Text style={s.emptyIcon}>🍽️</Text>
                <Text style={s.emptyTitle}>No meals logged yet</Text>
                <Text style={s.emptyText}>
                  Tap the button below to start logging your {mealType}.
                </Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={s.logMoreBtn}
            onPress={() => navigation.navigate('FoodSearchScreen', { mealType, date })}
            activeOpacity={0.8}>
            <Plus size={18} color={colors.bg} strokeWidth={2.5} />
            <Text style={s.logMoreBtnText}>Log meal</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}
