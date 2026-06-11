import React, { useState } from 'react';
import { View, StatusBar, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from './src/theme/theme';
import TabBar, { TabName } from './src/navigation/TabBar';
import DashboardScreen from './src/screens/DashboardScreen';
import HealthScreen from './src/screens/HealthScreen';
import FitnessScreen from './src/screens/FitnessScreen';
import CalorieScreen from './src/screens/CalorieScreen';
import AIAdvisorScreen from './src/screens/AIAdvisorScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('Dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard': return <DashboardScreen />;
      case 'Health':     return <HealthScreen />;
      case 'Activity':   return <FitnessScreen />;
      case 'Nutrition': return <CalorieScreen />;
      case 'AI':        return <AIAdvisorScreen />;
      default:          return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.bg}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screenContainer}>
          {renderScreen()}
        </View>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
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
