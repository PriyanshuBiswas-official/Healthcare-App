import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { Colors, Typography, Spacing, Radius, GlassCard, Shadows } from '../theme/theme';
import { GlassCardView, SectionHeader, ProfileAvatarButton, NotificationIconButton, ProgressBar } from '../components/SharedComponents';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import { useAuth } from '../providers/AuthProvider';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import { SleepTrackerSection, VitalsDashboardSection } from './HealthCommonSections';
import { getSleepLogs, getWeightLogs, saveWeightLog } from '../services/healthService';
import type { SleepLog, WeightEntry } from '../types/health';

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
        <Text style={{ fontSize: 24, fontWeight: Typography.extraBold, color: Colors.white, lineHeight: 28 }}>{score}</Text>
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

export default function DashboardScreen({ onProfilePress, onNotificationsPress, onCompleteProfile }: { onProfilePress?: () => void; onNotificationsPress?: () => void; onCompleteProfile?: () => void }) {
  const { onScroll } = useScrollVisibility();
  const { user, session, profileCompletion } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightEntry[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

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
      getSleepLogs(session.access_token)
        .then(setSleepLogs)
        .catch(err => console.warn('Failed to load sleep logs on Dashboard:', err));
        
      getWeightLogs(session.access_token)
        .then(setWeightLogs)
        .catch(err => console.warn('Failed to load weight logs on Dashboard:', err));
    }
  };

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

  // Rendering weight trend sparkline
  const renderWeightSparkline = () => {
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
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={onScroll} scrollEventThrottle={16}>
        {/* SECTION 1: HEADER */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerDate}>{todayDateStr}</Text>
              <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
                Hi, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'} 👋
              </Text>
            </View>
            <View style={styles.headerActions}>
              <NotificationIconButton onPress={onNotificationsPress} />
              <ProfileAvatarButton
                onPress={onProfilePress}
                userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                avatarUrl={user?.user_metadata?.avatar_url}
              />
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

        {/* SECTION 2: HEALTH SCORE HERO CARD */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <GlassCardView style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroLeft}>
                <HeroScoreRing score={86} />
              </View>
              <View style={styles.heroRight}>
                <Text style={styles.heroTitle}>Great job! 🎉</Text>
                <Text style={styles.heroSub}>You're making healthier choices every day.</Text>
                <TouchableOpacity style={styles.heroBtn}>
                  <Text style={styles.heroBtnText}>View Full Report →</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.heroPillRow}>
              {[
                { icon: '🔥', text: 'Calories' },
                { icon: '💧', text: 'Water' },
                { icon: '💪', text: 'Workout' },
                { icon: '🌙', text: 'Sleep' },
                { icon: '👟', text: 'Steps' },
              ].map((item, i) => (
                <View key={i} style={styles.heroPill}>
                  <Text style={styles.heroPillIcon}>{item.icon}</Text>
                  <Text style={styles.heroPillText}>{item.text}</Text>
                </View>
              ))}
            </View>

            {/* AI HEALTH SUMMARY CONTAINER */}
            <View style={styles.aiSummaryBox}>
              <View style={styles.aiSummaryHeader}>
                <View style={styles.aiSummaryTitleWrap}>
                  <Text style={styles.aiSummarySparkle}>✦</Text>
                  <Text style={styles.aiSummaryTitle}>AI HEALTH SUMMARY</Text>
                </View>
                <TouchableOpacity style={styles.aiSummaryChatBtn}>
                  <Text style={styles.aiSummaryChatText}>💬 Chat with AI</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.aiSummaryText}>
                Your vitals are stable today. Sleep quality improved +12% vs last week. Cortisol is elevated from yesterday's push session — light activity is advised today.
              </Text>
              <View style={styles.aiSummaryTagRow}>
                <View style={[styles.aiSummaryTag, { backgroundColor: Colors.success + '15', borderColor: Colors.success + '40' }]}>
                  <Text style={[styles.aiSummaryTagText, { color: Colors.success }]}>● Vitals stable</Text>
                </View>
                <View style={[styles.aiSummaryTag, { backgroundColor: Colors.purple + '15', borderColor: Colors.purple + '40' }]}>
                  <Text style={[styles.aiSummaryTagText, { color: Colors.purple }]}>● Sleep +12%</Text>
                </View>
                <View style={[styles.aiSummaryTag, { backgroundColor: Colors.amber + '15', borderColor: Colors.amber + '40' }]}>
                  <Text style={[styles.aiSummaryTagText, { color: Colors.amber }]}>● Rest day advised</Text>
                </View>
              </View>
            </View>
          </GlassCardView>
        </Animated.View>

        {/* SECTION: HEALTH ALERT */}
        <GlassCardView style={[styles.alertCard, { borderColor: Colors.danger + '44' }]} accentColor={Colors.danger}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertTitle}>HEALTH ALERT</Text>
          </View>
          <Text style={styles.alertText}>
            Dehydration Risk: You've logged 50% less water today compared to your daily average. Try to drink a glass now.
          </Text>
        </GlassCardView>

        {/* SECTION: DAILY HEALTH TIMELINE */}
        <SectionHeader title="Health Timeline" subtitle="Your day at a glance" action="View All" />
        <GlassCardView style={styles.newTimelineCard}>
          <View style={styles.newTimelineContainer}>
            <View style={styles.newTimelineLine} />
            {[
              { time: '08:00 AM', title: 'Medication', sub: 'Vitamin D3 1000 IU', icon: '💊', color: Colors.purple, rightText: '✓ Taken', rightType: 'taken' },
              { time: '09:15 AM', title: 'Water', sub: '400 ml recorded', icon: '💧', color: '#3b82f6', rightText: '400 ml', rightType: 'value' },
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
        </GlassCardView>

        {/* SECTION: REDESIGNED QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionScroll}>
          {[
            { icon: '🍽️', label: 'Log Meal', desc: 'Record calories', color: Colors.amber },
            { icon: '💧', label: 'Log Water', desc: 'Add a glass', color: '#3b82f6' },
            { icon: '💪', label: 'Log Workout', desc: 'Track activity', color: Colors.purple },
            { icon: '💊', label: 'Medicine', desc: 'Check dose', color: Colors.pink },
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

        {/* SECTION: TODAY'S PROGRESS */}
        <SectionHeader title="Today's Progress" action="View All →" />
        <View style={styles.progressGrid}>
          <GlassCardView style={styles.progressCard}>
            <Text style={styles.progressCardTitle}>🔥 Calories</Text>
            <CompactRing size={82} progress={0.73} color={Colors.amber}>
              <Text style={styles.progressVal}>1,840</Text>
              <Text style={styles.progressSub}>/ 2500 kcal</Text>
            </CompactRing>
            <Text style={[styles.progressPct, { color: Colors.amber }]}>73%</Text>
          </GlassCardView>
          
          <GlassCardView style={styles.progressCard}>
            <Text style={styles.progressCardTitle}>💧 Water</Text>
            <CompactRing size={82} progress={0.68} color="#3b82f6">
              <Text style={styles.progressVal}>1,700</Text>
              <Text style={styles.progressSub}>/ 2500 ml</Text>
            </CompactRing>
            <Text style={[styles.progressPct, { color: '#3b82f6' }]}>68%</Text>
          </GlassCardView>

          <GlassCardView style={styles.progressCard}>
            <Text style={styles.progressCardTitle}>💊 Medication</Text>
            <CompactRing size={82} progress={0.67} color={Colors.pink}>
              <Text style={styles.progressVal}>2/3</Text>
              <Text style={styles.progressSub}>Taken</Text>
            </CompactRing>
            <Text style={[styles.progressPct, { color: Colors.pink }]}>67%</Text>
          </GlassCardView>

          <GlassCardView style={styles.progressCard}>
            <Text style={styles.progressCardTitle}>💪 Workout</Text>
            <CompactRing size={82} progress={0.78} color={Colors.purple}>
              <Text style={styles.progressVal}>35</Text>
              <Text style={styles.progressSub}>/ 45 min</Text>
            </CompactRing>
            <Text style={[styles.progressPct, { color: Colors.purple }]}>78%</Text>
          </GlassCardView>
        </View>

        {/* SECTION: TODAY'S MEDICATIONS */}
        <SectionHeader title="Today's Medications" action="View All →" />
        <GlassCardView style={styles.medsCard}>
          <View style={styles.medRow}>
            <View style={styles.medIconCheck}><Text style={{ color: Colors.bg, fontSize: 10, fontWeight: 'bold' }}>✓</Text></View>
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
                <Text style={{ color: Colors.success, fontSize: Typography.xs, fontWeight: 'bold' }}>
                  {weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg <= 0 ? '↓' : '↑'}{' '}
                  {Math.abs(weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg).toFixed(1)} kg
                </Text>
              </View>
            )}
          </View>
          {renderWeightSparkline()}
        </GlassCardView>

        {/* SECTION: TODAY'S VITALS */}
        <VitalsDashboardSection />

        {/* SECTION: SLEEP TRACKER */}
        <SleepTrackerSection sleepLogs={sleepLogs} />

        {/* SECTION: NEXT APPOINTMENT */}
        <SectionHeader title="Next Appointment" />
        <GlassCardView style={styles.aptCard}>
          <View style={styles.aptRow}>
            <View style={styles.aptAvatar}><Text style={{ fontSize: 24 }}>👨‍⚕️</Text></View>
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
            <ProgressBar progress={0.6} color={Colors.amber} height={8} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={styles.challengeProgressText}>3 / 5 days complete</Text>
              <Text style={styles.challengeStreakText}>🔥 3d streak</Text>
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
            { metric: 'Hydration', value: '1.8 Litres', change: '↓ 2%', color: '#3b82f6' },
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
        <View style={styles.modalBg}>
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
        </View>
      </Modal>
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
  headerTextContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  headerDate: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginBottom: 4,
    fontWeight: Typography.medium,
  },
  greeting: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // HERO CARD
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    backgroundColor: '#0F1223',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 204, 0.15)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroLeft: {
    marginRight: Spacing.lg,
  },
  heroRight: {
    flex: 1,
  },
  heroTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  heroSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.teal + '80',
    backgroundColor: Colors.teal + '15',
  },
  heroBtnText: {
    color: Colors.teal,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  heroPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  heroPillIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  heroPillText: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
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
    fontSize: 14,
    color: Colors.purple,
  },
  aiSummaryTitle: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.purple,
    letterSpacing: 1,
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
    fontSize: 9,
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
    fontSize: 8,
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
  alertIcon: { fontSize: 16 },
  alertTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.danger,
    letterSpacing: 1,
  },
  alertText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // DAILY HEALTH TIMELINE
  newTimelineCard: {
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  newTimelineContainer: {
    position: 'relative',
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
    fontSize: 18,
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
    fontSize: 10,
    fontWeight: Typography.bold,
    marginBottom: 2,
  },
  newTimelineTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  newTimelineSub: {
    fontSize: 9,
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
    fontSize: 9,
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
    fontSize: 9,
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
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.purple,
  },
  newTimelineChevron: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginLeft: 4,
  },

  // QUICK ACTIONS REDESIGNED
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  quickActionScroll: {
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16182C',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    fontSize: 16,
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
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 1,
  },
  quickActionPlus: {
    fontSize: 16,
    fontWeight: 'bold',
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
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
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
    fontSize: 9,
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
    fontSize: 12,
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
    fontSize: 8,
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
    backgroundColor: 'rgba(255,255,255,0.02)',
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
    fontSize: 9,
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
    fontSize: 24,
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
    fontSize: 10,
    fontWeight: Typography.bold,
  },

  // MODAL STYLING
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContainer: {
    width: '100%',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
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
});
