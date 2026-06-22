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
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { NavigationContainer } from '@react-navigation/native';
import { API_BASE_URL } from './src/config/api';
import { AuthStack } from './src/navigation/AuthStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveSection, resetAllSections } from './src/services/profileCompletionService';

const PROFILE_DATA_VERSION = 2;
const PROFILE_VERSION_KEY = '@profile_data_version';

const MAIN_TABS: TabName[] = ['Home', 'Health', 'AI', 'Activity', 'Diet'];

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [previousTab, setPreviousTab] = useState<TabName>('Home');
  const { setForceHidden } = useScrollVisibility();
  const [aiStartInChat, setAiStartInChat] = useState(false);
  const [aiOrigin, setAiOrigin] = useState<TabName | null>(null);
  const mountedTabs = useRef<Set<TabName>>(new Set(['Home']));
  const [showProfileSetup, setShowProfileSetup] = useState(false);

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
    if (activeTab !== 'Profile' && activeTab !== 'Notifications') return;
    setForceHidden(true);
    return () => setForceHidden(false);
  }, [activeTab, setForceHidden]);

  useEffect(() => {
    const onBack = () => {
      if (activeTab === 'Profile' || activeTab === 'Notifications') {
        setActiveTab(previousTab);
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

  return (
    <>
      <View style={styles.screenContainer}>
        {MAIN_TABS.map(tab => (
          mountedTabs.current.has(tab) && (
            <View
              key={tab}
              style={[styles.screenWrapper, activeTab !== tab && styles.screenHidden]}>
              {tab === 'Home' && <DashboardScreen onProfilePress={openProfile} onNotificationsPress={openNotifications} onOpenProfileSetup={() => setShowProfileSetup(true)} />}
              {tab === 'Health' && <HealthScreen onProfilePress={openProfile} onNotificationsPress={openNotifications} />}
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
              {tab === 'Activity' && <FitnessScreen onProfilePress={openProfile} onNotificationsPress={openNotifications} onOpenAI={(from?: TabName) => openAI(from)} />}
              {tab === 'Diet' && <CalorieScreen onProfilePress={openProfile} onNotificationsPress={openNotifications} />}
            </View>
          )
        ))}
        {activeTab === 'Profile' && (
          <View style={styles.screenWrapper}>
            <ProfileScreen onBackPress={() => setActiveTab(previousTab)} onOpenProfileSetup={() => setShowProfileSetup(true)} />
          </View>
        )}
        {activeTab === 'Notifications' && (
          <View style={styles.screenWrapper}>
            <NotificationsScreen onBackPress={() => setActiveTab(previousTab)} />
          </View>
        )}
      </View>
      {showProfileSetup && (
        <View style={[styles.screenWrapper, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }]}>
          <ProfileSetupScreen onComplete={() => setShowProfileSetup(false)} />
        </View>
      )}
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
}

const RootComponent = () => {
  const { session, isLoading } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const syncAttempted = useRef(false);

  useEffect(() => {
    (async () => {
      const version = await AsyncStorage.getItem(PROFILE_VERSION_KEY);
      if (version !== String(PROFILE_DATA_VERSION)) {
        await resetAllSections();
        await AsyncStorage.setItem(PROFILE_VERSION_KEY, String(PROFILE_DATA_VERSION));
      }
      setMigrationDone(true);
    })();
  }, []);

  useEffect(() => {
    const syncOnboarding = async () => {
      if (!session?.user || !session?.access_token) return;
      if (syncAttempted.current) return;

      const onboardingJson = await AsyncStorage.getItem('@onboarding_data');
      if (!onboardingJson) return;

      syncAttempted.current = true;
      setSyncing(true);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const data = JSON.parse(onboardingJson);
        const response = await fetch(`${API_BASE_URL}/api/profile/setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: session.user.email || '',
            dateOfBirth: data.dateOfBirth || '',
            gender: data.gender?.toLowerCase() || 'other',
            heightCm: parseFloat(data.height) || 0,
            weightKg: parseFloat(data.weight) || 0,
            units: 'metric',
            goals: data.goals || [],
            primaryGoal: data.primaryGoal || '',
            displayName: session.user.email ? session.user.email.split('@')[0] : 'User',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          await saveSection('basic_info', {
            dateOfBirth: data.dateOfBirth ?? '',
            gender: data.gender ?? '',
            height: data.height ?? '',
            weight: data.weight ?? '',
            goals: data.goals ?? [],
            primaryGoal: data.primaryGoal ?? '',
          });
          await AsyncStorage.removeItem('@onboarding_data');
        } else {
          console.warn('[App] Profile sync failed:', response.status, await response.text());
          syncAttempted.current = false;
        }
      } catch (err: any) {
        clearTimeout(timeout);
        if (err?.name === 'AbortError' || err?.message?.includes('Network request failed')) {
          console.warn('[App] Profile sync: server unreachable, will retry next launch');
        } else {
          console.warn('[App] Profile sync error:', err);
        }
        syncAttempted.current = false;
      } finally {
        setSyncing(false);
      }
    };

    syncOnboarding();
  }, [session]);

  if (isLoading || syncing || !migrationDone) {
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
