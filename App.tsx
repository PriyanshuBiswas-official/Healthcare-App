import React, { useEffect, useState } from 'react';
import { View, StatusBar, StyleSheet, SafeAreaView } from 'react-native';
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

  useEffect(() => {
    if (activeTab !== 'Profile') return;
    setForceHidden(true);
    return () => setForceHidden(false);
  }, [activeTab, setForceHidden]);

  const openProfile = () => {
    if (activeTab !== 'Profile') setPreviousTab(activeTab);
    setActiveTab('Profile');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home': return <DashboardScreen onProfilePress={openProfile} />;
      case 'Health': return <HealthScreen onProfilePress={openProfile} />;
      case 'AI': return <AIAdvisorScreen onProfilePress={openProfile} />;
      case 'Activity': return <FitnessScreen onProfilePress={openProfile} />;
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
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
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
