import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Typography, Spacing, Radius, Colors } from '../../../theme/theme';
import { useStyles } from '../../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../../components/SharedComponents';
import { GlassCardView } from '../../../components/SharedComponents';
import type { LibraryWorkoutPlan } from '../../../data/libraryWorkoutPlans';
import { getLibraryPlans, getLibraryPlanById } from '../../../services/libraryPlanService';
import { useAuth } from '../../../providers/AuthProvider';
import { ChevronRight, Calendar } from 'lucide-react-native';

export default function ExplorePlansScreen({
  onSelectPlan,
  onBack,
}: {
  onSelectPlan: (plan: LibraryWorkoutPlan) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [plans, setPlans] = useState<LibraryWorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingPlanId, setSelectingPlanId] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLibraryPlans(session.access_token);
      setPlans(data);
    } catch (e: any) {
      console.error('[ExplorePlansScreen] fetch error:', e.message);
      setError(e.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSelectPlan = useCallback(async (planId: string) => {
    if (!session?.access_token) return;
    setSelectingPlanId(planId);
    try {
      const fullPlan = await getLibraryPlanById(session.access_token, planId);
      onSelectPlan(fullPlan);
    } catch (e: any) {
      console.error('[ExplorePlansScreen] fetch plan error:', e.message);
    } finally {
      setSelectingPlanId(null);
    }
  }, [session?.access_token, onSelectPlan]);

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
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    planName: {
      fontSize: Typography.xl,
      fontWeight: Typography.extraBold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
      flex: 1,
      marginRight: Spacing.sm,
    },
    daysBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: Radius.full,
      backgroundColor: Colors.amberDim,
      borderWidth: 1,
      borderColor: Colors.amber + '30',
    },
    daysText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: Colors.amber,
    },
    planDescription: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: Spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginBottom: Spacing.md,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: Spacing.md,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
      backgroundColor: 'rgba(107,138,255,0.08)',
      borderColor: 'rgba(107,138,255,0.20)',
    },
    chipText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: '#8B9CC4',
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    exerciseCount: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
    },
    viewPlanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewPlanText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: Colors.amber,
    },
    emptyContainer: {
      paddingVertical: Spacing.xxxl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: Spacing.xxxl,
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.amber} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : plans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No plans available yet</Text>
            </View>
          ) : (
            plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.8}
                onPress={() => handleSelectPlan(plan.id)}
                disabled={selectingPlanId === plan.id}
              >
                <GlassCardView style={styles.planCard}>
                  <View style={styles.topRow}>
                    <Text style={styles.planName}>{plan.plan_name}</Text>
                    <View style={styles.daysBadge}>
                      <Calendar size={12} color={Colors.amber} />
                      <Text style={styles.daysText}>{plan.days_per_week}d / wk</Text>
                    </View>
                  </View>

                  <Text style={styles.planDescription} numberOfLines={2}>
                    {plan.description}
                  </Text>

                  <View style={styles.divider} />

                  <View style={styles.chipRow}>
                    {plan.goal ? (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{plan.goal}</Text>
                      </View>
                    ) : null}
                    {plan.best_for ? (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{plan.best_for}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.bottomRow}>
                    <View style={styles.viewPlanRow}>
                      <Text style={styles.viewPlanText}>View</Text>
                      <ChevronRight size={14} color={Colors.amber} />
                    </View>
                  </View>
                </GlassCardView>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
