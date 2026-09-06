import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Typography, Spacing, Radius, Colors } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../../components/SharedComponents';
import { GlassCardView } from '../../../components/SharedComponents';
import { LIBRARY_WORKOUT_PLANS, LibraryWorkoutPlan } from '../../../data/libraryWorkoutPlans';
import { ChevronRight, Target, Clock, Users } from 'lucide-react-native';

export default function ExplorePlansScreen({
  onSelectPlan,
  onBack,
}: {
  onSelectPlan: (plan: LibraryWorkoutPlan) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

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
    headerSubtitle: { fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
    scrollContent: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.lg,
      paddingBottom: insets.bottom + Spacing.xl,
    },
    planCard: {
      padding: Spacing.base,
      marginBottom: Spacing.md,
    },
    planName: {
      fontSize: Typography.xl,
      fontWeight: Typography.extraBold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
      marginBottom: 6,
    },
    planDescription: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: Spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: Spacing.md,
    },
    metaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
      gap: 4,
    },
    metaText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
    },
    viewPlanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    viewPlanText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: theme.colors.teal,
    },
    exerciseCount: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
      marginTop: Spacing.sm,
    },
    emptyContainer: {
      paddingVertical: Spacing.xxxl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} color={Colors.text} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Explore Plans</Text>
          <Text style={styles.headerSubtitle}>Choose a workout plan that fits your goals</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {LIBRARY_WORKOUT_PLANS.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No plans available yet</Text>
          </View>
        ) : (
          LIBRARY_WORKOUT_PLANS.map((plan) => {
            const totalExercises = plan.days.reduce((sum, day) => sum + day.exercises.length, 0);
            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.8}
                onPress={() => onSelectPlan(plan)}
              >
                <GlassCardView style={styles.planCard}>
                  <Text style={styles.planName}>{plan.plan_name}</Text>
                  <Text style={styles.planDescription} numberOfLines={2}>
                    {plan.description}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={[styles.metaPill, { backgroundColor: Colors.teal + '16', borderColor: Colors.teal + '40' }]}>
                      <Clock size={12} color={Colors.teal} />
                      <Text style={[styles.metaText, { color: Colors.teal }]}>
                        {plan.days_per_week} days / week
                      </Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: Colors.accentBlue + '14', borderColor: Colors.accentBlue + '35' }]}>
                      <Target size={12} color={Colors.accentBlue} />
                      <Text style={[styles.metaText, { color: Colors.accentBlue }]}>
                        {plan.goal}
                      </Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: Colors.pink + '14', borderColor: Colors.pink + '35' }]}>
                      <Users size={12} color={Colors.pink} />
                      <Text style={[styles.metaText, { color: Colors.pink }]}>
                        {plan.best_for}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.exerciseCount}>
                    {totalExercises} exercises across {plan.days.length} days
                  </Text>

                  <View style={styles.viewPlanRow}>
                    <Text style={styles.viewPlanText}>View Plan</Text>
                    <ChevronRight size={16} color={Colors.teal} />
                  </View>
                </GlassCardView>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
