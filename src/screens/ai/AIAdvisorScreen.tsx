import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import Svg, { Rect, Polyline, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { GlassCardView, SectionHeader, ProfileAvatarButton, NotificationIconButton, LoadingSpinner } from '../../components/SharedComponents';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../providers/AuthProvider';
import { useNotifications } from '../../providers/NotificationContext';
import { getSleepLogs, getWeightLogs, getMoodLogs } from '../../services/healthService';
import type { SleepLog, WeightEntry, MoodLog } from '../../types/health';
import { Search, Scan, Microscope, UtensilsCrossed, Dumbbell } from 'lucide-react-native';

type InsightData = {
  sleep: SleepLog[];
  weight: WeightEntry[];
  mood: MoodLog[];
};

function MiniBarChart({ data, color, maxValue }: { data: number[]; color: string; maxValue: number }) {
  const barWidth = 8;
  const gap = 4;
  const chartHeight = 48;
  const chartWidth = data.length * (barWidth + gap);

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {data.map((val, i) => {
        const barHeight = maxValue > 0 ? (val / maxValue) * chartHeight : 0;
        return (
          <Rect
            key={i}
            x={i * (barWidth + gap)}
            y={chartHeight - barHeight}
            width={barWidth}
            height={barHeight}
            rx={2}
            fill={color}
            opacity={0.3 + (i / data.length) * 0.7}
          />
        );
      })}
    </Svg>
  );
}

function MiniLineChart({ data, color, height = 48 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = data.length * 16;

  const points = data.map((val, i) => {
    const x = i * 16;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Line
        x1={0}
        y1={height}
        x2={width}
        y2={height}
        stroke={color}
        strokeWidth={0.5}
        strokeOpacity={0.2}
      />
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function AIAdvisorScreen({
  onProfilePress,
  onNotificationsPress,
  onOpenChat,
  onOpenOCR,
}: {
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
  onOpenChat?: () => void;
  onOpenOCR?: () => void;
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { setForceHidden, onScroll } = useScrollVisibility();
  const isTabActive = useIsFocused();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [insightData, setInsightData] = useState<InsightData>({ sleep: [], weight: [], mood: [] });
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isTabActive) {
      setForceHidden(false);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [isTabActive, setForceHidden, fadeAnim, slideAnim]);

  const fetchInsights = async () => {
    try {
      const token = session?.access_token || '';
      if (!token) return;
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const startStr = weekAgo.toISOString().split('T')[0];
      const endStr = now.toISOString().split('T')[0];
      const weightStart = twoWeeksAgo.toISOString().split('T')[0];

      const [sleep, weight, mood] = await Promise.all([
        getSleepLogs(token, startStr, endStr).catch(() => []),
        getWeightLogs(token, weightStart, endStr).catch(() => []),
        getMoodLogs(token, startStr, endStr).catch(() => []),
      ]);
      setInsightData({ sleep, weight, mood });
    } catch {
      // silently fail — show empty state
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const { session } = useAuth();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  }, [session]);

  const sleepValues = insightData.sleep.map(s => s.sleep_hr);
  const weightValues = insightData.weight.map(w => w.weight_kg);
  const energyMap: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  const energyValues = insightData.mood.map(m => energyMap[m.energy_level] || 0);

  const avgSleep = sleepValues.length ? (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1) : null;
  const maxSleep = sleepValues.length ? Math.max(...sleepValues) : 8;
  const weightChange = weightValues.length >= 2 ? (weightValues[weightValues.length - 1] - weightValues[0]).toFixed(1) : null;

  const styles = useStyles((theme) => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    greeting: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: theme.colors.textPrimary, letterSpacing: -0.5 },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },

    scroll: { paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl },

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    searchText: {
      flex: 1,
      fontSize: Typography.sm,
      color: theme.colors.textMuted,
    },

    toolsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    toolCard: {
      height: 200,
      padding: Spacing.base,
      marginBottom: Spacing.sm,
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    toolIconWrap: {
      width: 32, height: 32, borderRadius: 8,
      marginBottom: Spacing.sm,
    },
    toolTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    toolSub: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    toolActionText: {
      fontSize: Typography.xs,
      fontWeight: Typography.medium,
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    toolTagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 'auto',
    },
    toolTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.sm,
      backgroundColor: theme.colors.bgCardBorder,
    },
    toolTagText: {
      fontSize: Typography.micro,
      color: theme.colors.textSecondary,
    },
    toolFlexRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    toolMetaText: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.colors.bgCardBorder,
      borderRadius: 2,
      marginBottom: Spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    medRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    medText: {
      fontSize: Typography.xs,
      color: theme.colors.textPrimary,
    },

    insightCard: {
      padding: Spacing.base,
      marginBottom: Spacing.sm,
    },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    insightIcon: {
      width: 32, height: 32, borderRadius: 8,
    },
    insightTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    insightSub: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    chartWrap: {
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    badgeAI: {
      paddingHorizontal: 8, paddingVertical: 2,
      borderRadius: Radius.full,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    badgeAIText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
    },
    emptyInsight: {
      padding: Spacing.xl,
      alignItems: 'center',
    },
    emptyInsightText: {
      fontSize: Typography.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={onScroll} scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.teal, theme.colors.pink]} tintColor={theme.colors.teal} progressBackgroundColor={theme.colors.bgCard} />}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* Header — scrolls with content */}
          <View style={styles.header}>
            <Text style={styles.greeting}>AI Health Advisor</Text>
            <View style={styles.headerActions}>
              <NotificationIconButton onPress={onNotificationsPress} unreadCount={unreadCount} />
              <ProfileAvatarButton
                onPress={onProfilePress}
                userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                avatarUrl={user?.user_metadata?.avatar_url}
              />
            </View>
          </View>
          
          {/* Search Bar — tap to open AI chat */}
          <TouchableOpacity style={styles.searchBar} onPress={onOpenChat} activeOpacity={0.7}>
            <Search size={20} color={theme.colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.searchText}>Ask AI anything...</Text>
          </TouchableOpacity>

          {/* AI TOOLS */}
          <SectionHeader title="AI Tools" />
          <View style={styles.toolsGrid}>
            <TouchableOpacity activeOpacity={0.85} onPress={onOpenOCR} style={{ width: '47%' }}>
              <GlassCardView style={styles.toolCard}>
                <View style={[styles.toolIconWrap, { backgroundColor: theme.colors.accentBlue + '15', alignItems: 'center', justifyContent: 'center' }]}>
                  <Scan size={18} color={theme.colors.accentBlue} strokeWidth={1.8} />
                </View>
                <Text style={styles.toolTitle}>OCR scanner</Text>
                <Text numberOfLines={2} style={styles.toolSub}>Scan prescriptions, reports & lab results</Text>
                <Text style={styles.toolActionText}>Tap to scan or upload</Text>
                <View style={styles.toolTagsRow}>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Prescriptions</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Lab reports</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Insurance</Text></View>
                </View>
              </GlassCardView>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={() => Alert.alert('Coming Soon', 'Health Lens is under development and will be available soon!')} style={{ width: '47%' }}>
              <GlassCardView style={styles.toolCard}>
                <View style={[styles.toolIconWrap, { backgroundColor: theme.colors.pink + '15', alignItems: 'center', justifyContent: 'center' }]}>
                  <Microscope size={18} color={theme.colors.pink} strokeWidth={1.8} />
                </View>
                <Text style={styles.toolTitle}>Health Lens</Text>
                <Text numberOfLines={2} style={styles.toolSub}>AI image analysis for skin, bones, muscles & more</Text>
                <Text style={styles.toolActionText}>Tap to scan or upload</Text>
                <View style={styles.toolTagsRow}>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>X-ray</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Injury</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Skin</Text></View>
                </View>
              </GlassCardView>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={() => Alert.alert('Coming Soon', 'Meal scanner is under development and will be available soon!')} style={{ width: '47%' }}>
              <GlassCardView style={styles.toolCard}>
                <View style={[styles.toolIconWrap, { backgroundColor: theme.colors.teal + '15', alignItems: 'center', justifyContent: 'center' }]}>
                  <UtensilsCrossed size={18} color={theme.colors.teal} strokeWidth={1.8} />
                </View>
                <Text style={styles.toolTitle}>Meal scanner</Text>
                <Text numberOfLines={2} style={styles.toolSub}>AI nutritional analysis from photos</Text>
                <Text style={styles.toolActionText}>Tap to scan or upload</Text>
                <View style={styles.toolTagsRow}>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Calories</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Nutrition</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Diet</Text></View>
                </View>
              </GlassCardView>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={onOpenChat} style={{ width: '47%' }}>
              <GlassCardView style={styles.toolCard}>
                <View style={[styles.toolIconWrap, { backgroundColor: theme.colors.amber + '15', alignItems: 'center', justifyContent: 'center' }]}>
                  <Dumbbell size={18} color={theme.colors.amber} strokeWidth={1.8} />
                </View>
                <Text style={styles.toolTitle}>AI Coach</Text>
                <Text numberOfLines={2} style={styles.toolSub}>Personalized workout, nutrition, sleep & health recommendations</Text>
                <Text style={styles.toolActionText}>Tap to get started</Text>
                <View style={styles.toolTagsRow}>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Workout</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Nutrition</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Sleep</Text></View>
                </View>
              </GlassCardView>
            </TouchableOpacity>
          </View>

          {/* RECENT AI INSIGHTS */}
          <SectionHeader title="Recent AI Insights" />
          {insightsLoading ? (
            <GlassCardView style={styles.emptyInsight}>
              <LoadingSpinner size="small" text="Loading your health insights..." />
            </GlassCardView>
          ) : (
            <>
              {/* Sleep Insight */}
              <GlassCardView style={styles.insightCard}>
                <View style={styles.insightRow}>
                  <View style={[styles.insightIcon, { backgroundColor: theme.colors.accentBlue + '15' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightTitle}>Sleep Pattern</Text>
                    {sleepValues.length > 0 ? (
                      <>
                        <Text style={styles.insightSub}>
                          {avgSleep}h avg over {sleepValues.length} days. {Number(avgSleep) < 7 ? 'Below recommended 7-9 hours.' : 'Within healthy range.'}
                        </Text>
                        <View style={styles.chartWrap}>
                          <MiniBarChart data={sleepValues} color={theme.colors.accentBlue} maxValue={Math.max(maxSleep, 9)} />
                        </View>
                        <View style={[styles.badgeAI, { backgroundColor: theme.colors.accentBlue + '20' }]}>
                          <Text style={[styles.badgeAIText, { color: theme.colors.accentBlue }]}>
                            {Number(avgSleep) < 7 ? 'Needs attention' : 'On track'}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.insightSub}>No sleep data yet. Start logging your sleep to see trends.</Text>
                    )}
                  </View>
                </View>
              </GlassCardView>

              {/* Weight Insight */}
              <GlassCardView style={styles.insightCard}>
                <View style={styles.insightRow}>
                  <View style={[styles.insightIcon, { backgroundColor: theme.colors.teal + '15' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightTitle}>Weight Trend</Text>
                    {weightValues.length >= 2 ? (
                      <>
                        <Text style={styles.insightSub}>
                          {weightChange && Number(weightChange) > 0 ? `+${weightChange}kg` : `${weightChange}kg`} over {weightValues.length} entries. Current: {weightValues[weightValues.length - 1]}kg
                        </Text>
                        <View style={styles.chartWrap}>
                          <MiniLineChart data={weightValues} color={theme.colors.teal} />
                        </View>
                        <View style={[styles.badgeAI, { backgroundColor: theme.colors.teal + '20' }]}>
                          <Text style={[styles.badgeAIText, { color: theme.colors.teal }]}>
                            {Number(weightChange) > 2 ? 'Upward trend' : Number(weightChange) < -2 ? 'Downward trend' : 'Stable'}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.insightSub}>Log weight regularly to see your trend over time.</Text>
                    )}
                  </View>
                </View>
              </GlassCardView>

              {/* Energy/Mood Insight */}
              <GlassCardView style={styles.insightCard}>
                <View style={styles.insightRow}>
                  <View style={[styles.insightIcon, { backgroundColor: theme.colors.pink + '15' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightTitle}>Energy Levels</Text>
                    {energyValues.length > 0 ? (
                      <>
                        <Text style={styles.insightSub}>
                          {energyValues.filter(e => e === 3).length} high, {energyValues.filter(e => e === 2).length} medium, {energyValues.filter(e => e === 1).length} low energy days logged.
                        </Text>
                        <View style={styles.chartWrap}>
                          <MiniBarChart data={energyValues} color={theme.colors.pink} maxValue={3} />
                        </View>
                        <View style={[styles.badgeAI, { backgroundColor: theme.colors.pink + '20' }]}>
                          <Text style={[styles.badgeAIText, { color: theme.colors.pink }]}>
                            {energyValues.filter(e => e === 3).length > energyValues.length / 2 ? 'Mostly high energy' : 'Mixed energy levels'}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.insightSub}>Track your energy to identify patterns and optimize your day.</Text>
                    )}
                  </View>
                </View>
              </GlassCardView>
            </>
          )}

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}
