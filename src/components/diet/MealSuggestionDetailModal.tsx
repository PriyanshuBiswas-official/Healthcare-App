import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import * as dietService from '../../services/dietService';
import type { MealSuggestion } from '../../types/diet';

type Props = {
  visible: boolean;
  meal: MealSuggestion | null;
  onClose: () => void;
  onLogMeal: (meal: { food: string; calories: number; protein: number; carbs: number; fat: number; fiber: number }) => void;
};

export default function MealSuggestionDetailModal({ visible, meal, onClose, onLogMeal }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { session } = useAuth();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const s = useStyles((t) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: t.colors.overlayHeavy, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: t.colors.modalBg,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      maxHeight: '85%',
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.textMuted, alignSelf: 'center', marginVertical: Spacing.md },
    content: { padding: Spacing.base },
    title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: t.colors.textPrimary, marginBottom: Spacing.sm },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
    metaRow: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.base },
    metaText: { fontSize: Typography.sm, color: t.colors.textSecondary },
    sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: t.colors.textPrimary, marginBottom: Spacing.sm },
    ingredientText: { fontSize: Typography.sm, color: t.colors.textSecondary, marginBottom: 4, lineHeight: 22 },
    logBtn: {
      backgroundColor: t.colors.teal,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: Radius.full,
      alignItems: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.base,
    },
    logBtnText: { fontSize: Typography.sm, color: t.colors.bg, fontWeight: Typography.bold },
  }));

  useEffect(() => {
    if (visible && meal && session?.access_token) {
      setLoading(true);
      dietService.getMealDetail(session.access_token, meal.id)
        .then(setDetail)
        .catch(() => setDetail(null))
        .finally(() => setLoading(false));
    }
  }, [visible, meal?.id]);

  if (!visible || !meal) return null;

  const data = detail || meal;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={s.overlay}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {meal.image ? (
              <Image source={{ uri: meal.image }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
            ) : null}

            <View style={s.content}>
              <Text style={s.title}>{meal.title}</Text>

              <View style={s.tagRow}>
                <View style={{ backgroundColor: colors.teal + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full }}>
                  <Text style={{ fontSize: Typography.sm, color: colors.teal, fontWeight: Typography.bold }}>~{meal.calories} kcal</Text>
                </View>
                <View style={{ backgroundColor: colors.accentBlue + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full }}>
                  <Text style={{ fontSize: Typography.sm, color: colors.accentBlue, fontWeight: Typography.bold }}>{meal.protein}g protein</Text>
                </View>
                <View style={{ backgroundColor: colors.amber + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full }}>
                  <Text style={{ fontSize: Typography.sm, color: colors.amber, fontWeight: Typography.bold }}>{meal.carbs}g carbs</Text>
                </View>
                <View style={{ backgroundColor: colors.pink + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full }}>
                  <Text style={{ fontSize: Typography.sm, color: colors.pink, fontWeight: Typography.bold }}>{meal.fat}g fat</Text>
                </View>
              </View>

              <View style={s.metaRow}>
                {meal.readyInMinutes > 0 && (
                  <Text style={s.metaText}>{meal.readyInMinutes} min</Text>
                )}
                {data.servings > 0 && (
                  <Text style={s.metaText}>{data.servings} servings</Text>
                )}
                {data.healthScore > 0 && (
                  <Text style={s.metaText}>{data.healthScore}% health</Text>
                )}
              </View>

              {meal.diets?.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.base }}>
                  {meal.diets.map((d, i) => (
                    <View key={i} style={{ backgroundColor: colors.bgCardBorder, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full }}>
                      <Text style={{ fontSize: Typography.sm, color: colors.textSecondary }}>{d}</Text>
                    </View>
                  ))}
                </View>
              )}

              {loading ? (
                <ActivityIndicator size="small" color={colors.teal} style={{ marginVertical: Spacing.base }} />
              ) : data.extendedIngredients?.length > 0 ? (
                <View style={{ marginBottom: Spacing.base }}>
                  <Text style={s.sectionTitle}>Ingredients</Text>
                  {data.extendedIngredients.map((ing: any, i: number) => (
                    <Text key={i} style={s.ingredientText}>
                      {ing.original}
                    </Text>
                  ))}
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => {
                  onLogMeal({
                    food: meal.title,
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fat: meal.fat,
                    fiber: meal.fiber,
                  });
                  onClose();
                }}
                style={s.logBtn}>
                <Text style={s.logBtnText}>Log This Meal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
