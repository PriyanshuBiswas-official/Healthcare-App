import React, { useEffect, useRef, useReducer, useCallback, useState } from 'react';
import { View, StatusBar, StyleSheet, SafeAreaView, BackHandler, KeyboardAvoidingView, Platform, TouchableOpacity, Text, Modal, ActivityIndicator } from 'react-native';
import TabBar, { TabName } from './src/navigation/TabBar';
import { ScrollVisibilityProvider, useScrollVisibility } from './src/navigation/ScrollVisibilityContext';
import DashboardScreen from './src/screens/home/DashboardScreen';
import HealthScreen from './src/screens/health/HealthScreen';
import FitnessScreen from './src/screens/fitness/FitnessScreen';
import CalorieScreen from './src/screens/diet/CalorieScreen';
import AIAdvisorScreen from './src/screens/ai/AIAdvisorScreen';
import AIChatView, { useChatState } from './src/screens/ai/AIChatView';
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
import { ArrowLeft, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { ChatAttachment } from './src/services/aiApi';
const Stack = createNativeStackNavigator();

const MAIN_TABS: TabName[] = ['Home', 'Health', 'AI', 'Activity', 'Diet'];
const OVERLAY_TABS: TabName[] = ['Profile', 'Notifications', 'WorkoutLog', 'HealthLog', 'PartnerReport', 'Relationships'];

const OCR_PROMPT = `Please analyze this medical document image. Extract all visible text and provide:
1. A clear transcription of all text found
2. An explanation of what this document contains
3. Health insights or recommendations based on the information

If this is a prescription: list all medications with dosages and instructions.
If this is a lab report: explain each value and whether it's within normal range.
If this is an insurance document: summarize key coverage details.`;

// ── Reducer ──────────────────────────────────────────────────────────

type AppState = {
  activeTab: TabName;
  previousTab: TabName;
  aiStartInChat: boolean;
  aiOrigin: TabName | null;
  aiInitialQuery: string;
  aiChatVisible: boolean;
  showProfileSetup: boolean;
  profileSection: string | null;
  workoutLogExercise: any;
  lastHealthLog: HealthLogDraft | null;
  selectedPartnerRelationshipId: string | null;
};

type AppAction =
  | { type: 'SWITCH_TAB'; tab: TabName }
  | { type: 'OPEN_AI'; from?: TabName; startInChat?: boolean; initialQuery?: string }
  | { type: 'OPEN_AI_CHAT'; from?: TabName; initialQuery?: string }
  | { type: 'CLOSE_AI_CHAT' }
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
  aiChatVisible: false,
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
      // startInChat=true → open as overlay (no tab switch, instant)
      if (action.startInChat) {
        return {
          ...state,
          aiChatVisible: true,
          aiOrigin: action.from !== undefined ? action.from : null,
          aiInitialQuery: action.initialQuery ?? '',
        };
      }
      // startInChat=false → switch to AI tab (overview mode)
      return {
        ...state,
        previousTab: state.activeTab,
        activeTab: 'AI',
        aiOrigin: action.from !== undefined ? action.from : null,
        aiStartInChat: false,
        aiInitialQuery: '',
      };

    case 'OPEN_AI_CHAT':
      return {
        ...state,
        aiChatVisible: true,
        aiOrigin: action.from !== undefined ? action.from : null,
        aiInitialQuery: action.initialQuery ?? '',
      };

    case 'CLOSE_AI_CHAT':
      return {
        ...state,
        aiChatVisible: false,
        aiInitialQuery: '',
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
const MemoizedAIChatView = React.memo(AIChatView);
const MemoizedFitnessScreen = React.memo(FitnessScreen);
const MemoizedCalorieScreen = React.memo(CalorieScreen);
const MemoizedProfileScreen = React.memo(ProfileScreen);
const MemoizedProfileSetupScreen = React.memo(ProfileSetupScreen);
const MemoizedNotificationsScreen = React.memo(NotificationsScreen);
const MemoizedWorkoutLogScreen = React.memo(WorkoutLogScreen);
const MemoizedHealthLogScreen = React.memo(HealthLogScreen);
const MemoizedPartnerReportScreen = React.memo(PartnerHealthReportScreen);
const MemoizedRelationshipsScreen = React.memo(RelationshipsScreen);
// ── AppShell ─────────────────────────────────────────────────────────

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// ── AppShell Navigation Setup ─────────────────────────────────────────

function TabNavigator({ route }: any) {
  const { theme } = useTheme();
  
  // Extract callbacks passed from AppShell
  const {
    openProfile,
    openNotifications,
    openProfileSetup,
    navigateToTab,
    openPartnerReport,
    openRelationships,
    openAI,
    openAppointments,
    openHealthLog,
    setPendingAttachments,
    setInput,
    setOcrLoading,
    openOCR,
    lastHealthLog,
  } = route.params;

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Home">
      <Tab.Screen name="Home">
        {(props) => (
          <ErrorBoundary>
            <MemoizedDashboard
              {...props}
              onProfilePress={openProfile}
              onNotificationsPress={openNotifications}
              onCompleteProfile={openProfileSetup}
              navigateToTab={navigateToTab}
              onPartnerPress={openPartnerReport}
              onRelationshipsPress={openRelationships}
              onOpenAI={openAI}
              onOpenAppointments={openAppointments}
              onOpenHealthLog={openHealthLog}
              onCaptureImage={(att) => {
                setPendingAttachments([att]);
                setInput('Analyze this health image');
                setOcrLoading(true);
                openAI('Home', true);
              }}
            />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="Health">
        {(props) => (
          <ErrorBoundary>
            <MemoizedHealthScreen
              {...props}
              onProfilePress={openProfile}
              onNotificationsPress={openNotifications}
              onOpenHealthLog={openHealthLog}
              lastHealthLog={lastHealthLog}
            />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="AI">
        {(props) => (
          <ErrorBoundary>
            <MemoizedAIAdvisorScreen
              {...props}
              onProfilePress={openProfile}
              onNotificationsPress={openNotifications}
              isTabActive={props.navigation.isFocused()}
              onOpenChat={() => openAI(undefined, true, '')}
              onOpenOCR={openOCR}
            />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="Diet">
        {(props) => (
          <ErrorBoundary>
            <MemoizedCalorieScreen
              {...props}
              onProfilePress={openProfile}
              onNotificationsPress={openNotifications}
            />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen name="Activity">
        {(props) => (
          <ErrorBoundary>
            <MemoizedFitnessScreen
              {...props}
              onProfilePress={openProfile}
              onNotificationsPress={openNotifications}
              onOpenAI={openAI}
              onOpenWorkoutLog={(ex: any) => props.navigation.navigate('WorkoutLog', { exercise: ex })}
            />
          </ErrorBoundary>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppShell() {
  const { setForceHidden } = useScrollVisibility();
  const { session } = useAuth();
  
  // Local state for last health log (previously inside reducer)
  const [lastHealthLog, setLastHealthLog] = useState<HealthLogDraft | null>(null);

  // ── Chat state (lifted to App level for overlay) ─────────────
  const {
    messages, input, setInput, isThinking, sendMessage, retryLastMessage, scrollRef,
    conversationId, conversations, archivedConversations, loadingConversations,
    loadConversations, loadArchivedConversations, loadConversation, startNewChat,
    handleDeleteConversation, handlePinConversation, handleArchiveConversation, handleUnarchiveConversation,
    pendingAttachments, setPendingAttachments,
  } = useChatState();

  const [aiChatVisible, setAiChatVisible] = useState(false);
  const [aiOrigin, setAiOrigin] = useState<TabName | null>(null);
  const [aiInitialQuery, setAiInitialQuery] = useState('');

  // ── Notification tap handler ──────────────────────────────────
  const { setOnNotificationTap } = useNotifications();

  // Navigation reference helper since AppShell now contains Stack
  const navRef = useRef<any>(null);

  useEffect(() => {
    setOnNotificationTap((screen: string, _data?: Record<string, unknown>) => {
      const reminderScreens: Record<string, string> = {
        'medications': 'medications',
        'reminders-water': 'reminders-water',
        'reminders-workouts': 'reminders-workouts',
        'reminders-appointments': 'reminders-appointments',
        'reminders-sleep': 'reminders-sleep',
        'reminders-health': 'reminders-health',
      };
      if (reminderScreens[screen] && navRef.current) {
        navRef.current.navigate('Profile', { initialSection: reminderScreens[screen] });
        return;
      }
      const screenToTab: Record<string, string> = {
        'Home': 'Home',
        'Health': 'Health',
        'AI': 'AI',
        'Activity': 'Activity',
        'Diet': 'Diet',
      };
      if (screenToTab[screen] && navRef.current) {
        navRef.current.navigate(screenToTab[screen]);
      }
    });
  }, [setOnNotificationTap]);

  const openAI = useCallback((fromTab?: TabName, startInChat = true, initialQuery?: string) => {
    if (startInChat) {
      setAiOrigin(fromTab ?? null);
      setAiInitialQuery(initialQuery ?? '');
      setAiChatVisible(true);
    } else if (navRef.current) {
      navRef.current.navigate('AI');
    }
  }, []);

  // ── OCR state ────────────────────────────────────────────────
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  useEffect(() => {
    if (aiChatVisible && ocrLoading) {
      setOcrLoading(false);
    }
  }, [aiChatVisible, ocrLoading]);

  const openOCR = useCallback(() => {
    setShowOCRModal(true);
  }, []);

  const handleOCRImageSelected = useCallback((attachment: ChatAttachment) => {
    setPendingAttachments([attachment]);
    setInput(OCR_PROMPT);
    setShowOCRModal(false);
    openAI('AI', true);
  }, [openAI, setPendingAttachments, setInput]);

  const handleOCRCameraSelected = useCallback(async () => {
    setShowOCRModal(false);
    try {
      const { PermissionsAndroid } = require('react-native');
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          { title: 'Camera Permission', message: 'App needs access to your camera', buttonPositive: 'OK' },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      setOcrLoading(true);
      const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
      if (result.didCancel || result.errorCode || !result.assets?.[0]) {
        setOcrLoading(false);
        return;
      }
      const a = result.assets[0];
      handleOCRImageSelected({ uri: a.uri || '', type: a.type || 'image/jpeg', name: a.fileName || 'photo.jpg' });
    } catch (e: any) {
      setOcrLoading(false);
      console.warn('[OCR] Camera:', e.message);
    }
  }, [handleOCRImageSelected]);

  // Set up callbacks to pass down to screens
  const openProfile = useCallback(() => navRef.current?.navigate('Profile'), []);
  const openNotifications = useCallback(() => navRef.current?.navigate('Notifications'), []);
  const openProfileSetup = useCallback(() => navRef.current?.navigate('ProfileSetup'), []);
  const navigateToTab = useCallback((tab: TabName) => navRef.current?.navigate(tab), []);
  const openPartnerReport = useCallback((partnerId: string) => navRef.current?.navigate('PartnerReport', { partnerId }), []);
  const openRelationships = useCallback(() => navRef.current?.navigate('Relationships'), []);
  const openAppointments = useCallback(() => navRef.current?.navigate('Profile', { initialSection: 'reminders-appointments' }), []);
  const openHealthLog = useCallback(() => navRef.current?.navigate('HealthLog'), []);

  // Sync force hidden based on route and ai chat overlay visibility
  const handleStateChange = () => {
    if (!navRef.current) return;
    const currentRoute = navRef.current.getCurrentRoute();
    const currentName = currentRoute?.name;
    const isOverlay = ['Profile', 'Notifications', 'WorkoutLog', 'HealthLog', 'PartnerReport', 'Relationships', 'ProfileSetup'].includes(currentName);
    setForceHidden(aiChatVisible || isOverlay);
  };

  useEffect(() => {
    setForceHidden(aiChatVisible);
  }, [aiChatVisible, setForceHidden]);

  const { theme } = useTheme();

  return (
    <>
      <OfflineBanner />
      <View style={styles.screenContainer}>
        <NavigationContainer ref={navRef} onStateChange={handleStateChange} independent>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen 
              name="Main" 
              component={TabNavigator} 
              initialParams={{
                openProfile,
                openNotifications,
                openProfileSetup,
                navigateToTab,
                openPartnerReport,
                openRelationships,
                openAI,
                openAppointments,
                openHealthLog,
                setPendingAttachments,
                setInput,
                setOcrLoading,
                openOCR,
                lastHealthLog,
              }}
            />
            <RootStack.Screen name="Profile">
              {(props) => (
                <MemoizedProfileScreen 
                  onBackPress={() => props.navigation.goBack()} 
                  onCompleteProfile={() => props.navigation.navigate('ProfileSetup')}
                  initialSection={props.route.params?.initialSection}
                />
              )}
            </RootStack.Screen>
            <RootStack.Screen name="ProfileSetup">
              {(props) => (
                <MemoizedProfileSetupScreen onBack={() => props.navigation.goBack()} />
              )}
            </RootStack.Screen>
            <RootStack.Screen name="Notifications">
              {(props) => (
                <MemoizedNotificationsScreen onBackPress={() => props.navigation.goBack()} />
              )}
            </RootStack.Screen>
            <RootStack.Screen name="WorkoutLog">
              {(props) => (
                <MemoizedWorkoutLogScreen 
                  exercise={props.route.params?.exercise} 
                  onBack={() => props.navigation.goBack()} 
                />
              )}
            </RootStack.Screen>
            <RootStack.Screen name="HealthLog">
              {(props) => (
                <MemoizedHealthLogScreen 
                  onBack={() => props.navigation.goBack()} 
                  onSave={(log) => {
                    setLastHealthLog(log);
                    props.navigation.goBack();
                  }} 
                  token={session?.access_token} 
                />
              )}
            </RootStack.Screen>
            <RootStack.Screen name="PartnerReport">
              {(props) => (
                <MemoizedPartnerReportScreen 
                  relationshipId={props.route.params?.partnerId || ''} 
                  onBack={() => props.navigation.goBack()} 
                />
              )}
            </RootStack.Screen>
            <RootStack.Screen name="Relationships">
              {(props) => (
                <MemoizedRelationshipsScreen 
                  onBack={() => props.navigation.goBack()} 
                  onPartnerPress={(partnerId) => props.navigation.navigate('PartnerReport', { partnerId })} 
                />
              )}
            </RootStack.Screen>
          </RootStack.Navigator>
        </NavigationContainer>

        {aiChatVisible && (
          <View style={styles.overlayWrapper}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={0}>
              <MemoizedAIChatView
                messages={messages}
                input={input}
                setInput={setInput}
                isThinking={isThinking}
                sendMessage={sendMessage}
                retryLastMessage={retryLastMessage}
                scrollRef={scrollRef}
                initialQuery={aiInitialQuery}
                autoFocus
                onBack={() => setAiChatVisible(false)}
                originTab={aiOrigin ?? undefined}
                navigateToTab={navigateToTab}
                conversationId={conversationId}
                conversations={conversations}
                archivedConversations={archivedConversations}
                loadingConversations={loadingConversations}
                loadConversations={loadConversations}
                loadArchivedConversations={loadArchivedConversations}
                loadConversation={loadConversation}
                startNewChat={startNewChat}
                handleDeleteConversation={handleDeleteConversation}
                handlePinConversation={handlePinConversation}
                handleArchiveConversation={handleArchiveConversation}
                handleUnarchiveConversation={handleUnarchiveConversation}
                pendingAttachments={pendingAttachments}
                setPendingAttachments={setPendingAttachments}
              />
            </KeyboardAvoidingView>
          </View>
        )}
      </View>

      {/* OCR Loading Overlay */}
      {ocrLoading && (
        <View style={styles.ocrLoadingOverlay}>
          <View style={styles.ocrLoadingBox}>
            <ActivityIndicator size="large" color="#6B8AFF" />
            <Text style={styles.ocrLoadingText}>Preparing your image...</Text>
          </View>
        </View>
      )}

      {/* OCR Modal */}
      <Modal visible={showOCRModal} transparent animationType="fade" onRequestClose={() => setShowOCRModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowOCRModal(false)} style={styles.ocrModalOverlay}>
          <TouchableOpacity activeOpacity={1} onPress={() => { }} style={styles.ocrModalContent}>
            <Text style={styles.ocrModalTitle}>Scan Document</Text>
            <Text style={styles.ocrModalSub}>Choose how to provide the document</Text>

            <TouchableOpacity style={styles.ocrModalOption} onPress={handleOCRCameraSelected} activeOpacity={0.7}>
              <View style={[styles.ocrModalIcon, { backgroundColor: '#3B82F620' }]}>
                <Camera size={24} color="#3B82F6" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ocrModalOptionTitle}>Take Photo</Text>
                <Text style={styles.ocrModalOptionDesc}>Use camera to capture document</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ocrModalOption}
              onPress={() => {
                setShowOCRModal(false);
                setOcrLoading(true);
                launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (result) => {
                  if (result.didCancel || result.errorCode || !result.assets?.[0]) {
                    setOcrLoading(false);
                    return;
                  }
                  const a = result.assets[0];
                  handleOCRImageSelected({ uri: a.uri || '', type: a.type || 'image/jpeg', name: a.fileName || 'photo.jpg' });
                });
              }}
              activeOpacity={0.7}>
              <View style={[styles.ocrModalIcon, { backgroundColor: '#10B98120' }]}>
                <ImageIcon size={24} color="#10B981" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ocrModalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.ocrModalOptionDesc}>Select an existing photo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ocrModalCancel} onPress={() => setShowOCRModal(false)}>
              <Text style={styles.ocrModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  },
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  overlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
  screenHidden: {
    display: 'none',
  },
  ocrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ocrModalContent: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  ocrModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ocrModalSub: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  ocrModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  ocrModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ocrModalOptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  ocrModalOptionDesc: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  ocrModalCancel: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  ocrModalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#999',
  },
  ocrLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 999,
  },
  ocrLoadingBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  ocrLoadingText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#CCC',
  },
});
