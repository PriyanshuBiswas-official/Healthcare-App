import React, { useEffect, useRef, useReducer, useCallback } from 'react';
import { View, StatusBar, StyleSheet, SafeAreaView, BackHandler, ActivityIndicator } from 'react-native';
import { Colors } from './src/theme/theme';
import TabBar, { TabName } from './src/navigation/TabBar';
import { ScrollVisibilityProvider, useScrollVisibility } from './src/navigation/ScrollVisibilityContext';
import DashboardScreen from './src/screens/DashboardScreen';
import HealthScreen from './src/screens/HealthScreen';
import FitnessScreen from './src/screens/FitnessScreen';
import CalorieScreen from './src/screens/CalorieScreen';
import AIAdvisorScreen from './src/screens/AIAdvisorScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import WorkoutLogScreen from './src/screens/WorkoutLogScreen';
import HealthLogScreen, { HealthLogDraft } from './src/screens/HealthLogScreen';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { AuthStack } from './src/navigation/AuthStack';
const Stack = createNativeStackNavigator();

const MAIN_TABS: TabName[] = ['Home', 'Health', 'AI', 'Activity', 'Diet'];
const OVERLAY_TABS: TabName[] = ['Profile', 'Notifications', 'WorkoutLog', 'HealthLog'];

// ── Reducer ──────────────────────────────────────────────────────────

type AppState = {
  activeTab: TabName;
  previousTab: TabName;
  aiStartInChat: boolean;
  aiOrigin: TabName | null;
  showProfileSetup: boolean;
  workoutLogExercise: any;
  lastHealthLog: HealthLogDraft | null;
};

type AppAction =
  | { type: 'SWITCH_TAB'; tab: TabName }
  | { type: 'OPEN_AI'; from?: TabName; startInChat?: boolean }
  | { type: 'OPEN_PROFILE' }
  | { type: 'OPEN_NOTIFICATIONS' }
  | { type: 'OPEN_PROFILE_SETUP' }
  | { type: 'CLOSE_PROFILE_SETUP' }
  | { type: 'OPEN_WORKOUT_LOG'; exercise: any }
  | { type: 'CLOSE_WORKOUT_LOG' }
  | { type: 'OPEN_HEALTH_LOG' }
  | { type: 'CLOSE_HEALTH_LOG' }
  | { type: 'SAVE_HEALTH_LOG'; log: HealthLogDraft };

const INITIAL_STATE: AppState = {
  activeTab: 'Home',
  previousTab: 'Home',
  aiStartInChat: false,
  aiOrigin: null,
  showProfileSetup: false,
  workoutLogExercise: null,
  lastHealthLog: null,
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
        aiOrigin: action.from ?? state.activeTab,
        aiStartInChat: action.startInChat ?? false,
      };

    case 'OPEN_PROFILE':
      return { ...state, previousTab: state.activeTab, activeTab: 'Profile' };

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
const MemoizedTabBar = React.memo(TabBar);

// ── AppShell ─────────────────────────────────────────────────────────

function AppShell() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const { setForceHidden } = useScrollVisibility();
  const { session } = useAuth();
  const mountedTabs = useRef<Set<TabName>>(new Set(['Home']));
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Stable callbacks (dispatch is stable from useReducer) ──────

  const openProfile = useCallback(() => dispatch({ type: 'OPEN_PROFILE' }), []);
  const openNotifications = useCallback(() => dispatch({ type: 'OPEN_NOTIFICATIONS' }), []);
  const openProfileSetup = useCallback(() => dispatch({ type: 'OPEN_PROFILE_SETUP' }), []);
  const closeProfile = useCallback(() => dispatch({ type: 'SWITCH_TAB', tab: stateRef.current.previousTab }), []);
  const closeNotifications = useCallback(() => dispatch({ type: 'SWITCH_TAB', tab: stateRef.current.previousTab }), []);
  const closeProfileSetup = useCallback(() => dispatch({ type: 'CLOSE_PROFILE_SETUP' }), []);
  const openHealthLog = useCallback(() => dispatch({ type: 'OPEN_HEALTH_LOG' }), []);
  const closeHealthLog = useCallback(() => dispatch({ type: 'CLOSE_HEALTH_LOG' }), []);
  const closeWorkoutLog = useCallback(() => dispatch({ type: 'CLOSE_WORKOUT_LOG' }), []);

  const openAI = useCallback((fromTab?: TabName, startInChat = true) => {
    dispatch({ type: 'OPEN_AI', from: fromTab, startInChat });
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
      dispatch({ type: 'OPEN_AI', startInChat: false, from: undefined });
      return;
    }
    dispatch({ type: 'SWITCH_TAB', tab });
  }, []);

  const navigateToTab = useCallback((tab: TabName) => {
    dispatch({ type: 'SWITCH_TAB', tab });
  }, []);

  // ── Derive forceHidden from activeTab ─────────────────────────

  useEffect(() => {
    setForceHidden(OVERLAY_TABS.includes(state.activeTab));
  }, [state.activeTab, setForceHidden]);

  // ── BackHandler (single stable listener using ref) ────────────

  useEffect(() => {
    const onBack = () => {
      const s = stateRef.current;
      if (OVERLAY_TABS.includes(s.activeTab)) {
        if (s.activeTab === 'WorkoutLog') {
          dispatch({ type: 'CLOSE_WORKOUT_LOG' });
        } else {
          dispatch({ type: 'SWITCH_TAB', tab: s.previousTab });
        }
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, []); // Empty deps — reads from ref

  // ── Track mounted tabs ────────────────────────────────────────

  mountedTabs.current.add(state.activeTab);

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      <View style={styles.screenContainer}>
        {MAIN_TABS.map(tab => (
          mountedTabs.current.has(tab) && (
            <View
              key={tab}
              style={[styles.screenWrapper, state.activeTab !== tab && styles.screenHidden]}>
              {tab === 'Home' && (
                <MemoizedDashboard
                  onProfilePress={openProfile}
                  onNotificationsPress={openNotifications}
                  onCompleteProfile={openProfileSetup}
                />
              )}
              {tab === 'Health' && (
                <MemoizedHealthScreen
                  onProfilePress={openProfile}
                  onNotificationsPress={openNotifications}
                  onOpenHealthLog={openHealthLog}
                  lastHealthLog={state.lastHealthLog}
                />
              )}
              {tab === 'AI' && (
                <MemoizedAIAdvisorScreen
                  onProfilePress={openProfile}
                  onNotificationsPress={openNotifications}
                  startInChat={state.aiStartInChat}
                  originTab={state.aiOrigin ?? undefined}
                  navigateToTab={navigateToTab}
                  isTabActive={state.activeTab === 'AI'}
                />
              )}
              {tab === 'Activity' && (
                <MemoizedFitnessScreen
                  onProfilePress={openProfile}
                  onNotificationsPress={openNotifications}
                  onOpenAI={openAI}
                  onOpenWorkoutLog={openWorkoutLog}
                />
              )}
              {tab === 'Diet' && (
                <MemoizedCalorieScreen
                  onProfilePress={openProfile}
                  onNotificationsPress={openNotifications}
                />
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
      </View>

      <MemoizedTabBar activeTab={state.activeTab} onTabChange={handleTabChange} />
    </>
  );
}

// ── Root Component ───────────────────────────────────────────────────

const RootComponent = () => {
  const { session, isLoading, hasProfile } = useAuth();

  if (isLoading || (session?.user && hasProfile === null)) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
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
    <ScrollVisibilityProvider>
      <AppShell />
    </ScrollVisibilityProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.bg}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea}>
          <RootComponent />
        </SafeAreaView>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
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
