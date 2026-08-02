import React, { useEffect, useRef, useReducer, useCallback } from 'react';
import { View, StatusBar, StyleSheet, SafeAreaView, BackHandler } from 'react-native';
import { Colors } from './src/theme/theme';
import TabBar, { TabName } from './src/navigation/TabBar';
import { ScrollVisibilityProvider, useScrollVisibility } from './src/navigation/ScrollVisibilityContext';
import DashboardScreen from './src/screens/home/DashboardScreen';
import HealthScreen from './src/screens/health/HealthScreen';
import FitnessScreen from './src/screens/fitness/FitnessScreen';
import CalorieScreen from './src/screens/diet/CalorieScreen';
import AIAdvisorScreen from './src/screens/ai/AIAdvisorScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import ProfileSetupScreen from './src/screens/profile/ProfileSetupScreen';
import WorkoutLogScreen from './src/screens/fitness/WorkoutLogScreen';
import HealthLogScreen, { HealthLogDraft } from './src/screens/health/HealthLogScreen';
import PartnerHealthReportScreen from './src/screens/relationships/PartnerHealthReportScreen';
import RelationshipsScreen from './src/screens/relationships/RelationshipsScreen';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { PreferencesProvider } from './src/providers/PreferencesContext';
import { NotificationProvider, useNotifications } from './src/providers/NotificationContext';
import { ReminderProvider } from './src/providers/ReminderContext';
import { AppointmentProvider } from './src/providers/AppointmentContext';
import { ThemeProvider, useTheme } from './src/providers/ThemeProvider';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import { AuthStack } from './src/navigation/AuthStack';
import LoadingScreen from './src/components/LoadingScreen';
import ErrorScreen from './src/screens/error/ErrorScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import { NetworkProvider } from './src/services/networkService';
import OfflineBanner from './src/components/OfflineBanner';
const Stack = createNativeStackNavigator();

const MAIN_TABS: TabName[] = ['Home', 'Health', 'AI', 'Activity', 'Diet'];
const OVERLAY_TABS: TabName[] = ['Profile', 'Notifications', 'WorkoutLog', 'HealthLog', 'PartnerReport', 'Relationships'];

// ── Reducer ──────────────────────────────────────────────────────────

type AppState = {
  activeTab: TabName;
  previousTab: TabName;
  aiStartInChat: boolean;
  aiOrigin: TabName | null;
  aiInitialQuery: string;
  showProfileSetup: boolean;
  profileSection: string | null;
  workoutLogExercise: any;
  lastHealthLog: HealthLogDraft | null;
  selectedPartnerRelationshipId: string | null;
};

type AppAction =
  | { type: 'SWITCH_TAB'; tab: TabName }
  | { type: 'OPEN_AI'; from?: TabName; startInChat?: boolean; initialQuery?: string }
  | { type: 'OPEN_PROFILE'; section?: string }
  | { type: 'OPEN_NOTIFICATIONS' }
  | { type: 'OPEN_PROFILE_SETUP' }
  | { type: 'CLOSE_PROFILE_SETUP' }
  | { type: 'OPEN_WORKOUT_LOG'; exercise: any }
  | { type: 'CLOSE_WORKOUT_LOG' }
  | { type: 'OPEN_HEALTH_LOG' }
  | { type: 'CLOSE_HEALTH_LOG' }
  | { type: 'OPEN_PARTNER_REPORT'; partnerId: string }
  | { type: 'OPEN_RELATIONSHIPS' }
  | { type: 'CLOSE_OVERLAY' }
  | { type: 'SAVE_HEALTH_LOG'; log: HealthLogDraft };

const INITIAL_STATE: AppState = {
  activeTab: 'Home',
  previousTab: 'Home',
  aiStartInChat: false,
  aiOrigin: null,
  aiInitialQuery: '',
  showProfileSetup: false,
  profileSection: null,
  workoutLogExercise: null,
  lastHealthLog: null,
  selectedPartnerRelationshipId: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SWITCH_TAB':
      return { ...state, previousTab: state.activeTab, activeTab: action.tab };

    case 'OPEN_AI':
      return {
        ...state,
        previousTab: state.activeTab,
        activeTab: 'AI',
        // Only record a foreign origin when explicitly provided (e.g. Home quick-action → AI).
        // Direct tab-bar taps pass from=undefined → null, so back returns to AI overview.
        aiOrigin: action.from !== undefined ? action.from : null,
        aiStartInChat: action.startInChat ?? false,
        aiInitialQuery: action.initialQuery ?? '',
      };

    case 'OPEN_PROFILE':
      return { ...state, previousTab: state.activeTab, activeTab: 'Profile', profileSection: (action as any).section || null };

    case 'OPEN_NOTIFICATIONS':
      return { ...state, previousTab: state.activeTab, activeTab: 'Notifications' };

    case 'OPEN_PROFILE_SETUP':
      return { ...state, previousTab: state.activeTab, activeTab: 'Profile', showProfileSetup: true };

    case 'CLOSE_PROFILE_SETUP':
      return { ...state, showProfileSetup: false };

    case 'OPEN_WORKOUT_LOG':
      return {
        ...state,
        previousTab: state.activeTab,
        activeTab: 'WorkoutLog',
        workoutLogExercise: action.exercise,
      };

    case 'CLOSE_WORKOUT_LOG':
      return { ...state, activeTab: state.previousTab, workoutLogExercise: null };

    case 'OPEN_HEALTH_LOG':
      return { ...state, previousTab: state.activeTab, activeTab: 'HealthLog' };

    case 'CLOSE_HEALTH_LOG':
      return { ...state, activeTab: state.previousTab };

    case 'OPEN_PARTNER_REPORT':
      return { ...state, previousTab: state.activeTab, activeTab: 'PartnerReport', selectedPartnerRelationshipId: action.partnerId };

    case 'OPEN_RELATIONSHIPS':
      return { ...state, previousTab: state.activeTab, activeTab: 'Relationships' };

    case 'CLOSE_OVERLAY':
      return { ...state, activeTab: state.previousTab, profileSection: null, selectedPartnerRelationshipId: null };

    case 'SAVE_HEALTH_LOG':
      return { ...state, activeTab: state.previousTab, lastHealthLog: action.log };

    default:
      return state;
  }
}

// ── Memoized Screen Components ───────────────────────────────────────

const MemoizedDashboard = React.memo(DashboardScreen);
const MemoizedHealthScreen = React.memo(HealthScreen);
const MemoizedAIAdvisorScreen = React.memo(AIAdvisorScreen);
const MemoizedFitnessScreen = React.memo(FitnessScreen);
const MemoizedCalorieScreen = React.memo(CalorieScreen);
const MemoizedProfileScreen = React.memo(ProfileScreen);
const MemoizedProfileSetupScreen = React.memo(ProfileSetupScreen);
const MemoizedNotificationsScreen = React.memo(NotificationsScreen);
const MemoizedWorkoutLogScreen = React.memo(WorkoutLogScreen);
const MemoizedHealthLogScreen = React.memo(HealthLogScreen);
const MemoizedPartnerReportScreen = React.memo(PartnerHealthReportScreen);
const MemoizedRelationshipsScreen = React.memo(RelationshipsScreen);
const MemoizedTabBar = React.memo(TabBar);

// ── AppShell ─────────────────────────────────────────────────────────

function AppShell() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const { setForceHidden } = useScrollVisibility();
  const { session } = useAuth();
  const mountedTabs = useRef<Set<TabName>>(new Set(['Home']));
  const tabHistory = useRef<TabName[]>(['Home']);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Stable callbacks (dispatch is stable from useReducer) ──────

  const openProfile = useCallback(() => dispatch({ type: 'OPEN_PROFILE' }), []);
  const openNotifications = useCallback(() => dispatch({ type: 'OPEN_NOTIFICATIONS' }), []);
  const openProfileSetup = useCallback(() => dispatch({ type: 'OPEN_PROFILE_SETUP' }), []);
  const closeProfile = useCallback(() => dispatch({ type: 'CLOSE_OVERLAY' }), []);
  const closeNotifications = useCallback(() => dispatch({ type: 'CLOSE_OVERLAY' }), []);
  const closePartnerReport = useCallback(() => dispatch({ type: 'CLOSE_OVERLAY' }), []);
  const closeProfileSetup = useCallback(() => dispatch({ type: 'CLOSE_PROFILE_SETUP' }), []);
  const openHealthLog = useCallback(() => dispatch({ type: 'OPEN_HEALTH_LOG' }), []);
  const closeHealthLog = useCallback(() => dispatch({ type: 'CLOSE_HEALTH_LOG' }), []);
  const closeWorkoutLog = useCallback(() => dispatch({ type: 'CLOSE_WORKOUT_LOG' }), []);
  const openPartnerReport = useCallback((partnerId: string) => dispatch({ type: 'OPEN_PARTNER_REPORT', partnerId }), []);
  const openRelationships = useCallback(() => dispatch({ type: 'OPEN_RELATIONSHIPS' }), []);
  const closeRelationships = useCallback(() => dispatch({ type: 'CLOSE_OVERLAY' }), []);
  const openAppointments = useCallback(() => dispatch({ type: 'OPEN_PROFILE', section: 'reminders-appointments' }), []);

  // ── Notification tap handler ──────────────────────────────────
  const { setOnNotificationTap } = useNotifications();

  useEffect(() => {
    setOnNotificationTap((screen: string, _data?: Record<string, unknown>) => {
      // Map reminder sub-screens to profile sections
      const reminderScreens: Record<string, string> = {
        'medications': 'medications',
        'reminders-water': 'reminders-water',
        'reminders-workouts': 'reminders-workouts',
        'reminders-appointments': 'reminders-appointments',
        'reminders-sleep': 'reminders-sleep',
        'reminders-health': 'reminders-health',
      };
      if (reminderScreens[screen]) {
        dispatch({ type: 'OPEN_PROFILE', section: reminderScreens[screen] });
        return;
      }
      // Map other screens
      const screenToTab: Record<string, TabName> = {
        'Home': 'Home',
        'Health': 'Health',
        'AI': 'AI',
        'Activity': 'Activity',
        'Diet': 'Diet',
        'Profile': 'Profile',
        'Notifications': 'Notifications',
      };
      const tab = screenToTab[screen];
      if (tab) {
        dispatch({ type: 'SWITCH_TAB', tab });
      }
    });
  }, [setOnNotificationTap]);

  const openAI = useCallback((fromTab?: TabName, startInChat = true, initialQuery?: string) => {
    tabHistory.current.push('AI');
    dispatch({ type: 'OPEN_AI', from: fromTab, startInChat, initialQuery });
  }, []);

  const openWorkoutLog = useCallback((exercise: any) => {
    dispatch({ type: 'OPEN_WORKOUT_LOG', exercise });
  }, []);

  const saveHealthLog = useCallback((log: HealthLogDraft) => {
    dispatch({ type: 'SAVE_HEALTH_LOG', log });
  }, []);

  const handleTabChange = useCallback((tab: TabName) => {
    mountedTabs.current.add(tab);
    if (tab === 'AI') {
      tabHistory.current.push('AI');
      dispatch({ type: 'OPEN_AI', startInChat: false, from: undefined });
      return;
    }
    // Returning to Home clears the back history
    if (tab === 'Home') {
      tabHistory.current = ['Home'];
    } else {
      tabHistory.current.push(tab);
    }
    dispatch({ type: 'SWITCH_TAB', tab });
  }, []);

  const navigateToTab = useCallback((tab: TabName) => {
    if (tab === 'Home') {
      tabHistory.current = ['Home'];
    } else {
      tabHistory.current.push(tab);
    }
    dispatch({ type: 'SWITCH_TAB', tab });
  }, []);

  // ── Derive forceHidden from activeTab ─────────────────────────

  useEffect(() => {
    // For overlay tabs: always hide the tab bar
    // For AI tab: AIAdvisorScreen manages its own visibility (chat sub-view hides it)
    // For all other main tabs: always show the tab bar
    if (state.activeTab === 'AI') return;
    setForceHidden(OVERLAY_TABS.includes(state.activeTab));
  }, [state.activeTab, setForceHidden]);

  const { theme } = useTheme();

  // ── Status bar color per screen ────────────────────────────────

  useEffect(() => {
    if (state.activeTab === 'Home') {
      StatusBar.setBackgroundColor(theme.colors.bgHero, false);
    } else {
      StatusBar.setBackgroundColor(theme.colors.bg, false);
    }
  }, [state.activeTab, theme]);

  // ── BackHandler (single stable listener using ref) ────────────

  useEffect(() => {
    const onBack = () => {
      const s = stateRef.current;
      // Overlay tabs: close overlay (no history change — overlays are modals)
      if (OVERLAY_TABS.includes(s.activeTab)) {
        if (s.activeTab === 'WorkoutLog') {
          dispatch({ type: 'CLOSE_WORKOUT_LOG' });
        } else if (s.activeTab === 'HealthLog') {
          dispatch({ type: 'CLOSE_HEALTH_LOG' });
        } else {
          dispatch({ type: 'CLOSE_OVERLAY' });
        }
        return true;
      }
      // Main tabs: if on Home, exit app
      if (s.activeTab === 'Home') {
        return false;
      }
      // Main tabs: pop history and switch to previous
      tabHistory.current.pop();
      const prev = tabHistory.current[tabHistory.current.length - 1] ?? 'Home';
      dispatch({ type: 'SWITCH_TAB', tab: prev });
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, []); // Empty deps — reads from ref

  // ── Track mounted tabs ────────────────────────────────────────

  mountedTabs.current.add(state.activeTab);

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      <OfflineBanner />
      <View style={styles.screenContainer}>
        {MAIN_TABS.map(tab => (
          mountedTabs.current.has(tab) && (
            <View
              key={tab}
              style={[styles.screenWrapper, state.activeTab !== tab && styles.screenHidden]}>
              {tab === 'Home' && (
                <ErrorBoundary>
                  <MemoizedDashboard
                    onProfilePress={openProfile}
                    onNotificationsPress={openNotifications}
                    onCompleteProfile={openProfileSetup}
                    navigateToTab={navigateToTab}
                    onPartnerPress={openPartnerReport}
                    onRelationshipsPress={openRelationships}
                    onOpenAI={openAI}
                    onOpenAppointments={openAppointments}
                  />
                </ErrorBoundary>
              )}
              {tab === 'Health' && (
                <ErrorBoundary>
                  <MemoizedHealthScreen
                    onProfilePress={openProfile}
                    onNotificationsPress={openNotifications}
                    onOpenHealthLog={openHealthLog}
                    lastHealthLog={state.lastHealthLog}
                  />
                </ErrorBoundary>
              )}
              {tab === 'AI' && (
                <ErrorBoundary>
                  <MemoizedAIAdvisorScreen
                    onProfilePress={openProfile}
                    onNotificationsPress={openNotifications}
                    startInChat={state.aiStartInChat}
                    initialQuery={state.aiInitialQuery}
                    originTab={state.aiOrigin ?? undefined}
                    navigateToTab={navigateToTab}
                    isTabActive={state.activeTab === 'AI'}
                  />
                </ErrorBoundary>
              )}
              {tab === 'Activity' && (
                <ErrorBoundary>
                  <MemoizedFitnessScreen
                    onProfilePress={openProfile}
                    onNotificationsPress={openNotifications}
                    onOpenAI={openAI}
                    onOpenWorkoutLog={openWorkoutLog}
                  />
                </ErrorBoundary>
              )}
              {tab === 'Diet' && (
                <ErrorBoundary>
                  <MemoizedCalorieScreen
                    onProfilePress={openProfile}
                    onNotificationsPress={openNotifications}
                  />
                </ErrorBoundary>
              )}
            </View>
          )
        ))}
        {state.activeTab === 'Profile' && (
          <View style={styles.screenWrapper}>
            {state.showProfileSetup ? (
              <MemoizedProfileSetupScreen onBack={closeProfileSetup} />
            ) : (
              <MemoizedProfileScreen
                onBackPress={closeProfile}
                onCompleteProfile={openProfileSetup}
                initialSection={state.profileSection}
              />
            )}
          </View>
        )}
        {state.activeTab === 'Notifications' && (
          <View style={styles.screenWrapper}>
            <MemoizedNotificationsScreen onBackPress={closeNotifications} />
          </View>
        )}
        {state.activeTab === 'WorkoutLog' && state.workoutLogExercise && (
          <View style={styles.screenWrapper}>
            <MemoizedWorkoutLogScreen exercise={state.workoutLogExercise} onBack={closeWorkoutLog} />
          </View>
        )}
        {state.activeTab === 'HealthLog' && (
          <View style={styles.screenWrapper}>
            <MemoizedHealthLogScreen onBack={closeHealthLog} onSave={saveHealthLog} token={session?.access_token} />
          </View>
        )}
        {state.activeTab === 'PartnerReport' && (
          <View style={styles.screenWrapper}>
            <MemoizedPartnerReportScreen
              relationshipId={state.selectedPartnerRelationshipId || ''}
              onBack={closePartnerReport}
            />
          </View>
        )}
        {state.activeTab === 'Relationships' && (
          <View style={styles.screenWrapper}>
            <MemoizedRelationshipsScreen
              onBack={closeRelationships}
              onPartnerPress={openPartnerReport}
            />
          </View>
        )}
      </View>

      <MemoizedTabBar activeTab={state.activeTab} onTabChange={handleTabChange} />
    </>
  );
}

// ── Root Component ───────────────────────────────────────────────────

const RootComponent = () => {
  const { session, isLoading, hasProfile, networkError, maintenanceData, retryAfterNetworkError } = useAuth();

  if (isLoading || (session?.user && hasProfile === null)) {
    return <LoadingScreen />;
  }

  if (networkError) {
    return (
      <ErrorScreen
        type="no-internet"
        onRetry={retryAfterNetworkError}
        onGoHome={retryAfterNetworkError}
      />
    );
  }

  if (maintenanceData) {
    return (
      <ErrorScreen
        type="maintenance"
        title={maintenanceData.title}
        message={maintenanceData.message}
        estimatedReturn={maintenanceData.estimatedReturn}
      />
    );
  }

  if (!session?.user) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  if (hasProfile === false) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NetworkProvider>
      <ScrollVisibilityProvider>
        <AppShell />
      </ScrollVisibilityProvider>
    </NetworkProvider>
  );
};

const RootThemedApp = () => {
  const { theme, themeName } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <StatusBar
        barStyle={themeName === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.bgHero}
        translucent={false}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.bgHero }]}>
        <RootComponent />
      </SafeAreaView>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ReminderProvider>
              <AppointmentProvider>
                <PreferencesProvider>
                  <RootThemedApp />
                </PreferencesProvider>
              </AppointmentProvider>
            </ReminderProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgHero,
  },
  screenContainer: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  screenHidden: {
    display: 'none',
  },
});
