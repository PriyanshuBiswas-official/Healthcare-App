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
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { API_BASE_URL } from './src/config/api';
import { AuthStack } from './src/navigation/AuthStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetAllSections } from './src/services/profileCompletionService';

const Stack = createNativeStackNavigator();

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
              {tab === 'Home' && <DashboardScreen onProfilePress={openProfile} onNotificationsPress={openNotifications} /> }
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
            <ProfileScreen onBackPress={() => setActiveTab(previousTab)} />
          </View>
        )}
        {activeTab === 'Notifications' && (
          <View style={styles.screenWrapper}>
            <NotificationsScreen onBackPress={() => setActiveTab(previousTab)} />
          </View>
        )}
      </View>
      
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
}

const formatDateToISO = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

const RootComponent = () => {
  const { session, isLoading, hasProfile } = useAuth();
  const [migrationDone, setMigrationDone] = useState(false);

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

  if (isLoading || !migrationDone || (session?.user && hasProfile === null)) {
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
