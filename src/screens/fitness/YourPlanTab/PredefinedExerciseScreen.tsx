import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Typography, Spacing, Radius, Colors } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../../components/SharedComponents';
import { PREDEFINED_EXERCISES, MUSCLE_GROUP_ICONS } from '../../../data/predefinedExercises';
import type { PredefinedExercise } from '../../../types/activity';

export default function PredefinedExerciseScreen({
  onSelect,
  onBack,
}: {
  onSelect: (exercise: PredefinedExercise) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return PREDEFINED_EXERCISES;
    const q = search.toLowerCase();
    return PREDEFINED_EXERCISES.filter(
      ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.muscle_group.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const groups: Record<string, PredefinedExercise[]> = {};
    for (const ex of filtered) {
      if (!groups[ex.muscle_group]) groups[ex.muscle_group] = [];
      groups[ex.muscle_group].push(ex);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const styles = useStyles((theme: any) => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingTop: insets.top + Spacing.xl,
      paddingBottom: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    searchContainer: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    searchInput: {
      backgroundColor: theme.colors.bgCardSolid,
      color: theme.colors.textPrimary,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm + 2,
      fontSize: Typography.base,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    listContent: {
      paddingBottom: insets.bottom + Spacing.xl,
    },
    groupHeader: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    groupTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: Typography.lsWide,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.bgCardBorder,
    },
    exerciseIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: theme.colors.bgCardSolid,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    exerciseIconText: { fontSize: Typography.lg },
    exerciseInfo: { flex: 1 },
    exerciseName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary },
    exerciseMeta: { fontSize: Typography.xs, color: theme.colors.textSecondary, marginTop: 2 },
    exerciseArrow: { fontSize: Typography.lg, color: theme.colors.textMuted },
    emptyContainer: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
    emptyText: { fontSize: Typography.sm, color: theme.colors.textSecondary },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} color={Colors.text} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Select Exercise</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor={Colors.textMuted}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={grouped}
        keyExtractor={([group]) => group}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercises found</Text>
          </View>
        }
        renderItem={({ item: [group, exercises] }) => (
          <>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{group}</Text>
            </View>
            {exercises.map(ex => (
              <TouchableOpacity
                key={ex.id}
                style={styles.exerciseRow}
                onPress={() => onSelect(ex)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseIcon}>
                  <Text style={styles.exerciseIconText}>
                    {MUSCLE_GROUP_ICONS[ex.muscle_group] || '🏋️'}
                  </Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {ex.equipment === 'None' ? 'No equipment' : ex.equipment} · {ex.exercise_type}
                  </Text>
                </View>
                <Text style={styles.exerciseArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      />
    </View>
  );
}
