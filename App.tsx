import React, { useEffect, useRef, useState } from 'react';
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

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [previousTab, setPreviousTab] = useState<TabName>('Home');
  const { setForceHidden } = useScrollVisibility();
  const { session } = useAuth();
  const [aiStartInChat, setAiStartInChat] = useState(false);
  const [aiOrigin, setAiOrigin] = useState<TabName | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [workoutLogExercise, setWorkoutLogExercise] = useState<any>(null);
  const [lastHealthLog, setLastHealthLog] = useState<HealthLogDraft | null>(null);
  const mountedTabs = useRef<Set<TabName>>(new Set(['Home']));

  const openAI = (fromTab?: TabName, startInChat = true) => {
    if (activeTab !== 'AI') setPreviousTab(activeTab);
    setAiOrigin(fromTab ?? activeTab);
    setAiStartInChat(startInChat);
    mountedTabs.current.add('AI');
    setActiveTab('AI');
  };

  const handleTabChange = (tab: TabName) => {
    mountedTabs.current.add(tab);
    if (tab === 'AI') {
      setAiStartInChat(false);
      setAiOrigin(null);
      setActiveTab('AI');
      return;
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    if (activeTab !== 'Profile' && activeTab !== 'Notifications' && activeTab !== 'WorkoutLog' && activeTab !== 'HealthLog') return;
    setForceHidden(true);
    return () => setForceHidden(false);
  }, [activeTab, setForceHidden]);

  useEffect(() => {
    const onBack = () => {
      if (activeTab === 'Profile' || activeTab === 'Notifications' || activeTab === 'WorkoutLog' || activeTab === 'HealthLog') {
        setActiveTab(previousTab);
        if (activeTab === 'WorkoutLog') setWorkoutLogExercise(null);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeTab, previousTab]);

  const openProfile = () => {
    if (activeTab !== 'Profile') setPreviousTab(activeTab);
    setActiveTab('Profile');
  };

  const openNotifications = () => {
    if (activeTab !== 'Notifications') setPreviousTab(activeTab);
    setActiveTab('Notifications');
  };

  const openProfileSetup = () => {
    if (activeTab !== 'Profile') setPreviousTab(activeTab);
    setActiveTab('Profile');
    setShowProfileSetup(true);
  };

  const closeProfileSetup = () => {
    setShowProfileSetup(false);
  };

  const openWorkoutLog = (exercise: any) => {
    if (activeTab !== 'WorkoutLog') setPreviousTab(activeTab);
    setWorkoutLogExercise(exercise);
    setActiveTab('WorkoutLog');
  };

  const closeWorkoutLog = () => {
    setActiveTab(previousTab);
    setWorkoutLogExercise(null);
  };

  const openHealthLog = () => {
    if (activeTab !== 'HealthLog') setPreviousTab(activeTab);
    setActiveTab('HealthLog');
  };

  const closeHealthLog = () => {
    setActiveTab(previousTab);
  };

  const saveHealthLog = (log: HealthLogDraft) => {
    setLastHealthLog(log);
    setActiveTab(previousTab);
  };

  return (
    <>
      <View style={styles.screenContainer}>
        {MAIN_TABS.map(tab => (
          mountedTabs.current.has(tab) && (
            <View
              key={tab}
              style={[styles.screenWrapper, activeTab !== tab && styles.screenHidden]}>
              {tab === 'Home' && <DashboardScreen onProfilePress={openProfile} onNotificationsPress={openNotifications} onCompleteProfile={openProfileSetup} /> }
              {tab === 'Health' && (
                <HealthScreen
                  onProfilePress={openProfile}
                  onNotificationsPress={openNotifications}
                  onOpenHealthLog={openHealthLog}
                  lastHealthLog={lastHealthLog}
                />
              )}
              {tab === 'AI' && (
                <AIAdvisorScreen
                  onProfilePress={openProfile}
                  onNotificationsPress={openNotifications}
                  startInChat={aiStartInChat}
                  originTab={aiOrigin ?? undefined}
                  navigateToTab={(t: TabName) => setActiveTab(t)}
                  isTabActive={activeTab === 'AI'}
                />
              )}
              {tab === 'Activity' && <FitnessScreen onProfilePress={openProfile} onNotificationsPress={openNotifications} onOpenAI={(from?: TabName) => openAI(from)} onOpenWorkoutLog={openWorkoutLog} />}
              {tab === 'Diet' && <CalorieScreen onProfilePress={openProfile} onNotificationsPress={openNotifications} />}
            </View>
          )
        ))}
        {activeTab === 'Profile' && (
          <View style={styles.screenWrapper}>
            {showProfileSetup ? (
              <ProfileSetupScreen onBack={closeProfileSetup} />
            ) : (
              <ProfileScreen onBackPress={() => setActiveTab(previousTab)} onCompleteProfile={openProfileSetup} />
            )}
          </View>
        )}
        {activeTab === 'Notifications' && (
          <View style={styles.screenWrapper}>
            <NotificationsScreen onBackPress={() => setActiveTab(previousTab)} />
          </View>
        )}
        {activeTab === 'WorkoutLog' && workoutLogExercise && (
          <View style={styles.screenWrapper}>
            <WorkoutLogScreen exercise={workoutLogExercise} onBack={closeWorkoutLog} />
          </View>
        )}
        {activeTab === 'HealthLog' && (
          <View style={styles.screenWrapper}>
            <HealthLogScreen onBack={closeHealthLog} onSave={saveHealthLog} token={session?.access_token} />
          </View>
        )}
      </View>
      
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
}

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
