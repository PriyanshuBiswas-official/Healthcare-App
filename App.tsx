import React, { useEffect, useState } from 'react';
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

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [previousTab, setPreviousTab] = useState<TabName>('Home');
  const { setForceHidden } = useScrollVisibility();
  const [aiStartInChat, setAiStartInChat] = useState(false);
  const [aiOrigin, setAiOrigin] = useState<TabName | null>(null);

  const openAI = (fromTab?: TabName, startInChat = true) => {
    if (activeTab !== 'AI') setPreviousTab(activeTab);
    setAiOrigin(fromTab ?? activeTab);
    setAiStartInChat(startInChat);
    setActiveTab('AI');
  };

  const handleTabChange = (tab: TabName) => {
    // If user taps the AI tab directly, ensure it opens in overview mode
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

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home': return <DashboardScreen onProfilePress={openProfile} />;
      case 'Health': return <HealthScreen onProfilePress={openProfile} />;
      case 'AI': return <AIAdvisorScreen onProfilePress={openProfile} startInChat={aiStartInChat} originTab={aiOrigin ?? undefined} navigateToTab={(t: TabName) => setActiveTab(t)} />;
      case 'Activity': return <FitnessScreen onProfilePress={openProfile} onOpenAI={(from?: TabName) => openAI(from)} />;
      case 'Diet': return <CalorieScreen onProfilePress={openProfile} />;
      case 'Profile': return <ProfileScreen onBackPress={() => setActiveTab(previousTab)} />;
      default: return <DashboardScreen onProfilePress={openProfile} />;
    }
  };

  return (
    <>
      <View style={styles.screenContainer}>
        {renderScreen()}
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
});
