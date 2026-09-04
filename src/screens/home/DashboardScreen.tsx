import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { GlassCardView, SectionHeader, ProfileAvatarButton, NotificationIconButton, ProgressBar, LoadingSpinner } from '../../components/SharedComponents';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import ProfileCompletionBanner from '../../components/ProfileCompletionBanner';
import { useAuth } from '../../providers/AuthProvider';
import { usePreferences } from '../../providers/PreferencesContext';
import { useNotifications } from '../../providers/NotificationContext';
import { useAppointments } from '../../providers/AppointmentContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill, Droplets, Utensils, Footprints, Dumbbell, Moon, Pin, Stethoscope, Scale, Calendar, Clock, Flame, UserRound, Flower2, Activity, Zap, ArrowRight, Target, Info } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import { launchCamera } from 'react-native-image-picker';
import Voice from '@dev-amirzubair/react-native-voice';
import { Search, Mic, Camera, Check, TriangleAlert } from 'lucide-react-native';
import { TabName } from '../../navigation/TabBar';
import { SleepTrackerSection, VitalsDashboardSection } from '../health/HealthCommonSections';
import { getSleepLogs, getWeightLogs, saveWeightLog, getLatestCycle, getMoodLogs, getSymptomsLogs, getPeriodLogs } from '../../services/healthService';
import { getMealsForDate, getWaterForDate, getCalorieGoal, logMeal, logWater, getWaterChallenge, getWeeklyTrend } from '../../services/dietService';
import { getTodaySummary, getActivityGoal, getWeeklyStats } from '../../services/activityService';
import { getDashboardHealthScore } from '../../services/healthScoreService';
import * as relationshipApi from '../../services/relationshipApi';
import type { SleepLog, WeightEntry, DashboardHealthScore, CycleData, MoodLog, SymptomsLog, PeriodLog } from '../../types/health';
import type { DayMealsResponse, DayWaterResponse, NutritionGoal, MealType, WaterChallenge, WeeklyTrendDay } from '../../types/diet';
import type { ActivitySummary, ActivityGoal, WeeklyData } from '../../types/activity';
import { getMedications, getMedicationLogsForDate, logMedicationTaken, removeMedicationLog } from '../../types/medication';
import type { Medication, MedicationLog } from '../../types/medication';
import { formatTime12h } from '../../utils/calendarHelpers';
import { getAIHealthSummary, AISummaryTag } from '../../services/aiApi';

const SCREEN_WIDTH = Dimensions.get('window').width;

function capitalizeFirst(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatDashboardDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();

    const dDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((dDateOnly.getTime() - nowDateOnly.getTime()) / (1000 * 60 * 60 * 24));

    let dayLabel: string;
    if (diffDays === 0) dayLabel = 'Today';
    else if (diffDays === 1) dayLabel = 'Tomorrow';
    else if (diffDays === -1) dayLabel = 'Yesterday';
    else dayLabel = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dayLabel} · ${time}`;
  } catch {
    return iso;
  }
}

export default function DashboardScreen({ onProfilePress, onNotificationsPress, onCompleteProfile, navigateToTab, onPartnerPress, onRelationshipsPress, onOpenAI, onOpenAppointments, onOpenHealthLog, onCaptureImage }: { onProfilePress?: () => void; onNotificationsPress?: () => void; onCompleteProfile?: () => void; navigateToTab?: (tab: TabName) => void; onPartnerPress?: (partnerId: string) => void; onRelationshipsPress?: () => void; onOpenAI?: (fromTab?: TabName, startInChat?: boolean, initialQuery?: string) => void; onOpenAppointments?: () => void; onOpenHealthLog?: () => void; onCaptureImage?: (attachment: { uri: string; type: string; name: string }) => void; }) {
  const { theme } = useTheme();
  const { onScroll } = useScrollVisibility();
  const { user, session, profileCompletion, gender } = useAuth();
  const { hideVitals, hideCommunitySpotlight } = usePreferences();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();

  const styles = useStyles((theme) => ({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { paddingHorizontal: Spacing.base, paddingTop: 0 },

    // ─── HERO SURFACE ───
    heroSurface: {
      backgroundColor: theme.colors.bgHero,
      marginHorizontal: -Spacing.base,
      marginBottom: Spacing.base,
      borderBottomLeftRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
      paddingBottom: Spacing.base,
      zIndex: 2,
    },
    heroTopBar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xs,
    },
    heroDate: {
      fontSize: Typography.xs,
      color: theme.colors.white + 'CC',
      fontWeight: Typography.medium,
      marginBottom: 2,
      letterSpacing: Typography.lsWide,
    },
    heroGreeting: {
      fontSize: Typography.xl,
      fontWeight: Typography.extraBold,
      color: theme.colors.white,
      letterSpacing: -0.4,
    },
    heroTopBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },

    // ── Search Bar ──
    searchBarContainer: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.md,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.white + '20',
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.white + '30',
    },
    searchBarInput: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    searchPlaceholder: {
      flex: 1,
      fontSize: Typography.sm,
      color: theme.colors.white + '80',
    },
    searchActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingRight: Spacing.sm,
    },
    searchActionBtn: {
      padding: Spacing.sm,
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
      color: theme.colors.white,
      marginBottom: 3,
      lineHeight: 22,
    },
    heroOverviewSub: {
      fontSize: Typography.xs,
      color: theme.colors.white + 'BB',
      lineHeight: 16,
      marginBottom: Spacing.sm,
    },
    heroReportBtn: {
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
      backgroundColor: theme.colors.teal + '15',
      borderWidth: 1,
      borderColor: theme.colors.teal + '30',
    },
    heroReportBtnText: {
      color: theme.colors.teal,
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
    },

    // ── AI Summary Inset ──
    heroAiInset: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      padding: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: theme.colors.white + '15',
      borderWidth: 1,
      borderColor: theme.colors.white + '25',
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
      color: theme.colors.white,
    },
    heroAiTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.colors.white,
      letterSpacing: Typography.lsWider,
    },
    heroAiChatBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radius.sm,
      backgroundColor: theme.colors.white + '20',
      borderWidth: 1,
      borderColor: theme.colors.white + '35',
    },
    heroAiChatText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.colors.white,
    },
    heroAiText: {
      fontSize: Typography.xs,
      color: theme.colors.white + 'BB',
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
      backgroundColor: theme.colors.white + '15',
      borderColor: theme.colors.white + '25',
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
      color: theme.colors.white,
    },
    aiSummaryTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.colors.white,
      letterSpacing: Typography.lsWider,
    },
    aiSummaryChatBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radius.sm,
      backgroundColor: theme.colors.white + '20',
      borderWidth: 1,
      borderColor: theme.colors.white + '35',
    },
    aiSummaryChatText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: theme.colors.white,
    },
    aiSummaryText: {
      fontSize: Typography.xs,
      color: theme.colors.white + 'BB',
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
      marginBottom: Spacing.lg,
      borderWidth: 1,
      backgroundColor: theme.colors.danger + '08',
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
      color: theme.colors.danger,
      letterSpacing: Typography.lsWider,
    },
    alertText: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },

    // QUICK ACTIONS REDESIGNED
    quickActionScroll: {
      paddingBottom: Spacing.lg,
      gap: Spacing.md,
    },
    quickActionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.chartBg,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: theme.colors.chipBg,
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
      color: theme.colors.textPrimary,
    },
    quickActionDesc: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
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
      marginBottom: Spacing.lg,
    },
    progressCard: {
      width: '48%',
      marginBottom: Spacing.md,
    },
    progressCardTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: Spacing.md,
    },
    progressVal: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
    },
    progressSub: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
    },
    progressPct: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      marginTop: Spacing.sm,
    },

    // MEDS LIST
    medList: {
      marginBottom: Spacing.lg,
    },
    medItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xs,
    },
    medItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    medCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    medInfo: {
      flex: 1,
    },
    medName: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: theme.colors.textPrimary,
    },
    medPurposeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: Radius.full,
      borderWidth: 1,
      alignSelf: 'flex-start',
      marginTop: 3,
      marginBottom: 2,
    },
    medPurposeText: {
      fontSize: 10,
      fontWeight: Typography.bold,
    },
    medDose: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    medIndicator: {
      width: 4,
      height: 28,
      borderRadius: 2,
    },
    medShowAllBtn: {
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    medShowAllText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: theme.colors.teal,
    },

    // WEIGHT CARD
    weightCard: {
      padding: Spacing.base,
      marginBottom: Spacing.lg,
    },
    weightHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    weightVal: {
      fontSize: Typography.xl,
      fontWeight: Typography.extraBold,
      color: theme.colors.textPrimary,
    },
    weightSub: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
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
      marginBottom: Spacing.lg,
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
      backgroundColor: theme.colors.bgCardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    aptInfo: {
      flex: 1,
    },
    aptName: {
      fontSize: Typography.base,
      color: theme.colors.textPrimary,
      fontWeight: Typography.bold,
    },
    aptSpec: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
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
      color: theme.colors.teal,
      fontWeight: Typography.medium,
    },
    aptBtn: {
      alignItems: 'center',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
    aptBtnText: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      fontWeight: Typography.medium,
    },
    aptEmpty: {
      alignItems: 'center',
      paddingVertical: Spacing.lg,
    },
    aptEmptyIcon: {
      fontSize: Typography.xxl,
      marginBottom: Spacing.sm,
    },
    aptEmptyText: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      marginBottom: Spacing.md,
    },
    aptAddBtn: {
      backgroundColor: theme.colors.teal + '20',
      borderWidth: 1,
      borderColor: theme.colors.teal + '50',
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
    },
    aptAddBtnText: {
      fontSize: Typography.sm,
      color: theme.colors.teal,
      fontWeight: Typography.semiBold,
    },

    // BIOLOGICAL AGE CARD
    ageCard: {
      padding: Spacing.base,
      marginBottom: Spacing.lg,
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
      backgroundColor: theme.colors.tealDim,
      borderColor: theme.colors.teal + '44',
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ageValue: {
      fontSize: Typography.lg,
      fontWeight: Typography.extraBold,
      color: theme.colors.teal,
    },
    ageLabel: {
      fontSize: Typography.micro,
      color: theme.colors.teal,
    },
    ageInfo: {
      flex: 1,
    },
    ageTitle: {
      fontSize: Typography.sm,
      color: theme.colors.textPrimary,
      fontWeight: Typography.bold,
      marginBottom: 2,
    },
    ageSub: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },

    // CHALLENGE CARD
    challengeCard: {
      padding: Spacing.base,
      marginBottom: Spacing.xl,
    },
    challengeTitle: {
      fontSize: Typography.sm,
      color: theme.colors.textPrimary,
      fontWeight: Typography.bold,
      marginBottom: 4,
    },
    challengeDesc: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    challengeProgressText: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
    },
    challengeStreakText: {
      fontSize: Typography.xs,
      color: theme.colors.amber,
      fontWeight: Typography.bold,
    },

    // COMMUNITY CARD
    communityCard: {
      padding: Spacing.base,
      marginBottom: Spacing.lg,
    },
    communityPost: {
      backgroundColor: theme.colors.bgCard,
      padding: Spacing.md,
      borderRadius: Radius.md,
    },
    communityPostAuthor: {
      fontSize: Typography.xs,
      color: theme.colors.teal,
      fontWeight: Typography.bold,
      marginBottom: 4,
    },
    communityPostText: {
      fontSize: Typography.xs,
      color: theme.colors.textPrimary,
      lineHeight: 16,
      marginBottom: Spacing.sm,
    },
    communityPostLikes: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
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
      color: theme.colors.textMuted,
      fontWeight: Typography.medium,
      marginBottom: 4,
    },
    trendMetricValue: {
      fontSize: Typography.sm,
      color: theme.colors.textPrimary,
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
      backgroundColor: theme.colors.overlayHeavy,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: theme.colors.modalBg,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.xl,
      paddingBottom: 40,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.textMuted, alignSelf: 'center', marginBottom: Spacing.lg },
    modalTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    modalSub: {
      fontSize: Typography.sm,
      color: theme.colors.textMuted,
      marginBottom: Spacing.lg,
    },
    modalInput: {
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.md,
      padding: Spacing.md,
      color: theme.colors.textPrimary,
      fontSize: Typography.base,
      marginBottom: Spacing.sm,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.md,
      marginTop: Spacing.xl,
    },
    modalCancel: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    modalSave: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: Radius.full,
      backgroundColor: theme.colors.teal,
      alignItems: 'center',
      minWidth: 80,
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
      borderBottomColor: theme.colors.bgCardBorder,
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
      backgroundColor: theme.colors.bgCardBorder,
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
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    agendaEventTime: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
    },
    agendaEventBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.full,
      backgroundColor: theme.colors.chipBg,
      borderWidth: 1,
      borderColor: theme.colors.chipBorder,
    },
    agendaEventBadgeText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: theme.colors.textSecondary,
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
      color: theme.colors.textSecondary,
    },
    agendaEmptySubtext: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
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
    // RELATIONSHIPS
    relationshipsScroll: {
      paddingLeft: Spacing.md,
      paddingRight: Spacing.lg,
      paddingBottom: Spacing.xl,
      gap: Spacing.md,
    },
    partnerCard: {
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    partnerAvatarContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: Spacing.xs,
      position: 'relative',
    },
    partnerAvatarImagePlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 30,
      backgroundColor: theme.colors.accentBlueDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    partnerInitials: {
      fontSize: Typography.lg,
      color: theme.colors.white,
      fontWeight: Typography.bold,
    },
    partnerStatusDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: theme.colors.bg,
    },
    partnerName: {
      fontSize: Typography.xs,
      color: theme.colors.textPrimary,
      fontWeight: Typography.semiBold,
      marginBottom: 2,
      textAlign: 'center',
    },
    partnerRelation: {
      fontSize: 9,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  }));

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
              <Stop offset="0" stopColor={theme.colors.teal} />
              <Stop offset="1" stopColor={theme.colors.accentBlue} />
            </SvgLinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.bgCardBorder}
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
          <Text style={{ fontSize: Typography.xl, fontWeight: Typography.extraBold, color: theme.colors.white, lineHeight: 28 }}>{score}</Text>
          <Text style={{ fontSize: Typography.xs, color: theme.colors.textMuted }}>/100</Text>
        </View>
      </View>
    );
  };

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
            stroke={theme.colors.bgCardBorder}
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const heroHeightRef = useRef(0);

  const [showAllMeds, setShowAllMeds] = useState<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  const [relationships, setRelationships] = useState<relationshipApi.Relationship[]>([]);

  const { appointments } = useAppointments();
  const nextAppointment = useMemo(() => {
    return appointments
      .filter(a => a.status === 'UPCOMING')
      .sort((a, b) => new Date(a.date_with_time).getTime() - new Date(b.date_with_time).getTime())[0] || null;
  }, [appointments]);

  const handleSearchPress = useCallback(() => {
    onOpenAI?.('Home', true, '');
  }, [onOpenAI]);

  const handleVoicePress = useCallback(async () => {
    if (isListening) {
      Voice.stop();
      setIsListening(false);
      return;
    }
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          { title: 'Microphone Permission', message: 'App needs access to your microphone for voice search', buttonPositive: 'OK' },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      Voice.onSpeechResults = (e: any) => {
        const text = e.value?.[0];
        setIsListening(false);
        if (text) {
          onOpenAI?.('Home', true, text);
        }
      };
      Voice.onSpeechError = () => setIsListening(false);
      await Voice.start('en-US');
      setIsListening(true);
    } catch (e) {
      console.warn('[Voice] start error:', e);
      setIsListening(false);
    }
  }, [isListening, onOpenAI]);

  const handleCameraPress = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          { title: 'Camera Permission', message: 'App needs access to your camera', buttonPositive: 'OK' },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      const result = await launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Camera Error', result.errorMessage || 'Could not open camera');
        return;
      }
      if (result.assets?.[0]) {
        const a = result.assets[0];
        const attachment = { uri: a.uri || '', type: a.type || 'image/jpeg', name: a.fileName || 'photo.jpg' };
        if (onCaptureImage) {
          onCaptureImage(attachment);
        } else {
          onOpenAI?.('Home', true, 'Analyze this health image');
        }
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not open camera');
    }
  }, [onOpenAI, onCaptureImage]);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);

  // Dynamic status bar color on scroll
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScroll(e);
  }, [onScroll]);

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
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendDay[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyData | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [symptomsLogs, setSymptomsLogs] = useState<SymptomsLog[]>([]);
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
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
  const [healthScore, setHealthScore] = useState<DashboardHealthScore | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('Analyzing your health metrics to compile summary...');
  const [aiSummaryTags, setAiSummaryTags] = useState<AISummaryTag[]>([
    { label: 'Analyzing...', color: 'accentBlue' }
  ]);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const medicationsData = useMemo(() => {
    const medColors = [theme.colors.accentBlue, theme.colors.amber, theme.colors.blue, theme.colors.pink, theme.colors.teal, theme.colors.success, theme.colors.textSecondary];
    const logIds = new Set(medicationLogs.map(l => l.medicine_id));
    return medications
      .filter(m => m.is_active)
      .map((med, idx) => {
        // Supabase nests schedules inside reminder via the join query
        const reminderObj = med.reminder as any;
        const schedules = reminderObj?.schedules || med.schedules || [];
        const times = schedules.map((s: any) => formatTime12h(s.notify_at)).filter(Boolean);
        return {
          id: med.id,
          name: med.name,
          dose: med.dosage || 'N/A',
          time: times.length > 0 ? times.join(' · ') : 'No reminder set',
          taken: logIds.has(med.id),
          color: medColors[idx % medColors.length],
          purpose: med.frequency || 'Medication',
        };
      });
  }, [medications, medicationLogs]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const loadAiSummary = useCallback(async () => {
    if (!session?.access_token) return;
    setAiSummaryLoading(true);
    try {
      const data = await getAIHealthSummary(session.access_token);
      setAiSummary(data.summary);
      setAiSummaryTags(data.tags);
    } catch (err: any) {
      console.warn('Failed to load AI health summary:', err.message);
      setAiSummary('Stable metrics today. Add more water, meals, and sleep logs to compile custom health insights.');
      setAiSummaryTags([
        { label: 'Vitals stable', color: 'success' },
        { label: 'Ready', color: 'accentBlue' }
      ]);
    } finally {
      setAiSummaryLoading(false);
    }
  }, [session?.access_token]);

  const loadData = () => {
    if (session?.access_token) {
      const today = new Date().toISOString().split('T')[0];

      loadAiSummary();

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

      getWeeklyTrend(session.access_token)
        .then(setWeeklyTrend)
        .catch(err => console.warn('Failed to load weekly trend on Dashboard:', err));

      getWeeklyStats(session.access_token, today)
        .then(setWeeklyActivity)
        .catch(err => console.warn('Failed to load weekly stats on Dashboard:', err));

      getMedications(session.access_token)
        .then(setMedications)
        .catch(err => console.warn('Failed to load medications on Dashboard:', err));

      getMedicationLogsForDate(session.access_token, today)
        .then(setMedicationLogs)
        .catch(err => console.warn('Failed to load medication logs on Dashboard:', err));

      getDashboardHealthScore(session.access_token)
        .then(setHealthScore)
        .catch(err => console.warn('Failed to load health score on Dashboard:', err));

      relationshipApi.listRelationships(session.access_token)
        .then(setRelationships)
        .catch(err => console.warn('Failed to load relationships on Dashboard:', err));

      getLatestCycle(session.access_token)
        .then(setCycleData)
        .catch(err => console.warn('Failed to load cycle data on Dashboard:', err));

      getMoodLogs(session.access_token, today, today)
        .then(setMoodLogs)
        .catch(err => console.warn('Failed to load mood logs on Dashboard:', err));

      getSymptomsLogs(session.access_token, today, today)
        .then(setSymptomsLogs)
        .catch(err => console.warn('Failed to load symptoms logs on Dashboard:', err));

      getPeriodLogs(session.access_token)
        .then(setPeriodLogs)
        .catch(err => console.warn('Failed to load period logs on Dashboard:', err));
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!session?.access_token) return;
    setRefreshing(true);
    const today = new Date().toISOString().split('T')[0];
    await Promise.allSettled([
      loadAiSummary(),
      getSleepLogs(session.access_token).then(setSleepLogs),
      getWeightLogs(session.access_token).then(setWeightLogs),
      getMealsForDate(session.access_token, today).then(setMealsData),
      getWaterForDate(session.access_token, today).then(setWaterData),
      getCalorieGoal(session.access_token).then(setNutritionGoal),
      getTodaySummary(session.access_token, today).then(setActivitySummary),
      getActivityGoal(session.access_token).then(setActivityGoal),
      getWaterChallenge(session.access_token, 5).then(setWaterChallenge),
      getWeeklyTrend(session.access_token).then(setWeeklyTrend),
      getWeeklyStats(session.access_token, today).then(setWeeklyActivity),
      getMedications(session.access_token).then(setMedications),
      getMedicationLogsForDate(session.access_token, today).then(setMedicationLogs),
      getDashboardHealthScore(session.access_token).then(setHealthScore),
      relationshipApi.listRelationships(session.access_token).then(setRelationships),
      getLatestCycle(session.access_token).then(setCycleData),
      getMoodLogs(session.access_token, today, today).then(setMoodLogs),
      getSymptomsLogs(session.access_token, today, today).then(setSymptomsLogs),
      getPeriodLogs(session.access_token).then(setPeriodLogs),
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
          <Text style={{ color: theme.colors.textMuted, fontSize: Typography.xs }}>Not enough weight data to show trend</Text>
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
              <Stop offset="0" stopColor={theme.colors.teal} stopOpacity="0.3" />
              <Stop offset="1" stopColor={theme.colors.teal} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d={pathData}
            fill="none"
            stroke={theme.colors.teal}
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

  // Compute weekly trends from real data
  const weeklyTrendsData = useMemo(() => {
    const now = new Date();
    const result: { metric: string; value: string; change: string; color: string }[] = [];

    // Calories — from getWeeklyTrend API
    if (weeklyTrend.length > 0) {
      const totalCals = weeklyTrend.reduce((s, d) => s + d.val, 0);
      const avgCals = Math.round(totalCals / weeklyTrend.length);
      const firstHalf = weeklyTrend.slice(0, 3);
      const secondHalf = weeklyTrend.slice(-3);
      const avgFirst = firstHalf.reduce((s, d) => s + d.val, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, d) => s + d.val, 0) / secondHalf.length;
      const calPct = avgFirst > 0 ? Math.round(((avgSecond - avgFirst) / avgFirst) * 100) : 0;
      const calSign = calPct > 0 ? '↑' : '↓';
      result.push({ metric: 'Calories', value: `${avgCals.toLocaleString()} kcal`, change: `${calSign} ${Math.abs(calPct)}%`, color: theme.colors.teal });
    }

    // Weight — from weightLogs
    if (weightLogs.length > 0) {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const thisWeek = weightLogs.filter(w => new Date(w.date) >= sevenDaysAgo);
      const lastWeek = weightLogs.filter(w => new Date(w.date) >= fourteenDaysAgo && new Date(w.date) < sevenDaysAgo);
      const avgThis = thisWeek.length > 0 ? thisWeek.reduce((s, w) => s + w.weight_kg, 0) / thisWeek.length : 0;
      const avgLast = lastWeek.length > 0 ? lastWeek.reduce((s, w) => s + w.weight_kg, 0) / lastWeek.length : 0;
      const weightDiff = avgLast > 0 ? (avgThis - avgLast).toFixed(1) : '0';
      const weightSign = Number(weightDiff) > 0 ? '↑' : '↓';
      result.push({ metric: 'Weight', value: `${avgThis.toFixed(1)} kg`, change: `${weightSign} ${Math.abs(Number(weightDiff))}kg`, color: theme.colors.pink });
    }

    // Steps — from getWeeklyStats API
    if (weeklyActivity?.days && weeklyActivity.days.length > 0) {
      const totalSteps = weeklyActivity.days.reduce((s, d) => s + d.steps, 0);
      const avgSteps = Math.round(totalSteps / weeklyActivity.days.length);
      const firstHalf = weeklyActivity.days.slice(0, 3);
      const secondHalf = weeklyActivity.days.slice(-3);
      const avgFirst = firstHalf.reduce((s, d) => s + d.steps, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, d) => s + d.steps, 0) / secondHalf.length;
      const stepsPct = avgFirst > 0 ? Math.round(((avgSecond - avgFirst) / avgFirst) * 100) : 0;
      const stepsSign = stepsPct > 0 ? '↑' : '↓';
      result.push({ metric: 'Steps', value: `${avgSteps.toLocaleString()} steps`, change: `${stepsSign} ${Math.abs(stepsPct)}%`, color: theme.colors.amber });
    }

    // Sleep — from sleepLogs
    if (sleepLogs.length > 0) {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const thisWeek = sleepLogs.filter(s => new Date(s.date) >= sevenDaysAgo);
      const lastWeek = sleepLogs.filter(s => new Date(s.date) >= fourteenDaysAgo && new Date(s.date) < sevenDaysAgo);
      const avgThis = thisWeek.length > 0 ? thisWeek.reduce((s, l) => s + l.sleep_hr, 0) / thisWeek.length : 0;
      const avgLast = lastWeek.length > 0 ? lastWeek.reduce((s, l) => s + l.sleep_hr, 0) / lastWeek.length : 0;
      const sleepPct = avgLast > 0 ? Math.round(((avgThis - avgLast) / avgLast) * 100) : 0;
      const sleepSign = sleepPct > 0 ? '↑' : '↓';
      result.push({ metric: 'Sleep', value: `${avgThis.toFixed(1)} hrs`, change: `${sleepSign} ${Math.abs(sleepPct)}%`, color: theme.colors.accentBlue });
    }

    // Hydration — placeholder until backend endpoint exists
    result.push({ metric: 'Hydration', value: '— L', change: '—', color: theme.colors.blue });

    return result;
  }, [weeklyTrend, weightLogs, weeklyActivity, sleepLogs]);

  return (
    <View style={styles.root}>
      {/* ─── SCROLLABLE CONTENT ─── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={handleScroll} scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.teal, theme.colors.pink]} tintColor={theme.colors.teal} progressBackgroundColor={theme.colors.bgCard} />}>

        {/* ─── HERO SURFACE — extends from the very top ─── */}
        <Animated.View style={[styles.heroSurface, { paddingTop: insets.top, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          onLayout={(e) => { heroHeightRef.current = e.nativeEvent.layout.height; }}>

          {/* ── Greeting + Notifications ── */}
          <View style={styles.heroTopBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroDate}>{todayDateStr}</Text>
              <Text style={styles.heroGreeting} numberOfLines={1}>
                Hi, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
              </Text>
            </View>
            <View style={styles.heroTopBarActions}>
              <NotificationIconButton onPress={onNotificationsPress} unreadCount={unreadCount} iconColor={theme.colors.white} />
              <ProfileAvatarButton
                onPress={onProfilePress}
                userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                avatarUrl={user?.user_metadata?.avatar_url}
              />
            </View>
          </View>

          {/* ── Search Bar ── */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <TouchableOpacity style={styles.searchBarInput} activeOpacity={0.8} onPress={handleSearchPress}>
                <Search size={18} color={theme.colors.white + '60'} strokeWidth={2} />
                <Text style={styles.searchPlaceholder}>Ask anything about your health...</Text>
              </TouchableOpacity>
              <View style={styles.searchActions}>
                <TouchableOpacity style={styles.searchActionBtn} onPress={handleVoicePress}>
                  <Mic size={18} color={isListening ? theme.colors.pink : theme.colors.white + '60'} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.searchActionBtn} onPress={handleCameraPress}>
                  <Camera size={18} color={theme.colors.white + '60'} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Health Score + Overview ── */}
          <View style={styles.heroOverviewRow}>
            <View style={styles.heroScoreArea}>
              <HeroScoreRing score={healthScore?.score ?? 38} />
            </View>
            <View style={styles.heroOverviewText}>
              <Text style={styles.heroOverviewLabel}>Health Record Overview</Text>
              <Text style={[styles.heroOverviewSub, { marginBottom: healthScore?.isLimitedData ? 0 : Spacing.sm }]}>Showing data from past week</Text>
              {healthScore?.isLimitedData && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                  <TriangleAlert size={12} color={theme.colors.amber} />
                  <Text style={[styles.heroOverviewSub, { marginBottom: 0, marginLeft: 4 }]}>Limited data available</Text>
                </View>
              )}
              <TouchableOpacity style={styles.heroReportBtn} onPress={() => Alert.alert('Coming Soon', 'Full health report is under development and will be available soon!')}>
                <Text style={styles.heroReportBtnText}>Full Report</Text>
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
            </View>
            {aiSummaryLoading ? (
              <View style={{ paddingVertical: Spacing.sm }}>
                <LoadingSpinner size="small" color={theme.colors.white} text="Updating health metrics..." />
              </View>
            ) : (
              <>
                <Text style={styles.heroAiText}>
                  {aiSummary}
                </Text>
                <View style={styles.heroAiTagRow}>
                  {aiSummaryTags.map((tag, i) => {
                    const mappedColor = (theme.colors as any)[tag.color] || theme.colors.teal;
                    return (
                      <View key={i} style={[styles.heroAiTag, { backgroundColor: mappedColor + '15', borderColor: mappedColor + '40' }]}>
                        <Text style={[styles.heroAiTagText, { color: mappedColor }]}>● {tag.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>

        </Animated.View>

        {showBanner && (
          <ProfileCompletionBanner
            percentage={percentage}
            onSkip={() => setBannerDismissed(true)}
            onComplete={() => onCompleteProfile?.()}
          />
        )}



        {/* SECTION: RELATIONSHIPS */}
        <SectionHeader
          title="Active Relationships"
          subtitle="Shared health &amp; activity"
          action="Manage"
          onAction={onRelationshipsPress}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relationshipsScroll}>
          {relationships
            .filter(r => r.status === 'accepted')
            .map(partner => (
              <TouchableOpacity
                key={partner.relationship_id}
                style={styles.partnerCard}
                onPress={() => {
                  if (partner.role === 'viewer' && onPartnerPress) {
                    onPartnerPress(String(partner.relationship_id));
                  } else if (partner.role === 'owner' && onRelationshipsPress) {
                    onRelationshipsPress();
                  }
                }}
              >
                <View style={styles.partnerAvatarContainer}>
                  <View style={styles.partnerAvatarImagePlaceholder}>
                    <Text style={styles.partnerInitials}>{partner.partner.avatar.charAt(0)}</Text>
                  </View>
                  <View style={[styles.partnerStatusDot, { backgroundColor: theme.colors.success }]} />
                </View>
                <Text style={styles.partnerName} numberOfLines={1}>{partner.partner.name}</Text>
                <Text style={styles.partnerRelation}>
                  {partner.relationship_type.charAt(0).toUpperCase() + partner.relationship_type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          <TouchableOpacity
            style={styles.partnerCard}
            onPress={onRelationshipsPress}
          >
            <View style={styles.partnerAvatarContainer}>
              <View style={[styles.partnerAvatarImagePlaceholder, { backgroundColor: theme.colors.teal + '20', borderWidth: 1, borderColor: theme.colors.teal + '50', borderStyle: 'dashed' }]}>
                <Text style={{ fontSize: 20, color: theme.colors.teal }}>+</Text>
              </View>
            </View>
            <Text style={styles.partnerName} numberOfLines={1}>Add New</Text>
            <Text style={styles.partnerRelation}>Invite</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* SECTION: REDESIGNED QUICK ACTIONS */}
        <SectionHeader title="Quick Actions" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionScroll}>
          {[
            { icon: <Stethoscope size={20} color={theme.colors.teal} />, label: 'Log Health', desc: 'Add health log', color: theme.colors.teal, onPress: () => onOpenHealthLog?.() },
            { icon: <Utensils size={20} color={theme.colors.amber} />, label: 'Log Meal', desc: 'Record calories', color: theme.colors.amber, onPress: () => setShowMealModal(true) },
            { icon: <Droplets size={20} color={theme.colors.blue} />, label: 'Log Water', desc: 'Add a glass', color: theme.colors.blue, onPress: () => setShowWaterModal(true) },
            { icon: <Dumbbell size={20} color={theme.colors.accentBlue} />, label: 'Log Workout', desc: 'Track activity', color: theme.colors.accentBlue, onPress: () => navigateToTab?.('Activity') },
            { icon: <Pill size={20} color={theme.colors.pink} />, label: 'Medicine', desc: 'Check dose', color: theme.colors.pink, onPress: () => setShowMedModal(true) },
            { icon: <Scale size={20} color={theme.colors.teal} />, label: 'Log Weight', desc: 'Record metric', color: theme.colors.teal, onPress: () => setShowWeightModal(true) },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.quickActionCard} onPress={action.onPress}>
              <View style={[styles.quickActionIconBg, { backgroundColor: action.color + '15', borderColor: action.color + '30' }]}>
                {action.icon}
              </View>
              <View style={styles.quickActionTextContent}>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionDesc}>{action.desc}</Text>
              </View>
              <Text style={[styles.quickActionPlus, { color: action.color }]}>+</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SECTION: CYCLE SUMMARY (female only) */}
        {gender === 'female' && (
          <>
            <SectionHeader
              title="Cycle Summary"
              subtitle="Your cycle at a glance"
            />
            {cycleData ? (
              <GlassCardView style={{ padding: Spacing.lg, marginBottom: Spacing.lg }}>
                {/* Top section: phase info left + circular ring right */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
                  {/* Left - phase info */}
                  <View style={{ flex: 1, paddingRight: Spacing.lg }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cycleData.phase_color, marginRight: 8 }} />
                      <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.colors.textPrimary }}>
                        {cycleData.current_phase} Phase
                      </Text>
                    </View>
                    <Text style={{ fontSize: Typography.sm, color: theme.colors.textSecondary, marginBottom: 12 }}>
                      Day {cycleData.current_cycle_day} of {cycleData.cycle_length}
                    </Text>

                    {/* Progress bar */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.colors.bgCardBorder, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${Math.min((cycleData.current_cycle_day / cycleData.cycle_length) * 100, 100)}%`, borderRadius: 3, backgroundColor: cycleData.phase_color }} />
                      </View>
                      <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: theme.colors.textPrimary, marginLeft: 8 }}>
                        {Math.round((cycleData.current_cycle_day / cycleData.cycle_length) * 100)}%
                      </Text>
                    </View>

                    {/* Quick stats */}
                    <View style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color={theme.colors.textMuted} />
                        <Text style={{ fontSize: Typography.xs, color: theme.colors.textSecondary }}>
                          {cycleData.days_until_next_period} days to next period
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Flower2 size={14} color={theme.colors.textMuted} />
                        <Text style={{ fontSize: Typography.xs, color: theme.colors.textSecondary }}>
                          {cycleData.is_fertile ? 'Fertile window' : 'Not in fertile window'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Right - circular ring */}
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 100, height: 100 }}>
                      <Svg width={100} height={100} viewBox="0 0 100 100">
                        <Circle cx={50} cy={50} r={40} fill="none" stroke={theme.colors.bgCardBorder} strokeWidth={8} />
                        <Circle
                          cx={50}
                          cy={50}
                          r={40}
                          fill="none"
                          stroke={cycleData.phase_color}
                          strokeWidth={8}
                          strokeDasharray={`${(cycleData.current_cycle_day / cycleData.cycle_length) * 251.2} 251.2`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </Svg>
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22, fontWeight: Typography.extraBold, color: theme.colors.textPrimary, lineHeight: 26 }}>
                          {cycleData.cycle_length}
                        </Text>
                        <Text style={{ fontSize: 9, color: theme.colors.textSecondary }}>Day Cycle</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: Radius.sm, backgroundColor: theme.colors.bgCardBorder }}
                      onPress={() => navigateToTab?.('Health')}
                      activeOpacity={0.7}>
                      <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>Avg: {cycleData.avg_cycle_length} days</Text>
                      <ArrowRight size={10} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Cycle Outlook */}
                <View style={{ marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md }}>
                    <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.colors.textPrimary }}>Cycle Outlook</Text>
                    <Info size={14} color={theme.colors.textMuted} />
                  </View>

                  {/* Next Period card */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.chipBg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.pink + '15', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md }}>
                      <Droplets size={20} color={theme.colors.pink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: Typography.xs, color: theme.colors.textSecondary, marginBottom: 2 }}>Next Period</Text>
                      <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.colors.textPrimary }}>
                        {(() => {
                          const nextStart = new Date(cycleData.start_date + 'T12:00:00');
                          nextStart.setDate(nextStart.getDate() + cycleData.cycle_length);
                          const nextEnd = new Date(nextStart);
                          nextEnd.setDate(nextEnd.getDate() + cycleData.period_length - 1);
                          const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return `${fmt(nextStart)} – ${fmt(nextEnd)}`;
                        })()}
                      </Text>
                    </View>
                    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: Radius.sm, backgroundColor: theme.colors.pink + '12' }}>
                      <Text style={{ fontSize: 11, fontWeight: Typography.bold, color: theme.colors.pink }}>
                        {cycleData.days_until_next_period}–{cycleData.days_until_next_period + cycleData.period_length - 1} days
                      </Text>
                    </View>
                  </View>

                  {/* Fertile Window card */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.chipBg, borderRadius: Radius.md, padding: Spacing.md }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accentBlue + '15', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md }}>
                      <Target size={20} color={cycleData.is_fertile ? theme.colors.success : theme.colors.accentBlue} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: Typography.xs, color: theme.colors.textSecondary, marginBottom: 2 }}>Fertile Window</Text>
                      <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.colors.textPrimary }}>
                        {(() => {
                          const cycleStart = new Date(cycleData.start_date + 'T12:00:00');
                          const fertileStart = new Date(cycleStart);
                          fertileStart.setDate(cycleStart.getDate() + cycleData.fertile_window_start - 1);
                          const fertileEnd = new Date(cycleStart);
                          fertileEnd.setDate(cycleStart.getDate() + cycleData.fertile_window_end - 1);
                          const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return `${fmt(fertileStart)} – ${fmt(fertileEnd)}`;
                        })()}
                      </Text>
                    </View>
                    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: Radius.sm, backgroundColor: cycleData.is_fertile ? theme.colors.success + '12' : theme.colors.accentBlue + '12' }}>
                      <Text style={{ fontSize: 11, fontWeight: Typography.bold, color: cycleData.is_fertile ? theme.colors.success : theme.colors.accentBlue }}>
                        {cycleData.is_fertile ? 'Likely' : 'Unlikely'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: theme.colors.accentBlue + '30', backgroundColor: theme.colors.accentBlue + '10', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onPress={() => onOpenHealthLog?.()}
                    activeOpacity={0.7}>
                    <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.colors.accentBlue }}>Log Health</Text>
                    <ArrowRight size={14} color={theme.colors.accentBlue} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: theme.colors.accentBlue + '30', backgroundColor: theme.colors.accentBlue + '10', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onPress={() => navigateToTab?.('Health')}
                    activeOpacity={0.7}>
                    <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.colors.accentBlue }}>View Details</Text>
                    <ArrowRight size={14} color={theme.colors.accentBlue} />
                  </TouchableOpacity>
                </View>
              </GlassCardView>
            ) : (
              <GlassCardView style={{ padding: Spacing.xl, marginBottom: Spacing.lg, alignItems: 'center' }}>
                <Flower2 size={40} color={theme.colors.textMuted} />
                <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: theme.colors.textPrimary, marginBottom: Spacing.xs }}>
                  No Cycle Data
                </Text>
                <Text style={{ fontSize: Typography.sm, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 20 }}>
                  Log your period to start tracking your cycle.
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: theme.colors.accentBlue + '20', borderWidth: 1, borderColor: theme.colors.accentBlue + '50', borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}
                  onPress={() => onOpenHealthLog?.()}
                  activeOpacity={0.7}>
                  <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.colors.accentBlue }}>Get Started →</Text>
                </TouchableOpacity>
              </GlassCardView>
            )}
          </>
        )}

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
                    <Text style={styles.progressCardTitle}>Calories</Text>
                    <CompactRing size={82} progress={calPct} color={theme.colors.amber}>
                      <Text style={styles.progressVal}>{consumedCal.toLocaleString()}</Text>
                      <Text style={styles.progressSub}>/ {calorieTarget.toLocaleString()} kcal</Text>
                    </CompactRing>
                    <Text style={[styles.progressPct, { color: theme.colors.amber }]}>{Math.round(calPct * 100)}%</Text>
                  </GlassCardView>
                </TouchableOpacity>

                <TouchableOpacity style={styles.progressCard} activeOpacity={0.7} onPress={() => navigateToTab?.('Diet')}>
                  <GlassCardView style={{ padding: Spacing.md, alignItems: 'center' }}>
                    <Text style={styles.progressCardTitle}>Water</Text>
                    <CompactRing size={82} progress={waterPct} color={theme.colors.blue}>
                      <Text style={styles.progressVal}>{consumedWater.toLocaleString()}</Text>
                      <Text style={styles.progressSub}>/ {waterTarget.toLocaleString()} ml</Text>
                    </CompactRing>
                    <Text style={[styles.progressPct, { color: theme.colors.blue }]}>{Math.round(waterPct * 100)}%</Text>
                  </GlassCardView>
                </TouchableOpacity>

                <TouchableOpacity style={styles.progressCard} activeOpacity={0.7} onPress={() => navigateToTab?.('Health')}>
                  <GlassCardView style={{ padding: Spacing.md, alignItems: 'center' }}>
                    <Text style={styles.progressCardTitle}>Sleep</Text>
                    <CompactRing size={82} progress={sleepPct} color={theme.colors.accentBlue}>
                      <Text style={styles.progressVal}>{sleepHrs > 0 ? sleepHrs : '—'}</Text>
                      <Text style={styles.progressSub}>/ {sleepTarget} hrs</Text>
                    </CompactRing>
                    <Text style={[styles.progressPct, { color: theme.colors.accentBlue }]}>{sleepHrs > 0 ? `${Math.round(sleepPct * 100)}%` : '—'}</Text>
                  </GlassCardView>
                </TouchableOpacity>

                <TouchableOpacity style={styles.progressCard} activeOpacity={0.7} onPress={() => navigateToTab?.('Activity')}>
                  <GlassCardView style={{ padding: Spacing.md, alignItems: 'center' }}>
                    <Text style={styles.progressCardTitle}>Workout</Text>
                    <CompactRing size={82} progress={exercisePct} color={theme.colors.teal}>
                      <Text style={styles.progressVal}>{exerciseMin}</Text>
                      <Text style={styles.progressSub}>/ {exerciseTarget} min</Text>
                    </CompactRing>
                    <Text style={[styles.progressPct, { color: theme.colors.teal }]}>{Math.round(exercisePct * 100)}%</Text>
                  </GlassCardView>
                </TouchableOpacity>
              </>
            );
          })()}
        </View>

        {/* SECTION: WEEKLY CHALLENGE */}
        {/* SECTION: TODAY'S MEDICATIONS */}
        <SectionHeader title="Today's Medications" />
        <View style={styles.medList}>
          {medicationsData.slice(0, showAllMeds ? medicationsData.length : 5).map((med) => (
            <View key={med.id} style={[styles.medItem, styles.medItemBorder]}>
              <TouchableOpacity
                style={[styles.medCheck, med.taken && { backgroundColor: theme.colors.success, borderColor: theme.colors.success }]}
                onPress={() => {
                  const today = new Date().toISOString().split('T')[0];
                  if (med.taken) {
                    removeMedicationLog(session?.access_token || '', med.id, today)
                      .then(() => setMedicationLogs(prev => prev.filter(l => !(l.medicine_id === med.id && l.date === today))))
                      .catch(err => console.warn('Failed to remove medication log:', err));
                  } else {
                    logMedicationTaken(session?.access_token || '', med.id, today)
                      .then(log => setMedicationLogs(prev => [...prev, log]))
                      .catch(err => console.warn('Failed to log medication:', err));
                  }
                }}
                activeOpacity={0.7}
              >
                {med.taken && <Check size={14} color={theme.colors.bg} strokeWidth={3} />}
              </TouchableOpacity>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <View style={[styles.medPurposeBadge, { backgroundColor: med.color + '18', borderColor: med.color + '40' }]}>
                  <Text style={[styles.medPurposeText, { color: med.color }]}>{med.purpose}</Text>
                </View>
                <Text style={styles.medDose}>{med.dose} · {med.time}</Text>
              </View>
              <View style={[styles.medIndicator, { backgroundColor: med.color }]} />
            </View>
          ))}
        </View>
        {medicationsData.length > 5 && (
          <TouchableOpacity
            style={styles.medShowAllBtn}
            onPress={() => setShowAllMeds(!showAllMeds)}
            activeOpacity={0.7}
          >
            <Text style={styles.medShowAllText}>
              {showAllMeds ? 'Show Less' : `Show All ${medicationsData.length} Medications`}
            </Text>
          </TouchableOpacity>
        )}

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
              <View style={[styles.weightTrendBadge, { backgroundColor: theme.colors.success + '15' }]}>
                <Text style={{ color: theme.colors.success, fontSize: Typography.xs, fontWeight: Typography.bold }}>
                  {weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg <= 0 ? '↓' : '↑'}{' '}
                  {Math.abs(weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg).toFixed(1)} kg
                </Text>
              </View>
            )}
          </View>
          {sparklineElement}
        </GlassCardView>

        {/* SECTION: TODAY'S VITALS */}
        {!hideVitals && <VitalsDashboardSection />}

        {/* SECTION: SLEEP TRACKER */}
        <SleepTrackerSection sleepLogs={sleepLogs} />

        {/* SECTION: NEXT APPOINTMENT */}
        <SectionHeader title="Next Appointment" />
        {nextAppointment ? (
          <GlassCardView style={styles.aptCard}>
            <View style={styles.aptRow}>
              <View style={styles.aptAvatar}><UserRound size={24} color={theme.colors.teal} /></View>
              <View style={styles.aptInfo}>
                <Text style={styles.aptName}>{nextAppointment.doctor_name}</Text>
                <Text style={styles.aptSpec}>{nextAppointment.speciality}</Text>
                <View style={styles.aptTimeBadge}>
                  <Calendar size={14} color={theme.colors.teal} />
                  <Text style={styles.aptTimeText}>{formatDashboardDate(nextAppointment.date_with_time)}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.aptBtn} onPress={onOpenAppointments}>
              <Text style={styles.aptBtnText}>View Details →</Text>
            </TouchableOpacity>
          </GlassCardView>
        ) : (
          <GlassCardView style={styles.aptCard}>
            <View style={styles.aptEmpty}>
              <Calendar size={40} color={theme.colors.textMuted} />
              <Text style={styles.aptEmptyText}>No upcoming appointments</Text>
              <TouchableOpacity style={styles.aptAddBtn} onPress={onOpenAppointments} activeOpacity={0.7}>
                <Text style={styles.aptAddBtnText}>+ Add Appointment</Text>
              </TouchableOpacity>
            </View>
          </GlassCardView>
        )}

        {/* SECTION: HEALTH AGE CARD
        <SectionHeader title="Biological Age" />
        <GlassCardView style={styles.ageCard} accentColor={theme.colors.teal}>
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
        </GlassCardView> */}

        {/* SECTION: SMALL CARD WEEKLY TRENDS */}
        <SectionHeader title="Weekly Trends (7d Averages)" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendsScroll}>
          {weeklyTrendsData.map((item, index) => (
            <GlassCardView key={index} style={styles.trendMetricCard}>
              <Text style={styles.trendMetricName}>{item.metric}</Text>
              <Text style={styles.trendMetricValue}>{item.value}</Text>
              <Text style={[styles.trendMetricChange, { color: item.change.includes('0%') ? theme.colors.textPrimary : item.change.includes('↑') ? theme.colors.success : theme.colors.danger }]}>
                {item.change}
              </Text>
            </GlassCardView>
          ))}
        </ScrollView>

        {/* SECTION: COMMUNITY PREVIEW */}
        {!hideCommunitySpotlight && (<>
          <SectionHeader title="Community Spotlight" action="Join Groups" onAction={() => Alert.alert('Coming Soon', 'Community groups are under development and will be available soon!')} />
          <GlassCardView style={styles.communityCard}>
            <View style={styles.communityPost}>
              <Text style={styles.communityPostAuthor}>Jane Cooper shared a post in running group:</Text>
              <Text style={styles.communityPostText}>"Just completed the morning 5k. Lungs feel great, recovery speed is getting better! 🏃‍♀️✨"</Text>
              <Text style={styles.communityPostLikes}>❤️ 24 likes  ·  💬 8 comments</Text>
            </View>
          </GlassCardView>
        </>)}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* WEIGHT LOG MODAL */}
      <Modal visible={showWeightModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Log Weight</Text>
            <Text style={styles.modalSub}>Enter your current weight in kg</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="e.g. 62.5"
              placeholderTextColor={theme.colors.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWeightModal(false)}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveWeight}>
                <Text style={{ color: theme.colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* MEAL LOG MODAL */}
      <Modal visible={showMealModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Log Meal</Text>
            <Text style={styles.modalSub}>Record what you ate</Text>

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setMealType(type)}
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.sm,
                    borderRadius: Radius.md,
                    alignItems: 'center',
                    backgroundColor: mealType === type ? theme.colors.teal + '20' : theme.colors.bgCardBorder,
                    borderWidth: mealType === type ? 1 : 0,
                    borderColor: theme.colors.teal,
                  }}>
                  <Text style={{ fontSize: Typography.xs, color: mealType === type ? theme.colors.teal : theme.colors.textSecondary, fontWeight: Typography.bold, textTransform: 'capitalize' }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={styles.modalInput} value={mealFood} onChangeText={setMealFood} placeholder="Food name *" placeholderTextColor={theme.colors.textMuted} />
            <TextInput style={styles.modalInput} value={mealCalories} onChangeText={setMealCalories} keyboardType="number-pad" placeholder="Calories (kcal)" placeholderTextColor={theme.colors.textMuted} />

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TextInput style={[styles.modalInput, { flex: 1 }]} value={mealProtein} onChangeText={setMealProtein} keyboardType="number-pad" placeholder="Protein (g)" placeholderTextColor={theme.colors.textMuted} />
              <TextInput style={[styles.modalInput, { flex: 1 }]} value={mealCarbs} onChangeText={setMealCarbs} keyboardType="number-pad" placeholder="Carbs (g)" placeholderTextColor={theme.colors.textMuted} />
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TextInput style={[styles.modalInput, { flex: 1 }]} value={mealFat} onChangeText={setMealFat} keyboardType="number-pad" placeholder="Fat (g)" placeholderTextColor={theme.colors.textMuted} />
              <TextInput style={[styles.modalInput, { flex: 1 }]} value={mealFiber} onChangeText={setMealFiber} keyboardType="number-pad" placeholder="Fiber (g)" placeholderTextColor={theme.colors.textMuted} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMealModal(false)}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveMeal} disabled={modalSaving}>
                {modalSaving ? <ActivityIndicator size="small" color={theme.colors.bg} /> : <Text style={{ color: theme.colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* WATER LOG MODAL */}
      <Modal visible={showWaterModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Log Water</Text>
            <Text style={styles.modalSub}>How much water did you drink?</Text>

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {[200, 250, 300, 500].map(amount => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => setWaterAmount(String(amount))}
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.sm,
                    borderRadius: Radius.md,
                    alignItems: 'center',
                    backgroundColor: waterAmount === String(amount) ? theme.colors.blue + '20' : theme.colors.bgCardBorder,
                    borderWidth: waterAmount === String(amount) ? 1 : 0,
                    borderColor: theme.colors.blue,
                  }}>
                  <Text style={{ fontSize: Typography.xs, color: waterAmount === String(amount) ? theme.colors.blue : theme.colors.textSecondary, fontWeight: Typography.bold }}>{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={styles.modalInput} value={waterAmount} onChangeText={setWaterAmount} keyboardType="number-pad" placeholder="Custom amount (ml)" placeholderTextColor={theme.colors.textMuted} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWaterModal(false)}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: theme.colors.blue }]} onPress={handleSaveWater} disabled={modalSaving}>
                {modalSaving ? <ActivityIndicator size="small" color={theme.colors.bg} /> : <Text style={{ color: theme.colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MEDICINE MODAL */}
      <Modal visible={showMedModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Log Medicine</Text>
            <Text style={styles.modalSub}>Track your medication intake</Text>

            <TextInput style={styles.modalInput} placeholder="Medicine name" placeholderTextColor={theme.colors.textMuted} />
            <TextInput style={styles.modalInput} placeholder="Dosage (e.g. 500 mg)" placeholderTextColor={theme.colors.textMuted} />

            <View style={{ backgroundColor: theme.colors.pink + '15', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: theme.colors.pink + '30' }}>
              <Text style={{ fontSize: Typography.xs, color: theme.colors.pink, fontWeight: Typography.bold, textAlign: 'center' }}>Feature coming soon</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMedModal(false)}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semiBold }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
