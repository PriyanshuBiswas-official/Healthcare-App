import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  PanResponder,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, GlassCard, Shadows } from '../../theme/theme';
import { GlassCardView, SectionHeader, ProfileAvatarButton, NotificationIconButton, ProgressBar } from '../../components/SharedComponents';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import ProfileCompletionBanner from '../../components/ProfileCompletionBanner';
import { useAuth } from '../../providers/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import { SleepTrackerSection, VitalsDashboardSection } from '../health/HealthCommonSections';
import { getSleepLogs, getWeightLogs, saveWeightLog } from '../../services/healthService';
import { getMealsForDate, getWaterForDate, getCalorieGoal, logMeal, logWater, getWaterChallenge } from '../../services/dietService';
import { getTodaySummary, getActivityGoal } from '../../services/activityService';
import type { SleepLog, WeightEntry } from '../../types/health';
import type { DayMealsResponse, DayWaterResponse, NutritionGoal, MealType, WaterChallenge } from '../../types/diet';
import type { ActivitySummary, ActivityGoal } from '../../types/activity';
import type { TabName } from '../../navigation/TabBar';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Custom SVG Ring for Hero
const HeroScoreRing = ({ score }: { score: number }) => {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.teal} />
            <Stop offset="1" stopColor={Colors.purple} />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.bgCardBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#heroGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: Typography.xl, fontWeight: Typography.extraBold, color: Colors.white, lineHeight: 28 }}>{score}</Text>
        <Text style={{ fontSize: Typography.xs, color: Colors.textMuted }}>/100</Text>
      </View>
    </View>
  );
};

// Compact SVG Ring
const CompactRing = ({ size, progress, color, children }: any) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.bgCardBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
        {children}
      </View>
    </View>
  );
};

export default function DashboardScreen({ onProfilePress, onNotificationsPress, onCompleteProfile, navigateToTab }: { onProfilePress?: () => void; onNotificationsPress?: () => void; onCompleteProfile?: () => void; navigateToTab?: (tab: TabName) => void }) {
  const { onScroll } = useScrollVisibility();
  const { user, session, profileCompletion, gender } = useAuth();
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const heroHeightRef = useRef(0);
  
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date>(new Date());
  const [calendarCurrentMonth, setCalendarCurrentMonth] = useState<Date>(new Date());
  const [calendarExpanded, setCalendarExpanded] = useState<boolean>(true);

  // Swipe gesture to change months
  const calendarSwipe = useRef({ startX: 0 }).current;
  const calendarPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (_, g) => { calendarSwipe.startX = g.x0; },
      onPanResponderRelease: (_, g) => {
        const dx = g.dx;
        if (Math.abs(dx) > 50) {
          const direction = dx < 0 ? 1 : -1;
          setCalendarCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
        }
      },
    })
  ).current;

  // Dynamic status bar color on scroll
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScroll(e);
    const y = e.nativeEvent.contentOffset.y;
    if (y >= heroHeightRef.current - 80) {
      StatusBar.setBackgroundColor(Colors.bg, false);
    } else {
      StatusBar.setBackgroundColor(Colors.bgHero, false);
    }
  }, [onScroll]);

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    const prevNumDays = new Date(year, month, 0).getDate();
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevNumDays - i),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= numDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }
    }
    return days;
  }, []);

  const getWeekDays = useCallback((date: Date) => {
    const currentDay = date.getDay();
    const sunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - currentDay);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
      days.push({
        date: d,
        isCurrentMonth: d.getMonth() === date.getMonth(),
      });
    }
    return days;
  }, []);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightEntry[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [mealsData, setMealsData] = useState<DayMealsResponse | null>(null);
  const [waterData, setWaterData] = useState<DayWaterResponse | null>(null);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [activityGoal, setActivityGoal] = useState<ActivityGoal | null>(null);
  const [waterChallenge, setWaterChallenge] = useState<WaterChallenge | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);
  const [mealFood, setMealFood] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [mealFiber, setMealFiber] = useState('');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [waterAmount, setWaterAmount] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, [fadeAnim, slideAnim]);

  const loadData = () => {
    if (session?.access_token) {
      const today = new Date().toISOString().split('T')[0];

      getSleepLogs(session.access_token)
        .then(setSleepLogs)
        .catch(err => console.warn('Failed to load sleep logs on Dashboard:', err));
        
      getWeightLogs(session.access_token)
        .then(setWeightLogs)
        .catch(err => console.warn('Failed to load weight logs on Dashboard:', err));

      getMealsForDate(session.access_token, today)
        .then(setMealsData)
        .catch(err => console.warn('Failed to load meals on Dashboard:', err));

      getWaterForDate(session.access_token, today)
        .then(setWaterData)
        .catch(err => console.warn('Failed to load water on Dashboard:', err));

      getCalorieGoal(session.access_token)
        .then(setNutritionGoal)
        .catch(err => console.warn('Failed to load nutrition goal on Dashboard:', err));

      getTodaySummary(session.access_token, today)
        .then(setActivitySummary)
        .catch(err => console.warn('Failed to load activity summary on Dashboard:', err));

      getActivityGoal(session.access_token)
        .then(setActivityGoal)
        .catch(err => console.warn('Failed to load activity goal on Dashboard:', err));

      getWaterChallenge(session.access_token, 5)
        .then(setWaterChallenge)
        .catch(err => console.warn('Failed to load water challenge on Dashboard:', err));
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!session?.access_token) return;
    setRefreshing(true);
    const today = new Date().toISOString().split('T')[0];
    await Promise.allSettled([
      getSleepLogs(session.access_token).then(setSleepLogs),
      getWeightLogs(session.access_token).then(setWeightLogs),
      getMealsForDate(session.access_token, today).then(setMealsData),
      getWaterForDate(session.access_token, today).then(setWaterData),
      getCalorieGoal(session.access_token).then(setNutritionGoal),
      getTodaySummary(session.access_token, today).then(setActivitySummary),
      getActivityGoal(session.access_token).then(setActivityGoal),
      getWaterChallenge(session.access_token, 5).then(setWaterChallenge),
    ]);
    setRefreshing(false);
  }, [session?.access_token]);

  useEffect(() => {
    loadData();
  }, [session]);

  const percentage = profileCompletion?.percentage ?? 0;
  const isComplete = profileCompletion?.completed ?? false;
  const showBanner = !bannerDismissed && !isComplete;

  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Next dose calculations
  const getNextDoseHours = (targetHour: number) => {
    let diff = targetHour - currentHour;
    if (diff < 0) diff += 24;
    return diff;
  };

  const handleSaveWeight = async () => {
    const parsed = parseFloat(weightInput);
    if (!parsed || isNaN(parsed) || !session?.access_token) return;
    try {
      await saveWeightLog(session.access_token, { weight_kg: parsed });
      setShowWeightModal(false);
      setWeightInput('');
      loadData();
    } catch (e) {
      console.warn('Failed to save weight:', e);
    }
  };

  const handleSaveMeal = async () => {
    if (!session?.access_token || !mealFood.trim()) return;
    setModalSaving(true);
    try {
      await logMeal(session.access_token, {
        food: mealFood.trim(),
        taken_as: mealType,
        calories: parseInt(mealCalories, 10) || 0,
        protein: parseInt(mealProtein, 10) || 0,
        carbs: parseInt(mealCarbs, 10) || 0,
        fat: parseInt(mealFat, 10) || 0,
        fiber: parseInt(mealFiber, 10) || 0,
      });
      setShowMealModal(false);
      setMealFood('');
      setMealCalories('');
      setMealProtein('');
      setMealCarbs('');
      setMealFat('');
      setMealFiber('');
      setMealType('breakfast');
      loadData();
    } catch (e) {
      console.warn('Failed to save meal:', e);
    } finally {
      setModalSaving(false);
    }
  };

  const handleSaveWater = async () => {
    const parsed = parseInt(waterAmount, 10);
    if (!parsed || parsed <= 0 || !session?.access_token) return;
    setModalSaving(true);
    try {
      await logWater(session.access_token, parsed);
      setShowWaterModal(false);
      setWaterAmount('');
      loadData();
    } catch (e) {
      console.warn('Failed to save water:', e);
    } finally {
      setModalSaving(false);
    }
  };

  // Rendering weight trend sparkline
  const sparklineElement = useMemo(() => {
    if (weightLogs.length < 2) {
      return (
        <View style={styles.sparklinePlaceholder}>
          <Text style={{ color: Colors.textMuted, fontSize: Typography.xs }}>Not enough weight data to show trend</Text>
        </View>
      );
    }

    const width = SCREEN_WIDTH - 64;
    const height = 80;
    const padding = 10;
    
    const weights = weightLogs.map(w => w.weight_kg);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const range = maxW - minW || 1;

    const points = weightLogs.map((entry, idx) => {
      const x = padding + (idx / (weightLogs.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((entry.weight_kg - minW) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;

    return (
      <View style={{ height, width, marginTop: Spacing.sm }}>
        <Svg width={width} height={height}>
          <Defs>
            <SvgLinearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.teal} stopOpacity="0.3" />
              <Stop offset="1" stopColor={Colors.teal} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d={pathData}
            fill="none"
            stroke={Colors.teal}
            strokeWidth={3}
          />
          <Path
            d={`${pathData} L ${width - padding},${height} L ${padding},${height} Z`}
            fill="url(#weightGrad)"
          />
        </Svg>
      </View>
    );
  }, [weightLogs]);

  return (
    <View style={styles.root}>
      {/* ─── SCROLLABLE CONTENT ─── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={handleScroll} scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.teal, Colors.pink]} tintColor={Colors.teal} progressBackgroundColor={Colors.bgCard} />}>

        {/* ─── HERO SURFACE — extends from the very top ─── */}
        <Animated.View style={[styles.heroSurface, { marginTop: -insets.top, paddingTop: insets.top, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          onLayout={(e) => { heroHeightRef.current = e.nativeEvent.layout.height; }}>

          {/* ── Greeting + Notifications ── */}
          <View style={styles.heroTopBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroDate}>{todayDateStr}</Text>
              <Text style={styles.heroGreeting} numberOfLines={1}>
                Hi, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'} 👋
              </Text>
            </View>
            <View style={styles.heroTopBarActions}>
              <NotificationIconButton onPress={onNotificationsPress} />
              <ProfileAvatarButton
                onPress={onProfilePress}
                userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                avatarUrl={user?.user_metadata?.avatar_url}
              />
            </View>
          </View>

          {/* ── Health Score + Overview ── */}
          <View style={styles.heroOverviewRow}>
            <View style={styles.heroScoreArea}>
              <HeroScoreRing score={86} />
            </View>
            <View style={styles.heroOverviewText}>
              <Text style={styles.heroOverviewLabel}>Health Record Overview</Text>
              <Text style={styles.heroOverviewSub}>Showing data from {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
              <TouchableOpacity style={styles.heroReportBtn}>
                <Text style={styles.heroReportBtnText}>Full Report →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── AI Summary ── */}
          <View style={styles.heroAiInset}>
            <View style={styles.heroAiHeader}>
              <View style={styles.heroAiTitleRow}>
                <Text style={styles.heroAiSparkle}>✦</Text>
                <Text style={styles.heroAiTitle}>AI HEALTH SUMMARY</Text>
              </View>
              <TouchableOpacity style={styles.heroAiChatBtn}>
                <Text style={styles.heroAiChatText}>💬 Chat</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroAiText}>
              Vitals stable. Sleep +12% vs last week. Light activity advised today — cortisol elevated from yesterday's session.
            </Text>
            <View style={styles.heroAiTagRow}>
              {[
                { label: '● Vitals stable', color: Colors.success },
                { label: '● Sleep +12%',    color: Colors.purple },
                { label: '● Rest advised',  color: Colors.amber },
              ].map((tag, i) => (
                <View key={i} style={[styles.heroAiTag, { backgroundColor: tag.color + '15', borderColor: tag.color + '40' }]}>
                  <Text style={[styles.heroAiTagText, { color: tag.color }]}>{tag.label}</Text>
                </View>
              ))}
            </View>
          </View>

        </Animated.View>

        {showBanner && (
          <ProfileCompletionBanner
            percentage={percentage}
            onSkip={() => setBannerDismissed(true)}
            onComplete={() => onCompleteProfile?.()}
          />
        )}



        {/* SECTION: COLLAPSIBLE MONTHLY CALENDAR */}
        <TouchableOpacity style={styles.calendarSectionHeader} onPress={() => setCalendarExpanded(!calendarExpanded)} activeOpacity={0.7}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Health Calendar</Text>
            <Text style={styles.sectionSubtitle}>Your schedule at a glance</Text>
          </View>
          <View style={styles.calendarTogglePill}>
            <Text style={styles.calendarToggleLabel}>{calendarExpanded ? 'Week' : 'Month'}</Text>
            <Text style={styles.calendarToggleChevron}>{calendarExpanded ? '▾' : '▴'}</Text>
          </View>
        </TouchableOpacity>
        {(() => {
          const isSameDay = (d1: Date, d2: Date) => 
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

          const today = new Date();
          const displayedDays = calendarExpanded 
            ? getDaysInMonth(calendarCurrentMonth) 
            : getWeekDays(calendarSelectedDate);

          const monthYearString = calendarCurrentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

          const getEventsForDate = (date: Date, isCurrentMonth: boolean) => {
            // Hide event indicators/agendas for padding days from other months when expanded
            if (calendarExpanded && !isCurrentMonth) {
              return [];
            }

            const list = [];
            const dayNum = date.getDate();
            const monthNum = date.getMonth();
            const dayOfWeek = date.getDay();

            // Period prediction (predicted cycle: 12th to 16th of current month)
            if (gender === 'female' && dayNum >= 12 && dayNum <= 16) {
              list.push({ type: 'period', icon: '🩸', label: 'Menstrual Period Day' });
            }

            // Doctor visit mock
            if (dayNum === 7 || (dayNum === 12 && monthNum === 4)) {
              list.push({ type: 'appointment', icon: '👨‍⚕️', label: 'Doctor Appointment: Dr. Sharma at 04:30 PM' });
            } else if (dayNum === 22) {
              list.push({ type: 'appointment', icon: '🦷', label: 'Dentist Checkup at 10:00 AM' });
            }

            // Workout split schedule
            if (dayOfWeek === 1 || dayOfWeek === 4) {
              list.push({ type: 'workout', icon: '💪', label: 'Workout: Push Day Split' });
            } else if (dayOfWeek === 2 || dayOfWeek === 5) {
              list.push({ type: 'workout', icon: '🏃‍♂️', label: 'Workout: Pull Day Split' });
            } else if (dayOfWeek === 3 || dayOfWeek === 6) {
              list.push({ type: 'workout', icon: '🦵', label: 'Workout: Legs Day Split' });
            } else {
              list.push({ type: 'workout', icon: '🧘', label: 'Active Recovery & Stretching' });
            }

            // Med schedule
            list.push({ type: 'medication', icon: '💊', label: 'Vitamin D3 (08:00 AM) & Metformin (08:00 PM)' });

            return list;
          };

          const selectedEvents = getEventsForDate(calendarSelectedDate, true);

          return (
            <View style={styles.calendarContainer}>
              {/* Swipeable area */}
              <View {...calendarPanResponder.panHandlers}>
                <View style={styles.calendarHeader}>
                  <View>
                    <Text style={styles.calendarMonthYear}>
                      {calendarCurrentMonth.toLocaleString('en-US', { month: 'long' })}
                    </Text>
                    <Text style={styles.calendarYearSub}>
                      {calendarCurrentMonth.getFullYear()}
                    </Text>
                  </View>

                  {calendarExpanded && (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={styles.calendarNavBtn}
                        onPress={() => {
                          const prev = new Date(calendarCurrentMonth.getFullYear(), calendarCurrentMonth.getMonth() - 1, 1);
                          setCalendarCurrentMonth(prev);
                        }}
                      >
                        <Text style={styles.calendarNavBtnText}>‹</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.calendarNavBtn}
                        onPress={() => {
                          const next = new Date(calendarCurrentMonth.getFullYear(), calendarCurrentMonth.getMonth() + 1, 1);
                          setCalendarCurrentMonth(next);
                        }}
                      >
                        <Text style={styles.calendarNavBtnText}>›</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

              <View style={styles.calendarWeekdayRow}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
                  <Text key={idx} style={styles.calendarWeekdayText}>{day}</Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {displayedDays.map((item, idx) => {
                  const isSelected = isSameDay(item.date, calendarSelectedDate);
                  const isTodayDate = isSameDay(item.date, today);
                  const dayEvents = getEventsForDate(item.date, item.isCurrentMonth);

                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.calendarDayCell}
                      activeOpacity={0.7}
                      onPress={() => {
                        setCalendarSelectedDate(item.date);
                        if (item.date.getMonth() !== calendarCurrentMonth.getMonth()) {
                          setCalendarCurrentMonth(new Date(item.date.getFullYear(), item.date.getMonth(), 1));
                        }
                      }}
                    >
                      <View style={[
                        styles.calendarDayCircle,
                        isTodayDate && styles.calendarTodayCircle,
                        isSelected && styles.calendarSelectedCircle,
                      ]}>
                        <Text style={[
                          styles.calendarDayNumber,
                          !item.isCurrentMonth && styles.calendarOtherMonthNumber,
                          isSelected && styles.calendarSelectedNumber,
                        ]}>
                          {item.date.getDate()}
                        </Text>

                        {item.isCurrentMonth && (
                          <View style={styles.calendarIndicatorContainer}>
                            {dayEvents.slice(0, 3).map((evt, eIdx) => {
                              let dotColor = Colors.teal;
                              if (evt.type === 'period') dotColor = Colors.pink;
                              else if (evt.type === 'appointment') dotColor = Colors.blue;
                              else if (evt.type === 'medication') dotColor = Colors.amber;
                              
                              return (
                                <View 
                                  key={eIdx} 
                                  style={[styles.calendarDot, { backgroundColor: dotColor }]} 
                                />
                              );
                            })}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              </View>
            </View>
          );
        })()}

        {/* SECTION: TODAY'S AGENDA */}
        <SectionHeader
          title={`Agenda — ${calendarSelectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
        />
        <GlassCardView style={styles.agendaCard}>
          {(() => {
            const isSameDay = (d1: Date, d2: Date) =>
              d1.getFullYear() === d2.getFullYear() &&
              d1.getMonth() === d2.getMonth() &&
              d1.getDate() === d2.getDate();

            const today = new Date();
            const agendaEvents: { icon: string; label: string; time: string; type: string }[] = [];

            if (gender === 'female') {
              const periodStart = new Date(today.getFullYear(), today.getMonth(), 3);
              const daysInCycle = 5;
              for (let d = 0; d < daysInCycle; d++) {
                const day = new Date(periodStart);
                day.setDate(periodStart.getDate() + d);
                if (isSameDay(day, calendarSelectedDate)) {
                  agendaEvents.push({ icon: '🩸', label: 'Period Day', time: 'All day', type: 'period' });
                }
              }
            }

            const workoutDays = [1, 3, 5];
            if (workoutDays.includes(calendarSelectedDate.getDay())) {
              agendaEvents.push({ icon: '💪', label: 'Workout Day', time: '07:00 AM', type: 'workout' });
            }

            if (calendarSelectedDate.getDate() % 14 === 0) {
              agendaEvents.push({ icon: '🩺', label: 'Dr. Sharma — Cardiology', time: '10:30 AM', type: 'appointment' });
            }

            agendaEvents.push({ icon: '💊', label: 'Vitamin D3 1000 IU', time: '08:00 AM', type: 'medication' });
            agendaEvents.push({ icon: '💊', label: 'Metformin 500 mg', time: '08:00 PM', type: 'medication' });

            const typeConfig: Record<string, { accentColor: string; badge: string }> = {
              period:      { accentColor: Colors.pink,   badge: 'Period' },
              appointment: { accentColor: Colors.blue,     badge: 'Appointment' },
              workout:     { accentColor: Colors.teal,   badge: 'Workout' },
              medication:  { accentColor: Colors.textMuted, badge: 'Medication' },
            };

            if (agendaEvents.length === 0) {
              return (
                <View style={styles.agendaEmpty}>
                  <Text style={styles.agendaEmptyIcon}>📅</Text>
                  <Text style={styles.agendaEmptyText}>Nothing scheduled</Text>
                  <Text style={styles.agendaEmptySubtext}>Enjoy your free day</Text>
                </View>
              );
            }

            return (
              <View style={{ gap: Spacing.xs }}>
                {agendaEvents.map((evt, idx) => {
                  const cfg = typeConfig[evt.type] ?? typeConfig.medication;
                  return (
                    <View key={idx} style={styles.agendaEventRow}>
                      <View style={[styles.agendaEventAccentDot, { backgroundColor: cfg.accentColor }]} />
                      <View style={styles.agendaEventIconWrap}>
                        <Text style={styles.agendaEventIcon}>{evt.icon}</Text>
                      </View>
                      <View style={styles.agendaEventInfo}>
                        <Text style={styles.agendaEventLabel}>{evt.label}</Text>
                        <Text style={styles.agendaEventTime}>{evt.time}</Text>
                      </View>
                      <View style={styles.agendaEventBadge}>
                        <Text style={styles.agendaEventBadgeText}>{cfg.badge}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        </GlassCardView>

        {/* SECTION: REDESIGNED QUICK ACTIONS */}
        <SectionHeader title="Quick Actions" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionScroll}>
          {[
            { icon: '🍽️', label: 'Log Meal', desc: 'Record calories', color: Colors.amber, onPress: () => setShowMealModal(true) },
            { icon: '💧', label: 'Log Water', desc: 'Add a glass', color: Colors.blue, onPress: () => setShowWaterModal(true) },
            { icon: '💪', label: 'Log Workout', desc: 'Track activity', color: Colors.purple, onPress: () => navigateToTab?.('Activity') },
            { icon: '💊', label: 'Medicine', desc: 'Check dose', color: Colors.pink, onPress: () => setShowMedModal(true) },
            { icon: '⚖️', label: 'Log Weight', desc: 'Record metric', color: Colors.teal, onPress: () => setShowWeightModal(true) },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.quickActionCard} onPress={action.onPress}>
              <View style={[styles.quickActionIconBg, { backgroundColor: action.color + '15', borderColor: action.color + '30' }]}>
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
              </View>
              <View style={styles.quickActionTextContent}>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionDesc}>{action.desc}</Text>
              </View>
              <Text style={[styles.quickActionPlus, { color: action.color }]}>+</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SECTION: DAILY HEALTH TIMELINE */}
        <SectionHeader title="Health Timeline" subtitle="Your day at a glance" action="View All" />
        <View style={styles.newTimelineContainer}>
          <View style={styles.newTimelineLine} />
          {[
            { time: '08:00 AM', title: 'Medication', sub: 'Vitamin D3 1000 IU', icon: '💊', color: Colors.purple, rightText: '✓ Taken', rightType: 'taken' },
            { time: '09:15 AM', title: 'Water', sub: '400 ml recorded', icon: '💧', color: Colors.blue, rightText: '400 ml', rightType: 'value' },
            { time: '10:00 AM', title: 'Breakfast', sub: 'Oats with fruits, Almonds', icon: '🍽️', color: Colors.amber, rightText: '450 kcal', rightType: 'value' },
            { time: '12:00 PM', title: 'Steps', sub: '2,350 steps', icon: '👟', color: Colors.success, rightText: '2,350', rightType: 'value' },
            { time: '04:30 PM', title: 'Workout', sub: 'Strength Training', icon: '💪', color: Colors.pink, rightText: '45 min', rightType: 'value' },
            { time: '08:00 PM', title: 'Medication (Upcoming)', sub: 'Metformin 500 mg', icon: '💊', color: Colors.amber, rightText: `${getNextDoseHours(20)}h ${60 - new Date().getMinutes()}m`, rightType: 'countdown' },
            { time: '10:30 PM', title: 'Sleep Goal', sub: 'Target: 8 hrs', icon: '🌙', color: Colors.purple, rightText: 'Upcoming', rightType: 'upcoming' },
          ].map((item, index) => (
            <View key={index} style={styles.newTimelineRow}>
              {/* Left circular icon */}
              <View style={[styles.newTimelineIconBg, { backgroundColor: item.color + '15', borderColor: item.color + '30' }]}>
                <Text style={styles.newTimelineCardIcon}>{item.icon}</Text>
              </View>
              
              {/* Vertical line node */}
              <View style={styles.newTimelineNodeContainer}>
                <View style={[styles.newTimelineNode, { backgroundColor: item.color }]} />
              </View>

              {/* Content */}
              <View style={styles.newTimelineContent}>
                <Text style={[styles.newTimelineTime, { color: item.color }]}>{item.time}</Text>
                <Text style={styles.newTimelineTitle}>{item.title}</Text>
                <Text style={styles.newTimelineSub}>{item.sub}</Text>
              </View>

              {/* Right side Badge */}
              <View style={styles.newTimelineRight}>
                {item.rightType === 'taken' && (
                  <View style={styles.badgeTaken}>
                    <Text style={styles.badgeTakenText}>{item.rightText}</Text>
                  </View>
                )}
                {item.rightType === 'value' && (
                  <Text style={[styles.badgeValueText, { color: item.color }]}>{item.rightText}</Text>
                )}
                {item.rightType === 'countdown' && (
                  <View style={styles.badgeCountdown}>
                    <Text style={styles.badgeCountdownText}>🕒 {item.rightText}</Text>
                  </View>
                )}
                {item.rightType === 'upcoming' && (
                  <View style={styles.badgeUpcoming}>
                    <Text style={styles.badgeUpcomingText}>{item.rightText}</Text>
                  </View>
                )}
                <Text style={styles.newTimelineChevron}>❯</Text>
              </View>
            </View>
          ))}
        </View>

        {/* SECTION: TODAY'S PROGRESS */}
        <SectionHeader title="Today's Progress" />
        <View style={styles.progressGrid}>
          {(() => {
            const calorieTarget = nutritionGoal?.calorie_goal ?? 2500;
            const consumedCal = mealsData?.totals.calories ?? 0;
            const calPct = calorieTarget > 0 ? Math.min(consumedCal / calorieTarget, 1) : 0;

            const waterTarget = nutritionGoal?.water_goal ?? 2500;
            const consumedWater = waterData?.total_ml ?? 0;
            const waterPct = waterTarget > 0 ? Math.min(consumedWater / waterTarget, 1) : 0;

            const todayStr = new Date().toISOString().split('T')[0];
            const todaySleep = sleepLogs.find(s => s.date === todayStr);
            const sleepHrs = todaySleep?.sleep_hr ?? 0;
            const sleepTarget = 8;
            const sleepPct = sleepTarget > 0 ? Math.min(sleepHrs / sleepTarget, 1) : 0;

            const exerciseTarget = activityGoal?.exercise_min_goal ?? 45;
            const exerciseMin = activitySummary?.exercise_minutes ?? 0;
            const exercisePct = exerciseTarget > 0 ? Math.min(exerciseMin / exerciseTarget, 1) : 0;

            return (
              <>
                <TouchableOpacity style={styles.progressCard} activeOpacity={0.7} onPress={() => navigateToTab?.('Diet')}>
                  <GlassCardView style={{ padding: Spacing.md, alignItems: 'center' }}>
                    <Text style={styles.progressCardTitle}>🔥 Calories</Text>
                    <CompactRing size={82} progress={calPct} color={Colors.amber}>
                      <Text style={styles.progressVal}>{consumedCal.toLocaleString()}</Text>
                      <Text style={styles.progressSub}>/ {calorieTarget.toLocaleString()} kcal</Text>
                    </CompactRing>
                    <Text style={[styles.progressPct, { color: Colors.amber }]}>{Math.round(calPct * 100)}%</Text>
                  </GlassCardView>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.progressCard} activeOpacity={0.7} onPress={() => navigateToTab?.('Diet')}>
                  <GlassCardView style={{ padding: Spacing.md, alignItems: 'center' }}>
                    <Text style={styles.progressCardTitle}>💧 Water</Text>
                    <CompactRing size={82} progress={waterPct} color={Colors.blue}>
                      <Text style={styles.progressVal}>{consumedWater.toLocaleString()}</Text>
                      <Text style={styles.progressSub}>/ {waterTarget.toLocaleString()} ml</Text>
                    </CompactRing>
                    <Text style={[styles.progressPct, { color: Colors.blue }]}>{Math.round(waterPct * 100)}%</Text>
                  </GlassCardView>
                </TouchableOpacity>

                <TouchableOpacity style={styles.progressCard} activeOpacity={0.7} onPress={() => navigateToTab?.('Health')}>
                  <GlassCardView style={{ padding: Spacing.md, alignItems: 'center' }}>
                    <Text style={styles.progressCardTitle}>🌙 Sleep</Text>
                    <CompactRing size={82} progress={sleepPct} color={Colors.purple}>
                      <Text style={styles.progressVal}>{sleepHrs > 0 ? sleepHrs : '—'}</Text>
                      <Text style={styles.progressSub}>/ {sleepTarget} hrs</Text>
                    </CompactRing>
                    <Text style={[styles.progressPct, { color: Colors.purple }]}>{sleepHrs > 0 ? `${Math.round(sleepPct * 100)}%` : '—'}</Text>
                  </GlassCardView>
                </TouchableOpacity>

                <TouchableOpacity style={styles.progressCard} activeOpacity={0.7} onPress={() => navigateToTab?.('Activity')}>
                  <GlassCardView style={{ padding: Spacing.md, alignItems: 'center' }}>
                    <Text style={styles.progressCardTitle}>💪 Workout</Text>
                    <CompactRing size={82} progress={exercisePct} color={Colors.teal}>
                      <Text style={styles.progressVal}>{exerciseMin}</Text>
                      <Text style={styles.progressSub}>/ {exerciseTarget} min</Text>
                    </CompactRing>
                    <Text style={[styles.progressPct, { color: Colors.teal }]}>{Math.round(exercisePct * 100)}%</Text>
                  </GlassCardView>
                </TouchableOpacity>
              </>
            );
          })()}
        </View>

        {/* SECTION: TODAY'S MEDICATIONS */}
        <SectionHeader title="Today's Medications" action="View All →" />
        <GlassCardView style={styles.medsCard}>
          <View style={styles.medRow}>
            <View style={styles.medIconCheck}><Text style={{ color: Colors.bg, fontSize: Typography.xs, fontWeight: Typography.bold }}>✓</Text></View>
            <View style={styles.medInfo}>
              <Text style={styles.medName}>Vitamin D3</Text>
              <Text style={styles.medDose}>1000 IU · Done</Text>
            </View>
            <Text style={styles.medTime}>08:00 AM</Text>
          </View>
          <View style={[styles.medRow, { borderBottomWidth: 0, marginBottom: Spacing.md }]}>
            <View style={styles.medIconPending} />
            <View style={styles.medInfo}>
              <Text style={styles.medName}>Metformin</Text>
              <Text style={styles.medDose}>500 mg · Next dose in {getNextDoseHours(20)} hrs</Text>
            </View>
            <Text style={styles.medTime}>08:00 PM</Text>
          </View>
          <TouchableOpacity style={styles.medActionBtn}>
            <Text style={styles.medActionText}>✓ Mark All as Taken</Text>
          </TouchableOpacity>
        </GlassCardView>

        {/* SECTION: WEIGHT TRACKING */}
        <SectionHeader title="Weight Progress" action="Log Weight" onAction={() => setShowWeightModal(true)} />
        <GlassCardView style={styles.weightCard}>
          <View style={styles.weightHeader}>
            <View>
              <Text style={styles.weightVal}>
                {weightLogs.length > 0 ? `${weightLogs[weightLogs.length - 1].weight_kg} kg` : '-- kg'}
              </Text>
              <Text style={styles.weightSub}>Current weight</Text>
            </View>
            {weightLogs.length > 1 && (
              <View style={[styles.weightTrendBadge, { backgroundColor: Colors.success + '15' }]}>
                <Text style={{ color: Colors.success, fontSize: Typography.xs, fontWeight: Typography.bold }}>
                  {weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg <= 0 ? '↓' : '↑'}{' '}
                  {Math.abs(weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg).toFixed(1)} kg
                </Text>
              </View>
            )}
          </View>
          {sparklineElement}
        </GlassCardView>

        {/* SECTION: TODAY'S VITALS */}
        <VitalsDashboardSection />

        {/* SECTION: SLEEP TRACKER */}
        <SleepTrackerSection sleepLogs={sleepLogs} />

        {/* SECTION: NEXT APPOINTMENT */}
        <SectionHeader title="Next Appointment" />
        <GlassCardView style={styles.aptCard}>
          <View style={styles.aptRow}>
            <View style={styles.aptAvatar}><Text style={{ fontSize: Typography.xl }}>👨‍⚕️</Text></View>
            <View style={styles.aptInfo}>
              <Text style={styles.aptName}>Dr. Sharma</Text>
              <Text style={styles.aptSpec}>General Physician</Text>
              <View style={styles.aptTimeBadge}>
                <Text style={styles.aptTimeIcon}>📅</Text>
                <Text style={styles.aptTimeText}>Tomorrow, 12 May · 04:30 PM</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.aptBtn}>
            <Text style={styles.aptBtnText}>View Details →</Text>
          </TouchableOpacity>
        </GlassCardView>

        {/* SECTION: HEALTH AGE CARD */}
        <SectionHeader title="Biological Age" />
        <GlassCardView style={styles.ageCard} accentColor={Colors.teal}>
          <View style={styles.ageRow}>
            <View style={styles.ageBadge}>
              <Text style={styles.ageValue}>21</Text>
              <Text style={styles.ageLabel}>Health Age</Text>
            </View>
            <View style={styles.ageInfo}>
              <Text style={styles.ageTitle}>Aging 3 Years Slower! 🎉</Text>
              <Text style={styles.ageSub}>Your biological health indicators (sleep, heart rate, hydration) estimate your health age to be 21, compared to your chronological age of 24.</Text>
            </View>
          </View>
        </GlassCardView>

        {/* SECTION: WEEKLY CHALLENGE */}
        <SectionHeader title="Weekly Challenge" />
        <GlassCardView style={styles.challengeCard} accentColor={Colors.amber}>
          <Text style={styles.challengeTitle}>💧 Hydration Hero</Text>
          <Text style={styles.challengeDesc}>Drink 2.5L water for 5 days in a row.</Text>
          <View style={{ marginTop: Spacing.sm }}>
            <ProgressBar progress={waterChallenge?.progress ?? 0} color={Colors.amber} height={8} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={styles.challengeProgressText}>{waterChallenge?.daysComplete ?? 0} / {waterChallenge?.totalDays ?? 5} days complete</Text>
              <Text style={styles.challengeStreakText}>🔥 {waterChallenge?.streak ?? 0}d streak</Text>
            </View>
          </View>
        </GlassCardView>
        {/* SECTION: AI HEALTH ASSISTANT */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.aiBanner}>
            <View style={styles.aiBannerLeft}>
              <View style={styles.aiBannerIconWrap}>
                <Text style={styles.aiBannerIcon}>🤖</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.aiBannerTitle}>AI Health Assistant</Text>
                <Text style={styles.aiBannerSub}>Ask anything about nutrition, workouts, medications & more.</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.aiBannerBtn}>
              <Text style={styles.aiBannerBtnText}>✦ Ask AI</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* SECTION: SMALL CARD WEEKLY TRENDS */}
        <SectionHeader title="Weekly Trends (7d Averages)" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendsScroll}>
          {[
            { metric: 'Calories', value: '1,920 kcal', change: '↓ 4%', color: Colors.teal },
            { metric: 'Weight', value: '62.4 kg', change: '↓ 0.2kg', color: Colors.pink },
            { metric: 'Steps', value: '7,450 steps', change: '↑ 12%', color: Colors.amber },
            { metric: 'Sleep', value: '7.2 hrs', change: '↑ 8%', color: Colors.purple },
            { metric: 'Hydration', value: '1.8 Litres', change: '↓ 2%', color: Colors.blue },
          ].map((item, index) => (
            <GlassCardView key={index} style={styles.trendMetricCard}>
              <Text style={styles.trendMetricName}>{item.metric}</Text>
              <Text style={styles.trendMetricValue}>{item.value}</Text>
              <Text style={[styles.trendMetricChange, { color: item.change.includes('↑') ? Colors.success : Colors.danger }]}>
                {item.change}
              </Text>
            </GlassCardView>
          ))}
        </ScrollView>

        {/* SECTION: COMMUNITY PREVIEW */}
        <SectionHeader title="Community Spotlight" action="Join Groups" />
        <GlassCardView style={styles.communityCard}>
          <View style={styles.communityPost}>
            <Text style={styles.communityPostAuthor}>Jane Cooper shared a post in running group:</Text>
            <Text style={styles.communityPostText}>"Just completed the morning 5k. Lungs feel great, recovery speed is getting better! 🏃‍♀️✨"</Text>
            <Text style={styles.communityPostLikes}>❤️ 24 likes  ·  💬 8 comments</Text>
          </View>
        </GlassCardView>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* WEIGHT LOG MODAL */}
      <Modal visible={showWeightModal} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setShowWeightModal(false)} style={styles.modalBg}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ alignSelf: 'stretch' }}>
            <GlassCardView style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Log Weight</Text>
              <Text style={styles.modalSub}>Enter your current weight in kg</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="decimal-pad"
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="e.g. 62.5"
                placeholderTextColor={Colors.textMuted}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWeightModal(false)}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: Typography.bold }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleSaveWeight}>
                  <Text style={{ color: Colors.bg, fontWeight: Typography.bold }}>Save</Text>
                </TouchableOpacity>
              </View>
            </GlassCardView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {/* MEAL LOG MODAL */}
      <Modal visible={showMealModal} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setShowMealModal(false)} style={styles.modalBg}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ alignSelf: 'stretch' }}>
            <GlassCardView style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Log Meal</Text>
              <Text style={styles.modalSub}>Record what you ate</Text>

              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignSelf: 'stretch' }}>
                {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setMealType(type)}
                    style={{
                      flex: 1,
                      paddingVertical: Spacing.sm,
                      borderRadius: Radius.md,
                      alignItems: 'center',
                      backgroundColor: mealType === type ? Colors.teal + '20' : Colors.bgCardBorder,
                      borderWidth: mealType === type ? 1 : 0,
                      borderColor: Colors.teal,
                    }}>
                    <Text style={{ fontSize: Typography.xs, color: mealType === type ? Colors.teal : Colors.textSecondary, fontWeight: Typography.bold, textTransform: 'capitalize' }}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={[styles.modalInput, { width: '100%' }]} value={mealFood} onChangeText={setMealFood} placeholder="Food name *" placeholderTextColor={Colors.textMuted} />
              <TextInput style={[styles.modalInput, { width: '100%' }]} value={mealCalories} onChangeText={setMealCalories} keyboardType="number-pad" placeholder="Calories (kcal)" placeholderTextColor={Colors.textMuted} />

              <View style={{ flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch' }}>
                <TextInput style={[styles.modalInput, { flex: 1, marginBottom: 0 }]} value={mealProtein} onChangeText={setMealProtein} keyboardType="number-pad" placeholder="Protein (g)" placeholderTextColor={Colors.textMuted} />
                <TextInput style={[styles.modalInput, { flex: 1, marginBottom: 0 }]} value={mealCarbs} onChangeText={setMealCarbs} keyboardType="number-pad" placeholder="Carbs (g)" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch' }}>
                <TextInput style={[styles.modalInput, { flex: 1, marginBottom: 0 }]} value={mealFat} onChangeText={setMealFat} keyboardType="number-pad" placeholder="Fat (g)" placeholderTextColor={Colors.textMuted} />
                <TextInput style={[styles.modalInput, { flex: 1, marginBottom: 0 }]} value={mealFiber} onChangeText={setMealFiber} keyboardType="number-pad" placeholder="Fiber (g)" placeholderTextColor={Colors.textMuted} />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMealModal(false)}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: Typography.bold }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleSaveMeal} disabled={modalSaving}>
                  {modalSaving ? <ActivityIndicator size="small" color={Colors.bg} /> : <Text style={{ color: Colors.bg, fontWeight: Typography.bold }}>Save</Text>}
                </TouchableOpacity>
              </View>
            </GlassCardView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* WATER LOG MODAL */}
      <Modal visible={showWaterModal} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setShowWaterModal(false)} style={styles.modalBg}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ alignSelf: 'stretch' }}>
            <GlassCardView style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Log Water</Text>
              <Text style={styles.modalSub}>How much water did you drink?</Text>

              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignSelf: 'stretch' }}>
                {[200, 250, 300, 500].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => setWaterAmount(String(amount))}
                    style={{
                      flex: 1,
                      paddingVertical: Spacing.sm,
                      borderRadius: Radius.md,
                      alignItems: 'center',
                      backgroundColor: waterAmount === String(amount) ? Colors.blue + '20' : Colors.bgCardBorder,
                      borderWidth: waterAmount === String(amount) ? 1 : 0,
                      borderColor: Colors.blue,
                    }}>
                    <Text style={{ fontSize: Typography.xs, color: waterAmount === String(amount) ? Colors.blue : Colors.textSecondary, fontWeight: Typography.bold }}>{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={[styles.modalInput, { width: '100%' }]} value={waterAmount} onChangeText={setWaterAmount} keyboardType="number-pad" placeholder="Custom amount (ml)" placeholderTextColor={Colors.textMuted} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWaterModal(false)}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: Typography.bold }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSave, { backgroundColor: Colors.blue }]} onPress={handleSaveWater} disabled={modalSaving}>
                  {modalSaving ? <ActivityIndicator size="small" color={Colors.bg} /> : <Text style={{ color: Colors.bg, fontWeight: Typography.bold }}>Save</Text>}
                </TouchableOpacity>
              </View>
            </GlassCardView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MEDICINE MODAL */}
      <Modal visible={showMedModal} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setShowMedModal(false)} style={styles.modalBg}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ alignSelf: 'stretch' }}>
            <GlassCardView style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Log Medicine</Text>
              <Text style={styles.modalSub}>Track your medication intake</Text>

              <TextInput style={[styles.modalInput, { width: '100%' }]} placeholder="Medicine name" placeholderTextColor={Colors.textMuted} />
              <TextInput style={[styles.modalInput, { width: '100%' }]} placeholder="Dosage (e.g. 500 mg)" placeholderTextColor={Colors.textMuted} />

              <View style={{ backgroundColor: Colors.pink + '15', borderRadius: Radius.md, padding: Spacing.md, alignSelf: 'stretch', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.pink + '30' }}>
                <Text style={{ fontSize: Typography.xs, color: Colors.pink, fontWeight: Typography.bold, textAlign: 'center' }}>Feature coming soon</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMedModal(false)}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: Typography.bold }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </GlassCardView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: 0 },

  // ─── HERO SURFACE ───
  heroSurface: {
    backgroundColor: Colors.bgHero,
    marginHorizontal: -Spacing.base,
    marginBottom: Spacing.base,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    paddingBottom: Spacing.base,
    // Shadow underneath the hero
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 2,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  heroDate: {
    fontSize: Typography.xs,
    color: Colors.teal + 'AA',
    fontWeight: Typography.medium,
    marginBottom: 2,
    letterSpacing: Typography.lsWide,
  },
  heroGreeting: {
    fontSize: Typography.xl,
    fontWeight: Typography.extraBold,
    color: Colors.white,
    letterSpacing: -0.4,
  },
  heroTopBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },

  // ── Integrated Score Ring + Overview ──
  heroOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },
  heroScoreArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverviewText: {
    flex: 1,
  },
  heroOverviewLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.extraBold,
    color: Colors.white,
    marginBottom: 3,
    lineHeight: 22,
  },
  heroOverviewSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  heroReportBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: Colors.teal + '15',
    borderWidth: 1,
    borderColor: Colors.teal + '30',
  },
  heroReportBtnText: {
    color: Colors.teal,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },

  // ── AI Summary Inset ──
  heroAiInset: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.purpleDim,
    borderWidth: 1,
    borderColor: Colors.purple + '30',
  },
  heroAiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroAiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroAiSparkle: {
    fontSize: Typography.sm,
    color: Colors.purple,
  },
  heroAiTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.purple,
    letterSpacing: Typography.lsWider,
  },
  heroAiChatBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.purple + '22',
    borderWidth: 1,
    borderColor: Colors.purple + '44',
  },
  heroAiChatText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.purple,
  },
  heroAiText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  heroAiTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  heroAiTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 0.5,
  },
  heroAiTagText: {
    fontSize: Typography.micro,
    fontWeight: Typography.bold,
  },
  aiSummaryBox: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.purpleDim,
    borderColor: Colors.purple + '33',
    borderWidth: 1,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  aiSummaryTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiSummarySparkle: {
    fontSize: Typography.sm,
    color: Colors.purple,
  },
  aiSummaryTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.purple,
    letterSpacing: Typography.lsWider,
  },
  aiSummaryChatBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.purple + '22',
    borderWidth: 1,
    borderColor: Colors.purple + '44',
  },
  aiSummaryChatText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.purple,
  },
  aiSummaryText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  aiSummaryTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  aiSummaryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 0.5,
  },
  aiSummaryTagText: {
    fontSize: Typography.micro,
    fontWeight: Typography.bold,
  },

  // HEALTH ALERT
  alertCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    backgroundColor: Colors.danger + '08',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  alertIcon: { fontSize: Typography.md },
  alertTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.danger,
    letterSpacing: Typography.lsWider,
  },
  alertText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // DAILY HEALTH TIMELINE
  newTimelineContainer: {
    position: 'relative',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  newTimelineLine: {
    position: 'absolute',
    left: 54,
    top: 24,
    bottom: 24,
    width: 1.5,
    backgroundColor: Colors.bgCardBorder,
  },
  newTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  newTimelineIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTimelineCardIcon: {
    fontSize: Typography.lg,
  },
  newTimelineNodeContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTimelineNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },
  newTimelineContent: {
    flex: 1,
    marginLeft: 4,
  },
  newTimelineTime: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    marginBottom: 2,
  },
  newTimelineTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  newTimelineSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  newTimelineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badgeTaken: {
    backgroundColor: Colors.success + '15',
    borderColor: Colors.success + '33',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeTakenText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.success,
  },
  badgeValueText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  badgeCountdown: {
    backgroundColor: Colors.amber + '15',
    borderColor: Colors.amber + '33',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeCountdownText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.amber,
  },
  badgeUpcoming: {
    backgroundColor: Colors.purple + '15',
    borderColor: Colors.purple + '33',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeUpcomingText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.purple,
  },
  newTimelineChevron: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginLeft: 4,
  },

  // QUICK ACTIONS REDESIGNED
  quickActionScroll: {
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chartBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.chipBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: 175,
    marginRight: Spacing.sm,
  },
  quickActionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  quickActionIcon: {
    fontSize: Typography.base,
  },
  quickActionTextContent: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  quickActionDesc: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  quickActionPlus: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    marginLeft: 4,
  },

  // PROGRESS GRID
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  progressCard: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  progressCardTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  progressVal: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  progressSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  progressPct: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    marginTop: Spacing.sm,
  },

  // MEDS CARD
  medsCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  medIconCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  medIconPending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    marginRight: Spacing.md,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.semiBold,
  },
  medDose: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  medTime: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  medActionBtn: {
    backgroundColor: Colors.success + '22',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.success + '55',
  },
  medActionText: {
    color: Colors.success,
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  },

  // WEIGHT CARD
  weightCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weightVal: {
    fontSize: Typography.xl,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
  },
  weightSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  weightTrendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sparklinePlaceholder: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // APPOINTMENT CARD
  aptCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  aptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  aptAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  aptInfo: {
    flex: 1,
  },
  aptName: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
  },
  aptSpec: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  aptTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aptTimeIcon: {
    fontSize: Typography.sm,
    marginRight: 4,
  },
  aptTimeText: {
    fontSize: Typography.xs,
    color: Colors.teal,
    fontWeight: Typography.medium,
  },
  aptBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  aptBtnText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },

  // BIOLOGICAL AGE CARD
  ageCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ageBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.tealDim,
    borderColor: Colors.teal + '44',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.extraBold,
    color: Colors.teal,
  },
  ageLabel: {
    fontSize: Typography.micro,
    color: Colors.teal,
  },
  ageInfo: {
    flex: 1,
  },
  ageTitle: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
    marginBottom: 2,
  },
  ageSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // CHALLENGE CARD
  challengeCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  challengeTitle: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  challengeDesc: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  challengeProgressText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  challengeStreakText: {
    fontSize: Typography.xs,
    color: Colors.amber,
    fontWeight: Typography.bold,
  },

  // COMMUNITY CARD
  communityCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  communityPost: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  communityPostAuthor: {
    fontSize: Typography.xs,
    color: Colors.teal,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  communityPostText: {
    fontSize: Typography.xs,
    color: Colors.textPrimary,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  communityPostLikes: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  // AI BANNER
  aiBanner: {
    ...GlassCard,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.purpleDim,
    borderColor: Colors.purple + '55',
    borderWidth: 1,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  aiBannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.purple + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerIcon: {
    fontSize: Typography.xl,
  },
  aiBannerTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  aiBannerSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  aiBannerBtn: {
    backgroundColor: Colors.purple,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  aiBannerBtnText: {
    color: Colors.white,
    fontWeight: Typography.bold,
    fontSize: Typography.base,
  },

  // WEEKLY TRENDS SCROLL
  trendsScroll: {
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  trendMetricCard: {
    padding: Spacing.md,
    width: 120,
    alignItems: 'center',
  },
  trendMetricName: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    marginBottom: 4,
  },
  trendMetricValue: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
    marginBottom: 2,
  },
  trendMetricChange: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },

  // MODAL STYLING
  modalBg: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContainer: {
    alignSelf: 'stretch',
    padding: Spacing.lg,
    alignItems: 'stretch',
    backgroundColor: Colors.bgCardSolid,
  },
  modalTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    height: 52,
    flexShrink: 0,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.overlay,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.md,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignSelf: 'stretch',
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  modalSave: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.teal,
  },

  // COLLAPSIBLE MONTHLY CALENDAR
  calendarSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  calendarTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  calendarToggleLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  calendarToggleChevron: {
    fontSize: Typography.xs,
    color: Colors.teal,
  },
  calendarContainer: {
    marginBottom: Spacing.xl,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  calendarMonthYear: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    letterSpacing: Typography.lsTight,
    lineHeight: 32,
  },
  calendarYearSub: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    marginTop: 2,
  },
  calendarMonthText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  calendarNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  calendarNavBtnText: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    lineHeight: 20,
    fontWeight: Typography.bold,
  },
  calendarToggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.teal + '44',
    backgroundColor: Colors.teal + '15',
  },
  calendarToggleText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.teal,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 4,
  },
  calendarWeekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  calendarWeekdayText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: Typography.lsWide,
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
  },
  calendarSelectedCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.teal + '25',
    borderWidth: 1.5,
    borderColor: Colors.teal,
  },
  calendarDayNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
  },
  calendarSelectedNumber: {
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  calendarOtherMonthNumber: {
    color: Colors.textMuted + '33',
  },
  calendarTodayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: Colors.purple,
    backgroundColor: Colors.purple + '12',
  },
  calendarIndicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    gap: 3,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  calendarSummaryBox: {
    marginTop: Spacing.xl,
  },
  calendarAgendaDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.xs,
  },
  calendarSummaryTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    letterSpacing: Typography.lsWider,
    paddingHorizontal: Spacing.xs,
  },
  calendarEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: 3,
  },
  calendarEventText: {
    fontSize: Typography.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  agendaCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  agendaEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCardBorder,
    gap: Spacing.md,
  },
  agendaEventAccentDot: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  agendaEventIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCardBorder,
  },
  agendaEventIcon: {
    fontSize: Typography.lg,
  },
  agendaEventInfo: {
    flex: 1,
  },
  agendaEventLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  agendaEventTime: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  agendaEventBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
  },
  agendaEventBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
    letterSpacing: Typography.lsWide,
  },
  agendaEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  agendaEmptyIcon: {
    fontSize: Typography.xxl,
  },
  agendaEmptyText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
  },
  agendaEmptySubtext: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  // OLD — kept for reference, may be cleaned up later
  agendaCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  agendaIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
