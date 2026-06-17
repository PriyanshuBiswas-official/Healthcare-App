import React, { useEffect, useRef, useState } from 'react';
import { View, StatusBar, StyleSheet, SafeAreaView, BackHandler } from 'react-native';
import { Colors } from './src/theme/theme';
import TabBar, { TabName } from './src/navigation/TabBar';
import { ScrollVisibilityProvider, useScrollVisibility } from './src/navigation/ScrollVisibilityContext';
import DashboardScreen from './src/screens/DashboardScreen';
import HealthScreen from './src/screens/HealthScreen';
import FitnessScreen from './src/screens/FitnessScreen';
import CalorieScreen from './src/screens/CalorieScreen';
import AIAdvisorScreen from './src/screens/AIAdvisorScreen';
import ProfileScreen from './src/screens/ProfileScreen';

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
    if (activeTab !== 'Profile') return;
    setForceHidden(true);
    return () => setForceHidden(false);
  }, [activeTab, setForceHidden]);

  useEffect(() => {
    const onBack = () => {
      if (activeTab === 'Profile') {
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

  return (
    <>
      <View style={styles.screenContainer}>
        {MAIN_TABS.map(tab => (
          mountedTabs.current.has(tab) && (
            <View
              key={tab}
              style={[styles.screenWrapper, activeTab !== tab && styles.screenHidden]}>
              {tab === 'Home' && <DashboardScreen onProfilePress={openProfile} />}
              {tab === 'Health' && <HealthScreen onProfilePress={openProfile} />}
              {tab === 'AI' && (
                <AIAdvisorScreen
                  onProfilePress={openProfile}
                  startInChat={aiStartInChat}
                  originTab={aiOrigin ?? undefined}
                  navigateToTab={(t: TabName) => setActiveTab(t)}
                  isTabActive={activeTab === 'AI'}
                />
              )}
              {tab === 'Activity' && <FitnessScreen onProfilePress={openProfile} onOpenAI={(from?: TabName) => openAI(from)} />}
              {tab === 'Diet' && <CalorieScreen onProfilePress={openProfile} />}
            </View>
          )
        ))}
        {activeTab === 'Profile' && (
          <View style={styles.screenWrapper}>
            <ProfileScreen onBackPress={() => setActiveTab(previousTab)} />
          </View>
        )}
      </View>
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
}

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.bg}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollVisibilityProvider>
          <AppShell />
        </ScrollVisibilityProvider>
      </SafeAreaView>
    </View>
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
