import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Search, Plus, X, Mic, Barcode, Camera, ChevronDown } from 'lucide-react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, PremiumBadge } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import * as dietService from '../../services/dietService';
import type { MealType, AddedFood, RecentMeal, FoodSearchResult, FoodNutrition } from '../../types/diet';

type Props = {
  navigation: any;
  route: { params: { mealType: MealType; date: string } };
};

const MEAL_TYPE_OPTIONS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function FoodSearchScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const initialMealType = route.params?.mealType || 'breakfast';
  const date = route.params?.date || new Date().toISOString().split('T')[0];

  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [addedFoods, setAddedFoods] = useState<AddedFood[]>([]);
  const [fetchingNutritionId, setFetchingNutritionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent meals on mount
  useEffect(() => {
    if (!session?.access_token) return;
    setRecentLoading(true);
    dietService.getRecentMeals(session.access_token, 7, 20)
      .then(setRecentMeals)
      .catch(() => setRecentMeals([]))
      .finally(() => setRecentLoading(false));
  }, [session?.access_token]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Debounced food search
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (text.trim().length < 2 || !session?.access_token) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await dietService.searchFood(session.access_token, text.trim(), 10);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, [session?.access_token]);

  // Add food to the list (fetch nutrition first)
  const handleAddFood = useCallback(async (item: { id?: number; title: string; calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; servingSize?: string }) => {
    if (!session?.access_token) return;

    // If we already have nutrition data (from recent meals), add directly
    if (item.calories !== undefined) {
      setAddedFoods(prev => [...prev, {
        food: item.title,
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        fiber: item.fiber || 0,
        servingSize: item.servingSize,
      }]);
      return;
    }

    // Otherwise fetch nutrition by ID
    if (item.id) {
      setFetchingNutritionId(item.id);
      try {
        const nutrition = await dietService.getFoodNutrition(session.access_token, item.id);
        setAddedFoods(prev => [...prev, {
          food: item.title,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber,
          servingSize: item.servingSize,
        }]);
      } catch {
        Alert.alert('Error', 'Could not fetch nutrition data. Please try again.');
      } finally {
        setFetchingNutritionId(null);
      }
    }
  }, [session?.access_token]);

  // Remove food from added list
  const handleRemoveFood = useCallback((index: number) => {
    setAddedFoods(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Save all meals
  const handleSave = useCallback(async () => {
    if (!session?.access_token || addedFoods.length === 0) return;
    setSaving(true);
    try {
      const meals = addedFoods.map(f => ({
        food: f.food,
        taken_as: mealType,
        serving_size: f.servingSize || null,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        fiber: f.fiber,
      }));
      await dietService.logMealsBatch(session.access_token, meals);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save meals.');
    } finally {
      setSaving(false);
    }
  }, [session?.access_token, addedFoods, mealType, navigation]);

  // Computed totals
  const totals = useMemo(() => {
    return addedFoods.reduce((acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
      fiber: acc.fiber + f.fiber,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, [addedFoods]);

  const totalMacros = totals.protein + totals.carbs + totals.fat;
  const proteinPct = totalMacros > 0 ? Math.round((totals.protein / totalMacros) * 100) : 0;
  const carbsPct = totalMacros > 0 ? Math.round((totals.carbs / totalMacros) * 100) : 0;
  const fatPct = totalMacros > 0 ? Math.round((totals.fat / totalMacros) * 100) : 0;

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
      flexDirection: 'row',
      alignItems: 'center',
    },
    mealTypeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    mealTypeText: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    saveBtn: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      backgroundColor: t.colors.accentBlue,
      borderRadius: Radius.full,
    },
    saveBtnText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: '#fff',
    },
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
      gap: Spacing.base,
    },
    ringContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    macrosContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    macroItem: {
      alignItems: 'center',
    },
    macroPct: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    macroGrams: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
    },
    macroLabel: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    addedFoodsSection: {
      marginTop: Spacing.base,
      borderTopWidth: 1,
      borderTopColor: t.colors.bgCardBorder,
      paddingTop: Spacing.sm,
    },
    addedFoodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    addedFoodName: {
      fontSize: Typography.sm,
      color: t.colors.textPrimary,
      flex: 1,
    },
    addedFoodCals: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      marginRight: Spacing.sm,
    },
    removeBtn: {
      padding: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.bgCard,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.md,
      marginHorizontal: Spacing.base,
      marginTop: Spacing.base,
      paddingHorizontal: Spacing.md,
    },
    searchInput: {
      flex: 1,
      paddingVertical: Spacing.md,
      fontSize: Typography.base,
      color: t.colors.textPrimary,
      marginLeft: Spacing.sm,
    },
    placeholderButtons: {
      marginHorizontal: Spacing.base,
      marginTop: Spacing.base,
      gap: Spacing.sm,
    },
    placeholderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.bgCardSolid,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    placeholderBtnIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderBtnLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: t.colors.textPrimary,
    },
    placeholderBtnDesc: {
      fontSize: Typography.xs,
      color: t.colors.textMuted,
      marginTop: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: Spacing.base,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    sectionTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    sectionAction: {
      fontSize: Typography.xs,
      color: t.colors.textMuted,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    foodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    foodImage: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: t.colors.bgCard,
    },
    foodImagePlaceholder: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: t.colors.bgCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    foodInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    foodName: {
      fontSize: Typography.base,
      fontWeight: Typography.medium,
      color: t.colors.textPrimary,
    },
    foodDetails: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    foodCalories: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      marginRight: Spacing.sm,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.accentBlue + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: Spacing.base,
      marginTop: Spacing.base,
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
    emptyText: {
      fontSize: Typography.sm,
      color: t.colors.textMuted,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
    },
  }));

  const renderFoodItem = useCallback(({ item }: { item: any }) => {
    const isFetching = fetchingNutritionId === item.id;
    return (
      <View style={s.foodRow}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={s.foodImage} />
        ) : (
          <View style={s.foodImagePlaceholder}>
            <Text style={{ fontSize: Typography.lg }}>🍽️</Text>
          </View>
        )}
        <View style={s.foodInfo}>
          <Text style={s.foodName} numberOfLines={1}>{item.title}</Text>
          <Text style={s.foodDetails}>
            {item.calories} cal{item.protein ? ` · ${item.protein}g protein` : ''}
          </Text>
        </View>
        {isFetching ? (
          <ActivityIndicator size="small" color={colors.accentBlue} />
        ) : (
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => handleAddFood({
              title: item.title,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              fiber: item.fiber,
            })}
            activeOpacity={0.7}>
            <Plus size={18} color={colors.accentBlue} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [fetchingNutritionId, colors.accentBlue, handleAddFood, s]);

  const renderRecentItem = useCallback(({ item }: { item: any }) => (
    <View style={s.foodRow}>
      <View style={s.foodImagePlaceholder}>
        <Text style={{ fontSize: Typography.lg }}>🍽️</Text>
      </View>
      <View style={s.foodInfo}>
        <Text style={s.foodName} numberOfLines={1}>{item.title}</Text>
        <Text style={s.foodDetails}>
          {item.calories} cal{item.servingSize ? ` · ${item.servingSize}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={s.addBtn}
        onPress={() => handleAddFood({
          title: item.title,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
          servingSize: item.servingSize,
        })}
        activeOpacity={0.7}>
        <Plus size={18} color={colors.accentBlue} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  ), [colors.accentBlue, handleAddFood, s]);

  const renderHeader = useCallback(() => (
    <View>
      {/* Summary Card */}
      {addedFoods.length > 0 && (
        <View style={s.summaryCard}>
          <View style={s.summaryTop}>
            <View style={s.ringContainer}>
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                borderWidth: 5,
                borderColor: colors.accentBlue,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.textPrimary }}>
                  {totals.calories}
                </Text>
                <Text style={{ fontSize: 9, color: colors.textSecondary }}>cal</Text>
              </View>
            </View>
            <View style={s.macrosContainer}>
              <View style={s.macroItem}>
                <Text style={s.macroPct}>{carbsPct}%</Text>
                <Text style={[s.macroGrams, { color: colors.amber }]}>{totals.carbs}g</Text>
                <Text style={s.macroLabel}>Carbs</Text>
              </View>
              <View style={s.macroItem}>
                <Text style={s.macroPct}>{fatPct}%</Text>
                <Text style={[s.macroGrams, { color: colors.pink }]}>{totals.fat}g</Text>
                <Text style={s.macroLabel}>Fat</Text>
              </View>
              <View style={s.macroItem}>
                <Text style={s.macroPct}>{proteinPct}%</Text>
                <Text style={[s.macroGrams, { color: colors.accentBlue }]}>{totals.protein}g</Text>
                <Text style={s.macroLabel}>Protein</Text>
              </View>
            </View>
          </View>

          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
              <Text style={s.actionBtnText}>Copy from</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
              <Text style={s.actionBtnText}>Copy to</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: colors.accentBlue + '20', borderColor: colors.accentBlue }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.7}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.accentBlue} />
              ) : (
                <Text style={[s.actionBtnText, { color: colors.accentBlue, fontWeight: Typography.bold }]}>Save meal</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Added foods list */}
          <View style={s.addedFoodsSection}>
            {addedFoods.map((f, idx) => (
              <View key={idx} style={s.addedFoodRow}>
                <Text style={s.addedFoodName} numberOfLines={1}>{f.food}</Text>
                <Text style={s.addedFoodCals}>{f.calories} cal</Text>
                <TouchableOpacity style={s.removeBtn} onPress={() => handleRemoveFood(idx)}>
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={s.placeholderButtons}>
        <TouchableOpacity
          style={s.placeholderBtn}
          onPress={() => navigation.navigate('Profile', { initialSection: 'subscriptions' })}
          activeOpacity={0.7}>
          <View style={[s.placeholderBtnIcon, { backgroundColor: 'rgba(107,138,255,0.12)' }]}>
            <Mic size={20} color={colors.accentBlue} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={s.placeholderBtnLabel}>Voice Log</Text>
              <View style={{ marginLeft: 'auto' }}><PremiumBadge compact /></View>
            </View>
            <Text style={s.placeholderBtnDesc}>Speak your meal</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.placeholderBtn}
          onPress={() => navigation.navigate('Profile', { initialSection: 'subscriptions' })}
          activeOpacity={0.7}>
          <View style={[s.placeholderBtnIcon, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
            <Barcode size={20} color="#FBB724" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={s.placeholderBtnLabel}>Scan Barcode</Text>
              <View style={{ marginLeft: 'auto' }}><PremiumBadge compact /></View>
            </View>
            <Text style={s.placeholderBtnDesc}>Scan packaged food</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.placeholderBtn}
          onPress={() => navigation.navigate('Profile', { initialSection: 'subscriptions' })}
          activeOpacity={0.7}>
          <View style={[s.placeholderBtnIcon, { backgroundColor: 'rgba(167,139,250,0.12)' }]}>
            <Camera size={20} color="#A78BFA" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={s.placeholderBtnLabel}>Track with Photo</Text>
              <View style={{ marginLeft: 'auto' }}><PremiumBadge compact /></View>
            </View>
            <Text style={s.placeholderBtnDesc}>AI calorie detection</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Section header */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{searchQuery.length >= 2 ? 'Suggestions' : 'History'}</Text>
        {searchQuery.length >= 2 && searchLoading && <ActivityIndicator size="small" color={colors.accentBlue} />}
        {searchQuery.length < 2 && <Text style={s.sectionAction}>⚙ Most Recent</Text>}
      </View>
    </View>
  ), [
    addedFoods, totals, carbsPct, fatPct, proteinPct, searchLoading,
    colors, saving, handleSave, handleRemoveFood, searchQuery, s,
  ]);

  const listData = useMemo(() => {
    if (searchQuery.length >= 2) return searchResults;
    return recentMeals.map((m, i) => ({
      id: i + 1,
      title: m.food,
      image: null,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      fiber: m.fiber,
      servingSize: m.serving_size || undefined,
    }));
  }, [searchQuery, searchResults, recentMeals]);

  const renderItem = searchQuery.length >= 2 ? renderFoodItem : renderRecentItem;

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={s.header}>
        <BackButton onPress={() => navigation.goBack()} color={colors.textPrimary} />
        <TouchableOpacity style={s.mealTypeBtn} activeOpacity={0.7}>
          <Text style={s.mealTypeText}>
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
          <ChevronDown size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving || addedFoods.length === 0} activeOpacity={0.7}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Text style={s.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar - OUTSIDE FlatList to prevent focus loss */}
      <View style={s.searchContainer}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search for a food"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={listData as any[]}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem as any}
        ListHeaderComponent={renderHeader}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={
          !recentLoading && searchQuery.length >= 2 && !searchLoading ? (
            <Text style={s.emptyText}>No results found</Text>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}
